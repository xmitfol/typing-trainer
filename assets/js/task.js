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
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson';

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const writeJSON = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };

    const profile = readJSON(profileKey);
    if (!profile || !profile.onboardingCompleted || !profile.name) { window.location.href = 'index.html'; return; }
    const progress = readJSON(progressKey) || {};
    const currentLesson = readJSON(currentKey) || {};

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

    // ─── Линейная прогрессия: прямой URL на закрытое упражнение → теория доступного ───
    let firstUncompleted = totalLessons;
    for (let n = 1; n <= totalLessons; n++) {
        if (!(progress[String(n)] && progress[String(n)].stars > 0)) { firstUncompleted = n; break; }
    }
    const lessonDone = !!(progress[String(lessonNum)] && progress[String(lessonNum)].stars > 0);
    if (!lessonDone && lessonNum !== firstUncompleted) {
        window.location.replace(`lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`);
        return;
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

    // ─── Finger legend ───────────────────────────────────────────
    const FCOLOR = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };
    legendEl.innerHTML = [
        ['pink', 'Мизинец'], ['orange', 'Безымянный'], ['green', 'Средний'],
        ['blue', 'Указ. левый'], ['indigo', 'Указ. правый'], ['purple', 'Большой']
    ].map(([f, l]) => `<div class="legend__item"><span class="legend__chip" style="background:${FCOLOR[f]}"></span><span>${l}</span></div>`).join('');

    // ─── Load lesson ─────────────────────────────────────────────
    const lesson = await window.lessonLoader.loadLesson(tier, lessonNum);
    if (!lesson || !lesson.text) { targetEl.textContent = `Урок ${lessonNum} не загружен`; return; }

    const targetText = lesson.text;
    const moduleN = lesson.phase || 1;
    const exId = `${moduleN}.${lessonNum}`;
    numEl.textContent = exId;

    const initTip = (lesson.character_tips && lesson.character_tips[mentorId])
        || `Печатай ровно. Цель: ${lesson.target_wpm || '—'} зн/мин, допустимо ошибок: ${Number.isFinite(lesson.error_limit) ? lesson.error_limit : '—'}.`;
    tipEl.textContent = initTip;
    hintEl.textContent = lesson.finger_focus || 'Указательные пальцы — твои якоря на буквах А и О.';

    // ─── State ───────────────────────────────────────────────────
    let typed = 0, errors = 0, attempt = 1, startTime = null, timer = null, done = false;
    // Настройки тулбара (из профиля; дефолты: подсветка вкл, звук/метроном выкл, зум 100)
    let fingerHint = profile.fingerHint !== false;
    let soundOn = profile.keySound === true;
    let metroOn = profile.metronome === true;

    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }

    // ─── Render target (слова — неразрывные, перенос целиком) ─────
    function renderTarget() {
        let html = '', openWord = false;
        for (let i = 0; i < targetText.length; i++) {
            const ch = targetText[i];
            const cls = i < typed ? 'done' : (i === typed && !done ? 'cur' : '');
            if (ch === ' ') {
                if (openWord) { html += '</span>'; openWord = false; }
                html += `<span class="space ${cls}"> </span>`;
            } else {
                if (!openWord) { html += '<span class="word">'; openWord = true; }
                html += `<span class="${cls}">${escapeHtml(ch)}</span>`;
            }
        }
        if (openWord) html += '</span>';
        targetEl.innerHTML = html;
        countEl.textContent = `${typed}/${targetText.length}`;
        fillEl.style.width = `${(typed / targetText.length) * 100}%`;

        const nextCh = targetText[typed];
        if (!fingerHint) { kb.removeAttribute('highlight-char'); return; }
        if (nextCh === ' ') kb.setAttribute('highlight-char', ' ');
        else if (nextCh) kb.setAttribute('highlight-char', nextCh);
        else kb.removeAttribute('highlight-char');
    }

    // ─── Metrics ─────────────────────────────────────────────────
    function calcWpm(elapsed) { return elapsed > 0 ? Math.round((typed) / (elapsed / 60)) : 0; }
    function calcAcc() { return typed > 0 ? Math.max(0, Math.round(((typed - errors) / typed) * 100)) : 100; }
    function updateStats() {
        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
        const m = Math.floor(elapsed / 60), s = Math.floor(elapsed % 60);
        statTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        statSpeed.innerHTML = `${calcWpm(elapsed)} <span style="font-size:11px;color:var(--faint)">зн/мин</span>`;
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

        const expected = targetText[typed];
        if (e.key === expected) {
            kb.flashActive(e.code, 140);
        } else {
            kb.flashError(e.code);
            errors++;
        }
        typed++;
        renderTarget();
        updateStats();
        if (typed >= targetText.length) finishExercise();
    }

    // ─── Finish ──────────────────────────────────────────────────
    function finishExercise() {
        done = true;
        clearInterval(timer);
        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
        const wpm = calcWpm(elapsed);
        const acc = calcAcc();
        const stars = errors === 0 ? 5 : errors <= 2 ? 4 : errors <= 5 ? 3 : errors <= 10 ? 2 : 1;

        // Сохранить прогресс (best) — открывает следующий урок
        const prev = progress[String(lessonNum)] || {};
        const newProg = {
            stars: Math.max(stars, prev.stars || 0),
            bestWPM: Math.max(wpm, prev.bestWPM || 0),
            bestAccuracy: Math.max(acc, prev.bestAccuracy || 0),
            bestTime: prev.bestTime ? Math.min(elapsed, prev.bestTime) : elapsed,
            completedAt: new Date().toISOString()
        };
        progress[String(lessonNum)] = newProg;
        writeJSON(progressKey, progress);
        writeJSON(currentKey, { tier, lessonNumber: lessonNum, lastSaved: new Date().toISOString() });

        $('success-num').textContent = exId;
        $('success-avatar').innerHTML = window.portraits ? window.portraits.mentor(mentorId, 150) : '';
        $('final-grade').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
        $('final-speed').innerHTML = `${wpm} <span style="font-size:11px;color:var(--faint)">зн/мин</span>`;
        $('final-acc').innerHTML = `${acc}<span style="font-size:11px;color:var(--faint)">%</span>`;

        const titles = { 5: 'Идеально.', 4: 'Всё верно.', 3: 'Сойдёт.', 2: 'Можно лучше.', 1: 'Повторим?' };
        $('success-title').textContent = titles[stars];
        $('success-msg').textContent = acc === 100
            ? 'Без единой ошибки. Отличный ритм — идём дальше.'
            : `Точность ${acc}%. ${stars >= 4 ? 'Хорошо, можно дальше.' : 'Рекомендую повторить для закрепления.'}`;
        tipEl.textContent = stars >= 4 ? 'Отлично! Ритм уверенный, можно чуть ускориться.' : 'Неплохо. На следующей попытке целься в 95%+.';
        hintEl.textContent = '';

        // «Продолжить» → теория следующего урока (или к списку, если последний)
        const nextN = lessonNum + 1;
        const nextBtn = $('next-btn');
        if (nextN <= totalLessons) {
            nextBtn.textContent = `Продолжить · урок ${nextN} →`;
            nextBtn.href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${nextN}`;
        } else {
            nextBtn.textContent = 'К списку уроков →';
            nextBtn.href = 'course.html';
        }

        kb.removeAttribute('highlight-char');
        taskBody.classList.add('hide');
        toolbar.classList.add('hide');
        kbStage.classList.add('hide');
        successEl.classList.add('show');
    }

    // ─── Buttons ─────────────────────────────────────────────────
    function reset() {
        typed = 0; errors = 0; startTime = null; done = false; clearInterval(timer);
        attempt++; attemptEl.textContent = attempt;
        statTime.textContent = '00:00';
        renderTarget(); updateStats(); capture.focus();
    }
    $('restart-btn').addEventListener('click', reset);
    $('retry-btn').addEventListener('click', () => {
        successEl.classList.remove('show');
        taskBody.classList.remove('hide'); toolbar.classList.remove('hide'); kbStage.classList.remove('hide');
        reset();
    });

    $('task-close').href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;

    // ─── Настройки тулбара: запоминаем выбор пользователя ────────
    // Всё храним в профиле (keyboardType уже приходит из онбординга).
    function saveKbPref(patch) {
        Object.assign(profile, patch);
        writeJSON(profileKey, profile);
    }
    function applyType(v) {
        kb.setAttribute('type', v);
        if (v === 'ergonomic') { kb.setAttribute('unit', '38'); kb.setAttribute('gap', '52'); kb.setAttribute('angle', '10'); }
        else if (v === 'laptop') kb.setAttribute('unit', '44');
        else kb.setAttribute('unit', '40');
    }

    const typeSel = $('type-select');
    const layoutSel = $('layout-select');
    const fingerBtn = $('finger-hint-btn');
    const soundBtn = $('sound-btn');
    const metroBtn = $('metro-btn');

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
