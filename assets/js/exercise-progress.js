/**
 * exercise-progress.js — per-exercise (per-step) прогресс гайдед-уроков.
 *
 * Отдельный localStorage-ключ (Вариант A), НЕ трогает по-урочный
 * `typing_trainer_lesson_progress` (звёзды) — поэтому course.js / task.js
 * lesson-gating / api-client-контракт не ломаются. Ключ-композит `${tier}:${lesson}`
 * (с tier — чтобы tier1/ru_kids урок 1 не сваливались в одну ячейку).
 *
 * Структура:
 *   { "tier1:1": { steps: { "1": {done:true, at:ISO}, "2": {...} } } }
 *
 * На backend (Sprint 3+) пока не зеркалим — локальный прогресс гайдед-шагов.
 */
(function () {
    'use strict';

    const KEY = (window.Settings && window.Settings.get('storage.keys.lessonExercises', 'typing_trainer_lesson_exercises'))
        || 'typing_trainer_lesson_exercises';

    function readAll() {
        try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : {}; }
        catch (e) { return {}; }
    }
    function writeAll(obj) {
        try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
        catch (e) { return false; }
    }
    function lessonKey(tier, lesson) { return `${tier}:${lesson}`; }

    const exerciseProgress = {
        STORAGE_KEY: KEY,

        /** Состояние шагов урока: { "1": {done,at}, ... } (может быть пустым). */
        getSteps(tier, lesson) {
            const all = readAll();
            const entry = all[lessonKey(tier, lesson)];
            return (entry && entry.steps) ? entry.steps : {};
        },

        isStepDone(tier, lesson, stepIdx) {
            const steps = this.getSteps(tier, lesson);
            return !!(steps[String(stepIdx)] && steps[String(stepIdx)].done);
        },

        markStepDone(tier, lesson, stepIdx) {
            const all = readAll();
            const lk = lessonKey(tier, lesson);
            if (!all[lk]) all[lk] = { steps: {} };
            if (!all[lk].steps) all[lk].steps = {};
            all[lk].steps[String(stepIdx)] = { done: true, at: new Date().toISOString() };
            writeAll(all);
        },

        /** Все ли шаги 1..totalSteps пройдены. */
        allStepsDone(tier, lesson, totalSteps) {
            if (!totalSteps) return false;
            const steps = this.getSteps(tier, lesson);
            for (let i = 1; i <= totalSteps; i++) {
                if (!(steps[String(i)] && steps[String(i)].done)) return false;
            }
            return true;
        },
    };

    window.exerciseProgress = exerciseProgress;
})();
