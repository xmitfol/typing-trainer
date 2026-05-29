"""
Новый task.html (клавиатура из дизайн-handoff + наши данные/guard'ы).

A. Загрузка урока 1 (firstUncompleted, доступен при пустом прогрессе):
   - <typing-keyboard> рендерит клавиши (shadow DOM)
   - target отрисован словами, наставник-аватар (svg), цитата
B. Корректный ввод всего текста → success, 5★, lessonProgress[1] сохранён,
   «Продолжить» → lesson.html?lesson=2
C. Ошибка при вводе → accuracy < 100, errors учтены
D. Перенос target по словам (узкий вьюпорт, слова не рвутся)
E. URL-lock: task.html?lesson=6 при пустом прогрессе → редирект на lesson.html
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'task_keyboard'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True}

def seed(page, progress=None):
    page.goto(f"{BASE}/index.html")
    page.evaluate(
        """(a) => {
            localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
            if (a.pr) localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
            else localStorage.removeItem('typing_trainer_lesson_progress');
            localStorage.removeItem('typing_trainer_current_lesson');
        }""",
        {'p': PROFILE, 'pr': progress}
    )

def type_text(page, text):
    # печатаем посимвольно через keydown на #capture (handleKey читает e.key)
    page.evaluate(
        """(txt) => {
            const cap = document.getElementById('capture');
            cap.focus();
            for (const ch of txt) {
                cap.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'KeyX', bubbles: true, cancelable: true }));
            }
        }""",
        text
    )

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
        page.on('console', lambda m: print(f"   ⚠️ console.{m.type}: {m.text}") if m.type == 'error' else None)

        # A. Загрузка
        print("\n=== A. task.html?lesson=1 — клавиатура + target ===")
        seed(page)
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(800)
        keyCount = page.evaluate("document.getElementById('kb').shadowRoot.querySelectorAll('.key').length")
        check('клавиатура отрисовала клавиши', keyCount, lambda n: n and n > 20)
        check('наставник-аватар svg', page.locator('#mentor-avatar svg').count(), lambda n: n >= 1)
        check('цитата наставника непустая', page.locator('#mentor-tip').inner_text(), lambda s: len(s) > 5)
        check('номер упражнения 1.1', page.locator('#task-num').inner_text(), '1.1')
        check('target — слова', page.locator('#target .word').count(), lambda n: n > 0)
        check('highlight-char выставлен', page.evaluate("document.getElementById('kb').getAttribute('highlight-char')"), lambda s: s is not None)
        page.screenshot(path=str(SHOTS / 'A_loaded.png'))

        # B. Корректный ввод → success
        print("\n=== B. правильный ввод → success 5★ ===")
        target = page.evaluate("""() => {
            // восстановить текст из span'ов (пробелы — .space)
            return Array.from(document.querySelectorAll('#target > *')).map(node => {
                if (node.classList.contains('space')) return ' ';
                return Array.from(node.querySelectorAll('span')).map(s => s.textContent).join('');
            }).join('');
        }""")
        print(f"   target = {target!r}")
        type_text(page, target)
        page.wait_for_timeout(800)
        check('success показан', page.locator('#success').get_attribute('class'), lambda s: 'show' in s)
        check('5 звёзд (без ошибок)', page.locator('#final-grade').inner_text(), lambda s: s.count('★') == 5)
        check('«Продолжить» → lesson.html?lesson=2', page.locator('#next-btn').get_attribute('href'), lambda s: 'lesson.html' in s and 'lesson=2' in s)
        saved = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_lesson_progress')||'{}')")
        check('lessonProgress[1].stars=5', saved.get('1', {}).get('stars'), 5)
        page.screenshot(path=str(SHOTS / 'B_success.png'))

        # C. Ошибка → accuracy < 100
        print("\n=== C. ввод с ошибкой → accuracy < 100 ===")
        seed(page)
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=1")
        page.wait_for_selector('#target .word', timeout=8000)
        page.wait_for_timeout(500)
        # первый символ урока 1 = 'а', печатаем 'я' (ошибка), затем правильный 'а'
        page.evaluate("""() => {
            const cap = document.getElementById('capture'); cap.focus();
            cap.dispatchEvent(new KeyboardEvent('keydown', { key: 'я', code: 'KeyX', bubbles:true, cancelable:true }));
        }""")
        page.wait_for_timeout(300)
        check('точность упала ниже 100 после ошибки', page.locator('#stat-acc').inner_text(), lambda s: '0' in s and '100' not in s)
        page.screenshot(path=str(SHOTS / 'C_error.png'))

        # D. Перенос по словам (узкий вьюпорт)
        print("\n=== D. перенос target по словам ===")
        ctx2 = browser.new_context(viewport={'width': 640, 'height': 900}, locale='ru-RU')
        page2 = ctx2.new_page()
        # урок 6 доступен: пройдены 1-5
        seed_progress = {str(n): {'stars': 5, 'bestWPM': 25, 'bestAccuracy': 95} for n in range(1, 6)}
        page2.goto(f"{BASE}/index.html")
        page2.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
            }""", {'p': PROFILE, 'pr': seed_progress}
        )
        page2.goto(f"{BASE}/task.html?tier=tier1&lesson=6")
        page2.wait_for_selector('#target .word', timeout=8000)
        page2.wait_for_timeout(600)
        wrap = page2.evaluate("""() => {
            const words = Array.from(document.querySelectorAll('#target .word'));
            let broken = 0;
            words.forEach(w => {
                const tops = Array.from(w.querySelectorAll('span')).map(c => c.getBoundingClientRect().top);
                if (Math.max(...tops) - Math.min(...tops) > 12) broken++;
            });
            return { words: words.length, broken };
        }""")
        print(f"   слов: {wrap['words']}, разорванных: {wrap['broken']}")
        check('слова не разорваны по буквам', wrap['broken'], 0)
        page2.screenshot(path=str(SHOTS / 'D_wrap.png'), full_page=True)
        ctx2.close()

        # E. Эргономика: сплит + numpad + nav справа, без подреза
        print("\n=== E. ergonomic: split + numpad/nav, без подреза ===")
        page.select_option('#type-select', 'ergonomic')
        page.wait_for_timeout(800)
        ergo = page.evaluate("""() => {
            const sr = document.getElementById('kb').shadowRoot, stage = document.getElementById('kb-stage');
            const wrap = sr.querySelector('.kb--ergo'), clusters = sr.querySelector('.ergo-clusters');
            const er = wrap.getBoundingClientRect(), st = stage.getBoundingClientRect();
            return {
                halves: sr.querySelectorAll('.half-left,.half-right').length,
                clusterKeys: clusters ? clusters.querySelectorAll('.key').length : 0,
                clippedBottom: er.bottom > st.bottom + 1,
                clippedRight: er.right > st.right + 1
            };
        }""")
        print(f"   ergo: {ergo}")
        check('две половины (split)', ergo['halves'], 2)
        check('numpad+nav кластеры присутствуют', ergo['clusterKeys'], lambda n: n > 15)
        check('не подрезано снизу', ergo['clippedBottom'], False)
        check('не подрезано справа', ergo['clippedRight'], False)
        page.screenshot(path=str(SHOTS / 'E_ergo.png'))

        # F. URL-lock
        print("\n=== F. task.html?lesson=6 при пустом прогрессе → редирект ===")
        seed(page)
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=6")
        page.wait_for_timeout(900)
        check('редирект на lesson.html', page.url, lambda u: 'lesson.html' in u)

        ctx.close()
        browser.close()

    print("\n" + "=" * 52)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
