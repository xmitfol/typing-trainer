/**
 * course.js — Phase 5 курс-страница.
 * Читает профиль, определяет активный tier, отображает модули как accordion
 * с реальными названиями уроков (через lesson-loader) и звёздами из lessonProgress.
 */
document.addEventListener('DOMContentLoaded', async function () {
    if (window.i18n) { try { await window.i18n.init(); } catch (e) {} }
    const $ = (sel) => document.querySelector(sel);
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson';

    function readJSON(key) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }
    const profile = readJSON(profileKey);
    if (!profile || !profile.onboardingCompleted || !profile.name) {
        window.location.href = 'index.html';
        return;
    }
    const progress = readJSON(progressKey) || {};
    const currentLesson = readJSON(currentKey) || {};

    function pickTier(prof) {
        const lang = prof.language || 'ru';
        const character = prof.character;
        if (lang === 'en') {
            if (character === 'knopych')   return 'en_teen';
            if (character === 'klavochka') return 'en_kids';
            return 'en_tier1';
        }
        if (character === 'knopych')   return 'ru_teen';
        if (character === 'klavochka') return 'ru_kids';
        return 'tier1';
    }
    const tier = currentLesson.tier || pickTier(profile);

    // ─── Module structure per tier (фазы из data/lessons/{tier}/lesson_*.json) ───
    const MODULES_BY_TIER = {
        tier1: [
            { n: 1, label: 'Основной ряд',     from: 1,  to: 15, accent: 'blue' },
            { n: 2, label: 'Верхний и нижний', from: 16, to: 30, accent: 'green' },
            { n: 3, label: 'Финал базы',       from: 31, to: 39, accent: 'orange' },
            { n: 4, label: 'Скорость',         from: 40, to: 54, accent: 'pink' },
            { n: 5, label: 'Точность',         from: 55, to: 69, accent: 'purple' },
            { n: 6, label: 'Практика',         from: 70, to: 84, accent: 'indigo' },
            { n: 7, label: 'Мастерство',       from: 85, to: 99, accent: 'pink' }
        ],
        en_tier1: [
            { n: 1, label: 'Home row',         from: 1,  to: 15, accent: 'blue' },
            { n: 2, label: 'Upper & lower',    from: 16, to: 30, accent: 'green' },
            { n: 3, label: 'Foundation final', from: 31, to: 39, accent: 'orange' },
            { n: 4, label: 'Speed',            from: 40, to: 54, accent: 'pink' },
            { n: 5, label: 'Accuracy',         from: 55, to: 69, accent: 'purple' },
            { n: 6, label: 'Practice',         from: 70, to: 84, accent: 'indigo' },
            { n: 7, label: 'Mastery',          from: 85, to: 99, accent: 'pink' }
        ],
        ru_teen: [
            { n: 1, label: 'Основы',           from: 1,  to: 15, accent: 'blue' },
            { n: 2, label: 'Поп-культура',     from: 16, to: 30, accent: 'orange' },
            { n: 3, label: 'Соц-сети',         from: 31, to: 45, accent: 'pink' },
            { n: 4, label: 'Скорость',         from: 46, to: 60, accent: 'green' },
            { n: 5, label: 'Школа · финал',    from: 61, to: 75, accent: 'purple' }
        ],
        en_teen: [
            { n: 1, label: 'Basics',           from: 1,  to: 15, accent: 'blue' },
            { n: 2, label: 'Pop culture',      from: 16, to: 30, accent: 'orange' },
            { n: 3, label: 'Social media',     from: 31, to: 45, accent: 'pink' },
            { n: 4, label: 'Speed',            from: 46, to: 60, accent: 'green' },
            { n: 5, label: 'School · final',   from: 61, to: 75, accent: 'purple' }
        ],
        ru_kids: [
            { n: 1, label: 'Базовые буквы',    from: 1,  to: 10, accent: 'blue' },
            { n: 2, label: 'Гласные',          from: 11, to: 20, accent: 'green' },
            { n: 3, label: 'Согласные',        from: 21, to: 30, accent: 'orange' },
            { n: 4, label: 'Слова и фразы',    from: 31, to: 40, accent: 'purple' },
            { n: 5, label: 'Финал · сказки',   from: 41, to: 50, accent: 'pink' }
        ],
        en_kids: [
            { n: 1, label: 'Basic letters',    from: 1,  to: 10, accent: 'blue' },
            { n: 2, label: 'Vowels',           from: 11, to: 20, accent: 'green' },
            { n: 3, label: 'Consonants',       from: 21, to: 30, accent: 'orange' },
            { n: 4, label: 'Words & phrases',  from: 31, to: 40, accent: 'purple' },
            { n: 5, label: 'Final · stories',  from: 41, to: 50, accent: 'pink' }
        ]
    };
    const modules = MODULES_BY_TIER[tier] || MODULES_BY_TIER.tier1;
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const totalLessons = counts[tier] || modules[modules.length - 1].to;

    // ─── Header: name + avatar + breadcrumb ──────────────────────
    if (window.portraits) {
        $('#cpProfileAvatar').innerHTML = window.portraits.user(profile.audience || 'adult', profile.gender || 'm', 28);
    }
    $('#cpProfileName').textContent = profile.name;

    const isRu = (profile.language || 'ru') === 'ru';
    const audienceLabels = { adult: 'Основной курс', teen: 'Подростковый курс', kid: 'Детский курс' };
    const courseName = (isRu ? 'Русский' : 'English') + ' курс';
    $('#cpCourseCrumb').textContent = courseName;
    const layout = isRu ? 'ЙЦУКЕН' : 'QWERTY';
    const flag = isRu ? '🇷🇺' : '🇬🇧';
    const lang = isRu ? 'РУССКИЙ' : 'ENGLISH';
    $('#cpEyebrow').textContent = `${flag} ${lang} КУРС · ${layout} · ${totalLessons} УРОКОВ`;
    const audience = profile.audience || 'adult';
    const leadByTier = {
        tier1: 'Десятипальцевый метод: от среднего ряда до полной раскладки.',
        en_tier1: 'Десятипальцевый метод на английской раскладке QWERTY.',
        ru_teen: 'Подростковый курс: интересные тексты на близких темах.',
        en_teen: 'Teen English course: relatable themes for young learners.',
        ru_kids: 'Детский курс: сказки и игры с буквами.',
        en_kids: 'Kids English course: stories and games with letters.'
    };
    $('#cpLead').textContent = leadByTier[tier] || leadByTier.tier1;

    // ─── Progress totals ─────────────────────────────────────────
    const completedNums = Object.keys(progress)
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n) && progress[String(n)] && progress[String(n)].stars > 0);
    const doneCount = completedNums.length;
    const donePct = totalLessons ? (doneCount / totalLessons) * 100 : 0;
    // Линейная прогрессия: «текущий» = первый НЕпройденный урок (а не stored
    // currentLesson, который может указывать вперёд). Только он разблокирован.
    const doneSet = new Set(completedNums);
    let firstUncompleted = totalLessons + 1;
    for (let n = 1; n <= totalLessons; n++) {
        if (!doneSet.has(n)) { firstUncompleted = n; break; }
    }
    const lessonNum = Math.min(firstUncompleted, totalLessons);

    // Average accuracy from completed lessons
    let avgAcc = null;
    if (completedNums.length) {
        const sum = completedNums.reduce((a, n) => a + (progress[String(n)].bestAccuracy || 0), 0);
        avgAcc = Math.round(sum / completedNums.length);
    }

    // Summary metrics
    $('#cpMetricOpen').textContent    = doneCount + 1 <= totalLessons ? String(doneCount + 1) : String(totalLessons);
    $('#cpMetricOpenSub').textContent = `из ${totalLessons}`;
    $('#cpMetricDone').textContent    = String(doneCount);
    $('#cpMetricDoneSub').textContent = `${Math.round(donePct)}%`;
    $('#cpMetricAcc').textContent     = avgAcc !== null ? String(avgAcc) : '—';
    $('#cpContinue').textContent      = `Продолжить · урок ${lessonNum} →`;
    $('#cpContinue').href             = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;

    // ─── Roadmap heads + track ───────────────────────────────────
    $('#cpRoadmapTrack').style.setProperty('--modules-count', modules.length);
    $('#cpRoadmapTrack').parentElement.style.setProperty('--modules-count', modules.length);

    const headsEl = $('#cpRoadmapHeads');
    headsEl.style.gridTemplateColumns = `repeat(${modules.length}, 1fr)`;

    const activeModuleIdx = modules.findIndex(m => lessonNum >= m.from && lessonNum <= m.to);
    const activeModule = activeModuleIdx >= 0 ? modules[activeModuleIdx] : modules[0];

    modules.forEach((m, idx) => {
        const head = document.createElement('div');
        head.className = 'cp-roadmap__head' + (idx === activeModuleIdx ? ' cp-roadmap__head--active' : '');
        head.innerHTML = `
            <div class="cp-roadmap__head-eyebrow">МОДУЛЬ ${m.n}</div>
            <div class="cp-roadmap__head-label">${escapeHtml(m.label)}</div>
        `;
        headsEl.appendChild(head);
    });

    // Track pills + dividers
    const trackEl = $('#cpRoadmapTrack');
    modules.forEach((m, idx) => {
        const startPct = ((m.from - 1) / totalLessons) * 100;
        const endPct = (m.to / totalLessons) * 100;
        const centerPct = (startPct + endPct) / 2;

        if (idx > 0) {
            const divider = document.createElement('div');
            divider.className = 'cp-roadmap__divider';
            divider.style.left = `${startPct}%`;
            trackEl.appendChild(divider);
        }

        const pill = document.createElement('div');
        const isActive = idx === activeModuleIdx;
        pill.className = `cp-roadmap__pill cp-roadmap__pill--${m.accent}` + (isActive ? ' cp-roadmap__pill--active' : '');
        if (!isActive) pill.classList.remove(`cp-roadmap__pill--${m.accent}`);
        pill.style.left = `${centerPct}%`;
        pill.textContent = `📖 ${m.from}–${m.to}`;
        trackEl.appendChild(pill);
    });

    $('#cpRoadmapFill').style.width = `${Math.min(100, donePct)}%`;
    $('#cpRoadmapProgress').textContent = `${doneCount}/${totalLessons} · ${donePct.toFixed(1)}%`;

    // Axis labels at module boundaries
    const axisEl = $('#cpRoadmapAxis');
    const boundaries = [0, ...modules.map(m => (m.to / totalLessons) * 100)];
    // dedup and round
    const uniqBounds = [...new Set(boundaries.map(b => Math.round(b)))];
    uniqBounds.forEach(pct => {
        const span = document.createElement('span');
        span.textContent = `${pct}%`;
        axisEl.appendChild(span);
    });

    // ─── Modules accordion ───────────────────────────────────────
    const modulesEl = $('#cpModules');
    modules.forEach((m, idx) => {
        const isActive = idx === activeModuleIdx;
        const card = document.createElement('div');
        card.className = 'cp-module' + (isActive ? ' cp-module--open' : '');
        card.dataset.moduleIdx = idx;
        card.innerHTML = `
            <button type="button" class="cp-module__head" data-toggle="module">
                <div class="cp-module__num">МОДУЛЬ ${m.n}</div>
                <div class="cp-module__title">${escapeHtml(m.label)}</div>
                <div class="cp-module__meta">
                    ${isActive ? '<span class="cp-module__now">СЕЙЧАС</span>' : ''}
                    <span>Уроки ${m.from}–${m.to}</span>
                </div>
                <span class="cp-module__chevron">▾</span>
            </button>
            <div class="cp-module__body"></div>
        `;
        modulesEl.appendChild(card);

        // Lazy-load lesson titles when first open
        if (isActive) renderLessonsFor(card, m);
    });

    modulesEl.addEventListener('click', (e) => {
        const head = e.target.closest('[data-toggle="module"]');
        if (!head) return;
        const card = head.closest('.cp-module');
        const wasOpen = card.classList.contains('cp-module--open');
        if (wasOpen) {
            card.classList.remove('cp-module--open');
            return;
        }
        card.classList.add('cp-module--open');
        // Render lessons if not yet
        const body = card.querySelector('.cp-module__body');
        if (!body.dataset.rendered) {
            const idx = parseInt(card.dataset.moduleIdx, 10);
            renderLessonsFor(card, modules[idx]);
        }
    });

    async function renderLessonsFor(card, m) {
        const body = card.querySelector('.cp-module__body');
        if (body.dataset.rendered) return;
        body.dataset.rendered = '1';
        body.innerHTML = '';

        // Intro special-rows (как в design course.jsx) — История курса + Интерактивная справка (NEW)
        // + разделитель + label «ВСТУПЛЕНИЕ» перед списком уроков. Только для модуля 1.
        if (m.n === 1) {
            const intro = document.createElement('div');
            intro.className = 'cp-module__intro';
            intro.innerHTML = `
                <button type="button" class="cp-special" data-special="history" title="Скоро">
                    <span class="cp-special__icon">📖</span>
                    <span class="cp-special__body">
                        <span class="cp-special__label">История курса</span>
                        <span class="cp-special__sub">История создания тренажёра</span>
                    </span>
                </button>
                <button type="button" class="cp-special" data-special="help" title="Скоро">
                    <span class="cp-special__icon">🆕</span>
                    <span class="cp-special__body">
                        <span class="cp-special__label">
                            Интерактивная справка
                            <span class="cp-special__badge">NEW</span>
                        </span>
                        <span class="cp-special__sub">Что такое слепая печать</span>
                    </span>
                </button>
                <div class="cp-module__intro-sep"></div>
                <div class="cp-module__intro-label">ВСТУПЛЕНИЕ</div>
            `;
            body.appendChild(intro);
        }

        const fetchTasks = [];
        for (let n = m.from; n <= m.to; n++) {
            fetchTasks.push(window.lessonLoader.loadLesson(tier, n).catch(() => null).then(l => ({ n, lesson: l })));
        }
        const lessonRows = await Promise.all(fetchTasks);

        lessonRows.forEach(({ n, lesson }) => {
            const prog = progress[String(n)];
            const isDone = prog && prog.stars > 0;
            const isNext = !isDone && n === lessonNum;
            const isLocked = !isDone && !isNext;

            const row = document.createElement('a');
            row.className = 'cp-lesson'
                + (isDone ? '' : isNext ? ` cp-lesson--next cp-lesson--accent-${m.accent}` : ' cp-lesson--locked');
            row.href = isLocked ? '#' : `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${n}`;
            if (isLocked) row.addEventListener('click', e => e.preventDefault());

            // Номер упражнения видим ВСЕГДА; статус — отдельным значком слева.
            const numClass = isDone ? 'cp-lesson__num--done'
                : isNext ? `cp-lesson__num--next-${m.accent}`
                : 'cp-lesson__num--locked';
            const numContent = String(n).padStart(2, '0');

            const statusState = isDone ? 'done' : isLocked ? 'locked' : 'next';
            const statusIcon = isDone
                ? '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : isLocked
                ? '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1.2" fill="currentColor"/><path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>'
                : '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 2.5L9 6L3 9.5Z" fill="currentColor"/></svg>';

            const title = (lesson && lesson.title) || `Урок ${n}`;
            const desc = (lesson && lesson.description) || '';
            const titleClass = isDone ? ' cp-lesson__title--done' : isLocked ? ' cp-lesson__title--locked' : '';

            const tail = isDone
                ? `${renderStars(prog.stars)}<span class="cp-lesson__acc">${prog.bestAccuracy ? Math.round(prog.bestAccuracy) + '%' : '—'}</span>`
                : isNext
                ? '<button class="cp-lesson__start">Начать →</button>'
                : '';

            row.innerHTML = `
                <div class="cp-lesson__status cp-lesson__status--${statusState}">${statusIcon}</div>
                <div class="cp-lesson__num ${numClass}">${numContent}</div>
                <div class="cp-lesson__info">
                    <div class="cp-lesson__title${titleClass}">
                        ${escapeHtml(title)}
                        ${isNext ? '<span class="cp-lesson__now-chip">СЕЙЧАС</span>' : ''}
                    </div>
                    ${desc ? `<div class="cp-lesson__desc">${escapeHtml(desc)}</div>` : ''}
                </div>
                <div class="cp-lesson__tail">${tail}</div>
            `;
            body.appendChild(row);
        });
    }

    function renderStars(n) {
        let html = '<span class="cp-stars">';
        for (let i = 1; i <= 5; i++) {
            const on = i <= n ? ' cp-star--on' : '';
            html += `<svg class="cp-star${on}" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z" stroke-linejoin="round"/></svg>`;
        }
        html += '</span>';
        return html;
    }

    // ─── Grading legend ──────────────────────────────────────────
    const gradingItems = [
        { stars: 5, label: 'Превосходно',        desc: 'Без ошибок · 5.0 баллов' },
        { stars: 5, label: 'Отлично',            desc: 'Без ошибок · оценка ниже 5.0' },
        { stars: 4, label: 'Хорошо',             desc: '1–2 ошибки' },
        { stars: 3, label: 'Можно лучше',        desc: '3–5 ошибок' },
        { stars: 2, label: 'Удовлетворительно',  desc: '6–10 ошибок · повтори' },
        { stars: 1, label: 'Плохо',              desc: 'много ошибок · повтори' }
    ];
    const gridEl = $('#cpGradingGrid');
    gradingItems.forEach(it => {
        const item = document.createElement('div');
        item.className = 'cp-grading__item';
        item.innerHTML = `
            ${renderStars(it.stars)}
            <div>
                <div class="cp-grading__item-label">${it.label}</div>
                <div class="cp-grading__item-desc">${it.desc}</div>
            </div>
        `;
        gridEl.appendChild(item);
    });

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }
});
