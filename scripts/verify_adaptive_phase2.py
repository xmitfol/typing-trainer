"""
Verify адаптивного движка — 2-я итерация Phase 1 (decay §4.4 + remediation §4.3
+ weak-keys в профиле §6). Спека: docs/spec/methodology/adaptive_repetition_spec.md.

Сценарии:
  1. Decay: клавиша mastered-по-числам, но lastSeenAt 30 дней назад и streak 12
     → keyStatusFor НЕ 'mastered' (12*0.5=6 < 10). Контроль: свежий lastSeenAt → 'mastered'.
  2. Remediation в лестнице: weak-клавиша 'а' (attempts 30, errors 6) + все шаги
     lesson_01 tier1 пройдены → на lesson.html появился drill-шаг с href
     remediation=; клик → task.html, #target .word рендерится, target только
     из букв клавиши/конфузии.
  3. Финиш remediation: напечатать target → success-экран, «Назад к уроку» БЕЗ
     step=; bucket.remediation в key_stats инкрементился.
  4. Cap/persist: passes=2 для клавиши → перезагрузка lesson.html → drill-шаг
     НЕ появляется (persisted weak, не зацикливаем).
  5. Профиль: с weak-данными блок «Клавиши на прокачку» виден и содержит клавишу;
     после очистки key_stats блока нет.
"""
import io, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'adaptive_phase2_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'language': 'ru', 'keyboardType': 'classic', 'keyboardLayout': 'standard',
           'onboardingCompleted': True}


def iso_days_ago(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat().replace('+00:00', 'Z')


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=True)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def main():
    checks = []

    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1100}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f'   ⚠️ page-error: {e}'))

        # ─── 1. Decay (§4.4) ─────────────────────────────────────────
        print('\n=== 1. Decay: idle 30 дней → streak затухает ===')
        page.goto(f'{BASE}/index.html')
        page.evaluate('(p) => localStorage.setItem("typing_trainer_user_profile", JSON.stringify(p))', PROFILE)
        page.goto(f'{BASE}/lesson.html?tier=tier1&lesson=1')
        page.wait_for_selector('#lpTitle', timeout=8000)
        page.wait_for_function('() => !!window.adaptiveReps', timeout=5000)

        # mastered-по-числам (attempts 40, errors 0, streak 12, латентности ровные),
        # но lastSeenAt = 30 дней назад → floor(12*0.5)=6 < 10 → НЕ mastered.
        stale = page.evaluate("""(seenAt) => {
            localStorage.setItem('typing_trainer_key_stats', JSON.stringify({
                tier1: { version: 1, updatedAt: seenAt, keys: {
                    'ф': { attempts: 40, errors: 0, latencies: Array(10).fill(150),
                           correctStreak: 12, lastSeenAt: seenAt, confused: {} }
                }}}));
            return window.adaptiveReps.keyStatusFor('tier1', 'ф');
        }""", iso_days_ago(30))
        check('idle 30d: статус НЕ mastered', stale, lambda s: s != 'mastered')
        check('idle 30d: откат в learning (re-warmup)', stale, 'learning')

        fresh = page.evaluate("""(seenAt) => {
            const all = JSON.parse(localStorage.getItem('typing_trainer_key_stats'));
            all.tier1.keys['ф'].lastSeenAt = seenAt;
            localStorage.setItem('typing_trainer_key_stats', JSON.stringify(all));
            return window.adaptiveReps.keyStatusFor('tier1', 'ф');
        }""", iso_days_ago(0))
        check('контроль: свежий lastSeenAt → mastered', fresh, 'mastered')

        # ─── 2. Remediation в лестнице урока ─────────────────────────
        print('\n=== 2. Remediation: weak «а» + все шаги пройдены → drill в лестнице ===')
        # Сид: weak 'а' (errorRate 0.2 > 0.10) + все шаги lesson_01 пройдены
        # (формат exercise-progress.js: {"tier1:1":{steps:{"1":{done,at},...}}}).
        # Число шагов берём из JSON урока — авторитетный источник.
        steps_total = page.evaluate("""async (seenAt) => {
            const r = await fetch('data/lessons/tier1/lesson_01.json');
            const j = await r.json();
            const n = j.tips.filter(t => t && t.type === 'step').length;
            const steps = {};
            for (let i = 1; i <= n; i++) steps[String(i)] = { done: true, at: seenAt };
            localStorage.setItem('typing_trainer_lesson_exercises',
                JSON.stringify({ 'tier1:1': { steps } }));
            localStorage.setItem('typing_trainer_key_stats', JSON.stringify({
                tier1: { version: 1, updatedAt: seenAt, keys: {
                    'а': { attempts: 30, errors: 6, latencies: [], correctStreak: 0,
                           lastSeenAt: seenAt, confused: {} }
                }}}));
            return n;
        }""", iso_days_ago(0))
        print(f'   (шагов в lesson_01: {steps_total})')

        page.goto(f'{BASE}/lesson.html?tier=tier1&lesson=1')
        page.wait_for_selector('#lpTips .lp-exercise--step', timeout=8000)
        page.wait_for_timeout(600)
        rem_links = page.locator('#lpTips a.lp-step__open[href*="remediation="]')
        check('drill-шаг с remediation= в лестнице', rem_links.count(), 1)
        rem_href = rem_links.first.get_attribute('href') or ''
        check('href содержит remediation-ключ', rem_href,
              lambda s: 'remediation=%D0%B0' in s and 'lesson=1' in s)
        shot(page, '01_lesson_remediation_step')

        rem_links.first.click()
        page.wait_for_url('**/task.html*', timeout=8000)
        page.wait_for_selector('#target .word', timeout=8000)
        target_text = page.evaluate("document.querySelector('#target .target__inner').textContent")
        check('#target .word отрендерен, target непуст', bool(target_text), True)
        # confused пуст → изоляция: только 'а' и пробелы ('ааа ааа ааа')
        check('target только из клавиши/конфузии', sorted(set(target_text)), [' ', 'а'])
        shot(page, '02_task_remediation')

        # ─── 3. Финиш remediation-шага ───────────────────────────────
        print('\n=== 3. Финиш: success-экран, назад без step=, passes++ ===')
        page.evaluate("""(t) => {
            const cap = document.getElementById('capture');
            cap.focus();
            for (const ch of t) {
                cap.dispatchEvent(new KeyboardEvent('keydown',
                    { key: ch, code: 'KeyX', bubbles: true, cancelable: true }));
            }
        }""", target_text)
        page.wait_for_selector('#success.show', timeout=5000)
        next_href = page.locator('#next-btn').get_attribute('href') or ''
        check('success-экран показан', page.locator('#success.show').count(), 1)
        check('«Назад к уроку» без step=', next_href,
              lambda s: s == 'lesson.html?tier=tier1&lesson=1' and 'step=' not in s)
        passes = page.evaluate("""() => {
            const all = JSON.parse(localStorage.getItem('typing_trainer_key_stats') || '{}');
            const rem = all.tier1 && all.tier1.remediation;
            return rem && rem['1'] ? rem['1']['а'] : null;
        }""")
        check('bucket.remediation["1"]["а"] == 1', passes, 1)
        # Курсовая лестница НЕ тронута: шаг с индексом 0 не появился, звёзд нет.
        untouched = page.evaluate("""() => {
            const ex = JSON.parse(localStorage.getItem('typing_trainer_lesson_exercises') || '{}');
            const prog = JSON.parse(localStorage.getItem('typing_trainer_lesson_progress') || '{}');
            return { step0: !!(ex['tier1:1'] && ex['tier1:1'].steps['0']), stars: !!prog['1'] };
        }""")
        check('lesson_exercises/lesson_progress не тронуты', untouched, {'step0': False, 'stars': False})
        shot(page, '03_remediation_done')

        # ─── 4. Cap / persisted weak ─────────────────────────────────
        print('\n=== 4. Cap: passes=2 → drill-шаг не выдаётся ===')
        page.evaluate("""() => {
            const all = JSON.parse(localStorage.getItem('typing_trainer_key_stats'));
            all.tier1.remediation = { '1': { 'а': 2 } };
            localStorage.setItem('typing_trainer_key_stats', JSON.stringify(all));
        }""")
        page.goto(f'{BASE}/lesson.html?tier=tier1&lesson=1')
        page.wait_for_selector('#lpTips .lp-exercise--step', timeout=8000)
        page.wait_for_timeout(600)
        check('drill-шаг НЕ появился (cap/persisted)',
              page.locator('#lpTips a.lp-step__open[href*="remediation="]').count(), 0)
        shot(page, '04_lesson_capped')

        # ─── 5. Профиль: «Клавиши на прокачку» (adult) ───────────────
        print('\n=== 5. Профиль: weak-блок виден с данными, скрыт без ===')
        page.goto(f'{BASE}/profile.html')
        page.wait_for_selector('#ppName', timeout=8000)
        page.wait_for_timeout(600)
        check('блок «Клавиши на прокачку» виден', page.locator('#ppWeakKeys').count(), 1)
        head = page.locator('#ppWeakKeys .pp-h3').inner_text()
        check('заголовок блока', head, 'Клавиши на прокачку')
        cap_char = page.locator('#ppWeakKeys .pp-weakkeys__char').first.inner_text()
        check('кейкап содержит клавишу А', cap_char, 'А')
        # После дрилла секции 3 flushSession добавил 9 верных касаний «а»:
        # errorRate = 6 / (30 + 9) = 15.4% → 15%.
        rate = page.locator('#ppWeakKeys .pp-weakkeys__rate').first.inner_text()
        check('errorRate% на кейкапе (6/39=15%)', rate, '15%')
        shot(page, '05_profile_weakkeys')

        page.evaluate("localStorage.removeItem('typing_trainer_key_stats')")
        page.goto(f'{BASE}/profile.html')
        page.wait_for_selector('#ppName', timeout=8000)
        page.wait_for_timeout(600)
        check('без key_stats блока нет', page.locator('#ppWeakKeys').count(), 0)
        shot(page, '06_profile_no_block')

        ctx.close()
        browser.close()

    print('\n' + '=' * 50)
    if all(checks):
        print(f'✅ PASS ({len(checks)} проверок)')
        return 0
    print(f'❌ {checks.count(False)} of {len(checks)} упали')
    return 1


sys.exit(main())
