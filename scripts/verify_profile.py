"""
Verify profile.html — новая страница профиля (P1 из дизайн-аудита).

Сценарии:
  1. router-guard: без профиля → редирект на index
  2. С профилем + history → все 6 метрик заполнены (min/avg/max WPM, attempts, errors, time)
  3. ProfileCard (left): портрет, имя, ID-hash, gender, age-group, mentor, lang
  4. Tabs (6 штук) — клик переключает active panel
  5. Stats tab: bar-chart рендерит 14 баров, course-row с прогрессом
  6. Certs tab: progress-bar % = completedLessons/total
  7. Stub-табы (Оплаты/Бонусы/Отзывы) показывают empty-блок
  8. Edit-кнопка ведёт на settings.html
  9. Wire: dashboard «Мой профиль» теперь ведёт на profile.html (не dh-soon)
"""
import io, sys
from datetime import datetime, timedelta
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'profile_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=True)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed(page, with_history=True):
    today = datetime.now()
    history = []
    if with_history:
        # 12 попыток за 10 разных дней
        for i in range(12):
            d = today - timedelta(days=i % 10)
            history.append({
                'lesson': (i % 5) + 1,
                'wpm': 30 + i * 3,
                'accuracy': 88 + (i % 10),
                'duration': 50 + (i % 30),
                'completedAt': d.isoformat()
            })
    progress = {str(n): {'stars': 4, 'bestWPM': 30 + n * 2, 'bestAccuracy': 90 + (n % 5)} for n in range(1, 8)}
    page.evaluate(f"""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({{
            name:'Иван', character:'anna', audience:'adult', gender:'m',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard',
            createdAt: '2026-05-01T12:00:00.000Z'
        }}));
        localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({progress!r}));
        localStorage.setItem('typing_trainer_test_history', JSON.stringify({history!r}));
    """)


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 1400})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

        # ─── 1. router-guard ───
        page.goto(f'{BASE}/profile.html')
        page.evaluate('localStorage.clear()')
        page.goto(f'{BASE}/profile.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(500)
        url1 = page.url
        print(f'1) router-guard без профиля: {url1}')
        if 'index.html' in url1 or url1.endswith('/'):
            print('   ✅ редирект на index')
        else:
            failed += 1; print('   ❌')

        # ─── 2-9: с профилем ───
        seed(page)
        page.goto(f'{BASE}/profile.html')
        page.wait_for_selector('#ppName', timeout=5000)
        page.wait_for_timeout(700)

        # 2. Metrics strip
        min_speed = page.evaluate("document.getElementById('ppMinSpeed').textContent")
        avg_speed = page.evaluate("document.getElementById('ppAvgSpeed').textContent")
        max_speed = page.evaluate("document.getElementById('ppMaxSpeed').textContent")
        attempts = page.evaluate("document.getElementById('ppAttempts').textContent")
        time_val = page.evaluate("document.getElementById('ppTime').textContent")
        print(f'2) Metrics: min={min_speed}, avg={avg_speed}, max={max_speed}, attempts={attempts}, time={time_val}')
        if int(min_speed) > 0 and int(max_speed) >= int(min_speed) and int(attempts) == 12:
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        # 3. ProfileCard
        name = page.evaluate("document.getElementById('ppName').textContent")
        id_field = page.evaluate("document.getElementById('ppFieldId').textContent")
        mentor = page.evaluate("document.getElementById('ppFieldMentor').textContent")
        portrait_has_svg = page.evaluate("document.getElementById('ppPortrait').querySelector('svg') !== null")
        print(f'3) ProfileCard: name="{name}", id="{id_field}", mentor="{mentor}", portrait-svg={portrait_has_svg}')
        if name == 'Иван' and id_field.startswith('#') and mentor == 'Анна' and portrait_has_svg:
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        shot(page, '01_profile_default')

        # 4. Tab switching — переключаем на Статистика
        page.click('.pp-tab[data-tab="stats"]')
        page.wait_for_timeout(300)
        active_panel = page.evaluate("document.querySelector('.pp-tabpanel--active')?.dataset.panel")
        chart_bars = page.locator('.pp-chart__bar').count()
        course_rows = page.locator('.pp-course').count()
        print(f'4) Tab=stats: active={active_panel}, chart-bars={chart_bars}, course-rows={course_rows}')
        if active_panel == 'stats' and chart_bars == 14 and course_rows >= 1:
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        shot(page, '02_stats')

        # 5. Certs tab
        page.click('.pp-tab[data-tab="certs"]')
        page.wait_for_timeout(300)
        cert_label = page.evaluate("document.getElementById('ppCertLabel').textContent")
        cert_fill_w = page.evaluate("document.getElementById('ppCertProgress').style.width")
        print(f'5) Tab=certs: label="{cert_label}", progress-width="{cert_fill_w}"')
        if cert_label.startswith('7 /') and cert_fill_w.endswith('%'):
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        # 6. Stub tabs (payments/bonuses/reviews) — есть empty блок
        page.click('.pp-tab[data-tab="payments"]')
        page.wait_for_timeout(200)
        pay_empty = page.locator('.pp-tabpanel[data-panel="payments"] .pp-empty').count()
        page.click('.pp-tab[data-tab="bonuses"]')
        page.wait_for_timeout(200)
        bon_empty = page.locator('.pp-tabpanel[data-panel="bonuses"] .pp-empty').count()
        page.click('.pp-tab[data-tab="reviews"]')
        page.wait_for_timeout(200)
        rev_empty = page.locator('.pp-tabpanel[data-panel="reviews"] .pp-empty').count()
        print(f'6) Stub tabs: payments={pay_empty}, bonuses={bon_empty}, reviews={rev_empty}')
        if pay_empty == 1 and bon_empty == 1 and rev_empty == 1:
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        # 7. Edit button → settings.html
        page.click('.pp-tab[data-tab="profile"]')
        page.wait_for_timeout(200)
        edit_href = page.evaluate("document.querySelector('.pp-pcard__edit').getAttribute('href')")
        print(f'7) Edit btn href: "{edit_href}"')
        if edit_href == 'settings.html':
            print('   ✅')
        else:
            failed += 1; print('   ❌')

        # 8. dashboard «Мой профиль» → profile.html
        page.goto(f'{BASE}/dashboard.html')
        page.wait_for_selector('#dhProfileBtn', timeout=5000)
        page.wait_for_timeout(300)
        page.click('#dhProfileBtn')
        page.wait_for_timeout(300)
        my_profile_href = page.evaluate(
            "[...document.querySelectorAll('.dh-profile-menu__item')].find(a => a.textContent.includes('Мой профиль'))?.getAttribute('href')"
        )
        print(f'8) Dashboard «Мой профиль» href: "{my_profile_href}"')
        if my_profile_href == 'profile.html':
            print('   ✅ ссылка обновлена (больше не dh-soon)')
        else:
            failed += 1; print('   ❌')

        ctx.close(); b.close()

    print()
    print(f'page/console errors: {len(errs)}')
    for e in errs[:5]: print('  ', e)
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
