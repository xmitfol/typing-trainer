"""F2-GATE — admin billing (subscriptions + refund) на реальном стеке.

Гоняется ВНУТРИ backend-контейнера (реальные Postgres/Redis):

    docker exec tt_backend python scripts/verify_admin_billing.py

Использует httpx ASGITransport против app (cookies минтим через
create_access_token — обходим captcha/signin). Проверяет:
  - grant → active/manual/no-renew, has_active_subscription, paywall allowed
  - refund на stub → refund_id, charge 'refunded', идемпотентность повтора, audit
  - RBAC/reauth: support→refund 403; superadmin без reauth→403;
    superadmin с one-time токеном→200, повтор того же токена→403; cancel support→200
  - list/detail + charge-лог

Печатает [PASS]/[FAIL] по пунктам + итог. Exit 0 только если всё PASS.
"""

import asyncio
import sys
import uuid

import httpx
from sqlalchemy import select, text

from app.core.db import dispose_engine, get_sessionmaker
from app.core.redis import get_redis
from app.core.security import create_access_token, hash_password
from app.deps import REAUTH_PREFIX
from app.main import app
from app.models.subscription import Subscription, SubscriptionCharge
from app.models.user import User

RESULTS: list[tuple[bool, str]] = []


def check(cond: bool, label: str, extra: str = "") -> bool:
    RESULTS.append((bool(cond), label + (f" — {extra}" if extra else "")))
    print(f"[{'PASS' if cond else 'FAIL'}] {label}{(' — ' + extra) if extra else ''}")
    return bool(cond)


def cookies_for(user_id) -> dict:
    tok, _ = create_access_token(user_id)
    return {"access_token": tok}


async def mk_user(session, *, role: str, with_pw: str | None = None) -> User:
    u = User(
        email=f"gate_{role}_{uuid.uuid4().hex[:8]}@example.com",
        name=f"gate-{role}",
        audience="adult",
        character="anna",
        language="ru",
        role=role,
        email_verified=True,
        password_hash=hash_password(with_pw) if with_pw else None,
    )
    session.add(u)
    await session.flush()
    return u


async def main() -> int:
    factory = get_sessionmaker()
    redis = get_redis()
    transport = httpx.ASGITransport(app=app)

    async with factory() as session:
        support = await mk_user(session, role="support")
        superadmin = await mk_user(session, role="superadmin", with_pw="Sup3rPass!")
        target = await mk_user(session, role="user")
        await session.commit()
        support_id, super_id, target_id = support.id, superadmin.id, target.id

    base = "http://gate"
    async with httpx.AsyncClient(transport=transport, base_url=base) as client:

        # ── grant (support) ────────────────────────────────────────────
        r = await client.post(
            "/api/v1/admin/subscriptions/grant",
            cookies=cookies_for(support_id),
            json={"user_id": str(target_id), "plan": "pro", "period": "m1",
                  "reason": "gate grant"},
        )
        check(r.status_code == 200, "grant support → 200", f"got {r.status_code} {r.text[:160]}")
        granted_sub_id = r.json().get("subscription_id") if r.status_code == 200 else None

        # DB assertions on granted sub
        async with factory() as s:
            sub = (await s.execute(
                select(Subscription).where(Subscription.user_id == target_id)
                .order_by(Subscription.created_at.desc()).limit(1)
            )).scalar_one_or_none()
        check(sub is not None and sub.status == "active", "grant → status active",
              f"status={getattr(sub,'status',None)}")
        check(sub is not None and sub.provider == "manual", "grant → provider manual",
              f"provider={getattr(sub,'provider',None)}")
        check(sub is not None and sub.is_auto_renew is False, "grant → is_auto_renew False",
              f"auto_renew={getattr(sub,'is_auto_renew',None)}")
        check(sub is not None and sub.payment_method_id is None, "grant → payment_method_id None")

        # paywall: lesson 6 access after grant
        r = await client.get(f"/api/v1/lessons/tier1/6/access", cookies=cookies_for(target_id))
        allowed = r.status_code == 200 and r.json().get("allowed") is True
        check(allowed, "paywall lesson6 access → allowed after grant",
              f"{r.status_code} {r.text[:120]}")

        # ── set up a real checkout-based sub for refund (needs payment_id) ──
        # StubProvider create_checkout → active via billing_service webhook path.
        # Проще: создадим подписку с yookassa_payment_id напрямую (checkout уже
        # покрыт billing-gate). refund зависит только от provider_payment_id.
        pay_id = f"stub_{uuid.uuid4().hex[:20]}"
        async with factory() as s:
            paid = Subscription(
                user_id=target_id, plan="pro", period="m1", status="active",
                provider="stub", amount_kopecks=49000, currency="RUB",
                is_auto_renew=True, yookassa_payment_id=pay_id,
            )
            s.add(paid)
            await s.flush()
            paid_id = paid.id
            await s.commit()

        # ── RBAC: support → refund 403 ADMIN_FORBIDDEN ─────────────────
        r = await client.post(
            f"/api/v1/admin/subscriptions/{paid_id}/refund",
            cookies=cookies_for(support_id),
            json={"reason": "x"},
        )
        code = (r.json().get("detail", {}) or {}).get("code") if r.headers.get("content-type","").startswith("application/json") else None
        check(r.status_code == 403 and code == "ADMIN_FORBIDDEN",
              "support → refund 403 ADMIN_FORBIDDEN", f"{r.status_code} code={code}")

        # ── superadmin WITHOUT reauth → 403 REAUTH_REQUIRED ────────────
        r = await client.post(
            f"/api/v1/admin/subscriptions/{paid_id}/refund",
            cookies=cookies_for(super_id),
            json={"reason": "x"},
        )
        code = (r.json().get("detail", {}) or {}).get("code")
        check(r.status_code == 403 and code == "REAUTH_REQUIRED",
              "superadmin no-reauth → 403 REAUTH_REQUIRED", f"{r.status_code} code={code}")

        # ── issue one-time reauth token via /admin/reauth, then refund ──
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": "Sup3rPass!"},
        )
        check(r.status_code == 200 and "reauth_token" in r.json(),
              "reauth issue → 200 token", f"{r.status_code} {r.text[:120]}")
        reauth_tok = r.json().get("reauth_token")

        # refund WITH one-time token → 200
        r = await client.post(
            f"/api/v1/admin/subscriptions/{paid_id}/refund",
            cookies=cookies_for(super_id),
            headers={"X-Admin-Reauth": reauth_tok},
            json={"reason": "gate refund"},
        )
        check(r.status_code == 200, "superadmin + one-time reauth → refund 200",
              f"{r.status_code} {r.text[:160]}")

        # ── refund charge created, status refunded, refund_id present ──
        async with factory() as s:
            ch = (await s.execute(
                select(SubscriptionCharge).where(
                    SubscriptionCharge.subscription_id == paid_id,
                    SubscriptionCharge.status == "refunded",
                )
            )).scalars().all()
        check(len(ch) == 1, "refund → exactly 1 'refunded' charge", f"count={len(ch)}")
        if ch:
            meta = ch[0].charge_metadata or {}
            check(bool(meta.get("refund_id")), "refund → charge has refund_id",
                  f"refund_id={meta.get('refund_id')}")
            check(meta.get("refund_id","").startswith("stub_refund_"),
                  "refund_id is stub-signed", meta.get("refund_id",""))

        # ── one-time token CONSUMED: reuse same token → 403 ────────────
        r = await client.post(
            f"/api/v1/admin/subscriptions/{paid_id}/refund",
            cookies=cookies_for(super_id),
            headers={"X-Admin-Reauth": reauth_tok},
            json={"reason": "reuse token"},
        )
        code = (r.json().get("detail", {}) or {}).get("code")
        check(r.status_code == 403 and code == "REAUTH_REQUIRED",
              "reuse same one-time token → 403 (getdel consumed)", f"{r.status_code} code={code}")

        # ── idempotency: fresh reauth + refund same sub → no new charge ─
        r = await client.post("/api/v1/admin/reauth", cookies=cookies_for(super_id),
                              json={"password": "Sup3rPass!"})
        reauth_tok2 = r.json().get("reauth_token")
        r = await client.post(
            f"/api/v1/admin/subscriptions/{paid_id}/refund",
            cookies=cookies_for(super_id),
            headers={"X-Admin-Reauth": reauth_tok2},
            json={"reason": "second refund"},
        )
        second_ok = r.status_code == 200
        async with factory() as s:
            cnt = (await s.execute(
                select(SubscriptionCharge).where(
                    SubscriptionCharge.subscription_id == paid_id,
                    SubscriptionCharge.status == "refunded",
                )
            )).scalars().all()
        check(second_ok and len(cnt) == 1,
              "repeat refund (same idempotency_key) → no-op, charge not doubled",
              f"http={r.status_code} charges={len(cnt)}")

        # ── audit: sub.refund present ──────────────────────────────────
        async with factory() as s:
            audit_cnt = (await s.execute(text(
                "SELECT count(*) FROM admin_audit_log WHERE action='sub.refund' "
                "AND target_id=:tid"
            ), {"tid": str(paid_id)})).scalar_one()
        check(audit_cnt >= 1, "audit sub.refund recorded", f"count={audit_cnt}")

        # ── cancel (support) → 200 ─────────────────────────────────────
        r = await client.post(
            f"/api/v1/admin/subscriptions/{granted_sub_id}/cancel",
            cookies=cookies_for(support_id),
        )
        check(r.status_code == 200, "cancel support → 200", f"{r.status_code} {r.text[:120]}")

        # ── list (support) ─────────────────────────────────────────────
        r = await client.get("/api/v1/admin/subscriptions?plan=pro",
                             cookies=cookies_for(support_id))
        ok_list = r.status_code == 200 and r.json().get("total", 0) >= 1
        check(ok_list, "list subscriptions → 200 non-empty",
              f"{r.status_code} total={r.json().get('total') if r.status_code==200 else '?'}")

        # ── detail (support) + charge-log ──────────────────────────────
        r = await client.get(f"/api/v1/admin/subscriptions/{paid_id}",
                             cookies=cookies_for(super_id))
        d = r.json() if r.status_code == 200 else {}
        has_charges = bool(d.get("charges")) and any(c["status"] == "refunded" for c in d.get("charges", []))
        check(r.status_code == 200 and has_charges,
              "detail → 200 with refunded charge in log",
              f"{r.status_code} charges={len(d.get('charges', []))}")

    await redis.aclose()
    await dispose_engine()

    total = len(RESULTS)
    passed = sum(1 for ok, _ in RESULTS if ok)
    print(f"\n===== F2-GATE: {passed}/{total} PASS =====")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
