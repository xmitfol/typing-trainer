/**
 * lesson-page.js — Phase 6 lesson reading.
 * URL: lesson.html?tier=tier1&lesson=6 (default: current lesson из localStorage)
 * Читает урок через lesson-loader, рендерит title, mentor greet, tips → narrative,
 * inline-exercise card (preview targeting `text`) и nav prev/next.
 * «Открыть тренажёр →» сохраняет {tier, lessonNumber} в currentLesson и ведёт на index.html.
 */
document.addEventListener('DOMContentLoaded', async function () {
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
    const mentorMeta = {
        anna:      { name: 'Анна',      role: '· ВАША НАСТАВНИЦА' },
        maxim:     { name: 'Максим',    role: '· ВАШ НАСТАВНИК' },
        knopych:   { name: 'Кнопыч',    role: '· ВАШ НАСТАВНИК-РОБОТ' },
        klavochka: { name: 'Клавочка',  role: '· ВАША НАСТАВНИЦА' }
    }[mentorId] || { name: 'Наставник', role: '· ВАШ НАСТАВНИК' };

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
    tips.forEach((tip, idx) => {
        // Каждый 3-й tip — callout, остальное — параграфы
        if (idx > 0 && idx % 3 === 0) {
            const callout = document.createElement('div');
            callout.className = 'lp-callout';
            callout.innerHTML = `
                <div class="lp-callout__icon">💡</div>
                <div>
                    <div class="lp-callout__title">Подсказка</div>
                    <div class="lp-callout__text">${escapeHtml(tip)}</div>
                </div>
            `;
            tipsContainer.appendChild(callout);
        } else {
            const p = document.createElement('p');
            p.className = 'lp-p' + (idx === 1 ? ' lp-p--drop' : '');
            p.textContent = tip;
            tipsContainer.appendChild(p);
        }
    });

    // Pull quote только когда есть >=4 tips (иначе перегружено)
    if (tips.length >= 4) {
        $('#lpPullQuote').hidden = false;
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
    $('#lpExerciseBadge').textContent = `УПРАЖНЕНИЕ · ${(lesson.new_keys || []).join(' ')}`.trim();
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

    // «Открыть тренажёр» сохраняет currentLesson и идёт в task.html
    $('#lpOpenTrainer').href = `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;
    $('#lpOpenTrainer').addEventListener('click', (e) => {
        try {
            localStorage.setItem(currentKey, JSON.stringify({
                tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString()
            }));
        } catch (err) {}
    });

    // «Выполнить задание →» в топбаре — прямой шорткат к практике (повтор/переделка)
    const topTask = $('#lpTopTask');
    if (topTask) topTask.href = `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;

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
