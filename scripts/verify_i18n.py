"""
Verify i18n: переключение языка на settings.html, проверка применения к DOM.
Дополнительно: повторное открытие настроек после смены — должно остаться EN.
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'i18n_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed(page, lang='ru'):
    page.evaluate(f"""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({{
            name:'Тест', character:'anna', audience:'adult', gender:'m',
            language:'{lang}', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }}));
    """)


def main():
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1000})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

        # ─── 1. settings.html на RU (default) — все строки на русском ───
        page.goto(f'{BASE}/index.html')
        seed(page, 'ru')
        page.goto(f'{BASE}/settings.html')
        page.wait_for_selector('#sp-name-input', timeout=5000)
        page.wait_for_timeout(600)
        h1_ru = page.evaluate("document.querySelector('.sp-h1 span[data-i18n=\"settings.title\"]')?.textContent || ''")
        back_ru = page.evaluate("document.querySelector('.sp-back')?.textContent || ''")
        kbtype_label = page.evaluate("document.querySelector('label[for=\"sp-kb-type\"]')?.textContent || ''")
        print(f'1) RU: h1="{h1_ru}", back="{back_ru}", kbtype label="{kbtype_label}"')
        if h1_ru == 'Настройки' and 'Главная' in back_ru and 'Тип' in kbtype_label:
            print('   ✅ RU дефолтный — все строки локализованы как русские')
        else:
            failed += 1; print('   ❌ строки не русские')
        shot(page, '01_ru_settings')

        # ─── 2. Клик на EN-кнопку — строки сразу меняются ───
        page.click('button[data-lang="en"]')
        page.wait_for_timeout(700)
        h1_en = page.evaluate("document.querySelector('.sp-h1 span[data-i18n=\"settings.title\"]')?.textContent || ''")
        back_en = page.evaluate("document.querySelector('.sp-back')?.textContent || ''")
        crumb_en = page.evaluate("document.querySelector('.sp-title')?.textContent || ''")
        gender_m_en = page.evaluate("document.querySelector('button[data-gender=\"m\"]')?.textContent || ''")
        kbtype_label_en = page.evaluate("document.querySelector('label[for=\"sp-kb-type\"]')?.textContent || ''")
        print(f'2) EN: h1="{h1_en}", back="{back_en}", crumb="{crumb_en}", М="{gender_m_en}", kbtype="{kbtype_label_en}"')
        ok2 = (h1_en == 'Settings' and 'Home' in back_en and 'SETTINGS' in crumb_en
               and gender_m_en == 'Male' and kbtype_label_en == 'Keyboard type')
        if ok2:
            print('   ✅ EN применён — все ключевые строки переключились')
        else:
            failed += 1; print('   ❌ что-то не переключилось')
        shot(page, '02_en_settings')

        # ─── 3. profile.language сохранён ───
        saved_lang = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'{}').language")
        print(f'3) profile.language = {saved_lang!r}')
        if saved_lang == 'en':
            print('   ✅ язык записан в профиль')
        else:
            failed += 1; print('   ❌')

        # ─── 4. Перезагрузка → EN остаётся ───
        page.reload()
        page.wait_for_selector('#sp-name-input', timeout=5000)
        page.wait_for_timeout(600)
        h1_reload = page.evaluate("document.querySelector('.sp-h1 span[data-i18n=\"settings.title\"]')?.textContent || ''")
        print(f'4) После reload: h1="{h1_reload}"')
        if h1_reload == 'Settings':
            print('   ✅ EN сохраняется между навигациями')
        else:
            failed += 1; print('   ❌')

        # ─── 5. html[lang] обновляется ───
        html_lang = page.evaluate("document.documentElement.getAttribute('lang')")
        print(f'5) <html lang>="{html_lang}"')
        if html_lang == 'en':
            print('   ✅ atom lang атрибут обновлён')
        else:
            failed += 1; print('   ❌')

        # ─── 6. Возврат на RU ───
        page.click('button[data-lang="ru"]')
        page.wait_for_timeout(500)
        h1_back = page.evaluate("document.querySelector('.sp-h1 span[data-i18n=\"settings.title\"]')?.textContent || ''")
        print(f'6) Switch back to RU: h1="{h1_back}"')
        if h1_back == 'Настройки':
            print('   ✅ ru возврат работает')
        else:
            failed += 1; print('   ❌')

        # ─── 7. EN cross-page check — переключим на EN и пройдёмся по страницам ───
        page.click('button[data-lang="en"]')
        page.wait_for_timeout(500)
        cross_pages = [
            # dashboard: проверяем nav (всегда видимо) + quick-actions (cards)
            ('dashboard.html', ['Home', 'Lessons', 'Stats', 'My lessons']),
            ('builder.html',   ['My lessons', 'New lesson', 'Save lesson']),
            ('lesson.html?tier=tier1&lesson=1',  ['Home', 'YOUR MENTOR', 'EXERCISE']),
            ('task.html?tier=tier1&lesson=1',    ['TIME', 'SPEED', 'ACCURACY', "MENTOR'S TIP"]),
            ('course.html',    []),  # минимум: страница открывается без ошибок
            ('achievements.html', ['Achievements']),
            # index.html в auth-mode (профиль set) → demo button скрыт, primary CTA = Continue training
            ('index.html',     ['Continue training', 'Keyboards', 'How it works']),
        ]
        for url, expected in cross_pages:
            page.goto(f'{BASE}/{url}')
            page.wait_for_load_state('domcontentloaded')
            page.wait_for_timeout(800)
            body_text = page.evaluate("document.body.innerText")
            missing = [s for s in expected if s not in body_text]
            if not missing:
                print(f'7) {url}: EN OK ({", ".join(expected) if expected else "page loaded"})')
            else:
                failed += 1
                print(f'7) {url}: EN MISSING {missing}')

        print()
        print(f'page/console errors: {len(errs)}')
        for e in errs[:5]: print('  ', e)
        print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')

        ctx.close()
        browser.close()
        sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
