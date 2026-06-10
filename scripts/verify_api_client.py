"""
Verify api-client.js — adapter работает в local-mode (useApi=false) без backend.

Сценарии:
  1. Init: загружается, config дефолтный (useApi=false)
  2. Profile CRUD через localStorage fallback
  3. Settings CRUD
  4. Progress / Attempt save
  5. History pagination через cursor
  6. Lessons fetch (через ту же data/lessons/ что и lesson-loader.js)
  7. Lesson access — paywall (lesson > 5 → not allowed)
  8. Auth signup/signin/signout в local mode
  9. Health endpoint в local mode возвращает «local-fallback»
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
BASE = 'http://127.0.0.1:8000'


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 1000})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

        # Открываем dashboard (нужен профиль чтобы router-guard не редиректил, но api-client нам нужен — подгрузим вручную)
        page.goto(f'{BASE}/index.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(300)

        # Инжектим api-client напрямую (на index.html его нет)
        page.add_script_tag(path=str(ROOT / 'assets' / 'js' / 'api-client.js'))
        page.wait_for_timeout(200)

        # ─── 1. Init ───
        config = page.evaluate("(async () => { await window.apiClient.init(); return window.apiClient.getConfig(); })()")
        print(f'1) init: config={config}')
        if config.get('useApi') is False and 'baseUrl' in config:
            print('   ✅ дефолты применены')
        else:
            failed += 1; print('   ❌')

        # ─── 2. Profile CRUD ───
        profile_after = page.evaluate("""(async () => {
            await window.apiClient.updateProfile({name: 'Тест', character: 'anna', language: 'ru'});
            return await window.apiClient.getProfile();
        })()""")
        ls_profile = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'{}')")
        print(f'2) Profile CRUD: returned={profile_after.get("name")!r}, localStorage={ls_profile.get("name")!r}')
        if profile_after.get('name') == 'Тест' and ls_profile.get('name') == 'Тест':
            print('   ✅ profile попал в localStorage')
        else:
            failed += 1; print('   ❌')

        # ─── 3. Settings CRUD ───
        settings_default = page.evaluate("window.apiClient.getSettings()")
        settings_after = page.evaluate("""(async () => {
            await window.apiClient.updateSettings({keyboardType: 'ergonomic', hideIndicator: true});
            return await window.apiClient.getSettings();
        })()""")
        print(f'3) Settings: default kbType={settings_default.get("keyboardType") if isinstance(settings_default, dict) else "(async)"}, after={settings_after.get("keyboardType")}')
        if settings_after.get('keyboardType') == 'ergonomic' and settings_after.get('hideIndicator') is True:
            print('   ✅ settings обновлены в profile')
        else:
            failed += 1; print('   ❌')

        # ─── 4. Progress / saveAttempt ───
        attempt_result = page.evaluate("""(async () => {
            return await window.apiClient.saveAttempt({
                tier: 'tier1', lesson_num: 1, wpm: 45, accuracy: 95,
                duration_ms: 60000, errors: 1
            });
        })()""")
        progress = page.evaluate("(async () => await window.apiClient.getProgress())()")
        print(f'4) saveAttempt: stars={attempt_result.get("progress",{}).get("stars")}, progress["1"].bestWPM={progress.get("1",{}).get("bestWPM")}')
        if (attempt_result.get('progress', {}).get('stars') == 4
                and progress.get('1', {}).get('bestWPM') == 45):
            print('   ✅ progress + attempt сохранены, stars вычислены (errors=1 → 4★)')
        else:
            failed += 1; print('   ❌')

        # ─── 5. History pagination ───
        page.evaluate("""(async () => {
            for (let i = 2; i <= 15; i++) {
                await window.apiClient.saveAttempt({
                    tier:'tier1', lesson_num: i, wpm: 30+i, accuracy: 90,
                    duration_ms: 60000, errors: 0
                });
            }
        })()""")
        page1 = page.evaluate("(async () => await window.apiClient.getHistory({limit: 5}))()")
        page2 = page.evaluate(f"(async () => await window.apiClient.getHistory({{cursor:'{page1.get('next_cursor')}', limit: 5}}))()")
        print(f'5) History pagination: page1.items={len(page1.get("items",[]))}, page1.total={page1.get("total")}, page2.items={len(page2.get("items",[]))}')
        if (len(page1.get('items', [])) == 5 and page1.get('total') == 15
                and len(page2.get('items', [])) == 5
                and page1['items'][0]['lesson'] != page2['items'][0]['lesson']):
            print('   ✅ cursor pagination работает')
        else:
            failed += 1; print('   ❌')

        # ─── 6. Lesson fetch ───
        lesson_1 = page.evaluate("(async () => await window.apiClient.getLesson('tier1', 1))()")
        print(f'6) getLesson tier1/1: id={lesson_1.get("id") if lesson_1 else None}, title={lesson_1.get("title") if lesson_1 else None}')
        if lesson_1 and lesson_1.get('id') == 'tier1_lesson_01':
            print('   ✅ урок подгружается с диска как до этого')
        else:
            failed += 1; print('   ❌')

        # ─── 7. Lesson access paywall ───
        access_5 = page.evaluate("(async () => await window.apiClient.checkLessonAccess('tier1', 5))()")
        access_6 = page.evaluate("(async () => await window.apiClient.checkLessonAccess('tier1', 6))()")
        print(f'7) Paywall: lesson 5 → {access_5}, lesson 6 → {access_6}')
        if access_5.get('allowed') is True and access_6.get('allowed') is False and access_6.get('reason') == 'paywall':
            print('   ✅ FREE_LESSON_LIMIT=5 enforced')
        else:
            failed += 1; print('   ❌')

        # ─── 8. Auth в local mode ───
        signin_result = page.evaluate("(async () => await window.apiClient.signin({email:'x', password:'y'}))()")
        signout_result = page.evaluate("(async () => await window.apiClient.signout())()")
        cur_user_after_signout = page.evaluate("(async () => await window.apiClient.getCurrentUser())()")
        print(f'8) Auth local: signin user={signin_result.get("user",{}).get("name")}, signout={signout_result}')
        # после signout onboardingCompleted удалён, getCurrentUser возвращает profile без флага
        ok8 = (signin_result.get('user', {}).get('name') == 'Тест'
               and signout_result is True
               and (cur_user_after_signout is None or not cur_user_after_signout.get('onboardingCompleted')))
        if ok8:
            print('   ✅ auth local-mode семантика корректна')
        else:
            failed += 1; print('   ❌')

        # ─── 9. Health ───
        health = page.evaluate("(async () => await window.apiClient.health())()")
        print(f'9) Health: {health}')
        if health.get('status') == 'ok' and health.get('mode') == 'local-fallback':
            print('   ✅ health возвращает local-fallback marker')
        else:
            failed += 1; print('   ❌')

        # ─── 10. Switch useApi=true + fallback при отсутствии backend ───
        page.evaluate("window.apiClient.setConfig({useApi: true, baseUrl: 'http://127.0.0.1:9999/api/v1', timeout: 500, debug: true})")
        # Backend на :9999 не существует — должен fallback на localStorage
        profile_after_switch = page.evaluate("(async () => await window.apiClient.getProfile())()")
        print(f'10) Fallback при API недоступен: profile.name={profile_after_switch.get("name") if profile_after_switch else None}')
        if profile_after_switch and profile_after_switch.get('name') == 'Тест':
            print('   ✅ graceful fallback на localStorage')
        else:
            failed += 1; print('   ❌')

        ctx.close(); b.close()

    print()
    print(f'page/console errors: {len(errs)}')
    for e in errs[:5]: print('  ', e)
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
