// lesson-summary.js — Lesson report screen (end-of-lesson rich summary)
// Two states: success (celebration) / struggle (support). Toggle via data.
(function () {
  'use strict';

  const FCOLOR = { pink:'#ff7675', orange:'#fdcb6e', green:'#00b894', blue:'#74b9ff', indigo:'#0984e3', purple:'#a29bfe' };
  const FDARK  = { pink:'#d63031', orange:'#b86e0a', green:'#00866b', blue:'#2d7fd6', indigo:'#0966b3', purple:'#6c5ce7' };

  // Demo lesson report payloads
  const REPORTS = {
    success: {
      mentor: 'maxim', mentorName: 'Максим',
      lessonNum: 1, lessonTitle: 'Первые буквы: А, О, В, Л',
      keys: [['а','blue'],['о','indigo'],['в','green'],['л','green']],
      learnedTotal: 4, learnedAll: 33,
      stars: 5, acc: 98, rhythm: 84, speed: 142, showSpeed: false,
      good: ['Точность почти идеальная — 98%', 'Ровный, спокойный ритм'],
      work: [],
      quote: 'Погибает не тот, кто устал, а кто остановился. Ты идёшь ровно — так держать.',
      lesson: 1, lessonsTotal: 20,
      state: 'success',
    },
    struggle: {
      mentor: 'anna', mentorName: 'Анна',
      lessonNum: 1, lessonTitle: 'Первые буквы: А, О, В, Л',
      keys: [['а','blue'],['о','indigo'],['в','green'],['л','green']],
      learnedTotal: 4, learnedAll: 33,
      stars: 2, acc: 81, rhythm: 58, speed: 64, showSpeed: false,
      good: ['Ты дошёл до конца — это главное'],
      work: ['Чаще всего спотыкался на «Л» — повтори её отдельно', 'Темп рваный — попробуй медленнее, но ровнее'],
      quote: 'Не страшно ошибаться — страшно бросить. Давай ещё один спокойный заход, и всё получится.',
      lesson: 1, lessonsTotal: 20,
      state: 'struggle',
      errorKey: 'л',
    },
  };

  function stars(n) {
    let h = '';
    for (let i = 1; i <= 5; i++) {
      h += `<svg width="28" height="28" viewBox="0 0 14 14" style="margin:0 1px"><path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z" fill="${i <= n ? '#f59e0b' : '#e5e3da'}" stroke="${i <= n ? '#d97706' : '#d6d3c8'}" stroke-width="0.7" stroke-linejoin="round"/></svg>`;
    }
    return h;
  }

  function keycap(label, finger, big) {
    const sz = big ? 52 : 44;
    return `<div style="width:${sz}px;height:${sz}px;border-radius:10px;background:${FCOLOR[finger]}22;border:1.5px solid ${FCOLOR[finger]};color:${FDARK[finger]};display:grid;place-items:center;font-family:var(--font-mono);font-weight:700;font-size:${big?22:18}px">${label.toUpperCase()}</div>`;
  }

  function render(r) {
    const root = document.getElementById('report');
    const isSuccess = r.state === 'success';
    const accentBg = isSuccess ? '#dbeafe' : '#fef3c7';
    const accentBorder = isSuccess ? '#93c5fd' : '#fcd34d';

    root.innerHTML = `
      <div class="report-card">
        ${isSuccess ? '<div class="confetti"></div>' : ''}

        <!-- Header -->
        <div class="report-head">
          <div class="report-avatar" style="background:${accentBg};border-color:${accentBorder}">
            ${window.portraits.mentor(r.mentor, 130)}
          </div>
          <div>
            <div class="report-kicker">${isSuccess ? 'УРОК ПРОЙДЕН ✓' : 'УРОК ЗАВЕРШЁН'}</div>
            <h1 class="report-title">Урок ${r.lessonNum}</h1>
            <div class="report-subtitle">${r.lessonTitle}</div>
          </div>
        </div>

        <!-- Learned keys -->
        <section class="report-block">
          <div class="report-label">ТЫ ОСВОИЛ</div>
          <div class="row" style="gap:10px;align-items:center">
            ${r.keys.map(([k, f]) => keycap(k, f, true)).join('')}
            <div style="margin-left:14px;color:var(--sub);font-size:14px">
              <b style="color:var(--ink);font-size:18px">+${r.keys.length}</b> ${plural(r.keys.length,'буква','буквы','букв')}
              <div style="font-size:12px;color:var(--faint);font-family:var(--font-mono);margin-top:2px">всего ${r.learnedTotal} из ${r.learnedAll}</div>
            </div>
          </div>
        </section>

        <!-- Metrics -->
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
          ${r.showSpeed ? `<div class="metric"><div class="report-label">СКОРОСТЬ</div><div class="metric-val metric-val--sm">${r.speed}<span>зн/мин</span></div></div>` : ''}
        </section>

        <!-- Breakdown -->
        <section class="report-block report-breakdown">
          <div class="breakdown-col">
            <div class="breakdown-head" style="color:var(--success)">💪 Что хорошо</div>
            ${r.good.map(g => `<div class="breakdown-item">${g}</div>`).join('') || '<div class="breakdown-item" style="color:var(--faint)">—</div>'}
          </div>
          <div class="breakdown-col">
            <div class="breakdown-head" style="color:${r.work.length ? 'var(--warn)' : 'var(--faint)'}">🎯 Над чем поработать</div>
            ${r.work.length ? r.work.map(w => `<div class="breakdown-item">${w}</div>`).join('') : '<div class="breakdown-item" style="color:var(--faint)">Ошибок почти нет — отлично!</div>'}
          </div>
        </section>

        <!-- Mentor quote -->
        <section class="report-quote" style="background:${accentBg};border-color:${accentBorder}">
          <div class="report-quote__text">«${r.quote}»</div>
          <div class="report-quote__by">— ${r.mentorName}, наставник</div>
        </section>

        <!-- Course progress -->
        <section class="report-block">
          <div class="row" style="justify-content:space-between;margin-bottom:8px">
            <span class="report-label">ПРОГРЕСС КУРСА</span>
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--sub)">Урок ${r.lesson} / ${r.lessonsTotal}</span>
          </div>
          <div class="course-track"><div class="course-fill" style="width:${(r.lesson / r.lessonsTotal) * 100}%"></div></div>
        </section>

        <!-- Actions -->
        <div class="report-actions">
          ${isSuccess
            ? `<button class="btn btn--lg">Следующий урок →</button>
               <button class="btn btn--secondary">↻ Повторить</button>
               <button class="btn btn--ghost">К списку уроков</button>`
            : `<button class="btn btn--lg">↻ Повторить урок</button>
               <button class="btn btn--secondary">Следующий урок →</button>
               <button class="btn btn--ghost">К списку уроков</button>`}
        </div>
      </div>
    `;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  // Toggle buttons
  let cur = 'success';
  function show(state) { cur = state; render(REPORTS[state]);
    document.querySelectorAll('.state-toggle button').forEach(b => b.dataset.active = (b.dataset.state === state).toString());
  }
  document.querySelectorAll('.state-toggle button').forEach(b => b.addEventListener('click', () => show(b.dataset.state)));

  show('success');
})();
