"""
Phase 5 — Course roadmap verification.

A. Fresh user → redirect to index.html
B. Authorized user (tier1, lesson 6, 5 уроков done) → весь scaffold виден:
   - breadcrumbs/header
   - summary с метриками (5 done, ~5%, avg ~92%)
   - roadmap с 7 модулями + активный pill в M1
   - M1 expanded по умолчанию, list уроков заполнен реальными названиями
   - 5 уроков done со звёздами, урок 6 = next, 7-15 locked
   - Клик по M2 раскрывает другой модуль
   - Grading legend (6 items)
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/course.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_course'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

PROFILE = {
    'name': 'Тест',
    'gender': 'm', 'audience': 'adult', 'character': 'anna', 'mentor': 'anna',
    'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True
}
PROGRESS = {str(n): {'stars': (5 if n <= 3 else 4), 'bestWPM': 22+n, 'bestAccuracy': 88+n, 'completedAt': '2026-05-26T10:00:00Z'} for n in range(1, 6)}
CURRENT = {'tier': 'tier1', 'lessonNumber': 6, 'lastSaved': '2026-05-27T12:00:00Z'}

def shot(page, name, n):
    p = SCREENSHOT_DIR / f"{n:02d}_{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📷 {p.name}")

def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # A. Fresh user
        print("\n=== A. Fresh user → redirect to index.html ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1500}, locale='ru-RU')
        page = ctx.new_page()
        page.goto(URL)
        page.evaluate('localStorage.clear()')
        page.goto(URL)
        page.wait_for_timeout(800)
        if page.url.endswith('/index.html'):
            print(f"   ✅ redirect → {page.url}")
        else:
            print(f"   ❌ no redirect, ended on {page.url}")
            findings.append(('FAIL', 'no anon redirect'))
        ctx.close()

        # B. Authorized
        print("\n=== B. Authorized user → course renders ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1700}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)

        page.goto(URL)
        page.evaluate(
            """(args) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(args.profile));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(args.progress));
                localStorage.setItem('typing_trainer_current_lesson', JSON.stringify(args.current));
            }""",
            {'profile': PROFILE, 'progress': PROGRESS, 'current': CURRENT}
        )
        page.goto(URL)
        page.wait_for_selector('#cpEyebrow', timeout=8000)
        page.wait_for_timeout(2000)  # ждать lesson-loader fetch для M1

        checks = []
        def check(label, actual, exp):
            if callable(exp):
                ok = exp(actual)
            else:
                ok = actual == exp
            mark = '✅' if ok else '❌'
            print(f"   {mark} {label}: {actual!r}")
            checks.append(ok)

        # Header
        check('breadcrumb course name', page.locator('#cpCourseCrumb').inner_text(), 'Русский курс')
        check('profile name in pill', page.locator('#cpProfileName').inner_text(), 'Тест')
        check('profile avatar svg present', page.locator('#cpProfileAvatar svg').count(), lambda n: n >= 1)

        # Summary
        check('eyebrow has РУССКИЙ', page.locator('#cpEyebrow').inner_text(), lambda s: 'РУССКИЙ' in s and '99' in s)
        check('metric: open ≈ 6', page.locator('#cpMetricOpen').inner_text(), '6')
        check('metric: done = 5', page.locator('#cpMetricDone').inner_text(), '5')
        avg = page.locator('#cpMetricAcc').inner_text()
        check('metric: avg accuracy fetched', avg, lambda s: s != '—' and int(s) >= 80)
        check('continue → lesson 6', page.locator('#cpContinue').inner_text(), lambda s: '6' in s)

        # Roadmap
        check('roadmap progress text "5/99"', page.locator('#cpRoadmapProgress').inner_text(), lambda s: '5/99' in s)
        check('7 modules in roadmap heads', page.locator('.cp-roadmap__head').count(), lambda n: n == 7)
        check('1 active head', page.locator('.cp-roadmap__head--active').count(), 1)
        check('7 pills total', page.locator('.cp-roadmap__pill').count(), lambda n: n == 7)
        check('1 active pill', page.locator('.cp-roadmap__pill--active').count(), 1)
        check('6 dividers', page.locator('.cp-roadmap__divider').count(), 6)

        # Modules accordion
        check('7 module cards', page.locator('.cp-module').count(), lambda n: n == 7)
        check('M1 open by default', page.locator('.cp-module--open').count(), 1)

        # M1 lessons rendered (15 lessons)
        m1_lessons = page.locator('.cp-module--open .cp-lesson').count()
        check('M1 has 15 lessons', m1_lessons, lambda n: n == 15)
        check('M1 has 5 done lessons', page.locator('.cp-module--open .cp-lesson__num--done').count(), 5)
        check('M1 has 1 "next" lesson', page.locator('.cp-module--open .cp-lesson--next').count(), 1)
        check('M1 has locked lessons', page.locator('.cp-module--open .cp-lesson--locked').count(), lambda n: n == 9)

        # Lesson 1 title fetched (not placeholder "Урок 1")
        lesson_titles = page.locator('.cp-module--open .cp-lesson__title').all_inner_texts()
        first_title = lesson_titles[0] if lesson_titles else ''
        check('lesson 1 title fetched real', first_title, lambda s: 'Первые буквы' in s)

        # Stars on done lessons
        first_stars_on = page.locator('.cp-module--open .cp-lesson').nth(0).locator('.cp-star--on').count()
        check('lesson 1 has 5 stars on (stars=5)', first_stars_on, 5)

        shot(page, 'course_main', 1)

        # Click M2 to expand it
        print("\n=== B.2 Click M2 → accordion toggles ===")
        page.locator('.cp-module').nth(1).locator('.cp-module__head').click()
        page.wait_for_timeout(1800)  # async fetch для M2
        check('2 modules open now', page.locator('.cp-module--open').count(), 2)
        m2_lessons = page.locator('.cp-module').nth(1).locator('.cp-lesson').count()
        check('M2 has 15 lessons', m2_lessons, lambda n: n == 15)
        check('M2 lessons are all locked (no progress)', page.locator('.cp-module').nth(1).locator('.cp-lesson--locked').count(), 15)
        shot(page, 'course_m2_expanded', 2)

        # Grading legend
        check('6 grading items', page.locator('.cp-grading__item').count(), 6)

        ctx.close()
        browser.close()

        if all(checks):
            print("\n✅ ALL B-checks PASS")
        else:
            fails = checks.count(False)
            print(f"\n❌ {fails} of {len(checks)} B-checks failed")
            findings.append(('FAIL', f'{fails} course checks failed'))

    print("\n" + "=" * 60)
    if not findings:
        print("✅ VERIFY PASS")
        return 0
    print("❌ VERIFY FAIL:")
    for level, msg in findings:
        print(f"  • {msg}")
    return 1

sys.exit(main())
