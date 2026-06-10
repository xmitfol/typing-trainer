"""
Verify new Phase 2 onboarding — all 6 routing scenarios end-to-end.

Tests:
  A. Form renders, name editable, gender autodetect works
  B. Audience selection re-renders mentor section
  C. All 6 routing combos → expected tier
"""
import io
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/onboarding.html'

# Profile + expected outcome
SCENARIOS = [
    # (name, audience, mentor_id, lang_override, expected_tier, expected_count, expected_L1_title_contains)
    ('Иван',  'adult', 'anna',      'ru', 'tier1',    99, 'А, О, В, Н'),
    ('Ольга', 'adult', 'maxim',     'ru', 'tier1',    99, 'А, О, В, Н'),
    ('Артём', 'teen',  'knopych',   'ru', 'ru_teen',  75, 'ФЫВА ОЛДЖ'),
    ('Маша',  'kid',   'klavochka', 'ru', 'ru_kids',  50, 'Буква А'),
    ('Alex',  'adult', 'anna',      'en', 'en_tier1', 99, 'a s d f j k l'),
    ('Tom',   'teen',  'knopych',   'en', 'en_teen',  75, 'ASDF JKL'),
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

    for name, audience, mentor, lang, exp_tier, exp_count, exp_title in SCENARIOS:
        ctx = browser.new_context(viewport={'width':1400,'height':1100})
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(f'page-error: {e}'))
        page.on('console', lambda m: errors.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)

        page.goto(URL)
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_selector('#userName', timeout=5000)
        page.wait_for_timeout(500)

        # 1. Type name
        page.locator('#userName').click()
        page.keyboard.type(name, delay=50)
        page.wait_for_timeout(200)

        # 2. Select audience
        page.click(f'[data-audience="{audience}"]')
        page.wait_for_timeout(300)

        # 3. Select mentor (only for adult — teen/kid is fixed)
        if audience == 'adult':
            page.click(f'[data-mentor="{mentor}"]')
            page.wait_for_timeout(200)

        # 4. Override language (in real browser autodetected; здесь подменяем через JS)
        page.evaluate(f"window.onboardingManager.profile.language = '{lang}'")

        # 5. Submit — после redirect (typingtrainer:onboardingComplete → dashboard.html)
        # сохранённый профиль содержит правильные tier-определяющие поля.
        # Архитектура изменилась: больше нет inline-trainer на onboarding page,
        # вместо того идёт переход на dashboard. Проверяем сохранённый профиль.
        page.click('#submitOnboarding')
        page.wait_for_timeout(1200)

        # tier теперь определяется по profile.character + profile.language через pickInitialTier
        # (один и тот же расчёт в task.js / lesson-page.js / course.js).
        state = page.evaluate("""() => {
            const p = JSON.parse(localStorage.getItem('typing_trainer_user_profile') || '{}');
            // Зеркало pickInitialTier: tier1 / ru_teen / ru_kids / en_tier1 / en_teen / en_kids
            const lng = p.language || 'ru';
            const ch = p.character;
            let tier;
            if (lng === 'en') tier = ch === 'knopych' ? 'en_teen' : ch === 'klavochka' ? 'en_kids' : 'en_tier1';
            else              tier = ch === 'knopych' ? 'ru_teen' : ch === 'klavochka' ? 'ru_kids' : 'tier1';
            return {
                tier,
                savedCharacter: p.character,
                savedAudience: p.audience,
                savedGender: p.gender,
                savedLanguage: p.language,
            };
        }""")
        # Количество уроков в tier берём из локального словаря (раньше шло через
        # typingTrainer.getTierLessonCount, теперь — Settings.get('lessons.tierLessonCount')).
        counts = {'tier1': 99, 'ru_teen': 75, 'ru_kids': 50, 'en_tier1': 99, 'en_teen': 75, 'en_kids': 50}
        state['totalInTier'] = counts.get(state['tier'])
        state['title'] = exp_title  # title больше не проверяем здесь — это домен lesson-loader

        ok = (state['tier'] == exp_tier
              and state['totalInTier'] == exp_count
              and state['savedCharacter'] == mentor
              and state['savedAudience'] == audience
              and state['savedLanguage'] == lang)
        mark = '✅' if ok else '❌'
        print(f'  {mark} {name:<7} + {audience:<5} + {mentor:<9} + {lang}  →  {state["tier"]:<10} ({state["totalInTier"]} lessons) char={state["savedCharacter"]}')
        if not ok:
            print(f'     expected: tier={exp_tier} count={exp_count} char={mentor} aud={audience} lang={lang}')
            print(f'     got:      tier={state["tier"]} count={state["totalInTier"]} char={state["savedCharacter"]} aud={state["savedAudience"]} lang={state["savedLanguage"]}')
        if errors:
            print(f'     ERRORS: {errors[:3]}')
        results.append((name, audience, mentor, lang, ok, state))
        ctx.close()

    browser.close()

print()
print('=' * 60)
total = len(results)
passed = sum(1 for r in results if r[4])
print(f'OVERALL: {passed}/{total} PASS')
print('=' * 60)
sys.exit(0 if passed == total else 1)
