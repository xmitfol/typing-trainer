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
        // Базовый URL backend. На Sprint 3+ переключается на prod.
        baseUrl: 'http://localhost:8000/api/v1',
        // Глобальный switch: false = всегда localStorage. true = пытаемся API
        // с fallback на localStorage при ошибке/offline.
        useApi: false,
        // Timeout для отдельных запросов (мс).
        timeout: 5000,
        // Включать ли verbose-логи в console (для дебага в dev).
        debug: false,
    };

    const CONFIG_KEY = 'typing_trainer_api_client_config';

    // localStorage ключи фронта (зеркало текущих имён из всех js-модулей).
    // Centralized чтобы при переименовании ключей менять в одном месте.
    const STORAGE_KEYS = {
        profile: 'typing_trainer_user_profile',
        progress: 'typing_trainer_lesson_progress',
        history: 'typing_trainer_test_history',
        certifications: 'typing_trainer_certifications',
        currentLesson: 'typing_trainer_current_lesson',
        userLessons: 'typing_trainer_user_lessons',
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

    // ─── HTTP wrapper ────────────────────────────────────────────────────
    /**
     * Низкоуровневый fetch с timeout + auth + структурированными ошибками.
     * Throws ApiError при не-2xx, NetworkError при сети.
     */
    async function _http(method, path, body) {
        const url = state.config.baseUrl.replace(/\/$/, '') + path;
        const headers = { 'Accept': 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;

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
                err.code = (data && data.code) || `http_${res.status}`;
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
                () => _http('GET', '/me/settings'),
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
                () => _http('PATCH', '/me/settings', patch),
                () => _local.patchProfile(patch),
                'updateSettings'
            );
        },

        // ── Progress (TSD §3.3 /me/progress) ─────────────────────────────
        async getProgress() {
            return _withFallback(
                () => _http('GET', '/me/progress'),
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

        // ── Auth (TSD §3.2) — все stubs для Sprint 1, в local mode no-op ─
        async signup(data) {
            if (!state.config.useApi) {
                // В local mode «signup» = просто save profile с onboardingCompleted=true
                return _local.setProfile({ ...data, onboardingCompleted: true });
            }
            return _http('POST', '/auth/signup', data);
        },
        async signin({ email, password }) {
            if (!state.config.useApi) {
                // Локально нет login — просто читаем профиль если он есть
                const p = _local.getProfile();
                if (!p) throw new Error('No local profile — нужна signup или migrate');
                return { user: p };
            }
            return _http('POST', '/auth/signin', { email, password });
        },
        async signout() {
            if (!state.config.useApi) {
                // В local mode — clear profile flag (но прогресс не трогаем)
                const p = _local.getProfile();
                if (p) { delete p.onboardingCompleted; _local.setProfile(p); }
                return true;
            }
            return _http('POST', '/auth/signout');
        },
        async refresh() {
            if (!state.config.useApi) return null;
            return _http('POST', '/auth/refresh');
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
