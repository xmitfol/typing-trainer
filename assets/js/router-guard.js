/**
 * router-guard.js — единый guard состояния пользователя.
 * Подключается ПЕРВЫМ скриптом на защищённых страницах и на onboarding.html.
 *
 * Сейчас «пользователь» = профиль в localStorage (бекенда нет — Phase 2).
 * Когда появится бекенд, заменить getUser() на чтение сессии/cookie — остальное
 * не меняется.
 *
 * Правила:
 *   - защищённая страница (dashboard/course/lesson/task) без профиля → index.html (лендинг)
 *   - onboarding.html с уже готовым профилем → dashboard.html
 *   - index.html (лендинг) — публичный, без редиректов (CTA сам ведёт куда нужно)
 */
(function () {
    var KEY = 'typing_trainer_user_profile';
    var profile = null;
    try {
        var raw = localStorage.getItem(KEY);
        if (raw) profile = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    // One-shot миграция bestWPM: до фикса calcWpm (task.js, 2026-06-03) WPM
    // считался gross + без floor по времени → сохранялись absurd значения
    // вроде 12468 зн/мин. Top human ≈1000 зн/мин; всё выше 1500 считаем артефактом.
    // Гейт через флаг в localStorage — мигрируем только один раз на устройство.
    try {
        var MIG_KEY = 'typing_trainer_migration_bestwpm_v1';
        if (!localStorage.getItem(MIG_KEY)) {
            var MAX_WPM = 1500;
            var pKey = 'typing_trainer_lesson_progress';
            var pRaw = localStorage.getItem(pKey);
            if (pRaw) {
                var progress = JSON.parse(pRaw);
                var changed = false;
                for (var k in progress) {
                    if (progress[k] && progress[k].bestWPM > MAX_WPM) {
                        progress[k].bestWPM = MAX_WPM;
                        changed = true;
                    }
                }
                if (changed) localStorage.setItem(pKey, JSON.stringify(progress));
            }
            // Также обрежем wpm-аномалии в test_history (они идут в achievements).
            var hKey = 'typing_trainer_test_history';
            var hRaw = localStorage.getItem(hKey);
            if (hRaw) {
                var hist = JSON.parse(hRaw);
                var hChanged = false;
                if (Array.isArray(hist)) {
                    hist.forEach(function (h) { if (h && h.wpm > MAX_WPM) { h.wpm = MAX_WPM; hChanged = true; } });
                }
                if (hChanged) localStorage.setItem(hKey, JSON.stringify(hist));
            }
            localStorage.setItem(MIG_KEY, '1');
        }
    } catch (e) { /* migration is best-effort */ }

    // Админка (/admin/*.html) гейтит себя ПО РОЛИ (admin.js читает GET /me),
    // а не по наличию localStorage-профиля. Не применяем сюда PROTECTED-редирект,
    // иначе не-залогиненного админа выбросило бы на лендинг ещё до role-гейта
    // (а «index.html» в /admin/ совпал бы с именем лендинга). admin.js сам
    // уводит на dashboard/лендинг по результату /me.
    if (location.pathname.toLowerCase().indexOf('/admin/') !== -1) {
        return;
    }

    var hasProfile = !!(profile && profile.onboardingCompleted && profile.name);
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var PROTECTED = ['dashboard.html', 'course.html', 'lesson.html', 'task.html', 'settings.html', 'achievements.html', 'builder.html', 'profile.html'];

    // OAuth-bootstrap: auth-sync.js (грузится ДО этого файла) обнаружил приход из
    // OAuth-callback (httpOnly-cookie есть, localStorage-профиля ещё нет) и
    // асинхронно тянет /me → мостит профиль. Не редиректим на лендинг в этот
    // момент — auth-sync сам уведёт на index.html, если /me не подтвердит сессию.
    var oauthBootstrap = false;
    try { oauthBootstrap = sessionStorage.getItem('tt_oauth_bootstrap') === '1'; } catch (e) {}

    if (PROTECTED.indexOf(page) !== -1 && !hasProfile && !oauthBootstrap) {
        location.replace('index.html');
        return;
    }
    if (page === 'onboarding.html' && hasProfile) {
        location.replace('dashboard.html');
        return;
    }
})();
