// task.js — drives the practice screen: keyboard + metrics + mentor + success
// Reads lesson from URL, runs exercises sequentially, updates <typing-keyboard>.

(function () {
  'use strict';

  const { tier, lesson } = window.lessonData.getParams();
  const lessonObj = window.lessonData.getLesson(tier, lesson);

  // ── DOM refs ───────────────────────────────────────────────────────────
  const kb        = document.getElementById('kb');
  const capture   = document.getElementById('capture');
  const targetEl  = document.getElementById('target');
  const fillEl    = document.getElementById('progress-fill');
  const countEl   = document.getElementById('progress-count');
  const numEl     = document.getElementById('task-num');
  const attemptEl = document.getElementById('attempt-n');
  const statTime  = document.getElementById('stat-time');
  const statSpeed = document.getElementById('stat-speed');
  const statAcc   = document.getElementById('stat-acc');
  const legendEl  = document.getElementById('legend');
  const tipEl     = document.getElementById('mentor-tip');
  const hintEl    = document.getElementById('mentor-hint');
  const avatarEl  = document.getElementById('mentor-avatar');
  const successEl = document.getElementById('success');
  const taskBody  = document.getElementById('task-body');
  const toolbar   = document.getElementById('toolbar');
  const kbStage   = document.getElementById('kb-stage');

  // ── Mentor avatar ──────────────────────────────────────────────────────
  avatarEl.innerHTML = window.portraits.mentor(lessonObj.mentor, 80);

  // ── Finger legend ──────────────────────────────────────────────────────
  const FINGERS = [
    ['pink', 'Мизинец'], ['orange', 'Безымянный'], ['green', 'Средний'],
    ['blue', 'Указ. левый'], ['indigo', 'Указ. правый'], ['purple', 'Большой'],
  ];
  const FCOLOR = { pink:'#ff7675', orange:'#fdcb6e', green:'#00b894', blue:'#74b9ff', indigo:'#0984e3', purple:'#a29bfe' };
  legendEl.innerHTML = FINGERS.map(([f, label]) =>
    `<div class="legend__item"><span class="legend__chip" style="background:${FCOLOR[f]}"></span><span>${label}</span></div>`
  ).join('');

  // ── State ──────────────────────────────────────────────────────────────
  let exIdx = 0;
  let typed = 0;
  let errors = 0;
  let attempt = 1;
  let startTime = null;
  let timerInterval = null;

  function currentExercise() { return lessonObj.exercises[exIdx]; }

  // ── Render target text ─────────────────────────────────────────────────
  function renderTarget() {
    const ex = currentExercise();
    const t = ex.target;
    targetEl.innerHTML = t.split('').map((ch, i) => {
      const cls = i < typed ? 'done' : i === typed ? 'cur' : '';
      return `<span class="${cls}">${ch === ' ' ? '&nbsp;' : ch}</span>`;
    }).join('');
    countEl.textContent = `${typed}/${t.length}`;
    fillEl.style.width = `${(typed / t.length) * 100}%`;
    // Update keyboard highlight (next char to press)
    const nextCh = t[typed];
    if (nextCh === ' ') {
      kb.setAttribute('highlight-char', ' ');
    } else if (nextCh) {
      kb.setAttribute('highlight-char', nextCh);
    } else {
      kb.removeAttribute('highlight-char');
    }
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  function updateStats() {
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    const correct = typed - errors;
    const wpm = elapsed > 0 ? Math.round(correct / (elapsed / 60)) : 0;
    const acc = typed > 0 ? Math.round((correct / typed) * 100) : 100;
    const m = Math.floor(elapsed / 60), s = Math.floor(elapsed % 60);
    statTime.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    statSpeed.innerHTML = `${wpm} <span style="font-size:11px;color:var(--faint)">зн/мин</span>`;
    statAcc.innerHTML = `${acc}<span style="font-size:11px;color:var(--faint)">%</span>`;
  }

  // ── Tip rotation ───────────────────────────────────────────────────────
  function setTip() {
    const tips = lessonObj.tips;
    tipEl.textContent = tips[exIdx % tips.length];
    hintEl.textContent = currentExercise().hint;
  }

  // ── Load exercise ──────────────────────────────────────────────────────
  function loadExercise() {
    const ex = currentExercise();
    typed = 0; errors = 0;
    numEl.textContent = ex.id;
    attemptEl.textContent = attempt;
    setTip();
    renderTarget();
    updateStats();
  }

  // ── Input handling ─────────────────────────────────────────────────────
  function handleKey(e) {
    const ex = currentExercise();
    const t = ex.target;

    if (e.key === 'Backspace') {
      if (typed > 0) { typed--; renderTarget(); updateStats(); }
      e.preventDefault();
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault();

    if (!startTime) {
      startTime = Date.now();
      timerInterval = setInterval(updateStats, 500);
    }

    const expected = t[typed];
    if (e.key === expected) {
      kb.flashActive(e.code, 140);
      typed++;
      renderTarget();
      updateStats();
      if (typed >= t.length) finishExercise();
    } else {
      kb.flashError(e.code);
      errors++;
      typed++;
      renderTarget();
      updateStats();
      if (typed >= t.length) finishExercise();
    }
  }

  // ── Finish ─────────────────────────────────────────────────────────────
  function finishExercise() {
    clearInterval(timerInterval);
    const elapsed = (Date.now() - startTime) / 1000;
    const correct = typed - errors;
    const wpm = Math.round(correct / (elapsed / 60));
    const acc = Math.round((correct / typed) * 100);
    // grade: 5 stars if acc==100, scale down
    const grade = Math.max(1, Math.min(5, (acc / 100) * 5));
    const stars = '★'.repeat(Math.floor(grade)) + (grade % 1 >= 0.5 ? '½' : '');

    document.getElementById('success-num').textContent = currentExercise().id;
    document.getElementById('success-avatar').innerHTML = window.portraits.mentor(lessonObj.mentor, 150);
    document.getElementById('final-grade').textContent = stars || '★';
    document.getElementById('final-speed').innerHTML = `${wpm} <span style="font-size:11px;color:var(--faint)">зн/мин</span>`;
    document.getElementById('final-acc').innerHTML = `${acc}<span style="font-size:11px;color:var(--faint)">%</span>`;
    document.getElementById('success-msg').textContent = acc === 100
      ? 'Без единой ошибки. Отличный ритм — идём дальше.'
      : `Точность ${acc}%. Хорошо, но можно чище. Попробуй ещё или иди дальше.`;

    // mentor tip on success
    tipEl.textContent = acc >= 95 ? 'Отлично! Ритм уверенный, можно чуть ускориться.' : 'Неплохо. На следующей попытке целься в 95%+.';
    hintEl.textContent = '';

    const isLast = exIdx >= lessonObj.exercises.length - 1;
    document.getElementById('next-btn').textContent = isLast ? 'Завершить урок →' : `Продолжить · ${lessonObj.exercises[exIdx + 1].id} →`;

    taskBody.classList.add('hide');
    toolbar.classList.add('hide');
    kbStage.classList.add('hide');
    successEl.classList.add('show');
  }

  // ── Buttons ────────────────────────────────────────────────────────────
  document.getElementById('restart-btn').addEventListener('click', () => {
    typed = 0; errors = 0; startTime = null; clearInterval(timerInterval);
    attempt++; attemptEl.textContent = attempt;
    renderTarget(); updateStats(); capture.focus();
  });

  document.getElementById('retry-btn').addEventListener('click', () => {
    attempt++;
    startTime = null; clearInterval(timerInterval);
    successEl.classList.remove('show');
    taskBody.classList.remove('hide');
    toolbar.classList.remove('hide');
    kbStage.classList.remove('hide');
    loadExercise();
    capture.focus();
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    const isLast = exIdx >= lessonObj.exercises.length - 1;
    if (isLast) {
      // back to lesson list / next lesson — in prod: navigate
      window.location.href = `course.html?tier=${tier}`;
      return;
    }
    exIdx++;
    attempt = 1;
    startTime = null;
    successEl.classList.remove('show');
    taskBody.classList.remove('hide');
    toolbar.classList.remove('hide');
    kbStage.classList.remove('hide');
    loadExercise();
    capture.focus();
  });

  // ── Toolbar: hide hint, switch type/layout ───────────────────────────────
  document.getElementById('hide-hint-btn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const active = btn.dataset.active === 'true';
    btn.dataset.active = (!active).toString();
    if (!active) kb.setAttribute('intensity', 'highlight');
    else kb.setAttribute('intensity', 'full');
  });

  document.getElementById('type-select').addEventListener('change', (e) => {
    const v = e.target.value;
    kb.setAttribute('type', v);
    if (v === 'ergonomic') { kb.setAttribute('unit', '38'); kb.setAttribute('gap', '52'); kb.setAttribute('angle', '10'); }
    else if (v === 'laptop') kb.setAttribute('unit', '44');
    else kb.setAttribute('unit', '40');
  });

  // ── Focus management — keep hidden input focused ─────────────────────────
  capture.addEventListener('keydown', handleKey);
  document.querySelector('.task-card').addEventListener('click', () => capture.focus());
  window.addEventListener('load', () => capture.focus());

  // ── Init ─────────────────────────────────────────────────────────────────
  loadExercise();
  capture.focus();
})();
