/**
 * dashboard.js — Phase 4 личный кабинет.
 * Читает профиль и прогресс из localStorage, заполняет шапку, course-card,
 * lesson-list, mentor-card, stats и achievements. Все ссылки «Начать/Продолжить»
 * ведут на index.html, где main.js auto-loads текущий урок по сохранённому
 * currentLesson и характеру юзера.
 */
// LessonLoader instantiates on DOMContentLoaded — ждём чтобы оно успело.
document.addEventListener('DOMContentLoaded', function () {
    const $ = (sel) => document.querySelector(sel);
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
        || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress'))
        || 'typing_trainer_lesson_progress';
    const currentKey = (window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson'))
        || 'typing_trainer_current_lesson';
    const historyKey = (window.Settings && window.Settings.get('storage.keys.testHistory', 'typing_trainer_test_history'))
        || 'typing_trainer_test_history';

    // ── Read state ──────────────────────────────────────────────────
    function readJSON(key) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }
    const profile = readJSON(profileKey);

    // Не авторизован → онбординг через index.html
    if (!profile || !profile.onboardingCompleted || !profile.name) {
        window.location.href = 'index.html';
        return;
    }

    const progress = readJSON(progressKey) || {};
    const currentLesson = readJSON(currentKey) || {};
    const history = readJSON(historyKey) || [];

    // ── Маршрутизация tier (повтор pickInitialTier из main.js) ──────
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

    const tier = currentLesson.tier || pickTier(profile);
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const totalLessons = counts[tier] || 99;
    const completedNums = Object.keys(progress)
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n) && progress[String(n)] && progress[String(n)].stars > 0);
    const completedCount = completedNums.length;
    const lessonNum = Number.isFinite(currentLesson.lessonNumber) ? currentLesson.lessonNumber : (completedCount + 1);
    const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

    // ── Header: portrait + name ────────────────────────────────────
    const gender = profile.gender || 'm';
    const audience = profile.audience || 'adult';
    if (window.portraits) {
        $('#dhProfileAvatar').innerHTML = window.portraits.user(audience, gender, 32);
    }
    $('#dhProfileName').textContent = profile.name;
    $('#dhProfileMenuName').textContent = profile.name;
    $('#dhProfileMenuSub').textContent = audience === 'teen' ? 'Подростковый курс'
                                       : audience === 'kid'  ? 'Детский курс'
                                       : 'Основной курс';

    // ── Welcome strip ──────────────────────────────────────────────
    const dateStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    $('#dhDate').textContent = dateStr;
    $('#dhWelcomeName').textContent = profile.name;

    // ── Streak (если в history есть дни подряд — пока считаем дешёвой эвристикой) ──
    const streakDays = computeStreak(history);
    if (streakDays > 0) {
        $('#dhStreak').hidden = false;
        $('#dhStreakDays').textContent = streakDays;
    }
    function computeStreak(items) {
        if (!Array.isArray(items) || !items.length) return 0;
        const days = new Set();
        items.forEach(it => {
            const t = it && (it.completedAt || it.timestamp);
            if (t) days.add(new Date(t).toISOString().slice(0, 10));
        });
        const sorted = [...days].sort().reverse();
        if (!sorted.length) return 0;
        let streak = 1;
        let prev = new Date(sorted[0]);
        for (let i = 1; i < sorted.length; i++) {
            const cur = new Date(sorted[i]);
            const diff = Math.round((prev - cur) / 86400000);
            if (diff === 1) { streak++; prev = cur; } else break;
        }
        return streak;
    }

    // ── Language config ────────────────────────────────────────────
    const LANGS = [
        { id: 'ru',  code: 'RU',  layout: 'ЙЦУКЕН', label: 'Русский',  tier: 'tier1',    audience_map: { adult: 'tier1', teen: 'ru_teen', kid: 'ru_kids' } },
        { id: 'en',  code: 'EN',  layout: 'QWERTY', label: 'English',  tier: 'en_tier1', audience_map: { adult: 'en_tier1', teen: 'en_teen', kid: 'en_kids' } }
    ];
    const activeLang = LANGS.find(l => l.id === (profile.language || 'ru')) || LANGS[0];
    $('#dhLangBtn').dataset.lang = activeLang.id;
    $('#dhLangBtnCode').textContent = activeLang.code;
    $('#dhLangBtnLayout').textContent = activeLang.layout;

    // Language menu items
    const langMenu = $('#dhLangMenu');
    LANGS.forEach(l => {
        const tierForLang = l.audience_map[audience] || l.tier;
        const totalInTier = counts[tierForLang] || 0;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'dh-lang-item' + (l.id === activeLang.id ? ' dh-lang-item--active' : '');
        item.innerHTML = `
            <span class="dh-lang-item__badge">${l.code}</span>
            <div style="flex:1">
                <div class="dh-lang-item__name">${l.label} <span class="dh-lang-item__layout">${l.layout}</span></div>
                <div class="dh-lang-item__sub">${totalInTier} уроков</div>
            </div>
            ${l.id === activeLang.id ? '<div class="dh-lang-item__check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : ''}
        `;
        item.addEventListener('click', () => {
            if (l.id === activeLang.id) return;
            const newProfile = Object.assign({}, profile, { language: l.id });
            localStorage.setItem(profileKey, JSON.stringify(newProfile));
            // Сбросить currentLesson чтобы main.js маршрутизировал заново
            localStorage.removeItem(currentKey);
            location.reload();
        });
        langMenu.appendChild(item);
    });

    // ── Course card ────────────────────────────────────────────────
    const audienceLabel = { adult: 'десятипальцевый метод', teen: 'подростковый курс', kid: 'детский курс' }[audience] || 'курс';
    $('#dhCourseTitle').textContent = activeLang.id === 'ru' ? 'Русский курс' : 'English course';
    $('#dhCourseLayout').textContent = activeLang.layout;
    $('#dhCourseSub').textContent = `${audienceLabel} · ${totalLessons} уроков`;
    $('#dhCoursePct').textContent = pct + '%';
    $('#dhCoursePctSub').textContent = `${completedCount}/${totalLessons} уроков`;
    $('#dhCourseBarFill').style.width = pct + '%';
    $('#dhNextNum').textContent = lessonNum;
    $('#dhAllLessons').textContent = `Все ${totalLessons} →`;
    // «Продолжить» → теория урока (lesson.html), оттуда уже кнопка в тренажёр
    $('#dhContinue').href = `lesson.html?tier=${encodeURIComponent(tier)}&lesson=${lessonNum}`;

    // ── Load next lesson title via lesson-loader ───────────────────
    function fetchLessonTitle(t, n) {
        if (!window.lessonLoader) return Promise.resolve(null);
        return window.lessonLoader.loadLesson(t, n).catch(() => null);
    }
    fetchLessonTitle(tier, lessonNum).then(lesson => {
        if (lesson) {
            $('#dhNextTitle').textContent = lesson.title || `Урок ${lessonNum}`;
            const wpm = lesson.target_wpm ? `${lesson.target_wpm} WPM` : '';
            const errs = Number.isFinite(lesson.error_limit) ? `допустимо ошибок: ${lesson.error_limit}` : '';
            $('#dhNextMeta').textContent = [wpm, errs].filter(Boolean).join(' · ') || '~ 5 минут';
        }
    });

    // ── Lesson list — last 2 completed + current + 2 locked ────────
    const lessonsContainer = $('#dhLessons');
    const fingerColors = ['blue', 'indigo', 'pink', 'green', 'indigo']; // циклические для номеров
    const recentDone = completedNums.sort((a, b) => a - b).slice(-2);
    const lessonRows = [];
    recentDone.forEach(n => lessonRows.push({ n, done: true, prog: progress[String(n)] }));
    lessonRows.push({ n: lessonNum, next: true });
    for (let i = 1; i <= 2; i++) {
        if (lessonNum + i <= totalLessons) lessonRows.push({ n: lessonNum + i, locked: true });
    }

    Promise.all(lessonRows.map(r => fetchLessonTitle(tier, r.n).then(l => Object.assign(r, { lesson: l }))))
        .then(rows => {
            rows.forEach((r, idx) => {
                const colorIdx = (r.n - 1) % fingerColors.length;
                const fcolor = fingerColors[colorIdx];
                const row = document.createElement('div');
                row.className = 'dh-lesson' + (r.next ? ' dh-lesson--next' : r.locked ? ' dh-lesson--locked' : '');
                const numClass = r.done ? 'dh-lesson__num--done'
                    : r.locked ? 'dh-lesson__num--locked'
                    : `dh-lesson__num--next-${fcolor}`;
                const numContent = r.done
                    ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                    : r.locked
                    ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1" fill="currentColor"/><path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
                    : r.n;
                const title = (r.lesson && r.lesson.title) || `Урок ${r.n}`;
                let meta = '';
                if (r.done && r.prog) {
                    const acc = r.prog.bestAccuracy ? `${Math.round(r.prog.bestAccuracy)}%` : '—';
                    const wpm = r.prog.bestWPM ? `${Math.round(r.prog.bestWPM)} зн/мин` : '—';
                    meta = `<div class="dh-lesson__meta">Урок ${r.n} · точность ${acc} · ${wpm}</div>`;
                } else if (r.locked) {
                    meta = `<div class="dh-lesson__meta dh-lesson__meta--locked">Откроется после урока ${r.n - 1}</div>`;
                } else {
                    meta = `<div class="dh-lesson__meta">Урок ${r.n}</div>`;
                }
                const nowChip = r.next ? '<span class="dh-lesson__now-chip">· СЕЙЧАС</span>' : '';
                const startBtn = r.next ? `<a class="dh-lesson__start" href="lesson.html?tier=${encodeURIComponent(tier)}&lesson=${r.n}">Начать →</a>` : '';
                row.innerHTML = `
                    <div class="dh-lesson__num ${numClass}">${numContent}</div>
                    <div class="dh-lesson__info">
                        <div class="dh-lesson__title">${escapeHtml(title)}${nowChip}</div>
                        ${meta}
                    </div>
                    ${startBtn}
                `;
                lessonsContainer.appendChild(row);
            });
        });

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }

    // ── Mentor card ────────────────────────────────────────────────
    const mentorId = profile.character || (audience === 'teen' ? 'knopych' : audience === 'kid' ? 'klavochka' : 'anna');
    const mentorMeta = {
        anna:      { name: 'АННА',      role: 'НАСТАВНИК', greet: 'Готов к новому уроку?' },
        maxim:     { name: 'МАКСИМ',    role: 'НАСТАВНИК', greet: 'Сегодня закрепим Ж и Э — самые лживые клавиши русской раскладки. Готов?' },
        knopych:   { name: 'КНОПЫЧ',    role: 'НАСТАВНИК', greet: 'Поехали! Новый квест начинается!' },
        klavochka: { name: 'КЛАВОЧКА',  role: 'НАСТАВНИЦА', greet: 'Привет! Начинаем новый урок?' }
    }[mentorId] || { name: 'НАСТАВНИК', role: 'НАСТАВНИК', greet: 'Готов?' };
    if (window.portraits && window.portraits.mentor) {
        $('#dhMentorPortrait').innerHTML = window.portraits.mentor(mentorId, 48);
    }
    $('#dhMentorRole').textContent = `${mentorMeta.name} · ${mentorMeta.role}`;
    $('#dhMentorText').textContent = `«${mentorMeta.greet}»`;

    // ── Stats — агрегация из lessonProgress + history ──────────────
    let bestWpm = 0, bestAcc = 0, totalSec = 0;
    Object.values(progress).forEach(p => {
        if (p.bestWPM && p.bestWPM > bestWpm) bestWpm = p.bestWPM;
        if (p.bestAccuracy && p.bestAccuracy > bestAcc) bestAcc = p.bestAccuracy;
    });
    (history || []).forEach(h => {
        if (h && Number.isFinite(h.duration)) totalSec += h.duration;
        else if (h && Number.isFinite(h.time))     totalSec += h.time;
    });
    $('#dhStatSpeed').textContent    = bestWpm ? Math.round(bestWpm) : '—';
    $('#dhStatAccuracy').textContent = bestAcc ? Math.round(bestAcc) : '—';
    $('#dhStatTime').textContent     = totalSec ? (totalSec / 3600).toFixed(1) : '—';
    $('#dhStatStreak').textContent   = streakDays || '—';

    // ── Achievements (топ-6) ────────────────────────────────────────
    // Источник истины — assets/js/achievements.js (общий каталог + computation).
    // На дашборде показываем 6: сначала недавние earned, затем ближайшие к
    // unlock'у. Полный список → achievements.html.
    let achievementsList = [];
    if (window.achievements) {
        const stats = window.achievements.computeStats(progress, history, totalLessons);
        achievementsList = window.achievements.getAchievements(stats);
    }
    // Top-6: первые earned + остальные по убыванию progress
    const earned = achievementsList.filter(a => a.earned);
    const notEarned = achievementsList.filter(a => !a.earned).sort((a, b) => b.progress - a.progress);
    const top6 = [...earned, ...notEarned].slice(0, 6);

    const achGrid = $('#dhAchGrid');
    top6.forEach(a => {
        const item = document.createElement('div');
        item.className = 'dh-ach__item' + (a.earned ? ' dh-ach__item--earned' : '');
        const showBar = !a.earned && a.threshold > 1;
        item.innerHTML = `
            <div class="dh-ach__icon">${a.icon}</div>
            <div class="dh-ach__label">${escapeHtml(a.label)}</div>
            ${showBar ? `<div class="dh-ach__bar"><div class="dh-ach__bar-fill" style="width:${Math.min(100, Math.round(a.progress * 100))}%"></div></div>` : ''}
        `;
        achGrid.appendChild(item);
    });
    const totalEarned = earned.length;
    $('#dhAchCount').innerHTML = `<a href="achievements.html" style="color:inherit;text-decoration:none">${totalEarned}/${achievementsList.length} · все →</a>`;

    // ── Dropdown toggles ───────────────────────────────────────────
    const langBtn = $('#dhLangBtn');
    const langMenuEl = $('#dhLangMenu');
    const profBtn = $('#dhProfileBtn');
    const profMenuEl = $('#dhProfileMenu');
    function closeAll() {
        langMenuEl.classList.remove('open');
        profMenuEl.classList.remove('open');
        langBtn.setAttribute('aria-expanded', 'false');
        profBtn.setAttribute('aria-expanded', 'false');
    }
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = langMenuEl.classList.contains('open');
        closeAll();
        if (!wasOpen) { langMenuEl.classList.add('open'); langBtn.setAttribute('aria-expanded', 'true'); }
    });
    profBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = profMenuEl.classList.contains('open');
        closeAll();
        if (!wasOpen) { profMenuEl.classList.add('open'); profBtn.setAttribute('aria-expanded', 'true'); }
    });
    document.addEventListener('click', (e) => {
        if (!langMenuEl.contains(e.target) && e.target !== langBtn) langMenuEl.classList.remove('open');
        if (!profMenuEl.contains(e.target) && e.target !== profBtn) profMenuEl.classList.remove('open');
    });

    // Logout
    $('#dhLogout').addEventListener('click', () => {
        if (!confirm('Выйти? Прогресс сохранится, но онбординг откроется заново.')) return;
        try { localStorage.removeItem(profileKey); } catch (e) {}
        window.location.href = 'index.html';
    });
});
