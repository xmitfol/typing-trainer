"""Ф4b-GATE — admin TOTP-2FA (enroll/verify/disable + reauth enforcement).

Гоняется ВНУТРИ backend-контейнера (реальные Postgres/Redis):

    docker exec tt_backend python scripts/verify_admin_2fa.py

httpx ASGITransport против app; cookies минтим через create_access_token
(обходим captcha/signin). Проверяет по пунктам Ф4b-гейта:
  - enroll → otpauth_uri + secret, enabled=False
  - verify правильным TOTP → enabled=True + 8 recovery-кодов; неверный код → не включает
  - reauth: superadmin с 2FA без totp → 403 TOTP_REQUIRED; с верным TOTP → токен;
    с recovery → токен, повтор того же recovery → отказ (one-time)
  - support (не superadmin) с 2FA-строкой → 2FA не требуется (reauth по паролю)
  - неверный TOTP N раз → rate-limit 429
  - require_superadmin_2fa=True + superadmin без 2FA → 403 TOTP_ENROLLMENT_REQUIRED;
    после enroll+verify → проходит
  - disable (superadmin + reauth) → enabled=False, дальше reauth по паролю
  - secret at-rest зашифрован (в БД не plaintext base32)

Печатает [PASS]/[FAIL] + итог. Exit 0 только если всё PASS.
"""

import asyncio
import sys
import uuid

import httpx
import pyotp
from sqlalchemy import select, text

from app.config import get_settings
from app.core import totp as totp_core
from app.core.db import dispose_engine, get_sessionmaker
from app.core.redis import get_redis
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.admin_2fa import Admin2FA
from app.models.user import User

RESULTS: list[tuple[bool, str]] = []
PW = "Sup3rPass!"


def check(cond: bool, label: str, extra: str = "") -> bool:
    RESULTS.append((bool(cond), label))
    print(f"[{'PASS' if cond else 'FAIL'}] {label}{(' — ' + extra) if extra else ''}")
    return bool(cond)


def cookies_for(user_id) -> dict:
    tok, _ = create_access_token(user_id)
    return {"access_token": tok}


async def mk_user(session, *, role: str, with_pw: str | None = None) -> User:
    u = User(
        email=f"gate2fa_{role}_{uuid.uuid4().hex[:8]}@example.com",
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


async def clear_fail_rl(redis, user_id) -> None:
    await redis.delete(f"ratelimit:reauth:{user_id}")


async def enroll_verify(client, redis, user_id) -> tuple[str, list[str]]:
    """Полный enroll→verify для юзера. Возвращает (secret, recovery_codes)."""
    r = await client.post("/api/v1/admin/2fa/enroll", cookies=cookies_for(user_id))
    secret = r.json()["secret"]
    code = pyotp.TOTP(secret).now()
    r = await client.post(
        "/api/v1/admin/2fa/verify", cookies=cookies_for(user_id), json={"code": code}
    )
    recovery = r.json().get("recovery_codes", [])
    return secret, recovery


async def main() -> int:
    factory = get_sessionmaker()
    redis = get_redis()
    transport = httpx.ASGITransport(app=app)

    async with factory() as session:
        superadmin = await mk_user(session, role="superadmin", with_pw=PW)
        support = await mk_user(session, role="support", with_pw=PW)
        super2 = await mk_user(session, role="superadmin", with_pw=PW)  # для enrollment-force
        await session.commit()
        super_id, support_id, super2_id = superadmin.id, support.id, super2.id

    base = "http://gate"
    async with httpx.AsyncClient(transport=transport, base_url=base) as client:
        # ─── 1. enroll ─────────────────────────────────────────────────
        r = await client.post("/api/v1/admin/2fa/enroll", cookies=cookies_for(super_id))
        body = r.json() if r.status_code == 200 else {}
        secret = body.get("secret", "")
        check(
            r.status_code == 200
            and body.get("otpauth_uri", "").startswith("otpauth://")
            and len(secret) >= 16,
            "enroll → 200 otpauth_uri + secret",
            f"{r.status_code} uri={body.get('otpauth_uri','')[:40]}",
        )
        async with factory() as s:
            row = (
                await s.execute(select(Admin2FA).where(Admin2FA.user_id == super_id))
            ).scalar_one_or_none()
        check(
            row is not None and row.enabled is False,
            "enroll → row enabled=False (не подтверждён)",
            f"enabled={getattr(row,'enabled',None)}",
        )

        # secret at-rest зашифрован: в БД НЕ равен plaintext base32
        check(
            row is not None and row.secret != secret and secret not in row.secret,
            "secret at-rest зашифрован (не plaintext в БД)",
            f"db_prefix={row.secret[:12] if row else None}",
        )
        # и расшифровка даёт исходный секрет
        check(
            row is not None and totp_core.decrypt_secret(row.secret) == secret,
            "secret расшифровывается обратно в исходный",
        )

        # ─── 2. verify: неверный код → не включает ─────────────────────
        r = await client.post(
            "/api/v1/admin/2fa/verify", cookies=cookies_for(super_id), json={"code": "000000"}
        )
        code = (r.json().get("detail", {}) or {}).get("code") if r.status_code != 200 else None
        check(
            r.status_code == 403 and code == "TOTP_INVALID",
            "verify неверным кодом → 403 TOTP_INVALID (не включает)",
            f"{r.status_code} code={code}",
        )
        async with factory() as s:
            en = (
                await s.execute(select(Admin2FA.enabled).where(Admin2FA.user_id == super_id))
            ).scalar_one()
        check(en is False, "после неверного verify enabled всё ещё False")

        # ─── 2b. verify правильным TOTP → enabled + 8 recovery ─────────
        good = pyotp.TOTP(secret).now()
        r = await client.post(
            "/api/v1/admin/2fa/verify", cookies=cookies_for(super_id), json={"code": good}
        )
        vb = r.json() if r.status_code == 200 else {}
        recovery = vb.get("recovery_codes", [])
        check(
            r.status_code == 200 and vb.get("enabled") is True and len(recovery) == 8,
            "verify верным TOTP → enabled=True + 8 recovery-кодов",
            f"{r.status_code} recovery={len(recovery)}",
        )
        async with factory() as s:
            row = (
                await s.execute(select(Admin2FA).where(Admin2FA.user_id == super_id))
            ).scalar_one()
        check(
            row.enabled is True and row.confirmed_at is not None and len(row.recovery_codes) == 8,
            "БД: enabled=True, confirmed_at set, 8 хешей recovery",
            f"hashes={len(row.recovery_codes)}",
        )
        # recovery в БД — хеши, не plaintext
        check(
            all(rc not in row.recovery_codes for rc in recovery),
            "recovery в БД — хеши, не plaintext",
        )

        # audit 2fa.enabled
        async with factory() as s:
            ac = (
                await s.execute(
                    text(
                        "SELECT count(*) FROM admin_audit_log WHERE action='2fa.enabled' "
                        "AND target_id=:t"
                    ),
                    {"t": str(super_id)},
                )
            ).scalar_one()
        check(ac >= 1, "audit 2fa.enabled записан", f"count={ac}")

        # status
        r = await client.get("/api/v1/admin/2fa/status", cookies=cookies_for(super_id))
        check(
            r.status_code == 200 and r.json().get("enabled") is True,
            "status → enabled=True",
            f"{r.status_code} {r.text[:80]}",
        )

        # ─── 3. reauth enforcement ─────────────────────────────────────
        await clear_fail_rl(redis, super_id)
        # 3a: без totp_code → 403 TOTP_REQUIRED
        r = await client.post(
            "/api/v1/admin/reauth", cookies=cookies_for(super_id), json={"password": PW}
        )
        code = (r.json().get("detail", {}) or {}).get("code")
        check(
            r.status_code == 403 and code == "TOTP_REQUIRED",
            "superadmin+2FA, reauth без totp → 403 TOTP_REQUIRED",
            f"{r.status_code} code={code}",
        )

        # 3b: неверный пароль → REAUTH_FAILED (не TOTP-ветка)
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": "wrong", "totp_code": pyotp.TOTP(secret).now()},
        )
        code = (r.json().get("detail", {}) or {}).get("code")
        check(
            r.status_code == 403 and code == "REAUTH_FAILED",
            "reauth неверный пароль → 403 REAUTH_FAILED",
            f"code={code}",
        )
        await clear_fail_rl(redis, super_id)

        # 3c: верный TOTP → 200 токен
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": PW, "totp_code": pyotp.TOTP(secret).now()},
        )
        check(
            r.status_code == 200 and "reauth_token" in r.json(),
            "superadmin+2FA, reauth с верным TOTP → 200 токен",
            f"{r.status_code} {r.text[:100]}",
        )

        # 3d: recovery-код → 200 токен; повтор того же recovery → отказ (one-time)
        await clear_fail_rl(redis, super_id)
        rc0 = recovery[0]
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": PW, "totp_code": rc0},
        )
        check(
            r.status_code == 200 and "reauth_token" in r.json(),
            "reauth с recovery-кодом → 200 токен",
            f"{r.status_code}",
        )
        await clear_fail_rl(redis, super_id)
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": PW, "totp_code": rc0},
        )
        code = (r.json().get("detail", {}) or {}).get("code")
        check(
            r.status_code == 403 and code == "TOTP_INVALID",
            "повтор того же recovery → 403 (one-time consumed)",
            f"code={code}",
        )
        # второй, ещё не использованный recovery → всё ещё работает
        await clear_fail_rl(redis, super_id)
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": PW, "totp_code": recovery[1]},
        )
        check(r.status_code == 200, "другой (неиспользованный) recovery → 200")

        # enroll — superadmin-only: support → 403 ADMIN_FORBIDDEN
        r = await client.post("/api/v1/admin/2fa/enroll", cookies=cookies_for(support_id))
        code = (r.json().get("detail", {}) or {}).get("code")
        check(
            r.status_code == 403 and code == "ADMIN_FORBIDDEN",
            "enroll support (не superadmin) → 403 ADMIN_FORBIDDEN",
            f"{r.status_code} code={code}",
        )

        # ─── 4. support (не superadmin) с 2FA-строкой → 2FA не требуется ─
        # enroll — superadmin-only, поэтому вставляем enabled-2FA запись support'у
        # напрямую в БД (симулируем «есть 2FA») и проверяем, что reauth всё равно
        # проходит по одному паролю (enforcement только для superadmin).
        async with factory() as s:
            s.add(
                Admin2FA(
                    user_id=support_id,
                    secret=totp_core.encrypt_secret(pyotp.random_base32()),
                    enabled=True,
                    recovery_codes=[],
                )
            )
            await s.commit()
        await clear_fail_rl(redis, support_id)
        r = await client.post(
            "/api/v1/admin/reauth", cookies=cookies_for(support_id), json={"password": PW}
        )  # без totp_code
        check(
            r.status_code == 200 and "reauth_token" in r.json(),
            "support (не superadmin) → reauth по паролю, 2FA не требуется",
            f"{r.status_code} {r.text[:100]}",
        )

        # ─── 5. неверный TOTP N раз → rate-limit 429 ───────────────────
        await clear_fail_rl(redis, super_id)
        last = None
        for _ in range(6):
            last = await client.post(
                "/api/v1/admin/reauth",
                cookies=cookies_for(super_id),
                json={"password": PW, "totp_code": "111111"},
            )
        code = (last.json().get("detail", {}) or {}).get("code")
        check(
            last.status_code == 429 and code == "RATE_LIMITED",
            "неверный TOTP N раз → 429 RATE_LIMITED (анти-брутфорс кода)",
            f"{last.status_code} code={code}",
        )
        await clear_fail_rl(redis, super_id)

        # ─── 6. require_superadmin_2fa=True: superadmin без 2FA → enrollment ─
        settings = get_settings()
        settings.require_superadmin_2fa = True
        try:
            await clear_fail_rl(redis, super2_id)
            r = await client.post(
                "/api/v1/admin/reauth", cookies=cookies_for(super2_id), json={"password": PW}
            )
            code = (r.json().get("detail", {}) or {}).get("code")
            check(
                r.status_code == 403 and code == "TOTP_ENROLLMENT_REQUIRED",
                "require_2fa=True + superadmin без 2FA → 403 TOTP_ENROLLMENT_REQUIRED",
                f"{r.status_code} code={code}",
            )
            # после enroll+verify → проходит
            s2_secret, _ = await enroll_verify(client, redis, super2_id)
            await clear_fail_rl(redis, super2_id)
            r = await client.post(
                "/api/v1/admin/reauth",
                cookies=cookies_for(super2_id),
                json={"password": PW, "totp_code": pyotp.TOTP(s2_secret).now()},
            )
            check(
                r.status_code == 200 and "reauth_token" in r.json(),
                "require_2fa=True + после enroll+verify → reauth проходит",
                f"{r.status_code}",
            )
        finally:
            settings.require_superadmin_2fa = False

        # ─── 7. disable (superadmin + reauth) → enabled=False ──────────
        await clear_fail_rl(redis, super_id)
        r = await client.post(
            "/api/v1/admin/reauth",
            cookies=cookies_for(super_id),
            json={"password": PW, "totp_code": pyotp.TOTP(secret).now()},
        )
        reauth_tok = r.json()["reauth_token"]
        r = await client.post(
            "/api/v1/admin/2fa/disable",
            cookies=cookies_for(super_id),
            headers={"X-Admin-Reauth": reauth_tok},
        )
        check(
            r.status_code == 200 and r.json().get("enabled") is False,
            "disable (superadmin + reauth) → 200 enabled=False",
            f"{r.status_code}",
        )
        async with factory() as s:
            row = (
                await s.execute(select(Admin2FA).where(Admin2FA.user_id == super_id))
            ).scalar_one_or_none()
        check(row is None, "disable → запись admin_2fa удалена (secret/recovery очищены)")
        async with factory() as s:
            ac = (
                await s.execute(
                    text(
                        "SELECT count(*) FROM admin_audit_log WHERE action='2fa.disabled' "
                        "AND target_id=:t"
                    ),
                    {"t": str(super_id)},
                )
            ).scalar_one()
        check(ac >= 1, "audit 2fa.disabled записан", f"count={ac}")

        # после disable → reauth по паролю (2FA не требуется)
        await clear_fail_rl(redis, super_id)
        r = await client.post(
            "/api/v1/admin/reauth", cookies=cookies_for(super_id), json={"password": PW}
        )
        check(
            r.status_code == 200 and "reauth_token" in r.json(),
            "после disable → reauth по паролю проходит (без TOTP)",
            f"{r.status_code}",
        )

    await redis.aclose()
    await dispose_engine()

    total = len(RESULTS)
    passed = sum(1 for ok, _ in RESULTS if ok)
    print(f"\n===== Ф4b-GATE: {passed}/{total} PASS =====")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
