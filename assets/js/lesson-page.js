/**
 * lesson-page.js — Phase 6 lesson reading.
 * URL: lesson.html?tier=tier1&lesson=6 (default: current lesson из localStorage)
 * Читает урок через lesson-loader, рендерит title, mentor greet, tips → narrative,
 * inline-exercise card (preview targeting `text`) и nav prev/next.
 * «Открыть тренажёр →» сохраняет {tier, lessonNumber} в currentLesson и ведёт на index.html.
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

    // ─── Parse URL params ────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier') || currentLesson.tier || pickTier(profile);
    const lessonNum = parseInt(params.get('lesson'), 10) || currentLesson.lessonNumber || 1;
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const totalLessons = counts[tier] || 99;

    // ─── Линейная прогрессия: блокируем прямой URL на заблокированный урок ───
    // Доступен урок только если пройден ИЛИ это первый непройденный.
    let firstUncompleted = totalLessons;
    for (let n = 1; n <= totalLessons; n++) {
        if (!(progress[String(n)] && progress[String(n)].stars > 0)) { firstUncompleted = n; break; }
    }
    const lessonDone = !!(progress[String(lessonNum)] && progress[String(lessonNum)].stars > 0);
    if (!lessonDone && lessonNum !== firstUncompleted) {
        showLockedScreen(tier, firstUncompleted);
        return;
    }

    function showLockedScreen(tier, available) {
        const nextHref = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${available}`;
        document.body.innerHTML = `
            <div class="lp-locked">
                <div class="lp-locked__card">
                    <div class="lp-locked__icon">🔒</div>
                    <h1 class="lp-locked__title">Рановато для этого урока</h1>
                    <p class="lp-locked__text">
                        Уроки открываются по порядку — этот станет доступен, когда вы
                        пройдёте предыдущие. Продолжите с последнего открытого упражнения
                        или выберите урок из списка.
                    </p>
                    <div class="lp-locked__actions">
                        <a class="lp-locked__btn lp-locked__btn--primary" href="${nextHref}">
                            Продолжить · урок ${available} →
                        </a>
                        <a class="lp-locked__btn lp-locked__btn--secondary" href="course.html">
                            Список уроков
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // ─── Module structure (повтор из course.js — стабильнее иметь дубль здесь) ───
    const MODULES_BY_TIER = {
        tier1: [
            { n: 1, from: 1, to: 15 }, { n: 2, from: 16, to: 30 }, { n: 3, from: 31, to: 39 },
            { n: 4, from: 40, to: 54 }, { n: 5, from: 55, to: 69 }, { n: 6, from: 70, to: 84 },
            { n: 7, from: 85, to: 99 }
        ],
        en_tier1: [
            { n: 1, from: 1, to: 15 }, { n: 2, from: 16, to: 30 }, { n: 3, from: 31, to: 39 },
            { n: 4, from: 40, to: 54 }, { n: 5, from: 55, to: 69 }, { n: 6, from: 70, to: 84 },
            { n: 7, from: 85, to: 99 }
        ],
        ru_teen: [
            { n: 1, from: 1, to: 15 }, { n: 2, from: 16, to: 30 }, { n: 3, from: 31, to: 45 },
            { n: 4, from: 46, to: 60 }, { n: 5, from: 61, to: 75 }
        ],
        en_teen: [
            { n: 1, from: 1, to: 15 }, { n: 2, from: 16, to: 30 }, { n: 3, from: 31, to: 45 },
            { n: 4, from: 46, to: 60 }, { n: 5, from: 61, to: 75 }
        ],
        ru_kids: [
            { n: 1, from: 1, to: 10 }, { n: 2, from: 11, to: 20 }, { n: 3, from: 21, to: 30 },
            { n: 4, from: 31, to: 40 }, { n: 5, from: 41, to: 50 }
        ],
        en_kids: [
            { n: 1, from: 1, to: 10 }, { n: 2, from: 11, to: 20 }, { n: 3, from: 21, to: 30 },
            { n: 4, from: 31, to: 40 }, { n: 5, from: 41, to: 50 }
        ]
    };
    const modules = MODULES_BY_TIER[tier] || MODULES_BY_TIER.tier1;
    const moduleIdx = modules.findIndex(m => lessonNum >= m.from && lessonNum <= m.to);
    const module = moduleIdx >= 0 ? modules[moduleIdx] : modules[0];

    // ─── Header crumbs + progress ────────────────────────────────
    const isRu = (profile.language || 'ru') === 'ru';
    $('#lpCrumbCourse').textContent = isRu ? 'Русский курс' : 'English course';
    $('#lpCrumbLesson').textContent = `Урок ${lessonNum}`;
    $('#lpProgressLabel').textContent = `${lessonNum}/${totalLessons}`;
    const pct = totalLessons ? Math.round((lessonNum / totalLessons) * 100) : 0;
    $('#lpProgressFill').style.width = `${pct}%`;
    $('#lpProgressPct').textContent = `${pct}%`;
    $('#lpBadge').textContent = `МОДУЛЬ ${module.n} · УРОК ${lessonNum}`;

    // Best stats для этого урока — в шапке справа
    const prog = progress[String(lessonNum)];
    if (prog) {
        if (prog.bestWPM)      $('#lpMetricWpm').textContent = Math.round(prog.bestWPM);
        if (prog.bestAccuracy) $('#lpMetricAcc').textContent = Math.round(prog.bestAccuracy) + '%';
    }

    // ─── Fetch lesson ────────────────────────────────────────────
    if (!window.lessonLoader) {
        console.error('lesson-loader не готов');
        return;
    }
    const lesson = await window.lessonLoader.loadLesson(tier, lessonNum);
    if (!lesson) {
        $('#lpTitle').textContent = `Урок ${lessonNum} не найден`;
        $('#lpSubtitle').textContent = 'Возможно, неправильный tier или номер';
        return;
    }

    $('#lpTitle').textContent = lesson.title || `Урок ${lessonNum}`;
    $('#lpSubtitle').textContent = lesson.description || '';

    // ─── Mentor intro ────────────────────────────────────────────
    const mentorId = profile.character || (profile.audience === 'teen' ? 'knopych' : profile.audience === 'kid' ? 'klavochka' : 'anna');
    const tRole = (window.i18n ? window.i18n.t('lesson.mentorRole') : '· ВАШ НАСТАВНИК');
    const mentorMeta = {
        anna:      { name: 'Анна',      role: tRole },
        maxim:     { name: 'Максим',    role: tRole },
        knopych:   { name: 'Кнопыч',    role: tRole },
        klavochka: { name: 'Клавочка',  role: tRole }
    }[mentorId] || { name: 'Наставник', role: tRole };

    $('#lpMentor').dataset.mentor = mentorId;
    if (window.portraits && window.portraits.mentor) {
        $('#lpMentorPortrait').innerHTML = window.portraits.mentor(mentorId, 64);
    }
    $('#lpMentorName').textContent = mentorMeta.name;
    $('#lpMentorRole').textContent = mentorMeta.role;

    // Quote from lesson.character_tips[mentor] → character-system lessonStart → generic fallback.
    // CharacterSystem подгружается асинхронно; если character_tips есть — используем его сразу,
    // иначе ждём загрузки и заполняем lessonStart с {name}/{level}.
    const mentorTip = lesson.character_tips && lesson.character_tips[mentorId];
    const fallbackQuote = `${profile.name}, начинаем! ${lesson.title}. ${lesson.description || ''}`;
    $('#lpMentorQuote').textContent = mentorTip || fallbackQuote;
    if (!mentorTip && window.CharacterSystem) {
        const cs = window.characterSystem || (window.characterSystem = new window.CharacterSystem());
        const apply = () => {
            const msg = cs.getMessage && cs.getMessage('lessonStart', { name: profile.name || '', level: lesson.title || '' });
            if (msg) $('#lpMentorQuote').textContent = msg;
        };
        if (cs.character && cs.character.id === mentorId) {
            apply();
        } else {
            cs.loadCharacter(mentorId).then(apply).catch(() => {});
        }
    }

    // ─── Lead + tips as narrative ────────────────────────────────
    $('#lpLead').textContent = lesson.description
        ? `${lesson.description}. ${lesson.finger_focus || ''}`.trim()
        : `В этом уроке вы освоите: ${(lesson.new_keys || []).join(', ')}.`;

    const tipsContainer = $('#lpTips');
    tipsContainer.innerHTML = '';
    const tips = lesson.tips || [];
    // Counter для inline-упражнений (нумерация УПРАЖНЕНИЕ 1/2/3)
    let inlineExIdx = 0;
    // Гайдед-уроки (lesson.guided): шаги type:"step" гейтятся по порядку —
    // следующий открывается только после прохождения предыдущего (per-exercise
    // состояние в window.exerciseProgress). totalSteps нужен для лока финального
    // захода (#lpOpenTrainer) внизу.
    const guided = lesson.guided === true;
    const totalSteps = tips.filter(t => t && t.type === 'step').length;
    let guidedStepIdx = 0;        // 1-based индекс текущего step при обходе
    let prevStepsAllDone = true;  // все шаги ДО текущего пройдены
    let firstIncompleteStep = 0;  // первый непройденный шаг (для «Выполнить задание»)
    tips.forEach((tip, idx) => {
        // Backward compat: строка → параграф (1-й как drop-cap, каждый 3-й как callout).
        // Объект {type, ...} → специальный рендер: callout / pullquote / exercise / figure.
        if (typeof tip === 'string') {
            if (idx > 0 && idx % 3 === 0) {
                tipsContainer.appendChild(makeCallout('💡', 'Подсказка', tip));
            } else {
                const p = document.createElement('p');
                p.className = 'lp-p' + (idx === 1 ? ' lp-p--drop' : '');
                p.textContent = tip;
                tipsContainer.appendChild(p);
            }
            return;
        }
        if (!tip || typeof tip !== 'object') return;
        switch (tip.type) {
            case 'p':
            case 'drop':
            case 'lead': {
                const p = document.createElement('p');
                p.className = 'lp-p' + (tip.type !== 'p' ? ` lp-p--${tip.type}` : '');
                p.textContent = tip.text || '';
                tipsContainer.appendChild(p);
                break;
            }
            case 'callout':
                tipsContainer.appendChild(makeCallout(tip.icon || '💡', tip.title || 'Подсказка', tip.text || ''));
                break;
            case 'pullquote': {
                const q = document.createElement('blockquote');
                q.className = 'lp-quote';
                q.innerHTML = `<span>${escapeHtml(tip.text || '')}</span>${tip.by ? `<span class="lp-quote__by">— ${escapeHtml(tip.by)}</span>` : ''}`;
                tipsContainer.appendChild(q);
                break;
            }
            case 'figure': {
                const f = document.createElement('div');
                f.className = 'lp-figure';
                if (tip.tone) f.dataset.tone = tip.tone;
                if (tip.aspect) f.style.aspectRatio = tip.aspect;
                f.innerHTML = `<div class="lp-figure__label">${escapeHtml(tip.label || 'Иллюстрация')}</div>`;
                tipsContainer.appendChild(f);
                break;
            }
            case 'exercise':
                tipsContainer.appendChild(makeInlineExercise(++inlineExIdx, tip));
                break;
            case 'step': {
                // Гайдед-шаг (placement/drill): открывает тренажёр на своём тексте.
                const sIdx = ++guidedStepIdx;
                const done = !!(window.exerciseProgress && window.exerciseProgress.isStepDone(tier, lessonNum, sIdx));
                const status = done ? 'done' : (prevStepsAllDone ? 'active' : 'locked');
                if (!done && firstIncompleteStep === 0) firstIncompleteStep = sIdx;
                tipsContainer.appendChild(makeGuidedStep(sIdx, tip, status));
                prevStepsAllDone = prevStepsAllDone && done;
                break;
            }
        }
    });

    // Pull quote только когда есть >=4 строковых tips (legacy для старых уроков).
    if (tips.filter(t => typeof t === 'string').length >= 4) {
        $('#lpPullQuote').hidden = false;
    }

    function makeCallout(icon, title, text) {
        const c = document.createElement('div');
        c.className = 'lp-callout';
        c.innerHTML = `
            <div class="lp-callout__icon">${escapeHtml(icon)}</div>
            <div>
                <div class="lp-callout__title">${escapeHtml(title)}</div>
                <div class="lp-callout__text">${escapeHtml(text)}</div>
            </div>
        `;
        return c;
    }

    // Гайдед-шаг (lesson.guided): не печатается на месте, а открывает тренажёр
    // на тексте именно этого шага (task.html?...&exercise=N). Статус:
    //   active — доступен (предыдущие пройдены), кнопка ведёт в тренажёр;
    //   done   — пройден, ✓ + кнопка (можно повторить);
    //   locked — заблокирован, кнопки нет.
    function makeGuidedStep(num, tip, status) {
        const target = String(tip.target || '');
        const fingerColor = tip.finger || 'blue';
        const hint = tip.hint || '';
        const kind = tip.kind || 'drill';
        const badge = tip.title || (kind === 'placement' ? 'Поставь руки' : `Упражнение ${num}`);
        const t = (k, fb) => (window.i18n ? window.i18n.t(k) : fb) || fb;

        const box = document.createElement('div');
        box.className = `lp-exercise lp-exercise--step lp-exercise--${status}`;
        box.dataset.finger = fingerColor;

        let metaHtml;
        if (status === 'locked') {
            metaHtml = `<span class="lp-step__lock">🔒 ${escapeHtml(t('lesson.stepLocked', 'Сначала пройди предыдущий шаг'))}</span>`;
        } else {
            const href = `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}&exercise=${num}`;
            const doneBadge = status === 'done'
                ? `<span class="lp-exercise__done-badge">✓ ${escapeHtml(t('lesson.stepDone', 'Пройдено'))}</span>`
                : '';
            const btnLabel = t('lesson.openTrainer', 'Открыть тренажёр →');
            metaHtml = `${doneBadge}<a class="lp-exercise__open lp-step__open" href="${href}">${escapeHtml(btnLabel)}</a>`;
        }

        box.innerHTML = `
            <div class="lp-exercise__hd">
                <div class="lp-exercise__badge"><span class="lp-exercise__badge-text">${escapeHtml(badge)}</span></div>
                ${hint ? `<div class="lp-exercise__hint">
                    <span class="lp-exercise__hint-dot"></span>
                    <span>${escapeHtml(hint)}</span>
                </div>` : ''}
            </div>
            <div class="lp-exercise__target lp-exercise__target--preview">${escapeHtml(target)}</div>
            <div class="lp-exercise__meta">${metaHtml}</div>
        `;

        // Клик по кнопке шага — сохранить currentLesson (как у нижнего тренажёра).
        const openLink = box.querySelector('.lp-step__open');
        if (openLink) {
            openLink.addEventListener('click', () => {
                try {
                    localStorage.setItem(currentKey, JSON.stringify({
                        tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString()
                    }));
                } catch (err) {}
            });
        }
        return box;
    }

    // ExerciseInsert (по design lesson.jsx) — самостоятельная мини-typing задача
    // прямо в теле теории. Каждый instance имеет свой capture input.
    function makeInlineExercise(num, tip) {
        const targetText = String(tip.target || '');
        const fingerColor = tip.finger || 'blue';
        const fingerHint = tip.hint || '';
        const total = targetText.length;

        const box = document.createElement('div');
        box.className = 'lp-exercise lp-exercise--inline';
        box.dataset.finger = fingerColor;
        const badgeRu = window.i18n ? window.i18n.t('lesson.exerciseBadge') : 'УПРАЖНЕНИЕ';
        box.innerHTML = `
            <div class="lp-exercise__hd">
                <div class="lp-exercise__badge"><span class="lp-exercise__badge-text">${escapeHtml(badgeRu)} ${num}</span></div>
                ${fingerHint ? `<div class="lp-exercise__hint">
                    <span class="lp-exercise__hint-dot"></span>
                    <span>${escapeHtml(fingerHint)}</span>
                </div>` : ''}
            </div>
            <div class="lp-exercise__target" tabindex="0"></div>
            <input class="lp-exercise__capture" type="text" inputmode="none" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
            <div class="lp-exercise__meta">
                <div class="lp-exercise__dots"></div>
                <div class="lp-exercise__count">0/${total}</div>
            </div>
        `;

        const targetEl = box.querySelector('.lp-exercise__target');
        const captureEl = box.querySelector('.lp-exercise__capture');
        const dotsEl = box.querySelector('.lp-exercise__dots');
        const countEl = box.querySelector('.lp-exercise__count');
        const badgeText = box.querySelector('.lp-exercise__badge-text');
        const badgeDoneText = '✓ ' + (window.i18n ? window.i18n.t('task.completed').replace('✓ ', '') : 'ВЫПОЛНЕНО');

        let typed = 0, errors = 0, done = false;

        // Прогресс-точки
        dotsEl.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const d = document.createElement('div');
            d.className = 'lp-exercise__dot';
            dotsEl.appendChild(d);
        }
        const dotEls = Array.from(dotsEl.children);

        function render() {
            let html = '', openWord = false;
            for (let i = 0; i < total; i++) {
                const ch = targetText[i];
                let cls = 'ch';
                if (i < typed) cls += ' done';
                else if (i === typed && !done) cls += ' cur';
                if (ch === ' ') {
                    if (openWord) { html += '</span>'; openWord = false; }
                    html += `<span class="${cls}"> </span>`;
                } else {
                    if (!openWord) { html += '<span class="word">'; openWord = true; }
                    html += `<span class="${cls}">${escapeHtml(ch)}</span>`;
                }
            }
            if (openWord) html += '</span>';
            targetEl.innerHTML = html;
            countEl.textContent = `${typed}/${total}`;
            dotEls.forEach((d, i) => d.classList.toggle('on', i < typed));
            box.classList.toggle('lp-exercise--done', done);
            badgeText.textContent = done ? badgeDoneText : `${badgeRu} ${num}`;
        }

        function focus() {
            captureEl.focus({ preventScroll: true });
            box.classList.add('lp-exercise--focus');
        }
        function blur() { box.classList.remove('lp-exercise--focus'); }

        captureEl.addEventListener('blur', blur);
        targetEl.addEventListener('click', focus);
        box.addEventListener('click', () => focus());

        captureEl.addEventListener('keydown', (e) => {
            if (done) return;
            if (e.key === 'Backspace') {
                if (typed > 0) typed--;
                render();
                e.preventDefault();
                return;
            }
            if (e.key === 'Tab') return;  // даём табу уйти на следующий элемент
            if (e.key.length !== 1) return;
            e.preventDefault();
            const expected = targetText[typed];
            if (e.key !== expected) errors++;
            typed++;
            if (typed >= total) {
                done = true;
                if (errors === 0) box.classList.add('lp-exercise--done');
            }
            render();
        });

        render();
        return box;
    }

    // ─── Inline exercise preview ─────────────────────────────────
    const fingerFocus = (lesson.finger_focus || '').toLowerCase();
    let finger = 'blue';
    if (fingerFocus.includes('мизин') || fingerFocus.includes('pinky')) finger = 'pink';
    else if (fingerFocus.includes('безым') || fingerFocus.includes('ring')) finger = 'orange';
    else if (fingerFocus.includes('средн') || fingerFocus.includes('middle')) finger = 'green';
    else if (fingerFocus.includes('указ') || fingerFocus.includes('index')) finger = 'blue';
    else if (lesson.phase >= 4) finger = 'purple';

    $('#lpExercise').dataset.finger = finger;
    const exBadge = window.i18n ? window.i18n.t('lesson.exerciseBadge') : 'УПРАЖНЕНИЕ';
    $('#lpExerciseBadge').textContent = `${exBadge} · ${(lesson.new_keys || []).join(' ')}`.trim();
    $('#lpExerciseHint').textContent = lesson.finger_focus || `Цель: ${lesson.target_wpm || '—'} зн/мин, допустимо ошибок: ${lesson.error_limit || '—'}`;
    $('#lpExerciseTarget').textContent = lesson.text || '';

    // Dots from typed / total — здесь typed=0 (preview), но красивые сегменты по длине текста
    const total = (lesson.text || '').length;
    const dotsContainer = $('#lpExerciseDots');
    dotsContainer.innerHTML = '';
    const dotCount = Math.min(total, 30); // ограничим визуально
    for (let i = 0; i < dotCount; i++) {
        const d = document.createElement('div');
        d.className = 'lp-exercise__dot';
        dotsContainer.appendChild(d);
    }
    $('#lpExerciseCount').textContent = `0/${total}`;

    // Гайдед-урок: финальный «полный заход» — заблокирован/затемнён как шаги
    // выше, пока не пройдены все шаги.
    const fullRunLocked = guided && totalSteps > 0
        && !(window.exerciseProgress && window.exerciseProgress.allStepsDone(tier, lessonNum, totalSteps));
    if (guided && totalSteps > 0) {
        $('#lpExerciseBadge').textContent = `${exBadge} · ${(window.i18n ? window.i18n.t('lesson.fullRun') : '') || 'Полный заход'}`;
    }

    // «Открыть тренажёр» сохраняет currentLesson и идёт в task.html
    $('#lpOpenTrainer').href = `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;
    $('#lpOpenTrainer').addEventListener('click', (e) => {
        try {
            localStorage.setItem(currentKey, JSON.stringify({
                tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString()
            }));
        } catch (err) {}
    });

    if (fullRunLocked) {
        // Закрытый вид как у заблокированных шагов: затемнение блока, без кнопки,
        // только замок. (Не показываем ✓-бейдж, даже если урок проходили раньше.)
        $('#lpExercise').classList.add('lp-exercise--locked');
        const openBtn = $('#lpOpenTrainer');
        openBtn.style.display = 'none';
        if (!openBtn.parentElement.querySelector('.lp-step__lock')) {
            const lock = document.createElement('span');
            lock.className = 'lp-step__lock';
            lock.textContent = '🔒 ' + ((window.i18n ? window.i18n.t('lesson.fullRunLocked') : '') || 'Сначала пройди все шаги выше');
            openBtn.insertAdjacentElement('beforebegin', lock);
        }
    } else if (lessonDone) {
        // Полный заход доступен и урок уже пройден ранее — ✓ рядом с кнопкой.
        const openBtn = $('#lpOpenTrainer');
        if (!openBtn.parentElement.querySelector('.lp-exercise__done-badge')) {
            const badge = document.createElement('span');
            badge.className = 'lp-exercise__done-badge';
            badge.textContent = '✓ Пройдено';
            openBtn.insertAdjacentElement('beforebegin', badge);
        }
    }

    // «Выполнить задание →» в топбаре — шорткат к практике.
    // Гайдед-урок: ведём к первому НЕпройденному шагу (не в полный заход в обход
    // лестницы). Когда все шаги пройдены (firstIncompleteStep===0) — полный заход.
    const topTask = $('#lpTopTask');
    if (topTask) {
        topTask.href = (guided && totalSteps > 0 && firstIncompleteStep > 0)
            ? `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}&exercise=${firstIncompleteStep}`
            : `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;
    }

    // ─── Prev/Next nav ───────────────────────────────────────────
    const prevN = lessonNum - 1;
    const nextN = lessonNum + 1;
    const prevEl = $('#lpNavPrev');
    const nextEl = $('#lpNavNext');

    // Текущий урок пройден? (есть звёзды в прогрессе) — линейная прогрессия:
    // следующий урок недоступен, пока текущий не сдан.
    const currentDone = !!(prog && prog.stars > 0);

    if (prevN < 1) {
        prevEl.classList.add('lp-nav__btn--disabled');
        $('#lpNavPrevHint').textContent = '← НАЧАЛО КУРСА';
        $('#lpNavPrevTitle').textContent = '—';
        prevEl.href = '#';
    } else {
        prevEl.href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${prevN}`;
        $('#lpNavPrevHint').textContent = `← УРОК ${prevN}`;
        window.lessonLoader.loadLesson(tier, prevN).then(l => {
            $('#lpNavPrevTitle').textContent = (l && l.title) || `Урок ${prevN}`;
        });
    }

    if (nextN > totalLessons) {
        nextEl.classList.add('lp-nav__btn--disabled');
        $('#lpNavNextHint').textContent = 'КОНЕЦ КУРСА →';
        $('#lpNavNextTitle').textContent = '—';
        nextEl.href = '#';
    } else if (!currentDone) {
        // Текущий урок ещё не пройден — блокируем переход к следующему
        nextEl.classList.add('lp-nav__btn--disabled');
        nextEl.href = '#';
        nextEl.addEventListener('click', (e) => e.preventDefault());
        $('#lpNavNextHint').textContent = `УРОК ${nextN} 🔒`;
        $('#lpNavNextTitle').textContent = 'Сначала пройди этот урок';
    } else {
        nextEl.href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${nextN}`;
        $('#lpNavNextHint').textContent = `УРОК ${nextN} →`;
        window.lessonLoader.loadLesson(tier, nextN).then(l => {
            $('#lpNavNextTitle').textContent = (l && l.title) || `Урок ${nextN}`;
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }
});
