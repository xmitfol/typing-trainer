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
import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.core.captcha import _leading_zero_bits
from app.deps import db_session, redis_client, settings_dep
from app.main import create_app

requires_db = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="нужен живой Postgres (CITEXT/partial index); ждёт testcontainers-фикстуру",
)


def _solve(salt: str, difficulty: int) -> str:
    nonce = 0
    while _leading_zero_bits(hashlib.sha256(f"{salt}:{nonce}".encode()).digest()) < difficulty:
        nonce += 1
    return str(nonce)


class _FakeRedis:
    """Минимальный async-Redis: SET NX (replay-guard) + get/incr/expire/delete."""

    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def set(self, key, val, nx=False, ex=None):  # noqa: A003
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


def _valid_signup_payload(client: TestClient) -> dict:
    ch = client.get("/api/v1/auth/challenge").json()
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
def test_signup_happy_path_201() -> None:
    """TODO: при наличии testcontainers — signup → 201 + cookies + user_settings."""
    raise NotImplementedError("включить с testcontainers-фикстурой (S1.1 infra)")


@requires_db
def test_signup_duplicate_email_409() -> None:
    """TODO: повторный signup тем же email → 409 EMAIL_TAKEN."""
    raise NotImplementedError("включить с testcontainers-фикстурой (S1.1 infra)")


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
def test_signin_happy_path_200() -> None:
    """TODO: валидные creds → 200 + cookies (нужен Postgres)."""
    raise NotImplementedError("включить с testcontainers-фикстурой (S1.1 infra)")


@requires_db
def test_signin_invalid_credentials_401() -> None:
    """TODO: неверный пароль → 401 INVALID_CREDENTIALS + инкремент fail-счётчика."""
    raise NotImplementedError("включить с testcontainers-фикстурой (S1.1 infra)")


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
def test_refresh_rotation_revokes_old_jti() -> None:
    """TODO: валидный refresh → новая пара; повтор старого jti → 401 (нужен Postgres для user-lookup)."""
    raise NotImplementedError("включить с testcontainers-фикстурой (S1.1 infra)")
