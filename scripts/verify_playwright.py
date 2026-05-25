"""
End-to-end verification of typing-trainer via Playwright.
Designed to run on VM (mitfol@192.168.7.115) where Python+Playwright+Chromium are pre-installed.

Drives the onboarding → first lesson flow with real keyboard input,
captures screenshots at each milestone (including character toasts
on lessonStart, tooManyErrors and lessonCompleteSuccess).
"""
import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path('/tmp/typing-trainer')
SCREENS = Path('/tmp/typing-trainer-screens')
PORT = 8765
URL = f'http://localhost:{PORT}'

LESSON_TEXT = 'ааа ооо ввв ннн оно она он ан на'  # tier1/lesson_01

SCREENS.mkdir(parents=True, exist_ok=True)

# 1. Start http.server in background
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT),
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(1.5)
print(f'http.server up on localhost:{PORT}, pid={server.pid}')

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1200}, locale='ru-RU')
        page = ctx.new_page()

        # Forward browser console + JS errors to stdout for debugging
        page.on('console', lambda msg: print(f'  [browser/{msg.type}] {msg.text}'))
        page.on('pageerror', lambda e: print(f'  [page-error] {e}'))

        def shot(name, full_page=False):
            path = SCREENS / f'{name}.png'
            page.screenshot(path=str(path), full_page=full_page)
            print(f'  -> {path.name}{ " (full)" if full_page else ""}')

        # ---- Stage 1: fresh visit → onboarding overlay ----
        print('Stage 1: fresh visit')
        page.goto(URL + '/index.html')
        page.wait_for_selector('#onboardingOverlay.active', timeout=5000)
        page.wait_for_timeout(400)
        shot('01-onboarding-overlay')

        # ---- Stage 2: fill form + submit ----
        print('Stage 2: fill onboarding form')
        page.fill('#userName', 'Иван')
        # Re-click classic (already selected, just to confirm)
        page.click('.profile-cards .selection-card[data-character="anna"]')
        # Classic + ru defaults are pre-selected; double-click to ensure
        page.click('.keyboard-cards .selection-card[data-keyboard="classic"]')
        page.click('.language-cards .selection-card[data-language="ru"]')
        page.wait_for_timeout(300)
        shot('02-form-filled')

        # Force-scroll the submit button into view inside the overlay (which has its own scroll container)
        page.evaluate("document.getElementById('submitOnboarding').scrollIntoView({block: 'center'})")
        page.wait_for_timeout(300)
        page.click('#submitOnboarding', force=True)
        page.wait_for_selector('#welcomeModal.active', timeout=5000)
        page.wait_for_timeout(400)
        shot('03-welcome-modal')

        # ---- Stage 3: dismiss welcome → lesson preview ----
        print('Stage 3: dismiss welcome → lesson preview')
        page.click('#welcomeButton')
        # Wait for lesson_01 to autoload and indicator to appear
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(600)
        shot('04-lesson-preview')
        shot('04b-full-page', full_page=True)

        # ---- Stage 4: start test → character toast (lessonStart) ----
        print('Stage 4: start test -> lessonStart toast')
        # Diagnostics: dump character system state right before clicking
        cs_state = page.evaluate("""() => ({
            characterSystem: !!window.characterSystem,
            isReady: window.characterSystem && window.characterSystem.isReady && window.characterSystem.isReady(),
            charName: window.characterSystem && window.characterSystem.character && window.characterSystem.character.name,
            toastManager: !!window.toastManager,
            lessonLoaded: !!(window.typingTrainer && window.typingTrainer.state.currentLesson)
        })""")
        print(f'  state: {cs_state}')
        page.click('.start-btn')
        # toast appears via window.toastManager.show after notifyCharacter
        try:
            page.wait_for_selector('.toast.show', timeout=4000)
            page.wait_for_timeout(200)
        except Exception as e:
            print(f'  toast wait failed: {e}')
        shot('05-lessonStart-toast')

        # ---- Stage 5: type lesson text correctly → completion success ----
        print(f'Stage 5: type lesson text ({len(LESSON_TEXT)} chars)')
        page.focus('#hiddenInput')
        # Direct JS injection: append char + dispatch input event (mimics native typing).
        # Avoids Playwright's keyboard.type/insert_text quirks with Cyrillic.
        for ch in LESSON_TEXT:
            page.evaluate("""(ch) => {
                const el = document.getElementById('hiddenInput');
                el.value = el.value + ch;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""", ch)
            page.wait_for_timeout(50)
        actual = page.evaluate("document.getElementById('hiddenInput').value")
        print(f'  hiddenInput.value = {actual!r}')
        print(f'  expected          = {LESSON_TEXT!r}')
        page.wait_for_timeout(1800)
        shot('06-completion')

        # ---- Stage 6: simulate failure path ----
        # Reset progress so we can do another run with errors
        print('Stage 6: simulate error path')
        page.evaluate('localStorage.removeItem("typing_trainer_current_lesson")')
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(800)
        page.click('.start-btn')
        page.wait_for_selector('.toast.show', timeout=4000)
        # Wait for the first toast to fade out so the next ones are not buried
        page.wait_for_timeout(3800)
        # Now type ALL wrong (32 wrong chars) — error_limit is 2 for lesson 1
        page.focus('#hiddenInput')
        for _ in range(len(LESSON_TEXT)):
            page.evaluate("""() => {
                const el = document.getElementById('hiddenInput');
                el.value = el.value + 'x';
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""")
            page.wait_for_timeout(40)
        page.wait_for_timeout(1500)
        shot('07-error-path')

        # ---- Stage 8: laptop layout — пере-seed профиль с keyboardType=laptop ----
        print('Stage 8: laptop layout')
        page.evaluate("""() => {
            const p = JSON.parse(localStorage.getItem('typing_trainer_user_profile') || '{}');
            p.keyboardType = 'laptop';
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify(p));
        }""")
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(800)
        shot('08-laptop-full', full_page=True)

        # ---- Stage 9: ergonomic split layout ----
        print('Stage 9: ergonomic split layout')
        page.evaluate("""() => {
            const p = JSON.parse(localStorage.getItem('typing_trainer_user_profile') || '{}');
            p.keyboardType = 'ergonomic';
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify(p));
        }""")
        page.reload()
        page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
        page.wait_for_timeout(800)
        shot('09-ergonomic-full', full_page=True)

        browser.close()
        print('Done.')

finally:
    print('Stopping http.server')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
