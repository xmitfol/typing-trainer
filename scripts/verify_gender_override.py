"""
Verify gender-override в онбординге (VARIANT C из design_handoff_full):
  1. Кнопки М/Ж присутствуют, видимы, кликабельны
  2. Hint показывает «Определили по имени» при автодетекте
  3. После клика на «Ж» override → hint «Выбрано вручную»
  4. saved profile.gender отражает override
  5. Смена имени НЕ сбрасывает manual gender (если был установлен вручную)
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'gender_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def main():
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1000})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

        page.goto(f'{BASE}/onboarding.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#userName', timeout=5000)
        page.wait_for_timeout(500)

        # 1. Buttons exist + visible (используем класс кнопки, иначе селектор перехватит карточки аудитории)
        m_btn = page.locator('.onboarding-v2__gender-btn[data-gender="m"]')
        f_btn = page.locator('.onboarding-v2__gender-btn[data-gender="f"]')
        m_visible = m_btn.is_visible()
        f_visible = f_btn.is_visible()
        print(f'1) М/Ж кнопки: М visible={m_visible}, Ж visible={f_visible}')
        if not (m_visible and f_visible): failed += 1; print('   ❌');
        else: print('   ✅')
        shot(page, '01_empty_form')

        # 2. Type female-ending name → autodetect should be 'f'
        page.locator('#userName').click()
        page.keyboard.type('Анна', delay=40)
        page.wait_for_timeout(400)
        active_f = f_btn.get_attribute('data-active')
        active_m = m_btn.get_attribute('data-active')
        hint_txt = page.evaluate("document.getElementById('nameHint')?.textContent || ''")
        print(f'2) Имя «Анна» → М active={active_m}, Ж active={active_f}, hint="{hint_txt[:60]}"')
        if active_f == 'true' and 'имени' in hint_txt.lower():
            print('   ✅ autodetect=female + hint про автодетект')
        else:
            failed += 1; print('   ❌')
        shot(page, '02_autodetect_female')

        # 3. Click М → override
        m_btn.click()
        page.wait_for_timeout(300)
        active_m2 = m_btn.get_attribute('data-active')
        active_f2 = f_btn.get_attribute('data-active')
        hint_txt2 = page.evaluate("document.getElementById('nameHint')?.textContent || ''")
        print(f'3) Override клик «М»: М={active_m2}, Ж={active_f2}, hint="{hint_txt2[:60]}"')
        if active_m2 == 'true' and 'вручную' in hint_txt2.lower():
            print('   ✅ manual override + hint «Выбрано вручную»')
        else:
            failed += 1; print('   ❌')
        shot(page, '03_override_male')

        # 4. Submit, проверить сохранённый gender в localStorage
        page.click('[data-audience="adult"]')
        page.wait_for_timeout(200)
        try:
            page.click('[data-mentor="anna"]', timeout=2000)
        except Exception:
            page.click('[data-mentor="maxim"]', timeout=2000)
        page.wait_for_timeout(200)
        page.click('#submitOnboarding')
        page.wait_for_timeout(800)

        saved = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'{}')")
        print(f'4) saved profile: gender={saved.get("gender")!r}, genderManual={saved.get("genderManual")!r}')
        if saved.get('gender') == 'm' and saved.get('genderManual') is True:
            print('   ✅ gender=m + genderManual=true сохранены')
        else:
            failed += 1; print('   ❌')

        # 5. После reset вернёмся в онбординг, наберём женское имя → manual=false → autodetect снова работает
        page.evaluate('localStorage.clear()')
        page.goto(f'{BASE}/onboarding.html')
        page.wait_for_selector('#userName', timeout=5000)
        page.wait_for_timeout(400)
        page.locator('#userName').click()
        page.keyboard.type('Дмитрий', delay=40)
        page.wait_for_timeout(400)
        active_m3 = page.locator('.onboarding-v2__gender-btn[data-gender="m"]').get_attribute('data-active')
        print(f'5) Re-open + «Дмитрий» → М={active_m3} (auto)')
        if active_m3 == 'true':
            print('   ✅ autodetect=male после очистки')
        else:
            failed += 1; print('   ❌')
        shot(page, '04_autodetect_male')

        # 6. Изменяем имя на «Ольга» (женское) — autodetect должен переключиться (manual=false)
        page.locator('#userName').fill('Ольга')
        page.wait_for_timeout(400)
        active_f6 = page.locator('.onboarding-v2__gender-btn[data-gender="f"]').get_attribute('data-active')
        print(f'6) Сменили имя «Ольга» (auto-mode) → Ж={active_f6}')
        if active_f6 == 'true':
            print('   ✅ autodetect переключился по новому имени')
        else:
            failed += 1; print('   ❌')

        # 7. Override на М, потом меняем имя — manual должен сохраниться
        page.locator('.onboarding-v2__gender-btn[data-gender="m"]').click()
        page.wait_for_timeout(200)
        page.locator('#userName').fill('Светлана')
        page.wait_for_timeout(400)
        active_m7 = page.locator('.onboarding-v2__gender-btn[data-gender="m"]').get_attribute('data-active')
        hint_7 = page.evaluate("document.getElementById('nameHint')?.textContent || ''")
        print(f'7) Override=М, потом «Светлана» → М={active_m7}, hint="{hint_7[:60]}"')
        if active_m7 == 'true' and 'вручную' in hint_7.lower():
            print('   ✅ manual override устоял против смены имени')
        else:
            failed += 1; print('   ❌')

        print()
        print(f'page/console errors: {len(errs)}')
        for e in errs[:5]: print('  ', e)
        print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')

        ctx.close()
        browser.close()
        sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
