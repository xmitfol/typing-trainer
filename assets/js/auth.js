/**
 * auth.js — контроллер страницы auth.html (S1.9).
 *
 * Wire к backend auth API (8 endpoints, openapi.yaml) через apiClient.
 * Капча ADR-006: PoW решается в Web Worker (assets/js/pow-worker.js),
 * honeypot — скрытое поле nickname2. После успеха — мост в localStorage
 * (профиль), чтобы router-guard пустил в dashboard (полный sync — Sprint 3).
 */

(function () {
    'use strict';

    var PROFILE_KEY = 'typing_trainer_user_profile';

    // ─── DOM helpers ────────────────────────────────────────────────────
    function $(sel, root) { return (root || document).querySelector(sel); }
    function views() { return document.querySelectorAll('.auth-view'); }

    function showView(name) {
        views().forEach(function (v) {
            v.hidden = (v.getAttribute('data-view') !== name);
        });
        hideBanner();
    }

    var bannerEl = $('#authBanner');
    function banner(kind, text) {
        bannerEl.textContent = text;
        bannerEl.setAttribute('data-kind', kind);
        bannerEl.hidden = false;
    }
    function hideBanner() { bannerEl.hidden = true; }

    function busy(btn, on, busyText) {
        if (!btn) return;
        btn.disabled = on;
        var label = btn.querySelector('[data-label]');
        if (label) {
            if (on) { label.dataset.prev = label.textContent; label.textContent = busyText || 'Подождите…'; }
            else if (label.dataset.prev) { label.textContent = label.dataset.prev; }
        }
    }

    // ─── Error extraction (backend → {code,message}) ────────────────────
    function errInfo(err) {
        var d = err && err.body && err.body.detail;
        if (d && typeof d === 'object' && !Array.isArray(d)) return { code: d.code, message: d.message };
        if (Array.isArray(d)) return { code: 'VALIDATION_ERROR', message: 'Проверьте правильность полей.' };
        return { code: (err && err.code) || 'error', message: (err && err.message) || 'Ошибка сети' };
    }

    // ─── base64url → JSON (вытащить salt из challenge) ──────────────────
    function decodeChallenge(b64url) {
        var b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        return JSON.parse(atob(b64));
    }

    // ─── PoW solve в Web Worker ─────────────────────────────────────────
    // Возвращает {captcha_challenge, captcha_signature, captcha_nonce}.
    function solveCaptcha() {
        return window.apiClient.getChallenge().then(function (ch) {
            var salt = decodeChallenge(ch.challenge).salt;
            return new Promise(function (resolve, reject) {
                var worker;
                try { worker = new Worker('assets/js/pow-worker.js'); }
                catch (e) { reject(new Error('PoW worker unavailable')); return; }
                worker.onmessage = function (e) {
                    if (e.data && e.data.type === 'solved') {
                        worker.terminate();
                        resolve({
                            captcha_challenge: ch.challenge,
                            captcha_signature: ch.signature,
                            captcha_nonce: e.data.nonce,
                        });
                    }
                };
                worker.onerror = function (err) { worker.terminate(); reject(err); };
                worker.postMessage({ salt: salt, difficulty: ch.difficulty });
            });
        });
    }

    // ─── Профиль-мост: backend user → localStorage (для router-guard) ───
    function bridgeProfile(user) {
        var profile = {
            name: user.name,
            email: user.email,
            audience: user.audience,
            character: user.character,
            mentor: user.character,          // legacy-поле приложения
            gender: user.gender || 'm',
            language: user.language || 'ru',
            onboardingCompleted: true,
        };
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
    }

    function goDashboard() { window.location.href = 'dashboard.html'; }

    function formData(form) {
        var fd = new FormData(form);
        var obj = {};
        fd.forEach(function (v, k) { obj[k] = v; });
        return obj;
    }

    // ─── Handlers ───────────────────────────────────────────────────────
    function onSignup(e) {
        e.preventDefault();
        var form = e.target;
        var btn = $('[data-action="signup-submit"]', form);
        var data = formData(form);
        hideBanner();
        busy(btn, true, 'Проверка…');
        solveCaptcha().then(function (captcha) {
            Object.assign(data, captcha);
            data.language = data.language || 'ru';
            return window.apiClient.signup(data);
        }).then(function (user) {
            bridgeProfile(user);
            goDashboard();
        }).catch(function (err) {
            busy(btn, false);
            var info = errInfo(err);
            if (info.code === 'EMAIL_TAKEN') banner('error', 'Этот email уже зарегистрирован.');
            else banner('error', info.message || 'Не удалось создать аккаунт.');
        });
    }

    function onSignin(e) {
        e.preventDefault();
        var form = e.target;
        var btn = $('[data-action="signin-submit"]', form);
        var data = formData(form);
        hideBanner();
        busy(btn, true, 'Вход…');

        function attempt(extra) {
            var payload = Object.assign({ email: data.email, password: data.password }, extra || {});
            return window.apiClient.signin(payload);
        }

        attempt().then(function (user) {
            bridgeProfile(user); goDashboard();
        }).catch(function (err) {
            var info = errInfo(err);
            // Сервер требует капчу (после серии неудач) — решаем PoW и повторяем
            if (info.code === 'CAPTCHA_REQUIRED') {
                banner('info', 'Подтвердите, что вы не робот…');
                solveCaptcha().then(function (captcha) {
                    return attempt(captcha);
                }).then(function (user) {
                    bridgeProfile(user); goDashboard();
                }).catch(function (err2) {
                    busy(btn, false);
                    banner('error', errInfo(err2).message || 'Не удалось войти.');
                });
                return;
            }
            busy(btn, false);
            if (info.code === 'INVALID_CREDENTIALS') banner('error', 'Неверный email или пароль.');
            else banner('error', info.message || 'Не удалось войти.');
        });
    }

    function onForgot(e) {
        e.preventDefault();
        var form = e.target;
        var btn = $('[data-action="forgot-submit"]', form);
        var data = formData(form);
        hideBanner();
        busy(btn, true, 'Отправка…');
        solveCaptcha().then(function (captcha) {
            Object.assign(data, captcha);
            return window.apiClient.forgotPassword(data);
        }).then(function () {
            showView('message');
            $('[data-msg-title]').textContent = 'Проверьте почту';
            $('[data-msg-text]').textContent = 'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.';
        }).catch(function (err) {
            busy(btn, false);
            banner('error', errInfo(err).message || 'Не удалось отправить ссылку.');
        });
    }

    function onReset(token, e) {
        e.preventDefault();
        var form = e.target;
        var btn = $('[data-action="reset-submit"]', form);
        var data = formData(form);
        hideBanner();
        busy(btn, true, 'Сохранение…');
        window.apiClient.resetPassword({ token: token, password: data.password }).then(function () {
            showView('message');
            $('[data-msg-title]').textContent = 'Пароль изменён';
            $('[data-msg-text]').textContent = 'Теперь войдите с новым паролем.';
        }).catch(function (err) {
            busy(btn, false);
            var info = errInfo(err);
            if (info.code === 'TOKEN_INVALID') banner('error', 'Ссылка недействительна или истекла. Запросите сброс заново.');
            else banner('error', info.message || 'Не удалось сменить пароль.');
        });
    }

    function handleVerify(token) {
        showView('message');
        $('[data-msg-title]').textContent = 'Подтверждение email…';
        $('[data-msg-text]').textContent = '';
        window.apiClient.verifyEmail(token).then(function () {
            $('[data-msg-title]').textContent = 'Email подтверждён ✓';
            $('[data-msg-text]').textContent = 'Спасибо! Теперь можно войти.';
        }).catch(function (err) {
            var info = errInfo(err);
            $('[data-msg-title]').textContent = 'Ссылка недействительна';
            $('[data-msg-text]').textContent = (info.code === 'TOKEN_INVALID')
                ? 'Ссылка устарела или уже использована.'
                : (info.message || 'Не удалось подтвердить email.');
        });
    }

    // ─── Init ───────────────────────────────────────────────────────────
    function init() {
        // baseUrl из глобального конфига приложения (если задан)
        window.apiClient.init().then(function () {
            try {
                var base = window.Settings && window.Settings.get('api.baseUrl', null);
                if (base) window.apiClient.setConfig({ baseUrl: String(base).replace(/\/$/, '') });
            } catch (e) { /* ignore */ }
        });

        // Навигация по data-go
        document.addEventListener('click', function (e) {
            var link = e.target.closest('[data-go]');
            if (link) { e.preventDefault(); showView(link.getAttribute('data-go')); }
        });

        // Формы
        var signin = $('#signinForm'); if (signin) signin.addEventListener('submit', onSignin);
        var signup = $('#signupForm'); if (signup) signup.addEventListener('submit', onSignup);
        var forgot = $('#forgotForm'); if (forgot) forgot.addEventListener('submit', onForgot);

        // Роутинг по query: action=verify|reset|signup|forgot|signin (+token)
        var params = new URLSearchParams(window.location.search);
        var action = params.get('action');
        var token = params.get('token');

        if (action === 'verify' && token) { handleVerify(token); return; }
        if (action === 'reset' && token) {
            showView('reset');
            $('#resetForm').addEventListener('submit', function (e) { onReset(token, e); });
            return;
        }
        if (action === 'signup') { showView('signup'); return; }
        if (action === 'forgot') { showView('forgot'); return; }
        showView('signin');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
