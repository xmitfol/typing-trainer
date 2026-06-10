"""
Smoke-проверка всех страниц дизайн-апдейта вместе (ветка preview/all-phases).
Авторизованный профиль в localStorage → каждая страница рендерит свой каркас
без page-errors. Скриншот каждой для быстрого визуального осмотра.
"""
import io, sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000'
SHOTS = Path(__file__).parent / 'screenshots' / 'all_pages_smoke'
SHOTS.mkdir(parents=True, exist_ok=True)

PROFILE = {
    'name': 'Тест', 'gender': 'm', 'audience': 'adult',
    'character': 'anna', 'mentor': 'anna', 'language': 'ru',
    'keyboardType': 'classic', 'onboardingCompleted': True
}
PROGRESS = {str(n): {'stars': 5 if n <= 3 else 4, 'bestWPM': 24+n, 'bestAccuracy': 90+n,
                     'bestTime': 30, 'completedAt': '2026-05-27T10:00:00Z'} for n in range(1, 6)}
CURRENT = {'tier': 'tier1', 'lessonNumber': 6}

# page → marker selector that must exist
PAGES = [
    ('index.html',            'body.landing-page'),
    ('dashboard.html',        '#dhWelcomeName'),
    ('course.html',           '#cpEyebrow'),
    ('lesson.html?tier=tier1&lesson=6', '#lpTitle'),
    ('task.html?tier=tier1&lesson=1',   '#target .word'),
    ('pricing.html',          '#ppPaywallTitle'),
    ('profile.html',          '#ppName'),
    ('builder.html',          '#bp-text'),
    ('settings.html',         '#sp-name-input'),
    ('achievements.html',     '#ach-groups'),
]

def main():
    bad = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        # seed localStorage
        page.goto(f"{BASE}/index.html")
        page.evaluate(
            """(a) => {
                localStorage.setItem('typing_trainer_user_profile', JSON.stringify(a.p));
                localStorage.setItem('typing_trainer_lesson_progress', JSON.stringify(a.pr));
                localStorage.setItem('typing_trainer_current_lesson', JSON.stringify(a.c));
            }""",
            {'p': PROFILE, 'pr': PROGRESS, 'c': CURRENT}
        )

        for i, (path, marker) in enumerate(PAGES, 1):
            errors.clear()
            page.goto(f"{BASE}/{path}")
            try:
                page.wait_for_selector(marker, timeout=6000)
                page.wait_for_timeout(900)
                ok = True
            except Exception as e:
                ok = False
                print(f"  ❌ {path}: marker {marker} не найден — {e}")
                bad.append(path)
            name = path.split('?')[0].replace('.html', '')
            page.screenshot(path=str(SHOTS / f"{i:02d}_{name}.png"), full_page=True)
            if errors:
                print(f"  ⚠️ {path}: page-errors: {errors[:2]}")
                bad.append(path)
            elif ok:
                print(f"  ✅ {path}")

        ctx.close()
        browser.close()

    print("\n" + "=" * 50)
    if not bad:
        print("✅ SMOKE PASS — все страницы рендерятся без ошибок")
        return 0
    print(f"❌ Проблемы на: {set(bad)}")
    return 1

sys.exit(main())
