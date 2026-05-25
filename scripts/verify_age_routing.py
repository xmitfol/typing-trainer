"""
Verify age-based routing: onboarding as Knopych/Klavochka in EN
should load en_teen/en_kids respectively. Anna in EN → en_tier1.
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
PORT = 8766
URL = f'http://127.0.0.1:{PORT}'

print(f'[setup] starting http.server on {PORT}')
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

SCENARIOS = [
    ('knopych', 'en', 'en_teen', 75, 'Кнопыч + EN → en_teen'),
    ('klavochka', 'en', 'en_kids', 50, 'Клавочка + EN → en_kids'),
    ('anna', 'en', 'en_tier1', 99, 'Anna + EN → en_tier1'),
    ('anna', 'ru', 'tier1', 39, 'Anna + RU → tier1'),
]

results = []

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        for character, language, expected_tier, expected_count, label in SCENARIOS:
            print(f'\n=== {label} ===')
            ctx = browser.new_context(viewport={'width': 1400, 'height': 1100})
            page = ctx.new_page()
            page.on('pageerror', lambda e: print(f'  [page-error] {e}'))

            page.goto(URL + '/index.html')
            page.evaluate('localStorage.clear()')
            page.reload()
            page.wait_for_selector('#onboardingOverlay.active', timeout=5000)

            # Fill form
            page.evaluate("""(name) => {
                const el = document.getElementById('userName');
                el.value = name;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""", 'Tester')
            page.click(f'.profile-cards .selection-card[data-character="{character}"]')
            page.click('.keyboard-cards .selection-card[data-keyboard="classic"]')
            page.click(f'.language-cards .selection-card[data-language="{language}"]')
            page.wait_for_timeout(200)

            page.evaluate("document.getElementById('submitOnboarding').scrollIntoView({block:'center'})")
            page.wait_for_timeout(150)
            page.click('#submitOnboarding', force=True)
            page.wait_for_selector('#welcomeModal.active', timeout=5000)
            page.click('#welcomeButton')

            # Wait for lesson to autoload
            page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
            page.wait_for_timeout(500)

            state = page.evaluate("""() => ({
                tier: window.typingTrainer && window.typingTrainer.state.currentLessonTier,
                lessonNum: window.typingTrainer && window.typingTrainer.state.currentLessonNumber,
                title: window.typingTrainer && window.typingTrainer.state.currentLesson && window.typingTrainer.state.currentLesson.title,
                totalInTier: window.typingTrainer && window.typingTrainer.getTierLessonCount(window.typingTrainer.state.currentLessonTier)
            })""")
            ok = state['tier'] == expected_tier and state['totalInTier'] == expected_count
            mark = '✅' if ok else '❌'
            print(f'  {mark} tier={state["tier"]!r} (expected {expected_tier!r}), count={state["totalInTier"]} (expected {expected_count})')
            print(f'     lesson L{state["lessonNum"]}: {state["title"]!r}')
            results.append((label, ok, state))

            ctx.close()

        browser.close()

    print('\n=== RESULTS ===')
    all_ok = all(r[1] for r in results)
    for label, ok, state in results:
        mark = '✅' if ok else '❌'
        print(f'  {mark} {label} → {state["tier"]}/L{state["lessonNum"]}')
    print(f'\n{"PASS" if all_ok else "FAIL"}: {sum(1 for r in results if r[1])}/{len(results)} scenarios')

finally:
    print('[teardown]')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
