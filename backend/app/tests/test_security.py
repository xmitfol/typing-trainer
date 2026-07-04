"""Tests для security.py — Argon2 hashing + JWT helpers."""

import time
from datetime import timedelta
from uuid import uuid4

import pytest
from jose import JWTError

from app.core import security

# ─── Password hashing ──────────────────────────────────────────────────


def test_hash_password_produces_argon2id() -> None:
    h = security.hash_password("correct horse battery staple")
    assert h.startswith("$argon2id$")


def test_hash_password_different_each_call() -> None:
    """Salt должен делать каждый hash уникальным."""
    h1 = security.hash_password("password")
    h2 = security.hash_password("password")
    assert h1 != h2


def test_verify_password_correct() -> None:
    h = security.hash_password("MyP@ssw0rd!")
    assert security.verify_password("MyP@ssw0rd!", h) is True


def test_verify_password_wrong() -> None:
    h = security.hash_password("MyP@ssw0rd!")
    assert security.verify_password("wrong", h) is False


def test_verify_password_empty_hash() -> None:
    assert security.verify_password("anything", "") is False


def test_verify_password_corrupted_hash() -> None:
    """Невалидный hash не должен крашить, просто возвращать False."""
    assert security.verify_password("anything", "not-a-valid-hash") is False


def test_hash_password_empty_raises() -> None:
    with pytest.raises(ValueError):
        security.hash_password("")


def test_dummy_hash_is_singleton() -> None:
    d1 = security.get_dummy_hash()
    d2 = security.get_dummy_hash()
    assert d1 == d2
    assert d1.startswith("$argon2id$")


def test_dummy_hash_verify_fails() -> None:
    """Dummy hash должен всегда отказывать на любом password."""
    assert security.verify_password("some-real-password", security.get_dummy_hash()) is False


def test_anti_timing_attack_pattern() -> None:
    """Verify времени dummy_hash и реального hash примерно одинаков
    (защита от raze user existence через тайминг).
    """
    real_hash = security.hash_password("real-password")
    dummy = security.get_dummy_hash()

    # Warm up
    security.verify_password("nope", real_hash)
    security.verify_password("nope", dummy)

    # Measure (несколько итераций для стабильности)
    def measure(target_hash: str) -> float:
        start = time.perf_counter()
        for _ in range(5):
            security.verify_password("guess", target_hash)
        return time.perf_counter() - start

    t_real = measure(real_hash)
    t_dummy = measure(dummy)
    # Tolerance 50% — на CI/dev может прыгать
    ratio = t_dummy / t_real if t_real > 0 else float("inf")
    assert 0.5 < ratio < 2.0, f"Timing imbalance: real={t_real:.3f}s, dummy={t_dummy:.3f}s"


def test_needs_rehash_returns_bool() -> None:
    """Just smoke: needs_rehash работает на свежем hash'е (обычно False)."""
    h = security.hash_password("password")
    assert isinstance(security.needs_rehash(h), bool)


# ─── JWT ────────────────────────────────────────────────────────────────


def test_create_access_token_returns_jti() -> None:
    user_id = uuid4()
    token, jti = security.create_access_token(user_id)
    assert isinstance(token, str)
    assert isinstance(jti, str)
    assert len(jti) >= 32  # UUID stringified


def test_access_token_round_trip() -> None:
    user_id = uuid4()
    token, jti = security.create_access_token(user_id)
    claims = security.decode_token(token, expected_type="access")
    assert claims["sub"] == str(user_id)
    assert claims["jti"] == jti
    assert claims["typ"] == "access"


def test_refresh_token_round_trip() -> None:
    user_id = uuid4()
    token, jti = security.create_refresh_token(user_id)
    claims = security.decode_token(token, expected_type="refresh")
    assert claims["sub"] == str(user_id)
    assert claims["typ"] == "refresh"


def test_access_token_rejected_as_refresh() -> None:
    """Access токен НЕ должен пройти как refresh."""
    token, _ = security.create_access_token(uuid4())
    with pytest.raises(JWTError):
        security.decode_token(token, expected_type="refresh")


def test_refresh_token_rejected_as_access() -> None:
    token, _ = security.create_refresh_token(uuid4())
    with pytest.raises(JWTError):
        security.decode_token(token, expected_type="access")


def test_expired_token_rejected() -> None:
    """Истёкший токен должен быть отвергнут."""
    user_id = uuid4()
    token, _ = security.create_access_token(user_id, ttl=timedelta(seconds=-1))
    with pytest.raises(JWTError):
        security.decode_token(token, expected_type="access")


def test_malformed_token_rejected() -> None:
    with pytest.raises(JWTError):
        security.decode_token("not.a.valid.jwt", expected_type="access")


def test_extract_user_id_returns_uuid() -> None:
    user_id = uuid4()
    token, _ = security.create_access_token(user_id)
    extracted = security.extract_user_id(token, expected_type="access")
    assert extracted == user_id


def test_tampered_token_rejected() -> None:
    """Изменённый payload должен быть отвергнут (signature mismatch)."""
    token, _ = security.create_access_token(uuid4())
    parts = token.split(".")
    # Меняем последний символ middle (payload) части
    tampered_middle = parts[1][:-1] + ("a" if parts[1][-1] != "a" else "b")
    tampered = ".".join([parts[0], tampered_middle, parts[2]])
    with pytest.raises(JWTError):
        security.decode_token(tampered, expected_type="access")
