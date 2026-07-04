"""Tests для captcha.py — self-hosted PoW anti-bot (ADR-006)."""

import hashlib
from unittest.mock import patch

import pytest

from app.core.captcha import (
    DEV_BYPASS_TOKEN,
    _leading_zero_bits,
    _pow_solved,
    issue_challenge,
    verify_captcha,
)


def _solve(salt: str, difficulty: int) -> str:
    """Брутфорсим nonce для теста (low difficulty → быстро)."""
    nonce = 0
    while True:
        candidate = str(nonce)
        digest = hashlib.sha256(f"{salt}:{candidate}".encode()).digest()
        if _leading_zero_bits(digest) >= difficulty:
            return candidate
        nonce += 1


@pytest.fixture
def fake_settings():
    """get_settings() с предсказуемыми параметрами капчи."""
    with patch("app.core.captcha.get_settings") as mock:
        s = mock.return_value
        s.app_env = "dev"
        s.jwt_secret_key = "x" * 32
        s.captcha_pow_difficulty = 8  # низкая сложность для быстрых тестов
        s.captcha_challenge_ttl_seconds = 600
        yield s


# ─── leading-zero-bits helper ────────────────────────────────────────


def test_leading_zero_bits_counts_correctly() -> None:
    assert _leading_zero_bits(bytes([0xFF])) == 0
    assert _leading_zero_bits(bytes([0x00, 0xFF])) == 8
    assert _leading_zero_bits(bytes([0x0F])) == 4
    assert _leading_zero_bits(bytes([0x00, 0x00])) == 16


# ─── dev bypass ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dev_bypass_token_works(fake_settings) -> None:
    """В dev режиме `test-bypass-captcha` проходит без PoW."""
    assert await verify_captcha(DEV_BYPASS_TOKEN, "sig", "nonce", ip="127.0.0.1") is True


@pytest.mark.asyncio
async def test_dev_bypass_disabled_in_prod(fake_settings) -> None:
    fake_settings.app_env = "prod"
    assert await verify_captcha(DEV_BYPASS_TOKEN, "sig", "nonce") is False


# ─── happy path: issue → solve → verify ──────────────────────────────


@pytest.mark.asyncio
async def test_issue_and_verify_roundtrip(fake_settings) -> None:
    challenge = issue_challenge()
    salt = _decode_salt(challenge["challenge"])
    nonce = _solve(salt, challenge["difficulty"])
    ok = await verify_captcha(challenge["challenge"], challenge["signature"], nonce, redis=None)
    assert ok is True


# ─── rejections ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_missing_fields_rejected(fake_settings) -> None:
    assert await verify_captcha("", "", "") is False


@pytest.mark.asyncio
async def test_bad_signature_rejected(fake_settings) -> None:
    challenge = issue_challenge()
    salt = _decode_salt(challenge["challenge"])
    nonce = _solve(salt, challenge["difficulty"])
    assert await verify_captcha(challenge["challenge"], "deadbeef", nonce) is False


@pytest.mark.asyncio
async def test_wrong_nonce_rejected(fake_settings) -> None:
    """Валидная подпись, но решение PoW неверное."""
    fake_settings.captcha_pow_difficulty = 20  # высоко → случайный nonce не подойдёт
    challenge = issue_challenge()
    assert await verify_captcha(challenge["challenge"], challenge["signature"], "0") is False


@pytest.mark.asyncio
async def test_expired_challenge_rejected(fake_settings) -> None:
    """exp в прошлом → reject (подпись валидна)."""
    fake_settings.captcha_challenge_ttl_seconds = -1  # сразу истёк
    challenge = issue_challenge()
    salt = _decode_salt(challenge["challenge"])
    nonce = _solve(salt, challenge["difficulty"])
    assert await verify_captcha(challenge["challenge"], challenge["signature"], nonce) is False


@pytest.mark.asyncio
async def test_replay_rejected_with_redis(fake_settings) -> None:
    """Повторный salt → False (replay-guard через Redis)."""

    class FakeRedis:
        def __init__(self) -> None:
            self.store: set[str] = set()

        async def set(self, key, val, nx=False, ex=None):
            if nx and key in self.store:
                return None
            self.store.add(key)
            return True

    redis = FakeRedis()
    challenge = issue_challenge()
    salt = _decode_salt(challenge["challenge"])
    nonce = _solve(salt, challenge["difficulty"])

    first = await verify_captcha(challenge["challenge"], challenge["signature"], nonce, redis=redis)
    second = await verify_captcha(
        challenge["challenge"], challenge["signature"], nonce, redis=redis
    )
    assert first is True
    assert second is False


def test_pow_solved_helper(fake_settings) -> None:
    salt = "abc"
    nonce = _solve(salt, 8)
    assert _pow_solved(salt, nonce, 8) is True
    assert _pow_solved(salt, "definitely-not-a-solution-xyz", 20) is False


# ─── helpers ─────────────────────────────────────────────────────────


def _decode_salt(challenge_b64: str) -> str:
    import base64
    import json

    return json.loads(base64.urlsafe_b64decode(challenge_b64.encode()))["salt"]
