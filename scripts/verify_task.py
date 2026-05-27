"""
Phase 7 — Task execution verification.

A. Fresh user → redirect to index.html
B. Authorized + ?tier=tier1&lesson=1: scaffold renders, target text from lesson
C. Type correct chars → progress updates, stats tick
D. Complete the lesson → SuccessScreen shows, stars based on errors, lessonProgress saved
E. Retry button → state resets
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL_BASE = 'http://127.0.0.1:8000/task.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_task'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

PROFILE = {
    'name': 'Тест',
    'gender': 'm', 'audience': 'adult', 'character': 'anna', 'mentor': 'anna',
    'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True
}

LESSON1_TEXT = "ааа ооо ввв ннн оно она он ан на"  # 32 chars, error_limit=2

def shot(page, name, n):
    p = SCREENSHOT_DIR / f"{n:02d}_{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📷 {p.name}")

def type_char(page, ch):
    page.evaluate(
        """([c]) => {
            const inp = document.getElementById('tpHiddenInput');
            inp.focus();
            inp.value = inp.value + c;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
        }""",
        [ch]
    )

def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # A. Fresh user
        print("\n=== A. Fresh user → redirect ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.goto(URL_BASE)
        page.evaluate('localStorage.clear()')
        page.goto(URL_BASE)
        page.wait_for_timeout(800)
        if page.url.endswith('/index.html'):
            print(f"   ✅ redirect → {page.url}")
        else:
            findings.append(('FAIL', f'no anon redirect: {page.url}'))
            print(f"   ❌ no redirect: {page.url}")
        ctx.close()

        # B. Authorized — task scaffold
        print("\n=== B. ?tier=tier1&lesson=1: scaffold renders ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)
        page.goto(URL_BASE)
        page.evaluate(
            """(args) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(args.profile));
                localStorage.removeItem('typing_trainer_lesson_progress');
            }""",
            {'profile': PROFILE}
        )
        page.goto(f"{URL_BASE}?tier=tier1&lesson=1")
        page.wait_for_selector('#tpTarget', timeout=8000)
        page.wait_for_timeout(1200)

        checks = []
        def check(label, actual, exp):
            ok = exp(actual) if callable(exp) else (actual == exp)
            mark = '✅' if ok else '❌'
            print(f"   {mark} {label}: {actual!r}")
            checks.append(ok)

        check('mentor portrait svg', page.locator('#tpMentorPortrait svg').count(), lambda n: n >= 1)
        check('mentor tip non-empty', page.locator('#tpMentorTip').inner_text(), lambda s: len(s) > 5)
        check('exercise num "1.1"', page.locator('#tpExerciseNum').inner_text(), '1.1')
        check('attempt = 1', page.locator('#tpAttempt').inner_text(), '1')
        target_text = page.locator('#tpTarget').inner_text()
        check('target text from lesson',  target_text, lambda s: 'ааа' in s and 'на' in s)
        check('target rendered as spans', page.locator('#tpTarget span').count(), len(LESSON1_TEXT))
        check('progress count 0/32', page.locator('#tpProgressCount').inner_text(), '0/32')
        check('time 00:00', page.locator('#tpTime').inner_text(), '00:00')
        check('speed 0', page.locator('#tpSpeed').inner_text(), '0')
        check('finger legend 6 rows', page.locator('.tp-legend__row').count(), 6)
        shot(page, 'task_loaded', 1)

        # C. Type correct chars
        print("\n=== C. Type 5 correct chars → progress + stats update ===")
        for ch in LESSON1_TEXT[:5]:
            type_char(page, ch)
            page.wait_for_timeout(40)
        page.wait_for_timeout(400)
        check('progress count 5/32', page.locator('#tpProgressCount').inner_text(), '5/32')
        check('progress fill > 10%', page.locator('#tpProgressFill').get_attribute('style'), lambda s: 'width: 15%' in s or 'width: 16%' in s or '15.6' in s or float(s.split('width:')[1].split('%')[0].strip()) >= 10)
        # First 5 chars should be marked done
        done_count = page.locator('.tp-target__char--done').count()
        check('5 chars marked done', done_count, lambda n: n == 5)
        check('1 cur char highlighted', page.locator('.tp-target__char--cur').count(), 1)
        shot(page, 'task_progress_5', 2)

        # D. Complete the lesson
        print("\n=== D. Complete the lesson → SuccessScreen ===")
        for ch in LESSON1_TEXT[5:]:
            type_char(page, ch)
            page.wait_for_timeout(30)
        page.wait_for_timeout(800)
        # task-page--done should be set
        body_class = page.locator('body').get_attribute('class')
        check('body has task-page--done', body_class, lambda s: 'task-page--done' in s)
        check('success title shown', page.locator('#tpSuccessTitle').is_visible(), True)
        check('success grade text', page.locator('#tpSuccessGrade').inner_text(), lambda s: '5.0' in s and ('превосходно' in s or 'отлично' in s))
        check('success stars all on', page.locator('.tp-star--on').count(), 5)
        check('success speed > 0', page.locator('#tpFinalSpeed').inner_text(), lambda s: int(s) > 0)
        next_href = page.locator('#tpSuccessNext').get_attribute('href')
        check('next button → lesson 2', next_href, lambda s: 'lesson=2' in s)
        # lessonProgress saved
        saved = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_lesson_progress') || '{}')")
        check('lessonProgress[1] saved with stars=5', saved.get('1', {}).get('stars'), 5)
        check('lessonProgress[1].bestWPM > 0', saved.get('1', {}).get('bestWPM'), lambda n: n is not None and n > 0)
        shot(page, 'task_success', 3)
        ctx.close()

        # E. Retry button — fresh start
        print("\n=== E. Retry resets state ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.goto(URL_BASE)
        page.evaluate(
            """(args) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(args.profile));
                localStorage.removeItem('typing_trainer_lesson_progress');
            }""",
            {'profile': PROFILE}
        )
        page.goto(f"{URL_BASE}?tier=tier1&lesson=1")
        page.wait_for_selector('#tpTarget', timeout=8000)
        page.wait_for_timeout(800)
        # Type 3 chars then retry
        for ch in LESSON1_TEXT[:3]:
            type_char(page, ch)
            page.wait_for_timeout(30)
        page.wait_for_timeout(300)
        check('before retry: 3/32', page.locator('#tpProgressCount').inner_text(), '3/32')
        page.locator('#tpRetry').click()
        page.wait_for_timeout(400)
        check('after retry: 0/32', page.locator('#tpProgressCount').inner_text(), '0/32')
        check('attempt = 2', page.locator('#tpAttempt').inner_text(), '2')
        check('time reset 00:00', page.locator('#tpTime').inner_text(), '00:00')
        ctx.close()

        browser.close()
        if all(checks):
            print("\n✅ ALL B/C/D/E checks PASS")
        else:
            fails = checks.count(False)
            findings.append(('FAIL', f'{fails} task checks failed'))
            print(f"\n❌ {fails} of {len(checks)} checks failed")

    print("\n" + "=" * 60)
    if not findings:
        print("✅ VERIFY PASS")
        return 0
    print("❌ VERIFY FAIL:")
    for level, msg in findings:
        print(f"  • {msg}")
    return 1

sys.exit(main())
