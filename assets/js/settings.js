/**
 * settings.js — страница настроек. Читает/пишет профиль + сброс прогресса.
 * Все изменения сохраняются автоматически (auto-save) и отражаются на дашборде/
 * в тренажёре при следующей загрузке.
 */
document.addEventListener('DOMContentLoaded', function () {
    const $ = (id) => document.getElementById(id);
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson';
    const historyKey = (window.Settings && window.Settings.get('storage.keys.testHistory', 'typing_trainer_test_history')) || 'typing_trainer_test_history';
    const certKey = (window.Settings && window.Settings.get('storage.keys.certifications', 'typing_trainer_certifications')) || 'typing_trainer_certifications';

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const writeJSON = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };

    const profile = readJSON(profileKey) || {};
    if (!profile.onboardingCompleted) {
        // router-guard уже должен был редиректнуть, но защитимся
        window.location.href = 'index.html';
        return;
    }

    // ─── Header avatar + name ───────────────────────────────────
    if (window.portraits && window.portraits.user) {
        $('sp-avatar').innerHTML = window.portraits.user(profile.audience || 'adult', profile.gender || 'm', 24);
    }
    $('sp-name').textContent = profile.name || '—';

    // ─── Save helper + saved-индикатор ──────────────────────────
    const savedBadge = $('sp-saved');
    let savedTimer = null;
    function save(patch) {
        Object.assign(profile, patch);
        writeJSON(profileKey, profile);
        savedBadge.classList.add('sp-saved--show');
        clearTimeout(savedTimer);
        savedTimer = setTimeout(() => savedBadge.classList.remove('sp-saved--show'), 1500);
    }

    // ─── Profile: name ──────────────────────────────────────────
    const nameInput = $('sp-name-input');
    nameInput.value = profile.name || '';
    let nameTimer = null;
    nameInput.addEventListener('input', () => {
        clearTimeout(nameTimer);
        nameTimer = setTimeout(() => {
            const v = nameInput.value.trim();
            if (v) { save({ name: v }); $('sp-name').textContent = v; }
        }, 400);
    });

    // ─── Profile: gender (segmented) ────────────────────────────
    function syncSeg(container, attr, value) {
        container.querySelectorAll('button').forEach(b => {
            b.classList.toggle('sp-seg__btn--active', b.dataset[attr] === value);
        });
    }
    function syncOpts(container, attr, value) {
        container.querySelectorAll('button').forEach(b => {
            b.classList.toggle('sp-option--active', b.dataset[attr] === value);
        });
    }

    const genderEl = $('sp-gender');
    syncSeg(genderEl, 'gender', profile.gender || 'm');
    genderEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-gender]');
        if (!btn) return;
        const v = btn.dataset.gender;
        save({ gender: v, genderManual: true });
        syncSeg(genderEl, 'gender', v);
        // обновим аватар в шапке
        if (window.portraits) $('sp-avatar').innerHTML = window.portraits.user(profile.audience || 'adult', v, 24);
    });

    // ─── Profile: audience (cards) ──────────────────────────────
    const audienceEl = $('sp-audience');
    function applyAudience(v) {
        save({ audience: v });
        syncOpts(audienceEl, 'audience', v);
        renderMentor();
        if (window.portraits) $('sp-avatar').innerHTML = window.portraits.user(v, profile.gender || 'm', 24);
    }
    syncOpts(audienceEl, 'audience', profile.audience || 'adult');
    audienceEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-audience]');
        if (!btn) return;
        applyAudience(btn.dataset.audience);
    });

    // ─── Profile: mentor (зависит от audience) ──────────────────
    const mentorEl = $('sp-mentor');
    const MENTORS = {
        adult: [['anna', 'Анна', 'учительница'], ['maxim', 'Максим', 'тренер']],
        teen:  [['knopych', 'Кнопыч', 'друг-робот']],
        kid:   [['klavochka', 'Клавочка', 'добрая помощница']]
    };
    function renderMentor() {
        const aud = profile.audience || 'adult';
        const list = MENTORS[aud] || MENTORS.adult;
        // если текущий ментор не из этой audience — выберем дефолт
        const validIds = list.map(m => m[0]);
        if (!validIds.includes(profile.character)) {
            const def = list[0][0];
            save({ character: def, mentor: def });
        }
        mentorEl.innerHTML = list.map(([id, name, sub]) =>
            `<button type="button" class="sp-option${id === profile.character ? ' sp-option--active' : ''}" data-mentor="${id}">${name}<div class="sp-option__sub">${sub}</div></button>`
        ).join('');
    }
    renderMentor();
    mentorEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-mentor]');
        if (!btn) return;
        const id = btn.dataset.mentor;
        save({ character: id, mentor: id });
        syncOpts(mentorEl, 'mentor', id);
    });

    // ─── Клавиатура ─────────────────────────────────────────────
    const typeSel = $('sp-kb-type');
    const layoutSel = $('sp-kb-layout');
    const fingerToggle = $('sp-kb-finger');
    const soundToggle = $('sp-kb-sound');
    const metroToggle = $('sp-kb-metro');

    typeSel.value = profile.keyboardType || 'classic';
    layoutSel.value = profile.keyboardLayout || 'standard';
    fingerToggle.checked = profile.fingerHint !== false;
    soundToggle.checked = profile.keySound === true;
    metroToggle.checked = profile.metronome === true;

    typeSel.addEventListener('change', () => save({ keyboardType: typeSel.value }));
    layoutSel.addEventListener('change', () => save({ keyboardLayout: layoutSel.value }));
    fingerToggle.addEventListener('change', () => save({ fingerHint: fingerToggle.checked }));
    soundToggle.addEventListener('change', () => save({ keySound: soundToggle.checked }));
    metroToggle.addEventListener('change', () => save({ metronome: metroToggle.checked }));

    // Zoom stepper
    const zoomVal = $('sp-zoom-val'), zoomMinus = $('sp-zoom-minus'), zoomPlus = $('sp-zoom-plus');
    const ZOOM_MIN = 70, ZOOM_MAX = 150, ZOOM_STEP = 10;
    let zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseInt(profile.taskZoom, 10) || 100));
    function applyZoom() {
        zoomVal.textContent = zoom + '%';
        zoomMinus.disabled = zoom <= ZOOM_MIN;
        zoomPlus.disabled = zoom >= ZOOM_MAX;
    }
    zoomMinus.addEventListener('click', () => { zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP); applyZoom(); save({ taskZoom: zoom }); });
    zoomPlus.addEventListener('click', () => { zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP); applyZoom(); save({ taskZoom: zoom }); });
    applyZoom();

    // ─── Язык интерфейса ────────────────────────────────────────
    const langEl = $('sp-lang');
    syncSeg(langEl, 'lang', profile.language || 'ru');
    langEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-lang]');
        if (!btn) return;
        const v = btn.dataset.lang;
        save({ language: v });
        syncSeg(langEl, 'lang', v);
        // Смена языка → меняется ветка уроков (tier routing).
        // Сбросим currentLesson чтобы при следующем открытии task/lesson маршрутизация пересчиталась.
        try { localStorage.removeItem(currentKey); } catch (e) {}
    });

    // ─── Прогресс: reset ────────────────────────────────────────
    const modal = $('sp-modal');
    $('sp-reset-btn').addEventListener('click', () => modal.classList.add('sp-modal--open'));
    $('sp-modal-cancel').addEventListener('click', () => modal.classList.remove('sp-modal--open'));
    $('sp-modal-confirm').addEventListener('click', () => {
        try {
            localStorage.removeItem(progressKey);
            localStorage.removeItem(currentKey);
            localStorage.removeItem(historyKey);
            localStorage.removeItem(certKey);
        } catch (e) {}
        modal.classList.remove('sp-modal--open');
        save({});  // показать «✓ Сохранено» как фидбэк
        // Можно сразу уйти в дашборд — там увидит чистый прогресс
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    });
});
