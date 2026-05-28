"""
Phase 6 — Lesson reading page verification.

A. Fresh user → redirect to index.html
B. Authorized user + URL ?tier=tier1&lesson=6 → читает урок 6, рендерит все секции:
   - top bar с crumbs + progress + metrics
   - title block с badge «МОДУЛЬ 1 · УРОК 6», h1 + subtitle
   - mentor intro (Anna для adult/m) с portrait + greet (character_tips.anna)
   - lead paragraph
   - tips → narrative parags / callouts
   - inline exercise preview (text + dots + count + «Открыть тренажёр →»)
   - prev/next nav с реальными названиями
C. URL ?lesson=1 → prev disabled (начало курса)
D. URL ?lesson=99 → next disabled (конец)
E. «Открыть тренажёр» сохраняет currentLesson в localStorage
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL_BASE = 'http://127.0.0.1:8000/lesson.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_lesson_page'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

PROFILE = {
    'name': 'Тест',
    'gender': 'm', 'audience': 'adult', 'character': 'anna', 'mentor': 'anna',
    'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True
}
PROGRESS = {'6': {'stars': 4, 'bestWPM': 28, 'bestAccuracy': 92}}

def shot(page, name, n):
    p = SCREENSHOT_DIR / f"{n:02d}_{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📷 {p.name}")

def setup_authorized_page(browser, params=''):
    ctx = browser.new_context(viewport={'width': 1400, 'height': 1700}, locale='ru-RU')
    page = ctx.new_page()
    page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
    page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)
    page.goto(URL_BASE)
    page.evaluate(
        """(args) => {
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify(args.profile));
            localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(args.progress));
        }""",
        {'profile': PROFILE, 'progress': PROGRESS}
    )
    page.goto(f"{URL_BASE}{params}")
    page.wait_for_selector('#lpTitle', timeout=8000)
    page.wait_for_timeout(1500)  # async lesson-loader + prev/next title fetches
    return ctx, page

def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # A. Fresh user
        print("\n=== A. Fresh user → redirect ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200}, locale='ru-RU')
        page = ctx.new_page()
        page.goto(URL_BASE)
        page.evaluate('localStorage.clear()')
        page.goto(URL_BASE)
        page.wait_for_timeout(800)
        if page.url.endswith('/index.html'):
            print(f"   ✅ redirect → {page.url}")
        else:
            findings.append(('FAIL', f'no redirect; ended on {page.url}'))
            print(f"   ❌ no redirect; ended on {page.url}")
        ctx.close()

        # B. Authorized + ?lesson=6
        print("\n=== B. ?tier=tier1&lesson=6 → реальный урок ===")
        ctx, page = setup_authorized_page(browser, '?tier=tier1&lesson=6')

        checks = []
        def check(label, actual, exp):
            if callable(exp):
                ok = exp(actual)
            else:
                ok = actual == exp
            mark = '✅' if ok else '❌'
            print(f"   {mark} {label}: {actual!r}")
            checks.append(ok)

        # Top bar
        check('crumb course "Русский курс"', page.locator('#lpCrumbCourse').inner_text(), 'Русский курс')
        check('crumb lesson "Урок 6"', page.locator('#lpCrumbLesson').inner_text(), 'Урок 6')
        check('progress label "6/99"', page.locator('#lpProgressLabel').inner_text(), '6/99')
        check('progress pct "6%"', page.locator('#lpProgressPct').inner_text(), '6%')
        check('metric WPM from progress (best=28)', page.locator('#lpMetricWpm').inner_text(), '28')
        check('metric accuracy (best=92%)', page.locator('#lpMetricAcc').inner_text(), '92%')

        # Title
        check('badge "МОДУЛЬ 1 · УРОК 6"', page.locator('#lpBadge').inner_text(), lambda s: 'МОДУЛЬ 1' in s and 'УРОК 6' in s)
        title = page.locator('#lpTitle').inner_text()
        check('title is fetched (not placeholder)', title, lambda s: 'Загружаем' not in s and len(s) > 3)
        check('subtitle non-empty', page.locator('#lpSubtitle').inner_text(), lambda s: len(s) > 5)

        # Mentor
        check('mentor data-mentor="anna"', page.locator('#lpMentor').get_attribute('data-mentor'), 'anna')
        check('mentor portrait svg', page.locator('#lpMentorPortrait svg').count(), lambda n: n >= 1)
        check('mentor name "Анна"', page.locator('#lpMentorName').inner_text(), 'Анна')
        mentor_quote = page.locator('#lpMentorQuote').inner_text()
        check('mentor quote non-empty', mentor_quote, lambda s: len(s) > 10)

        # Narrative
        check('lead paragraph non-empty', page.locator('#lpLead').inner_text(), lambda s: len(s) > 5)
        tips = page.locator('#lpTips > *').count()
        check('tips rendered as paragraphs/callouts', tips, lambda n: n >= 1)

        # Exercise preview
        check('exercise target text non-empty', page.locator('#lpExerciseTarget').inner_text(), lambda s: len(s) > 3)
        check('exercise count "0/total"', page.locator('#lpExerciseCount').inner_text(), lambda s: s.startswith('0/') and int(s.split('/')[1]) > 0)
        check('exercise has dots', page.locator('.lp-exercise__dot').count(), lambda n: n > 0)
        check('open trainer link → index.html', page.locator('#lpOpenTrainer').get_attribute('href'), 'index.html')

        # Nav
        check('prev nav → lesson 5 href', page.locator('#lpNavPrev').get_attribute('href'), lambda s: 'lesson=5' in s)
        check('next nav → lesson 7 href', page.locator('#lpNavNext').get_attribute('href'), lambda s: 'lesson=7' in s)
        check('prev not disabled', page.locator('#lpNavPrev').get_attribute('class'), lambda s: 'disabled' not in s)
        check('next not disabled', page.locator('#lpNavNext').get_attribute('class'), lambda s: 'disabled' not in s)
        check('prev title fetched', page.locator('#lpNavPrevTitle').inner_text(), lambda s: s != 'Предыдущий' and 'Урок 5' not in s)
        check('next title fetched', page.locator('#lpNavNextTitle').inner_text(), lambda s: s != 'Следующий' and 'Урок 7' not in s)

        shot(page, 'lesson_6', 1)
        ctx.close()

        # C. lesson=1 → prev disabled
        print("\n=== C. ?lesson=1 → prev disabled ===")
        ctx, page = setup_authorized_page(browser, '?tier=tier1&lesson=1')
        check('prev IS disabled', page.locator('#lpNavPrev').get_attribute('class'), lambda s: 'disabled' in s)
        check('prev hint "НАЧАЛО"', page.locator('#lpNavPrevHint').inner_text(), lambda s: 'НАЧАЛО' in s)
        check('next still works → lesson 2', page.locator('#lpNavNext').get_attribute('href'), lambda s: 'lesson=2' in s)
        shot(page, 'lesson_1_start', 2)
        ctx.close()

        # D. lesson=99 → next disabled
        print("\n=== D. ?lesson=99 → next disabled ===")
        ctx, page = setup_authorized_page(browser, '?tier=tier1&lesson=99')
        check('next IS disabled', page.locator('#lpNavNext').get_attribute('class'), lambda s: 'disabled' in s)
        check('next hint "КОНЕЦ"', page.locator('#lpNavNextHint').inner_text(), lambda s: 'КОНЕЦ' in s)
        check('prev still works → lesson 98', page.locator('#lpNavPrev').get_attribute('href'), lambda s: 'lesson=98' in s)
        shot(page, 'lesson_99_end', 3)
        ctx.close()

        # E. Click «Открыть тренажёр» → currentLesson saved
        print("\n=== E. Open trainer button writes currentLesson ===")
        ctx, page = setup_authorized_page(browser, '?tier=tier1&lesson=6')
        # Intercept navigation
        with page.expect_request_finished(lambda req: True, timeout=3000) if False else page.expect_event('load', timeout=3000):
            # Use page.evaluate to click without navigating (click would navigate to index.html)
            page.evaluate("""() => {
                document.getElementById('lpOpenTrainer').click();
            }""")
        # localStorage should have currentLesson={tier:'tier1',lessonNumber:6}
        saved = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_current_lesson') || '{}')")
        check('currentLesson saved tier=tier1', saved.get('tier'), 'tier1')
        check('currentLesson saved lessonNumber=6', saved.get('lessonNumber'), 6)
        ctx.close()

        browser.close()
        if all(checks):
            print("\n✅ ALL B/C/D/E checks PASS")
        else:
            fails = checks.count(False)
            print(f"\n❌ {fails} of {len(checks)} checks failed")
            findings.append(('FAIL', f'{fails} lesson page checks failed'))

    print("\n" + "=" * 60)
    if not findings:
        print("✅ VERIFY PASS")
        return 0
    print("❌ VERIFY FAIL:")
    for level, msg in findings:
        print(f"  • {msg}")
    return 1

sys.exit(main())
