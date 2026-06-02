"""
settings.html — страница настроек.

A. Без профиля → редирект на index.html (router-guard)
B. С профилем → все поля заполнены текущими значениями
C. Изменение имени → автосохранение в profile + индикатор «✓ Сохранено»
D. Смена audience → меняется список наставников; смена mentor сохраняется
E. Тогглы (finger-hint/sound/metronome) → сохраняются в profile
F. Zoom ± → сохраняется taskZoom
G. Смена языка → save + сброс currentLesson
H. Reset progress → удаляются lessonProgress/currentLesson/history; profile остаётся
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'settings'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic',
           'keyboardLayout': 'standard', 'fingerHint': True, 'keySound': False,
           'metronome': False, 'taskZoom': 100, 'onboardingCompleted': True}
PROGRESS = {'1': {'stars': 5, 'bestWPM': 25, 'bestAccuracy': 95}}
HISTORY = [{'completedAt': '2026-05-26T10:00:00Z', 'duration': 300}]

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1100, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # A. без профиля → редирект
        print("\n=== A. без профиля → редирект ===")
        page.goto(f"{BASE}/settings.html")
        page.evaluate("localStorage.clear()")
        page.goto(f"{BASE}/settings.html")
        page.wait_for_timeout(700)
        check('редирект на index.html', page.url, lambda u: u.endswith('/index.html'))

        # B. с профилем → поля заполнены
        print("\n=== B. с профилем → поля заполнены ===")
        page.goto(f"{BASE}/settings.html")
        page.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
                localStorage.setItem('typing_trainer_test_history', JSON.stringify(a.h));
                localStorage.setItem('typing_trainer_current_lesson', JSON.stringify({tier:'tier1',lessonNumber:2}));
            }""",
            {'p': PROFILE, 'pr': PROGRESS, 'h': HISTORY}
        )
        page.goto(f"{BASE}/settings.html")
        page.wait_for_selector('#sp-name-input', timeout=6000)
        page.wait_for_timeout(400)
        check('имя в шапке = Тест', page.eval_on_selector('#sp-name', 'el => el.textContent'), 'Тест')
        check('инпут имени = Тест', page.eval_on_selector('#sp-name-input', 'el => el.value'), 'Тест')
        check('gender М активен', page.eval_on_selector('#sp-gender [data-gender="m"]', 'el => el.classList.contains("sp-seg__btn--active")'), True)
        check('audience adult активен', page.eval_on_selector('#sp-audience [data-audience="adult"]', 'el => el.classList.contains("sp-option--active")'), True)
        check('mentor anna активен', page.eval_on_selector('#sp-mentor [data-mentor="anna"]', 'el => el.classList.contains("sp-option--active")'), True)
        check('kb type = classic', page.eval_on_selector('#sp-kb-type', 'el => el.value'), 'classic')
        check('kb layout = standard', page.eval_on_selector('#sp-kb-layout', 'el => el.value'), 'standard')
        check('finger toggle вкл', page.eval_on_selector('#sp-kb-finger', 'el => el.checked'), True)
        check('sound toggle выкл', page.eval_on_selector('#sp-kb-sound', 'el => el.checked'), False)
        check('zoom = 100%', page.eval_on_selector('#sp-zoom-val', 'el => el.textContent'), '100%')
        check('lang ru активен', page.eval_on_selector('#sp-lang [data-lang="ru"]', 'el => el.classList.contains("sp-seg__btn--active")'), True)
        page.screenshot(path=str(SHOTS / 'B_loaded.png'), full_page=True)

        # C. имя — автосохранение
        print("\n=== C. меняем имя → сохраняется ===")
        page.fill('#sp-name-input', 'Ваня')
        page.wait_for_timeout(700)  # debounce 400
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('profile.name = Ваня', prof.get('name'), 'Ваня')
        check('в шапке обновлено', page.eval_on_selector('#sp-name', 'el => el.textContent'), 'Ваня')

        # D. меняем audience teen → mentor становится Кнопыч
        print("\n=== D. audience teen → mentor Кнопыч ===")
        page.click('#sp-audience [data-audience="teen"]')
        page.wait_for_timeout(300)
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('audience сохранён teen', prof.get('audience'), 'teen')
        check('mentor авто-переключён на knopych', prof.get('character'), 'knopych')
        check('в списке наставников 1 опция (Кнопыч)', page.locator('#sp-mentor button').count(), 1)

        # E. тогглы
        print("\n=== E. тогглы клавиатуры → сохраняются ===")
        page.click('#sp-kb-finger'); page.wait_for_timeout(200)  # выкл
        page.click('#sp-kb-sound'); page.wait_for_timeout(200)   # вкл
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('fingerHint=false', prof.get('fingerHint'), False)
        check('keySound=true', prof.get('keySound'), True)

        # F. zoom
        print("\n=== F. zoom + + → 120% ===")
        page.click('#sp-zoom-plus'); page.click('#sp-zoom-plus'); page.wait_for_timeout(200)
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('taskZoom=120', prof.get('taskZoom'), 120)
        check('zoom-val=120%', page.eval_on_selector('#sp-zoom-val', 'el => el.textContent'), '120%')

        # G. язык + currentLesson сбрасывается
        print("\n=== G. смена языка → save + reset currentLesson ===")
        page.click('#sp-lang [data-lang="en"]'); page.wait_for_timeout(300)
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('language=en', prof.get('language'), 'en')
        check('currentLesson очищен', page.evaluate("localStorage.getItem('typing_trainer_current_lesson')"), None)

        # H. reset progress
        print("\n=== H. reset progress → lessonProgress/history очищены, профиль остался ===")
        page.click('#sp-reset-btn'); page.wait_for_timeout(300)
        check('modal открыт', page.eval_on_selector('#sp-modal', 'el => el.classList.contains("sp-modal--open")'), True)
        page.click('#sp-modal-confirm'); page.wait_for_timeout(900)  # есть setTimeout(600) на редирект
        check('lessonProgress очищен', page.evaluate("localStorage.getItem('typing_trainer_lesson_progress')"), None)
        check('test_history очищен', page.evaluate("localStorage.getItem('typing_trainer_test_history')"), None)
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('profile остался (имя Ваня)', prof.get('name'), 'Ваня')
        check('редирект на dashboard.html', page.url, lambda u: 'dashboard.html' in u)

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
