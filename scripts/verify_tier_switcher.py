"""
Visual verification of tier-switcher polish:
- 5 tiers grouped by language (RU row + EN row)
- Language badge (RU/EN) on each pill
- Age-kind accent border-left (adult/diagnostic/teen/kids)
- Active state highlighted
- Light + dark theme variants
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
PORT = 8767
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

        for theme in ['light', 'dark']:
            print(f'\n=== Tier-switcher (theme={theme}) ===')
            ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, color_scheme=theme)
            page = ctx.new_page()
            page.goto(URL + '/index.html')
            # Seed user profile so onboarding doesn't block
            page.evaluate("""() => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
                    name: 'Tester', character: 'anna', gender: 'male', ageGroup: 'adult',
                    keyboardType: 'classic', language: 'ru', onboardingCompleted: true,
                    createdAt: new Date().toISOString()
                }));
            }""")
            page.reload()
            page.wait_for_selector('#tierSwitcher', timeout=5000)
            page.wait_for_timeout(800)

            # Sidebar screenshot
            sidebar = page.locator('.sidebar').first
            sidebar.screenshot(path=str(SCREENS / f'tier-{theme}-sidebar.png'))
            print(f'  shot tier-{theme}-sidebar.png')

            # Read out DOM structure for sanity
            state = page.evaluate("""() => {
                const groups = document.querySelectorAll('.tier-group');
                return Array.from(groups).map(g => ({
                    lang: g.dataset.lang,
                    pills: Array.from(g.querySelectorAll('.tier-pill')).map(p => ({
                        tier: p.dataset.tier,
                        lang: p.dataset.lang,
                        kind: p.dataset.kind,
                        active: p.classList.contains('tier-active'),
                        text: p.textContent.trim().replace(/\\s+/g,' ')
                    }))
                }));
            }""")
            print('  DOM groups:')
            for g in state:
                print(f"    [{g['lang']}]")
                for p in g['pills']:
                    mark = '★' if p['active'] else ' '
                    print(f"      {mark} {p['tier']:>10} kind={p['kind']:<10} text={p['text']!r}")

            # Click EN Junior pill to verify switch works and active state moves
            page.click('.tier-pill[data-tier="en_teen"]')
            page.wait_for_timeout(400)
            sidebar.screenshot(path=str(SCREENS / f'tier-{theme}-junior-active.png'))
            print(f'  shot tier-{theme}-junior-active.png')

            ctx.close()

        browser.close()
    print('\n[done]')

finally:
    print('[teardown]')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
