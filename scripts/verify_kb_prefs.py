"""
Персистентность настроек тулбара task.html (новый дизайн).

A. Меняем: тип, раскладку, подсветку пальцев (выкл), звук (вкл), метроном (вкл),
   зум (+20% → 120%) → всё сохраняется в профиль.
B. Перезагрузка → всё применено: kb type/layout, finger-hint off (нет
   highlight-char), кнопки звук/метроном в нужном состоянии, зум карточки 120%,
   селекты отражают выбор.
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

        # A. меняем всё
        print("\n=== A. меняем настройки → сохраняются ===")
        page.select_option('#type-select', 'laptop'); page.wait_for_timeout(200)
        page.select_option('#layout-select', 'phonetic'); page.wait_for_timeout(200)
        page.click('#finger-hint-btn'); page.wait_for_timeout(200)   # выкл подсветку
        page.click('#sound-btn'); page.wait_for_timeout(150)          # вкл звук
        page.click('#metro-btn'); page.wait_for_timeout(150)          # вкл метроном
        page.click('#zoom-btn'); page.wait_for_timeout(150)
        page.click('#zoom-plus'); page.click('#zoom-plus'); page.wait_for_timeout(200)  # 100→120
        prof = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile'))")
        check('keyboardType=laptop', prof.get('keyboardType'), 'laptop')
        check('keyboardLayout=phonetic', prof.get('keyboardLayout'), 'phonetic')
        check('fingerHint=false', prof.get('fingerHint'), False)
        check('keySound=true', prof.get('keySound'), True)
        check('metronome=true', prof.get('metronome'), True)
        check('taskZoom=120', prof.get('taskZoom'), 120)
        # finger-hint выкл → нет подсвеченной клавиши
        check('нет highlight (подсветка выкл)', page.evaluate('''document.getElementById('kb').shadowRoot.querySelectorAll('.key[data-state="highlight"]').length'''), 0)

        # B. перезагрузка → применено
        print("\n=== B. перезагрузка → применено ===")
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(600)
        check('kb type=laptop', page.evaluate("document.getElementById('kb').getAttribute('type')"), 'laptop')
        check('kb layout=phonetic', page.evaluate("document.getElementById('kb').getAttribute('layout')"), 'phonetic')
        check('select типа=laptop', page.eval_on_selector('#type-select', 'el=>el.value'), 'laptop')
        check('select раскладки=phonetic', page.eval_on_selector('#layout-select', 'el=>el.value'), 'phonetic')
        check('finger-hint кнопка off', page.eval_on_selector('#finger-hint-btn', 'el=>el.dataset.off'), 'true')
        check('нет highlight после reload', page.evaluate('''document.getElementById('kb').shadowRoot.querySelectorAll('.key[data-state="highlight"]').length'''), 0)
        check('звук кнопка вкл (off=false)', page.eval_on_selector('#sound-btn', 'el=>el.dataset.off'), 'false')
        check('метроном кнопка вкл (off=false)', page.eval_on_selector('#metro-btn', 'el=>el.dataset.off'), 'false')
        check('зум карточки = 1.2', page.eval_on_selector('.task-card', 'el=>el.style.zoom'), lambda s: s in ('1.2', '120%'))
        check('зум-значение 120%', page.eval_on_selector('#zoom-val', 'el=>el.textContent'), '120%')

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
