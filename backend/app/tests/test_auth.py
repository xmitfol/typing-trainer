"""Tests для auth endpoints (Sprint 1, S1.4).

Покрытие:
  - GET /auth/challenge — структура PoW-challenge (runnable, без DB)
  - POST /auth/signup captcha-gate: honeypot / невалидный PoW → 403 (runnable, DB замокан)
  - POST /auth/signup happy path + duplicate email → требуют живой Postgres
    (CITEXT + partial unique index несовместимы с sqlite). Помечены
    requires_db; включатся, когда появится testcontainers-фикстура
    (S1.1/S0.3 infra, owner Дима/Борис).
"""

import hashlib
from collections.abc import Iterator

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.core.captcha import _leading_zero_bits
from app.deps import db_session, redis_client, settings_dep
from app.main import create_app
from app.tests.conftest import requires_db  # Docker-gated (B1-001 fixture)


def _solve(salt: str, difficulty: int) -> str:
    nonce = 0
    while _leading_zero_bits(hashlib.sha256(f"{salt}:{nonce}".encode()).digest()) < difficulty:
        nonce += 1
    return str(nonce)


class _FakeRedis:
    """Минимальный async-Redis: SET NX (replay-guard) + get/incr/expire/delete."""

    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def set(self, key, val, nx=False, ex=None):
        if nx and key in self.store:
            return None
        self.store[key] = str(val)
        return True

    async def get(self, key):
        return self.store.get(key)

    async def incr(self, key):
        new = int(self.store.get(key, "0")) + 1
        self.store[key] = str(new)
        return new

    async def expire(self, key, ttl):
        return True

    async def delete(self, key):
        self.store.pop(key, None)
        return True

    async def getdel(self, key):
        return self.store.pop(key, None)


@pytest.fixture
def test_settings() -> Settings:
    return Settings(  # type: ignore[call-arg]
        app_env="dev",
        app_debug=True,
        db_password="test-only-not-used",
        jwt_secret_key="x" * 64,
        captcha_pow_difficulty=8,  # низко → быстрый solve в тесте
    )


@pytest.fixture
def fake_redis() -> _FakeRedis:
    """Общий инстанс на тест — можно пред-seed'ить (signin fail counter)."""
    return _FakeRedis()


@pytest.fixture
def client(test_settings: Settings, fake_redis: _FakeRedis) -> Iterator[TestClient]:
    """TestClient с замоканными db_session/redis_client (captcha-gate тесты без DB)."""
    app = create_app()
    app.dependency_overrides[settings_dep] = lambda: test_settings
    app.dependency_overrides[db_session] = lambda: None  # 403-путь до DB не доходит
    app.dependency_overrides[redis_client] = lambda: fake_redis
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()


def _signup_payload_from(ch: dict) -> dict:
    return {
        "email": "user@example.com",
        "password": "correct horse battery",
        "name": "Тест",
        "audience": "adult",
        "character": "maxim",
        "language": "ru",
        "captcha_challenge": ch["challenge"],
        "captcha_signature": ch["signature"],
        "captcha_nonce": _solve_from_challenge(ch),
        "nickname2": "",
    }


def _valid_signup_payload(client: TestClient) -> dict:
    return _signup_payload_from(client.get("/api/v1/auth/challenge").json())


async def _valid_signup_payload_async(client: httpx.AsyncClient) -> dict:
    """То же для async db_client (httpx.AsyncClient, см. conftest)."""
    return _signup_payload_from((await client.get("/api/v1/auth/challenge")).json())


def _solve_from_challenge(ch: dict) -> str:
    import base64
    import json

    salt = json.loads(base64.urlsafe_b64decode(ch["challenge"].encode()))["salt"]
    return _solve(salt, ch["difficulty"])


# ─── GET /auth/challenge ──────────────────────────────────────────────


def test_challenge_shape(client: TestClient) -> None:
    r = client.get("/api/v1/auth/challenge")
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"challenge", "signature", "difficulty", "algorithm"}
    # difficulty приходит из реальных settings (issue_challenge зовёт get_settings
    # напрямую, не через DI-override) — проверяем тип, не конкретное значение.
    assert isinstance(body["difficulty"], int) and body["difficulty"] >= 1
    assert body["algorithm"] == "sha256-leading-zero-bits"


# ─── POST /auth/signup — captcha gate ─────────────────────────────────


def test_signup_honeypot_tripped_403(client: TestClient) -> None:
    payload = _valid_signup_payload(client)
    payload["nickname2"] = "i-am-a-bot"  # honeypot непустой
    r = client.post("/api/v1/auth/signup", json=payload)
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "CAPTCHA_FAILED"


def test_signup_bad_pow_403(client: TestClient) -> None:
    payload = _valid_signup_payload(client)
    payload["captcha_nonce"] = "0"  # почти наверняка не решение
    payload["captcha_signature"] = "deadbeef"  # и подпись битая
    r = client.post("/api/v1/auth/signup", json=payload)
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "CAPTCHA_FAILED"


def test_signup_validation_422(client: TestClient) -> None:
    payload = _valid_signup_payload(client)
    payload["audience"] = "grandpa"  # не из enum
    r = client.post("/api/v1/auth/signup", json=payload)
    assert r.status_code == 422


# ─── POST /auth/signup — happy path / duplicate (требуют Postgres) ────


@requires_db
async def test_signup_happy_path_201(db_client: httpx.AsyncClient) -> None:
    """signup с валидным PoW → 201 + auth-cookies + публичная проекция."""
    r = await db_client.post(
        "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["email"] == "user@example.com"
    assert body["email_verified"] is False
    assert body["audience"] == "adult"
    assert "password_hash" not in body
    assert "access_token" in r.cookies and "refresh_token" in r.cookies


@requires_db
async def test_signup_duplicate_email_409(db_client: httpx.AsyncClient) -> None:
    """Повторный signup тем же email → 409 EMAIL_TAKEN (второй challenge свежий)."""
    first = await db_client.post(
        "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
    )
    assert first.status_code == 201, first.text
    second = await db_client.post(
        "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
    )
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "EMAIL_TAKEN"


# ─── POST /auth/signin ────────────────────────────────────────────────


def test_signin_captcha_required_after_threshold(
    client: TestClient, fake_redis: _FakeRedis
) -> None:
    """≥3 неудач с IP → 403 CAPTCHA_REQUIRED ДО обращения к БД (gate на Redis)."""
    fake_redis.store["signin:fail:testclient"] = "3"
    r = client.post(
        "/api/v1/auth/signin",
        json={"email": "user@example.com", "password": "whatever"},
    )
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "CAPTCHA_REQUIRED"


@requires_db
async def test_signin_happy_path_200(db_client: httpx.AsyncClient) -> None:
    """Регистрируем юзера, затем валидный signin → 200 + cookies."""
    payload = await _valid_signup_payload_async(db_client)
    assert (await db_client.post("/api/v1/auth/signup", json=payload)).status_code == 201
    db_client.cookies.clear()  # уберём cookies от signup — проверяем чистый signin

    r = await db_client.post(
        "/api/v1/auth/signin",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert r.status_code == 200, r.text
    assert r.json()["email"] == payload["email"]
    assert "access_token" in r.cookies and "refresh_token" in r.cookies


@requires_db
async def test_signin_invalid_credentials_401(db_client: httpx.AsyncClient) -> None:
    """Неверный пароль → 401 INVALID_CREDENTIALS."""
    payload = await _valid_signup_payload_async(db_client)
    assert (await db_client.post("/api/v1/auth/signup", json=payload)).status_code == 201
    db_client.cookies.clear()

    r = await db_client.post(
        "/api/v1/auth/signin",
        json={"email": payload["email"], "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "INVALID_CREDENTIALS"


# ─── POST /auth/refresh + /auth/signout ───────────────────────────────


def test_refresh_no_cookie_401(client: TestClient) -> None:
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "TOKEN_INVALID"


def test_refresh_garbage_token_401(client: TestClient) -> None:
    client.cookies.set("refresh_token", "not-a-jwt")
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["detail"]["code"] == "TOKEN_INVALID"


def test_signout_clears_cookies_204(client: TestClient) -> None:
    """signout без сессии всё равно 204 и шлёт Set-Cookie на удаление."""
    r = client.post("/api/v1/auth/signout")
    assert r.status_code == 204


@requires_db
async def test_refresh_rotation_revokes_old_jti(db_client: httpx.AsyncClient) -> None:
    """Валидный refresh → новая пара; повтор старого refresh-токена → 401."""
    signup = await db_client.post(
        "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
    )
    assert signup.status_code == 201
    old_refresh = db_client.cookies.get("refresh_token")
    assert old_refresh

    # Первый refresh с R1 → 200 + новая пара (R2 в cookies клиента)
    r1 = await db_client.post("/api/v1/auth/refresh")
    assert r1.status_code == 200, r1.text

    # Повторный refresh со СТАРЫМ R1 → 401 (jti отозван при ротации).
    # Сначала удаляем R2 из джара: set() с дефолтным domain="" НЕ перезаписал
    # бы запись с Domain=testserver.local — ушли бы ДВА refresh_token cookie.
    db_client.cookies.delete("refresh_token")
    db_client.cookies.set("refresh_token", old_refresh)
    r2 = await db_client.post("/api/v1/auth/refresh")
    assert r2.status_code == 401
    assert r2.json()["detail"]["code"] == "TOKEN_INVALID"


# ─── S1.8: verify-email / forgot / reset ──────────────────────────────


def _forgot_payload_from(ch: dict, email: str) -> dict:
    return {
        "email": email,
        "captcha_challenge": ch["challenge"],
        "captcha_signature": ch["signature"],
        "captcha_nonce": _solve_from_challenge(ch),
        "nickname2": "",
    }


def _forgot_payload(client: TestClient, email: str) -> dict:
    return _forgot_payload_from(client.get("/api/v1/auth/challenge").json(), email)


async def _forgot_payload_async(client: httpx.AsyncClient, email: str) -> dict:
    return _forgot_payload_from((await client.get("/api/v1/auth/challenge")).json(), email)


def test_verify_email_invalid_token_400(client: TestClient) -> None:
    r = client.post("/api/v1/auth/verify-email", json={"token": "does-not-exist"})
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "TOKEN_INVALID"


def test_reset_invalid_token_400(client: TestClient) -> None:
    r = client.post("/api/v1/auth/reset", json={"token": "nope", "password": "long-enough-pw"})
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "TOKEN_INVALID"


def test_forgot_honeypot_403(client: TestClient) -> None:
    payload = _forgot_payload(client, "user@example.com")
    payload["nickname2"] = "bot"
    r = client.post("/api/v1/auth/forgot", json=payload)
    assert r.status_code == 403


def test_forgot_bad_captcha_403(client: TestClient) -> None:
    payload = _forgot_payload(client, "user@example.com")
    payload["captcha_signature"] = "deadbeef"
    r = client.post("/api/v1/auth/forgot", json=payload)
    assert r.status_code == 403


@requires_db
async def test_verify_email_flow(db_client: httpx.AsyncClient, redis_fake) -> None:  # type: ignore[no-untyped-def]
    """signup выдаёт verify-токен в Redis → verify-email 204; повтор → 400 (one-time)."""
    signup = await db_client.post(
        "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
    )
    assert signup.status_code == 201
    token = next(k.split(":", 1)[1] for k in redis_fake.store if k.startswith("email_verify:"))
    first = await db_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert first.status_code == 204
    # Токен одноразовый — повтор отвергается
    second = await db_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert second.status_code == 400


class _FailingEmailService:
    """Эмулятор сбоя SMTP: любой send_* падает (ConnectionRefused-подобно)."""

    async def send_welcome(self, **kwargs) -> None:
        raise ConnectionError("SMTP down (test)")

    async def send_verification(self, **kwargs) -> None:
        raise ConnectionError("SMTP down (test)")

    async def send_password_reset(self, **kwargs) -> None:
        raise ConnectionError("SMTP down (test)")


@requires_db
async def test_signup_smtp_down_still_issues_verify_token(
    db_client: httpx.AsyncClient,
    redis_fake,  # type: ignore[no-untyped-def]
) -> None:
    """Регресс: сбой SMTP на welcome НЕ должен оставлять юзера без verify-токена.

    issue_token стоит ПЕРВЫМ в best-effort блоке signup (как в forgot) — иначе
    ConnectionError от send_welcome прерывал блок до записи email_verify:* и
    юзеру было нечего подтверждать до Sprint-2 resend.
    """
    from app.deps import email_sender
    from app.main import app

    prev = app.dependency_overrides.get(email_sender)
    app.dependency_overrides[email_sender] = lambda: _FailingEmailService()
    try:
        before = {k for k in redis_fake.store if k.startswith("email_verify:")}
        r = await db_client.post(
            "/api/v1/auth/signup", json=await _valid_signup_payload_async(db_client)
        )
        assert r.status_code == 201  # best-effort: сбой почты не валит signup
        issued = {k for k in redis_fake.store if k.startswith("email_verify:")} - before
        assert issued, "verify-токен должен быть выдан несмотря на сбой SMTP"
    finally:
        if prev is not None:
            app.dependency_overrides[email_sender] = prev
        else:
            app.dependency_overrides.pop(email_sender, None)


@requires_db
async def test_forgot_reset_flow(db_client: httpx.AsyncClient, redis_fake) -> None:  # type: ignore[no-untyped-def]
    """signup → forgot (202) → reset по токену (204) → signin новым паролем (200)."""
    signup = await _valid_signup_payload_async(db_client)
    assert (await db_client.post("/api/v1/auth/signup", json=signup)).status_code == 201
    db_client.cookies.clear()

    forgot = await db_client.post(
        "/api/v1/auth/forgot", json=await _forgot_payload_async(db_client, signup["email"])
    )
    assert forgot.status_code == 202
    token = next(k.split(":", 1)[1] for k in redis_fake.store if k.startswith("pwd_reset:"))

    new_pw = "brand-new-password-9"
    reset = await db_client.post("/api/v1/auth/reset", json={"token": token, "password": new_pw})
    assert reset.status_code == 204

    r = await db_client.post(
        "/api/v1/auth/signin", json={"email": signup["email"], "password": new_pw}
    )
    assert r.status_code == 200, r.text
