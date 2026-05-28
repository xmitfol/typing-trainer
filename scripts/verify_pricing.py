"""
Phase 8 — Pricing (paywall + subscription + payment) verification.

A. Paywall view default: title, badge, comparison, CTA
B. «Выбрать тариф» → subscription view: 5 periods, 3 plans, prices computed
   - default: Полный (pro) + 6 мес → price = 490 * 4.50 = 2205 → round10 = 2210
   - select Год → 490 * 7.80 = 3822 → 3820
   - select Семейный + Год → 890 * 7.80 = 6942 → 6940
C. Promo toggle reveals input
D. «Оформить» → payment view: card form, summary price matches
E. Mock payment submit → demo banner shows
F. Back navigation works
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/pricing.html'
SCREENSHOT_DIR = Path(__file__).parent / 'screenshots' / 'verify_pricing'
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

def shot(page, name, n):
    p = SCREENSHOT_DIR / f"{n:02d}_{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📷 {p.name}")

def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1280, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)
        page.goto(URL)
        page.wait_for_selector('#ppPaywallTitle', timeout=8000)
        page.wait_for_timeout(500)

        checks = []
        def check(label, actual, exp):
            ok = exp(actual) if callable(exp) else (actual == exp)
            mark = '✅' if ok else '❌'
            print(f"   {mark} {label}: {actual!r}")
            checks.append(ok)

        # A. Paywall
        print("\n=== A. Paywall view ===")
        check('default view = paywall', page.locator('#pricingPage').get_attribute('data-view'), 'paywall')
        check('paywall title', page.locator('#ppPaywallTitle').inner_text(), lambda s: 'Урок 6' in s)
        check('comparison rows present', page.locator('.pp-compare__row').count(), lambda n: n >= 8)
        check('paywall CTA visible', page.locator('#ppOpenSubscription').is_visible(), True)
        shot(page, 'paywall', 1)

        # B. Subscription
        print("\n=== B. Subscription view ===")
        page.click('#ppOpenSubscription')
        page.wait_for_timeout(400)
        check('view = subscription', page.locator('#pricingPage').get_attribute('data-view'), 'subscription')
        check('5 period buttons', page.locator('.pp-period').count(), 5)
        check('3 plan cards', page.locator('.pp-plan').count(), 3)
        # default: pro + m6 → 490 * 4.50 = 2205 → round10 = 2210
        check('pro active by default', page.locator('.pp-plan[data-plan="pro"]').get_attribute('class'), lambda s: 'pp-plan--active' in s)
        check('m6 active by default', page.locator('.pp-period[data-period="m6"]').get_attribute('class'), lambda s: 'pp-period--active' in s)
        check('summary price 2 210 ₽ (pro×6мес)', page.locator('#ppSummaryPrice').inner_text(), lambda s: s.replace('\xa0',' ').replace(' ','') == '2210₽')
        check('checkout label has "Оформить Полный"', page.locator('#ppCheckoutLabel').inner_text(), lambda s: 'Полный' in s and '2' in s)
        check('savings shown', page.locator('#ppSummarySave').inner_text(), lambda s: 'экономия' in s)
        shot(page, 'subscription_pro_6m', 2)

        # Select Год
        page.click('.pp-period[data-period="y1"]')
        page.wait_for_timeout(300)
        # 490 * 7.80 = 3822 → 3820
        check('price after Год = 3 820 ₽', page.locator('#ppSummaryPrice').inner_text(), lambda s: s.replace('\xa0',' ').replace(' ','') == '3820₽')

        # Select Семейный + Год
        page.click('.pp-plan[data-plan="family"]')
        page.wait_for_timeout(300)
        # 890 * 7.80 = 6942 → 6940
        check('family + Год = 6 940 ₽', page.locator('#ppSummaryPrice').inner_text(), lambda s: s.replace('\xa0',' ').replace(' ','') == '6940₽')
        check('family active', page.locator('.pp-plan[data-plan="family"]').get_attribute('class'), lambda s: 'pp-plan--active' in s)
        shot(page, 'subscription_family_year', 3)

        # C. Promo toggle
        print("\n=== C. Promo toggle ===")
        check('promo row hidden initially', page.locator('#ppPromoRow').get_attribute('class'), lambda s: 'pp-promo-row--open' not in s)
        page.click('#ppPromoToggle')
        page.wait_for_timeout(200)
        check('promo row open after toggle', page.locator('#ppPromoRow').get_attribute('class'), lambda s: 'pp-promo-row--open' in s)

        # Reset to pro+year for payment check
        page.click('.pp-plan[data-plan="pro"]')
        page.wait_for_timeout(200)

        # D. Payment
        print("\n=== D. Payment view ===")
        page.click('#ppCheckout')
        page.wait_for_timeout(400)
        check('view = payment', page.locator('#pricingPage').get_attribute('data-view'), 'payment')
        check('pay summary plan "Полный · 1 год"', page.locator('#ppPaySummaryPlan').inner_text(), lambda s: 'Полный' in s and 'год' in s)
        check('pay summary price = 3 820 ₽', page.locator('#ppPaySummaryPrice').inner_text(), lambda s: s.replace('\xa0',' ').replace(' ','') == '3820₽')
        check('3 payment tabs', page.locator('.pp-pay-tab').count(), 3)
        check('card num field present', page.locator('#ppCardNum').count(), 1)
        shot(page, 'payment', 4)

        # E. Mock payment submit
        print("\n=== E. Mock payment ===")
        page.fill('#ppCardNum', '4111 1111 1111 1111')
        page.fill('#ppCardExp', '12 / 28')
        page.fill('#ppCardCvv', '123')
        page.fill('#ppEmail', 'test@example.com')
        page.click('#ppPaySubmit')
        page.wait_for_timeout(300)
        check('demo banner shown', page.locator('#ppPayDone').get_attribute('class'), lambda s: 'pp-pay-done--show' in s)
        check('submit disabled after pay', page.locator('#ppPaySubmit').is_disabled(), True)
        shot(page, 'payment_done', 5)

        # F. Back navigation
        print("\n=== F. Back navigation ===")
        page.click('#ppPayBack')
        page.wait_for_timeout(300)
        check('back → subscription', page.locator('#pricingPage').get_attribute('data-view'), 'subscription')
        page.click('#ppSubClose')
        page.wait_for_timeout(300)
        check('close → paywall', page.locator('#pricingPage').get_attribute('data-view'), 'paywall')

        ctx.close()
        browser.close()
        if all(checks):
            print("\n✅ ALL checks PASS")
        else:
            fails = checks.count(False)
            findings.append(('FAIL', f'{fails} pricing checks failed'))
            print(f"\n❌ {fails} of {len(checks)} checks failed")

    print("\n" + "=" * 60)
    if not findings:
        print("✅ VERIFY PASS")
        return 0
    print("❌ VERIFY FAIL:")
    for level, msg in findings:
        print(f"  • {msg}")
    return 1

sys.exit(main())
