"""
task.html: перенос target-текста ТОЛЬКО по словам (слово не рвётся по буквам).

Узкий вьюпорт → текст переносится на несколько строк. Проверяем:
  - есть перенос (минимум 2 строки) — тест осмысленный
  - каждое слово (.tp-target__word) целиком на ОДНОЙ строке
    (все буквы слова имеют одинаковый offsetTop)
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'task_wrap'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {'name': 'Тест', 'gender': 'm', 'audience': 'adult', 'character': 'anna',
           'mentor': 'anna', 'language': 'ru', 'keyboardType': 'classic', 'onboardingCompleted': True}
# уроки 1-5 пройдены → урок 6 доступен (firstUncompleted)
PROGRESS = {str(n): {'stars': 5, 'bestWPM': 25, 'bestAccuracy': 95} for n in range(1, 6)}

def main():
    checks = []
    def check(label, actual, exp):
        ok = exp(actual) if callable(exp) else (actual == exp)
        print(f"   {'✅' if ok else '❌'} {label}: {actual!r}")
        checks.append(ok)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        # узкий вьюпорт чтобы спровоцировать перенос
        ctx = browser.new_context(viewport={'width': 620, 'height': 900}, locale='ru-RU')
        page = ctx.new_page()
        page.on('pageerror', lambda e: print(f"   ⚠️ page-error: {e}"))
        page.goto(f"{BASE}/index.html")
        page.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
            }""",
            {'p': PROFILE, 'pr': PROGRESS}
        )
        page.goto(f"{BASE}/task.html?tier=tier1&lesson=6")
        page.wait_for_selector('#tpTarget .tp-target__word', timeout=6000)
        page.wait_for_timeout(600)

        data = page.evaluate(
            """() => {
                const words = Array.from(document.querySelectorAll('#tpTarget .tp-target__word'));
                const lineBuckets = new Set();
                let brokenWords = 0;
                words.forEach(w => {
                    const tops = Array.from(w.querySelectorAll('.tp-target__char'))
                        .map(c => c.getBoundingClientRect().top);
                    const min = Math.min(...tops), max = Math.max(...tops);
                    // разрыв строки даёт разницу ~ line-height (~39px); курсор-паддинг < 10px
                    if (max - min > 12) brokenWords++;
                    lineBuckets.add(Math.round(min / 20));
                });
                return { wordCount: words.length, brokenWords, lineCount: lineBuckets.size };
            }"""
        )
        print(f"   слов: {data['wordCount']}, строк: {data['lineCount']}, разорванных слов: {data['brokenWords']}")
        check('текст реально переносится (>1 строки)', data['lineCount'], lambda n: n >= 2)
        check('есть слова для проверки', data['wordCount'], lambda n: n > 0)
        check('НЕТ слов разорванных по буквам', data['brokenWords'], 0)

        page.screenshot(path=str(SHOTS / 'task_wrap_narrow.png'), full_page=True)
        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if all(checks):
        print(f"✅ PASS ({len(checks)} проверок)")
        return 0
    print(f"❌ {checks.count(False)} of {len(checks)} упали")
    return 1

sys.exit(main())
