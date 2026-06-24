"""
Verify auth flow (Sprint 1 gate) — S1.9 frontend ↔ backend auth-core.

Гоняет auth.html против ЖИВОГО backend: signup → dashboard, signin → dashboard,
forgot → сообщение; опционально (если доступен mailpit REST) — verify-email и
reset по реальному токену из письма.

⚠️ ТРЕБОВАНИЯ К ОКРУЖЕНИЮ (важно — иначе cookies не пройдут):
  Frontend и API ДОЛЖНЫ обслуживаться с ОДНОГО origin. httpOnly-cookie auth
  выставлены с SameSite=Lax — при cross-origin (фронт :8001 ↔ api :8000) браузер
  НЕ прикрепит их к fetch. В dev поднимать через reverse-proxy: один origin,
  где `/api/v1/*` проксируется на uvicorn, а статика отдаётся рядом.
  (Задача инфры — Дима; см. blockers B1-002/Docker-прогон.)

  Переменные окружения:
    BASE         — origin со статикой + проксированным /api/v1 (default http://127.0.0.1:8001)
    MAILPIT_URL  — REST mailpit для извлечения токенов (default http://127.0.0.1:8025; опц.)

Запуск (на машине с поднятым стеком + playwright):
    BASE=http://127.0.0.1:8001 python scripts/verify_signup_flow.py
"""
import io
import os
import re
import sys
import time

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

import urllib.request

from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8001').rstrip('/')
MAILPIT_URL = os.environ.get('MAILPIT_URL', 'http://127.0.0.1:8025').rstrip('/')
PASSWORD = 'correct-horse-battery-staple'


def _unique_email() -> str:
    return f"e2e_{int(time.time() * 1000)}@example.com"


def _mailpit_latest_link(to_email: str, action: str) -> str | None:
    """Достать ссылку auth.html?action=<action>&token=... из последнего письма mailpit."""
    try:
        with urllib.request.urlopen(f"{MAILPIT_URL}/api/v1/messages", timeout=5) as r:
            data = r.read().decode()
    except Exception as e:  # noqa: BLE001
        print(f"   ⚠️ mailpit недоступен ({e}) — verify/reset шаги пропущены")
        return None
    import json
    msgs = json.loads(data).get('messages', [])
    for m in msgs:
        mid = m.get('ID')
        try:
            with urllib.request.urlopen(f"{MAILPIT_URL}/api/v1/message/{mid}", timeout=5) as r:
                body = r.read().decode()
        except Exception:  # noqa: BLE001
            continue
        match = re.search(r'auth\.html\?action=' + action + r'&token=([A-Za-z0-9_\-]+)', body)
        if match:
            return f"{BASE}/auth.html?action={action}&token={match.group(1)}"
    return None


def main() -> int:
    checks = []

    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    email = _unique_email()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # ── 1. SIGNUP → dashboard ────────────────────────────────────────
        print("\n=== 1. signup → dashboard ===")
        page.goto(f"{BASE}/auth.html?action=signup")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector('#signupForm', timeout=6000)
        page.fill('#signupForm [name=name]', 'E2E Тест')
        page.fill('#signupForm [name=email]', email)
        page.fill('#signupForm [name=password]', PASSWORD)
        page.select_option('#signupForm [name=audience]', 'adult')
        page.select_option('#signupForm [name=character]', 'maxim')
        page.click('[data-action="signup-submit"]')
        # PoW решается в воркере (~до неск. секунд при difficulty=18) + редирект
        page.wait_for_url('**/dashboard.html', timeout=30000)
        check('redirect → dashboard', page.url, lambda u: u.endswith('/dashboard.html'))
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'null')")
        check('профиль записан', bool(prof and prof.get('email') == email and prof.get('onboardingCompleted')), True)

        # ── 2. SIGNOUT → SIGNIN → dashboard ──────────────────────────────
        print("\n=== 2. signout → signin → dashboard ===")
        page.evaluate("window.apiClient && window.apiClient.signout && window.apiClient.signout()")
        page.wait_for_timeout(300)
        page.goto(f"{BASE}/auth.html")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector('#signinForm', timeout=6000)
        page.fill('#signinForm [name=email]', email)
        page.fill('#signinForm [name=password]', PASSWORD)
        page.click('[data-action="signin-submit"]')
        page.wait_for_url('**/dashboard.html', timeout=15000)
        check('signin → dashboard', page.url, lambda u: u.endswith('/dashboard.html'))

        # ── 3. WRONG PASSWORD → ошибка, остаёмся на auth ─────────────────
        print("\n=== 3. signin с неверным паролем → 401 баннер ===")
        page.goto(f"{BASE}/auth.html")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector('#signinForm', timeout=6000)
        page.fill('#signinForm [name=email]', email)
        page.fill('#signinForm [name=password]', 'totally-wrong-pw')
        page.click('[data-action="signin-submit"]')
        page.wait_for_selector('#authBanner[data-kind="error"]', timeout=10000)
        check('баннер ошибки показан', page.locator('#authBanner').is_visible(), True)
        check('остались на auth.html', page.url, lambda u: 'auth.html' in u)

        # ── 4. FORGOT → message ──────────────────────────────────────────
        print("\n=== 4. forgot → подтверждение ===")
        page.goto(f"{BASE}/auth.html?action=forgot")
        page.wait_for_selector('#forgotForm', timeout=6000)
        page.fill('#forgotForm [name=email]', email)
        page.click('[data-action="forgot-submit"]')
        page.wait_for_selector('[data-view="message"]:not([hidden])', timeout=15000)
        check('forgot → message view', page.locator('[data-view="message"]').is_visible(), True)

        # ── 5. VERIFY-EMAIL по токену из mailpit (опц.) ──────────────────
        print("\n=== 5. verify-email по реальному токену (mailpit) ===")
        verify_link = _mailpit_latest_link(email, 'verify')
        if verify_link:
            page.goto(verify_link)
            page.wait_for_selector('[data-view="message"]:not([hidden])', timeout=10000)
            title = page.locator('[data-msg-title]').inner_text()
            check('email подтверждён', '✓' in title or 'подтверж' in title.lower(), True)

        # ── 6. RESET по токену из mailpit (опц.) ─────────────────────────
        print("\n=== 6. reset пароля по токену (mailpit) ===")
        reset_link = _mailpit_latest_link(email, 'reset')
        if reset_link:
            new_pw = 'brand-new-passw0rd'
            page.goto(reset_link)
            page.wait_for_selector('#resetForm', timeout=8000)
            page.fill('#resetForm [name=password]', new_pw)
            page.click('[data-action="reset-submit"]')
            page.wait_for_selector('[data-view="message"]:not([hidden])', timeout=10000)
            # И вход новым паролем
            page.goto(f"{BASE}/auth.html")
            page.evaluate("localStorage.clear()"); page.reload()
            page.wait_for_selector('#signinForm', timeout=6000)
            page.fill('#signinForm [name=email]', email)
            page.fill('#signinForm [name=password]', new_pw)
            page.click('[data-action="signin-submit"]')
            page.wait_for_url('**/dashboard.html', timeout=15000)
            check('вход новым паролем', page.url, lambda u: u.endswith('/dashboard.html'))

        browser.close()

    passed = sum(checks)
    total = len(checks)
    print(f"\n{'='*48}\n{'✅' if passed == total else '❌'} verify_signup_flow: {passed}/{total}\n{'='*48}")
    return 0 if passed == total else 1


if __name__ == '__main__':
    sys.exit(main())
