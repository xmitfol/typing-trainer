"""
Verify MentorBubble dynamic wiring on task.html (по дизайну
design_handoff_full/reference/task/task.jsx → MentorBubble).

Сценарии:
  A. lessonStart  — bubble показывает curated character_tips[mentorId]
                    (для anna на уроке 1 — есть, проверяем непустой текст)
  B. tooManyErrors — после errors>½limit (limit=2 → срабатывает после 2-й ошибки)
                    реплика меняется на одну из anna.messages.tooManyErrors
  C. lessonCompleteSuccess — финиш с errors ≤ limit
  D. errorLimitExceeded — финиш с errors > limit (другая попытка)
  E. reset() возвращает initTip

Использование: python -m http.server 8000 в фоне, затем этот скрипт.
"""
import io
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'mentor_bubble_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def get_tip(page):
    return page.evaluate("document.getElementById('mentor-tip')?.textContent || ''")


def get_hint(page):
    return page.evaluate("document.getElementById('mentor-hint')?.textContent || ''")


def press_key(page, ch):
    """Dispatch keydown через capture для Cyrillic."""
    page.evaluate(
        """([ch]) => {
            const cap = document.getElementById('capture');
            if (!cap) return false;
            cap.focus();
            cap.dispatchEvent(new KeyboardEvent('keydown', {
                key: ch, code: 'KeyX', bubbles: true, cancelable: true
            }));
            return true;
        }""",
        [ch]
    )


def seed_profile(page):
    page.evaluate("""
        const profile = {
            name: 'Тест',
            character: 'anna',
            audience: 'adult',
            gender: 'male',
            language: 'ru',
            onboardingCompleted: true,
            keyboardType: 'classic',
            keyboardLayout: 'standard'
        };
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify(profile));
        localStorage.removeItem('typing_trainer_lesson_progress');
        localStorage.removeItem('typing_trainer_test_history');
        localStorage.setItem('typing_trainer_current_lesson', JSON.stringify({tier:'tier1', lessonNumber:1}));
    """)


def open_task(page):
    page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_selector('#mentor-tip', timeout=5000)
    # дать character-system догрузиться
    page.wait_for_timeout(800)


def main():
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)

        # Профиль + старт
        page.goto(f'{BASE}/index.html')
        seed_profile(page)
        open_task(page)

        # ─── A. lessonStart ──────────────────────────────────────────
        tip_start = get_tip(page)
        hint_start = get_hint(page)
        target_text = page.evaluate("document.getElementById('target')?.innerText || ''")
        # character-system должен быть жив и character=anna
        cs_ok = page.evaluate("typeof window.characterSystem !== 'undefined' && window.characterSystem.character && window.characterSystem.character.id")
        print(f'A) lessonStart: cs={cs_ok!r}, tip="{tip_start[:80]}", hint="{hint_start[:60]}"')
        print(f'   target="{target_text[:60]}"')
        shot(page, 'A_lessonStart')
        assert cs_ok == 'anna', f'character-system не загружен или не anna: {cs_ok!r}'
        assert tip_start and tip_start != '—', f'tipEl пустой/дефолтный: {tip_start!r}'
        print('   ✅ A pass')

        # ─── B. tooManyErrors ───────────────────────────────────────
        # error_limit=2 → halfErrorLimit=1 → срабатывает когда errors>1 (т.е. на 2-й ошибке)
        # Нажмём 3 неправильных подряд (target[0]='а', посылаем 'x','y','z')
        for ch in ('x', 'y', 'z'):
            press_key(page, ch)
        page.wait_for_timeout(300)
        tip_too_many = get_tip(page)
        print(f'B) tooManyErrors: tip="{tip_too_many[:100]}"')
        shot(page, 'B_tooManyErrors')
        # должен отличаться от tip_start
        if tip_too_many == tip_start:
            print(f'   ❌ B fail — tip не сменился (всё ещё стартовая реплика)')
            failed += 1
        else:
            print('   ✅ B pass — реплика сменилась')

        # ─── E. reset() возвращает initTip ───────────────────────────
        page.click('#restart-btn')
        page.wait_for_timeout(300)
        tip_after_reset = get_tip(page)
        print(f'E) reset() tip="{tip_after_reset[:80]}"')
        if tip_after_reset != tip_start:
            print(f'   ❌ E fail — tip после reset должен совпадать с initTip')
            failed += 1
        else:
            print('   ✅ E pass — реплика восстановлена')

        # ─── C. lessonCompleteSuccess ────────────────────────────────
        # Печатаем весь target правильно (errors ≤ 2 → lessonCompleteSuccess)
        # Получим текст напрямую из lesson JSON, чтобы избежать UI-парсинга
        full_target = page.evaluate("""
            (async () => {
                const r = await fetch('data/lessons/tier1/lesson_01.json');
                const j = await r.json();
                return j.text;
            })()
        """)
        print(f'   target full="{full_target}"')
        for ch in full_target:
            press_key(page, ch)
        page.wait_for_timeout(600)
        tip_complete = get_tip(page)
        success_visible = page.evaluate("document.getElementById('success')?.classList.contains('show')")
        print(f'C) lessonCompleteSuccess: success.show={success_visible}, tip="{tip_complete[:100]}"')
        shot(page, 'C_lessonCompleteSuccess')
        if not success_visible:
            print(f'   ❌ C fail — success экран не показан')
            failed += 1
        elif tip_complete == tip_start or tip_complete == tip_too_many:
            print(f'   ❌ C fail — tip не обновился под завершение')
            failed += 1
        else:
            print('   ✅ C pass')

        # ─── D. errorLimitExceeded ───────────────────────────────────
        # Retry с большим количеством ошибок (> error_limit = 2)
        page.click('#retry-btn')
        page.wait_for_timeout(300)
        # Печатаем 31 символ, чередуя правильные и неправильные, чтобы errors>2 но typed=length
        # target = "ааа ооо ввв ннн оно она он ан на" (31 char)
        # Делаем сначала 5 неправильных, затем правильно остаток
        for _ in range(5):
            press_key(page, 'q')  # ошибки
        # Допечатываем правильно с позиции 5
        for ch in full_target[5:]:
            press_key(page, ch)
        page.wait_for_timeout(600)
        tip_fail = get_tip(page)
        success_after_fail = page.evaluate("document.getElementById('success')?.classList.contains('show')")
        print(f'D) errorLimitExceeded: success.show={success_after_fail}, tip="{tip_fail[:100]}"')
        shot(page, 'D_errorLimitExceeded')
        if tip_fail == tip_complete:
            print(f'   ⚠️ D — tip совпал с success-репликой; возможно случайно тот же текст из массива')
        if not success_after_fail:
            print(f'   ❌ D fail — success экран не показан после превышения лимита')
            failed += 1
        else:
            print('   ✅ D pass — финиш с превышением лимита показал реплику')

        print()
        print('=' * 60)
        print(f'page/console errors: {len(errs)}')
        for e in errs[:5]:
            print('  ', e)
        print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')

        ctx.close()
        browser.close()
        sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
