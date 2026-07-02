/**
 * auth-sync.js — bootstrap серверного синка на защищённых страницах (P2-sync).
 *
 * Подключается ПЕРЕД router-guard.js на защищённых/onboarding страницах и
 * загружает api-client.js (сам скрипт добавляется в HTML отдельным тегом ДО
 * этого файла).
 *
 * Что делает синхронно (до отрисовки):
 *   1. apiClient.init() — читает config (useApi/baseUrl) из localStorage.
 *   2. OAuth-landing: если URL содержит ?oauth=1 (callback бэка редиректит сюда
 *      после установки httpOnly-cookies) → включает useApi=true и ставит
 *      session-флаг `tt_oauth_bootstrap`, чтобы router-guard НЕ выбросил на
 *      лендинг из-за отсутствия localStorage-профиля (профиль подтянется из /me).
 *
 * Как понимаем «залогинен»: httpOnly-cookie не видна JS. Источник истины —
 * успешный GET /me. Флаг useApi (в localStorage config) — оптимистичный маркер
 * «была успешная auth-сессия». На старте, если useApi=true, дёргаем
 * apiClient.getCurrentUser() (→ GET /me):
 *   - success → мостим серверный профиль в localStorage (router-guard/страницы
 *     читают его синхронно), при первом OAuth-входе — фоновая guest-миграция;
 *   - 401 → сессия истекла → откат useApi=false (дальше всё из localStorage как
 *     гость), снимаем oauth-bootstrap флаг.
 *
 * Порядок: router-guard.js уже выполнился синхронно к моменту, когда наш
 * async-bootstrap резолвится. Для OAuth-landing router-guard пропустил редирект
 * (см. флаг), поэтому мы либо мостим профиль и перезагружаем страницу (чтобы
 * контроллер увидел профиль синхронно), либо, если /me упал, уводим на лендинг.
 */
(function () {
    'use strict';

    if (!window.apiClient) return;  // api-client.js не подключён — режим без синка

    var PROFILE_KEY = 'typing_trainer_user_profile';
    var MIGRATED_KEY = 'typing_trainer_guest_migrated';
    var OAUTH_FLAG = 'tt_oauth_bootstrap';

    // 1. Инициализируем config (синхронно из localStorage).
    window.apiClient.init();

    var params = new URLSearchParams(window.location.search);
    var isOauthLanding = params.get('oauth') === '1';

    if (isOauthLanding) {
        // Пришли из OAuth-callback: сессия уже установлена cookie'й. Включаем синк
        // и просим router-guard не редиректить (профиля в localStorage ещё нет).
        try { window.apiClient.setConfig({ useApi: true }); } catch (e) {}
        try { sessionStorage.setItem(OAUTH_FLAG, '1'); } catch (e) {}
    }

    var cfg = window.apiClient.getConfig();
    if (!cfg.useApi) {
        // Локальный/гостевой режим — синк выключен, ничего не делаем.
        try { sessionStorage.removeItem(OAUTH_FLAG); } catch (e) {}
        return;
    }

    function read(k) {
        try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; }
    }
    function write(k, v) {
        try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
    }

    // Серверный профиль (/me, ProfileOut) → localStorage-форма приложения.
    // Мержим поверх существующего локального профиля (сохраняем client-only поля:
    // keyboardType/taskZoom/fingerHint и т.п., которые живут в settings, но
    // некоторые страницы читают из profile). onboardingCompleted=true всегда —
    // у аккаунта онбординг пройден (или пройдёт на onboarding.html).
    function bridgeServerProfile(user) {
        var prev = read(PROFILE_KEY) || {};
        var merged = Object.assign({}, prev, {
            name: user.name,
            email: user.email,
            audience: user.audience,
            character: user.character,
            mentor: user.character,
            gender: user.gender || prev.gender || 'm',
            language: user.language || prev.language || 'ru',
            onboardingCompleted: true,
        });
        write(PROFILE_KEY, merged);
        return merged;
    }

    // Фоновая guest-миграция один раз (тот же контракт, что в auth.js). Для OAuth
    // password-путь auth.js уже мигрирует; здесь — страховка для случая, когда
    // useApi включился без прохода через auth.js (например, OAuth-landing).
    function migrateGuestOnce() {
        try { if (localStorage.getItem(MIGRATED_KEY)) return Promise.resolve(); } catch (e) { return Promise.resolve(); }
        var progress = read('typing_trainer_lesson_progress');
        var history = read('typing_trainer_test_history');
        var profile = read(PROFILE_KEY) || {};
        var current = read('typing_trainer_current_lesson') || {};
        var hasData = (progress && Object.keys(progress).length) || (Array.isArray(history) && history.length);
        if (!hasData) { try { localStorage.setItem(MIGRATED_KEY, '1'); } catch (e) {} return Promise.resolve(); }
        var lang = profile.language || 'ru', ch = profile.character, tier = current.tier;
        if (!tier) {
            if (lang === 'en') tier = ch === 'knopych' ? 'en_teen' : ch === 'klavochka' ? 'en_kids' : 'en_tier1';
            else tier = ch === 'knopych' ? 'ru_teen' : ch === 'klavochka' ? 'ru_kids' : 'tier1';
        }
        return window.apiClient.migrateGuest({
            progress: progress || {}, history: history || [], profile: profile,
            default_tier: tier,
        }).then(function () {
            try { localStorage.setItem(MIGRATED_KEY, '1'); } catch (e) {}
        }).catch(function () { /* повторим при следующем входе */ });
    }

    var oauthBootstrap = false;
    try { oauthBootstrap = sessionStorage.getItem(OAUTH_FLAG) === '1'; } catch (e) {}

    // Проверяем сессию. getCurrentUser() → GET /me (useApi=true), 401 → null.
    var probe = window.apiClient.getCurrentUser().then(function (user) {
        if (user && user.name) {
            var hadProfile = !!read(PROFILE_KEY);
            bridgeServerProfile(user);
            // Первый OAuth-вход (или синк без auth.js) — мигрируем guest-данные.
            migrateGuestOnce();
            if (oauthBootstrap) {
                try { sessionStorage.removeItem(OAUTH_FLAG); } catch (e) {}
                // router-guard пропустил редирект в ожидании профиля. Если профиля
                // синхронно не было (типичный OAuth-landing на dashboard) —
                // перезагружаем без ?oauth=1, чтобы контроллер увидел профиль.
                if (!hadProfile) {
                    var clean = window.location.pathname + window.location.hash;
                    window.location.replace(clean);
                }
            }
        } else {
            // Сессии нет/истекла (401 → null).
            sessionExpired();
        }
    }).catch(function () {
        // Сеть/бэк недоступен: НЕ считаем это разлогином — apiClient сам падает на
        // localStorage. Оставляем useApi как есть, работаем оффлайн из local.
        if (oauthBootstrap) {
            // Но при OAuth-landing профиля ещё нет и оффлайн его не даст — уводим на
            // лендинг, чтобы не застрять на пустой защищённой странице.
            try { sessionStorage.removeItem(OAUTH_FLAG); } catch (e) {}
            if (!read(PROFILE_KEY)) window.location.replace('index.html');
        }
    });

    function sessionExpired() {
        try { window.apiClient.setConfig({ useApi: false }); } catch (e) {}
        try { sessionStorage.removeItem(OAUTH_FLAG); } catch (e) {}
        // Есть локальный профиль (гость) → продолжаем как гость. Нет (чистый
        // OAuth-landing) → на лендинг.
        if (oauthBootstrap && !read(PROFILE_KEY)) {
            window.location.replace('index.html');
        }
    }

    // Экспорт промиса — страницы могут дождаться завершения синка перед чтением.
    window.__authSyncReady = probe;
})();
