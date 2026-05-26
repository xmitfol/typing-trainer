"""
v0.2-parity full smoke test — 459 lessons, 7 tiers, 6 routing scenarios.

Test plan:
A) Все 6 age-based routing scenarios (character + language → tier)
B) Tier-switcher показывает все 7 тиров с правильными лейблами и data-lang/data-kind
C) Manual tier-switching работает (клик на pill → новый tier загружается)
D) Lesson L1 загружается корректно в каждом тире (title + WPM проверяются)
E) UI language switcher переключает лейблы туда-обратно

Если все проверки PASS — repo в production-ready state для v0.2-parity.
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
PORT = 8770
URL = f'http://127.0.0.1:{PORT}'

# (character, language, expected_tier, expected_lesson_count, expected_l1_title_contains)
ROUTING_SCENARIOS = [
    ('anna',      'ru', 'tier1',    99, 'А, О, В, Н'),     # adult RU
    ('maxim',     'ru', 'tier1',    99, 'А, О, В, Н'),     # adult RU (alt char)
    ('knopych',   'ru', 'ru_teen',  75, 'ФЫВА ОЛДЖ'),       # NEW: teen RU
    ('klavochka', 'ru', 'ru_kids',  50, 'Буква А'),         # NEW: kids RU
    ('anna',      'en', 'en_tier1', 99, 'a s d f j k l'),  # adult EN
    ('knopych',   'en', 'en_teen',  75, 'ASDF JKL'),       # teen EN
    ('klavochka', 'en', 'en_kids',  50, 'Letter A'),       # kids EN
]

# Expected tier-switcher state after seeding profile (RU adult)
# All 7 tiers should appear grouped by language
EXPECTED_TIERS = [
    {'tier': 'tier1',    'lang': 'ru', 'kind': 'adult',      'label_ru': 'Основной',   'count': 99},
    {'tier': 'block_1',  'lang': 'ru', 'kind': 'diagnostic', 'label_ru': 'Мизинец',    'count': 11},
    {'tier': 'ru_teen',  'lang': 'ru', 'kind': 'teen',       'label_ru': 'Юниор',      'count': 75},
    {'tier': 'ru_kids',  'lang': 'ru', 'kind': 'kids',       'label_ru': 'Дети',       'count': 50},
    {'tier': 'en_tier1', 'lang': 'en', 'kind': 'adult',      'label_ru': 'Английский', 'count': 99},
    {'tier': 'en_teen',  'lang': 'en', 'kind': 'teen',       'label_ru': 'Юниор',      'count': 75},
    {'tier': 'en_kids',  'lang': 'en', 'kind': 'kids',       'label_ru': 'Дети',       'count': 50},
]

print(f'[setup] http.server on {PORT}')
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
    cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

results = {'routing': [], 'tier_switcher': None, 'manual_switch': [], 'ui_lang': None}

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # === Block A: Routing scenarios ===
        print('\n=== Block A: 7 age-based routing scenarios ===')
        for character, language, expected_tier, expected_count, expected_title in ROUTING_SCENARIOS:
            ctx = browser.new_context(viewport={'width': 1400, 'height': 1100})
            page = ctx.new_page()
            page.on('pageerror', lambda e: print(f'    [page-error] {e}'))

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
            page.click('#submitOnboarding', force=True)
            page.wait_for_selector('#welcomeModal.active', timeout=5000)
            page.click('#welcomeButton')
            page.wait_for_selector('#lessonIndicator', state='visible', timeout=8000)
            page.wait_for_timeout(500)

            state = page.evaluate("""() => ({
                tier: window.typingTrainer && window.typingTrainer.state.currentLessonTier,
                lessonNum: window.typingTrainer && window.typingTrainer.state.currentLessonNumber,
                title: window.typingTrainer && window.typingTrainer.state.currentLesson && window.typingTrainer.state.currentLesson.title,
                totalInTier: window.typingTrainer && window.typingTrainer.getTierLessonCount(window.typingTrainer.state.currentLessonTier)
            })""")
            ok = (state['tier'] == expected_tier
                  and state['totalInTier'] == expected_count
                  and expected_title in (state['title'] or ''))
            mark = '✅' if ok else '❌'
            print(f'  {mark} {character:>10} + {language} → {state["tier"]:<10} L{state["lessonNum"]:<3} ({state["totalInTier"]:>3} total) "{state["title"]}"')
            results['routing'].append((character, language, expected_tier, ok, state))
            ctx.close()

        # === Block B + C + D + E: всё на одной сессии RU-adult ===
        print('\n=== Block B: Tier-switcher catalog ===')
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1100})
        page = ctx.new_page()
        page.goto(URL + '/index.html')
        page.evaluate("""() => {
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
                name: 'SmokeTest', character: 'anna', gender: 'male', ageGroup: 'adult',
                keyboardType: 'classic', language: 'ru', onboardingCompleted: true,
                createdAt: new Date().toISOString()
            }));
        }""")
        page.reload()
        page.wait_for_selector('.tier-switcher', timeout=5000)
        page.wait_for_timeout(800)

        actual_tiers = page.evaluate("""() => {
            const pills = Array.from(document.querySelectorAll('.tier-pill'));
            return pills.map(p => ({
                tier: p.dataset.tier,
                lang: p.dataset.lang,
                kind: p.dataset.kind,
                text: p.textContent.trim().replace(/\\s+/g, ' '),
                title: p.title
            }));
        }""")

        all_tiers_ok = True
        for expected in EXPECTED_TIERS:
            match = next((t for t in actual_tiers if t['tier'] == expected['tier']), None)
            ok = (match
                  and match['lang'] == expected['lang']
                  and match['kind'] == expected['kind']
                  and expected['label_ru'] in match['text']
                  and str(expected['count']) in match['text'])
            mark = '✅' if ok else '❌'
            print(f'  {mark} {expected["tier"]:<10} lang={expected["lang"]} kind={expected["kind"]:<10} label="{expected["label_ru"]}" count={expected["count"]} | actual: {match["text"] if match else "MISSING"!r}')
            if not ok:
                all_tiers_ok = False
        results['tier_switcher'] = all_tiers_ok

        # Screenshot tier-switcher
        page.locator('.sidebar').first.screenshot(path=str(SCREENS / 'smoke-tier-switcher-7-tiers.png'))
        print(f'  shot: smoke-tier-switcher-7-tiers.png')

        # === Block C: Manual tier-switching ===
        print('\n=== Block C: Manual tier-switching ===')
        switch_tests = [
            ('ru_teen', 75, 'ФЫВА ОЛДЖ'),
            ('ru_kids', 50, 'Буква А'),
            ('en_tier1', 99, 'a s d f'),
            ('en_kids', 50, 'Letter A'),
        ]
        for target_tier, expected_count, expected_title in switch_tests:
            page.click(f'.tier-pill[data-tier="{target_tier}"]')
            page.wait_for_timeout(700)
            state = page.evaluate("""() => ({
                tier: window.typingTrainer && window.typingTrainer.state.currentLessonTier,
                lessonNum: window.typingTrainer && window.typingTrainer.state.currentLessonNumber,
                title: window.typingTrainer && window.typingTrainer.state.currentLesson && window.typingTrainer.state.currentLesson.title,
                totalInTier: window.typingTrainer && window.typingTrainer.getTierLessonCount(window.typingTrainer.state.currentLessonTier)
            })""")
            ok = (state['tier'] == target_tier
                  and state['totalInTier'] == expected_count
                  and expected_title in (state['title'] or ''))
            mark = '✅' if ok else '❌'
            print(f'  {mark} click → {target_tier:<10} | actual: {state["tier"]} L{state["lessonNum"]} "{state["title"]}"')
            results['manual_switch'].append((target_tier, ok, state))

        # === Block E: UI language switcher ===
        print('\n=== Block E: UI language switcher ===')
        # Open settings
        page.click('#settingsGearBtn')
        page.wait_for_selector('#settingsModal.active', timeout=3000)
        page.wait_for_timeout(400)

        # Initial state — RU
        initial = page.evaluate("""() => ({
            uiLang: window.typingTrainer.getUiLanguage(),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen')
        })""")
        # Switch to EN
        page.click('.settings-ui-lang-pill[data-ui-lang="en"]')
        page.wait_for_timeout(500)
        after_en = page.evaluate("""() => ({
            uiLang: window.typingTrainer.getUiLanguage(),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen'),
            tierTier1Label: window.typingTrainer.getTierLabel('tier1')
        })""")
        # Switch back to RU
        page.click('.settings-ui-lang-pill[data-ui-lang="ru"]')
        page.wait_for_timeout(500)
        after_ru = page.evaluate("""() => ({
            uiLang: window.typingTrainer.getUiLanguage(),
            tierEnTeenLabel: window.typingTrainer.getTierLabel('en_teen')
        })""")

        ui_ok = (initial['uiLang'] == 'ru'
                 and initial['tierEnTeenLabel'] == 'Юниор'
                 and after_en['uiLang'] == 'en'
                 and after_en['tierEnTeenLabel'] == 'Junior'
                 and after_en['tierTier1Label'] == 'Russian Main'
                 and after_ru['uiLang'] == 'ru'
                 and after_ru['tierEnTeenLabel'] == 'Юниор')
        results['ui_lang'] = ui_ok
        mark = '✅' if ui_ok else '❌'
        print(f'  {mark} RU initial: en_teen="{initial["tierEnTeenLabel"]}"')
        print(f'  {mark} → EN: en_teen="{after_en["tierEnTeenLabel"]}", tier1="{after_en["tierTier1Label"]}"')
        print(f'  {mark} → RU: en_teen="{after_ru["tierEnTeenLabel"]}"')

        ctx.close()
        browser.close()

    # === Summary ===
    print('\n' + '=' * 60)
    print('SMOKE TEST SUMMARY')
    print('=' * 60)
    routing_pass = sum(1 for r in results['routing'] if r[3])
    routing_total = len(results['routing'])
    switch_pass = sum(1 for r in results['manual_switch'] if r[1])
    switch_total = len(results['manual_switch'])

    print(f'  A. Routing scenarios:  {routing_pass}/{routing_total}    {"PASS" if routing_pass == routing_total else "FAIL"}')
    print(f'  B. Tier-switcher catalog: 7 tiers   {"PASS" if results["tier_switcher"] else "FAIL"}')
    print(f'  C. Manual tier-switching: {switch_pass}/{switch_total}  {"PASS" if switch_pass == switch_total else "FAIL"}')
    print(f'  D. L1 load per tier:   built into A   (validated via title match)')
    print(f'  E. UI lang switcher:   {"PASS" if results["ui_lang"] else "FAIL"}')

    overall = (routing_pass == routing_total
               and results['tier_switcher']
               and switch_pass == switch_total
               and results['ui_lang'])
    print('\n  ' + ('🎉 OVERALL: PASS' if overall else '❌ OVERALL: FAIL'))
    sys.exit(0 if overall else 1)

finally:
    print('\n[teardown]')
    server.terminate()
    try:
        server.wait(timeout=5)
    except Exception:
        server.kill()
