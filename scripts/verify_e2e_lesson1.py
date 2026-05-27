"""
End-to-end verification: onboarding → lesson 1 preview → start → toasts → finish.

Two parametrized runs validate the error-limit boundary fix in checkErrorThresholds():
  Run A — at-limit (errors == error_limit):
    - tooManyErrors fires (1 error)
    - errorLimitExceeded does NOT fire (2 errors == limit, after fix)
    - lessonCompleteSuccess fires at finish
  Run B — over-limit (errors > error_limit):
    - tooManyErrors fires
    - errorLimitExceeded fires (3 errors > limit)
    - lessonCompleteSuccess does NOT fire (errors > limit ⇒ outcome failure)

Lesson tier1/lesson_01: target_wpm=10, error_limit=2, text="ааа ооо ввв ннн оно она он ан на" (32 chars)
"""
import io
import sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/index.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_e2e_lesson1'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

LESSON_TEXT = "ааа ооо ввв ннн оно она он ан на"  # 32 chars
WRONG_CHARS = ['я', 'ш', 'ц']  # вместо а/а/а на позициях 0,1,2

# Множества фраз Анны из data/characters/anna.json для надёжного матчинга.
ANNA_TOO_MANY_KEYWORDS = ['не спеши', 'притормози', 'ничего страшного']
ANNA_LIMIT_KEYWORDS = ['ошибок многовато', 'не переживай', 'почти получилось']
ANNA_SUCCESS_KEYWORDS = ['красава', 'поздравляю', 'ты молодец']
ANNA_LESSON_START_KEYWORDS = ['готов к новому уроку', 'сегодня изучаем', 'начинаем']

TOAST_OBSERVER_JS = r"""
window.__toastLog = [];
const watch = () => {
    const c = document.querySelector('.toast-container');
    if (!c) { return setTimeout(watch, 100); }
    const obs = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('toast')) {
                    const msgEl = node.querySelector('.toast-message');
                    const iconEl = node.querySelector('.toast-icon');
                    window.__toastLog.push({
                        ts: Date.now(),
                        message: msgEl ? msgEl.textContent : '',
                        icon: iconEl ? iconEl.textContent : ''
                    });
                }
            }
        }
    });
    obs.observe(c, { childList: true });
};
watch();
"""

def screenshot(page, name, run_id):
    path = SCREENSHOT_DIR / f"{run_id}_{name}.png"
    page.screenshot(path=str(path), full_page=False)
    return path

def type_char(page, char):
    page.evaluate(
        """([ch]) => {
            const inp = document.getElementById('hiddenInput');
            inp.focus();
            inp.value = inp.value + ch;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
        }""",
        [char]
    )

def get_toasts(page):
    return page.evaluate("window.__toastLog || []")

def get_state(page):
    return page.evaluate("""() => {
        const t = window.typingTrainer;
        if (!t) return null;
        return {
            errors: t.state.errors,
            position: t.state.currentPosition,
            isActive: t.state.isTestActive,
            tooManyErrorsFired: t.state.tooManyErrorsFired,
            errorLimitFired: t.state.errorLimitFired,
            targetWpm: t.state.currentLesson && t.state.currentLesson.target_wpm,
            errorLimit: t.state.currentLesson && t.state.currentLesson.error_limit
        };
    }""")

def msg_matches(toasts, keywords):
    for t in toasts:
        m = (t.get('message') or '').lower()
        if any(k in m for k in keywords):
            return t['message']
    return None

def run_scenario(p, run_id, wrong_count, expected):
    """
    expected: dict with keys
        too_many: bool — tooManyErrors should fire
        err_limit: bool — errorLimitExceeded should fire
        success: bool — lessonCompleteSuccess should fire at finish
    """
    print(f"\n{'=' * 60}")
    print(f"RUN {run_id}: {wrong_count} ошибок (errors {'<=' if wrong_count <= 2 else '>'} limit=2)")
    print('=' * 60)

    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, locale='ru-RU')
    page = ctx.new_page()
    page_errors = []
    page.on('pageerror', lambda e: page_errors.append(f'page-error: {e}'))

    page.goto(URL)
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_selector('#userName', timeout=8000)
    page.wait_for_timeout(400)
    page.evaluate(TOAST_OBSERVER_JS)

    # Заполняем форму
    page.locator('#userName').fill('Тест')
    page.click('[data-gender="m"]')
    page.click('[data-audience="adult"]')
    page.click('[data-mentor="anna"]')
    page.wait_for_timeout(200)

    # Submit + preview
    page.click('#submitOnboarding')
    page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
    page.wait_for_selector('.lesson-preview', timeout=4000)
    page.wait_for_timeout(300)

    # Start lesson
    page.click('.start-btn')
    page.wait_for_timeout(700)
    state = get_state(page)
    print(f"  start: isActive={state['isActive']}, error_limit={state['errorLimit']}")
    screenshot(page, "01_started", run_id)

    # Type wrong chars
    for i in range(wrong_count):
        type_char(page, WRONG_CHARS[i % len(WRONG_CHARS)])
        page.wait_for_timeout(250)
    state = get_state(page)
    print(f"  after {wrong_count} ошибок: errors={state['errors']}, tooManyFired={state['tooManyErrorsFired']}, limitFired={state['errorLimitFired']}")
    toasts_typing = get_toasts(page)
    print(f"  toasts во время typing:")
    for t in toasts_typing:
        print(f"    • {t['message']!r}")
    screenshot(page, f"02_after_{wrong_count}_errors", run_id)

    # Finish lesson by typing remaining text correctly
    pos = state['position']
    remaining = LESSON_TEXT[pos:]
    for ch in remaining:
        type_char(page, ch)
        page.wait_for_timeout(15)
    page.wait_for_timeout(1500)
    state_final = get_state(page)
    toasts_final = get_toasts(page)
    print(f"  финал: isActive={state_final['isActive']}, errors={state_final['errors']}")
    print(f"  все toasts ({len(toasts_final)}):")
    for t in toasts_final:
        print(f"    • {t['message']!r}")
    screenshot(page, "03_finished", run_id)

    # Assertions
    too_many_msg = msg_matches(toasts_final, ANNA_TOO_MANY_KEYWORDS)
    err_limit_msg = msg_matches(toasts_final, ANNA_LIMIT_KEYWORDS)
    success_msg = msg_matches(toasts_final, ANNA_SUCCESS_KEYWORDS)

    results = []
    def check(label, actual, exp):
        ok = bool(actual) == exp
        mark = '✅' if ok else '❌'
        print(f"  {mark} {label}: expected={exp}, got={bool(actual)} ({actual!r})")
        results.append(ok)

    check('tooManyErrors', too_many_msg, expected['too_many'])
    check('errorLimitExceeded', err_limit_msg, expected['err_limit'])
    check('lessonCompleteSuccess', success_msg, expected['success'])

    browser.close()
    if page_errors:
        print(f"  ⚠️ page errors: {page_errors[:3]}")
    return all(results)


with sync_playwright() as p:
    # Run A: errors == error_limit (boundary). После фикса: success path, no errorLimit toast.
    run_a = run_scenario(p, 'A', wrong_count=2, expected={
        'too_many': True,
        'err_limit': False,   # ← фикс: при errors == limit toast не должен срабатывать
        'success': True
    })

    # Run B: errors > error_limit. errorLimit fires, no success.
    run_b = run_scenario(p, 'B', wrong_count=3, expected={
        'too_many': True,
        'err_limit': True,
        'success': False
    })

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"  Run A (at-limit, errors==2): {'✅ PASS' if run_a else '❌ FAIL'}")
print(f"  Run B (over-limit, errors==3): {'✅ PASS' if run_b else '❌ FAIL'}")
sys.exit(0 if (run_a and run_b) else 1)
