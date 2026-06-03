/**
 * i18n.js — лёгкий runtime-локализатор UI.
 *
 * Использование:
 *   <script src="assets/js/i18n.js"></script>
 *   <script>await window.i18n.init();</script>      // в любом DOMContentLoaded
 *   t = window.i18n.t;
 *   t('dashboard.welcome', {name: 'Иван'})           // → "Привет, Иван"
 *
 * Декларативно (без JS): любой элемент с data-i18n="key" получит textContent
 * из словаря на init() и при смене языка. data-i18n-attr="placeholder:key"
 * — для атрибутов (можно через запятую: "title:key1,placeholder:key2").
 *
 * Языки: ru (default) и en — JSON-файлы из data/locales/.
 * Источник языка: profile.language ('ru' | 'en') из localStorage.
 * При смене языка в Settings: window.i18n.setLanguage('en') →
 *   loads → applies → диспатчит typingtrainer:languageChanged.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'typing_trainer_user_profile';
    const DEFAULT_LANG = 'ru';
    const SUPPORTED = ['ru', 'en'];

    const state = {
        lang: DEFAULT_LANG,
        dict: {},          // {key: 'string'} плоский (через точки)
        loaded: new Set(), // языки которые уже подгружены
        cache: {},         // {lang: dict}
    };

    function readLangFromProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULT_LANG;
            const p = JSON.parse(raw);
            return SUPPORTED.includes(p.language) ? p.language : DEFAULT_LANG;
        } catch (e) { return DEFAULT_LANG; }
    }

    function flatten(obj, prefix, out) {
        out = out || {};
        prefix = prefix || '';
        for (const k in obj) {
            const v = obj[k];
            const key = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                flatten(v, key, out);
            } else {
                out[key] = v;
            }
        }
        return out;
    }

    async function loadLang(lang) {
        if (state.cache[lang]) return state.cache[lang];
        try {
            const res = await fetch(`data/locales/${lang}.json`);
            if (!res.ok) throw new Error(`locale ${lang} HTTP ${res.status}`);
            const json = await res.json();
            const flat = flatten(json);
            state.cache[lang] = flat;
            state.loaded.add(lang);
            return flat;
        } catch (e) {
            console.warn(`[i18n] Не удалось загрузить ${lang}:`, e);
            return null;
        }
    }

    function t(key, vars) {
        const tpl = state.dict[key];
        if (tpl == null) {
            // нет ключа — возвращаем сам ключ (как fallback заметный для разработчика)
            return key;
        }
        if (!vars) return tpl;
        return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    }

    // Применяем словарь к текущему DOM:
    //   data-i18n="key"          → textContent
    //   data-i18n-attr="a:b,..." → setAttribute('a', t('b'))
    function applyToDOM(root) {
        const r = root || document;
        r.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });
        r.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const spec = el.getAttribute('data-i18n-attr') || '';
            spec.split(',').forEach(pair => {
                const [a, k] = pair.split(':').map(s => s && s.trim());
                if (a && k) el.setAttribute(a, t(k));
            });
        });
    }

    async function init(opts) {
        opts = opts || {};
        const targetLang = opts.lang || readLangFromProfile();
        state.lang = SUPPORTED.includes(targetLang) ? targetLang : DEFAULT_LANG;

        let dict = await loadLang(state.lang);
        if (!dict && state.lang !== DEFAULT_LANG) {
            // fallback ru при отсутствии нужного языка
            dict = await loadLang(DEFAULT_LANG);
            state.lang = DEFAULT_LANG;
        }
        state.dict = dict || {};
        applyToDOM();
        document.documentElement.setAttribute('lang', state.lang);
    }

    async function setLanguage(newLang) {
        if (!SUPPORTED.includes(newLang) || newLang === state.lang) return false;
        const dict = await loadLang(newLang);
        if (!dict) return false;
        state.lang = newLang;
        state.dict = dict;
        applyToDOM();
        document.documentElement.setAttribute('lang', newLang);
        document.dispatchEvent(new CustomEvent('typingtrainer:languageChanged', {
            detail: { lang: newLang }
        }));
        return true;
    }

    function getLanguage() { return state.lang; }

    window.i18n = { init, setLanguage, getLanguage, t, applyToDOM, SUPPORTED };
})();
