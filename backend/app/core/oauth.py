"""Provider-agnostic OAuth core (ADR-007).

Server-side Authorization Code flow (Yandex + VK). Бизнес-логика резолвинга
аккаунта (services/oauth_service.py) зависит ТОЛЬКО от доменного
`OAuthUserInfo` — не от сырых ответов провайдера. Конкретные стратегии
(`YandexStrategy`, `VKStrategy`, `MockStrategy`) — плагины, выбираются
конфигом через `get_oauth_strategy(provider, settings)` (аналог
get_payment_provider в billing).

Токен провайдера НЕ храним (ADR-007 §5) — используем один раз для
fetch_userinfo. В oauth_accounts.raw_payload кладём снапшот userinfo.

`MockStrategy` (dev/CI): прогоняет весь путь start → callback → cookies без
регистрации приложений у Yandex/VK — детерминированный OAuthUserInfo из
подписанного mock-кода. Аналог StubProvider в billing.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol, runtime_checkable
from urllib.parse import urlencode

import httpx

if TYPE_CHECKING:
    from app.config import Settings


# ─── Доменный тип (нормализованный, provider-agnostic) ────────────────


@dataclass(frozen=True)
class OAuthUserInfo:
    """Нормализованный профиль от провайдера.

    `external_id` — стабильный id юзера у провайдера (для (provider,external_id)).
    `email` может быть пустым (провайдер не отдал согласие) → callback вернёт
    OAUTH_NO_EMAIL. `locale` → маппится в language ru/en.
    """

    external_id: str
    email: str
    name: str
    locale: str


# ─── Интерфейс стратегии ──────────────────────────────────────────────


@runtime_checkable
class OAuthStrategy(Protocol):
    """Контракт провайдер-стратегии (ADR-007 §1).

    Все методы — в терминах наших доменных типов. PKCE (code_verifier/
    code_challenge) опционален: нужен только VK ID (OAuth 2.1).
    """

    name: str
    uses_pkce: bool

    def authorize_url(self, state: str, code_challenge: str | None = None) -> str:
        """URL авторизации провайдера (302 туда с /start)."""
        ...

    async def exchange_code(self, code: str, code_verifier: str | None = None) -> str:
        """Обменять authorization code на provider access_token."""
        ...

    async def fetch_userinfo(self, token: str) -> OAuthUserInfo:
        """Получить профиль по provider access_token."""
        ...


def _locale_to_language(locale: str | None) -> str:
    """provider locale → наш language ('ru' | 'en'). Дефолт ru."""
    if locale and locale.lower().startswith("en"):
        return "en"
    return "ru"


# ─── Yandex (oauth.yandex.ru + login.yandex.ru) ───────────────────────


class YandexStrategy:
    """Yandex OAuth (PKCE не требуется).

    authorize: oauth.yandex.ru/authorize
    token:     oauth.yandex.ru/token
    userinfo:  login.yandex.ru/info (scope login:email login:info)
    """

    name = "yandex"
    uses_pkce = False

    AUTHORIZE_URL = "https://oauth.yandex.ru/authorize"
    TOKEN_URL = "https://oauth.yandex.ru/token"
    USERINFO_URL = "https://login.yandex.ru/info"

    def __init__(self, *, client_id: str, client_secret: str, redirect_uri: str) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri

    def authorize_url(self, state: str, code_challenge: str | None = None) -> str:
        params = {
            "response_type": "code",
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "scope": "login:email login:info",
            "state": state,
        }
        return f"{self.AUTHORIZE_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str, code_verifier: str | None = None) -> str:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "redirect_uri": self._redirect_uri,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(self.TOKEN_URL, data=data)
            resp.raise_for_status()
            token = resp.json().get("access_token")
        if not token:
            raise OAuthProviderError("yandex: no access_token in token response")
        return str(token)

    async def fetch_userinfo(self, token: str) -> OAuthUserInfo:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                self.USERINFO_URL,
                params={"format": "json"},
                headers={"Authorization": f"OAuth {token}"},
            )
            resp.raise_for_status()
            data = resp.json()
        # login.yandex.ru/info: id, default_email/emails[], real_name/display_name
        email = data.get("default_email") or (data.get("emails") or [""])[0] or ""
        name = data.get("real_name") or data.get("display_name") or data.get("login") or ""
        # Yandex /info не отдаёт язык интерфейса стабильно → дефолт ru.
        return OAuthUserInfo(
            external_id=str(data["id"]),
            email=email,
            name=name,
            locale="ru",
        )


# ─── VK ID (id.vk.com, OAuth 2.1 + PKCE обязателен) ───────────────────


class VKStrategy:
    """VK ID OAuth 2.1 (PKCE ОБЯЗАТЕЛЕН).

    authorize: id.vk.com/authorize
    token:     id.vk.com/oauth2/auth
    userinfo:  id.vk.com/oauth2/user_info
    """

    name = "vk"
    uses_pkce = True

    AUTHORIZE_URL = "https://id.vk.com/authorize"
    TOKEN_URL = "https://id.vk.com/oauth2/auth"
    USERINFO_URL = "https://id.vk.com/oauth2/user_info"

    def __init__(self, *, client_id: str, client_secret: str, redirect_uri: str) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri

    def authorize_url(self, state: str, code_challenge: str | None = None) -> str:
        params = {
            "response_type": "code",
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "scope": "email",
            "state": state,
            "code_challenge": code_challenge or "",
            "code_challenge_method": "S256",
        }
        return f"{self.AUTHORIZE_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str, code_verifier: str | None = None) -> str:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "redirect_uri": self._redirect_uri,
            "code_verifier": code_verifier or "",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(self.TOKEN_URL, data=data)
            resp.raise_for_status()
            token = resp.json().get("access_token")
        if not token:
            raise OAuthProviderError("vk: no access_token in token response")
        return str(token)

    async def fetch_userinfo(self, token: str) -> OAuthUserInfo:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                self.USERINFO_URL,
                data={"access_token": token, "client_id": self._client_id},
            )
            resp.raise_for_status()
            payload = resp.json()
        # VK ID user_info: {"user": {"user_id", "email", "first_name", ...}}
        user = payload.get("user", payload)
        first = user.get("first_name", "")
        last = user.get("last_name", "")
        name = f"{first} {last}".strip() or user.get("email", "")
        return OAuthUserInfo(
            external_id=str(user.get("user_id") or user.get("id")),
            email=user.get("email") or "",
            name=name,
            locale="ru",
        )


# ─── MockStrategy (dev/CI — весь flow без реальных кред) ──────────────


class MockStrategy:
    """Фейковая стратегия: прогоняет start → callback → cookies без реального
    провайдера (ADR-007 — аналог StubProvider в billing).

    - authorize_url → локальный dev-URL, куда фронт/тест сам подставит
      детерминированный подписанный `code` (HMAC на jwt_secret_key).
    - exchange_code → возвращает сам code как «token» (он уже несёт профиль).
    - fetch_userinfo → декодирует подписанный code в OAuthUserInfo.

    Формат mock-code: base64url(json({external_id,email,name,locale})).sig,
    где sig = HMAC-SHA256(payload, secret). Тест собирает code через
    `make_code(...)`. Так весь flow детерминирован и подделка невозможна.
    """

    name = "mock"
    uses_pkce = False

    def __init__(self, *, provider: str, signing_secret: str, redirect_uri: str) -> None:
        self._provider = provider
        self._secret = signing_secret.encode()
        self._redirect_uri = redirect_uri

    def _sign(self, payload_b64: str) -> str:
        return hmac.new(self._secret, payload_b64.encode(), hashlib.sha256).hexdigest()

    def make_code(
        self,
        *,
        external_id: str,
        email: str,
        name: str = "",
        locale: str = "ru",
    ) -> str:
        """Собрать подписанный mock authorization code (для тестов/эмуляции)."""
        payload = json.dumps(
            {"external_id": external_id, "email": email, "name": name, "locale": locale},
            separators=(",", ":"),
        )
        payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
        return f"{payload_b64}.{self._sign(payload_b64)}"

    def authorize_url(self, state: str, code_challenge: str | None = None) -> str:
        # Dev-эмуляция «страницы согласия»: фронт/тест возьмёт code и вызовет callback.
        params = {"state": state, "redirect_uri": self._redirect_uri, "mock": "1"}
        return f"{self._redirect_uri}?{urlencode(params)}"

    async def exchange_code(self, code: str, code_verifier: str | None = None) -> str:
        # code уже несёт профиль — «токен» == code.
        return code

    async def fetch_userinfo(self, token: str) -> OAuthUserInfo:
        try:
            payload_b64, sig = token.rsplit(".", 1)
        except ValueError as e:
            raise OAuthProviderError("mock: malformed code") from e
        if not hmac.compare_digest(sig, self._sign(payload_b64)):
            raise OAuthProviderError("mock: bad signature")
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded))
        return OAuthUserInfo(
            external_id=str(data["external_id"]),
            email=data.get("email", ""),
            name=data.get("name", ""),
            locale=_locale_to_language(data.get("locale")),
        )


# ─── PKCE helper ──────────────────────────────────────────────────────


def generate_pkce_pair() -> tuple[str, str]:
    """(code_verifier, code_challenge) для PKCE S256 (RFC 7636)."""
    verifier = secrets.token_urlsafe(64)[:96]
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).decode().rstrip("=")
    return verifier, challenge


# ─── Ошибка провайдера ────────────────────────────────────────────────


class OAuthProviderError(Exception):
    """Сбой обмена/запроса к провайдеру (не доменная ошибка резолвинга)."""


# ─── Фабрика ──────────────────────────────────────────────────────────


# Явная аннотация: без неё mypy выводит общий предок значений как object,
# и вызов конструктора в get_oauth_strategy теряет тип.
_REAL_STRATEGIES: dict[str, type[YandexStrategy] | type[VKStrategy]] = {
    "yandex": YandexStrategy,
    "vk": VKStrategy,
}


def get_oauth_strategy(provider: str, settings: Settings) -> OAuthStrategy:
    """Выбор стратегии по provider + наличию кред (ADR-007).

    - creds заданы → реальная стратегия (Yandex/VK).
    - creds пустые и oauth_allow_mock → MockStrategy (dev/CI).
    - creds пустые и mock запрещён → fail-fast (как get_payment_provider).

    Raises:
        ValueError: неизвестный провайдер, либо нет кред и mock запрещён.
    """
    if provider not in _REAL_STRATEGIES:
        raise ValueError(f"Unknown OAuth provider: {provider!r}")

    redirect_uri = f"{settings.frontend_base_url}/api/v1/auth/oauth/{provider}/callback"

    if provider == "yandex":
        client_id = settings.yandex_oauth_client_id
        client_secret = settings.yandex_oauth_client_secret
    else:  # vk
        client_id = settings.vk_oauth_client_id
        client_secret = settings.vk_oauth_client_secret

    if client_id and client_secret:
        return _REAL_STRATEGIES[provider](
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
        )

    if settings.oauth_allow_mock:
        return MockStrategy(
            provider=provider,
            signing_secret=settings.jwt_secret_key,
            redirect_uri=redirect_uri,
        )

    raise ValueError(
        f"OAuth provider {provider!r}: client_id/secret не заданы и oauth_allow_mock=False"
    )
