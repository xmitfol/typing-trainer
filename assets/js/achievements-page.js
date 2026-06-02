/**
 * achievements-page.js — рендер страницы «Все достижения».
 * Группирует достижения из achievements.CATALOG по группам, показывает
 * earned (с акцентом) и locked (приглушённо) с прогресс-баром.
 */
document.addEventListener('DOMContentLoaded', function () {
    const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile')) || 'typing_trainer_user_profile';
    const progressKey = (window.Settings && window.Settings.get('storage.keys.lessonProgress', 'typing_trainer_lesson_progress')) || 'typing_trainer_lesson_progress';
    const historyKey = (window.Settings && window.Settings.get('storage.keys.testHistory', 'typing_trainer_test_history')) || 'typing_trainer_test_history';

    const readJSON = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const profile = readJSON(profileKey);
    if (!profile || !profile.onboardingCompleted) { window.location.href = 'index.html'; return; }

    // tier → totalLessons
    function pickTier(p) {
        const lang = p.language || 'ru'; const ch = p.character;
        if (lang === 'en') { if (ch === 'knopych') return 'en_teen'; if (ch === 'klavochka') return 'en_kids'; return 'en_tier1'; }
        if (ch === 'knopych') return 'ru_teen'; if (ch === 'klavochka') return 'ru_kids'; return 'tier1';
    }
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    const tier = (readJSON((window.Settings && window.Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson')) || 'typing_trainer_current_lesson') || {}).tier || pickTier(profile);
    const totalLessons = counts[tier] || 99;

    const progress = readJSON(progressKey) || {};
    const history = readJSON(historyKey) || [];

    const stats = window.achievements.computeStats(progress, history, totalLessons);
    const all = window.achievements.getAchievements(stats);
    const earnedCount = all.filter(a => a.earned).length;

    document.getElementById('ach-count').textContent = `${earnedCount}/${all.length} получено`;

    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }

    const groupsContainer = document.getElementById('ach-groups');
    window.achievements.GROUPS.forEach(g => {
        const items = all.filter(a => a.group === g.id);
        if (!items.length) return;
        const wrap = document.createElement('section');
        wrap.className = 'ach-group';
        wrap.dataset.group = g.id;
        const earnedInGroup = items.filter(i => i.earned).length;
        wrap.innerHTML = `
            <h2 class="ach-group__title">${escapeHtml(g.label)} · ${earnedInGroup}/${items.length}</h2>
            <div class="ach-grid">
                ${items.map(a => renderCard(a)).join('')}
            </div>
        `;
        groupsContainer.appendChild(wrap);
    });

    function renderCard(a) {
        const pct = Math.round(a.progress * 100);
        const counter = (a.threshold > 1)
            ? `<span class="ach-card__counter">${Math.min(a.current, a.threshold)}/${a.threshold}</span>`
            : '';
        return `
            <div class="ach-card${a.earned ? ' ach-card--earned' : ''}" data-id="${a.id}">
                <div class="ach-card__icon">${a.icon}</div>
                <div class="ach-card__body">
                    <div class="ach-card__label">${escapeHtml(a.label)}</div>
                    <div class="ach-card__desc">${escapeHtml(a.desc)}</div>
                    ${a.threshold > 1 ? `
                        <div class="ach-card__progress">
                            <div class="ach-card__bar"><div class="ach-card__bar-fill${a.earned ? ' ach-card__bar-fill--done' : ''}" style="width:${pct}%"></div></div>
                            ${counter}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
});
