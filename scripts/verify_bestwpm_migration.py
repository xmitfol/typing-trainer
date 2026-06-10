"""
Verify миграция bestWPM в router-guard.js:
  1. Seed localStorage с baseline-багнутыми значениями (bestWPM: 12468)
  2. Открыть любую защищённую страницу — migration выполняется
  3. После миграции bestWPM ≤ 1500 и MIG_KEY установлен
  4. Повторный запуск — миграция НЕ выполняется снова
  5. Свежий WPM в finishExercise не сохраняется > 1500
"""
import io, sys
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 900})
        page = ctx.new_page()

        # 1. seed bagged values
        page.goto(f'{BASE}/index.html')
        page.evaluate("""
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
                name:'Тест', character:'anna', audience:'adult', gender:'m',
                language:'ru', onboardingCompleted:true,
                keyboardType:'classic', keyboardLayout:'standard'
            }));
            localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({
                '1': { stars: 5, bestWPM: 12468, bestAccuracy: 100, bestTime: 0.05 },
                '2': { stars: 3, bestWPM: 50, bestAccuracy: 92, bestTime: 60 },
                '3': { stars: 4, bestWPM: 9999, bestAccuracy: 85, bestTime: 30 }
            }));
            localStorage.setItem('typing_trainer_test_history', JSON.stringify([
                { lesson: 1, wpm: 12468, accuracy: 100, duration: 0.05 },
                { lesson: 2, wpm: 50, accuracy: 92, duration: 60 }
            ]));
            // НЕ ставим migration flag — пусть мигратор сработает
        """)

        # 2. Open dashboard (protected page → router-guard fires)
        page.goto(f'{BASE}/dashboard.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(600)

        progress = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_lesson_progress')||'{}')")
        history = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_test_history')||'[]')")
        mig_flag = page.evaluate("localStorage.getItem('typing_trainer_migration_bestwpm_v1')")

        print(f'1) После миграции:')
        print(f'   lesson_1.bestWPM = {progress.get("1", {}).get("bestWPM")} (был 12468)')
        print(f'   lesson_2.bestWPM = {progress.get("2", {}).get("bestWPM")} (был 50)')
        print(f'   lesson_3.bestWPM = {progress.get("3", {}).get("bestWPM")} (был 9999)')
        print(f'   history[0].wpm = {history[0].get("wpm")} (был 12468)')
        print(f'   history[1].wpm = {history[1].get("wpm")} (был 50)')
        print(f'   migration flag = {mig_flag!r}')

        ok1 = (progress.get('1', {}).get('bestWPM') == 1500
               and progress.get('2', {}).get('bestWPM') == 50
               and progress.get('3', {}).get('bestWPM') == 1500
               and history[0].get('wpm') == 1500
               and history[1].get('wpm') == 50
               and mig_flag == '1')
        if ok1: print('   ✅ миграция выполнена корректно')
        else: failed += 1; print('   ❌')

        # 3. Повторное открытие — flag установлен, миграция не должна снова трогать данные
        # Установим заведомо «новый» багнутый bestWPM руками и проверим, что он НЕ обрезался
        page.evaluate("""
            const p = JSON.parse(localStorage.getItem('typing_trainer_lesson_progress'));
            p['1'].bestWPM = 5000;  // нарочно «грязное» — миграция должна быть idempotent
            localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(p));
        """)
        page.reload()
        page.wait_for_timeout(500)
        progress2 = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_lesson_progress')||'{}')")
        print(f'2) Повторное открытие: lesson_1.bestWPM = {progress2.get("1", {}).get("bestWPM")} (нарочно 5000)')
        if progress2.get('1', {}).get('bestWPM') == 5000:
            print('   ✅ idempotent — миграция не пробежала повторно')
        else:
            failed += 1; print('   ❌ миграция сработала повторно')

        # 4. write-side cap в task.js — пройдём user-урок и проверим что bestWPM ≤ 1500
        page.evaluate("""
            localStorage.removeItem('typing_trainer_migration_bestwpm_v1');
            localStorage.removeItem('typing_trainer_lesson_progress');
            localStorage.setItem('typing_trainer_user_lessons', JSON.stringify([{
                id: 999, title: 'Cap test', text: 'ааа', target_wpm: 30, error_limit: 2,
                createdAt: new Date().toISOString()
            }]));
        """)
        page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
        page.wait_for_selector('#capture', timeout=5000)
        page.wait_for_timeout(600)
        # синтетически пройдём урок 1 — должен дать кап
        target_full = page.evaluate("""
            (async () => {
                const r = await fetch('data/lessons/tier1/lesson_01.json');
                const j = await r.json();
                return j.text;
            })()
        """)
        page.evaluate("document.getElementById('capture').focus()")
        for ch in target_full:
            page.evaluate("""([ch]) => {
                const cap = document.getElementById('capture');
                cap.dispatchEvent(new KeyboardEvent('keydown', {key:ch, code:'KeyX', bubbles:true, cancelable:true}));
            }""", [ch])
        page.wait_for_timeout(700)
        new_progress = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_lesson_progress')||'{}')")
        new_best = new_progress.get('1', {}).get('bestWPM')
        print(f'3) После finishExercise: lesson_1.bestWPM = {new_best} (cap ≤ 1500)')
        if new_best is not None and new_best <= 1500:
            print('   ✅ write-side cap работает')
        else:
            failed += 1; print('   ❌ write-side cap не работает')

        ctx.close()
        b.close()

    print()
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
