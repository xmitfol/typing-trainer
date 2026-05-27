/**
 * task.js — Phase 7 task execution (фокусный typing-режим).
 * URL: task.html?tier=tier1&lesson=N (по умолчанию — currentLesson).
 * Standalone typing engine — без main.js / virtual keyboard.
 *   - Загрузка урока через lesson-loader
 *   - Реалтайм отслеживание typed/errors/wpm/time
 *   - Подсветка символов: done / current / error
 *   - При завершении (typed.length == target.length) → SuccessScreen variant
 *   - Сохранение прогресса в lessonProgress
 */
document.addEventListener('DOMContentLoaded', async function () {
    const $ = (sel) => document.querySelector(sel);
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson';

    function readJSON(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
    function writeJSON(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }

    const profile = readJSON(profileKey);
    if (!profile || !profile.onboardingCompleted || !profile.name) {
        window.location.href = 'index.html';
        return;
    }
    const progress = readJSON(progressKey) || {};
    const currentLesson = readJSON(currentKey) || {};

    function pickTier(prof) {
        const lang = prof.language || 'ru';
        const ch = prof.character;
        if (lang === 'en') {
            if (ch === 'knopych')   return 'en_teen';
            if (ch === 'klavochka') return 'en_kids';
            return 'en_tier1';
        }
        if (ch === 'knopych')   return 'ru_teen';
        if (ch === 'klavochka') return 'ru_kids';
        return 'tier1';
    }

    // ─── Parse URL ───────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier') || currentLesson.tier || pickTier(profile);
    const lessonNum = parseInt(params.get('lesson'), 10) || currentLesson.lessonNumber || 1;
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const totalLessons = counts[tier] || 99;

    // ─── Mentor setup ────────────────────────────────────────────
    const mentorId = profile.character || (profile.audience === 'teen' ? 'knopych' : profile.audience === 'kid' ? 'klavochka' : 'anna');
    if (window.portraits && window.portraits.mentor) {
        $('#tpMentorPortrait').innerHTML = window.portraits.mentor(mentorId, 80);
        $('#tpSuccessAvatar').innerHTML = window.portraits.mentor(mentorId, 170);
    }

    // ─── Fetch lesson ────────────────────────────────────────────
    if (!window.lessonLoader) {
        console.error('lesson-loader не готов');
        return;
    }
    const lesson = await window.lessonLoader.loadLesson(tier, lessonNum);
    if (!lesson || !lesson.text) {
        $('#tpTarget').textContent = `Урок ${lessonNum} не загружен`;
        return;
    }

    const targetText = lesson.text;
    const targetLen = targetText.length;
    const errorLimit = Number.isFinite(lesson.error_limit) ? lesson.error_limit : 99;
    const targetWpm = Number.isFinite(lesson.target_wpm) ? lesson.target_wpm : 10;

    // Module + lesson number в формате "M.L" (M = phase, L = relative)
    const moduleN = lesson.phase || 1;
    const relN = lessonNum; // упрощение: показываем глобальный номер
    $('#tpExerciseNum').textContent = `${moduleN}.${relN}`;
    $('#tpSuccessNum').textContent  = `${moduleN}.${relN}`;

    // Initial mentor tip из lesson.character_tips
    const initTip = (lesson.character_tips && lesson.character_tips[mentorId])
        || `Печатай ровно. Цель: ${targetWpm} зн/мин, допустимо ошибок: ${errorLimit}.`;
    $('#tpMentorTip').textContent = initTip;
    $('#tpMentorHint').textContent = `Указательные пальцы — твои якоря на буквах А и О.`;
    $('#tpMentorHint').hidden = false;

    // Previous best from progress
    const prevBest = progress[String(lessonNum)] || null;
    if (prevBest) {
        if (prevBest.bestWPM)  $('#tpBestSpeed').textContent = Math.round(prevBest.bestWPM);
        if (prevBest.bestTime) $('#tpBestTime').textContent = formatTime(prevBest.bestTime);
    }

    // ─── Render target chars ─────────────────────────────────────
    const targetEl = $('#tpTarget');
    targetEl.innerHTML = '';
    const charSpans = [];
    for (let i = 0; i < targetLen; i++) {
        const span = document.createElement('span');
        span.className = 'tp-target__char';
        span.textContent = targetText[i] === ' ' ? ' ' : targetText[i];
        targetEl.appendChild(span);
        charSpans.push(span);
    }
    updateCharStates(0);

    function updateCharStates(typedLen, errorAt = -1) {
        for (let i = 0; i < charSpans.length; i++) {
            const cls = 'tp-target__char';
            if (i < typedLen) charSpans[i].className = cls + ' tp-target__char--done';
            else if (i === errorAt) charSpans[i].className = cls + ' tp-target__char--err';
            else if (i === typedLen) charSpans[i].className = cls + ' tp-target__char--cur';
            else charSpans[i].className = cls;
        }
    }

    // ─── State + input ───────────────────────────────────────────
    const state = {
        typed: '',
        errors: 0,
        startTime: null,
        elapsedMs: 0,
        attempt: 1,
        done: false,
        timer: null
    };
    $('#tpProgressCount').textContent = `0/${targetLen}`;

    const hidden = $('#tpHiddenInput');
    hidden.focus();
    document.addEventListener('click', (e) => {
        // не перехватываем клики по ссылкам/кнопкам — иначе success buttons не работают
        if (state.done) return;
        if (e.target.closest('a, button')) return;
        hidden.focus();
    });

    hidden.addEventListener('input', (e) => {
        if (state.done) { e.target.value = state.typed; return; }
        const val = e.target.value;
        if (val.length > targetLen) { e.target.value = val.slice(0, targetLen); return; }

        // Старт таймера на первом символе
        if (state.startTime === null && val.length > 0) {
            state.startTime = Date.now();
            state.timer = setInterval(tick, 200);
        }

        // Найти новые символы и проверить
        const oldLen = state.typed.length;
        if (val.length > oldLen) {
            for (let i = oldLen; i < val.length; i++) {
                if (val[i] !== targetText[i]) {
                    state.errors++;
                    // Подсветить ошибку, но позицию не двигаем — пусть пользователь корректирует
                    updateCharStates(oldLen, i);
                    // Откатить input до правильного состояния
                    e.target.value = state.typed;
                    flashMentorOnError();
                    return;
                }
            }
        }
        state.typed = val;
        updateCharStates(state.typed.length);
        updateProgress();

        if (state.typed.length === targetLen) {
            finish();
        }
    });

    function flashMentorOnError() {
        // На каждой пятой ошибке — обновляем mentor tip
        if (state.errors > 0 && state.errors % 5 === 0) {
            const tips = [
                'Не торопись — точность важнее скорости.',
                'Глубокий вдох. Ещё раз медленно.',
                'Расслабь плечи. Пальцы лёгкие.',
                'Смотри на текст, не на клавиатуру.'
            ];
            $('#tpMentorTip').textContent = tips[(state.errors / 5 - 1) % tips.length];
        }
    }

    function tick() {
        if (state.done) return;
        state.elapsedMs = Date.now() - state.startTime;
        $('#tpTime').textContent = formatTime(state.elapsedMs / 1000);
        const wpm = computeWpm();
        $('#tpSpeed').textContent = wpm;
    }

    function computeWpm() {
        if (!state.elapsedMs) return 0;
        const minutes = state.elapsedMs / 60000;
        const cps = state.typed.length / minutes;
        return Math.round(cps);
    }

    function formatTime(secs) {
        const s = Math.round(secs);
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    function updateProgress() {
        const pct = Math.round((state.typed.length / targetLen) * 100);
        $('#tpProgressFill').style.width = pct + '%';
        $('#tpProgressCount').textContent = `${state.typed.length}/${targetLen}`;
    }

    // ─── Finish & success screen ─────────────────────────────────
    function finish() {
        state.done = true;
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        const totalSec = state.elapsedMs / 1000;
        const wpm = computeWpm();
        const accuracy = state.errors === 0
            ? 100
            : Math.max(0, Math.round(((state.typed.length - state.errors) / state.typed.length) * 100));

        // Звёзды по той же шкале что в design (по ошибкам)
        const stars = state.errors === 0 ? 5
                    : state.errors <= 2 ? 4
                    : state.errors <= 5 ? 3
                    : state.errors <= 10 ? 2
                    : 1;

        // Save progress (best только если улучшение)
        const prev = progress[String(lessonNum)] || {};
        const newProg = {
            stars: Math.max(stars, prev.stars || 0),
            bestWPM: Math.max(wpm, prev.bestWPM || 0),
            bestAccuracy: Math.max(accuracy, prev.bestAccuracy || 0),
            bestTime: prev.bestTime ? Math.min(totalSec, prev.bestTime) : totalSec,
            completedAt: new Date().toISOString()
        };
        progress[String(lessonNum)] = newProg;
        writeJSON(progressKey, progress);
        writeJSON(currentKey, { tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString() });

        // Populate success screen
        $('#tpSuccessAttempt').textContent = state.attempt;
        $('#tpFinalTime').textContent = formatTime(totalSec);
        $('#tpFinalSpeed').textContent = wpm;
        $('#tpFinalBestTime').textContent = formatTime(newProg.bestTime);
        $('#tpFinalBestSpeed').textContent = Math.round(newProg.bestWPM);
        $('#tpSuccessGrade').textContent = `${stars}.0 / 5.0 · ${qualLabel(stars)}`;

        // Stars in success screen
        const starsEl = $('#tpSuccessStars');
        starsEl.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const on = i <= stars ? ' tp-star--on' : '';
            starsEl.innerHTML += `<svg class="tp-star${on}" viewBox="0 0 14 14"><path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z"/></svg>`;
        }

        // Final mentor message
        const successTips = {
            5: { title: 'Идеально.',     lead: `Без единой ошибки. ${wpm} зн/мин — крепкий результат. Идём дальше.` },
            4: { title: 'Всё верно.',    lead: `${state.errors} ошибки — норма для этого уровня. Скорость ${wpm} зн/мин.` },
            3: { title: 'Сойдёт.',       lead: `${state.errors} ошибок — рекомендую повторить, чтобы закрепить ритм.` },
            2: { title: 'Можно лучше.',  lead: `Слишком много ошибок (${state.errors}). Повторим без спешки.` },
            1: { title: 'Повторим?',     lead: `Не страшно. Глубокий вдох — и заново, точнее.` }
        };
        const msg = successTips[stars];
        $('#tpSuccessTitle').textContent = msg.title;
        $('#tpSuccessLead').textContent  = msg.lead;
        $('#tpMentorTip').textContent = `Точность ${accuracy}%, ритм ${wpm} зн/мин. ${stars >= 4 ? 'Закрепи и двигайся дальше.' : 'Стоит повторить для закрепления.'}`;
        $('#tpMentorHint').textContent = stars >= 4
            ? 'Совет: на следующей попытке можно чуть ускориться.'
            : 'Совет: вернись к этому упражнению — без спешки.';

        // Wire success buttons
        $('#tpSuccessRetry').addEventListener('click', (e) => {
            e.preventDefault();
            state.attempt++;
            location.reload();
        });
        const nextN = lessonNum + 1;
        const nextHref = nextN <= totalLessons ? `task.html?tier=${encodeURIComponent(tier)}&lesson=${nextN}` : 'course.html';
        const nextEl = $('#tpSuccessNext');
        nextEl.href = nextHref;
        nextEl.querySelector('span') || (nextEl.textContent = nextN <= totalLessons ? `Продолжить · ${moduleN}.${nextN} →` : 'К списку уроков →');

        // Show success screen
        document.body.classList.add('task-page--done');
    }

    function qualLabel(stars) {
        return { 5: 'превосходно', 4: 'отлично', 3: 'можно лучше', 2: 'удовлетворительно', 1: 'плохо' }[stars] || '—';
    }

    // ─── Retry ───────────────────────────────────────────────────
    $('#tpRetry').addEventListener('click', () => {
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        state.attempt++;
        state.typed = '';
        state.errors = 0;
        state.startTime = null;
        state.elapsedMs = 0;
        state.done = false;
        hidden.value = '';
        $('#tpAttempt').textContent = state.attempt;
        $('#tpTime').textContent = '00:00';
        $('#tpSpeed').textContent = '0';
        updateProgress();
        updateCharStates(0);
        hidden.focus();
    });
});
