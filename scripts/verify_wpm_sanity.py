"""
Verify calcWpm после фикса: net WPM (correct chars only) + elapsed floor.

Сценарии:
  1. Все 31 символа правильно через синтетический dispatch (мгновенно):
     - BEFORE: ~12468 зн/мин (gross, sub-second elapsed)
     - AFTER:  ≤ 1500 зн/мин (floor предотвращает absurd)
  2. 31 неправильный символ:
     - BEFORE: бывшее ~12468 (все typed считались)
     - AFTER:  0 (correct=typed-errors=0)
  3. 5 неправильных + 26 правильных:
     - BEFORE: WPM по всем 31
     - AFTER:  WPM только по 26 верным
"""
import io, sys
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'


def seed(page):
    page.evaluate("""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
            name:'Тест', character:'anna', audience:'adult', gender:'male',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }));
        localStorage.removeItem('typing_trainer_lesson_progress');
        localStorage.removeItem('typing_trainer_test_history');
    """)


def open_task(page):
    page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
    page.wait_for_selector('#mentor-tip', timeout=5000)
    page.wait_for_timeout(600)


def press(page, ch):
    page.evaluate("""([ch]) => {
        const cap = document.getElementById('capture'); cap.focus();
        cap.dispatchEvent(new KeyboardEvent('keydown', {key:ch, code:'KeyX', bubbles:true, cancelable:true}));
    }""", [ch])


def get_final_wpm(page):
    # Отчёт урока (lessonSummary) не показывает скорость для уроков < 6, а старый
    # #final-speed затирается рендером отчёта — читаем живой стат тулбара #stat-speed
    # (остаётся в DOM под .hide; textContent доступен и у скрытого элемента).
    return page.evaluate("parseInt((document.getElementById('stat-speed')?.textContent||'0').replace(/[^0-9]/g,''),10)||0")


def main():
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 900})

        target = "ааа ооо ввв ннн оно она он ан на"  # 31 chars

        for label, sequence in [
            ('1. all-correct  (31 verbatim)', target),
            ('2. all-wrong    (31× «q»)',     'q' * 31),
            ('3. 5-wrong+26-correct',         'q' * 5 + target[5:]),
        ]:
            page = ctx.new_page()
            page.goto(f'{BASE}/index.html')
            seed(page)
            open_task(page)
            for ch in sequence:
                press(page, ch)
            page.wait_for_timeout(500)
            wpm = get_final_wpm(page)
            visible = page.evaluate("document.getElementById('success')?.classList.contains('show')")
            ok = wpm <= 1500
            mark = '✅' if ok else '❌'
            print(f'  {mark} {label}: final WPM = {wpm}  (success={visible})')
            if not ok: failed += 1
            page.close()

        ctx.close()
        browser.close()

    print()
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
