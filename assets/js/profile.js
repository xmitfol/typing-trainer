/**
 * profile.js — Phase 6 Profile Page.
 * Single-page profile dashboard: метрики из lessonProgress+history,
 * Today header + paywall banner (если freemium-лимит близок), 6 табов
 * (Профиль/Статистика/Сертификаты/Оплаты/Бонусы/Отзывы).
 * Stub-табы (Оплаты/Бонусы/Отзывы) — заглушки до бекенда.
 */
document.addEventListener('DOMContentLoaded', async function () {
    if (window.i18n) { try { await window.i18n.init(); } catch (e) {} }
    const $ = (sel) => document.querySelector(sel);
    const t = (k, v) => (window.i18n ? window.i18n.t(k, v) : k);

    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const historyKey = (window.Settings && window.Settings.get('storage.keys.testHistory', 'typing_trainer_test_history')) || 'typing_trainer_test_history';

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const profile = readJSON(profileKey) || {};
    const progress = readJSON(progressKey) || {};
    const history = readJSON(historyKey) || [];

    // ── Header: today + date ────────────────────────────────────────
    const now = new Date();
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const lang = (window.i18n && window.i18n.getLanguage()) || 'ru';
    const monthName = (lang === 'en' ? monthsEn : months)[now.getMonth()];
    $('#ppDate').textContent = `${now.getDate()} ${monthName} ${now.getFullYear()}`;

    // ── Paywall banner (freemium) ──────────────────────────────────
    // Бесплатно — 5 уроков, дальше paywall. Пока бекенда нет — считаем
    // по lessonProgress: если completed > 5 — banner скрыт (юзер уже
    // вышел за лимит, но мы не блокируем). Если 3-5 — banner с CTA.
    const completedCount = Object.values(progress).filter(p => p && p.stars > 0).length;
    const FREE_LIMIT = 5;
    if (completedCount >= 3 && completedCount <= FREE_LIMIT + 2) {
        $('#ppPaywall').hidden = false;
        $('#ppPaywallUsed').textContent = Math.min(completedCount, FREE_LIMIT);
        $('#ppPaywallLimit').textContent = FREE_LIMIT;
    }

    // ── Metrics strip (min/avg/max WPM, attempts, errors, time) ────
    const validRuns = history.filter(h => h && Number.isFinite(h.wpm) && h.wpm > 0);
    if (validRuns.length) {
        const wpms = validRuns.map(h => h.wpm);
        $('#ppMinSpeed').textContent = Math.min(...wpms);
        $('#ppMaxSpeed').textContent = Math.max(...wpms);
        $('#ppAvgSpeed').textContent = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    }
    $('#ppAttempts').textContent = history.length;
    // Ошибки: суммарно по history (нет такого поля — оцениваем по accuracy)
    const totalChars = validRuns.reduce((a, h) => a + (Number.isFinite(h.duration) ? Math.round(h.wpm * h.duration / 60) : 0), 0);
    const errorsApprox = validRuns.reduce((a, h) => {
        if (Number.isFinite(h.accuracy) && Number.isFinite(h.duration) && Number.isFinite(h.wpm)) {
            const chars = Math.round(h.wpm * h.duration / 60);
            return a + Math.round(chars * (1 - h.accuracy / 100));
        }
        return a;
    }, 0);
    $('#ppErrors').textContent = errorsApprox;
    const totalSec = history.reduce((a, h) => a + (Number.isFinite(h.duration) ? h.duration : 0), 0);
    const totalMin = Math.round(totalSec / 60);
    $('#ppTime').textContent = totalMin > 60 ? `${(totalMin / 60).toFixed(1)}ч` : `${totalMin}м`;

    // ── Profile card (left) ─────────────────────────────────────────
    const audience = profile.audience || 'adult';
    const gender = profile.gender || 'm';
    const mentorId = profile.character || (audience === 'teen' ? 'knopych' : audience === 'kid' ? 'klavochka' : 'anna');
    if (window.portraits && window.portraits.user) {
        $('#ppPortrait').innerHTML = window.portraits.user(audience, gender, 120);
    }
    $('#ppName').textContent = profile.name || '—';
    const mentorMeta = {
        anna: 'Анна', maxim: 'Максим', knopych: 'Кнопыч', klavochka: 'Клавочка'
    };
    $('#ppRole').textContent = `${t('profile.menteeOf')} · ${mentorMeta[mentorId] || mentorId}`;

    // ID — стабильный hash от имени+character+createdAt (или текущей даты)
    const idSeed = `${profile.name || 'anon'}-${mentorId}-${profile.createdAt || ''}`;
    let hash = 0;
    for (let i = 0; i < idSeed.length; i++) hash = ((hash << 5) - hash + idSeed.charCodeAt(i)) | 0;
    $('#ppFieldId').textContent = '#' + Math.abs(hash).toString(16).slice(0, 8).toUpperCase();
    $('#ppFieldGender').textContent = gender === 'f' ? t('settings.gender_f') : t('settings.gender_m');
    $('#ppFieldAge').textContent = t(`settings.audience_${audience}`) + ' · ' + t(`settings.audience_${audience}_age`);
    $('#ppFieldLang').textContent = (profile.language || 'ru').toUpperCase();
    $('#ppFieldMentor').textContent = mentorMeta[mentorId] || mentorId;
    $('#ppFieldRegistered').textContent = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU')
        : now.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU');

    // ── Profile tab (info grid) ─────────────────────────────────────
    const kbType = profile.keyboardType || 'classic';
    const kbLayout = profile.keyboardLayout || 'standard';
    $('#ppInfoKeyboard').textContent = t(`settings.kbType_${kbType}`);
    $('#ppInfoLayout').textContent = t(`settings.kbLayout_${kbLayout}`);
    $('#ppInfoLessonsDone').textContent = completedCount;

    // Streak — дни подряд с >=1 уроком (по history)
    function calcStreak() {
        if (!history.length) return 0;
        const days = new Set();
        history.forEach(h => {
            if (h && h.completedAt) {
                const d = new Date(h.completedAt);
                days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
            }
        });
        let streak = 0, day = new Date();
        for (let i = 0; i < 365; i++) {
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            if (days.has(key)) streak++;
            else if (i > 0) break;  // первый «вчера/сегодня» может быть пустой
            day.setDate(day.getDate() - 1);
        }
        return streak;
    }
    $('#ppInfoStreak').textContent = calcStreak();

    // ── Stats tab: activity bar-chart (14 дней) ─────────────────────
    function renderChart() {
        const chart = $('#ppChart');
        chart.innerHTML = '';
        const buckets = new Array(14).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        history.forEach(h => {
            if (!h || !h.completedAt) return;
            const d = new Date(h.completedAt);
            d.setHours(0, 0, 0, 0);
            const diffDays = Math.round((today - d) / 86400000);
            if (diffDays >= 0 && diffDays < 14) buckets[13 - diffDays]++;
        });
        const max = Math.max(1, ...buckets);
        const labels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
        const labelsEn = ['Mo','Tu','We','Th','Fr','Sa','Su'];
        const labelArr = (lang === 'en' ? labelsEn : labels);
        for (let i = 0; i < 14; i++) {
            const bar = document.createElement('div');
            bar.className = 'pp-chart__bar' + (buckets[i] === 0 ? ' pp-chart__bar--empty' : '');
            bar.style.height = `${Math.max(8, (buckets[i] / max) * 100)}%`;
            // подпись только каждый 2-й, чтобы не перегружать
            const d = new Date(today);
            d.setDate(d.getDate() - (13 - i));
            bar.dataset.day = i % 2 === 0 ? labelArr[d.getDay() === 0 ? 6 : d.getDay() - 1] : '';
            bar.title = `${d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU')}: ${buckets[i]} ${t('profile.attempts_short')}`;
            chart.appendChild(bar);
        }
    }
    renderChart();

    // ── Courses list (Stats tab) ────────────────────────────────────
    function pickTier(p) {
        const lng = p.language || 'ru';
        const ch = p.character;
        if (lng === 'en') return ch === 'knopych' ? 'en_teen' : ch === 'klavochka' ? 'en_kids' : 'en_tier1';
        return ch === 'knopych' ? 'ru_teen' : ch === 'klavochka' ? 'ru_kids' : 'tier1';
    }
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const currentTier = pickTier(profile);
    const tierLabels = {
        'tier1':    'Русский · Tier 1 (взрослые)',
        'ru_teen':  'Русский · Подростки',
        'ru_kids':  'Русский · Дети',
        'en_tier1': 'English · Tier 1 (adults)',
        'en_teen':  'English · Teens',
        'en_kids':  'English · Kids'
    };
    const coursesEl = $('#ppCourses');
    coursesEl.innerHTML = '';
    [currentTier].forEach(tier => {
        const total = counts[tier] || 99;
        const pct = Math.round((completedCount / total) * 100);
        const row = document.createElement('div');
        row.className = 'pp-course';
        row.innerHTML = `
            <div>
                <div class="pp-course__title">${tierLabels[tier] || tier}</div>
                <div class="pp-course__sub" style="font-size:11.5px;color:var(--faint);font-family:var(--font-mono)">${completedCount} / ${total} ${t('profile.lessons_short')}</div>
                <div class="pp-course__bar"><div class="pp-course__fill" style="width:${pct}%"></div></div>
            </div>
            <div class="pp-course__pct">${pct}%</div>
        `;
        coursesEl.appendChild(row);
    });

    // ── Certificates tab progress ───────────────────────────────────
    const totalCurrent = counts[currentTier] || 99;
    const certPct = Math.round((completedCount / totalCurrent) * 100);
    $('#ppCertProgress').style.width = `${certPct}%`;
    $('#ppCertLabel').textContent = `${completedCount} / ${totalCurrent}`;

    // ── Tab switching ──────────────────────────────────────────────
    document.querySelectorAll('.pp-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.pp-tab').forEach(t => t.classList.remove('pp-tab--active'));
            tab.classList.add('pp-tab--active');
            document.querySelectorAll('.pp-tabpanel').forEach(p => {
                const isActive = p.dataset.panel === target;
                p.hidden = !isActive;
                p.classList.toggle('pp-tabpanel--active', isActive);
            });
        });
    });
});
