"""
Verify api-client.js против REAL HTTP mock server (FastAPI на :9001).

Это contract test — проверяем что api-client посылает правильные запросы
И что fronts shape ответа правильно интерпретирует. Без этого баги
обнаруживаются только на интеграции с Бориса бекендом в Sprint 3.

Стратегия:
  1. Запустить _api_mock_server.py в subprocess
  2. Запустить static HTTP server (python -m http.server 8000)
  3. Playwright: открыть страницу, переключить api-client в useApi=true
     с baseUrl=http://127.0.0.1:9001/api/v1
  4. Прогнать 11 сценариев против реального HTTP, не localStorage
  5. Остановить mock server

Запуск:
    python scripts/verify_api_client_mock.py
"""
import io
import os
import signal
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

ROOT = Path(__file__).resolve().parent.parent
BASE_STATIC = 'http://127.0.0.1:8000'
BASE_API = 'http://127.0.0.1:9001/api/v1'


def wait_http(url: str, timeout: float = 10.0) -> bool:
    """Wait until URL отвечает 200."""
    import urllib.request, urllib.error
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1).read()
            return True
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError):
            time.sleep(0.2)
    return False


def main() -> int:
    failed = 0

    # ─── Start mock server ─────────────────────────────────────────
    print('Starting mock server on :9001...')
    mock_proc = subprocess.Popen(
        [sys.executable, str(ROOT / 'scripts' / '_api_mock_server.py')],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        cwd=str(ROOT),
    )
    if not wait_http(f'{BASE_API}/health', timeout=15):
        print('❌ Mock server не запустился')
        mock_proc.terminate()
        return 1
    print('✅ Mock server up')

    # ─── Start static server ───────────────────────────────────────
    print('Starting static server on :8000...')
    static_proc = subprocess.Popen(
        [sys.executable, '-m', 'http.server', '8000'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        cwd=str(ROOT),
    )
    if not wait_http(f'{BASE_STATIC}/index.html', timeout=10):
        print('❌ Static server не запустился')
        mock_proc.terminate(); static_proc.terminate()
        return 1
    print('✅ Static server up')

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            b = p.chromium.launch(headless=True, args=['--no-sandbox'])
            ctx = b.new_context(viewport={'width': 1400, 'height': 1000})
            page = ctx.new_page()
            errs = []
            page.on('pageerror', lambda e: errs.append(f'page: {e}'))
            page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

            # Загружаем index.html + инжектим api-client
            page.goto(f'{BASE_STATIC}/index.html')
            page.evaluate('localStorage.clear()')
            page.reload()
            page.wait_for_load_state('domcontentloaded')
            page.wait_for_timeout(300)
            page.add_script_tag(path=str(ROOT / 'assets' / 'js' / 'api-client.js'))
            page.wait_for_timeout(200)

            # Switch на real HTTP mock
            page.evaluate(f"""
                window.apiClient.setConfig({{
                    useApi: true,
                    baseUrl: '{BASE_API}',
                    timeout: 3000,
                    debug: true
                }});
            """)

            # ─── 1. Health endpoint hit ───
            health = page.evaluate("(async () => await window.apiClient.health())()")
            print(f'1) health: {health}')
            if health.get('status') == 'ok' and health.get('app') == 'typing-trainer-mock':
                print('   ✅ Hit реальный mock /health')
            else:
                failed += 1; print('   ❌')

            # ─── 2. getProfile ───
            profile = page.evaluate("(async () => await window.apiClient.getProfile())()")
            print(f'2) getProfile: name={profile.get("name")}, character={profile.get("character")}')
            if profile.get('name') == 'Mock User' and profile.get('character') == 'anna':
                print('   ✅ profile приходит из mock, не localStorage')
            else:
                failed += 1; print('   ❌')

            # ─── 3. updateProfile patches ───
            updated = page.evaluate("(async () => await window.apiClient.updateProfile({name: 'Updated', language: 'en'}))()")
            print(f'3) PATCH /me: name={updated.get("name")}, language={updated.get("language")}, character={updated.get("character")}')
            if updated.get('name') == 'Updated' and updated.get('language') == 'en' and updated.get('character') == 'anna':
                print('   ✅ partial patch применился (character сохранился)')
            else:
                failed += 1; print('   ❌')

            # ─── 4. getSettings ───
            settings = page.evaluate("(async () => await window.apiClient.getSettings())()")
            print(f'4) GET /me/settings: keyboard_type={settings.get("keyboard_type")}')
            if settings.get('keyboard_type') == 'classic':
                print('   ✅ settings shape матчит TSD §3.3')
            else:
                failed += 1; print('   ❌')

            # ─── 5. updateSettings ───
            settings_after = page.evaluate("(async () => await window.apiClient.updateSettings({keyboard_type: 'ergonomic', hide_indicator: true}))()")
            print(f'5) PATCH /me/settings: kbType={settings_after.get("keyboard_type")}, hide={settings_after.get("hide_indicator")}')
            if settings_after.get('keyboard_type') == 'ergonomic' and settings_after.get('hide_indicator') is True:
                print('   ✅ settings обновляются на server-side, не в profile (это правильно — отдельная таблица user_settings)')
            else:
                failed += 1; print('   ❌')

            # ─── 6. saveAttempt + server-side stars ───
            attempt = page.evaluate("""(async () => {
                return await window.apiClient.saveAttempt({
                    tier: 'tier1', lesson_num: 1, wpm: 45, accuracy: 96,
                    duration_ms: 60000, errors: 1, rhythm: 78,
                    completed_at: '2026-06-07T14:00:00Z'
                });
            })()""")
            print(f'6) POST /me/progress: stars={attempt.get("progress",{}).get("stars")}, newly_earned={len(attempt.get("newly_earned",[]))}')
            if (attempt.get('progress', {}).get('stars') == 4
                    and attempt.get('progress', {}).get('best_wpm') == 45
                    and len(attempt.get('newly_earned', [])) == 1):
                print('   ✅ server-side stars вычислены (errors=1 → 4★), newly_earned shape правильный')
            else:
                failed += 1; print('   ❌')

            # ─── 7. getProgress (после saveAttempt) ───
            progress = page.evaluate("(async () => await window.apiClient.getProgress())()")
            print(f'7) GET /me/progress: keys={list(progress.keys())}, 1.stars={progress.get("1",{}).get("stars")}')
            if '1' in progress and progress['1'].get('stars') == 4:
                print('   ✅ progress consistent после save')
            else:
                failed += 1; print('   ❌')

            # ─── 8. History pagination ───
            page.evaluate("""(async () => {
                for (let i = 2; i <= 12; i++) {
                    await window.apiClient.saveAttempt({
                        tier: 'tier1', lesson_num: i, wpm: 30+i, accuracy: 90,
                        duration_ms: 60000, errors: 0
                    });
                }
            })()""")
            hist1 = page.evaluate("(async () => await window.apiClient.getHistory({limit: 5}))()")
            hist2 = page.evaluate(f"(async () => await window.apiClient.getHistory({{cursor: '{hist1.get('next_cursor')}', limit: 5}}))()")
            print(f'8) History cursor: page1.items={len(hist1.get("items",[]))}, total={hist1.get("total")}, page2.items={len(hist2.get("items",[]))}')
            if (len(hist1.get('items', [])) == 5
                    and hist1.get('total') == 12
                    and len(hist2.get('items', [])) == 5
                    and hist1['items'][0]['lesson'] != hist2['items'][0]['lesson']):
                print('   ✅ cursor pagination на реальном HTTP работает')
            else:
                failed += 1; print('   ❌')

            # ─── 9. getLesson + access check ───
            lesson_1 = page.evaluate("(async () => await window.apiClient.getLesson('tier1', 1))()")
            access_6 = page.evaluate("(async () => await window.apiClient.checkLessonAccess('tier1', 6))()")
            print(f'9) Lessons: lesson_1.id={lesson_1.get("id")}, lesson_6.allowed={access_6.get("allowed")}')
            if (lesson_1.get('id') == 'tier1_lesson_01'
                    and access_6.get('allowed') is False
                    and access_6.get('reason') == 'paywall'):
                print('   ✅ lesson fetch + paywall enforcement работают')
            else:
                failed += 1; print('   ❌')

            # ─── 10. Auth migrate-guest ───
            migrate = page.evaluate("""(async () => {
                return await window.apiClient.migrateGuest({
                    profile: {name: 'Migrated', character: 'maxim'},
                    lessonProgress: {'5': {stars: 3, bestWPM: 25, bestAccuracy: 88, bestTime: 90, completedAt: '2026-06-01T00:00:00Z'}},
                    testHistory: [{lesson: 5, wpm: 25, accuracy: 88, duration: 90, completedAt: '2026-06-01T00:00:00Z'}]
                });
            })()""")
            print(f'10) migrate-guest: migrated={migrate.get("migrated")}, user.name={migrate.get("user",{}).get("name")}')
            if migrate.get('migrated') is True and migrate.get('user', {}).get('name') == 'Migrated':
                print('   ✅ migrateGuest accepts shape из localStorage_schema.md')
            else:
                failed += 1; print('   ❌')

            # ─── 11. Achievements endpoint ───
            achievements = page.evaluate("(async () => await window.apiClient.getAchievements())()")
            print(f'11) GET /me/achievements: count={len(achievements)}')
            if len(achievements) >= 2 and achievements[0].get('id'):
                print('   ✅ achievements server-side (а не пустой массив как в local mode)')
            else:
                failed += 1; print('   ❌')

            ctx.close()
            b.close()

        print()
        print(f'page/console errors: {len(errs)}')
        for e in errs[:5]:
            print('  ', e)
        print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
        return 0 if failed == 0 else 1

    finally:
        print()
        print('Stopping mock + static servers...')
        for proc, name in [(mock_proc, 'mock'), (static_proc, 'static')]:
            try:
                if os.name == 'nt':
                    proc.terminate()
                else:
                    proc.send_signal(signal.SIGTERM)
                proc.wait(timeout=5)
            except Exception:
                proc.kill()


if __name__ == '__main__':
    sys.exit(main())
