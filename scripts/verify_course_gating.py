"""
course.html: (1) номера упражнений видны всегда, статус — слева;
(2) линейная прогрессия — доступен только первый непройденный урок.

Сценарий: пройдены уроки 1,2. Модуль 1 раскрыт.
  - 1,2 → done (галочка слева), номер виден
  - 3   → next (доступен), номер виден, href lesson.html?lesson=3
  - 4,5 → locked (замок слева), номера видны, href '#'
  - ровно один .cp-lesson--next в раскрытом модуле
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'course_gating'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True}

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1400}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        page.goto(f"{BASE}/index.html")
        page.evaluate(
            """(p) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({
                    '1': {stars:5,bestWPM:25,bestAccuracy:96},
                    '2': {stars:4,bestWPM:27,bestAccuracy:92}
                }));
                // stale currentLesson «вперёд» — не должно влиять (раньше из-за этого
                // 5й был доступен)
                localStorage.setItem('typing_trainer_current_lesson', JSON.stringify({tier:'tier1', lessonNumber:5}));
            }""",
            PROFILE
        )
        page.goto(f"{BASE}/course.html")
        page.wait_for_selector('#cpEyebrow', timeout=6000)
        page.wait_for_timeout(2000)

        def row(n):
            return page.locator(f'.cp-module--open .cp-lesson').nth(n - 1)

        # Номера видны на всех
        nums = page.locator('.cp-module--open .cp-lesson__num').all_inner_texts()
        check('номера видны (01..)', nums[:5], lambda v: v == ['01', '02', '03', '04', '05'])

        # ровно один next
        check('один .cp-lesson--next', page.locator('.cp-module--open .cp-lesson--next').count(), 1)

        # статусы
        check('урок1 статус done', row(1).locator('.cp-lesson__status--done').count(), 1)
        check('урок2 статус done', row(2).locator('.cp-lesson__status--done').count(), 1)
        check('урок3 статус next', row(3).locator('.cp-lesson__status--next').count(), 1)
        check('урок4 статус locked', row(4).locator('.cp-lesson__status--locked').count(), 1)
        check('урок5 статус locked', row(5).locator('.cp-lesson__status--locked').count(), 1)

        # доступность
        check('урок3 → lesson.html?lesson=3', row(3).get_attribute('href'), lambda s: s and 'lesson=3' in s)
        check('урок4 заблокирован (href #)', row(4).get_attribute('href'), '#')
        check('урок5 заблокирован (href #)', row(5).get_attribute('href'), '#')

        # summary CTA → урок 3 (первый непройденный), не 5 из stale currentLesson
        check('CTA «Продолжить» → урок 3', page.locator('#cpContinue').get_attribute('href'), lambda s: 'lesson=3' in s)

        page.screenshot(path=str(SHOTS / 'course_gating.png'), full_page=True)
        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
