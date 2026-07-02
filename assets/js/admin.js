/**
 * admin.js — контроллер внутренней админ-панели (ru-only).
 *
 * Single-page с табами: Обзор / Пользователи / Платежи.
 *
 * Гейт ПО РОЛИ (клиентский, UX-only — настоящая защита на сервере 403):
 *   - apiClient.init() → useApi=true (админка работает только через backend).
 *   - GET /me → ProfileOut.role ∈ {user, analyst, support, superadmin}.
 *   - role отсутствует / 'user' / нет сессии (401) → redirect на ../dashboard.html
 *     (не-админа уводим прочь; бесконечного редиректа нет — dashboard/лендинг сам
 *     решает, а router-guard не трогает /admin/*).
 *   - Вкладки/действия скрываются по роли:
 *       analyst    → только Обзор
 *       support    → Обзор + Пользователи + Платежи (кроме refund)
 *       superadmin → всё, включая refund
 *
 * Re-auth flow (refund, superadmin):
 *   модалка reason/amount → запрос пароля → adminReauth(password) → reauth_token
 *   → adminRefund(id, {amount,reason}, token) с заголовком X-Admin-Reauth.
 *   При 403 REAUTH_REQUIRED (токен протух/отсутствует) — повторяем reauth.
 */
(function () {
    'use strict';

    var ROLE_RANK = { user: 0, analyst: 1, support: 2, superadmin: 3 };
    var api = window.apiClient;
    var state = { me: null, role: 'user', reauthToken: null };

    // ─── DOM helpers ─────────────────────────────────────────────────────
    function $(id) { return document.getElementById(id); }
    function el(tag, attrs, children) {
        var e = document.createElement(tag);
        if (attrs) for (var k in attrs) {
            if (k === 'class') e.className = attrs[k];
            else if (k === 'text') e.textContent = attrs[k];
            else if (k === 'html') e.innerHTML = attrs[k];
            else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
            else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
        }
        if (children) (Array.isArray(children) ? children : [children]).forEach(function (c) {
            if (c == null) return;
            e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return e;
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
    function esc(s) { return s == null ? '' : String(s); }

    function hasRole(min) { return ROLE_RANK[state.role] >= (ROLE_RANK[min] || 0); }

    // ─── Formatting ──────────────────────────────────────────────────────
    function rub(kopecks) {
        if (kopecks == null) return '—';
        var r = kopecks / 100;
        return r.toLocaleString('ru-RU', { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₽';
    }
    function pct(v) { return v == null ? '—' : (Number(v) * 100).toFixed(1).replace(/\.0$/, '') + '%'; }
    function dt(s) {
        if (!s) return '—';
        var d = new Date(s);
        return isNaN(d) ? esc(s) : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function date(s) {
        if (!s) return '—';
        var d = new Date(s);
        return isNaN(d) ? esc(s) : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Понятная расшифровка ошибок API.
    function errMsg(e) {
        var code = e && e.code, status = e && e.status;
        var bodyMsg = e && e.body && (e.body.message || (e.body.detail && (e.body.detail.message || e.body.detail)));
        if (code === 'ADMIN_FORBIDDEN' || (status === 403 && code !== 'REAUTH_REQUIRED')) return 'Недостаточно прав для этой операции.';
        if (code === 'REAUTH_REQUIRED') return 'Требуется повторный ввод пароля.';
        if (status === 401) return 'Сессия истекла. Войдите заново.';
        if (status === 404) return 'Не найдено.';
        if (status === 429) return 'Слишком много запросов. Подождите немного.';
        if (code === 'timeout') return 'Превышено время ожидания сервера.';
        if (code === 'network' || !status) return 'Нет связи с сервером.';
        return (typeof bodyMsg === 'string' && bodyMsg) || ('Ошибка (' + (status || code || '?') + ')');
    }

    // ─── Toast ───────────────────────────────────────────────────────────
    function toast(msg, kind) {
        var wrap = $('adToasts');
        var t = el('div', { class: 'ad-toast ' + (kind ? 'ad-toast--' + kind : ''), text: msg });
        wrap.appendChild(t);
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 3500);
    }

    // ─── Modal ───────────────────────────────────────────────────────────
    // fields: [{name,label,type,options?,value?,placeholder?}]
    // onSubmit(values, ctx) — ctx.setError(msg), ctx.close(), ctx.setBusy(bool)
    function modal(opts) {
        var root = $('adModalRoot');
        var errBox = el('div', { class: 'ad-modal__err' });
        var inputs = {};
        var fieldNodes = (opts.fields || []).map(function (f) {
            var input;
            if (f.type === 'select') {
                input = el('select', { class: 'ad-select' },
                    (f.options || []).map(function (o) { return el('option', { value: o.value, text: o.label }); }));
                if (f.value != null) input.value = f.value;
            } else {
                input = el('input', { class: 'ad-input', type: f.type || 'text', placeholder: f.placeholder || '', value: f.value != null ? f.value : '' });
            }
            inputs[f.name] = input;
            return el('div', { class: 'ad-field' }, [el('label', { text: f.label }), input]);
        });

        var backdrop = el('div', { class: 'ad-modal-backdrop' });
        function close() { backdrop.remove(); }
        backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) close(); });

        var submitBtn = el('button', { class: 'ad-btn ' + (opts.danger ? 'ad-btn--danger' : 'ad-btn--primary'), text: opts.submitLabel || 'ОК' });
        var cancelBtn = el('button', { class: 'ad-btn', text: 'Отмена', onclick: close });
        var ctx = {
            setError: function (m) { errBox.textContent = m || ''; },
            close: close,
            setBusy: function (b) { submitBtn.disabled = b; cancelBtn.disabled = b; submitBtn.textContent = b ? '…' : (opts.submitLabel || 'ОК'); },
        };
        submitBtn.addEventListener('click', function () {
            var values = {};
            for (var k in inputs) values[k] = inputs[k].value;
            opts.onSubmit(values, ctx);
        });

        var box = el('div', { class: 'ad-modal' }, [
            el('h3', { text: opts.title }),
            opts.desc ? el('p', { text: opts.desc }) : null,
        ].concat(fieldNodes).concat([
            errBox,
            el('div', { class: 'ad-modal__foot' }, [cancelBtn, submitBtn]),
        ]));
        backdrop.appendChild(box);
        root.appendChild(backdrop);
        var first = box.querySelector('input, select');
        if (first) first.focus();
        return ctx;
    }

    function confirmModal(title, desc, onYes, danger) {
        modal({
            title: title, desc: desc, danger: danger, fields: [], submitLabel: 'Подтвердить',
            onSubmit: function (_v, ctx) { ctx.close(); onYes(); },
        });
    }

    // ─── Role gate ───────────────────────────────────────────────────────
    function bootstrap() {
        api.init();
        // Админка живёт только на backend — форсируем useApi (иначе apiClient
        // ушёл бы в localStorage-режим, где admin-методы бессмысленны). Флаг
        // оптимистичный и общий с основным приложением — включение безвредно:
        // если сессии нет, /me вернёт 401 → уводим на dashboard.
        if (!api.getConfig().useApi) api.setConfig({ useApi: true });

        // Прямой GET /me через _http (не getProfile — он на ошибке падает в
        // localStorage-профиль без role, что маскировало бы 401/сеть и могло бы
        // ложно увести админа). Так 401 (нет сессии) отделяем от сетевой ошибки.
        api._http('GET', '/me').then(function (me) {
            var role = (me && me.role) || 'user';
            if (!me || ROLE_RANK[role] == null || role === 'user') {
                // Не-админ или неизвестная роль → на dashboard (там гость/юзер как обычно).
                leave('Доступ только для сотрудников.');
                return;
            }
            state.me = me; state.role = role;
            renderShell();
        }).catch(function (e) {
            if (e && e.status === 401) { leave('Нужно войти в аккаунт сотрудника.'); return; }
            // Сеть/сервер недоступен — админка без backend бессмысленна.
            $('adGateMsg').textContent = errMsg(e) + ' Обновите страницу.';
        });
    }

    function leave(msg) {
        $('adGateMsg').textContent = (msg || '') + ' Переходим…';
        setTimeout(function () { window.location.replace('../dashboard.html'); }, 800);
    }

    // ─── Shell (после гейта) ──────────────────────────────────────────────
    var activeTab = 'overview';
    function renderShell() {
        $('adGate').hidden = true;
        $('adApp').hidden = false;
        $('adWhoEmail').textContent = state.me.email || '—';
        var chip = $('adWhoRole');
        chip.textContent = state.role;
        chip.setAttribute('data-role', state.role);

        // Скрыть вкладки по роли.
        var tabs = document.querySelectorAll('#adTabs .ad-tab');
        tabs.forEach(function (t) {
            var min = t.getAttribute('data-min-role');
            t.hidden = min ? !hasRole(min) : false;
            t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
        });

        $('adLogout').addEventListener('click', function () {
            api.signout().catch(function () {}).then(function () { window.location.replace('../index.html'); });
        });

        // Стартовая вкладка: analyst стартует с Обзора (единственная доступная).
        switchTab('overview');
        wireOverview();
        wireAnalytics();
        wireUsers();
        wireBilling();
    }

    function switchTab(tab) {
        // analyst не имеет доступа к users/billing — игнор.
        var minByTab = { overview: 'analyst', analytics: 'analyst', users: 'support', billing: 'support' };
        if (!hasRole(minByTab[tab] || 'analyst')) return;
        activeTab = tab;
        document.querySelectorAll('#adTabs .ad-tab').forEach(function (t) {
            t.classList.toggle('ad-tab--active', t.getAttribute('data-tab') === tab);
        });
        document.querySelectorAll('.ad-panel').forEach(function (p) {
            p.classList.toggle('ad-panel--active', p.getAttribute('data-panel') === tab);
        });
        if (tab === 'overview' && !overviewLoaded) loadOverview();
        if (tab === 'analytics' && !analyticsLoaded) loadAnalytics();
        if (tab === 'users' && !usersLoaded) loadUsers();
        if (tab === 'billing' && !subsLoaded) loadSubs();
    }

    // ─── OVERVIEW ─────────────────────────────────────────────────────────
    var overviewPeriod = 30, overviewLoaded = false;
    function wireOverview() {
        $('adPeriod').querySelectorAll('button').forEach(function (b) {
            b.addEventListener('click', function () {
                overviewPeriod = Number(b.getAttribute('data-period'));
                $('adPeriod').querySelectorAll('button').forEach(function (x) {
                    x.classList.toggle('ad-period--active', x === b);
                });
                loadOverview();
            });
        });
    }
    function metric(label, val, sub) {
        return el('div', { class: 'ad-metric' }, [
            el('div', { class: 'ad-metric__label', text: label }),
            el('div', { class: 'ad-metric__val', text: val }),
            sub ? el('div', { class: 'ad-metric__sub', text: sub }) : null,
        ]);
    }
    function loadOverview() {
        overviewLoaded = true;
        var box = $('adMetrics');
        clear(box); box.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminOverview(overviewPeriod).then(function (d) {
            clear(box);
            var days = d.period_days || overviewPeriod;
            box.appendChild(metric('Активные юзеры', esc(d.active_users), 'за ' + days + ' дн.'));
            box.appendChild(metric('Новые регистрации', esc(d.new_registrations), 'за ' + days + ' дн.'));
            box.appendChild(metric('Активные подписки', esc(d.active_subscriptions)));
            box.appendChild(metric('MRR', rub(d.mrr_kopecks)));
            box.appendChild(metric('Конверсия в оплату', pct(d.signup_to_paid_conversion), 'signup → paid'));
        }).catch(function (e) {
            clear(box); box.appendChild(el('div', { class: 'ad-empty', text: errMsg(e) }));
        });
    }

    // ─── ANALYTICS (Ф3) ───────────────────────────────────────────────────
    // 5 блоков: воронка / retention / деньги / скилл / drop-off по урокам.
    // Графики — простые div-бары на токенах (без внешних либ). Устойчиво к
    // null-полям: любое отсутствующее число рисуем как «—».
    var analyticsLoaded = false, anlPeriod = 30, anlTier = '';

    function wireAnalytics() {
        $('adAnlPeriod').querySelectorAll('button').forEach(function (b) {
            b.addEventListener('click', function () {
                anlPeriod = Number(b.getAttribute('data-period'));
                $('adAnlPeriod').querySelectorAll('button').forEach(function (x) {
                    x.classList.toggle('ad-period--active', x === b);
                });
                loadAnalytics();
            });
        });
        var tierSel = $('adAnlTier');
        if (tierSel) tierSel.addEventListener('change', function () {
            anlTier = tierSel.value;
            // Тир влияет только на skill/lessons — перегружаем их точечно.
            loadAnlSkill();
            loadAnlLessons();
        });
    }

    // num-or-«—»
    function numOr(v) { return v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '—' : String(v); }

    // Горизонтальный бар: value отн. max, подпись слева, число справа.
    // opts.warn=true → красный (высокий dropoff). opts.tone: 'ok'|'warn'|'err'.
    function bar(label, value, max, valText, opts) {
        opts = opts || {};
        var frac = (max && value != null && isFinite(value)) ? Math.max(0, Math.min(1, value / max)) : 0;
        var fill = el('div', { class: 'ad-bar__fill' + (opts.tone ? ' ad-bar__fill--' + opts.tone : '') });
        fill.style.width = (frac * 100).toFixed(1) + '%';
        return el('div', { class: 'ad-bar' }, [
            el('div', { class: 'ad-bar__label', text: label }),
            el('div', { class: 'ad-bar__track' }, fill),
            el('div', { class: 'ad-bar__val', text: valText != null ? valText : numOr(value) }),
        ]);
    }

    // Вертикальная гистограмма из бакетов [{lo,hi,count}].
    function histogram(buckets, unit) {
        buckets = buckets || [];
        var max = 0;
        buckets.forEach(function (b) { if ((b.count || 0) > max) max = b.count || 0; });
        var cols = buckets.map(function (b) {
            var frac = max ? (b.count || 0) / max : 0;
            var col = el('div', { class: 'ad-hcol' }, [
                el('div', { class: 'ad-hcol__count', text: numOr(b.count) }),
                (function () {
                    var barEl = el('div', { class: 'ad-hcol__bar' });
                    barEl.style.height = Math.max(2, frac * 100).toFixed(1) + '%';
                    return el('div', { class: 'ad-hcol__barwrap' }, barEl);
                })(),
                el('div', { class: 'ad-hcol__x', text: (numOr(b.lo) + '–' + numOr(b.hi)) }),
            ]);
            return col;
        });
        if (!cols.length) return el('div', { class: 'ad-mono', text: 'Нет данных.' });
        var wrap = el('div', { class: 'ad-histogram' }, cols);
        if (unit) wrap.appendChild(el('div', { class: 'ad-histogram__unit', text: unit }));
        return wrap;
    }

    function blockError(id, e) {
        var box = $(id); if (!box) return;
        clearBody(box).appendChild(el('div', { class: 'ad-empty', text: errMsg(e) }));
    }

    // Оставляет .ad-anl-title, чистит остальное тело блока в свежий .ad-anl-body.
    function clearBody(box) {
        var title = box.querySelector('.ad-anl-title');
        clear(box);
        if (title) box.appendChild(title);
        box.appendChild(el('div', { class: 'ad-anl-body' }));
        return box.querySelector('.ad-anl-body');
    }

    function loadAnalytics() {
        analyticsLoaded = true;
        loadAnlFunnel();
        loadAnlRetention();
        loadAnlRevenue();
        loadAnlSkill();
        loadAnlLessons();
    }

    function loadAnlFunnel() {
        var body = clearBody($('adAnlFunnel'));
        body.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminAnalyticsFunnel(anlPeriod).then(function (d) {
            d = d || {};
            clear(body);
            var steps = [
                ['Регистрации', d.signups],
                ['Активировались', d.activated],
                ['Оформили подписку', d.subscribed],
                ['Отвалились (churn)', d.churned],
            ];
            var max = 0;
            steps.forEach(function (s) { if ((s[1] || 0) > max) max = s[1] || 0; });
            steps.forEach(function (s, i) {
                var tone = i === 3 ? 'err' : (i === 2 ? 'ok' : null);
                body.appendChild(bar(s[0], s[1], max, numOr(s[1]), { tone: tone }));
            });
            var rates = d.rates || {};
            var rk = Object.keys(rates);
            if (rk.length) {
                var rl = el('div', { class: 'ad-anl-rates' });
                rk.forEach(function (k) {
                    rl.appendChild(el('div', { class: 'ad-anl-rate' }, [
                        el('span', { class: 'ad-anl-rate__k', text: k }),
                        el('span', { class: 'ad-anl-rate__v', text: pct(rates[k]) }),
                    ]));
                });
                body.appendChild(rl);
            }
        }).catch(function (e) { blockError('adAnlFunnel', e); });
    }

    function loadAnlRetention() {
        var body = clearBody($('adAnlRetention'));
        body.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminAnalyticsRetention(anlPeriod).then(function (d) {
            d = d || {};
            clear(body);
            var row = el('div', { class: 'ad-ret-row' });
            [['D1', d.d1], ['D7', d.d7], ['D30', d.d30]].forEach(function (p) {
                row.appendChild(el('div', { class: 'ad-ret' }, [
                    el('div', { class: 'ad-ret__label', text: p[0] }),
                    el('div', { class: 'ad-ret__val', text: pct(p[1]) }),
                    (function () {
                        var ring = el('div', { class: 'ad-ret__bar' });
                        var fill = el('div', { class: 'ad-ret__bar-fill' });
                        fill.style.width = ((p[1] != null && isFinite(p[1]) ? Math.max(0, Math.min(1, Number(p[1]))) : 0) * 100).toFixed(1) + '%';
                        ring.appendChild(fill);
                        return ring;
                    })(),
                ]));
            });
            body.appendChild(row);
        }).catch(function (e) { blockError('adAnlRetention', e); });
    }

    function loadAnlRevenue() {
        var body = clearBody($('adAnlRevenue'));
        body.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminAnalyticsRevenue(anlPeriod).then(function (d) {
            d = d || {};
            clear(body);
            var metrics = el('div', { class: 'ad-anl-metrics' }, [
                miniMetric('MRR', rub(d.mrr_kopecks)),
                miniMetric('Активные подписки', numOr(d.active_subscriptions)),
                miniMetric('Новые', numOr(d.new_subscriptions)),
                miniMetric('Отменённые', numOr(d.cancelled_subscriptions)),
                miniMetric('Decline', pct(d.decline_rate)),
            ]);
            body.appendChild(metrics);
            // Мини-series MRR (спарклайн из вертикальных баров).
            var series = d.series || [];
            if (series.length) {
                var max = 0;
                series.forEach(function (p) { if ((p.mrr_kopecks || 0) > max) max = p.mrr_kopecks || 0; });
                var spark = el('div', { class: 'ad-spark' });
                series.forEach(function (p) {
                    var frac = max ? (p.mrr_kopecks || 0) / max : 0;
                    var b = el('div', { class: 'ad-spark__bar', title: (date(p.date) + ': ' + rub(p.mrr_kopecks)) });
                    b.style.height = Math.max(2, frac * 100).toFixed(1) + '%';
                    spark.appendChild(b);
                });
                body.appendChild(el('div', { class: 'ad-anl-sub', text: 'MRR по дням' }));
                body.appendChild(spark);
            }
        }).catch(function (e) { blockError('adAnlRevenue', e); });
    }

    function miniMetric(label, val) {
        return el('div', { class: 'ad-mini' }, [
            el('div', { class: 'ad-mini__label', text: label }),
            el('div', { class: 'ad-mini__val', text: val }),
        ]);
    }

    function loadAnlSkill() {
        var box = $('adAnlSkill');
        if (!box) return;
        var body = clearBody(box);
        body.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminAnalyticsSkill(anlPeriod, anlTier).then(function (d) {
            d = d || {};
            clear(body);
            body.appendChild(el('div', { class: 'ad-anl-metrics' }, [
                miniMetric('Средний WPM', numOr(d.avg_wpm)),
                miniMetric('Средняя точность', d.avg_accuracy == null ? '—' : (Number(d.avg_accuracy) <= 1 ? pct(d.avg_accuracy) : numOr(d.avg_accuracy) + '%')),
                miniMetric('Выборка (n)', numOr(d.n)),
            ]));
            body.appendChild(el('div', { class: 'ad-anl-sub', text: 'Распределение WPM' }));
            body.appendChild(histogram(d.wpm_buckets, 'зн/мин'));
            body.appendChild(el('div', { class: 'ad-anl-sub', text: 'Распределение точности' }));
            body.appendChild(histogram(d.acc_buckets, '%'));
        }).catch(function (e) { blockError('adAnlSkill', e); });
    }

    function loadAnlLessons() {
        var body = clearBody($('adAnlLessons'));
        body.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка…' }));
        api.adminAnalyticsLessons(anlTier).then(function (res) {
            // Бэк отдаёт {tier, items:[...], cached}; поддержим и голый массив.
            var rows = res && Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []);
            clear(body);
            if (!rows.length) { body.appendChild(el('div', { class: 'ad-mono', text: 'Нет данных.' })); return; }
            var maxReached = 0;
            rows.forEach(function (r) { if ((r.reached || 0) > maxReached) maxReached = r.reached || 0; });
            rows.forEach(function (r) {
                var dr = r.dropoff_rate;
                var high = dr != null && Number(dr) >= 0.4;  // ≥40% — красный
                var label = 'Урок ' + numOr(r.lesson_num);
                var valText = numOr(r.completed) + '/' + numOr(r.reached) + ' · ' + pct(dr);
                body.appendChild(bar(label, r.reached, maxReached, valText, { tone: high ? 'err' : 'ok' }));
            });
        }).catch(function (e) { blockError('adAnlLessons', e); });
    }

    // ─── USERS ────────────────────────────────────────────────────────────
    var usersLoaded = false, usersPage = 1, USERS_SIZE = 20;
    function wireUsers() {
        $('adUserSearchBtn').addEventListener('click', function () { usersPage = 1; loadUsers(); });
        $('adUserSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') { usersPage = 1; loadUsers(); } });
    }
    function userFilters() {
        return {
            search: $('adUserSearch').value.trim(),
            audience: $('adUserAudience').value,
            email_verified: $('adUserVerified').value,
            has_subscription: $('adUserSub').value,
            deleted: $('adUserDeleted').value,
            page: usersPage, page_size: USERS_SIZE,
        };
    }
    function loadUsers() {
        usersLoaded = true;
        $('adUserDetail').hidden = true; $('adUsersList').hidden = false;
        var body = $('adUsersBody');
        clear(body);
        body.appendChild(el('tr', {}, el('td', { colspan: '7', class: 'ad-empty', text: 'Загрузка…' })));
        api.adminListUsers(userFilters()).then(function (res) {
            clear(body);
            var items = res.items || [];
            if (!items.length) { body.appendChild(el('tr', {}, el('td', { colspan: '7', class: 'ad-empty', text: 'Ничего не найдено.' }))); }
            items.forEach(function (u) {
                var tr = el('tr', { class: 'ad-row--click', onclick: function () { openUser(u.id); } }, [
                    el('td', { text: esc(u.email) }),
                    el('td', { text: esc(u.name) }),
                    el('td', {}, el('span', { class: 'ad-chip ad-chip--muted', text: esc(u.audience) })),
                    el('td', {}, el('span', { class: 'ad-chip', text: esc(u.role) })),
                    el('td', {}, u.email_verified ? el('span', { class: 'ad-chip ad-chip--ok', text: '✓' }) : el('span', { class: 'ad-chip ad-chip--warn', text: '—' })),
                    el('td', {}, u.deleted_at ? el('span', { class: 'ad-chip ad-chip--err', text: 'заблокирован' }) : el('span', { class: 'ad-chip ad-chip--ok', text: 'активен' })),
                    el('td', { class: 'ad-mono', text: date(u.created_at) }),
                ]);
                body.appendChild(tr);
            });
            renderPager('adUsersPager', res, usersPage, function (p) { usersPage = p; loadUsers(); });
        }).catch(function (e) {
            clear(body); body.appendChild(el('tr', {}, el('td', { colspan: '7', class: 'ad-empty', text: errMsg(e) })));
        });
    }

    function openUser(id) {
        var box = $('adUserDetail');
        $('adUsersList').hidden = true; box.hidden = false;
        clear(box); box.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка карточки…' }));
        api.adminGetUser(id).then(function (d) { renderUserDetail(id, d); }).catch(function (e) {
            clear(box); box.appendChild(el('div', { class: 'ad-empty', text: errMsg(e) }));
        });
    }

    function kv(pairs) {
        var dl = el('dl', { class: 'ad-kv' });
        pairs.forEach(function (p) { dl.appendChild(el('dt', { text: p[0] })); dl.appendChild(el('dd', { text: p[1] == null ? '—' : String(p[1]) })); });
        return dl;
    }

    function renderUserDetail(id, d) {
        var box = $('adUserDetail'); clear(box);
        var p = d.profile || {};
        box.appendChild(el('div', { class: 'ad-back', text: '← К списку', onclick: function () { loadUsers(); } }));
        box.appendChild(el('div', { class: 'ad-panel__head' }, el('h1', { text: esc(p.email || p.name || 'Пользователь') })));

        // Действия (support+).
        var actions = el('div', { class: 'ad-actions' });
        function actBtn(label, action, danger, confirmText) {
            return el('button', { class: 'ad-btn ' + (danger ? 'ad-btn--danger' : ''), text: label, onclick: function () {
                confirmModal(label + '?', confirmText || '', function () { doUserAction(id, action, label); }, danger);
            } });
        }
        if (p.deleted_at) actions.appendChild(actBtn('Разблокировать', 'restore', false, 'Снять блокировку и вернуть доступ?'));
        else actions.appendChild(actBtn('Заблокировать', 'block', true, 'Заблокировать (soft-delete)? Юзер потеряет доступ.'));
        if (!p.email_verified) actions.appendChild(actBtn('Подтвердить email', 'verify-email', false, 'Вручную подтвердить email?'));
        actions.appendChild(actBtn('Сбросить пароль', 'reset-password', false, 'Отправить письмо со сбросом пароля?'));
        box.appendChild(actions);

        var grid = el('div', { class: 'ad-detail' });

        // Профиль
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Профиль' }),
            kv([
                ['ID', p.id || id], ['Email', p.email], ['Имя', p.name],
                ['Аудитория', p.audience], ['Персонаж', p.character], ['Роль', p.role],
                ['Язык', p.language], ['Email ✓', p.email_verified ? 'да' : 'нет'],
                ['Заблокирован', p.deleted_at ? 'да' : 'нет'], ['Создан', dt(p.created_at)],
            ]),
        ]));

        // Подписки
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Подписки' }),
            listOrEmpty(d.subscriptions, function (s) {
                return el('li', { text: (esc(s.plan) + ' · ' + esc(s.period) + ' · ' + esc(s.status) + ' · ' + rub(s.amount_kopecks)) });
            }, 'Подписок нет.'),
        ]));

        // Прогресс по тирам
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Прогресс по тирам' }),
            listOrEmpty(d.progress_by_tier, function (t) {
                return el('li', { text: (esc(t.tier) + ' · уроков: ' + esc(t.lessons_completed) + ' · звёзд: ' + esc(t.total_stars)) });
            }, 'Прогресса нет.'),
        ]));

        // Последние попытки
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Последние попытки' }),
            listOrEmpty(d.recent_attempts, function (a) {
                return el('li', { text: (esc(a.tier || '') + ' урок ' + esc(a.lesson_num != null ? a.lesson_num : '') + ' · ' + esc(a.wpm != null ? a.wpm + ' зн/мин' : '') + ' · ' + esc(a.accuracy != null ? a.accuracy + '%' : '') + ' · ' + dt(a.created_at)) });
            }, 'Попыток нет.'),
        ]));

        // Family
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Семья (family)' }),
            listOrEmpty(d.family, function (f) {
                return el('li', { text: (esc(f.role || f.relation || '') + ' · ' + esc(f.email || f.name || f.user_id || '')) });
            }, 'Связей нет.'),
        ]));

        // OAuth
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'OAuth-аккаунты' }),
            listOrEmpty(d.oauth_accounts, function (o) {
                return el('li', { text: (esc(o.provider) + ' · ' + esc(o.email || o.provider_user_id || '')) });
            }, 'OAuth не подключён.'),
        ]));

        box.appendChild(grid);
    }

    function listOrEmpty(arr, mapFn, emptyText) {
        if (!arr || !arr.length) return el('div', { class: 'ad-mono', text: emptyText });
        return el('ul', { class: 'ad-list-min' }, arr.map(mapFn));
    }

    function doUserAction(id, action, label) {
        api.adminUserAction(id, action).then(function () {
            toast(label + ' — готово', 'ok');
            openUser(id); // рефреш карточки
        }).catch(function (e) { toast(errMsg(e), 'err'); });
    }

    // ─── BILLING ──────────────────────────────────────────────────────────
    var subsLoaded = false, subsPage = 1, SUBS_SIZE = 20;
    function wireBilling() {
        $('adSubSearchBtn').addEventListener('click', function () { subsPage = 1; loadSubs(); });
        $('adGrantBtn').addEventListener('click', openGrantModal);
    }
    function subFilters() {
        return {
            status: $('adSubStatus').value, plan: $('adSubPlan').value,
            provider: $('adSubProvider').value, page: subsPage, page_size: SUBS_SIZE,
        };
    }
    function statusChip(s) {
        var cls = 'ad-chip--muted';
        if (s === 'active') cls = 'ad-chip--ok';
        else if (s === 'grace' || s === 'pending') cls = 'ad-chip--warn';
        else if (s === 'failed' || s === 'expired' || s === 'cancelled') cls = 'ad-chip--err';
        return el('span', { class: 'ad-chip ' + cls, text: esc(s) });
    }
    function loadSubs() {
        subsLoaded = true;
        $('adSubDetail').hidden = true; $('adSubsList').hidden = false;
        var body = $('adSubsBody'); clear(body);
        body.appendChild(el('tr', {}, el('td', { colspan: '8', class: 'ad-empty', text: 'Загрузка…' })));
        api.adminListSubscriptions(subFilters()).then(function (res) {
            clear(body);
            var items = res.items || [];
            if (!items.length) body.appendChild(el('tr', {}, el('td', { colspan: '8', class: 'ad-empty', text: 'Ничего не найдено.' })));
            items.forEach(function (s) {
                body.appendChild(el('tr', { class: 'ad-row--click', onclick: function () { openSub(s.id); } }, [
                    el('td', { class: 'ad-mono', text: String(s.id).slice(0, 8) }),
                    el('td', { class: 'ad-mono', text: String(s.user_id || '').slice(0, 8) }),
                    el('td', { text: esc(s.plan) }),
                    el('td', { text: esc(s.period) }),
                    el('td', {}, statusChip(s.status)),
                    el('td', { text: esc(s.provider) }),
                    el('td', { class: 'ad-mono', text: rub(s.amount_kopecks) }),
                    el('td', { class: 'ad-mono', text: date(s.expires_at) }),
                ]));
            });
            renderPager('adSubsPager', res, subsPage, function (p) { subsPage = p; loadSubs(); });
        }).catch(function (e) {
            clear(body); body.appendChild(el('tr', {}, el('td', { colspan: '8', class: 'ad-empty', text: errMsg(e) })));
        });
    }

    function openSub(id) {
        var box = $('adSubDetail');
        $('adSubsList').hidden = true; box.hidden = false;
        clear(box); box.appendChild(el('div', { class: 'ad-empty', text: 'Загрузка карточки…' }));
        api.adminGetSubscription(id).then(function (d) { renderSubDetail(id, d); }).catch(function (e) {
            clear(box); box.appendChild(el('div', { class: 'ad-empty', text: errMsg(e) }));
        });
    }

    function renderSubDetail(id, d) {
        var box = $('adSubDetail'); clear(box);
        var s = d.subscription || {};
        box.appendChild(el('div', { class: 'ad-back', text: '← К списку', onclick: function () { loadSubs(); } }));
        box.appendChild(el('div', { class: 'ad-panel__head' }, el('h1', { text: 'Подписка ' + String(id).slice(0, 8) })));

        // Действия
        var actions = el('div', { class: 'ad-actions' });
        var cancellable = s.status && ['active', 'grace', 'pending'].indexOf(s.status) !== -1;
        if (cancellable) {
            actions.appendChild(el('button', { class: 'ad-btn ad-btn--danger', text: 'Отменить подписку', onclick: function () {
                confirmModal('Отменить подписку?', 'Доступ сохранится до конца оплаченного периода.', function () {
                    api.adminCancelSub(id).then(function () { toast('Подписка отменена', 'ok'); openSub(id); })
                        .catch(function (e) { toast(errMsg(e), 'err'); });
                }, true);
            } }));
        }
        // Refund — только superadmin.
        if (hasRole('superadmin')) {
            actions.appendChild(el('button', { class: 'ad-btn ad-btn--danger', text: 'Вернуть деньги', onclick: function () { openRefundModal(id, s); } }));
        }
        box.appendChild(actions);

        var grid = el('div', { class: 'ad-detail' });
        grid.appendChild(el('div', { class: 'ad-detail__section' }, [
            el('h3', { text: 'Подписка' }),
            kv([
                ['ID', s.id], ['User ID', s.user_id], ['План', s.plan], ['Период', s.period],
                ['Статус', s.status], ['Провайдер', s.provider], ['Сумма', rub(s.amount_kopecks)],
                ['Валюта', s.currency], ['Начата', dt(s.started_at)], ['Истекает', dt(s.expires_at)],
                ['Автопродление', s.is_auto_renew ? 'да' : 'нет'],
            ]),
        ]));

        // Charge-лог
        var charges = d.charges || [];
        var chargeSection = el('div', { class: 'ad-detail__section' }, [el('h3', { text: 'Лог списаний' })]);
        if (!charges.length) chargeSection.appendChild(el('div', { class: 'ad-mono', text: 'Списаний нет.' }));
        else {
            var ul = el('ul', { class: 'ad-list-min' });
            charges.forEach(function (c) {
                var cls = c.status === 'success' || c.status === 'succeeded' || c.status === 'paid' ? 'ad-chip--ok'
                    : c.status === 'refunded' ? 'ad-chip--warn'
                        : c.status === 'failed' ? 'ad-chip--err' : 'ad-chip--muted';
                ul.appendChild(el('li', {}, [
                    el('span', { class: 'ad-chip ' + cls, text: esc(c.status) }),
                    document.createTextNode(' ' + rub(c.amount_kopecks) + ' · ' + dt(c.attempted_at) + (c.error_code ? ' · ошибка: ' + esc(c.error_code) : '')),
                ]));
            });
            chargeSection.appendChild(ul);
        }
        grid.appendChild(chargeSection);
        box.appendChild(grid);
    }

    function openGrantModal() {
        modal({
            title: 'Выдать подписку', desc: 'Ручная выдача (гудвилл / триал / компенсация).',
            submitLabel: 'Выдать',
            fields: [
                { name: 'user_id', label: 'User ID', placeholder: 'uuid юзера' },
                { name: 'plan', label: 'План', type: 'select', options: [{ value: 'pro', label: 'Полный (pro)' }, { value: 'family', label: 'Семейный (family)' }] },
                { name: 'period', label: 'Период', type: 'select', options: [{ value: 'w1', label: '1 неделя' }, { value: 'm1', label: '1 месяц' }, { value: 'm3', label: '3 месяца' }, { value: 'm6', label: '6 месяцев' }, { value: 'y1', label: '1 год' }] },
                { name: 'reason', label: 'Причина', placeholder: 'напр. гудвилл по обращению #123' },
            ],
            onSubmit: function (v, ctx) {
                if (!v.user_id.trim()) return ctx.setError('Укажите User ID.');
                if (!v.reason.trim()) return ctx.setError('Укажите причину (для аудита).');
                ctx.setBusy(true);
                api.adminGrant({ user_id: v.user_id.trim(), plan: v.plan, period: v.period, reason: v.reason.trim() })
                    .then(function () { ctx.close(); toast('Подписка выдана', 'ok'); loadSubs(); })
                    .catch(function (e) { ctx.setBusy(false); ctx.setError(errMsg(e)); });
            },
        });
    }

    // Refund с re-auth (superadmin). Двухшаговый flow:
    // 1) собрать reason/amount; 2) запросить пароль → adminReauth → token;
    // 3) adminRefund с X-Admin-Reauth. При 403 REAUTH_REQUIRED — повторить reauth.
    function openRefundModal(id, s) {
        modal({
            title: 'Вернуть деньги', desc: 'Возврат через провайдера. Требует повторного ввода пароля.',
            submitLabel: 'Далее', danger: true,
            fields: [
                { name: 'amount', label: 'Сумма возврата, ₽ (пусто = полная)', type: 'number', placeholder: String((s.amount_kopecks || 0) / 100) },
                { name: 'reason', label: 'Причина', placeholder: 'напр. спорная транзакция' },
            ],
            onSubmit: function (v, ctx) {
                if (!v.reason.trim()) return ctx.setError('Укажите причину (для аудита).');
                var amount_kopecks = v.amount.trim() ? Math.round(Number(v.amount) * 100) : undefined;
                if (amount_kopecks !== undefined && (!isFinite(amount_kopecks) || amount_kopecks <= 0)) return ctx.setError('Некорректная сумма.');
                ctx.close();
                reauthThen(function (token, retryCtx) {
                    api.adminRefund(id, { amount_kopecks: amount_kopecks, reason: v.reason.trim() }, token)
                        .then(function () { retryCtx.close(); state.reauthToken = token; toast('Возврат выполнен', 'ok'); openSub(id); })
                        .catch(function (e) {
                            if (e && e.code === 'REAUTH_REQUIRED') {
                                // Токен протух/отклонён — просим пароль заново.
                                state.reauthToken = null;
                                retryCtx.setBusy(false);
                                retryCtx.setError('Токен подтверждения истёк — введите пароль заново.');
                                return;
                            }
                            retryCtx.setBusy(false); retryCtx.setError(errMsg(e));
                        });
                });
            },
        });
    }

    // Показывает модалку ввода пароля, делает adminReauth, отдаёт token в cb.
    // cb(token, ctx): ctx = модалка пароля (для повторного показа ошибки/busy).
    function reauthThen(cb) {
        modal({
            title: 'Подтверждение паролем', desc: 'Для чувствительной операции введите свой пароль.',
            submitLabel: 'Подтвердить и выполнить', danger: true,
            fields: [{ name: 'password', label: 'Пароль', type: 'password', placeholder: '••••••••' }],
            onSubmit: function (v, ctx) {
                if (!v.password) return ctx.setError('Введите пароль.');
                ctx.setBusy(true);
                api.adminReauth(v.password).then(function (r) {
                    cb(r.reauth_token, ctx);
                }).catch(function (e) {
                    ctx.setBusy(false);
                    ctx.setError(e && e.status === 401 ? 'Неверный пароль.' : errMsg(e));
                });
            },
        });
    }

    // ─── Pager ────────────────────────────────────────────────────────────
    function renderPager(nodeId, res, page, go) {
        var node = $(nodeId); clear(node);
        var total = res.total || 0, size = res.page_size || 20;
        var pages = Math.max(1, Math.ceil(total / size));
        node.appendChild(el('span', { text: 'Всего: ' + total + ' · стр. ' + page + ' из ' + pages }));
        node.appendChild(el('button', { class: 'ad-btn ad-btn--sm', text: '← Назад', disabled: page <= 1 ? '' : null, onclick: function () { if (page > 1) go(page - 1); } }));
        node.appendChild(el('button', { class: 'ad-btn ad-btn--sm', text: 'Вперёд →', disabled: page >= pages ? '' : null, onclick: function () { if (page < pages) go(page + 1); } }));
    }

    // ─── Go ───────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
    else bootstrap();
})();
