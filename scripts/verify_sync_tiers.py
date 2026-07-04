"""
Verify серверного синка прогресса на ВСЕХ тирах (§0.1 #4) — stack-гейт.

Гоняет против single-origin стека :8090 (docker compose --profile app):
  1. signup через UI (PoW в воркере) → dashboard, live-режим (useApi) активен;
  2. полный забег tier1/lesson_1 В ТРЕНАЖЁРЕ → task.js finishExercise сам
     шлёт saveAttempt → прогресс появился на сервере (доказывает автоматический
     путь тренажёр → /me/progress);
  3. saveAttempt по остальным 5 тирам через живой api-client (та же cookie);
  4. GET /me/progress (raw) → все 6 тиров сгруппированы {tier:{lesson:{...}}};
  5. разворот по активному тиру: getProgress() при current=ru_kids и current=tier1
     возвращает РАЗНЫЕ данные своего тира (изоляция тиров на фронте).

Запуск (паттерн verify_signup_flow):
    cd backend && docker compose --profile app up -d
    BASE=http://localhost:8090 python scripts/verify_sync_tiers.py
"""
import io
import os
import sys
import time
import uuid

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:8090').rstrip('/')
PASSWORD = 'correct-horse-battery-staple'
# Все тиры курса. tier1 проходится в тренажёре (п.2), остальные — через api-client.
API_TIERS = ['ru_kids', 'ru_teen', 'en_tier1', 'en_kids', 'en_teen']


def main() -> int:
    checks = []

    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {str(actual)[:90]!r}")
        checks.append(ok)

    email = f"sync_{uuid.uuid4().hex[:10]}@example.com"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # ── 1. signup → dashboard (live-режим) ──────────────────────────
        print("\n=== 1. signup → dashboard (useApi активен) ===")
        page.goto(f"{BASE}/auth.html?action=signup")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector('#signupForm', timeout=6000)
        page.fill('#signupForm [name=name]', 'Синк Тест')
        page.fill('#signupForm [name=email]', email)
        page.fill('#signupForm [name=password]', PASSWORD)
        page.select_option('#signupForm [name=audience]', 'adult')
        page.select_option('#signupForm [name=character]', 'anna')
        page.click('[data-action="signup-submit"]')
        page.wait_for_url('**/dashboard.html', timeout=30000)
        check('redirect → dashboard', page.url, lambda u: u.endswith('/dashboard.html'))
        use_api = page.evaluate(
            "(window.apiClient && window.apiClient.getConfig && window.apiClient.getConfig().useApi) === true"
            " || JSON.parse(localStorage.getItem('typing_trainer_api_client_config')||'{}').useApi === true")
        check('live-режим (useApi=true)', use_api, True)

        # ── 2. полный забег tier1/lesson_1 → saveAttempt из тренажёра ───
        print("\n=== 2. тренажёр tier1/1 → отчёт → прогресс на сервере ===")
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(600)
        target = page.evaluate("document.querySelector('#target .target__inner').textContent")
        page.evaluate(
            """(t) => { const c = document.getElementById('capture'); c.focus();
                for (const ch of t) c.dispatchEvent(new KeyboardEvent('keydown', {key: ch, code: 'KeyX', bubbles: true, cancelable: true})); }""",
            target)
        page.wait_for_timeout(800)
        check('отчёт урока показан', page.evaluate(
            "document.getElementById('success')?.classList.contains('show')"), True)
        # saveAttempt асинхронный — поллим сервер до появления tier1.
        tier1_on_server = None
        for _ in range(20):
            tier1_on_server = page.evaluate(
                "(async () => { try { const r = await window.apiClient._http('GET', '/me/progress');"
                " return (r && r.tier1 && r.tier1['1']) || null; } catch (e) { return null; } })()")
            if tier1_on_server:
                break
            time.sleep(0.5)
        check('tier1/1 на сервере (из тренажёра)', bool(tier1_on_server), True)
        # ProgressEntry — camelCase (schemas/me.py: контракт фронта)
        check('wpm > 0 в серверной записи',
              (tier1_on_server or {}).get('bestWPM', 0),
              lambda v: isinstance(v, (int, float)) and v > 0)

        # ── 3. saveAttempt по остальным тирам через живой api-client ────
        print("\n=== 3. saveAttempt по 5 тирам через api-client ===")
        for i, tier in enumerate(API_TIERS):
            # ВАЖНО: функцию НЕ самовызываем — playwright сам вызовет её с арг.
            r = page.evaluate(
                """async ([tier, wpm]) => {
                    try {
                        const r = await window.apiClient.saveAttempt({
                            tier, lesson_num: 1, wpm, accuracy: 95,
                            duration_ms: 30000, errors: 1, rhythm: 80,
                        });
                        return (r && r.progress && (r.progress.tier || tier)) || null;
                    } catch (e) { return 'ERR:' + (e && e.message); }
                }""",
                [tier, 30 + i])
            check(f'saveAttempt {tier}', r, lambda v, t=tier: v is not None and not str(v).startswith('ERR:'))

        # ── 4. GET /me/progress: все 6 тиров сгруппированы ───────────────
        print("\n=== 4. GET /me/progress — все тиры ===")
        by_tier = page.evaluate(
            "(async () => { try { return await window.apiClient._http('GET', '/me/progress'); }"
            " catch (e) { return {}; } })()") or {}
        for tier in ['tier1'] + API_TIERS:
            check(f'{tier} присутствует с уроком 1', bool(by_tier.get(tier, {}).get('1')), True)

        # ── 5. разворот по активному тиру (изоляция) ─────────────────────
        print("\n=== 5. getProgress() разворачивает по активному тиру ===")
        def flat_for(tier):
            # Функцию НЕ самовызываем — playwright вызовет её с аргументом.
            return page.evaluate(
                """async (tier) => {
                    localStorage.setItem('typing_trainer_current_lesson',
                        JSON.stringify({tier, lessonNumber: 1}));
                    try { return await window.apiClient.getProgress(); } catch (e) { return {}; }
                }""", tier) or {}
        kids = flat_for('ru_kids')
        t1 = flat_for('tier1')
        kids_wpm = (kids.get('1') or {}).get('bestWPM')
        t1_wpm = (t1.get('1') or {}).get('bestWPM')
        check('ru_kids: bestWPM = 30 (что слали)', kids_wpm, lambda v: v == 30)
        check('tier1: bestWPM ≠ ru_kids (изоляция тиров)', t1_wpm,
              lambda v: isinstance(v, (int, float)) and v > 0 and v != 30)

        ctx.close()
        browser.close()

    total, passed = len(checks), sum(checks)
    print(f"\n{'=' * 50}\n{'✅' if passed == total else '❌'} verify_sync_tiers: {passed}/{total}")
    return 0 if passed == total else 1


if __name__ == '__main__':
    sys.exit(main())
