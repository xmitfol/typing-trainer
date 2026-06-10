"""
Verify Polish-пакет — два пункта аудита:
  1. Onboarding tech-plate скрыт (по design VARIANT C — silent detection)
  2. Task toolbar: hide-indicator + preview-off (real) + voice/case (stubs)
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'polish_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed(page):
    page.evaluate("""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
            name:'Тест', character:'anna', audience:'adult', gender:'m',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }));
        localStorage.removeItem('typing_trainer_lesson_progress');
    """)


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 1100})

        # ─── 1. Onboarding tech-plate ───
        page = ctx.new_page()
        page.goto(f'{BASE}/onboarding.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#userName', timeout=5000)
        page.wait_for_timeout(500)
        plate_count = page.locator('.onboarding-v2__detected').count()
        plate_text_in_body = 'Определили автоматически' in page.evaluate('document.body.innerText')
        print(f'1) Onboarding tech-plate: .onboarding-v2__detected count={plate_count}, text-in-body={plate_text_in_body}')
        if plate_count == 0 and not plate_text_in_body:
            print('   ✅ плашка скрыта (silent detection)')
        else:
            failed += 1; print('   ❌')
        shot(page, '01_onboarding_no_plate')
        page.close()

        # ─── 2. Task toolbar: новые 4 кнопки ───
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        seed(page)
        page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
        page.wait_for_selector('#target .word', timeout=5000)
        page.wait_for_timeout(500)

        hide_ind = page.locator('#hide-indicator-btn').count()
        preview_off = page.locator('#preview-off-btn').count()
        voice_stub = page.locator('#voice-btn.tool-btn--soon').count()
        case_stub = page.locator('#case-btn.tool-btn--soon').count()
        print(f'2) Toolbar кнопки: hide-indicator={hide_ind}, preview-off={preview_off}, voice-stub={voice_stub}, case-stub={case_stub}')
        if hide_ind == 1 and preview_off == 1 and voice_stub == 1 and case_stub == 1:
            print('   ✅ все 4 кнопки добавлены')
        else:
            failed += 1; print('   ❌')

        # ─── 3. Hide-indicator: клик → task-card.hide-indicator + persist ───
        page.click('#hide-indicator-btn')
        page.wait_for_timeout(300)
        has_hide_cls = page.evaluate("document.querySelector('.task-card').classList.contains('hide-indicator')")
        saved_pref = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'{}').hideIndicator")
        # Проверим что cur-highlight на target.cur визуально нейтрализован (background transparent)
        cur_bg = page.evaluate("""
            (() => {
                const cur = document.querySelector('.target .cur');
                if (!cur) return null;
                return getComputedStyle(cur).backgroundColor;
            })()
        """)
        print(f'3) Hide-indicator click: task-card.hide-indicator={has_hide_cls}, profile.hideIndicator={saved_pref}, cur bg="{cur_bg}"')
        if has_hide_cls and saved_pref is True and ('0, 0, 0, 0' in str(cur_bg) or 'transparent' in str(cur_bg)):
            print('   ✅ hide-indicator работает + сохраняется')
        else:
            failed += 1; print('   ❌')
        shot(page, '02_task_hide_indicator')

        # ─── 4. Preview-off: клик → task-card.preview-off + ▪ symbols ───
        page.click('#preview-off-btn')
        page.wait_for_timeout(300)
        has_preview_cls = page.evaluate("document.querySelector('.task-card').classList.contains('preview-off')")
        saved_preview = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_profile')||'{}').previewOff")
        # Проверим что ▪ показывается через ::after на скрытых символах
        first_hidden_char = page.evaluate("""
            (() => {
                const ch = document.querySelector('.target .word > span:not(.done):not(.cur)');
                if (!ch) return null;
                return {
                    fontSize: getComputedStyle(ch).fontSize,
                    afterContent: getComputedStyle(ch, '::after').content
                };
            })()
        """)
        print(f'4) Preview-off click: task-card.preview-off={has_preview_cls}, profile.previewOff={saved_preview}')
        print(f'   first hidden char: {first_hidden_char}')
        if (has_preview_cls and saved_preview is True
                and first_hidden_char and '▪' in (first_hidden_char.get('afterContent') or '')):
            print('   ✅ preview-off работает + ▪ показываются')
        else:
            failed += 1; print('   ❌')
        shot(page, '03_task_preview_off')

        # ─── 5. Reload → состояния восстанавливаются ───
        page.reload()
        page.wait_for_selector('#target .word', timeout=5000)
        page.wait_for_timeout(700)
        hide_after = page.evaluate("document.querySelector('.task-card').classList.contains('hide-indicator')")
        preview_after = page.evaluate("document.querySelector('.task-card').classList.contains('preview-off')")
        print(f'5) После reload: hide-indicator={hide_after}, preview-off={preview_after}')
        if hide_after and preview_after:
            print('   ✅ состояния восстановлены из profile')
        else:
            failed += 1; print('   ❌')

        # ─── 6. Toggle off — классы убираются ───
        page.click('#hide-indicator-btn')
        page.wait_for_timeout(200)
        page.click('#preview-off-btn')
        page.wait_for_timeout(200)
        hide_off = page.evaluate("document.querySelector('.task-card').classList.contains('hide-indicator')")
        preview_off_after = page.evaluate("document.querySelector('.task-card').classList.contains('preview-off')")
        print(f'6) Toggle off: hide={hide_off}, preview={preview_off_after}')
        if not hide_off and not preview_off_after:
            print('   ✅ toggle off корректно')
        else:
            failed += 1; print('   ❌')

        ctx.close(); b.close()

    print()
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
