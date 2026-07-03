"""
Проверка lesson.html: шорткат «Выполнить задание» + блокировка след. урока.

A. Топбар «Выполнить задание →» → task.html?tier&lesson
B. Урок НЕ пройден (нет прогресса) → кнопка следующего урока заблокирована (lock)
C. Урок пройден (есть звёзды) → кнопка следующего урока активна → lesson N+1
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'lesson_gating'
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
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # B. Урок 3 НЕ пройден (прогресс только до урока 2)
        print("\n=== B. lesson 3 НЕ пройден → next заблокирован ===")
        page.goto(f"{BASE}/index.html")
        page.evaluate(
            """(p) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({
                    '1': {stars:5,bestWPM:25,bestAccuracy:96},
                    '2': {stars:4,bestWPM:27,bestAccuracy:92}
                }));
            }""",
            PROFILE
        )
        page.goto(f"{BASE}/lesson.html?tier=tier1&lesson=3")
        page.wait_for_selector('#lpTitle', timeout=6000)
        page.wait_for_timeout(1200)

        # A. shortcut — гайдед-урок без прогресса: шорткат ведёт к первому
        # НЕпройденному шагу (exercise=1), а не в полный заход в обход лестницы
        # (lesson-page.js «Выполнить задание →»).
        check('топбар «Выполнить задание» → первый шаг', page.locator('#lpTopTask').get_attribute('href'),
              lambda s: s == 'task.html?tier=tier1&lesson=3&exercise=1')
        # next locked
        check('next кнопка disabled (урок не пройден)', page.locator('#lpNavNext').get_attribute('class'),
              lambda s: 'lp-nav__btn--disabled' in s)
        check('next href = # (заблокирован)', page.locator('#lpNavNext').get_attribute('href'), '#')
        check('next hint с замком', page.locator('#lpNavNextHint').inner_text(), lambda s: '🔒' in s)
        check('next title подсказка', page.locator('#lpNavNextTitle').inner_text(), lambda s: 'Сначала' in s)
        # prev доступен
        check('prev доступен (урок 2)', page.locator('#lpNavPrev').get_attribute('href'), lambda s: 'lesson=2' in s)
        page.screenshot(path=str(SHOTS / 'B_lesson3_locked.png'), full_page=True)

        # locked next некликабелен на уровне CSS (pointer-events:none)
        pe = page.eval_on_selector('#lpNavNext', 'el => getComputedStyle(el).pointerEvents')
        check('locked next pointer-events: none', pe, 'none')

        # C. Урок 3 пройден → next активен
        print("\n=== C. lesson 3 пройден → next активен ===")
        page.evaluate(
            """() => {
                const pr = JSON.parse(localStorage.getItem('typing_trainer_lesson_progress'));
                pr['3'] = {stars:4, bestWPM:30, bestAccuracy:93};
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(pr));
            }"""
        )
        page.goto(f"{BASE}/lesson.html?tier=tier1&lesson=3")
        page.wait_for_selector('#lpTitle', timeout=6000)
        page.wait_for_timeout(1200)
        check('next активен (урок пройден)', page.locator('#lpNavNext').get_attribute('class'),
              lambda s: 'lp-nav__btn--disabled' not in s)
        check('next → lesson 4', page.locator('#lpNavNext').get_attribute('href'), lambda s: 'lesson=4' in s)
        check('next hint без замка', page.locator('#lpNavNextHint').inner_text(), lambda s: '🔒' not in s and 'УРОК 4' in s)
        page.screenshot(path=str(SHOTS / 'C_lesson3_passed.png'), full_page=True)

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
