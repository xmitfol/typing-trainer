"""
Verify assembled navigation flow (ветка integration/new-shell).

Flow: index(landing) → onboarding → dashboard → course → lesson → task.
Plus router-guard: protected page без профиля → index; onboarding с профилем → dashboard.
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'nav_flow'
SHOTS.mkdir(parents=True, exist_ok=True)

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))

        # 1. Anon landing
        print("\n=== 1. index.html = landing (anon) ===")
        page.goto(f"{BASE}/index.html")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector('.lp-hero', timeout=6000)
        page.wait_for_timeout(400)
        check('anon CTA visible', page.locator('#lpCtaAnon').is_visible(), True)
        check('hero primary → onboarding.html', page.locator('#lpHeroPrimary').get_attribute('href'), 'onboarding.html')
        page.screenshot(path=str(SHOTS / '1_landing_anon.png'))

        # 2. Router guard: protected without profile → index
        print("\n=== 2. router-guard: dashboard без профиля → index ===")
        page.goto(f"{BASE}/dashboard.html")
        page.wait_for_timeout(800)
        check('redirected to index.html', page.url, lambda u: u.endswith('/index.html'))

        # 3. Click «Начать бесплатно» → onboarding
        print("\n=== 3. landing → onboarding ===")
        page.goto(f"{BASE}/index.html")
        page.wait_for_selector('#lpHeroPrimary', timeout=5000)
        page.click('#lpHeroPrimary')
        page.wait_for_timeout(800)
        check('on onboarding.html', page.url, lambda u: 'onboarding.html' in u)
        page.wait_for_selector('#userName', timeout=6000)
        check('onboarding form visible', page.locator('#userName').is_visible(), True)
        page.screenshot(path=str(SHOTS / '3_onboarding.png'))

        # 4. Fill onboarding → dashboard
        print("\n=== 4. fill onboarding → dashboard ===")
        page.fill('#userName', 'Тест')
        page.click('[data-gender="m"]')
        page.click('[data-audience="adult"]')
        page.click('[data-mentor="anna"]')
        page.wait_for_timeout(300)
        page.click('#submitOnboarding')
        page.wait_for_timeout(1200)
        check('redirected to dashboard.html', page.url, lambda u: 'dashboard.html' in u)
        page.wait_for_selector('#dhWelcomeName', timeout=6000)
        page.wait_for_timeout(800)
        check('dashboard shows name Тест', page.locator('#dhWelcomeName').inner_text(), 'Тест')
        check('dhContinue → lesson.html (теория, НЕ task)', page.locator('#dhContinue').get_attribute('href'), lambda s: s.startswith('lesson.html?tier='))
        page.screenshot(path=str(SHOTS / '4_dashboard.png'))

        # 5. onboarding with profile → dashboard (guard)
        print("\n=== 5. router-guard: onboarding с профилем → dashboard ===")
        page.goto(f"{BASE}/onboarding.html")
        page.wait_for_timeout(800)
        check('redirected to dashboard.html', page.url, lambda u: 'dashboard.html' in u)

        # 6. dashboard → course
        print("\n=== 6. dashboard «Уроки» → course ===")
        page.wait_for_selector('.dh-nav', timeout=5000)
        page.click('.dh-nav__item:has-text("Уроки")')
        page.wait_for_timeout(800)
        check('on course.html', page.url, lambda u: 'course.html' in u)
        page.wait_for_selector('#cpEyebrow', timeout=6000)
        page.wait_for_timeout(1500)
        # find current/next lesson row → lesson.html
        next_row = page.locator('.cp-lesson--next').first
        check('course next-row → lesson.html', next_row.get_attribute('href'), lambda s: s and 'lesson.html?tier=' in s)
        page.screenshot(path=str(SHOTS / '6_course.png'))

        # 7. course → lesson
        print("\n=== 7. course lesson row → lesson reading ===")
        next_row.click()
        page.wait_for_timeout(900)
        check('on lesson.html', page.url, lambda u: 'lesson.html' in u)
        page.wait_for_selector('#lpTitle', timeout=6000)
        page.wait_for_timeout(800)
        check('lpOpenTrainer → task.html', page.locator('#lpOpenTrainer').get_attribute('href'), lambda s: s and 'task.html?tier=' in s)
        page.screenshot(path=str(SHOTS / '7_lesson.png'))

        # 8. lesson -> task (новый task.html с клавиатурой)
        print("\n=== 8. lesson lesson->task ===")
        page.click('#lpOpenTrainer')
        page.wait_for_timeout(900)
        check('on task.html', page.url, lambda u: 'task.html' in u)
        page.wait_for_selector('#target .word', timeout=6000)
        page.wait_for_timeout(800)
        check('task target rendered (words)', page.locator('#target .word').count(), lambda n: n > 0)
        check('keyboard rendered', page.evaluate("document.getElementById('kb').shadowRoot.querySelectorAll('.key').length"), lambda n: n and n > 20)
        page.screenshot(path=str(SHOTS / '8_task.png'))

        # 9. Complete exercise -> success Продолжить -> lesson.html (теория следующего)
        print("\n=== 9. task success ->lesson.html ===")
        target = page.evaluate("""() => Array.from(document.querySelectorAll('#target > *')).map(node =>
            node.classList.contains('space') ? ' ' : Array.from(node.querySelectorAll('span')).map(s => s.textContent).join('')
        ).join('')""")
        page.evaluate(
            """(txt) => {
                const cap = document.getElementById('capture');
                cap.focus();
                for (const ch of txt) { cap.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'KeyX', bubbles: true, cancelable: true })); }
            }""",
            target
        )
        page.wait_for_timeout(800)
        check('success screen shown', page.locator('#success').get_attribute('class'), lambda s: 'show' in s)
        check('success Продолжить -> lesson.html', page.locator('#next-btn').get_attribute('href'), lambda s: s.startswith('lesson.html?tier=') and 'lesson=2' in s)
        page.screenshot(path=str(SHOTS / '9_task_success.png'))

        ctx.close()
        browser.close()

    print("\n" + "=" * 55)
    if all(checks):
        print(f"✅ NAVIGATION FLOW PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} проверок упали")
    return 1

sys.exit(main())
