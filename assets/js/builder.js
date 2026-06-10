/**
 * builder.js — Lesson Builder. Создание/редактирование/удаление
 * пользовательских уроков. Хранение: localStorage[USER_LESSONS_KEY].
 *
 * Формат урока: { id, title, text, target_wpm, error_limit, createdAt }.
 * id — числовой timestamp (уникален, монотонный).
 *
 * Запуск тренировки → task.html?tier=user&lesson=<id>. task.js поддерживает
 * tier=user и грузит урок из localStorage напрямую.
 */
(async function () {
    'use strict';

    const USER_LESSONS_KEY = 'typing_trainer_user_lessons';
    const $ = (id) => document.getElementById(id);
    if (window.i18n) { try { await window.i18n.init(); } catch (e) {} }
    const t = (k, v) => (window.i18n ? window.i18n.t(k, v) : k);

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const writeJSON = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };

    function getLessons() { return readJSON(USER_LESSONS_KEY) || []; }
    function saveLessons(list) { writeJSON(USER_LESSONS_KEY, list); }

    let editingId = null;     // null = создаём новый; id = редактируем существующий
    const titleEl = $('bp-title'), textEl = $('bp-text');
    const wpmEl = $('bp-wpm'), errEl = $('bp-errors');
    const counterEl = $('bp-text-counter');
    const saveBtn = $('bp-save-btn'), cancelBtn = $('bp-cancel-btn'), formTitle = $('bp-form-title');
    const savedBadge = $('bp-saved');

    function showSaved() {
        savedBadge.classList.add('bp-saved--show');
        setTimeout(() => savedBadge.classList.remove('bp-saved--show'), 1500);
    }

    textEl.addEventListener('input', () => {
        counterEl.textContent = t('builder.charCount', { n: textEl.value.length });
    });

    function resetForm() {
        editingId = null;
        titleEl.value = '';
        textEl.value = '';
        wpmEl.value = 30;
        errEl.value = 2;
        counterEl.textContent = t('builder.charCount', { n: 0 });
        formTitle.textContent = t('builder.newLesson');
        saveBtn.textContent = t('builder.saveLesson');
        cancelBtn.hidden = true;
    }

    function loadIntoForm(lesson) {
        editingId = lesson.id;
        titleEl.value = lesson.title || '';
        textEl.value = lesson.text || '';
        wpmEl.value = lesson.target_wpm || 30;
        errEl.value = Number.isFinite(lesson.error_limit) ? lesson.error_limit : 2;
        counterEl.textContent = t('builder.charCount', { n: textEl.value.length });
        formTitle.textContent = t('builder.editLesson');
        saveBtn.textContent = t('builder.saveChanges');
        cancelBtn.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }

    function renderList() {
        const list = getLessons();
        const el = $('bp-list');
        $('bp-count').textContent = `(${list.length})`;
        if (!list.length) {
            el.innerHTML = `<div class="bp-list-empty">${escapeHtml(t('builder.emptyList')).replace(/\n/g, '<br>')}</div>`;
            return;
        }
        const labelTrain = t('builder.train');
        const labelEdit = t('common.edit');
        const labelDelete = t('common.delete');
        const labelUntitled = t('builder.untitled');
        el.innerHTML = list.slice().reverse().map(l => `
            <div class="bp-item" data-id="${l.id}">
                <div>
                    <div class="bp-item__title">${escapeHtml(l.title || labelUntitled)}</div>
                    <div class="bp-item__sub">${t('builder.charCount', { n: l.text.length })} · ${l.target_wpm || '—'} WPM · ≤ ${Number.isFinite(l.error_limit) ? l.error_limit : '—'}</div>
                    <div class="bp-item__text">${escapeHtml(l.text.slice(0, 80))}${l.text.length > 80 ? '…' : ''}</div>
                </div>
                <div class="bp-item__actions">
                    <a class="bp-icon-btn bp-icon-btn--play" href="task.html?tier=user&lesson=${l.id}" title="${escapeHtml(labelTrain)}">${escapeHtml(labelTrain)}</a>
                    <button type="button" class="bp-icon-btn" data-action="edit" title="${escapeHtml(labelEdit)}">✎</button>
                    <button type="button" class="bp-icon-btn bp-icon-btn--danger" data-action="delete" title="${escapeHtml(labelDelete)}">🗑</button>
                </div>
            </div>
        `).join('');
    }

    // Save / Update
    saveBtn.addEventListener('click', () => {
        const title = titleEl.value.trim();
        const text = textEl.value.trim();
        const wpm = parseInt(wpmEl.value, 10) || 30;
        const errors = parseInt(errEl.value, 10);
        if (!text) { textEl.focus(); textEl.classList.add('bp-input--err'); return; }

        const list = getLessons();
        const fallbackTitle = t('builder.untitled');
        if (editingId) {
            const idx = list.findIndex(l => l.id === editingId);
            if (idx >= 0) {
                list[idx] = { ...list[idx], title: title || fallbackTitle, text, target_wpm: wpm, error_limit: Number.isFinite(errors) ? errors : 2 };
            }
        } else {
            const id = Date.now();
            list.push({ id, title: title || fallbackTitle, text, target_wpm: wpm, error_limit: Number.isFinite(errors) ? errors : 2, createdAt: new Date().toISOString() });
        }
        saveLessons(list);
        showSaved();
        resetForm();
        renderList();
    });

    cancelBtn.addEventListener('click', resetForm);

    // List actions: edit / delete
    $('bp-list').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const itemEl = e.target.closest('.bp-item');
        const id = parseInt(itemEl.dataset.id, 10);
        const list = getLessons();
        const lesson = list.find(l => l.id === id);
        if (!lesson) return;
        if (btn.dataset.action === 'edit') {
            loadIntoForm(lesson);
        } else if (btn.dataset.action === 'delete') {
            if (!confirm(t('builder.deleteConfirm', { title: lesson.title }))) return;
            saveLessons(list.filter(l => l.id !== id));
            showSaved();
            renderList();
            if (editingId === id) resetForm();
        }
    });

    // Init
    resetForm();
    renderList();
})();
