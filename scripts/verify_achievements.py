"""
Achievements expansion.

A. achievements.html — все группы рендерятся, корректное количество earned
B. dashboard.js — показывает топ-6 (earned + ближайшие к unlock), ссылка «все →»
C. task.js — после finishExercise всплывает toast для новых достижений
D. router-guard: achievements.html без профиля → index
E. Catalog: getAchievements возвращает >= 20 ачивок
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'achievements'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True}

# Прогресс: 3 урока пройдены — должны быть earned: first; ближе всего streak5/wpm30
PROGRESS = {
    '1': {'stars': 5, 'bestWPM': 35, 'bestAccuracy': 96},
    '2': {'stars': 4, 'bestWPM': 32, 'bestAccuracy': 91},
    '3': {'stars': 5, 'bestWPM': 38, 'bestAccuracy': 100}
}

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1200, 'height': 1200}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # D. router-guard: без профиля → редирект
        print("\n=== D. achievements.html без профиля → редирект ===")
        page.goto(f"{BASE}/achievements.html")
        page.evaluate("localStorage.clear()")
        page.goto(f"{BASE}/achievements.html")
        page.wait_for_timeout(700)
        check('редирект на index', page.url, lambda u: u.endswith('/index.html'))

        # seed
        page.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
            }""",
            {'p': PROFILE, 'pr': PROGRESS}
        )

        # E. Catalog: getAchievements >= 20
        print("\n=== E. catalog >= 20 ачивок ===")
        page.goto(f"{BASE}/achievements.html")
        page.wait_for_selector('#ach-groups', timeout=6000)
        page.wait_for_timeout(500)
        catalogSize = page.evaluate("window.achievements.CATALOG.length")
        check('CATALOG >= 20 ачивок', catalogSize, lambda n: n >= 20)
        groupsCount = page.evaluate("window.achievements.GROUPS.length")
        check('GROUPS >= 5 категорий', groupsCount, lambda n: n >= 5)

        # A. Страница рендерит группы и earned
        print("\n=== A. achievements.html — рендер ===")
        check('заголовок «Достижения»', page.locator('.ach-h1').inner_text(), 'Достижения')
        check('секции групп >= 5', page.locator('.ach-group').count(), lambda n: n >= 5)
        check('карточки >= 20', page.locator('.ach-card').count(), lambda n: n >= 20)
        # с прогрессом 3 уроков → earned: first, wpm30, acc95, acc100, streak3? (нет history) → точно first + acc95 + acc100 + wpm30
        earned = page.locator('.ach-card--earned').count()
        check('earned >= 3 (для PROGRESS из 3 уроков)', earned, lambda n: n >= 3)
        page.screenshot(path=str(SHOTS / 'A_page.png'), full_page=True)

        # B. dashboard.js top-6 + ссылка «все»
        print("\n=== B. dashboard top-6 + ссылка ===")
        page.goto(f"{BASE}/dashboard.html")
        page.wait_for_selector('#dhAchGrid .dh-ach__item', timeout=6000)
        page.wait_for_timeout(600)
        check('на дашборде ровно 6 ачивок', page.locator('#dhAchGrid .dh-ach__item').count(), 6)
        check('счётчик содержит «все →»', page.locator('#dhAchCount').inner_text(), lambda s: 'все' in s.lower())
        check('ссылка на achievements.html', page.locator('#dhAchCount a').get_attribute('href'), 'achievements.html')

        # C. unlock toast в task.js
        print("\n=== C. toast при unlock в task.js ===")
        # Сброс прогресса → урок 1 ещё не пройден → пройдём, должны открыться first + wpm/acc
        page.evaluate("""() => {
            localStorage.removeItem('typing_trainer_lesson_progress');
            localStorage.removeItem('typing_trainer_test_history');
            localStorage.removeItem('typing_trainer_current_lesson');
        }""")
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(400)
        # Допечатать текст полностью корректно → 5★, 100% точность.
        # textContent обёртки .target__inner — точный текст забега (старый обход
        # `#target > *` на новой разметке удваивал буквы).
        target = page.evaluate("document.querySelector('#target .target__inner').textContent")
        page.evaluate(
            """(txt) => {
                const cap = document.getElementById('capture'); cap.focus();
                for (const ch of txt) cap.dispatchEvent(new KeyboardEvent('keydown',{key:ch,code:'KeyX',bubbles:true,cancelable:true}));
            }""", target
        )
        page.wait_for_timeout(800)
        toast_count = page.locator('.unlock-toast').count()
        check('хотя бы один unlock-toast появился', toast_count, lambda n: n >= 1)
        # содержит «★ ДОСТИЖЕНИЕ»
        check('toast содержит метку «ДОСТИЖЕНИЕ»', page.locator('.unlock-toast__head').first.inner_text(), lambda s: 'ДОСТИЖЕНИЕ' in s)
        page.screenshot(path=str(SHOTS / 'C_toast.png'))

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
