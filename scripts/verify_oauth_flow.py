"""
Verify OAuth flow (Sprint 2, ADR-007) against the LIVE stack on VM.

Прогоняет MockStrategy end-to-end через nginx-прокси (:8090, same-origin):
  1. GET /api/v1/auth/oauth/yandex/start → 302 + state в Redis
  2. GET callback?code=<mock>&state=<state> → наши cookies + 302 onboarding (new)
  3. Повтор того же external_id → тот же user (is_new=False), дубля нет
  4. email-link: signup локального юзера → OAuth с тем же email → линк, без нового User

БЕЗ внешних зависимостей — только stdlib (urllib) + docker exec для DB/Redis assert.
Запуск на VM: python3 verify_oauth_flow.py   (стек уже поднят: compose --profile app)
"""
import base64
import hashlib
import hmac
import http.cookiejar
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request

BASE = "http://localhost:8090"
API = f"{BASE}/api/v1/auth/oauth"
# Совпадает с JWT_SECRET_KEY в docker-compose.yml (dev).
SECRET = b"dev-only-jwt-secret-change-me-32+chars-xx"

checks = []


def check(label, ok, detail=""):
    checks.append(bool(ok))
    mark = "PASS" if ok else "FAIL"
    print(f"   [{mark}] {label}" + (f" :: {detail}" if detail else ""))


def make_mock_code(external_id, email, name="", locale="ru"):
    payload = json.dumps(
        {"external_id": external_id, "email": email, "name": name, "locale": locale},
        separators=(",", ":"),
    )
    p64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    sig = hmac.new(SECRET, p64.encode(), hashlib.sha256).hexdigest()
    return f"{p64}.{sig}"


def _opener():
    """Opener БЕЗ авто-follow редиректов — чтобы поймать 302/Set-Cookie."""
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(NoRedirect, urllib.request.HTTPCookieProcessor(cj)), cj


def get_no_redirect(url, cookie_header=None):
    op, cj = _opener()
    req = urllib.request.Request(url)
    if cookie_header:
        req.add_header("Cookie", cookie_header)
    try:
        resp = op.open(req, timeout=15)
        return resp.status, resp.getheaders(), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, list(e.headers.items()), e.read()


def _location(headers):
    for k, v in headers:
        if k.lower() == "location":
            return v
    return ""


def _set_cookie_names(headers):
    """Все имена cookie из (повторяющихся) Set-Cookie заголовков."""
    names = []
    for k, v in headers:
        if k.lower() == "set-cookie":
            name = v.split("=", 1)[0].strip()
            names.append(name)
    return names


def dexec(sql):
    """SELECT в postgres контейнере, вернуть строки как список."""
    cmd = [
        "docker", "exec", "tt_postgres",
        "psql", "-U", "tt_user", "-d", "typing_trainer", "-tAc", sql,
    ]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return out.stdout.strip()


def redis_exists(key):
    out = subprocess.run(
        ["docker", "exec", "tt_redis", "redis-cli", "exists", key],
        capture_output=True, text=True, timeout=10,
    )
    return out.stdout.strip() == "1"


def parse_state_from_location(location):
    q = urllib.parse.urlparse(location).query
    return urllib.parse.parse_qs(q).get("state", [None])[0]


def run_signup(email):
    """Локальный signup (для email-link кейса). Капчу обходим dev-bypass
    токеном (captcha.py: app_env=dev + challenge==DEV_BYPASS_TOKEN → True)."""
    payload = json.dumps({
        "email": email, "password": "correct-horse-battery-staple",
        "name": "Link User", "audience": "adult", "character": "maxim",
        "gender": None, "language": "ru",
        "captcha_challenge": "test-bypass-captcha",
        "captcha_signature": "x", "captcha_nonce": "x", "honeypot": "",
    }).encode()
    op, cj = _opener()
    req = urllib.request.Request(f"{BASE}/api/v1/auth/signup", data=payload,
                                 headers={"Content-Type": "application/json"})
    try:
        resp = op.open(req, timeout=30)
        return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def main():
    ext_id = f"ymock-{int(time.time())}"
    email = f"oauth_{int(time.time())}@example.com"

    print("=== 1. start → 302 + state в Redis ===")
    st, hh, _ = get_no_redirect(f"{API}/yandex/start")
    loc = _location(hh)
    check("start возвращает 302", st == 302, f"status={st}")
    # MockStrategy (creds пустые + oauth_allow_mock): authorize_url — локальный
    # dev-URL callback'а с mock=1 (весь flow без реального Yandex). Реальная
    # стратегия дала бы oauth.yandex.ru/authorize — здесь проверяем mock-путь.
    check("Location → authorize-URL со state",
          "/auth/oauth/yandex/callback" in loc and "mock=1" in loc, loc[:100])
    state = parse_state_from_location(loc)
    check("state присутствует в URL", bool(state), state)
    check("state лёг в Redis (oauth:state:*)", redis_exists(f"oauth:state:{state}"))

    print("\n=== 2. callback (новый юзер) → cookies + 302 onboarding ===")
    code = make_mock_code(ext_id, email, name="Мок Юзер", locale="ru")
    st, hh, _ = get_no_redirect(f"{API}/yandex/callback?code={urllib.parse.quote(code)}&state={state}")
    loc = _location(hh)
    cookies = _set_cookie_names(hh)
    check("callback 302", st == 302, f"status={st}")
    check("редирект на onboarding?oauth=1&new=1", "onboarding.html" in loc and "new=1" in loc, loc)
    check("выставлен access_token cookie", "access_token" in cookies, str(cookies))
    check("выставлен refresh_token cookie", "refresh_token" in cookies, str(cookies))
    check("state удалён из Redis (GETDEL)", not redis_exists(f"oauth:state:{state}"))

    # DB assert
    row = dexec(
        "SELECT audience, email_verified, password_hash IS NULL, character "
        f"FROM users WHERE email='{email}';"
    )
    check("User создан", bool(row), row)
    if row:
        parts = row.split("|")
        check("audience=adult", parts[0] == "adult", parts[0])
        check("email_verified=true", parts[1] == "t", parts[1])
        check("password_hash IS NULL", parts[2] == "t", parts[2])
    oa = dexec(
        f"SELECT provider, external_id FROM oauth_accounts WHERE external_id='{ext_id}';"
    )
    check("OAuthAccount(yandex, ext_id) создан", oa == f"yandex|{ext_id}", oa)
    us = dexec(f"SELECT count(*) FROM user_settings us JOIN users u ON u.id=us.user_id WHERE u.email='{email}';")
    check("UserSettings создан", us == "1", us)

    print("\n=== 3. повтор того же external_id → тот же user, без дубля ===")
    # новый start → новый state
    st, hh, _ = get_no_redirect(f"{API}/yandex/start")
    state2 = parse_state_from_location(_location(hh))
    code2 = make_mock_code(ext_id, email, name="Мок Юзер", locale="ru")
    st, hh, _ = get_no_redirect(f"{API}/yandex/callback?code={urllib.parse.quote(code2)}&state={state2}")
    loc = _location(hh)
    check("повторный callback 302", st == 302, f"status={st}")
    check("редирект на dashboard (не new)", "dashboard.html" in loc, loc)
    cnt_users = dexec(f"SELECT count(*) FROM users WHERE email='{email}';")
    check("дубля User нет (ровно 1)", cnt_users == "1", cnt_users)
    cnt_oa = dexec(f"SELECT count(*) FROM oauth_accounts WHERE external_id='{ext_id}';")
    check("дубля OAuthAccount нет (ровно 1)", cnt_oa == "1", cnt_oa)

    print("\n=== 4. email-link: локальный signup → OAuth тем же email ===")
    link_email = f"link_{int(time.time())}@example.com"
    st, body = run_signup(link_email)
    check("локальный signup 201", st == 201, f"status={st} body={body[:120]}")
    users_before = dexec(f"SELECT id, password_hash IS NOT NULL FROM users WHERE email='{link_email}';")
    link_ext = f"ymock-link-{int(time.time())}"
    # OAuth с тем же email, но новый external_id
    st, hh, _ = get_no_redirect(f"{API}/yandex/start")
    state3 = parse_state_from_location(_location(hh))
    code3 = make_mock_code(link_ext, link_email, name="Link User", locale="ru")
    st, hh, _ = get_no_redirect(f"{API}/yandex/callback?code={urllib.parse.quote(code3)}&state={state3}")
    loc = _location(hh)
    check("link callback 302", st == 302, f"status={st}")
    check("линк → dashboard (существующий юзер)", "dashboard.html" in loc, loc)
    cnt_users = dexec(f"SELECT count(*) FROM users WHERE email='{link_email}';")
    check("новый User НЕ создан (ровно 1)", cnt_users == "1", cnt_users)
    linked = dexec(
        "SELECT oa.provider, oa.external_id FROM oauth_accounts oa "
        f"JOIN users u ON u.id=oa.user_id WHERE u.email='{link_email}';"
    )
    check("OAuthAccount прилинкован к существующему юзеру", linked == f"yandex|{link_ext}", linked)
    verified = dexec(f"SELECT email_verified FROM users WHERE email='{link_email}';")
    check("email_verified выставлен true при линке", verified == "t", verified)
    pw_still = dexec(f"SELECT password_hash IS NOT NULL FROM users WHERE email='{link_email}';")
    check("password локального юзера сохранён (не затёрт)", pw_still == "t", pw_still)

    passed = sum(checks)
    total = len(checks)
    print(f"\n{'='*52}\n{'PASS' if passed == total else 'FAIL'} verify_oauth_flow: {passed}/{total}\n{'='*52}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
