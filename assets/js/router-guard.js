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

    var hasProfile = !!(profile && profile.onboardingCompleted && profile.name);
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var PROTECTED = ['dashboard.html', 'course.html', 'lesson.html', 'task.html', 'settings.html'];

    if (PROTECTED.indexOf(page) !== -1 && !hasProfile) {
        location.replace('index.html');
        return;
    }
    if (page === 'onboarding.html' && hasProfile) {
        location.replace('dashboard.html');
        return;
    }
})();
