"""
Verify UI language switcher in Settings panel:
- Toggle RU/EN updates <html lang> + persists in localStorage
- Tier-switcher labels update accordingly
- Survives reload (persistence works)
"""
import io
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SCREENS = ROOT / 'verify-screenshots-local'
SCREENS.mkdir(exist_ok=True)
PORT = 8768
URL = f'http://127.0.0.1:{PORT}'

print(f'[setup] http.server on {PORT}')
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100})
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f'  [page-error] {e}'))

        page.goto(URL + '/index.html')
        page.evaluate("""() => {
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
                name: 'Tester', character: 'anna', gender: 'male', ageGroup: 'adult',
                keyboardType: 'classic', language: 'ru', onboardingCompleted: true,
                createdAt: new Date().toISOString()
            }));
        }""")
        page.reload()
        page.wait_for_selector('#settingsGearBtn', timeout=5000)
        page.wait_for_timeout(500)

        # Open settings
        page.click('#settingsGearBtn')
        page.wait_for_selector('#settingsModal.active', timeout=3000)
        page.wait_for_timeout(400)
        page.locator('.settings-card').screenshot(path=str(SCREENS / 'ui-lang-settings-ru.png'))
        print('  shot ui-lang-settings-ru.png (RU active)')

        initial_state = page.evaluate("""() => ({
            htmlLang: document.documentElement.lang,
            localStorage: localStorage.getItem('typing_trainer_ui_language'),
            uiLangFromTrainer: window.typingTrainer.getUiLanguage(),
            tierEnTier1Label: window.typingTrainer.getTierLabel('en_tier1'),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen'),
            tierEnKidsLabel: window.typingTrainer.getTierLabel('en_kids')
        })""")
        print(f'  Initial state: {initial_state}')

        # Switch to EN
        page.click('.settings-ui-lang-pill[data-ui-lang="en"]')
        page.wait_for_timeout(500)
        page.locator('.settings-card').screenshot(path=str(SCREENS / 'ui-lang-settings-en.png'))
        print('  shot ui-lang-settings-en.png (EN active)')

        after_switch = page.evaluate("""() => ({
            htmlLang: document.documentElement.lang,
            localStorage: localStorage.getItem('typing_trainer_ui_language'),
            uiLangFromTrainer: window.typingTrainer.getUiLanguage(),
            tierEnTier1Label: window.typingTrainer.getTierLabel('en_tier1'),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen'),
            tierEnKidsLabel: window.typingTrainer.getTierLabel('en_kids'),
            tierRuMainLabel: window.typingTrainer.getTierLabel('tier1')
        })""")
        print(f'  After switch to EN: {after_switch}')

        # Close settings, screenshot sidebar (tier-switcher with EN labels)
        page.click('.settings-close')
        page.wait_for_timeout(300)
        page.locator('.sidebar').first.screenshot(path=str(SCREENS / 'ui-lang-sidebar-en.png'))
        print('  shot ui-lang-sidebar-en.png (sidebar with EN labels)')

        # Reload and verify persistence
        page.reload()
        page.wait_for_selector('.tier-switcher', timeout=5000)
        page.wait_for_timeout(500)
        after_reload = page.evaluate("""() => ({
            htmlLang: document.documentElement.lang,
            uiLangFromTrainer: window.typingTrainer.getUiLanguage(),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen')
        })""")
        print(f'  After reload (persistence test): {after_reload}')
        page.locator('.sidebar').first.screenshot(path=str(SCREENS / 'ui-lang-sidebar-en-after-reload.png'))
        print('  shot ui-lang-sidebar-en-after-reload.png')

        # Switch back to RU
        page.click('#settingsGearBtn')
        page.wait_for_selector('#settingsModal.active', timeout=3000)
        page.wait_for_timeout(400)
        page.click('.settings-ui-lang-pill[data-ui-lang="ru"]')
        page.wait_for_timeout(400)
        back_to_ru = page.evaluate("""() => ({
            htmlLang: document.documentElement.lang,
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen')
        })""")
        print(f'  Switch back to RU: {back_to_ru}')

        browser.close()
        print('\n[done]')

finally:
    print('[teardown]')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
