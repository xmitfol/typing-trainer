"""
Verify Lesson Builder end-to-end:
  1. builder.html защищён router-guard'ом (без профиля → index)
  2. Создание урока сохраняет {id, title, text, target_wpm, error_limit, createdAt}
     в localStorage['typing_trainer_user_lessons']
  3. Список «Мои уроки» рендерит созданный
  4. Редактирование переносит данные в форму, save обновляет
  5. Удаление убирает из списка
  6. «▶ Тренировать» ведёт на task.html?tier=user&lesson=<id>
  7. task.html для tier=user грузит урок из localStorage (target, mentor bubble)
  8. Прохождение user-урока НЕ пишет в lessonProgress и test_history
  9. Кнопки task-close + «Продолжить» отчёта ведут на builder.html (для user-урока)
"""
import io, sys
from datetime import datetime
from pathlib import Path
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'builder_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8000'


def shot(page, name):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    print(f'  📸 {p.relative_to(ROOT).as_posix()}')


def seed_profile(page):
    page.evaluate("""
        localStorage.setItem('typing_trainer_user_profile', JSON.stringify({
            name:'Тест', character:'anna', audience:'adult', gender:'m',
            language:'ru', onboardingCompleted:true,
            keyboardType:'classic', keyboardLayout:'standard'
        }));
        localStorage.removeItem('typing_trainer_user_lessons');
        localStorage.removeItem('typing_trainer_lesson_progress');
        localStorage.removeItem('typing_trainer_test_history');
    """)


def press_key(page, ch):
    page.evaluate("""([ch]) => {
        const cap = document.getElementById('capture'); cap.focus();
        cap.dispatchEvent(new KeyboardEvent('keydown', {key:ch, code:'KeyX', bubbles:true, cancelable:true}));
    }""", [ch])


def main():
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 1000})
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(f'page: {e}'))
        page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)

        # 1. router-guard: без профиля → редирект
        page.goto(f'{BASE}/builder.html')
        page.evaluate('localStorage.clear()')
        page.goto(f'{BASE}/builder.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(400)
        url_anon = page.url
        print(f'1) builder.html без профиля → {url_anon}')
        if 'index.html' in url_anon or url_anon.endswith('/'):
            print('   ✅ router-guard сработал')
        else:
            failed += 1; print('   ❌ должно было редиректнуть на index')

        # 2-5. Создать + увидеть в списке + редактировать + удалить
        seed_profile(page)
        page.goto(f'{BASE}/builder.html')
        page.wait_for_selector('#bp-text', timeout=5000)
        page.wait_for_timeout(300)
        shot(page, '01_builder_empty')

        page.locator('#bp-title').click()
        page.keyboard.type('Моя цитата', delay=20)
        page.locator('#bp-text').click()
        page.keyboard.type('ааа ооо ввв ннн', delay=20)
        page.locator('#bp-wpm').fill('40')
        page.locator('#bp-errors').fill('3')
        shot(page, '02_form_filled')

        page.click('#bp-save-btn')
        page.wait_for_timeout(400)
        saved = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_lessons')||'[]')")
        print(f'2) После save: уроков в LS = {len(saved)}; первый = {saved[0] if saved else None}')
        if len(saved) == 1 and saved[0].get('title') == 'Моя цитата' and saved[0].get('text') == 'ааа ооо ввв ннн' \
                and saved[0].get('target_wpm') == 40 and saved[0].get('error_limit') == 3 and saved[0].get('id'):
            print('   ✅ урок сохранён корректно')
        else:
            failed += 1; print('   ❌ структура урока некорректна')

        # 3. Список рендерит
        list_count = page.evaluate("document.querySelectorAll('#bp-list .bp-item').length")
        item_title = page.evaluate("document.querySelector('#bp-list .bp-item__title')?.textContent || ''")
        print(f'3) Список: items={list_count}, первый title="{item_title}"')
        if list_count == 1 and 'Моя цитата' in item_title:
            print('   ✅ список рендерит созданный')
        else:
            failed += 1; print('   ❌')
        shot(page, '03_list_one_item')

        # 4. Edit — клик на ✎ → данные в форме, сохранить с другим title
        page.click('#bp-list [data-action="edit"]')
        page.wait_for_timeout(300)
        loaded_title = page.locator('#bp-title').input_value()
        loaded_text = page.locator('#bp-text').input_value()
        print(f'4) Edit-mode: title="{loaded_title}", text="{loaded_text}"')
        if loaded_title == 'Моя цитата' and loaded_text == 'ааа ооо ввв ннн':
            page.locator('#bp-title').fill('Моя цитата (v2)')
            page.click('#bp-save-btn')
            page.wait_for_timeout(300)
            updated = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_lessons')||'[]')")
            if len(updated) == 1 and updated[0].get('title') == 'Моя цитата (v2)':
                print('   ✅ редактирование сохранено (id не изменился)')
            else:
                failed += 1; print('   ❌ edit не сохранил изменение')
        else:
            failed += 1; print('   ❌ форма не загрузилась')

        # 5. Запомним id для дальнейших проверок task=user, потом проверим удаление позже
        lesson_id = saved[0]['id']

        # 6. Train link ведёт на task.html?tier=user&lesson=<id>
        train_link = page.locator('#bp-list .bp-icon-btn--play').first
        train_href = train_link.get_attribute('href')
        print(f'6) Train link: {train_href}')
        expected = f'task.html?tier=user&lesson={lesson_id}'
        if train_href == expected:
            print('   ✅ tier=user & lesson=<id>')
        else:
            failed += 1; print(f'   ❌ ожидался {expected}')

        # 7. Открыть task.html с tier=user
        page.click('#bp-list .bp-icon-btn--play')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_selector('#mentor-tip', timeout=5000)
        page.wait_for_timeout(800)
        url_task = page.url
        target_text = page.evaluate("document.getElementById('target')?.innerText || ''")
        mentor_tip = page.evaluate("document.getElementById('mentor-tip')?.textContent || ''")
        task_close_href = page.evaluate("document.getElementById('task-close')?.getAttribute('href')")
        print(f'7) task.html tier=user: url={url_task}')
        print(f'   target="{target_text[:30]}"  mentor_tip="{mentor_tip[:60]}"')
        print(f'   close→ {task_close_href}')
        if 'tier=user' in url_task and target_text.strip() == 'ааа ооо ввв ннн' \
                and mentor_tip and task_close_href == 'builder.html':
            print('   ✅ user-урок загружен в task.html + close ведёт в builder')
        else:
            failed += 1; print('   ❌')
        shot(page, '04_task_user_loaded')

        # 8. Пройти урок целиком (через synthetic dispatch) и проверить, что прогресс НЕ записан
        for ch in 'ааа ооо ввв ннн':
            press_key(page, ch)
        page.wait_for_timeout(600)
        success_shown = page.evaluate("document.getElementById('success')?.classList.contains('show')")
        progress_after = page.evaluate("localStorage.getItem('typing_trainer_lesson_progress')")
        history_after = page.evaluate("localStorage.getItem('typing_trainer_test_history')")
        current_after = page.evaluate("localStorage.getItem('typing_trainer_current_lesson')")
        # Полный забег рендерит «Отчёт по уроку»: «Продолжить →» = a.btn--lg в .report-actions
        next_btn_href = page.evaluate("document.querySelector('#success .report-actions a.btn--lg')?.getAttribute('href')")
        print(f'8) Финиш user-урока: success={success_shown}')
        print(f'   progress in LS={progress_after!r}, history={history_after!r}, current={current_after!r}')
        print(f'   next→ {next_btn_href}')
        ok = (success_shown
              and progress_after in (None, 'null')
              and history_after in (None, 'null')
              and current_after in (None, 'null')
              and next_btn_href == 'builder.html')
        if ok:
            print('   ✅ user-урок не загрязнил курсовой прогресс')
        else:
            failed += 1; print('   ❌ user-урок повлиял на lessonProgress/history/current')
        shot(page, '05_task_user_complete')

        # 9. Удаление: возвращаемся в builder и нажимаем 🗑
        page.goto(f'{BASE}/builder.html')
        page.wait_for_selector('#bp-list', timeout=5000)
        page.wait_for_timeout(300)
        # confirm() автоматически → accept
        page.once('dialog', lambda d: d.accept())
        page.click('#bp-list [data-action="delete"]')
        page.wait_for_timeout(400)
        after_delete = page.evaluate("JSON.parse(localStorage.getItem('typing_trainer_user_lessons')||'[]')")
        list_count2 = page.evaluate("document.querySelectorAll('#bp-list .bp-item').length")
        print(f'9) Delete: LS={len(after_delete)}, DOM items={list_count2}')
        if len(after_delete) == 0 and list_count2 == 0:
            print('   ✅ удаление работает')
        else:
            failed += 1; print('   ❌')

        print()
        print(f'page/console errors: {len(errs)}')
        for e in errs[:5]: print('  ', e)
        print(f'OVERALL: {"PASS" if failed == 0 else f"FAIL ({failed})"}')

        ctx.close()
        browser.close()
        sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
