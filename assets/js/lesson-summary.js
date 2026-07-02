/**
 * lesson-summary.js — богатый «Отчёт по уроку» (конец УРОКА, экран B).
 *
 * Два состояния: success (празднично) / struggle (поддержка, без давления).
 * Дизайн: design/lesson_summary/lesson_summary_handoff. Данные (payload) собирает
 * task.js из статистики захода + coach.js (что хорошо / над чем поработать / мотивация).
 *
 * Кнопки: «Следующий урок» и «К списку» — ссылки (payload.nextHref/listHref);
 * «Повторить» — кнопка с id="rep-retry", её поведение навешивает task.js.
 */
(function () {
    'use strict';

    const FCOLOR = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };
    const FDARK = { pink: '#d63031', orange: '#b86e0a', green: '#00866b', blue: '#2d7fd6', indigo: '#0966b3', purple: '#6c5ce7' };

    function plural(n, one, few, many) {
        const m10 = n % 10, m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return one;
        if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
        return many;
    }

    function stars(n) {
        let h = '';
        for (let i = 1; i <= 5; i++) {
            const on = i <= n;
            h += `<svg width="28" height="28" viewBox="0 0 14 14" style="margin:0 1px"><path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z" fill="${on ? '#f59e0b' : '#e5e3da'}" stroke="${on ? '#d97706' : '#d6d3c8'}" stroke-width="0.7" stroke-linejoin="round"/></svg>`;
        }
        return h;
    }

    function keycap(label, finger) {
        const c = FCOLOR[finger] || FCOLOR.blue, d = FDARK[finger] || FDARK.blue;
        return `<div style="width:52px;height:52px;border-radius:10px;background:${c}22;border:1.5px solid ${c};color:${d};display:grid;place-items:center;font-family:var(--font-mono);font-weight:700;font-size:22px">${String(label).toUpperCase()}</div>`;
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }

    function render(root, r) {
        const isSuccess = r.state === 'success';
        const accentBg = isSuccess ? '#dbeafe' : '#fef3c7';
        const accentBorder = isSuccess ? '#93c5fd' : '#fcd34d';
        // По workflow (теория → тренажёр → назад к уроку) — две кнопки по центру:
        // «Продолжить →» (на lesson.html этого урока) и «↻ Повторить».
        const contLg = `<a class="btn btn--lg" href="${r.continueHref}">Продолжить →</a>`;
        const contSm = `<a class="btn btn--secondary" href="${r.continueHref}">Продолжить →</a>`;
        const retryLg = `<button class="btn btn--lg" id="rep-retry" type="button">↻ Повторить</button>`;
        const retrySm = `<button class="btn btn--secondary" id="rep-retry" type="button">↻ Повторить</button>`;

        root.innerHTML = `
      <div class="report-card">
        ${isSuccess ? '<div class="report-confetti"></div>' : ''}
        <div class="report-head">
          <div class="report-avatar" style="background:${accentBg};border-color:${accentBorder}">
            ${window.portraits ? window.portraits.mentor(r.mentor, 130) : ''}
          </div>
          <div>
            <div class="report-kicker" style="color:${isSuccess ? 'var(--success)' : 'var(--warn)'}">${isSuccess ? 'УРОК ПРОЙДЕН ✓' : 'УРОК ЗАВЕРШЁН'}</div>
            <h1 class="report-title">Урок ${r.lessonNum}</h1>
            <div class="report-subtitle">${esc(r.lessonTitle)}</div>
            ${r.retentionLine ? `<div class="report-retention">${esc(r.retentionLine)}</div>` : ''}
          </div>
        </div>

        ${r.keys && r.keys.length ? `
        <section class="report-block">
          <div class="report-label">ТЫ ОСВОИЛ</div>
          <div class="row" style="gap:10px;align-items:center">
            ${r.keys.map(([k, f]) => keycap(k, f)).join('')}
            <div style="margin-left:14px;color:var(--sub);font-size:14px">
              <b style="color:var(--ink);font-size:18px">+${r.keys.length}</b> ${plural(r.keys.length, 'буква', 'буквы', 'букв')}
              <div style="font-size:12px;color:var(--faint);font-family:var(--font-mono);margin-top:2px">всего ${r.learnedTotal} из ${r.learnedAll}</div>
            </div>
          </div>
        </section>` : ''}

        <section class="report-block report-metrics">
          <div class="metric metric--primary">
            <div class="report-label">ТОЧНОСТЬ</div>
            <div class="metric-val" style="color:${r.acc >= 90 ? 'var(--success)' : r.acc >= 75 ? 'var(--warn)' : 'var(--error)'}">${r.acc}<span>%</span></div>
          </div>
          <div class="metric">
            <div class="report-label">ОЦЕНКА</div>
            <div class="metric-stars">${stars(r.stars)}</div>
          </div>
          <div class="metric">
            <div class="report-label">РИТМИЧНОСТЬ</div>
            <div class="metric-val metric-val--sm">${r.rhythm}<span>%</span></div>
          </div>
          <div class="metric">
            <div class="report-label">ПОПЫТКИ</div>
            <div class="metric-val metric-val--sm">${r.attempt || 1}</div>
          </div>
          ${r.showSpeed ? `<div class="metric"><div class="report-label">СКОРОСТЬ</div><div class="metric-val metric-val--sm">${r.speed}<span>зн/мин</span></div></div>` : ''}
        </section>

        <section class="report-block report-breakdown">
          <div class="breakdown-col">
            <div class="breakdown-head" style="color:var(--success)">💪 Что хорошо</div>
            ${(r.good && r.good.length) ? r.good.map(g => `<div class="breakdown-item">${esc(g)}</div>`).join('') : '<div class="breakdown-item" style="color:var(--faint)">—</div>'}
          </div>
          <div class="breakdown-col">
            <div class="breakdown-head" style="color:${(r.work && r.work.length) ? 'var(--warn)' : 'var(--faint)'}">🎯 Над чем поработать</div>
            ${(r.work && r.work.length) ? r.work.map(w => `<div class="breakdown-item">${esc(w)}</div>`).join('') : '<div class="breakdown-item" style="color:var(--faint)">Ошибок почти нет — отлично!</div>'}
          </div>
        </section>

        <section class="report-quote" style="background:${accentBg};border-color:${accentBorder}">
          <div class="report-quote__text">«${esc(r.quote)}»</div>
          <div class="report-quote__by">— ${esc(r.mentorName)}, наставник</div>
        </section>

        <section class="report-block">
          <div class="row" style="justify-content:space-between;margin-bottom:8px">
            <span class="report-label">ПРОГРЕСС КУРСА</span>
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--sub)">Урок ${r.lesson} / ${r.lessonsTotal}</span>
          </div>
          <div class="course-track"><div class="course-fill" style="width:${Math.min(100, (r.lesson / r.lessonsTotal) * 100)}%"></div></div>
        </section>

        <div class="report-actions">
          ${isSuccess ? `${retrySm}${contLg}` : `${contSm}${retryLg}`}
        </div>
      </div>`;
    }

    window.lessonSummary = { render };
})();
