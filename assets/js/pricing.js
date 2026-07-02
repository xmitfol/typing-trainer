/**
 * pricing.js — Phase 8 paywall + subscription + payment.
 * 3 view'а на одной странице (data-view на body): paywall → subscription → payment.
 * Период/план toggle с живым пересчётом цены. Оплата — DEMO (без бекенда, Phase 2).
 *
 * Цены НЕ совпадают с docs/planning/MVP_PRD.md (299/399₽) — взяты из дизайн-handoff
 * (490 Полный / 890 Семейный). PO решает какие канонические. Меняются в PLANS ниже.
 */
document.addEventListener('DOMContentLoaded', function () {
    const $ = (sel) => document.querySelector(sel);
    const page = $('#pricingPage');

    // Подгрузить конфиг api-client (useApi/baseUrl). Без него — mock-режим.
    if (window.apiClient) { try { apiClient.init(); } catch (e) {} }
    const useApi = () => !!(window.apiClient && apiClient.getConfig().useApi);

    // ─── Catalog ─────────────────────────────────────────────────
    const PERIODS = [
        { id: 'w1', short: '1 нед', label: '1 неделя',  months: 0.25, factor: 0.30, savings: 0,  copy: 'попробовать' },
        { id: 'm1', short: 'Месяц', label: '1 месяц',   months: 1,    factor: 1.00, savings: 0,  copy: 'базовый' },
        { id: 'm3', short: '3 мес', label: '3 месяца',  months: 3,    factor: 2.55, savings: 15 },
        { id: 'm6', short: '6 мес', label: '6 месяцев', months: 6,    factor: 4.50, savings: 25, popular: true },
        { id: 'y1', short: 'Год',   label: '1 год',     months: 12,   factor: 7.80, savings: 35 }
    ];

    const PLANS = {
        free: {
            label: 'Бесплатно', tagline: 'То что есть', basePrice: 0, disabled: true,
            features: ['Уроки 1-5', 'Один язык', 'Базовая статистика'],
            cta: 'Текущий план'
        },
        pro: {
            label: 'Полный', tagline: 'Лучший выбор для одного', basePrice: 490, featured: true,
            features: ['Все 99 уроков', 'Все 3 типа клавиатуры', 'Все языки и раскладки', 'Тренажёр скорости с метрономом', 'Сертификат'],
            cta: 'Оформить Полный'
        },
        family: {
            label: 'Семейный', tagline: 'До 5 человек', basePrice: 890,
            features: ['Всё из Полного', '5 профилей (взрослые + дети)', 'Подростковый курс с Кнопычем', 'Детский курс с Клавочкой', 'Родительская статистика'],
            cta: 'Оформить Семейный'
        }
    };

    let state = { plan: 'pro', period: 'm6' };

    const computePrice = (pl, pd) => pl.basePrice === 0 ? 0 : Math.round(pl.basePrice * pd.factor / 10) * 10;
    const fmt = (n) => n.toLocaleString('ru-RU');

    // ─── Render periods ──────────────────────────────────────────
    const periodsEl = $('#ppPeriods');
    PERIODS.forEach(pd => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pp-period' + (pd.id === state.period ? ' pp-period--active' : '');
        btn.dataset.period = pd.id;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', pd.id === state.period ? 'true' : 'false');
        const note = pd.savings > 0
            ? `<div class="pp-period__note pp-period__note--save">−${pd.savings}%</div>`
            : `<div class="pp-period__note">${pd.copy || ''}</div>`;
        btn.innerHTML = `
            ${pd.popular ? '<span class="pp-period__hit">HIT</span>' : ''}
            <div class="pp-period__short">${pd.short}</div>
            ${note}
        `;
        btn.addEventListener('click', () => { state.period = pd.id; render(); });
        periodsEl.appendChild(btn);
    });

    // ─── Render plans ────────────────────────────────────────────
    const plansEl = $('#ppPlans');
    Object.entries(PLANS).forEach(([key, pl]) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.dataset.plan = key;
        card.className = 'pp-plan'
            + (pl.featured ? ' pp-plan--featured' : '')
            + (pl.disabled ? ' pp-plan--disabled' : '')
            + (key === state.plan ? ' pp-plan--active' : '');
        const featuresHtml = pl.features.slice(0, 3).map(f =>
            `<li class="pp-plan__feature"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5L6 10L11 4" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${f}</span></li>`
        ).join('');
        const more = pl.features.length > 3 ? `<li class="pp-plan__more">+ ещё ${pl.features.length - 3}</li>` : '';
        card.innerHTML = `
            ${pl.featured ? '<span class="pp-plan__badge">ПОПУЛЯРНО</span>' : ''}
            <div class="pp-plan__hd">
                <div class="pp-plan__label">${pl.label}</div>
                <div class="pp-plan__radio"><div class="pp-plan__radio-dot"></div></div>
            </div>
            <div class="pp-plan__tagline">${pl.tagline}</div>
            <div class="pp-plan__price"><span class="pp-plan__price-val" data-price="${key}">—</span><span class="pp-plan__price-cur">₽</span></div>
            <div class="pp-plan__price-sub" data-pricesub="${key}"></div>
            <ul class="pp-plan__features">${featuresHtml}${more}</ul>
        `;
        if (!pl.disabled) {
            card.addEventListener('click', () => { state.plan = key; render(); });
        }
        plansEl.appendChild(card);
    });

    // ─── Render (update prices + active states) ──────────────────
    function render() {
        const pd = PERIODS.find(p => p.id === state.period);
        const pl = PLANS[state.plan];

        // Periods active
        periodsEl.querySelectorAll('.pp-period').forEach(b => {
            const on = b.dataset.period === state.period;
            b.classList.toggle('pp-period--active', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
        });

        // Plans active + prices
        plansEl.querySelectorAll('.pp-plan').forEach(c => {
            c.classList.toggle('pp-plan--active', c.dataset.plan === state.plan);
        });
        Object.entries(PLANS).forEach(([key, plan]) => {
            const price = computePrice(plan, pd);
            const priceEl = plansEl.querySelector(`[data-price="${key}"]`);
            const subEl = plansEl.querySelector(`[data-pricesub="${key}"]`);
            if (priceEl) priceEl.textContent = fmt(price);
            if (subEl) {
                subEl.textContent = plan.basePrice === 0 ? 'навсегда'
                    : pd.months >= 1 ? `за ${pd.label} · ${Math.round(price / pd.months / 10) * 10} ₽/мес`
                    : `за ${pd.label}`;
            }
        });

        // Summary
        const price = computePrice(pl, pd);
        $('#ppSummaryPeriod').textContent = pd.label;
        $('#ppSummaryPrice').textContent = `${fmt(price)} ₽`;
        const monthlyEq = pd.months >= 1 ? Math.round(price / pd.months / 10) * 10 : Math.round(price * 4);
        $('#ppSummaryMonthly').textContent = (pd.months >= 1 && price > 0) ? `~ ${fmt(monthlyEq)} ₽/мес` : '';
        const fullNoDiscount = Math.round(pl.basePrice * pd.months);
        const saved = fullNoDiscount - price;
        const saveEl = $('#ppSummarySave');
        if (saved > 0) { saveEl.hidden = false; saveEl.textContent = `экономия ${fmt(saved)} ₽`; }
        else saveEl.hidden = true;

        // Checkout label
        $('#ppCheckoutLabel').textContent = `${pl.cta} · ${fmt(price)} ₽`;

        // Payment step summary
        $('#ppPaySummaryPlan').textContent = `${pl.label} · ${pd.label}`;
        $('#ppPaySummaryPrice').textContent = `${fmt(price)} ₽`;
        $('#ppPaySubmitLabel').textContent = `Оплатить ${fmt(price)} ₽`;
    }
    render();

    // ─── View navigation ─────────────────────────────────────────
    function setView(v) { page.dataset.view = v; window.scrollTo(0, 0); }
    $('#ppOpenSubscription').addEventListener('click', () => setView('subscription'));
    $('#ppSubClose').addEventListener('click', () => setView('paywall'));
    $('#ppPayBack').addEventListener('click', () => setView('subscription'));

    // ─── Checkout ────────────────────────────────────────────────
    // useApi=true → реальный backend: создаём checkout, редиректим юзера на
    // confirmation_url провайдера (stub/yookassa). useApi=false (локально без
    // бэка) → прежний mock-экран с формой карты.
    const checkoutBtn = $('#ppCheckout');
    checkoutBtn.addEventListener('click', async () => {
        if (!useApi()) { setView('payment'); return; }
        const label = $('#ppCheckoutLabel');
        const prevLabel = label.textContent;
        checkoutBtn.disabled = true;
        label.textContent = 'Создаём оплату…';
        try {
            const returnUrl = `${window.location.origin}${window.location.pathname}?paid=1`;
            const res = await apiClient.createCheckout({
                plan: state.plan, period: state.period, return_url: returnUrl,
            });
            if (res && res.confirmation_url) {
                window.location.href = res.confirmation_url;  // на страницу провайдера
                return;
            }
            throw new Error('no confirmation_url');
        } catch (e) {
            checkoutBtn.disabled = false;
            label.textContent = prevLabel;
            const msg = e && e.status === 401
                ? 'Войдите в аккаунт, чтобы оформить подписку.'
                : 'Не удалось создать оплату. Попробуйте ещё раз.';
            alert(msg);  // TODO: заменить на inline-ошибку в дизайне
        }
    });

    // Возврат от провайдера (?paid=1): свериться с реальным статусом подписки.
    const qs = new URLSearchParams(window.location.search);
    if (useApi() && qs.has('paid')) {
        setView('payment');
        const done = $('#ppPayDone');
        const show = (text) => { if (done) { done.textContent = text; done.classList.add('pp-pay-done--show'); } };

        // Stub-провайдер (dev): реальный YK шлёт webhook сам, а stub-confirmation
        // возвращает подписанные сервером параметры (stub_payment_id + stub_sig).
        // Достраиваем и шлём webhook сами, чтобы завершить оплату без денег —
        // весь путь кликается в браузере (ADR-008 §2). Подпись валидна только
        // потому, что её выдал наш сервер; stub в prod не используется.
        const stubId = qs.get('stub_payment_id');
        const stubSig = qs.get('stub_sig');
        const completeStub = (stubId && stubSig)
            ? apiClient._http('POST', '/billing/webhook/stub', {
                provider_payment_id: stubId, sig: stubSig, kind: 'payment.succeeded',
              }).catch(() => {})
            : Promise.resolve();

        completeStub
            .then(() => apiClient.getSubscription())
            .then((st) => show((st && st.has_active)
                ? 'Подписка активна. Спасибо! Доступ открыт.'
                : 'Оплата обрабатывается — доступ откроется через пару секунд.'))
            .catch(() => show('Оплата обрабатывается — доступ откроется через пару секунд.'));
    }

    // ─── Promo toggle ────────────────────────────────────────────
    $('#ppPromoToggle').addEventListener('click', () => {
        const row = $('#ppPromoRow');
        const open = row.classList.toggle('pp-promo-row--open');
        $('#ppPromoToggle').style.display = open ? 'none' : '';
    });

    // ─── Payment method tabs ─────────────────────────────────────
    document.querySelectorAll('.pp-pay-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pp-pay-tab').forEach(t => t.classList.remove('pp-pay-tab--active'));
            tab.classList.add('pp-pay-tab--active');
        });
    });

    // ─── Mock payment ────────────────────────────────────────────
    $('#ppPayForm').addEventListener('submit', (e) => {
        e.preventDefault();
        $('#ppPayDone').classList.add('pp-pay-done--show');
        $('#ppPaySubmit').disabled = true;
    });
});
