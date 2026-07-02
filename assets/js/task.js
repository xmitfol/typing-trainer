/**
 * task.js — экран упражнения (Phase 7 + клавиатура из дизайн-handoff).
 * Клавиатура <typing-keyboard> (designer) + НАШИ данные/guard'ы:
 *   - router-guard (профиль) подключён отдельным скриптом
 *   - линейная прогрессия: прямой URL на закрытый урок → редирект на lesson.html
 *   - реальный урок через lesson-loader (data/lessons/{tier}/lesson_NN.json)
 *   - наставник из profile.character, цитата из lesson.character_tips
 *   - сохранение lessonProgress (звёзды по ошибкам) — открывает следующий урок
 *   - success «Продолжить» → lesson.html?lesson=N+1 (теория следующего)
 * URL: task.html?tier=tier1&lesson=N
 */
document.addEventListener('DOMContentLoaded', async function () {
    const $ = (s) => document.getElementById(s);
    if (window.i18n) { try { await window.i18n.init(); } catch (e) {} }
    const t = (k, v) => (window.i18n ? window.i18n.t(k, v) : k);
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson';

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const writeJSON = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };

    const profile = readJSON(profileKey);
    if (!profile || !profile.onboardingCompleted || !profile.name) { window.location.href = 'index.html'; return; }
    const currentLesson = readJSON(currentKey) || {};
    // Прогресс — через apiClient (useApi=true → сервер по активному тиру, иначе LS).
    // Нужен для линейной-прогрессии гейта ниже и для рендера отчёта. currentLesson
    // читаем первым: apiClient разворачивает серверный прогресс по currentLesson.tier.
    const progress = (window.apiClient
        ? await window.apiClient.getProgress().catch(() => readJSON(progressKey))
        : readJSON(progressKey)) || {};

    function pickTier(p) {
        const lang = p.language || 'ru';
        const ch = p.character;
        if (lang === 'en') { if (ch === 'knopych') return 'en_teen'; if (ch === 'klavochka') return 'en_kids'; return 'en_tier1'; }
        if (ch === 'knopych') return 'ru_teen'; if (ch === 'klavochka') return 'ru_kids'; return 'tier1';
    }

    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier') || currentLesson.tier || pickTier(profile);
    const lessonNum = parseInt(params.get('lesson'), 10) || currentLesson.lessonNumber || 1;
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const totalLessons = counts[tier] || 99;
    const isUserLesson = tier === 'user';   // пользовательский урок из Lesson Builder

    // ─── Линейная прогрессия: прямой URL на закрытое упражнение → теория доступного ───
    // Для tier=user (свои уроки) — обход прогрессии: линейности здесь нет, любой урок открыт.
    if (!isUserLesson) {
        let firstUncompleted = totalLessons;
        for (let n = 1; n <= totalLessons; n++) {
            if (!(progress[String(n)] && progress[String(n)].stars > 0)) { firstUncompleted = n; break; }
        }
        const lessonDone = !!(progress[String(lessonNum)] && progress[String(lessonNum)].stars > 0);
        if (!lessonDone && lessonNum !== firstUncompleted) {
            window.location.replace(`lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`);
            return;
        }
    }

    // ─── DOM refs ────────────────────────────────────────────────
    const kb = $('kb'), capture = $('capture'), targetEl = $('target');
    const fillEl = $('progress-fill'), countEl = $('progress-count');
    const numEl = $('task-num'), attemptEl = $('attempt-n');
    const statTime = $('stat-time'), statSpeed = $('stat-speed'), statAcc = $('stat-acc');
    const legendEl = $('legend'), tipEl = $('mentor-tip'), hintEl = $('mentor-hint'), avatarEl = $('mentor-avatar');
    const successEl = $('success'), taskBody = $('task-body'), toolbar = $('toolbar'), kbStage = $('kb-stage');

    // ─── Mentor ──────────────────────────────────────────────────
    const mentorId = profile.character || (profile.audience === 'teen' ? 'knopych' : profile.audience === 'kid' ? 'klavochka' : 'anna');
    if (window.portraits && window.portraits.mentor) avatarEl.innerHTML = window.portraits.mentor(mentorId, 80);

    // CharacterSystem — динамические реплики в bubble на ключевых состояниях
    // (lessonStart / tooManyErrors / lessonCompleteSuccess / errorLimitExceeded).
    // Дизайн: bubble один, текст меняется по событиям (см. design_handoff_full/reference/task/task.jsx).
    let mentorChar = window.characterSystem || null;
    if (!mentorChar && window.CharacterSystem) {
        mentorChar = new window.CharacterSystem();
        window.characterSystem = mentorChar;
    }
    if (mentorChar && (!mentorChar.character || mentorChar.character.id !== mentorId)) {
        try { await mentorChar.loadCharacter(mentorId); } catch (e) { /* fallback default */ }
    }
    function setBubble(situation, vars, fallback) {
        const msg = (mentorChar && mentorChar.getMessage) ? mentorChar.getMessage(situation, vars) : '';
        tipEl.textContent = msg || fallback || '';
        hintEl.textContent = '';
    }

    // ─── Finger legend ───────────────────────────────────────────
    const FCOLOR = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };
    legendEl.innerHTML = [
        ['pink', t('task.fingerLegend.pinky')],
        ['orange', t('task.fingerLegend.ring')],
        ['green', t('task.fingerLegend.middle')],
        ['blue', t('task.fingerLegend.indexL')],
        ['indigo', t('task.fingerLegend.indexR')],
        ['purple', t('task.fingerLegend.thumb')]
    ].map(([f, l]) => `<div class="legend__item"><span class="legend__chip" style="background:${FCOLOR[f]}"></span><span>${l}</span></div>`).join('');

    // ─── Load lesson ─────────────────────────────────────────────
    // tier=user — урок хранится в localStorage['typing_trainer_user_lessons'] (Lesson Builder).
    // Иначе — стандартный curriculum через lesson-loader (data/lessons/{tier}/lesson_NN.json).
    let lesson;
    if (isUserLesson) {
        const userList = readJSON('typing_trainer_user_lessons') || [];
        const userLesson = userList.find(l => l.id === lessonNum);
        if (!userLesson) {
            targetEl.textContent = t('task.loadFail');
            return;
        }
        lesson = {
            id: userLesson.id,
            title: userLesson.title || 'Без названия',
            text: userLesson.text,
            target_wpm: userLesson.target_wpm || 30,
            error_limit: Number.isFinite(userLesson.error_limit) ? userLesson.error_limit : 2,
            phase: 0,
            finger_focus: t('builder.fingerFocus'),
        };
    } else {
        lesson = await window.lessonLoader.loadLesson(tier, lessonNum);
    }
    if (!lesson || !lesson.text) { targetEl.textContent = `Урок ${lessonNum} не загружен`; return; }

    // ─── Гайдед-шаг (?exercise=N) ────────────────────────────────
    // Тренируемся на тексте отдельного шага урока, а не на всём уроке. Финиш
    // такого шага НЕ пишет lesson_progress (звёзды) — лишь отмечает шаг
    // пройденным (exerciseProgress) и возвращает в теорию. placement-шаг — это
    // обычный drill на якорных клавишах (А/О = F/J), отличается лишь инструкцией.
    const exerciseIdx = parseInt(params.get('exercise'), 10) || 0;
    let currentStep = null, stepMode = false, totalSteps = 0;
    if (exerciseIdx > 0 && lesson.guided && Array.isArray(lesson.tips)) {
        const steps = lesson.tips.filter(tp => tp && tp.type === 'step');
        totalSteps = steps.length;
        currentStep = steps[exerciseIdx - 1] || null;
        stepMode = !!(currentStep && currentStep.target);
    }
    // Прямой URL на шаг, чей предыдущий ещё не пройден → назад в теорию.
    if (stepMode && exerciseIdx > 1 && window.exerciseProgress
        && !window.exerciseProgress.isStepDone(tier, lessonNum, exerciseIdx - 1)) {
        window.location.replace(`lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`);
        return;
    }

    let targetText = stepMode ? String(currentStep.target) : lesson.text;
    const moduleN = lesson.phase || 1;
    const exId = `${moduleN}.${lessonNum}`;
    numEl.textContent = exId;

    // lessonStart: куратор урока (character_tips[mentorId]) → fallback character-system → generic
    const curatedTip = (lesson.character_tips && lesson.character_tips[mentorId]) || null;
    const csLessonStart = mentorChar && mentorChar.getMessage
        ? mentorChar.getMessage('lessonStart', { name: profile.name || '', level: lesson.title || '' })
        : '';
    const initTip = curatedTip
        || csLessonStart
        || `Печатай ровно. Цель: ${lesson.target_wpm || '—'} зн/мин, допустимо ошибок: ${Number.isFinite(lesson.error_limit) ? lesson.error_limit : '—'}.`;
    tipEl.textContent = initTip;
    hintEl.textContent = lesson.finger_focus || 'Указательные пальцы — твои якоря на буквах А и О.';
    // i18n с явным фолбэком (t() возвращает ключ, если перевода нет).
    const tf = (k, fb) => { const v = t(k); return (v && v !== k) ? v : fb; };
    // В режиме шага — инструкция шага вместо общей подсказки урока.
    if (stepMode) {
        tipEl.textContent = currentStep.hint || initTip;
        hintEl.textContent = currentStep.kind === 'placement'
            ? 'Не смотри на руки — нащупай клавиши пальцами.'
            : (currentStep.hint || '');
    }
    // Дефолтные тексты bubble — чтобы вернуть после временной подсказки о раскладке.
    const bubbleDefaultTip = tipEl.textContent;
    const bubbleDefaultHint = hintEl.textContent;
    let layoutWarned = false;

    // ─── State ───────────────────────────────────────────────────
    let typed = 0, errors = 0, attempt = 1, startTime = null, timer = null, done = false;
    let tooManyShown = false;  // one-shot per attempt — наставник предупреждает один раз
    const keyErrors = {};      // ошибки по клавишам (ожидаемый символ → счётчик) — для коуч-разбора
    const errorPositions = new Set();  // позиции промахов — подчёркиваются до конца захода
    const errorLimit = Number.isFinite(lesson.error_limit) ? lesson.error_limit : 2;
    const halfErrorLimit = Math.max(1, Math.ceil(errorLimit / 2));

    // Ритмичность: храним интервалы между нажатиями (мс), на финише считаем CV (std/mean).
    // rhythm% = max(0, 100 - cv*100). Меньше 0 → 0, выше 100 не может выйти.
    let lastKeyTime = 0;
    const keyIntervals = [];
    function calcRhythm() {
        if (keyIntervals.length < 2) return null;
        const mean = keyIntervals.reduce((a, b) => a + b, 0) / keyIntervals.length;
        if (mean <= 0) return null;
        const variance = keyIntervals.reduce((a, b) => a + (b - mean) ** 2, 0) / keyIntervals.length;
        const cv = Math.sqrt(variance) / mean;  // coefficient of variation
        return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
    }
    // Настройки тулбара (из профиля; дефолты: подсветка вкл, звук/метроном выкл, зум 100)
    let fingerHint = profile.fingerHint !== false;
    let soundOn = profile.keySound === true;
    let metroOn = profile.metronome === true;

    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }

    // Показать toast о разблокировке достижения. Контейнер создаётся ленивo.
    function showUnlockToast(ach) {
        let container = document.querySelector('.unlock-toasts');
        if (!container) {
            container = document.createElement('div');
            container.className = 'unlock-toasts';
            document.body.appendChild(container);
        }
        const t = document.createElement('div');
        t.className = 'unlock-toast';
        t.innerHTML = `
            <div class="unlock-toast__icon">${ach.icon}</div>
            <div class="unlock-toast__body">
                <div class="unlock-toast__head">★ ДОСТИЖЕНИЕ</div>
                <div class="unlock-toast__label">${escapeHtml(ach.label)}</div>
                <div class="unlock-toast__desc">${escapeHtml(ach.desc)}</div>
            </div>
        `;
        container.appendChild(t);
        setTimeout(() => {
            t.classList.add('unlock-toast--leaving');
            setTimeout(() => t.remove(), 300);
        }, 4500);
    }

    // ─── Раздельный пробел: какой большой палец жмёт ────────────────
    // Правило: пробел жмём большим пальцем руки, ПРОТИВОПОЛОЖНОЙ последней
    // букве (набрал левой → пробел правым, и наоборот). Совпадает со
    // space_side в lesson.text_sequence. RU + EN раскладки (кириллица и
    // латиница — разные кодпоинты, в Set'ах не конфликтуют).
    const LEFT_HAND = new Set('ёйцукефывапячсмиqwertasdfgzxcvb'.split(''));
    const RIGHT_HAND = new Set('нгшщзхъролджэтьбюyuiophjklnm'.split(''));
    function spaceSideFor(prevChar) {
        if (!prevChar) return 'right';
        const c = prevChar.toLowerCase();
        if (LEFT_HAND.has(c)) return 'right';
        if (RIGHT_HAND.has(c)) return 'left';
        return 'right';  // неизвестная клавиша — дефолт правый палец
    }

    // ─── Render target (слова — неразрывные, перенос целиком) ─────
    // Карта символ → палец (ЙЦУКЕН) — подсветка ТЕКУЩЕГО символа в цвет его пальца:
    // взгляд связывает «что печатать» → «каким пальцем» → «какая клавиша горит».
    const CHAR_FINGER = {
        'й': 'pink', 'ф': 'pink', 'я': 'pink', 'ё': 'pink',
        'ц': 'orange', 'ы': 'orange', 'ч': 'orange',
        'у': 'green', 'в': 'green', 'с': 'green',
        'к': 'blue', 'а': 'blue', 'м': 'blue', 'е': 'blue', 'п': 'blue', 'и': 'blue',
        'н': 'indigo', 'р': 'indigo', 'т': 'indigo', 'г': 'indigo', 'о': 'indigo', 'ь': 'indigo',
        'ш': 'green', 'л': 'green', 'б': 'green',
        'щ': 'orange', 'д': 'orange', 'ю': 'orange',
        'з': 'pink', 'ж': 'pink', 'х': 'pink', 'э': 'pink', 'ъ': 'pink',
        ' ': 'purple',
    };

    function renderTarget() {
        let html = '', openWord = false;
        for (let i = 0; i < targetText.length; i++) {
            const ch = targetText[i];
            let cls = i < typed ? 'done' : (i === typed && !done ? 'cur' : '');
            if (errorPositions.has(i)) cls += ' char--erred';  // место промаха — до конца захода
            const fin = (i === typed && !done) ? CHAR_FINGER[ch.toLowerCase()] : null;
            const fattr = fin ? ` data-finger="${fin}"` : '';
            if (ch === ' ') {
                if (openWord) { html += '</span>'; openWord = false; }
                html += `<span class="space ${cls}"${fattr}> </span>`;
            } else {
                if (!openWord) { html += '<span class="word">'; openWord = true; }
                html += `<span class="${cls}"${fattr}>${escapeHtml(ch)}</span>`;
            }
        }
        if (openWord) html += '</span>';
        targetEl.innerHTML = `<div class="target__inner">${html}</div>`;
        countEl.textContent = `${typed}/${targetText.length}`;
        fillEl.style.width = `${(typed / targetText.length) * 100}%`;

        const nextCh = targetText[typed];
        // hideIndicator (toolbar) глушит подсветку клавиш + текущего символа.
        if (!fingerHint || hideIndicator) { kb.removeAttribute('highlight-char'); kb.removeAttribute('space-half'); return; }
        if (nextCh === ' ') {
            kb.setAttribute('highlight-char', ' ');
            // Подсказка: какой большой палец — противоположный последней букве.
            kb.setAttribute('space-half', spaceSideFor(targetText[typed - 1]));
        } else {
            kb.removeAttribute('space-half');
            if (nextCh) kb.setAttribute('highlight-char', nextCh);
            else kb.removeAttribute('highlight-char');
        }
    }

    // ─── Metrics ─────────────────────────────────────────────────
    // NET WPM: считаем только верные символы (typed-errors), не gross. Иначе
    // массовый набор неверных клавиш «накручивает» зн/мин и срабатывают ачивки.
    // Effective time floor: для урока на N символов минимум max(2s, N*0.1s) —
    // отсекает синтетический/автоматизированный ввод, у людей на символ уходит
    // ≥ ~100ms (top профи ~600 зн/мин). Floor не влияет на реальное чтение
    // секундомера (он показывает elapsed как есть).
    function effElapsed(elapsed) {
        const minByLen = (targetText && targetText.length) ? targetText.length * 0.1 : 0;
        return Math.max(elapsed, 2.0, minByLen);
    }
    // Строгий режим: курсор двигается только на верной клавише, поэтому typed =
    // число верно набранных символов; errors = неверные попытки (могут копиться
    // на одной позиции). WPM считаем по typed; accuracy = typed / (typed+errors).
    function calcWpm(elapsed) {
        const eff = effElapsed(elapsed);
        return eff > 0 ? Math.round(typed / (eff / 60)) : 0;
    }
    function calcAcc() {
        const total = typed + errors;
        return total > 0 ? Math.max(0, Math.round((typed / total) * 100)) : 100;
    }

    function updateStats() {
        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
        const m = Math.floor(elapsed / 60), s = Math.floor(elapsed % 60);
        statTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const wpmNow = calcWpm(elapsed);
        statSpeed.innerHTML = `${wpmNow} <span style="font-size:11px;color:var(--faint)">зн/мин</span>`;
        statAcc.innerHTML = `${calcAcc()}<span style="font-size:11px;color:var(--faint)">%</span>`;
    }

    // ─── Caps Lock индикатор ─────────────────────────────────────
    const capsBadge = $('caps-badge');
    function syncCapsBadge(e) {
        if (!capsBadge || !e.getModifierState) return;
        capsBadge.classList.toggle('caps-badge--on', e.getModifierState('CapsLock'));
    }

    // ─── Input ───────────────────────────────────────────────────
    function handleKey(e) {
        if (done) { syncCapsBadge(e); return; }
        // Caps Lock state — обновляем на любом keydown
        syncCapsBadge(e);

        // Игнорируем автоповтор (зажатая клавиша): одно физическое нажатие =
        // один шаг. Иначе удержание «пролистывает» упражнение до конца.
        if (e.repeat) { e.preventDefault(); return; }

        if (e.key === 'Backspace') {
            if (typed > 0) { typed--; renderTarget(); updateStats(); }
            if (e.code) kb.flashActive(e.code, 140);
            e.preventDefault(); return;
        }
        if (e.key.length !== 1) {
            // Модификатор/спец-клавиша (Shift/Caps/Ctrl/Alt/Tab/Enter/стрелки/F-keys):
            // только визуальный feedback — юзер видит работу пальца.
            if (e.code) kb.flashActive(e.code, 200);
            // не даём Tab сбросить фокус с capture
            if (e.key === 'Tab') e.preventDefault();
            return;
        }
        e.preventDefault();

        if (!startTime) { startTime = Date.now(); timer = setInterval(updateStats, 500); }

        // Ритмичность: интервал с предыдущего нажатия. Игнорируем outliers >2000ms
        // (пауза/мысль) — они портят CV без отражения реального ритма.
        const now = Date.now();
        if (lastKeyTime > 0) {
            const dt = now - lastKeyTime;
            if (dt > 20 && dt < 2000) keyIntervals.push(dt);
        }
        lastKeyTime = now;

        const expected = targetText[typed];
        if (e.key === expected) {
            // Верная клавиша — двигаем курсор.
            if (layoutWarned) {  // раскладку починили — вернуть обычную подсказку
                layoutWarned = false;
                tipEl.textContent = bubbleDefaultTip;
                hintEl.textContent = bubbleDefaultHint;
            }
            kb.flashActive(e.code, 140);
            typed++;
            renderTarget();
            updateStats();
            if (typed >= targetText.length) finishExercise();
        } else {
            // Не та раскладка: ждём кириллицу, а пришла латиница (или наоборот).
            // Физическая клавиша при этом верная — это не ошибка набора, а раскладка,
            // поэтому подсказываем и НЕ штрафуем (не трогаем errors/keyErrors).
            const isLatin = /^[a-zA-Z]$/.test(e.key);
            const isCyr = /^[а-яёА-ЯЁ]$/.test(e.key);
            const expectCyr = /[а-яё]/i.test(expected);
            const expectLatin = /[a-z]/i.test(expected);
            if ((expectCyr && isLatin) || (expectLatin && isCyr)) {
                if (!layoutWarned) {
                    layoutWarned = true;
                    const wrong = expectCyr ? 'английская' : 'русская';
                    const right = expectCyr ? 'русскую' : 'английскую';
                    tipEl.textContent = (profile.name ? profile.name + ', к' : 'К') +
                        `ажется, включена ${wrong} раскладка.`;
                    hintEl.textContent = `Переключись на ${right} раскладку (Alt+Shift или Win+Пробел) и продолжай.`;
                }
                return;
            }
            // Тот же символ, но заглавный (буква верная, регистр нет) → Caps Lock / Shift.
            // Не штрафуем — подсказываем выключить.
            if (e.key.length === 1 && e.key !== expected &&
                e.key.toLowerCase() === String(expected).toLowerCase()) {
                if (!layoutWarned) {
                    layoutWarned = true;
                    const caps = e.getModifierState && e.getModifierState('CapsLock');
                    tipEl.textContent = (profile.name ? profile.name + ', т' : 'Т') +
                        (caps ? 'ы набираешь заглавными — включён Caps Lock.' : 'ы набираешь заглавными буквами.');
                    hintEl.textContent = caps
                        ? 'Выключи Caps Lock — в уроке строчные буквы.'
                        : 'В уроке строчные буквы — проверь Caps Lock и Shift.';
                }
                return;
            }
            // Неверная клавиша — стоим на месте, ждём правильную. Считаем ошибку.
            kb.flashError(e.code);
            errorPositions.add(typed);  // отметить место промаха (останется до конца захода)
            const curEl = targetEl.querySelector('.cur');
            if (curEl) curEl.classList.add('char--erred');
            errors++;
            keyErrors[expected] = (keyErrors[expected] || 0) + 1;  // для коуч-разбора
            // Наставник реагирует один раз, когда ошибок становится больше половины лимита
            if (!tooManyShown && errors > halfErrorLimit) {
                tooManyShown = true;
                setBubble('tooManyErrors',
                    { name: profile.name || '', errors, limit: errorLimit },
                    'Не спеши — лучше медленно, но точно.');
            }
            updateStats();
        }
    }

    // ─── Finish ──────────────────────────────────────────────────
    // Гайдед-шаг: отмечаем пройденным, без звёзд/прогресса урока, возврат в теорию.
    function finishStep() {
        done = true;
        clearInterval(timer);
        if (window.exerciseProgress) window.exerciseProgress.markStepDone(tier, lessonNum, exerciseIdx);

        $('success-num').textContent = exId;
        $('success-avatar').innerHTML = window.portraits ? window.portraits.mentor(mentorId, 150) : '';
        $('final-grade').textContent = '✓';
        $('final-speed').textContent = '—';
        $('final-acc').textContent = '—';
        $('final-rhythm').textContent = '—';
        // Вариант 2 потока: последний шаг ведёт не назад к уроку, а на ФИНАЛЬНЫЙ
        // ЗАХОД (полный текст урока) → оттуда «Отчёт по уроку».
        const isLastStep = totalSteps > 0 && exerciseIdx >= totalSteps;
        const nextBtn = $('next-btn');
        if (isLastStep) {
            $('success-title').textContent = 'Все шаги пройдены!';
            $('success-msg').textContent = 'Отлично! Остался финальный заход — пройди урок целиком.';
            tipEl.textContent = (profile.name ? profile.name + ', в' : 'В') + 'се шаги позади! Теперь финальный заход на весь урок.';
            nextBtn.textContent = 'Финальный заход →';
            nextBtn.href = `task.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;
        } else {
            $('success-title').textContent = tf('task.stepDoneTitle', 'Шаг пройден');
            $('success-msg').textContent = tf('task.stepDoneMsg', 'Отлично! Вернись к уроку и переходи к следующему шагу.');
            // Прямой текст без шаблонных переменных: у шага нет оценки/точности,
            // поэтому НЕ используем реплику lessonCompleteSuccess (в ней {accuracy}).
            tipEl.textContent = (profile.name ? profile.name + ', ш' : 'Ш') + 'аг пройден! Возвращайся к уроку.';
            // Возврат к ПРОЙДЕННОМУ шагу на странице урока (не в начало текста).
            nextBtn.textContent = tf('task.backToLesson', '← Назад к уроку');
            nextBtn.href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}&step=${exerciseIdx}`;
        }
        hintEl.textContent = '';

        kb.removeAttribute('highlight-char');
        taskBody.classList.add('hide');
        toolbar.classList.add('hide');
        kbStage.classList.add('hide');
        successEl.classList.add('show');
        spawnConfetti();
        const nb = $('next-btn'); if (nb) nb.focus();  // фокус на кнопку — Enter продолжает
    }

    async function finishExercise() {
        if (stepMode) { finishStep(); return; }
        done = true;
        clearInterval(timer);
        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
        const wpm = calcWpm(elapsed);
        const acc = calcAcc();
        const stars = errors === 0 ? 5 : errors <= 2 ? 4 : errors <= 5 ? 3 : errors <= 10 ? 2 : 1;
        const rhythm = calcRhythm();

        // Детекция новых ачивок: snapshot earned-set ДО записи нового прогресса
        const historyKey = (window.Settings && window.Settings.get('storage.keys.testHistory', 'typing_trainer_test_history')) || 'typing_trainer_test_history';
        const historyArr = readJSON(historyKey) || [];
        let earnedBefore = new Set();
        if (window.achievements) {
            const statsBefore = window.achievements.computeStats(progress, historyArr, totalLessons);
            earnedBefore = window.achievements.earnedIds(window.achievements.getAchievements(statsBefore));
        }

        // Сохранить попытку через apiClient.saveAttempt: при useApi=true — атомарно
        // на сервере (POST /me/progress), при useApi=false/оффлайне — apiClient сам
        // пишет localStorage (progress + history) в той же форме, что писали раньше.
        // Свои уроки (tier=user) НЕ влияют на курс: не сохраняем ни на сервер, ни в LS.
        if (!isUserLesson) {
            // currentLesson — client-only навигационное состояние (не синкается на
            // сервер); пишем локально, чтобы dashboard/course знали «где юзер».
            writeJSON(currentKey, { tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString() });

            let saved = null;
            if (window.apiClient) {
                try {
                    saved = await window.apiClient.saveAttempt({
                        tier, lesson_num: lessonNum, wpm, accuracy: acc,
                        duration_ms: Math.round(elapsed * 1000), errors,
                        rhythm: rhythm == null ? null : rhythm,
                    });
                } catch (e) { saved = null; /* saveAttempt внутри уже сделал fallback; на всякий случай */ }
            }
            // Обновляем in-memory progress для рендера отчёта/ачивок. Сервер и local
            // возвращают {progress:{...best..}}; при промахе перечитываем из LS
            // (apiClient-local уже записал), иначе считаем локально как раньше.
            if (saved && saved.progress) {
                const sp = saved.progress;
                progress[String(lessonNum)] = {
                    stars: sp.stars, bestWPM: sp.bestWPM, bestAccuracy: sp.bestAccuracy,
                    bestTime: sp.bestTime, completedAt: sp.completedAt || new Date().toISOString(),
                };
            } else {
                const fresh = readJSON(progressKey);
                if (fresh && fresh[String(lessonNum)]) {
                    progress[String(lessonNum)] = fresh[String(lessonNum)];
                } else {
                    const prev = progress[String(lessonNum)] || {};
                    progress[String(lessonNum)] = {
                        stars: Math.max(stars, prev.stars || 0),
                        bestWPM: Math.min(1500, Math.max(wpm, prev.bestWPM || 0)),
                        bestAccuracy: Math.max(acc, prev.bestAccuracy || 0),
                        bestTime: prev.bestTime ? Math.min(elapsed, prev.bestTime) : elapsed,
                        completedAt: new Date().toISOString(),
                    };
                }
            }

            // Ачивки: снова читаем history из LS (saveAttempt-local туда добавил
            // запись; при useApi=true LS может быть пуст — тогда используем текущий
            // historyArr + синтетическую запись, чтобы клиентские toast'ы работали).
            const historyAfter = readJSON(historyKey) || historyArr.slice();
            if (window.apiClient && window.apiClient.getConfig().useApi &&
                historyAfter.length === historyArr.length) {
                historyAfter.push({ lesson: lessonNum, completedAt: new Date().toISOString(), duration: elapsed, wpm, accuracy: acc });
            }
            if (window.achievements) {
                const statsAfter = window.achievements.computeStats(progress, historyAfter, totalLessons);
                const allAfter = window.achievements.getAchievements(statsAfter);
                const earnedAfter = window.achievements.earnedIds(allAfter);
                const newlyEarned = allAfter.filter(a => earnedAfter.has(a.id) && !earnedBefore.has(a.id));
                newlyEarned.forEach((a, i) => setTimeout(() => showUnlockToast(a), i * 400));
            }
        }

        const passed = errors <= errorLimit;

        // Коуч-разбор (что хорошо / над чем поработать + топ-ошибка) + мотивация.
        let topKey = null, topN = 0;
        for (const k in keyErrors) {
            if (k !== ' ' && keyErrors[k] > topN) { topN = keyErrors[k]; topKey = k; }
        }
        const ca = window.coach
            ? window.coach.analyze({ accuracy: acc, wpm, rhythm, targetWpm: lesson.target_wpm, topMistakeKey: topKey })
            : { good: [], improve: [] };
        const quote = window.coach ? window.coach.motivate(mentorId, passed) : '';

        // Освоенные клавиши урока → [буква, палец] (CHAR_FINGER).
        const learnedKeys = (lesson.new_keys || [])
            .map(k => String(k).toLowerCase())
            .filter(k => k && k.trim() && k !== 'space')
            .map(k => [k, CHAR_FINGER[k] || 'blue']);
        const learnedTotal = (lesson.keys_trained || []).filter(k => k && k !== 'Space' && String(k).trim()).length;
        const isCyr = (lesson.new_keys || []).some(k => /[а-яё]/i.test(k)) || /[а-яё]/i.test(targetText);
        // Порог по звёздам (методспек дизайнера): < 3 звёзд → «с трудом».
        const state = stars >= 3 ? 'success' : 'struggle';

        // «Продолжить →» → назад к уроку (теория), читать дальше. Свои уроки → конструктор.
        const continueHref = isUserLesson
            ? 'builder.html'
            : `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;
        const mentorName = (mentorChar && mentorChar.character && mentorChar.character.name)
            || ({ anna: 'Анна', maxim: 'Максим', knopych: 'Кнопыч', klavochka: 'Клавочка' }[mentorId]) || '';

        // Богатый «Отчёт по уроку» (экран B). Конец ШАГА остаётся кратким (finishStep).
        const taskCardEl2 = document.querySelector('.task-card');
        const mentorEl = document.querySelector('.mentor');
        if (window.lessonSummary) {
            window.lessonSummary.render(successEl, {
                mentor: mentorId, mentorName,
                lessonNum, lessonTitle: lesson.title || `Урок ${lessonNum}`,
                keys: learnedKeys, learnedTotal, learnedAll: isCyr ? 33 : 26,
                stars, acc, rhythm: rhythm == null ? 0 : rhythm, speed: wpm,
                showSpeed: !isUserLesson && lessonNum >= 6,
                good: ca.good, work: ca.improve, quote,
                lesson: lessonNum, lessonsTotal: totalLessons,
                state, continueHref, attempt,
            });
            // Отчёт — самостоятельная карточка: убираем хром внешней .task-card
            // (двойной фон) и прячем плавающий бабл наставника (он есть в шапке отчёта).
            if (taskCardEl2) taskCardEl2.classList.add('report-mode');
            if (mentorEl) mentorEl.style.display = 'none';
            const rep = $('rep-retry');  // «Повторить» → вернуть тренажёр и сбросить заход
            if (rep) rep.addEventListener('click', () => {
                successEl.classList.remove('show');
                if (taskCardEl2) taskCardEl2.classList.remove('report-mode');
                if (mentorEl) mentorEl.style.display = '';
                taskBody.classList.remove('hide'); toolbar.classList.remove('hide'); kbStage.classList.remove('hide');
                reset();
            });
        }

        kb.removeAttribute('highlight-char');
        taskBody.classList.add('hide');
        toolbar.classList.add('hide');
        kbStage.classList.add('hide');
        successEl.classList.add('show');
        // Фокус на первичную кнопку («Продолжить»/«Повторить») — пользователь на
        // клавиатуре, пусть жмёт Enter, а не тянется к мыши. Tab циклит между кнопками.
        const primaryBtn = successEl.querySelector('.report-actions .btn--lg');
        if (primaryBtn) requestAnimationFrame(() => primaryBtn.focus());
    }

    function spawnConfetti() {
        const cont = $('confetti');
        if (!cont) return;
        cont.innerHTML = '';
        const COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];
        const N = 36;
        for (let i = 0; i < N; i++) {
            const p = document.createElement('span');
            p.className = 'confetti__p';
            p.style.left = `${Math.random() * 100}%`;
            p.style.background = COLORS[i % COLORS.length];
            p.style.animationDelay = `${Math.random() * 0.3}s`;
            p.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
            cont.appendChild(p);
        }
        // Cleanup через 4s (после самого долгого fall)
        setTimeout(() => { if (cont) cont.innerHTML = ''; }, 4000);
    }

    // ─── Buttons ─────────────────────────────────────────────────
    function reset() {
        typed = 0; errors = 0; startTime = null; done = false; clearInterval(timer);
        attempt++; attemptEl.textContent = attempt;
        statTime.textContent = '00:00';
        tooManyShown = false;
        errorPositions.clear();
        keyIntervals.length = 0; lastKeyTime = 0;
        const cf = $('confetti'); if (cf) cf.innerHTML = '';
        // Вернуть стартовую реплику наставника
        tipEl.textContent = initTip;
        hintEl.textContent = lesson.finger_focus || 'Указательные пальцы — твои якоря на буквах А и О.';
        renderTarget(); updateStats(); capture.focus();
    }
    $('restart-btn').addEventListener('click', reset);
    $('retry-btn').addEventListener('click', () => {
        successEl.classList.remove('show');
        taskBody.classList.remove('hide'); toolbar.classList.remove('hide'); kbStage.classList.remove('hide');
        reset();
    });

    $('task-close').href = isUserLesson
        ? 'builder.html'
        : `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;

    // ─── Настройки тулбара: запоминаем выбор пользователя ────────
    // Всё храним в профиле (keyboardType уже приходит из онбординга).
    function saveKbPref(patch) {
        Object.assign(profile, patch);
        writeJSON(profileKey, profile);
    }
    // Подбор unit под ширину экрана: на мобильных уменьшаем чтобы влезало без скролла.
    // classic ~24×unit, laptop ~16×unit, ergonomic ~27×unit (см. README клавиатуры).
    function pickUnit(type) {
        const w = Math.max(320, document.documentElement.clientWidth - 60);
        if (type === 'ergonomic') return Math.max(18, Math.min(38, Math.floor(w / 27)));
        if (type === 'laptop')    return Math.max(20, Math.min(44, Math.floor(w / 16)));
        return Math.max(14, Math.min(40, Math.floor(w / 24)));   // classic
    }
    function applyType(v) {
        kb.setAttribute('type', v);
        const u = pickUnit(v);
        kb.setAttribute('unit', String(u));
        if (v === 'ergonomic') { kb.setAttribute('gap', '52'); kb.setAttribute('angle', '10'); }
    }
    // Re-apply на resize/rotation — debounced
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { applyType(kb.getAttribute('type') || 'classic'); }, 150);
    });

    const typeSel = $('type-select');
    const layoutSel = $('layout-select');
    const fingerBtn = $('finger-hint-btn');
    const soundBtn = $('sound-btn');
    const metroBtn = $('metro-btn');
    const hideIndicatorBtn = $('hide-indicator-btn');
    const previewOffBtn = $('preview-off-btn');
    const taskCardEl = document.querySelector('.task-card');
    let hideIndicator = profile.hideIndicator === true;
    let previewOff = profile.previewOff === true;

    // Применяем сохранённое на старте + синхронизируем контролы
    const savedType = profile.keyboardType || 'classic';
    const savedLayout = profile.keyboardLayout || 'standard';
    applyType(savedType);
    kb.setAttribute('layout', savedLayout);
    if (typeSel) typeSel.value = savedType;
    if (layoutSel) layoutSel.value = savedLayout;
    if (fingerBtn) {
        fingerBtn.dataset.off = (!fingerHint).toString();
        fingerBtn.title = fingerHint ? 'Подсветка расстановки пальцев (вкл.)' : 'Подсветка расстановки пальцев (выкл.)';
    }
    if (soundBtn) { soundBtn.dataset.off = (!soundOn).toString(); }
    if (metroBtn) { metroBtn.dataset.off = (!metroOn).toString(); metroBtn.dataset.active = metroOn.toString(); }

    // Hide-indicator + preview-off: применяем сохранённое и синхронизируем
    function applyHideIndicator() {
        taskCardEl.classList.toggle('hide-indicator', hideIndicator);
        if (hideIndicatorBtn) {
            hideIndicatorBtn.dataset.off = (!hideIndicator).toString();
            hideIndicatorBtn.dataset.active = hideIndicator.toString();
            hideIndicatorBtn.title = hideIndicator ? 'Индикатор скрыт' : 'Скрыть индикатор набора (выкл.)';
        }
    }
    function applyPreviewOff() {
        taskCardEl.classList.toggle('preview-off', previewOff);
        if (previewOffBtn) {
            previewOffBtn.dataset.off = (!previewOff).toString();
            previewOffBtn.dataset.active = previewOff.toString();
            previewOffBtn.title = previewOff ? 'Текст скрыт — слепой режим' : 'Скрыть текст урока (выкл.)';
        }
    }
    applyHideIndicator();
    applyPreviewOff();

    // ─── Toolbar handlers (применяем + сохраняем) ───────────────
    // 1. Подсветка расстановки пальцев (highlight-char вкл/выкл)
    if (fingerBtn) fingerBtn.addEventListener('click', (e) => {
        fingerHint = !fingerHint;
        e.currentTarget.dataset.off = (!fingerHint).toString();
        e.currentTarget.title = fingerHint ? 'Подсветка расстановки пальцев (вкл.)' : 'Подсветка расстановки пальцев (выкл.)';
        renderTarget();
        saveKbPref({ fingerHint });
    });
    // 2. Звук нажатия (заглушка SFX, состояние читается в handleKey)
    if (soundBtn) soundBtn.addEventListener('click', (e) => {
        soundOn = !soundOn;
        e.currentTarget.dataset.off = (!soundOn).toString();
        e.currentTarget.title = soundOn ? 'Звук нажатия (вкл.)' : 'Звук нажатия (выкл.)';
        saveKbPref({ keySound: soundOn });
    });
    // 3. Метроном (заглушка)
    if (metroBtn) metroBtn.addEventListener('click', (e) => {
        metroOn = !metroOn;
        e.currentTarget.dataset.off = (!metroOn).toString();
        e.currentTarget.dataset.active = metroOn.toString();
        e.currentTarget.title = metroOn ? 'Метроном (вкл.)' : 'Метроном (выкл.)';
        saveKbPref({ metronome: metroOn });
    });
    // 3a. Hide-indicator — выключить cur-highlight + highlight-char у клавиатуры
    if (hideIndicatorBtn) hideIndicatorBtn.addEventListener('click', () => {
        hideIndicator = !hideIndicator;
        applyHideIndicator();
        if (hideIndicator) kb.removeAttribute('highlight-char');
        else renderTarget();  // вернёт highlight-char в setAttribute
        saveKbPref({ hideIndicator });
    });
    // 3b. Preview-off — спрятать весь текст урока (▪▪▪▪▪)
    if (previewOffBtn) previewOffBtn.addEventListener('click', () => {
        previewOff = !previewOff;
        applyPreviewOff();
        saveKbPref({ previewOff });
    });
    // 4. Масштаб окна набора — зум всей карточки (для слабовидящих)
    const zoomBtn = $('zoom-btn'), zoomPop = $('zoom-pop');
    const zoomVal = $('zoom-val'), zoomMinus = $('zoom-minus'), zoomPlus = $('zoom-plus');
    const ZOOM_MIN = 70, ZOOM_MAX = 150, ZOOM_STEP = 10;
    let zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseInt(profile.taskZoom, 10) || 100));
    function applyZoom(persist) {
        zoomVal.textContent = zoomLevel + '%';
        document.querySelector('.task-card').style.zoom = zoomLevel / 100;
        zoomMinus.disabled = zoomLevel <= ZOOM_MIN;
        zoomPlus.disabled = zoomLevel >= ZOOM_MAX;
        if (persist) saveKbPref({ taskZoom: zoomLevel });
    }
    if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zoomPop.hidden = !zoomPop.hidden;
            zoomBtn.dataset.active = (!zoomPop.hidden).toString();
        });
        document.addEventListener('click', (e) => {
            if (!zoomPop.hidden && !zoomPop.contains(e.target) && e.target !== zoomBtn) {
                zoomPop.hidden = true; zoomBtn.dataset.active = 'false';
            }
        });
        zoomMinus.addEventListener('click', () => { zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); applyZoom(true); });
        zoomPlus.addEventListener('click', () => { zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); applyZoom(true); });
        applyZoom(false);
    }

    if (typeSel) typeSel.addEventListener('change', (e) => {
        applyType(e.target.value);
        saveKbPref({ keyboardType: e.target.value });
    });
    if (layoutSel) layoutSel.addEventListener('change', (e) => {
        kb.setAttribute('layout', e.target.value);
        saveKbPref({ keyboardLayout: e.target.value });
    });

    // ─── Focus ───────────────────────────────────────────────────
    capture.addEventListener('keydown', handleKey);
    // Клик/тап по on-screen клавише → synthetic keydown на capture (для desktop-клика и touch)
    kb.addEventListener('kb-press', (e) => {
        const { key, code } = e.detail || {};
        if (!key) return;
        capture.focus();
        capture.dispatchEvent(new KeyboardEvent('keydown', { key, code: code || '', bubbles: true, cancelable: true }));
    });
    document.querySelector('.task-card').addEventListener('click', (e) => {
        if (e.target.closest('a, button, select')) return;
        capture.focus();
    });

    // ─── Init ────────────────────────────────────────────────────
    attemptEl.textContent = attempt;
    renderTarget();
    updateStats();
    capture.focus();
});
