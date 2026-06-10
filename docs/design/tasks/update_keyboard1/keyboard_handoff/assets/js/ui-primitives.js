// ui-primitives.js — template-function primitives for vanilla UI
// Phase 0 · Foundation
// All functions return HTML strings; embed via innerHTML or string composition.

(function (global) {
  'use strict';

  // ─── Escape ──────────────────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─── Button ──────────────────────────────────────────────────────────────
  // ui.button({ label, variant: 'primary'|'secondary'|'ghost', size: 'sm'|'md'|'lg',
  //   block, disabled, icon, id, onClick: 'globalFnName' })
  function button(opts = {}) {
    const {
      label, variant = 'primary', size = 'md', block = false,
      disabled = false, icon = '', id = '', onClick = '',
    } = opts;
    const classes = [
      'btn',
      variant !== 'primary' && `btn--${variant}`,
      size === 'sm' && 'btn--sm',
      size === 'lg' && 'btn--lg',
      block && 'btn--block',
    ].filter(Boolean).join(' ');
    return `<button
      class="${classes}"
      ${id ? `id="${esc(id)}"` : ''}
      ${disabled ? 'disabled' : ''}
      ${onClick ? `onclick="${esc(onClick)}(event)"` : ''}
    >${icon}<span>${esc(label)}</span></button>`;
  }

  // ─── Card ────────────────────────────────────────────────────────────────
  // ui.card({ variant, padding, children: '<html>' })
  function card(opts = {}) {
    const { variant = '', padding = '', children = '' } = opts;
    const classes = ['card', variant && `card--${variant}`].filter(Boolean).join(' ');
    const style = padding ? `padding:${esc(padding)}` : '';
    return `<div class="${classes}" ${style ? `style="${style}"` : ''}>${children}</div>`;
  }

  // ─── Input ───────────────────────────────────────────────────────────────
  // ui.input({ label, type, placeholder, value, hint, error, name, id, suffix })
  function input(opts = {}) {
    const {
      label = '', type = 'text', placeholder = '',
      value = '', hint = '', error = '', name = '', id = '',
      suffix = '',
    } = opts;
    return `<div class="field">
      ${label ? `<label class="field__label" ${id ? `for="${esc(id)}"` : ''}>${esc(label)}</label>` : ''}
      <div style="position:relative;display:flex">
        <input
          class="field__input"
          type="${esc(type)}"
          ${name ? `name="${esc(name)}"` : ''}
          ${id ? `id="${esc(id)}"` : ''}
          ${placeholder ? `placeholder="${esc(placeholder)}"` : ''}
          ${value ? `value="${esc(value)}"` : ''}
          ${error ? `style="border-color:var(--error)"` : ''}
        />
        ${suffix ? `<div style="position:absolute;right:4px;top:4px;bottom:4px;display:flex;align-items:center">${suffix}</div>` : ''}
      </div>
      ${hint && !error ? `<div class="field__hint">${esc(hint)}</div>` : ''}
      ${error ? `<div class="field__error">${esc(error)}</div>` : ''}
    </div>`;
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────
  // ui.tabs({ items: [{id, label}], active: 'id', name: 'group' })
  // Tabs emit a CustomEvent('tabchange', { detail: { active } }) on .tabs root.
  function tabs(opts = {}) {
    const { items = [], active = '', name = '' } = opts;
    const id = name || 'tabs-' + Math.random().toString(36).slice(2, 8);
    const buttons = items.map(it => `
      <button
        type="button"
        class="tabs__item"
        role="tab"
        aria-selected="${it.id === active ? 'true' : 'false'}"
        data-tab-id="${esc(it.id)}"
      >${esc(it.label)}</button>
    `).join('');
    return `<div class="tabs" data-tabs-name="${esc(id)}" role="tablist">${buttons}</div>`;
  }

  // Wire all .tabs on the page after render
  function bindTabs(root = document) {
    root.querySelectorAll('.tabs').forEach(tabsRoot => {
      if (tabsRoot.dataset.bound) return;
      tabsRoot.dataset.bound = '1';
      tabsRoot.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab-id]');
        if (!btn) return;
        tabsRoot.querySelectorAll('[data-tab-id]').forEach(b =>
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false')
        );
        tabsRoot.dispatchEvent(new CustomEvent('tabchange', {
          bubbles: true,
          detail: { active: btn.dataset.tabId },
        }));
      });
    });
  }

  // ─── Modal ───────────────────────────────────────────────────────────────
  // ui.modal({ title, children, footer, closeable: true, id })
  // Show: ui.openModal(idOrEl); Close: ui.closeModal(idOrEl);
  function modal(opts = {}) {
    const { title = '', children = '', footer = '', closeable = true, id = '' } = opts;
    return `<div class="modal-backdrop" ${id ? `id="${esc(id)}"` : ''} hidden>
      <div class="modal" role="dialog" aria-modal="true" ${title ? `aria-label="${esc(title)}"` : ''}>
        ${closeable ? `<button class="modal__close" data-modal-close aria-label="Закрыть">✕</button>` : ''}
        ${title ? `<div style="padding:24px 28px 0;font-size:22px;font-weight:800;letter-spacing:-0.02em">${esc(title)}</div>` : ''}
        <div style="padding:24px 28px">${children}</div>
        ${footer ? `<div style="padding:0 28px 24px;display:flex;justify-content:flex-end;gap:10px">${footer}</div>` : ''}
      </div>
    </div>`;
  }
  function openModal(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (el) el.hidden = false;
  }
  function closeModal(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (el) el.hidden = true;
  }
  function bindModals(root = document) {
    root.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      if (backdrop.dataset.bound) return;
      backdrop.dataset.bound = '1';
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.matches('[data-modal-close]')) {
          backdrop.hidden = true;
        }
      });
    });
  }

  // ─── Init: bind all on DOMContentLoaded ──────────────────────────────────
  function init() {
    bindTabs();
    bindModals();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public ──────────────────────────────────────────────────────────────
  global.ui = {
    esc, button, card, input, tabs, modal,
    openModal, closeModal,
    bindTabs, bindModals, init,
  };
})(window);
