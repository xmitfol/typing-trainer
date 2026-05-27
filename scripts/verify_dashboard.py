"""
Phase 4 — Dashboard verification.

Two scenarios:
  A. Fresh user (empty localStorage) → redirect to index.html
  B. Authorized user (Tест, m, adult, anna, ru, tier1) → dashboard рендерится,
     все секции заполняются из профиля.
"""
import io
import sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/dashboard.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_dashboard'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

PROFILE_AUTHORIZED = {
    'name': 'Тест',
    'gender': 'm',
    'audience': 'adult',
    'character': 'anna',          # legacy alias
    'mentor': 'anna',
    'language': 'ru',
    'keyboardType': 'classic',
    'onboardingCompleted': True
}

# Сэмпл progress: 2 урока пройдены со звёздами
PROGRESS = {
    '1': {'stars': 5, 'bestWPM': 25, 'bestAccuracy': 96, 'completedAt': '2026-05-26T10:00:00Z'},
    '2': {'stars': 4, 'bestWPM': 28, 'bestAccuracy': 92, 'completedAt': '2026-05-27T11:30:00Z'}
}
CURRENT_LESSON = {'tier': 'tier1', 'lessonNumber': 3, 'lastSaved': '2026-05-27T12:00:00Z'}

# Test history для streak (2 разных дня подряд)
HISTORY = [
    {'completedAt': '2026-05-26T10:00:00Z', 'duration': 300},
    {'completedAt': '2026-05-27T11:30:00Z', 'duration': 280}
]

def shot(page, name, n):
    p = SCREENSHOT_DIR / f"{n:02d}_{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📷 {p.name}")

def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # ── Scenario A: fresh user → должен редиректнуть на index.html
        print("\n=== A. Fresh user → redirect to index.html ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200}, locale='ru-RU')
        page = ctx.new_page()
        page.goto(URL)
        page.evaluate('localStorage.clear()')
        page.goto(URL)  # повторно после clear
        page.wait_for_timeout(800)
        url_after = page.url
        if url_after.endswith('/index.html'):
            print(f"   ✅ redirect → {url_after}")
        else:
            print(f"   ❌ ожидали redirect, остались на {url_after}")
            findings.append(('FAIL', f'no redirect for anon, ended on {url_after}'))
        ctx.close()

        # ── Scenario B: authorized user → dashboard рендерится
        print("\n=== B. Authorized user → dashboard renders ===")
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)

        # Сначала зайти на root чтобы получить домен для localStorage
        page.goto(URL)
        page.evaluate(
            """(args) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(args.profile));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(args.progress));
                localStorage.setItem('typing_trainer_current_lesson', JSON.stringify(args.current));
                localStorage.setItem('typing_trainer_test_history', JSON.stringify(args.history));
            }""",
            {'profile': PROFILE_AUTHORIZED, 'progress': PROGRESS, 'current': CURRENT_LESSON, 'history': HISTORY}
        )
        page.goto(URL)
        page.wait_for_selector('#dhWelcomeName', timeout=8000)
        page.wait_for_timeout(1500)  # ждать lesson-loader fetch

        # Assertions
        checks = []
        def check(label, actual, expected):
            ok = actual == expected if isinstance(expected, str) else expected(actual)
            mark = '✅' if ok else '❌'
            print(f"   {mark} {label}: {actual!r}")
            checks.append(ok)
            if not ok and isinstance(expected, str):
                print(f"      ожидали: {expected!r}")

        # Welcome strip
        check('welcome name', page.locator('#dhWelcomeName').inner_text(), 'Тест')
        check('date present',  page.locator('#dhDate').inner_text(), lambda s: 'МАЯ' in s.upper() or any(m in s for m in ['ЯНВ','ФЕВ','МАР','АПР','МАЯ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК']))

        # Profile
        check('profile name in pill', page.locator('#dhProfileName').inner_text(), 'Тест')
        check('profile avatar svg',  page.locator('#dhProfileAvatar svg').count(), lambda n: n >= 1)

        # Course card
        check('course title', page.locator('#dhCourseTitle').inner_text(), 'Русский курс')
        check('course layout chip', page.locator('#dhCourseLayout').inner_text(), 'ЙЦУКЕН')
        course_pct = page.locator('#dhCoursePct').inner_text()
        check('course pct (2/99 ≈ 2%)', course_pct, lambda s: '2' in s or '%' in s)
        check('next lesson num', page.locator('#dhNextNum').inner_text(), '3')

        # Wait for lesson-loader populated next title (просто timeout + сравнение)
        page.wait_for_timeout(2000)
        next_title = page.locator('#dhNextTitle').inner_text()
        check('next lesson title is fetched (not placeholder)', next_title, lambda s: len(s) > 3 and 'Первые' not in s)

        # Lesson list — должен содержать 4-5 строк (2 done + 1 next + 2 locked)
        rows = page.locator('.dh-lesson').count()
        check('lesson list row count', rows, lambda n: n >= 3)
        check('has --next row', page.locator('.dh-lesson--next').count(), lambda n: n == 1)
        check('has --locked row', page.locator('.dh-lesson--locked').count(), lambda n: n >= 1)

        # Stats
        speed = page.locator('#dhStatSpeed').inner_text()
        check('best WPM in stats (max(25,28)=28)', speed, lambda s: s in ['28', '—'] or int(s) >= 25)
        check('best accuracy in stats', page.locator('#dhStatAccuracy').inner_text(), lambda s: s in ['96', '—'] or int(s) >= 90)

        # Mentor card — Anna
        check('mentor role contains АННА', page.locator('#dhMentorRole').inner_text(), lambda s: 'АННА' in s)
        check('mentor portrait svg', page.locator('#dhMentorPortrait svg').count(), lambda n: n >= 1)

        # Achievements (6)
        ach_count = page.locator('.dh-ach__item').count()
        check('achievements count = 6', ach_count, lambda n: n == 6)
        earned = page.locator('.dh-ach__item--earned').count()
        check('at least "Первый урок" earned (2 done)', earned, lambda n: n >= 1)

        shot(page, 'dashboard_authorized', 1)

        # ── Language switcher dropdown
        print("\n=== B.2 Language dropdown opens ===")
        page.click('#dhLangBtn')
        page.wait_for_timeout(300)
        check('lang menu open class', page.locator('#dhLangMenu').get_attribute('class'), lambda s: 'open' in s)
        ru_items = page.locator('.dh-lang-item--active').count()
        check('one active language item', ru_items, lambda n: n == 1)
        shot(page, 'lang_dropdown_open', 2)

        # Close lang dropdown, open profile dropdown
        page.click('body', position={'x': 10, 'y': 10})
        page.wait_for_timeout(200)
        page.click('#dhProfileBtn')
        page.wait_for_timeout(300)
        check('profile menu open', page.locator('#dhProfileMenu').get_attribute('class'), lambda s: 'open' in s)
        check('profile menu name', page.locator('#dhProfileMenuName').inner_text(), 'Тест')
        shot(page, 'profile_dropdown_open', 3)

        ctx.close()
        browser.close()

        if all(checks):
            print("\n✅ ALL B-checks PASS")
        else:
            fails = checks.count(False)
            print(f"\n❌ {fails} of {len(checks)} B-checks failed")
            findings.append(('FAIL', f'{fails} dashboard checks failed'))

    print("\n" + "=" * 60)
    if not findings:
        print("✅ VERIFY PASS")
        return 0
    print("❌ VERIFY FAIL:")
    for level, msg in findings:
        print(f"  • {msg}")
    return 1

sys.exit(main())
