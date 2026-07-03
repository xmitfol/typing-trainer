"""
Verify «Quick wins» пакет (5 пунктов из дизайн-аудита):
  1. Course intro в модуле 1: «История курса» + «Интерактивная справка» (NEW)
  2. Task SpeedGraph: SVG polyline обновляется при типировании
  3. Task celebrate: confetti spawn'ится при passed, rhythm% > 0
  4. Dashboard trend pills: +N появляются при ≥4 записях в history
  5. Landing FAQ: nav-ссылка «Вопросы» + секция #faq с 5 details
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'qw_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed_profile(page, history=None):
    page.evaluate(f"""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({{
            name:'Тест', character:'anna', audience:'adult', gender:'m',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }}));
        localStorage.removeItem('typing_trainer_lesson_progress');
        localStorage.setItem('typing_trainer_test_history', JSON.stringify({history or []!r}));
    """)


def press(page, ch):
    page.evaluate("""([ch]) => {
        const cap = document.getElementById('capture'); cap.focus();
        cap.dispatchEvent(new KeyboardEvent('keydown', {key:ch, code:'KeyX', bubbles:true, cancelable:true}));
    }""", [ch])


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 1000})

        # ─── QW1: Course intro ───
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        seed_profile(page)
        page.goto(f'{BASE}/course.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(800)
        # Открыть модуль 1
        page.click('.cp-module:first-child .cp-module__head')
        page.wait_for_timeout(500)
        history_btn = page.locator('[data-special="history"]')
        help_btn = page.locator('[data-special="help"]')
        intro_label = page.locator('.cp-module__intro-label')
        new_badge = page.locator('.cp-special__badge:has-text("NEW")')
        print(f'QW1 Course intro:')
        print(f'   История курса button: count={history_btn.count()}, label="{history_btn.locator(".cp-special__label").inner_text() if history_btn.count() else ""}"')
        print(f'   Интерактивная справка button: count={help_btn.count()}')
        print(f'   NEW badge: count={new_badge.count()}')
        print(f'   ВСТУПЛЕНИЕ label: text="{intro_label.inner_text() if intro_label.count() else "NONE"}"')
        if (history_btn.count() == 1 and help_btn.count() == 1
                and new_badge.count() == 1 and intro_label.count() == 1
                and 'История курса' in history_btn.inner_text()
                and 'Интерактивная справка' in help_btn.inner_text()
                and 'ВСТУПЛЕНИЕ' in intro_label.inner_text()):
            print('   ✅ QW1 PASS')
        else:
            failed += 1; print('   ❌ QW1 FAIL')
        shot(page, '01_course_intro')
        page.close()

        # ─── QW2: Task SpeedGraph — УДАЛЁН ───
        # График скорости в тренажёре убран правками дизайнера (41be324
        # «design(task): ... убран график») — проверять нечего. Живой график
        # динамики остался на profile.html (его гоняет verify_profile.py).
        print('QW2 SpeedGraph: пропущен — фича убрана дизайнером (41be324)')

        # ─── QW3: Task celebrate (rhythm + confetti) ───
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        seed_profile(page)
        page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
        page.wait_for_selector('#capture', timeout=5000)
        page.wait_for_timeout(600)
        target_full = page.evaluate("""
            (async () => {
                const r = await fetch('data/lessons/tier1/lesson_01.json');
                return (await r.json()).text;
            })()
        """)
        # Пройти урок целиком (errors=0 → success-отчёт). Полный забег рендерит
        # «Отчёт по уроку» (lessonSummary): частичного confetti-спавна больше нет —
        # у отчёта своя конфетти-полоса .report-confetti (только при success),
        # ритмичность — метрика РИТМИЧНОСТЬ в .report-metrics.
        for ch in target_full:
            press(page, ch)
        page.wait_for_timeout(700)
        rhythm = page.evaluate("""(() => {
            const m = [...document.querySelectorAll('#success .metric')].find(x => x.textContent.includes('РИТМИЧНОСТЬ'));
            return m?.querySelector('.metric-val')?.innerText || '';
        })()""")
        confetti_count = page.evaluate("document.querySelectorAll('#success .report-confetti').length")
        success_shown = page.evaluate("document.getElementById('success')?.classList.contains('show')")
        print(f'QW3 Celebrate:')
        print(f'   rhythm metric: "{rhythm}"')
        print(f'   report-confetti strips: {confetti_count}')
        print(f'   success shown: {success_shown}')
        if success_shown and confetti_count >= 1 and ('%' in rhythm or '—' in rhythm):
            print('   ✅ QW3 PASS (отчёт: конфетти-полоса + ритмичность)')
        else:
            failed += 1; print('   ❌ QW3 FAIL')
        shot(page, '03_celebrate')
        page.close()

        # ─── QW4: Dashboard trend pills ───
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        # 10 history записей: первые 5 — wpm~30, последние 5 — wpm~45 → trend +15
        hist = ([{'lesson': i, 'wpm': 30, 'accuracy': 85, 'duration': 60} for i in range(1, 6)]
                + [{'lesson': i, 'wpm': 45, 'accuracy': 92, 'duration': 60} for i in range(6, 11)])
        page.evaluate(f"""
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify({{
                name:'Тест', character:'anna', audience:'adult', gender:'m',
                language:'ru', onboardingCompleted:true,
                keyboardType:'classic', keyboardLayout:'standard'
            }}));
            localStorage.setItem('typing_trainer_test_history', JSON.stringify({hist!r}));
            localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({{
                '1': {{stars:4, bestWPM:45, bestAccuracy:92}}
            }}));
        """)
        page.goto(f'{BASE}/dashboard.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(800)
        speed_trend = page.evaluate("document.getElementById('dhStatSpeedTrend')?.innerText || ''")
        speed_trend_hidden = page.evaluate("document.getElementById('dhStatSpeedTrend')?.hidden")
        acc_trend = page.evaluate("document.getElementById('dhStatAccuracyTrend')?.innerText || ''")
        speed_dir = page.evaluate("document.getElementById('dhStatSpeedTrend')?.dataset.dir")
        print(f'QW4 Trend pills:')
        print(f'   speed trend: "{speed_trend}" hidden={speed_trend_hidden} dir={speed_dir}')
        print(f'   accuracy trend: "{acc_trend}"')
        if (speed_trend.startswith('+') and not speed_trend_hidden
                and acc_trend.startswith('+') and speed_dir == 'up'):
            print('   ✅ QW4 PASS')
        else:
            failed += 1; print('   ❌ QW4 FAIL')
        shot(page, '04_trend_pills')
        page.close()

        # ─── QW5: Landing FAQ ───
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(700)
        nav_faq = page.locator('.lp-nav a[href="#faq"]').count()
        faq_section = page.locator('section#faq').count()
        faq_items = page.locator('.lp-faq__item').count()
        faq_title = page.evaluate("document.querySelector('section#faq .lp-h2')?.innerText || ''")
        print(f'QW5 Landing FAQ:')
        print(f'   nav link #faq: {nav_faq}, секция #faq: {faq_section}, items: {faq_items}, title: "{faq_title}"')
        if nav_faq == 1 and faq_section == 1 and faq_items == 5 and 'Частые вопросы' in faq_title:
            print('   ✅ QW5 PASS')
        else:
            failed += 1; print('   ❌ QW5 FAIL')
        shot(page, '05_faq')
        page.close()

        ctx.close()
        b.close()

    print()
    print('=' * 60)
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
