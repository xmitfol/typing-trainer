"""
Прямой ввод URL на заблокированный урок (linear progression bypass).

Прогресс: уроки 1,2,3 пройдены → доступен урок 4 (firstUncompleted).
A. lesson.html?lesson=6 (заблокирован) → экран-заглушка с сообщением,
   primary-кнопка → lesson.html?lesson=4, secondary → course.html
B. lesson.html?lesson=4 (текущий) → открывается нормально
C. lesson.html?lesson=2 (пройден) → открывается нормально (повтор)
D. task.html?lesson=6 (заблокирован) → редирект на lesson.html (там заглушка)
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'lesson_url_lock'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True}
PROGRESS = {str(n): {'stars': 5, 'bestWPM': 25, 'bestAccuracy': 95} for n in (1, 2, 3)}

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1200, 'height': 900}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.goto(f"{BASE}/index.html")
        page.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
            }""",
            {'p': PROFILE, 'pr': PROGRESS}
        )

        # A. lesson 6 заблокирован → заглушка
        print("\n=== A. lesson.html?lesson=6 → заглушка ===")
        page.goto(f"{BASE}/lesson.html?tier=tier1&lesson=6")
        page.wait_for_timeout(1200)
        check('показан locked-экран', page.locator('.lp-locked').count(), 1)
        check('теория НЕ отрисована (нет #lpTitle с уроком)', page.locator('#lpTitle').count(), 0)
        check('заголовок про «рановато»', page.locator('.lp-locked__title').inner_text(), lambda s: 'ановато' in s)
        check('primary → урок 4', page.locator('.lp-locked__btn--primary').get_attribute('href'), lambda s: 'lesson=4' in s)
        check('primary текст содержит «урок 4»', page.locator('.lp-locked__btn--primary').inner_text(), lambda s: '4' in s)
        check('secondary → course.html', page.locator('.lp-locked__btn--secondary').get_attribute('href'), 'course.html')
        page.screenshot(path=str(SHOTS / 'A_locked.png'), full_page=True)

        # B. lesson 4 (текущий) открывается
        print("\n=== B. lesson.html?lesson=4 (текущий) открывается ===")
        page.goto(f"{BASE}/lesson.html?tier=tier1&lesson=4")
        page.wait_for_timeout(1200)
        check('locked-экрана нет', page.locator('.lp-locked').count(), 0)
        check('теория отрисована', page.locator('#lpTitle').inner_text(), lambda s: len(s) > 3 and 'Загружаем' not in s)

        # C. lesson 2 (пройден) открывается
        print("\n=== C. lesson.html?lesson=2 (пройден, повтор) открывается ===")
        page.goto(f"{BASE}/lesson.html?tier=tier1&lesson=2")
        page.wait_for_timeout(1000)
        check('locked-экрана нет', page.locator('.lp-locked').count(), 0)
        check('теория отрисована', page.locator('#lpTitle').inner_text(), lambda s: len(s) > 3)

        # D. task 6 заблокирован → редирект на lesson.html
        print("\n=== D. task.html?lesson=6 → редирект на lesson.html ===")
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=6")
        page.wait_for_timeout(1200)
        check('ушли с task.html на lesson.html', page.url, lambda u: 'lesson.html' in u)
        check('итого locked-экран', page.locator('.lp-locked').count(), 1)

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
