"""
Showcase v0.2-parity — захватывает ключевые UI-состояния для демонстрации.
"""
import io, subprocess, sys, time
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SCREENS = ROOT / 'verify-screenshots-local'
SCREENS.mkdir(exist_ok=True)
PORT = 8771
URL = f'http://127.0.0.1:{PORT}'

server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

def seed(page, character, language):
    page.evaluate("""(args) => {
        localStorage.clear();
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
            name: 'Иван', character: args[0], gender: 'male', ageGroup: 'adult',
            keyboardType: 'classic', language: args[1], onboardingCompleted: true,
            createdAt: new Date().toISOString()
        }));
    }""", [character, language])

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # 1. Онбординг (fresh visit)
        print('1. Onboarding overlay')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200})
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#onboardingOverlay.active', timeout=5000)
        page.wait_for_timeout(500)
        page.screenshot(path=str(SCREENS / 'showcase-01-onboarding.png'), full_page=False)
        ctx.close()

        # 2-4. Full app screenshots for 3 RU tiers
        for character, lang, label, num in [('anna', 'ru', 'rusadult', '02'),
                                              ('knopych', 'ru', 'ruteen', '03'),
                                              ('klavochka', 'ru', 'rukids', '04')]:
            print(f'{num}. Full app — {label}')
            ctx = browser.new_context(viewport={'width': 1400, 'height': 1000})
            page = ctx.new_page()
            page.goto(URL + '/index.html')
            seed(page, character, lang)
            page.reload()
            page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
            page.wait_for_timeout(800)
            page.screenshot(path=str(SCREENS / f'showcase-{num}-{label}-full.png'), full_page=False)
            ctx.close()

        # 5. EN teen с EN UI
        print('5. EN teen с EN UI')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1000})
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        seed(page, 'knopych', 'en')
        page.evaluate("localStorage.setItem('typing_trainer_ui_language', 'en')")
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SCREENS / 'showcase-05-enteen-eng-ui.png'), full_page=False)
        ctx.close()

        # 6. Settings panel (RU)
        print('6. Settings panel')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100})
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        seed(page, 'anna', 'ru')
        page.reload()
        page.wait_for_selector('#settingsGearBtn', timeout=5000)
        page.wait_for_timeout(500)
        page.click('#settingsGearBtn')
        page.wait_for_selector('#settingsModal.active', timeout=3000)
        page.wait_for_timeout(400)
        page.locator('.settings-card').screenshot(path=str(SCREENS / 'showcase-06-settings.png'))
        ctx.close()

        # 7. Welcome modal (fresh onboarding flow)
        print('7. Welcome modal')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200})
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#onboardingOverlay.active', timeout=5000)
        page.evaluate("""() => {
            const el = document.getElementById('userName');
            el.value = 'Иван';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""")
        page.click('.profile-cards .selection-card[data-character="anna"]')
        page.click('.keyboard-cards .selection-card[data-keyboard="classic"]')
        page.click('.language-cards .selection-card[data-language="ru"]')
        page.wait_for_timeout(150)
        page.evaluate("document.getElementById('submitOnboarding').scrollIntoView({block:'center'})")
        page.click('#submitOnboarding', force=True)
        page.wait_for_selector('#welcomeModal.active', timeout=5000)
        page.wait_for_timeout(400)
        page.screenshot(path=str(SCREENS / 'showcase-07-welcome.png'), full_page=False)
        ctx.close()

        # 8. Dark theme (RU adult, dark)
        print('8. Dark theme')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1000}, color_scheme='dark')
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        seed(page, 'anna', 'ru')
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SCREENS / 'showcase-08-dark.png'), full_page=False)
        ctx.close()

        browser.close()
    print('\nDone.')
finally:
    server.terminate()
    try: server.wait(timeout=5)
    except: server.kill()
