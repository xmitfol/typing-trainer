"""
Local E2E verification for user's specific onboarding+lesson scenario.
Runs http.server in-process, then drives Chromium via Playwright on Windows.

User scenario:
  1. Onboarding overlay appears on first visit
  2. Fill: name=Тест, profile=Мужчина(Anna), keyboard=Classic, language=Russian
  3. Submit form → Welcome modal → click Поехали!
  4. Lesson 1 preview shows (Первые буквы: А, О, В, Н + WPM + error limit)
  5. Click "Напечатать этот текст"
  6. Anna lessonStart toast (top-right)
  7. Type a few wrong chars → tooManyErrors toast at half-limit
  8. Continue to errorLimitExceeded OR (in second pass) complete fully → lessonCompleteSuccess
"""
import io
import os
import subprocess
import sys
import time
from pathlib import Path

# Force UTF-8 output on Windows console
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SCREENS = ROOT / 'verify-screenshots-local'
SCREENS.mkdir(exist_ok=True)
PORT = 8765
URL = f'http://127.0.0.1:{PORT}'

LESSON_TEXT = 'ааа ооо ввв ннн оно она он ан на'  # tier1/lesson_01.json text

# 1. Start http.server
print(f'[setup] starting http.server on {PORT}')
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT),
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

toast_log = []   # all toasts captured by side-channel hook

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()

        page.on('console', lambda msg: print(f'  [browser/{msg.type}] {msg.text}') if msg.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: print(f'  [page-error] {e}'))

        def shot(name, full=False):
            path = SCREENS / f'{name}.png'
            page.screenshot(path=str(path), full_page=full)
            print(f'  shot -> {path.name}')

        # --- Stage 1: fresh visit ---
        print('\n=== Stage 1: fresh visit → onboarding overlay ===')
        # Wipe storage by navigating with empty storage state
        page.goto(URL + '/index.html')
        # Force-clear localStorage to guarantee "first visit" semantics
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#onboardingOverlay.active', timeout=5000)
        page.wait_for_timeout(300)
        shot('01-onboarding')

        # --- Stage 2: fill form ---
        print('\n=== Stage 2: fill onboarding form (name=Тест, Мужчина/Anna, Classic, Russian) ===')
        # Fill via JS to avoid Cyrillic keyboard.type quirks
        page.evaluate("""(name) => {
            const el = document.getElementById('userName');
            el.value = name;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""", 'Тест')
        page.click('.profile-cards .selection-card[data-character="anna"]')
        page.click('.keyboard-cards .selection-card[data-keyboard="classic"]')
        page.click('.language-cards .selection-card[data-language="ru"]')
        page.wait_for_timeout(200)
        shot('02-form-filled')

        # Hook toastManager to log all toasts (must be before submit; lessonStart fires later)
        page.evaluate("""() => {
            window.__toastLog = [];
            const wait = () => {
                if (window.toastManager && window.toastManager.show) {
                    const orig = window.toastManager.show.bind(window.toastManager);
                    window.toastManager.show = function(msg, emoji, dur, opts) {
                        window.__toastLog.push({
                            ts: Date.now(),
                            msg: String(msg).slice(0, 200),
                            emoji: emoji,
                            type: (opts && opts.type) || 'info'
                        });
                        return orig(msg, emoji, dur, opts);
                    };
                    console.log('[hook] toastManager wrapped');
                } else {
                    setTimeout(wait, 100);
                }
            };
            wait();
        }""")

        # --- Stage 3: submit → welcome modal ---
        print('\n=== Stage 3: submit → welcome modal ===')
        page.evaluate("document.getElementById('submitOnboarding').scrollIntoView({block:'center'})")
        page.wait_for_timeout(150)
        page.click('#submitOnboarding', force=True)
        page.wait_for_selector('#welcomeModal.active', timeout=5000)
        page.wait_for_timeout(300)
        shot('03-welcome-modal')

        # --- Stage 4: dismiss welcome → lesson preview ---
        print('\n=== Stage 4: dismiss welcome → lesson preview ===')
        page.click('#welcomeButton')
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(500)
        # Verify lesson title contains "Первые буквы: А, О, В, Н"
        indicator_text = page.evaluate("document.getElementById('lessonIndicator').textContent")
        print(f'  lessonIndicator: {indicator_text!r}')
        shot('04-lesson-preview', full=True)

        # --- Stage 5: start test → lessonStart toast ---
        print('\n=== Stage 5: click "Напечатать этот текст" → lessonStart toast ===')
        cs_state = page.evaluate("""() => ({
            characterSystem: !!window.characterSystem,
            isReady: window.characterSystem && window.characterSystem.isReady && window.characterSystem.isReady(),
            charName: window.characterSystem && window.characterSystem.character && window.characterSystem.character.name,
            currentLesson: !!(window.typingTrainer && window.typingTrainer.state.currentLesson),
            errorLimit: window.typingTrainer && window.typingTrainer.state.currentLesson && window.typingTrainer.state.currentLesson.error_limit
        })""")
        print(f'  pre-click state: {cs_state}')
        page.click('.start-btn')
        try:
            page.wait_for_selector('.toast.show', timeout=4000)
        except Exception as e:
            print(f'  [warn] no .toast.show appeared within 4s: {e}')
        page.wait_for_timeout(300)
        shot('05-lessonStart-toast')

        # Wait for first toast to clear so subsequent toasts are visible
        page.wait_for_timeout(3500)

        # --- Stage 6: type 1 wrong char → tooManyErrors (half-limit; error_limit=2 → fires at 1) ---
        print('\n=== Stage 6: introduce 1 error → tooManyErrors toast at half-limit ===')
        page.focus('#hiddenInput')
        # First char of lesson is 'а'; type 'x' to make an error
        page.evaluate("""() => {
            const el = document.getElementById('hiddenInput');
            el.value = el.value + 'x';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""")
        page.wait_for_timeout(200)
        # Now type a few correct chars to keep lesson alive
        for ch in 'аа ооо':
            page.evaluate("""(c) => {
                const el = document.getElementById('hiddenInput');
                el.value = el.value + c;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""", ch)
            page.wait_for_timeout(60)
        page.wait_for_timeout(600)
        shot('06-tooManyErrors-toast')

        # --- Stage 7: trigger error limit exceeded by typing one more wrong char ---
        print('\n=== Stage 7: 2nd error → errorLimitExceeded toast ===')
        page.wait_for_timeout(3500)  # let prev toast fade
        page.evaluate("""() => {
            const el = document.getElementById('hiddenInput');
            el.value = el.value + 'z';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""")
        page.wait_for_timeout(1500)
        shot('07-errorLimitExceeded')

        # Pull all toasts captured so far
        toasts_pass1 = page.evaluate('window.__toastLog')
        print('\n--- Toasts captured (pass 1: partial + errors) ---')
        for t in toasts_pass1:
            print(f'  [{t["type"]}] {t["emoji"]} {t["msg"]}')

        # --- Stage 8: clean run → lessonCompleteSuccess ---
        print('\n=== Stage 8: reset lesson, type full text correctly → lessonCompleteSuccess ===')
        # Wipe current lesson state and reload
        page.evaluate("""() => {
            localStorage.removeItem('typing_trainer_current_lesson');
            window.__toastLog = [];
        }""")
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(500)
        # Re-hook toast manager after reload
        page.evaluate("""() => {
            window.__toastLog = [];
            const wait = () => {
                if (window.toastManager && window.toastManager.show) {
                    const orig = window.toastManager.show.bind(window.toastManager);
                    window.toastManager.show = function(msg, emoji, dur, opts) {
                        window.__toastLog.push({
                            ts: Date.now(),
                            msg: String(msg).slice(0, 200),
                            emoji: emoji,
                            type: (opts && opts.type) || 'info'
                        });
                        return orig(msg, emoji, dur, opts);
                    };
                } else {
                    setTimeout(wait, 100);
                }
            };
            wait();
        }""")
        page.click('.start-btn')
        page.wait_for_selector('.toast.show', timeout=4000)
        page.wait_for_timeout(3500)
        page.focus('#hiddenInput')
        for ch in LESSON_TEXT:
            page.evaluate("""(c) => {
                const el = document.getElementById('hiddenInput');
                el.value = el.value + c;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""", ch)
            page.wait_for_timeout(35)
        actual = page.evaluate("document.getElementById('hiddenInput').value")
        print(f'  hiddenInput.value (len={len(actual)}): {actual!r}')
        page.wait_for_timeout(2000)
        shot('08-lessonComplete')

        toasts_pass2 = page.evaluate('window.__toastLog')
        print('\n--- Toasts captured (pass 2: clean run) ---')
        for t in toasts_pass2:
            print(f'  [{t["type"]}] {t["emoji"]} {t["msg"]}')

        # Also check certificate / completion UI state
        complete_state = page.evaluate("""() => ({
            lessonControlsVisible: document.getElementById('lessonControls').style.display !== 'none',
            nextBtnText: document.getElementById('lessonNextBtn') && document.getElementById('lessonNextBtn').textContent,
            hint: document.getElementById('lessonControlsHint') && document.getElementById('lessonControlsHint').textContent
        })""")
        print(f'  completion UI: {complete_state}')

        browser.close()
        print('\n[done]')

finally:
    print('[teardown] stopping http.server')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
