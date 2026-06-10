"""
Verify inline ExerciseInsert на lesson.html (по design lesson.jsx).

Сценарии:
  1. lesson_01.json содержит 2 inline-упражнения; оба рендерятся как
     .lp-exercise--inline с правильным finger-color и количеством dot'ов
  2. PullQuote ({type:"pullquote"}) рендерится как blockquote с автором
  3. Callout ({type:"callout"}) рендерится с иконкой/заголовком/текстом
  4. P-tip с {type:"drop"} получает класс lp-p--drop
  5. Mixed exercise (нажатия) — typed-счёт и progress-dots обновляются
  6. Полное прохождение упражнения → бэйдж «ВЫПОЛНЕНО» + класс lp-exercise--done
  7. Backward-compat: легаси-урок с string[]-tips продолжает рендериться без багов
  8. Reset кнопка возвращает typed=0
"""
import io, sys, json
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'inline_ex_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=True)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed(page):
    page.evaluate("""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
            name:'Тест', character:'anna', audience:'adult', gender:'m',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }));
        localStorage.removeItem('typing_trainer_lesson_progress');
    """)


def main():
    failed = 0
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1400, 'height': 1200})

        # ─── lesson_01 — новая разметка с inline ─────────────────────
        page = ctx.new_page()
        page.goto(f'{BASE}/index.html')
        seed(page)
        page.goto(f'{BASE}/lesson.html?tier=tier1&lesson=1')
        page.wait_for_selector('#lpTips .lp-exercise--inline', timeout=8000)
        page.wait_for_timeout(800)

        ex_count = page.locator('.lp-exercise--inline').count()
        callout_count = page.locator('#lpTips .lp-callout').count()
        pullquote_count = page.locator('#lpTips blockquote.lp-quote').count()
        drop_p_count = page.locator('#lpTips .lp-p--drop').count()
        figure_count = page.locator('#lpTips .lp-figure').count()
        print(f'1) lesson_01 структура: inline-exercises={ex_count}, callout={callout_count}, pullquote={pullquote_count}, drop-cap p={drop_p_count}')
        if ex_count == 2 and callout_count >= 1 and pullquote_count == 1 and drop_p_count == 1:
            print('   ✅ структура — 2 упражнения + callout + pullquote + drop')
        else:
            failed += 1; print('   ❌ структура нарушена')

        # finger colors разные
        finger1 = page.locator('.lp-exercise--inline').nth(0).get_attribute('data-finger')
        finger2 = page.locator('.lp-exercise--inline').nth(1).get_attribute('data-finger')
        print(f'2) finger colors: ex1={finger1}, ex2={finger2}')
        if finger1 == 'blue' and finger2 == 'green':
            print('   ✅ finger-цвета взяты из JSON')
        else:
            failed += 1; print('   ❌')

        shot(page, '01_lesson_loaded')

        # ─── Mixed exercise typing ──────────────────────────────────
        ex1 = page.locator('.lp-exercise--inline').nth(0)
        target_text = ex1.locator('.lp-exercise__target').inner_text().strip()
        print(f'3) target ex1: "{target_text}"')

        # Кликаем на ex1 — фокус, потом печатаем неправильно один символ
        ex1.click()
        page.wait_for_timeout(200)
        page.evaluate("""
            const cap = document.querySelectorAll('.lp-exercise__capture')[0];
            cap.focus();
            cap.dispatchEvent(new KeyboardEvent('keydown', {key:'q', code:'KeyX', bubbles:true, cancelable:true}));
            cap.dispatchEvent(new KeyboardEvent('keydown', {key:'а', code:'KeyA', bubbles:true, cancelable:true}));
            cap.dispatchEvent(new KeyboardEvent('keydown', {key:'а', code:'KeyA', bubbles:true, cancelable:true}));
        """)
        page.wait_for_timeout(300)
        count_after = ex1.locator('.lp-exercise__count').inner_text()
        dots_on = ex1.locator('.lp-exercise__dot.on').count()
        print(f'4) После 3 нажатий: count="{count_after}", dots-on={dots_on}')
        if count_after == '3/15' and dots_on == 3:
            print('   ✅ typed-счёт + dots обновляются')
        else:
            failed += 1; print('   ❌')

        # Reset
        ex1.locator('.lp-exercise__reset').click()
        page.wait_for_timeout(200)
        count_reset = ex1.locator('.lp-exercise__count').inner_text()
        dots_after_reset = ex1.locator('.lp-exercise__dot.on').count()
        print(f'5) После reset: count="{count_reset}", dots-on={dots_after_reset}')
        if count_reset == '0/15' and dots_after_reset == 0:
            print('   ✅ reset работает')
        else:
            failed += 1; print('   ❌')

        # Полное прохождение
        ex1.click()
        page.evaluate("""
            const cap = document.querySelectorAll('.lp-exercise__capture')[0];
            const target = 'ааа ооо ввв ннн';
            for (const ch of target) {
                cap.dispatchEvent(new KeyboardEvent('keydown', {key:ch, code:'KeyA', bubbles:true, cancelable:true}));
            }
        """)
        page.wait_for_timeout(400)
        is_done = ex1.evaluate("e => e.classList.contains('lp-exercise--done')")
        badge_text = ex1.locator('.lp-exercise__badge-text').inner_text()
        print(f'6) После 15 правильных нажатий: done={is_done}, badge="{badge_text}"')
        if is_done and 'ВЫПОЛНЕНО' in badge_text:
            print('   ✅ completion state применён')
        else:
            failed += 1; print('   ❌')

        shot(page, '02_first_exercise_done')

        # ─── Backward compat: lesson-page.js всё ещё поддерживает старые
        # string-tips (после миграции 458 уроков таких в репо нет, но code
        # должен корректно работать если кто-то загрузит legacy lesson.json).
        # Проверяем через подмену lessonLoader.loadLesson.
        page2 = ctx.new_page()
        page2.goto(f'{BASE}/index.html')
        page2.evaluate("""
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
                name:'Тест', character:'anna', audience:'adult', gender:'m',
                language:'ru', onboardingCompleted:true,
                keyboardType:'classic', keyboardLayout:'standard'
            }));
            localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify({
                '1': {stars:4, bestWPM:30, bestAccuracy:95}
            }));
        """)
        # Подменяем lessonLoader ДО навигации — page.add_init_script инжектится
        # перед каждым DOMContentLoaded. Lesson получается с pure-string tips.
        page2.add_init_script("""
            window.addEventListener('DOMContentLoaded', () => {
                if (!window.lessonLoader) return;
                const orig = window.lessonLoader.loadLesson.bind(window.lessonLoader);
                window.lessonLoader.loadLesson = async (tier, n) => {
                    if (n === 2) return {
                        id: 'mock', tier: 1, lesson_number: 2,
                        title: 'Legacy Mock Lesson',
                        description: 'String-tips fixture',
                        text: 'ааа ооо', target_wpm: 10, error_limit: 2,
                        phase: 1, new_keys: ['А', 'О'],
                        finger_focus: 'Указательные пальцы',
                        tips: [
                            'Это первый старо-строковый tip',
                            'Это второй tip — должен стать drop-cap',
                            'Это третий tip — должен стать callout',
                            'Это четвёртый tip'
                        ],
                        character_tips: { anna: 'Анна говорит привет' }
                    };
                    return orig(tier, n);
                };
            });
        """)
        page2.goto(f'{BASE}/lesson.html?tier=tier1&lesson=2')
        page2.wait_for_selector('#lpTitle', timeout=8000)
        page2.wait_for_timeout(800)
        legacy_inline = page2.locator('.lp-exercise--inline').count()
        legacy_tips_p = page2.locator('#lpTips .lp-p').count()
        legacy_callout = page2.locator('#lpTips .lp-callout').count()
        legacy_title = page2.locator('#lpTitle').inner_text()
        print(f'7) Legacy mock string-tips: title="{legacy_title}", inline={legacy_inline}, p={legacy_tips_p}, callout={legacy_callout}')
        # При string tips: 0 inline-exercise, ≥2 параграфа, ≥1 callout (3-й tip)
        if legacy_inline == 0 and legacy_tips_p >= 2 and legacy_callout >= 1:
            print('   ✅ backward-compat code path всё ещё работает')
        else:
            failed += 1; print('   ❌ backward-compat сломан')

        page.close(); page2.close()
        ctx.close(); b.close()

    print()
    print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
