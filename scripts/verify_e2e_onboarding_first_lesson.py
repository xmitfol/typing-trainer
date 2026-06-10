"""
E2E verify: онбординг + первый урок (запрос от Ивана 2026-06-03).

Сценарий пользователя:
 1. open http://localhost:8000      → ожидается онбординг-оверлей при пустом LS
 2. fill: name=Тест, audience=adult, mentor=anna, lang=ru, kb=classic
 3. submit + Welcome-modal + "Поехали!"
 4. lesson preview "Урок 1: Первые буквы: А, О, В, Н" + WPM + лимит ошибок
 5. click "Напечатать этот текст"
 6. character-toast lessonStart от Анны
 7. type with errors → tooManyErrors после >½ лимита
 8. finish with errors → lessonCompleteSuccess или errorLimitExceeded
 9. screenshots на каждом шаге

Стратегия: следуем РЕАЛЬНЫМ путям приложения. Если описанный шаг не
соответствует фактической реализации — фиксируем это как finding и
продолжаем по реальной кнопке.
"""
import io
import os
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
SHOTS = ROOT / 'scripts' / 'screenshots' / f'e2e_{TS}'
SHOTS.mkdir(parents=True, exist_ok=True)

BASE = 'http://127.0.0.1:8000'
findings = []
steps = []


def shot(page, name, note=''):
    p = SHOTS / f'{name}.png'
    page.screenshot(path=str(p), full_page=False)
    rel = p.relative_to(ROOT).as_posix()
    print(f'  📸 {rel}  {note}')
    return rel


def log(step, result, evidence=''):
    steps.append({'step': step, 'result': result, 'evidence': evidence})
    print(f'{result}  {step}')
    if evidence:
        print(f'    └ {evidence}')


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = ctx.new_page()

        console_errors = []
        page_errors = []
        page.on('pageerror', lambda e: page_errors.append(str(e)))
        page.on('console', lambda m: console_errors.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)

        # --- STEP 1: open root, ожидание онбординг-оверлея на index.html ---
        page.goto(f'{BASE}/')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(800)
        url1 = page.url
        title1 = page.title()
        has_overlay = page.locator('#onboardingOverlay').count() > 0
        shot(page, '01_root_first_visit', f'url={url1}')

        if has_overlay:
            log('1) localhost:8000 → онбординг-оверлей виден на корне',
                '✅', f'url={url1}, #onboardingOverlay присутствует')
        else:
            log('1) localhost:8000 → онбординг-оверлей НЕ появляется на index.html',
                '⚠️',
                f'url={url1}, title="{title1}". index.html = landing page; #onboardingOverlay нет. '
                f'Описанный flow требует ручного клика "Начать бесплатно".')
            findings.append('index.html НЕ показывает онбординг-оверлей при пустом localStorage — это landing-страница. '
                           'Чтобы попасть в онбординг, нужно кликнуть "Начать бесплатно" → переход на /onboarding.html.')
            # переходим к онбордингу руками
            try:
                page.click('a[href="onboarding.html"]', timeout=3000)
                page.wait_for_load_state('domcontentloaded')
                page.wait_for_timeout(400)
            except Exception as e:
                log('  fallback переход на onboarding.html через клик', '❌', str(e))
                page.goto(f'{BASE}/onboarding.html')
                page.wait_for_timeout(400)

        # --- STEP 2: форма онбординга ---
        try:
            page.wait_for_selector('#userName', timeout=5000)
            shot(page, '02_onboarding_form', 'форма открыта')
            log('2a) Форма онбординга загружена', '✅', '#userName видим')
        except Exception as e:
            log('2a) Форма онбординга НЕ загружена', '❌', str(e))
            return

        # Заполнить имя
        page.locator('#userName').click()
        page.keyboard.type('Тест', delay=40)
        page.wait_for_timeout(200)

        # Выбрать аудиторию (adult)
        try:
            page.click('[data-audience="adult"]')
            page.wait_for_timeout(300)
        except Exception as e:
            log('2b) Не удалось выбрать audience=adult', '❌', str(e))

        # Указать "Мужчина" — проверим, есть ли gender controls
        gender_btn = page.locator('[data-gender="male"]')
        if gender_btn.count():
            gender_btn.click()
            page.wait_for_timeout(200)
            log('2b) Установлен gender=male через [data-gender]', '✅', '')
        else:
            # имя "Тест" окончание на согласную → автодетект может вернуть male
            log('2b) Контрола gender=male нет — полагаемся на автодетект по имени', '⚠️',
                'Описано "Мужчина", но в форме нет явного селектора gender — выводится из имени.')
            findings.append('Форма онбординга не имеет явного селектора пола (gender). '
                           'Выбор Анны связан с audience=adult + явный клик [data-mentor="anna"].')

        # Выбрать наставника Анна
        try:
            page.click('[data-mentor="anna"]', timeout=2000)
            page.wait_for_timeout(200)
        except Exception as e:
            log('2c) Не удалось выбрать наставника Анна', '❌', str(e))

        # Клавиатура — есть ли control "Классическая"?
        kb_btn = page.locator('[data-keyboard="classic"], [data-kb="classic"], [data-keyboardtype="classic"]')
        if kb_btn.count():
            kb_btn.first.click()
            log('2d) Выбран keyboard=classic', '✅', '')
        else:
            log('2d) Селектора клавиатуры в онбординге НЕТ', '⚠️',
                'Описано "Клавиатура Классическая", но онбординг это не предлагает. По умолчанию.')
            findings.append('Онбординг не содержит выбора типа клавиатуры — это делается позже в Настройках. '
                           'По умолчанию kbType=classic (см. settings.js).')

        # Язык: автодетект ru — оставляем
        page.evaluate("window.onboardingManager && (window.onboardingManager.profile.language = 'ru')")
        shot(page, '03_form_filled', 'форма заполнена перед сабмитом')

        # Сабмит
        try:
            page.click('#submitOnboarding')
            page.wait_for_timeout(800)
            log('3) Submit формы', '✅', '')
        except Exception as e:
            log('3) Submit формы ❌', '❌', str(e))
            return

        # --- STEP 3b: Welcome-модал с кнопкой "Поехали!" ---
        # Реально: после submit диспатчится typingtrainer:onboardingComplete →
        # обработчик в onboarding.html делает window.location='dashboard.html'.
        # Никакого welcome-модала на onboarding.html нет.
        page.wait_for_timeout(1200)
        welcome_btn = page.locator('text=Поехали!').first
        has_welcome = welcome_btn.count() > 0
        url_after_submit = page.url

        if has_welcome:
            shot(page, '04_welcome_modal', '"Поехали!" модал')
            log('3b) Welcome-модал с "Поехали!"', '✅', f'url={url_after_submit}')
            welcome_btn.click()
            page.wait_for_timeout(800)
        else:
            log('3b) Welcome-модал с "Поехали!" НЕ появляется', '⚠️',
                f'После submit редирект на {url_after_submit} без модала. '
                f'character-system есть messages.welcome, но не подключён ни на одной странице.')
            findings.append('"Welcome-модал" из описания НЕ существует: после submit срабатывает событие '
                           'typingtrainer:onboardingComplete → onboarding.html делает window.location=dashboard.html. '
                           'character-system.js и toast-manager.js не подключены ни в одной active HTML-страница '
                           '(только модуль main.js использует их, но main.js включен ТОЛЬКО в обособленном modal.html).')

        # --- STEP 4: после онбординга — что в редакторе ---
        page.wait_for_timeout(800)
        url_final = page.url
        shot(page, '05_after_onboarding', f'url={url_final}')
        log(f'4a) Куда попали после онбординга: {url_final}', 'ℹ️', '')

        # Если попали на dashboard — ищем там превью "Урок 1"
        body_class = page.evaluate('document.body.className')
        page_state = {'url': url_final, 'body.class': body_class}
        # Ищем "Урок 1" / "А, О, В, Н" / "Первые буквы"
        page_text = page.evaluate('document.body.innerText')
        has_lesson_1 = 'Урок 1' in page_text or 'А, О, В, Н' in page_text or 'Первые буквы' in page_text
        has_print_btn = 'Напечатать этот текст' in page_text

        if has_lesson_1:
            log('4b) Превью "Урок 1: Первые буквы: А, О, В, Н" видим', '✅', '')
        else:
            log('4b) Превью "Урок 1: Первые буквы: А, О, В, Н" НЕ найдено', '⚠️',
                f'На странице {url_final} нет такого текста. body.class={body_class}.')
            findings.append('После онбординга нет страницы-редактора с превью урока. '
                           'Dashboard показывает карточки курса; чтобы попасть в тренажёр, '
                           'нужно кликнуть Course → Lesson card → Task. Превью с phrase "Урок 1: Первые буквы" '
                           'не отображается на dashboard.html.')

        if has_print_btn:
            log('5) Кнопка "Напечатать этот текст" присутствует', '✅', '')
        else:
            log('5) Кнопка "Напечатать этот текст" отсутствует на текущей странице', '⚠️',
                f'Кнопки нет на {url_final}. Эту кнопку использует ТОЛЬКО main.js / modal.html '
                f'(обособленная страница, не часть current flow).')
            findings.append('Кнопка "Напечатать этот текст" существует ТОЛЬКО в main.js / modal.html — '
                           'это устаревшая монолитная UI. В новой архитектуре (dashboard → course → lesson → task) '
                           'эта кнопка отсутствует; tier-route ведёт сразу в task.html, где пользователь '
                           'начинает печатать при первом нажатии клавиши.')

        # --- STEP 6-10: попытка дойти до task.html через реальный путь ---
        # На dashboard кликнем кнопку "Продолжить курс" / "Начать первый урок"
        # Сначала найдём активную кнопку.
        candidates = [
            'a:has-text("Начать"), button:has-text("Начать")',
            'a:has-text("Продолжить"), button:has-text("Продолжить")',
            'a:has-text("Урок 1"), button:has-text("Урок 1")',
        ]
        navigated = False
        for sel in candidates:
            loc = page.locator(sel).first
            if loc.count():
                try:
                    loc.click(timeout=2000)
                    page.wait_for_load_state('domcontentloaded')
                    page.wait_for_timeout(800)
                    navigated = True
                    log(f'6a) Клик "{sel}" — навигация на {page.url}', '✅', '')
                    break
                except Exception:
                    continue
        if not navigated:
            log('6a) Не нашлось кнопки "Начать/Продолжить" на странице после онбординга', '⚠️',
                'Попробую navigate прямо в task.html?tier=tier1&lesson=1')
            page.goto(f'{BASE}/task.html?tier=tier1&lesson=1')
            page.wait_for_load_state('domcontentloaded')
            page.wait_for_timeout(800)

        # Если попали на course/lesson — ещё клик
        if 'task.html' not in page.url:
            for sel in [
                'a:has-text("Выполнить задание")',
                '#lpTopTask',
                'a:has-text("Открыть тренажёр")',
                '#lpOpenTrainer',
                'a:has-text("Урок 1")',
                'a:has-text("Начать урок")',
                '.lp-start-btn',
                '[data-lesson="1"]',
            ]:
                loc = page.locator(sel).first
                if loc.count():
                    try:
                        loc.click(timeout=2000)
                        page.wait_for_load_state('domcontentloaded')
                        page.wait_for_timeout(1000)
                        log(f'6b) Доп. клик "{sel}" → {page.url}', '✅', '')
                        if 'task.html' in page.url:
                            break
                    except Exception:
                        continue
        shot(page, '06_arrived_at_task', f'url={page.url}')

        # --- STEP 7-10: character-toast на task.html ---
        if 'task.html' not in page.url:
            log('7) Не удалось дойти до task.html', '❌', f'застряли на {page.url}')
        else:
            # Проверим, подключён ли character-system на task.html
            cs_loaded = page.evaluate('typeof window.characterSystem')
            tm_loaded = page.evaluate('typeof window.toastManager')
            log(f'7a) На task.html: characterSystem={cs_loaded}, toastManager={tm_loaded}', 'ℹ️', '')
            if cs_loaded == 'undefined' or tm_loaded == 'undefined':
                findings.append(f'task.html НЕ подключает character-system.js / toast-manager.js. '
                               f'characterSystem={cs_loaded}, toastManager={tm_loaded}. '
                               f'Никаких character-toast (lessonStart, tooManyErrors, lessonCompleteSuccess) '
                               f'на task.html не появится — модули просто не загружены.')

            # Подождём, может toast всё же появится через 1-2 сек
            page.wait_for_timeout(1500)
            toast_count = page.locator('.toast-container .toast, .character-toast, [class*="toast"]').count()
            log(f'7b) Количество toast-элементов в DOM: {toast_count}', 'ℹ️', '')
            shot(page, '07_task_page_initial', 'task.html сразу после загрузки')

            # diagnostics: что в #task-body / #target
            target_text = page.evaluate("document.querySelector('#target')?.innerText || ''")
            body_text = page.evaluate("document.querySelector('#task-body')?.innerText || ''")
            log(f'7c) #target.innerText="{target_text[:80]}", #task-body.innerText="{body_text[:80]}"', 'ℹ️', '')

            # Фокус на capture через focus() — клик перехватывается div'ом
            page.evaluate("document.querySelector('#capture')?.focus()")
            page.wait_for_timeout(200)

            # 5 неправильных символов (xxxxx)
            for ch in 'xxxxx':
                page.keyboard.press(f'Key{ch.upper()}', delay=60) if False else page.keyboard.type(ch, delay=60)
            page.wait_for_timeout(800)
            shot(page, '08_after_errors', 'после 5 неправильных нажатий')

            toast_text_after_errors = page.evaluate(
                "[...document.querySelectorAll('[class*=\"toast\"]')].map(n=>n.innerText).join(' | ')"
            )
            captured_val = page.evaluate("document.querySelector('#capture')?.value || ''")
            log(f'8) После 5 ошибок: capture.value="{captured_val[:30]}" toasts="{toast_text_after_errors[:200]}"', 'ℹ️',
                f'console-errors: {len(console_errors)}')

            # Дальше: введём 30 неправильных — должно превысить лимит и/или закончить
            for _ in range(30):
                page.keyboard.type('z', delay=20)
            page.wait_for_timeout(1000)
            shot(page, '09_after_many_errors', 'после массы ошибок')

            final_toasts = page.evaluate(
                "[...document.querySelectorAll('[class*=\"toast\"]')].map(n=>n.innerText).join(' | ')"
            )
            modal_open = page.locator('.results-overlay, [class*=\"result\"], [class*=\"modal\"]').count()
            unlock_toasts = page.locator('.unlock-toasts .unlock-toast').count()
            log(f'10) Итоговое: toasts="{final_toasts[:200]}" modal_count={modal_open} unlock_toasts={unlock_toasts}',
                'ℹ️', '')

            # Снимем snapshot всех элементов с visible классами для итога
            visible_messages = page.evaluate("""
                () => {
                    const out = [];
                    document.querySelectorAll('.toast-container, .character-toast, .unlock-toasts, .results-overlay, [class*=\"modal\"]').forEach(n => {
                        const rect = n.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            out.push({sel: n.className, text: (n.innerText||'').slice(0,80)});
                        }
                    });
                    return out;
                }
            """)
            print('  visible toast/modal elements:', visible_messages)

        # --- ИТОГ ---
        print()
        print('=' * 72)
        print('PAGE ERRORS:', len(page_errors))
        for e in page_errors[:10]:
            print('  ', e)
        print('CONSOLE ERRORS:', len(console_errors))
        for e in console_errors[:5]:
            print('  ', e)
        print()
        print('FINDINGS:')
        for i, f in enumerate(findings, 1):
            print(f'  {i}. {f}')

        ctx.close()
        browser.close()


if __name__ == '__main__':
    main()
