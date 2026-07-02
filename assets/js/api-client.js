/**
 * api-client.js — единый adapter между фронтом и backend API.
 *
 * Цель: подготовить фронт к Sprint 3 (Profile + Progress sync) без блокировки
 * на backend. Сейчас все методы работают через localStorage. Когда backend
 * появится и в config выставится useApi=true — методы начинают fetch'ить
 * с graceful fallback на localStorage если backend недоступен (offline mode).
 *
 * Контракт API endpoints — docs/spec/backend/02_TSD.md §3.
 *
 * Usage:
 *     await window.apiClient.init();             // подгрузить config из localStorage
 *     const profile = await apiClient.getProfile();
 *     await apiClient.saveAttempt({...});
 *
 * Тестирование с useApi=false (текущий режим):
 *     scripts/verify_api_client.py
 *
 * Wire в Sprint 3:
 *     - profile.js / dashboard.js / task.js → читать через apiClient вместо
 *       прямого localStorage.getItem
 *     - apiClient.setConfig({useApi: true, baseUrl: 'https://typing-trainer.ru/api/v1'})
 */

(function () {
    'use strict';

    // ─── Configuration ──────────────────────────────────────────────────
    const DEFAULT_CONFIG = {
        // Базовый URL backend. ОТНОСИТЕЛЬНЫЙ `/api/v1` → same-origin: работает
        // и за dev-прокси (nginx :8090, B1-003), и в prod (фронт+API на одном
        // домене). Cross-origin сломал бы SameSite=Lax auth-cookies. Для
        // отдельного backend-хоста — setConfig({baseUrl:'https://api.../api/v1'}).
        baseUrl: '/api/v1',
        // Глобальный switch: false = всегда localStorage. true = пытаемся API
        // с fallback на localStorage при ошибке/offline.
        useApi: false,
        // Timeout для отдельных запросов (мс).
        timeout: 5000,
        // Включать ли verbose-логи в console (для дебага в dev).
        debug: false,
    };

    const CONFIG_KEY = 'typing_trainer_api_client_config';
    // Ф3-2: устойчивый анонимный session_id (UUID v4). Генерится при первом
    // визите, живёт в localStorage — связывает pre→post signup события одной
    // аналитической сессии. НЕ auth-токен, НЕ PII: чисто для склейки воронки.
    const SESSION_ID_KEY = 'typing_trainer_session_id';

    // localStorage ключи фронта (зеркало текущих имён из всех js-модулей).
    // Centralized чтобы при переименовании ключей менять в одном месте.
    const STORAGE_KEYS = {
        profile: 'typing_trainer_user_profile',
        progress: 'typing_trainer_lesson_progress',
        history: 'typing_trainer_test_history',
        certifications: 'typing_trainer_certifications',
        currentLesson: 'typing_trainer_current_lesson',
        userLessons: 'typing_trainer_user_lessons',
        lessonExercises: 'typing_trainer_lesson_exercises',  // per-exercise гайдед-прогресс (локальный, Sprint 3+ зеркало)
    };

    const state = {
        config: { ...DEFAULT_CONFIG },
        accessToken: null,  // в памяти; cookie httpOnly предпочтительнее, но fallback для dev
    };

    // ─── Logging ─────────────────────────────────────────────────────────
    function log(...args) {
        if (state.config.debug) console.log('[api-client]', ...args);
    }
    function warn(...args) {
        if (state.config.debug) console.warn('[api-client]', ...args);
    }

    // ─── Storage helpers ─────────────────────────────────────────────────
    function readJSON(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function writeJSON(key, obj) {
        try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
        catch (e) { return false; }
    }

    // ─── Backend-контракт адаптеры (расхождения формы фронт↔сервер) ──────
    // Сервер /me/settings отдаёт snake_case, фронт исторически camelCase.
    const SETTINGS_S2C = {
        keyboard_type: 'keyboardType', keyboard_layout: 'keyboardLayout',
        finger_hint: 'fingerHint', key_sound: 'keySound', metronome: 'metronome',
        task_zoom: 'taskZoom', hide_indicator: 'hideIndicator',
        preview_off: 'previewOff', time_limit_minutes_per_day: 'timeLimitMinutesPerDay',
    };
    const SETTINGS_C2S = Object.fromEntries(
        Object.entries(SETTINGS_S2C).map(([s, c]) => [c, s])
    );
    function mapKeys(obj, dict) {
        if (!obj || typeof obj !== 'object') return obj;
        const out = {};
        for (const k of Object.keys(obj)) out[dict[k] || k] = obj[k];
        return out;
    }
    // Активный тир — из currentLesson (как во всех фронт-модулях).
    function _activeTier() {
        const cur = readJSON(STORAGE_KEYS.currentLesson) || {};
        return cur.tier || null;
    }
    // Сервер /me/progress группирует по тиру {tier:{lessonNum:{...}}}; фронт
    // (однотировый) ждёт плоско {lessonNum:{...}} для активного тира.
    function flattenProgress(byTier) {
        if (!byTier || typeof byTier !== 'object') return {};
        const tier = _activeTier();
        if (tier && byTier[tier]) return byTier[tier];
        const keys = Object.keys(byTier);
        if (keys.length === 1) return byTier[keys[0]];  // единственный тир
        return {};  // для активного тира прогресса ещё нет
    }

    // ─── Analytics session_id (Ф3-2) ────────────────────────────────────
    function uuidv4() {
        // crypto.randomUUID где есть; иначе getRandomValues; иначе Math.random.
        try {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                const b = new Uint8Array(16);
                crypto.getRandomValues(b);
                b[6] = (b[6] & 0x0f) | 0x40;  // version 4
                b[8] = (b[8] & 0x3f) | 0x80;  // variant 10
                const h = Array.from(b, x => x.toString(16).padStart(2, '0'));
                return h[0] + h[1] + h[2] + h[3] + '-' + h[4] + h[5] + '-' + h[6] + h[7] +
                    '-' + h[8] + h[9] + '-' + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
            }
        } catch (e) { /* fallthrough */ }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    function getSessionId() {
        let id = null;
        try { id = localStorage.getItem(SESSION_ID_KEY); } catch (e) { /* private mode */ }
        if (!id) {
            id = uuidv4();
            try { localStorage.setItem(SESSION_ID_KEY, id); } catch (e) { /* best-effort */ }
        }
        return id;
    }

    // ─── HTTP wrapper ────────────────────────────────────────────────────
    /**
     * Низкоуровневый fetch с timeout + auth + структурированными ошибками.
     * Throws ApiError при не-2xx, NetworkError при сети.
     */
    async function _http(method, path, body, extraHeaders) {
        const url = state.config.baseUrl.replace(/\/$/, '') + path;
        const headers = { 'Accept': 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;
        // Необязательные кастомные заголовки (напр. X-Admin-Reauth для refund).
        // Ставятся ПОСЛЕ базовых, но существующие вызовы шлют extraHeaders=undefined
        // → поведение не меняется.
        if (extraHeaders) {
            for (const k of Object.keys(extraHeaders)) {
                if (extraHeaders[k] != null) headers[k] = extraHeaders[k];
            }
        }

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), state.config.timeout);

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                credentials: 'include',  // httpOnly cookies (auth)
                signal: ctrl.signal,
            });
            clearTimeout(timer);
            const text = await res.text();
            const data = text ? safeParseJson(text) : null;
            if (!res.ok) {
                const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
                // Доменный код ошибки backend лежит в detail.code (FastAPI
                // HTTPException(detail={code,message})); реже — в data.code.
                // Иначе http_<status>. Так err.code сразу = 'REAUTH_REQUIRED'/
                // 'ADMIN_FORBIDDEN'/… без ручного копания в body у вызывающих.
                err.code = (data && (data.code || (data.detail && data.detail.code))) || `http_${res.status}`;
                err.status = res.status;
                err.body = data;
                throw err;
            }
            return data;
        } catch (e) {
            clearTimeout(timer);
            if (e.name === 'AbortError') {
                const err = new Error(`Timeout after ${state.config.timeout}ms`);
                err.code = 'timeout';
                throw err;
            }
            // network errors get a recognizable marker
            if (!e.status) e.code = e.code || 'network';
            throw e;
        }
    }
    function safeParseJson(s) {
        try { return JSON.parse(s); } catch (e) { return null; }
    }

    /**
     * Wrapper для public методов: пытается API, при ошибке падает на localStorage.
     * Если useApi=false — сразу idет в local.
     */
    async function _withFallback(apiCall, localCall, opName) {
        if (!state.config.useApi) return localCall();
        try {
            const result = await apiCall();
            log(`✓ API ${opName}`);
            return result;
        } catch (e) {
            warn(`✗ API ${opName} failed (${e.code || 'unknown'}), fallback to local`, e);
            return localCall();
        }
    }

    // ─── Local storage operations (fallback layer) ──────────────────────
    const _local = {
        getProfile() { return readJSON(STORAGE_KEYS.profile); },
        setProfile(profile) {
            writeJSON(STORAGE_KEYS.profile, profile);
            return profile;
        },
        patchProfile(patch) {
            const current = readJSON(STORAGE_KEYS.profile) || {};
            const merged = { ...current, ...patch };
            writeJSON(STORAGE_KEYS.profile, merged);
            return merged;
        },

        getProgress() { return readJSON(STORAGE_KEYS.progress) || {}; },
        setProgress(progress) {
            writeJSON(STORAGE_KEYS.progress, progress);
            return progress;
        },

        getHistory() { return readJSON(STORAGE_KEYS.history) || []; },
        appendHistory(entry) {
            const arr = readJSON(STORAGE_KEYS.history) || [];
            arr.push(entry);
            writeJSON(STORAGE_KEYS.history, arr);
            return entry;
        },

        getCertifications() { return readJSON(STORAGE_KEYS.certifications) || []; },

        getUserLessons() { return readJSON(STORAGE_KEYS.userLessons) || []; },
        setUserLessons(list) {
            writeJSON(STORAGE_KEYS.userLessons, list);
            return list;
        },
    };

    // ─── Public API ──────────────────────────────────────────────────────
    const apiClient = {
        // Direct access к storage keys и low-level helpers (для legacy code).
        STORAGE_KEYS,
        _local,
        _http,

        // ── Config & init ────────────────────────────────────────────────
        async init() {
            const stored = readJSON(CONFIG_KEY);
            if (stored) state.config = { ...DEFAULT_CONFIG, ...stored };
            log('initialized', state.config);
            return state.config;
        },
        getConfig() { return { ...state.config }; },
        setConfig(patch) {
            state.config = { ...state.config, ...patch };
            writeJSON(CONFIG_KEY, state.config);
            log('config updated', state.config);
            return state.config;
        },
        setAccessToken(token) { state.accessToken = token; },

        // ── Analytics events (Ф3-2) ──────────────────────────────────────
        // session_id — анонимный склеивающий id (см. SESSION_ID_KEY выше).
        getSessionId() { return getSessionId(); },
        /**
         * POST /events/batch — публичный (current_user_optional), best-effort.
         * events: [{type, payload}]. session_id проставляется автоматически.
         * Fail-safe: ошибки/оффлайн/useApi=false ГЛОТАЕМ — аналитика не должна
         * ломать UX. Возвращает всегда resolved Promise ({ok:bool}).
         */
        async emitEvents(events) {
            const list = (Array.isArray(events) ? events : [events]).filter(Boolean);
            if (!list.length) return { ok: false, reason: 'empty' };
            // Без backend событий некуда слать — тихо пропускаем.
            if (!state.config.useApi) return { ok: false, reason: 'local-mode' };
            try {
                await _http('POST', '/events/batch', {
                    session_id: getSessionId(),
                    events: list.map(e => ({ type: e.type, payload: e.payload || {} })),
                });
                return { ok: true };
            } catch (e) {
                warn('emitEvents failed (swallowed)', e && e.code);
                return { ok: false, reason: (e && e.code) || 'error' };
            }
        },
        /** Удобный шорткат для одного события. */
        async emitEvent(type, payload) {
            return this.emitEvents([{ type: type, payload: payload || {} }]);
        },

        // ── Profile (TSD §3.3 /me) ───────────────────────────────────────
        async getProfile() {
            return _withFallback(
                () => _http('GET', '/me'),
                () => _local.getProfile(),
                'getProfile'
            );
        },
        async updateProfile(patch) {
            return _withFallback(
                () => _http('PATCH', '/me', patch),
                () => _local.patchProfile(patch),
                'updateProfile'
            );
        },

        // ── Settings (TSD §3.3 /me/settings) ─────────────────────────────
        // Settings хранятся внутри profile в localStorage. На backend — отдельная
        // таблица user_settings. В localStorage режиме просто patch'им profile.
        async getSettings() {
            return _withFallback(
                async () => mapKeys(await _http('GET', '/me/settings'), SETTINGS_S2C),
                () => {
                    const p = _local.getProfile() || {};
                    return {
                        keyboardType: p.keyboardType || 'classic',
                        keyboardLayout: p.keyboardLayout || 'standard',
                        fingerHint: p.fingerHint !== false,
                        keySound: p.keySound === true,
                        metronome: p.metronome === true,
                        taskZoom: Number.isFinite(p.taskZoom) ? p.taskZoom : 100,
                        hideIndicator: p.hideIndicator === true,
                        previewOff: p.previewOff === true,
                    };
                },
                'getSettings'
            );
        },
        async updateSettings(patch) {
            return _withFallback(
                async () => mapKeys(
                    await _http('PATCH', '/me/settings', mapKeys(patch, SETTINGS_C2S)),
                    SETTINGS_S2C
                ),
                () => _local.patchProfile(patch),
                'updateSettings'
            );
        },

        // ── Progress (TSD §3.3 /me/progress) ─────────────────────────────
        async getProgress() {
            return _withFallback(
                async () => flattenProgress(await _http('GET', '/me/progress')),
                () => _local.getProgress(),
                'getProgress'
            );
        },
        /**
         * Сохранить попытку — атомарно: progress + attempt + achievements check.
         * Возвращает {progress, newly_earned, next_unlocked} (по TSD §3.7).
         * В localStorage режиме — просто update прогресса + append history.
         */
        async saveAttempt({ tier, lesson_num, wpm, accuracy, duration_ms, errors, rhythm, completed_at }) {
            return _withFallback(
                () => _http('POST', '/me/progress', {
                    tier, lesson_num, wpm, accuracy, duration_ms, errors, rhythm,
                    completed_at: completed_at || new Date().toISOString(),
                }),
                () => {
                    // Локальная семантика mirroring backend поведения
                    const progress = _local.getProgress();
                    const prev = progress[String(lesson_num)] || {};
                    const stars = errors === 0 ? 5 : errors <= 2 ? 4 : errors <= 5 ? 3 : errors <= 10 ? 2 : 1;
                    const newProg = {
                        stars: Math.max(stars, prev.stars || 0),
                        bestWPM: Math.min(1500, Math.max(wpm, prev.bestWPM || 0)),
                        bestAccuracy: Math.max(accuracy, prev.bestAccuracy || 0),
                        bestTime: prev.bestTime ? Math.min((duration_ms / 1000), prev.bestTime) : (duration_ms / 1000),
                        completedAt: completed_at || new Date().toISOString(),
                    };
                    progress[String(lesson_num)] = newProg;
                    _local.setProgress(progress);
                    _local.appendHistory({
                        lesson: lesson_num,
                        completedAt: completed_at || new Date().toISOString(),
                        duration: duration_ms / 1000,
                        wpm,
                        accuracy,
                    });
                    return {
                        progress: { tier, lesson_num, ...newProg },
                        newly_earned: [],  // ачивки в локальном режиме считаются в achievements.js
                        next_unlocked: null,
                    };
                },
                'saveAttempt'
            );
        },

        // ── History (TSD §3.3 /me/history) ───────────────────────────────
        async getHistory({ cursor = null, limit = 50 } = {}) {
            return _withFallback(
                () => {
                    const params = new URLSearchParams();
                    if (cursor) params.set('cursor', cursor);
                    params.set('limit', String(limit));
                    return _http('GET', `/me/history?${params.toString()}`);
                },
                () => {
                    const all = _local.getHistory();
                    // Простой cursor = offset как индекс. В backend — opaque.
                    const start = cursor ? parseInt(cursor, 10) : 0;
                    const slice = all.slice(start, start + limit);
                    const nextCursor = (start + limit < all.length) ? String(start + limit) : null;
                    return { items: slice, next_cursor: nextCursor, total: all.length };
                },
                'getHistory'
            );
        },

        // ── Achievements (TSD §3.3 /me/achievements) ─────────────────────
        async getAchievements() {
            return _withFallback(
                () => _http('GET', '/me/achievements'),
                () => {
                    // В local mode ачивки считаются клиентским achievements.js.
                    // Возвращаем пустой массив — caller знает, что local-mode
                    // и сам пересчитает через window.achievements.
                    return [];
                },
                'getAchievements'
            );
        },

        // ── Lessons (TSD §3.4 /lessons) ──────────────────────────────────
        async getLesson(tier, n) {
            return _withFallback(
                () => _http('GET', `/lessons/${encodeURIComponent(tier)}/${n}`),
                () => {
                    // Local fallback: тот же fetch, что и в lesson-loader.js.
                    return fetch(`data/lessons/${encodeURIComponent(tier)}/lesson_${String(n).padStart(2, '0')}.json`)
                        .then(r => r.ok ? r.json() : null);
                },
                'getLesson'
            );
        },
        async getLessonsList(tier) {
            return _withFallback(
                () => _http('GET', `/lessons/${encodeURIComponent(tier)}`),
                () => {
                    // В local mode нет одного endpoint'а — формируем из Settings.
                    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
                    const total = counts[tier] || 99;
                    const list = [];
                    for (let i = 1; i <= total; i++) list.push({ tier, lesson_number: i });
                    return list;
                },
                'getLessonsList'
            );
        },
        async checkLessonAccess(tier, n) {
            return _withFallback(
                () => _http('GET', `/lessons/${encodeURIComponent(tier)}/${n}/access`),
                () => {
                    // Local: paywall check вручную (FREE_LESSON_LIMIT=5)
                    const FREE_LIMIT = 5;
                    return { allowed: n <= FREE_LIMIT, reason: n > FREE_LIMIT ? 'paywall' : null };
                },
                'checkLessonAccess'
            );
        },

        // ── Auth (TSD §3.2 / openapi.yaml) — backend-only, всегда через API ──
        // Auth по своей природе серверный (cookies httpOnly, капча, токены),
        // localStorage-fallback здесь неприменим. Методы всегда бьют в backend.

        /** GET /auth/challenge — PoW-challenge (ADR-006) для signup/forgot. */
        async getChallenge() {
            return _http('GET', '/auth/challenge');
        },
        /**
         * POST /auth/signup. `data` = {email,password,name,audience,character,
         * gender?,language, captcha_challenge,captcha_signature,captcha_nonce,
         * nickname2}. При успехе backend ставит httpOnly cookies, возвращает
         * публичную проекцию user.
         */
        async signup(data) {
            return _http('POST', '/auth/signup', data);
        },
        /** POST /auth/signin. captcha_* — только если 403 CAPTCHA_REQUIRED. */
        async signin({ email, password, captcha_challenge, captcha_signature, captcha_nonce } = {}) {
            const body = { email, password };
            if (captcha_challenge) {
                body.captcha_challenge = captcha_challenge;
                body.captcha_signature = captcha_signature;
                body.captcha_nonce = captcha_nonce;
            }
            return _http('POST', '/auth/signin', body);
        },
        async signout() {
            return _http('POST', '/auth/signout');
        },
        async refresh() {
            return _http('POST', '/auth/refresh');
        },
        /** POST /auth/verify-email {token}. 204 при успехе. */
        async verifyEmail(token) {
            return _http('POST', '/auth/verify-email', { token });
        },
        /** POST /auth/forgot — email + captcha. Всегда 202. */
        async forgotPassword(data) {
            return _http('POST', '/auth/forgot', data);
        },
        /** POST /auth/reset {token,password}. 204 при успехе. */
        async resetPassword({ token, password }) {
            return _http('POST', '/auth/reset', { token, password });
        },
        async migrateGuest(guestData) {
            if (!state.config.useApi) {
                // В local mode миграция бессмысленна — данные уже local
                return { migrated: false, reason: 'local-only mode' };
            }
            return _http('POST', '/auth/migrate-guest', { guest_data: guestData });
        },
        async getCurrentUser() {
            if (!state.config.useApi) return _local.getProfile();
            try { return await _http('GET', '/me'); }
            catch (e) {
                if (e.status === 401) return null;
                throw e;
            }
        },

        // ── Billing (ADR-008 / openapi.yaml) — backend-only ──────────────
        // Биллинг серверный по природе (провайдер, webhook, подписка в БД):
        // localStorage-fallback неприменим. Методы всегда бьют в backend.
        // Провайдер выбирается конфигом бэка (stub/yookassa) — фронт не знает.

        /** GET /billing/plans — каталог тарифов + цены (публично). */
        async getPlans() {
            return _http('GET', '/billing/plans');
        },
        /**
         * POST /billing/checkout {plan, period, return_url?} — создаёт pending-
         * подписку + checkout у провайдера. Возвращает {subscription_id,
         * confirmation_url, amount_kopecks, provider}. Юзера редиректим на
         * confirmation_url. Требует auth-cookie.
         */
        async createCheckout({ plan, period, return_url } = {}) {
            return _http('POST', '/billing/checkout', { plan, period, return_url });
        },
        /** GET /billing/subscription — {has_active, subscription|null}. Требует auth. */
        async getSubscription() {
            return _http('GET', '/billing/subscription');
        },
        /** POST /billing/subscription/cancel — отмена до end-of-period. Требует auth. */
        async cancelSubscription() {
            return _http('POST', '/billing/subscription/cancel');
        },

        // ── Admin (/admin/*) — backend-only, RBAC на сервере ─────────────
        // Админка бессмысленна оффлайн: без localStorage-fallback, всегда бьёт
        // в backend. Ошибки пробрасываются с .code/.status (как auth/billing).
        // credentials:'include' — та же auth-cookie, что у юзеров; роль решает
        // доступ на сервере (403 ADMIN_FORBIDDEN / REAUTH_REQUIRED).

        /** POST /admin/reauth {password} → {reauth_token, ttl_seconds}. */
        async adminReauth(password) {
            return _http('POST', '/admin/reauth', { password });
        },
        /** GET /admin/overview?period=7|30|90 → метрики дашборда. */
        async adminOverview(period) {
            const p = [7, 30, 90].indexOf(Number(period)) !== -1 ? Number(period) : 30;
            return _http('GET', `/admin/overview?period=${p}`);
        },
        // ── Admin analytics (/admin/analytics/*) — RequireAnalyst (Ф3) ───
        // Период 7|30|90 (клампится); tier опционален (skill/lessons). Пустые
        // фильтры не шлём. Ответы могут содержать null-поля → рендер к «—».
        _analyticsPeriod(period) {
            return [7, 30, 90].indexOf(Number(period)) !== -1 ? Number(period) : 30;
        },
        /** GET /admin/analytics/skill?tier=&period= → гистограммы WPM/accuracy + средние. */
        async adminAnalyticsSkill(period, tier) {
            const params = new URLSearchParams();
            params.set('period', String(this._analyticsPeriod(period)));
            if (tier) params.set('tier', String(tier));
            return _http('GET', `/admin/analytics/skill?${params.toString()}`);
        },
        /** GET /admin/analytics/revenue?period= → MRR/подписки/decline/series. */
        async adminAnalyticsRevenue(period) {
            return _http('GET', `/admin/analytics/revenue?period=${this._analyticsPeriod(period)}`);
        },
        /** GET /admin/analytics/funnel?period= → signups→activated→subscribed→churned + rates. */
        async adminAnalyticsFunnel(period) {
            return _http('GET', `/admin/analytics/funnel?period=${this._analyticsPeriod(period)}`);
        },
        /** GET /admin/analytics/retention?period= → {d1,d7,d30}. */
        async adminAnalyticsRetention(period) {
            return _http('GET', `/admin/analytics/retention?period=${this._analyticsPeriod(period)}`);
        },
        /** GET /admin/analytics/lessons?tier= → [{lesson_num, reached, completed, dropoff_rate}]. */
        async adminAnalyticsLessons(tier) {
            const params = new URLSearchParams();
            if (tier) params.set('tier', String(tier));
            const qs = params.toString();
            return _http('GET', `/admin/analytics/lessons${qs ? '?' + qs : ''}`);
        },

        /**
         * GET /admin/users — список/поиск/фильтр (пагинация).
         * filters: {search, audience, email_verified, has_subscription, deleted,
         *           page, page_size}. Пустые/undefined значения не шлём.
         */
        async adminListUsers(filters = {}) {
            const params = new URLSearchParams();
            const allow = ['search', 'audience', 'email_verified', 'has_subscription', 'deleted', 'page', 'page_size'];
            for (const k of allow) {
                const v = filters[k];
                if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
            }
            const qs = params.toString();
            return _http('GET', `/admin/users${qs ? '?' + qs : ''}`);
        },
        /** GET /admin/users/{id} → карточка (профиль+подписки+прогресс+family+oauth). */
        async adminGetUser(id) {
            return _http('GET', `/admin/users/${encodeURIComponent(id)}`);
        },
        /**
         * POST /admin/users/{id}/{action} — block | restore | verify-email | reset-password.
         * → {user_id, action}.
         */
        async adminUserAction(id, action) {
            const allowed = ['block', 'restore', 'verify-email', 'reset-password'];
            if (allowed.indexOf(action) === -1) {
                const err = new Error(`unknown admin user action: ${action}`);
                err.code = 'bad_action';
                throw err;
            }
            return _http('POST', `/admin/users/${encodeURIComponent(id)}/${action}`);
        },
        /**
         * GET /admin/subscriptions — список подписок с фильтрами (пагинация).
         * filters: {status, plan, provider, period, page, page_size}.
         */
        async adminListSubscriptions(filters = {}) {
            const params = new URLSearchParams();
            const allow = ['status', 'plan', 'provider', 'period', 'page', 'page_size'];
            for (const k of allow) {
                const v = filters[k];
                if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
            }
            const qs = params.toString();
            return _http('GET', `/admin/subscriptions${qs ? '?' + qs : ''}`);
        },
        /** GET /admin/subscriptions/{id} → {subscription, charges:[...]}. */
        async adminGetSubscription(id) {
            return _http('GET', `/admin/subscriptions/${encodeURIComponent(id)}`);
        },
        /** POST /admin/subscriptions/grant {user_id, plan, period, reason}. */
        async adminGrant({ user_id, plan, period, reason } = {}) {
            return _http('POST', '/admin/subscriptions/grant', { user_id, plan, period, reason });
        },
        /** POST /admin/subscriptions/{id}/cancel → {subscription_id, action}. */
        async adminCancelSub(id) {
            return _http('POST', `/admin/subscriptions/${encodeURIComponent(id)}/cancel`);
        },
        /**
         * POST /admin/subscriptions/{id}/refund {amount_kopecks?, reason}
         * + заголовок X-Admin-Reauth:<token>. Только superadmin.
         * Ошибки: 403 ADMIN_FORBIDDEN (не superadmin), 403 REAUTH_REQUIRED
         * (нет/протух reauth-токен → caller повторяет adminReauth).
         */
        async adminRefund(id, { amount_kopecks, reason } = {}, reauthToken) {
            const body = { reason };
            if (amount_kopecks !== undefined && amount_kopecks !== null && amount_kopecks !== '') {
                body.amount_kopecks = Number(amount_kopecks);
            }
            return _http('POST', `/admin/subscriptions/${encodeURIComponent(id)}/refund`, body,
                reauthToken ? { 'X-Admin-Reauth': reauthToken } : undefined);
        },

        // ── Health check (для verify) ────────────────────────────────────
        async health() {
            if (!state.config.useApi) {
                return { status: 'ok', mode: 'local-fallback', backend: 'unreachable-by-design' };
            }
            return _http('GET', '/health');
        },
    };

    // Экспорт
    window.apiClient = apiClient;
})();
