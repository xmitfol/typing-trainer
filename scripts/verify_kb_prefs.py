"""
Персистентность настроек клавиатуры в task.html.

A. Меняем тип (Эргономическая), раскладку (Фонетическая), режим «вслепую» →
   значения сохраняются в профиль (localStorage).
B. После перезагрузки task.html настройки применены: <typing-keyboard> с теми
   же type/layout/intensity, селекты и кнопка отражают сохранённое.
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
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
        ctx = browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        page.goto(f"{BASE}/index.html")
        page.evaluate("(pr)=>localStorage.setItem('typing_trainer_user_profile',JSON.stringify(pr))", PROFILE)
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(500)

        # A. Меняем настройки
        print("\n=== A. меняем тип/раскладку/режим → сохраняется в профиль ===")
        page.select_option('#type-select', 'ergonomic'); page.wait_for_timeout(300)
        page.select_option('#layout-select', 'phonetic'); page.wait_for_timeout(300)
        page.click('#hide-hint-btn'); page.wait_for_timeout(300)
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('profile.keyboardType = ergonomic', prof.get('keyboardType'), 'ergonomic')
        check('profile.keyboardLayout = phonetic', prof.get('keyboardLayout'), 'phonetic')
        check('profile.keyboardIntensity = highlight', prof.get('keyboardIntensity'), 'highlight')

        # B. Перезагрузка → настройки применены
        print("\n=== B. перезагрузка → применены ===")
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(600)
        check('kb type = ergonomic', page.evaluate("document.getElementById('kb').getAttribute('type')"), 'ergonomic')
        check('kb layout = phonetic', page.evaluate("document.getElementById('kb').getAttribute('layout')"), 'phonetic')
        check('kb intensity = highlight', page.evaluate("document.getElementById('kb').getAttribute('intensity')"), 'highlight')
        check('select типа = ergonomic', page.eval_on_selector('#type-select', 'el => el.value'), 'ergonomic')
        check('select раскладки = phonetic', page.eval_on_selector('#layout-select', 'el => el.value'), 'phonetic')
        check('кнопка «вслепую» активна', page.eval_on_selector('#hide-hint-btn', 'el => el.dataset.active'), 'true')
        # эргономика реально отрисовалась (split-половины)
        check('эргономика отрисована (split)', page.evaluate("document.getElementById('kb').shadowRoot.querySelectorAll('.half-left,.half-right').length"), 2)

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
