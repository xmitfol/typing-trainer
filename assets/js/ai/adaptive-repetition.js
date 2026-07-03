/**
 * adaptive-repetition.js — Phase 1 (MVP-cut) адаптивного движка «слабые клавиши».
 *
 * Спека: docs/spec/methodology/adaptive_repetition_spec.md (owner: Ася).
 * Rule-based, client-side, offline. Чистые функции + local-хранилище per-key статистики.
 *
 * Phase 1 scope (§7 spec, MVP-cut + 2-я итерация):
 *   1. Сбор per-key статистики (recordKey + key_stats ключ).
 *   2. computeReps — mastery/weak (§4.1) → множитель (§4.2) → clamp.
 *   3. Декларативная модель урока unit/baseReps/keys (подключена в lesson_01).
 *   4. flushSession — персист накопленной за сессию статистики.
 *   5. weakKeys — выборщик слабых клавиш (remediation + профиль).
 *   6. decay (§4.4): затухание мастерства на чтение (2-я итерация).
 *   7. remediationStep/remediationStepForKey/noteRemediationPass (§4.3):
 *      точечный дрилл на слабую клавишу, cap на урок, «не зацикливать» (2-я итерация).
 *
 * Weak-keys в профиле (§6, adult explainable) — рендер в profile.js через weakKeys().
 *
 * Backward-compat: модуль fail-safe. Нет данных / битый стор → status "unknown" →
 * factor 1.0 → computeReps возвращает baseReps без изменений. Урок без unit/baseReps
 * движок не трогает (computeReps возвращает null → вызывающий код берёт legacy target).
 *
 * Экспорт: window.adaptiveReps.
 */
(function () {
    'use strict';

    const KEY = (window.Settings && window.Settings.get('storage.keys.keyStats', 'typing_trainer_key_stats'))
        || 'typing_trainer_key_stats';

    // ─── [TUNE]-константы (дефолты для запуска, на ревью Аси) ──────────────────
    // Значения из §4.1–4.2 spec. audience-профиль (§6) переопределяет часть порогов.
    const TUNE = {
        MIN_SAMPLE: 15,          // §4.1 — меньше касаний → status "unknown" (холодный старт)
        LAT_BUFFER: 30,          // §3.1 — ring buffer латентностей на клавишу
        // mastery (§4.1)
        MASTERED_ERR: 0.03,      // errorRate < 3%
        MASTERED_STREAK: 10,     // correctStreak >= 10
        MASTERED_LAT_RATIO: 1.2, // latRatio <= 1.2 (в пределах +20% личной медианы)
        WEAK_ERR: 0.10,          // errorRate > 10% (переопределяется audience)
        WEAK_ERR_SOFT: 0.06,     // >6% ошибок ПРИ высокой hesitation
        WEAK_LAT_RATIO: 1.6,     // latRatio > 1.6 = заметная hesitation
        // множитель повторов (§4.2)
        FACTOR_MASTERED: 0.5,
        FACTOR_LEARNING: 1.0,
        FACTOR_WEAK: 1.6,
        FACTOR_WEAK_HIGH_LAT: 2.0,
        REPS_MIN: 2,             // никогда не 0 (переопределяется audience)
        REPS_MAX_MULT: 2.5,      // REPS_MAX = baseReps * mult (переопределяется audience)
        LAT_OUTLIER_MS: 2000,    // отсев outlier-латентностей (как в task.js)
        // decay (§4.4) [TUNE]
        DECAY_IDLE_DAYS: 7,      // дней без практики клавиши → streak затухает
        DECAY_STREAK_FACTOR: 0.5,// half-life: effectiveStreak = floor(streak * 0.5)
        // remediation (§4.3) [TUNE]
        REMEDIATION_REPS: 3,     // групп в remediation-дрилле (короткий, анти-фрустрация)
        REMEDIATION_MAX_PASSES: 2, // заходов на клавишу в уроке; дальше — persisted weak, не зацикливаем
    };

    // audience-профиль порогов (§6 spec). Ключ — audience (не tier), маппинг tier→audience ниже.
    // [TUNE] значения из таблицы §6.
    const AUDIENCE = {
        kids:  { REPS_MIN: 3, REPS_MAX_MULT: 2.0, WEAK_ERR: 0.15, MAX_REMEDIATION: 1 },
        teen:  { REPS_MIN: 2, REPS_MAX_MULT: 2.5, WEAK_ERR: 0.12, MAX_REMEDIATION: 2 },
        adult: { REPS_MIN: 2, REPS_MAX_MULT: 3.0, WEAK_ERR: 0.10, MAX_REMEDIATION: 2 },
    };

    // tier → audience. ru_kids/en_kids → kids; ru_teen/en_teen → teen; tier1/en_tier1 → adult.
    function audienceForTier(tier) {
        const s = String(tier || '');
        if (s.indexOf('kids') !== -1) return 'kids';
        if (s.indexOf('teen') !== -1) return 'teen';
        return 'adult';
    }
    // Слить дефолты TUNE с audience-переопределениями.
    function profileForTier(tier) {
        const a = AUDIENCE[audienceForTier(tier)] || AUDIENCE.adult;
        return Object.assign({}, TUNE, a);
    }

    // ─── Хранилище (паттерн exercise-progress.js) ─────────────────────────────
    function readAll() {
        try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : {}; }
        catch (e) { return {}; }
    }
    function writeAll(obj) {
        try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
        catch (e) { return false; }
    }
    function tierBucket(all, tier) {
        let b = all[tier];
        if (!b || typeof b !== 'object') { b = { version: 1, updatedAt: null, keys: {} }; all[tier] = b; }
        if (!b.keys || typeof b.keys !== 'object') b.keys = {};
        return b;
    }
    // Нормализация клавиши: сравниваем/копим в нижнем регистре (регистр не значим для weak-key).
    function normKey(k) { return String(k == null ? '' : k).toLowerCase(); }

    // Пустая per-key запись.
    function emptyKeyRec() {
        return { attempts: 0, errors: 0, latencies: [], correctStreak: 0, lastSeenAt: null, confused: {} };
    }

    // ─── Session buffer ───────────────────────────────────────────────────────
    // recordKey копит в память per-tier; flushSession пишет в localStorage одним разом
    // (меньше localStorage-записей на горячем пути handleKey). Fail-safe: если flush
    // не случился, данные теряются за сессию, но стор не портится.
    const sessionBuf = {};   // { tier: { key: {attemptsDelta, errorsDelta, lats:[], streakSeq:[bool], confused:{} } } }

    function bufFor(tier, key) {
        if (!sessionBuf[tier]) sessionBuf[tier] = {};
        const k = normKey(key);
        if (!sessionBuf[tier][k]) sessionBuf[tier][k] = { attempts: 0, errors: 0, lats: [], seq: [], confused: {} };
        return sessionBuf[tier][k];
    }

    // ─── Derived-метрики (on-read, не храним — §3.1) ──────────────────────────
    function median(arr) {
        if (!arr || !arr.length) return null;
        const s = arr.slice().sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    // Личная медиана латентности по всем клавишам тира (нормализация §2.3/§5.1).
    function personalMedianLatency(bucket) {
        const all = [];
        for (const k in bucket.keys) {
            const lat = bucket.keys[k] && bucket.keys[k].latencies;
            if (lat && lat.length) for (let i = 0; i < lat.length; i++) all.push(lat[i]);
        }
        return median(all);
    }

    // Статус клавиши (§4.1). rec — сохранённая запись (после merge с сессией на flush).
    // pMedian — личная медиана тира (для latRatio). Возвращает 'unknown'|'weak'|'mastered'|'learning'.
    function keyStatus(rec, pMedian, cfg) {
        if (!rec || rec.attempts < cfg.MIN_SAMPLE) return 'unknown';
        const errorRate = rec.attempts > 0 ? rec.errors / rec.attempts : 0;
        const med = median(rec.latencies);
        // latRatio: 1.0 = норма. Нет данных о личной медиане → нейтрально (1.0).
        const latRatio = (med != null && pMedian != null && pMedian > 0) ? (med / pMedian) : 1.0;

        // Decay (§4.4): навык деградирует без практики. daysIdle > DECAY_IDLE_DAYS →
        // streak затухает (half-life). ТОЛЬКО на чтение — хранимые счётчики не
        // переписываем; mastered может откатиться в learning → вернутся базовые
        // повторы (re-warmup). Невалидный/отсутствующий lastSeenAt → без decay.
        let effectiveStreak = rec.correctStreak || 0;
        const seenTs = rec.lastSeenAt ? Date.parse(rec.lastSeenAt) : NaN;
        if (Number.isFinite(seenTs)) {
            const daysIdle = (Date.now() - seenTs) / 86400000;
            if (daysIdle > cfg.DECAY_IDLE_DAYS) {
                effectiveStreak = Math.floor(effectiveStreak * cfg.DECAY_STREAK_FACTOR);
            }
        }

        const mastered = errorRate < cfg.MASTERED_ERR
            && effectiveStreak >= cfg.MASTERED_STREAK
            && latRatio <= cfg.MASTERED_LAT_RATIO;
        if (mastered) return 'mastered';

        const weak = errorRate > cfg.WEAK_ERR
            || (errorRate > cfg.WEAK_ERR_SOFT && latRatio > cfg.WEAK_LAT_RATIO);
        if (weak) return latRatio > cfg.WEAK_LAT_RATIO ? 'weak_high_lat' : 'weak';

        return 'learning';
    }

    // ─── Ключи шага ───────────────────────────────────────────────────────────
    // Из декларативной модели §5.1: step.keys (явно) → fallback на буквы step.unit.
    function stepKeys(step) {
        if (!step) return [];
        if (Array.isArray(step.keys) && step.keys.length) {
            return step.keys.map(normKey).filter(k => k && k !== ' ');
        }
        // Fallback: уникальные буквы unit (без пробела).
        const unit = String(step.unit || '');
        const set = {};
        for (let i = 0; i < unit.length; i++) {
            const c = normKey(unit[i]);
            if (c && c !== ' ') set[c] = true;
        }
        return Object.keys(set);
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // ─── Remediation (§4.3) ───────────────────────────────────────────────────
    // Карта символ → палец постановки ЙЦУКЕН. Компактный дубль CHAR_FINGER из
    // task.js (~строка 264, рендер текущего символа) — для finger remediation-шага.
    // При изменении раскладки синхронизировать с task.js.
    const CHAR_FINGER = {
        'й': 'pink', 'ф': 'pink', 'я': 'pink', 'ё': 'pink',
        'ц': 'orange', 'ы': 'orange', 'ч': 'orange',
        'у': 'green', 'в': 'green', 'с': 'green',
        'к': 'blue', 'а': 'blue', 'м': 'blue', 'е': 'blue', 'п': 'blue', 'и': 'blue',
        'н': 'indigo', 'р': 'indigo', 'т': 'indigo', 'г': 'indigo', 'о': 'indigo', 'ь': 'indigo',
        'ш': 'green', 'л': 'green', 'б': 'green',
        'щ': 'orange', 'д': 'orange', 'ю': 'orange',
        'з': 'pink', 'ж': 'pink', 'х': 'pink', 'э': 'pink', 'ъ': 'pink',
    };

    // Трекинг заходов remediation в tier-bucket:
    //   bucket.remediation = { "<lessonNum>": { "<key>": passes } }
    // Fail-safe при чтении битого стора: любой не-объект/не-число → 0.
    function remediationPasses(bucket, lessonNum, key) {
        try {
            const rem = bucket.remediation;
            if (!rem || typeof rem !== 'object') return 0;
            const perLesson = rem[String(lessonNum)];
            if (!perLesson || typeof perLesson !== 'object') return 0;
            const n = Number(perLesson[normKey(key)]);
            return (Number.isFinite(n) && n > 0) ? Math.floor(n) : 0;
        } catch (e) { return 0; }
    }
    // Сумма заходов по всем клавишам урока (для cap MAX_REMEDIATION).
    function remediationTotal(bucket, lessonNum) {
        try {
            const rem = bucket.remediation;
            if (!rem || typeof rem !== 'object') return 0;
            const perLesson = rem[String(lessonNum)];
            if (!perLesson || typeof perLesson !== 'object') return 0;
            let total = 0;
            for (const k in perLesson) {
                const n = Number(perLesson[k]);
                if (Number.isFinite(n) && n > 0) total += Math.floor(n);
            }
            return total;
        } catch (e) { return 0; }
    }

    const adaptiveReps = {
        STORAGE_KEY: KEY,
        _TUNE: TUNE,          // для тест-фикстур/ревью
        _AUDIENCE: AUDIENCE,

        /**
         * recordKey(tier, expectedKey, actualKey, latencyMs)
         * Вызывается из task.js handleKey после сравнения. Копит в session buffer
         * (персист — на flushSession). Fail-safe: любой сбой молча игнорируется.
         */
        recordKey(tier, expectedKey, actualKey, latencyMs) {
            try {
                if (!tier || expectedKey == null) return;
                const exp = normKey(expectedKey);
                if (!exp || exp === ' ') return;   // пробел не считаем weak-key (§ пробел = отдельная механика)
                const buf = bufFor(tier, exp);
                buf.attempts++;
                const correct = normKey(actualKey) === exp;
                if (!correct) {
                    buf.errors++;
                    const act = normKey(actualKey);
                    if (act && act !== ' ') buf.confused[act] = (buf.confused[act] || 0) + 1;
                }
                buf.seq.push(correct);   // для пересчёта correctStreak на flush
                // латентность: отсев outliers (пауза/мысль) как в task.js
                const lat = Number(latencyMs);
                if (Number.isFinite(lat) && lat > 20 && lat < TUNE.LAT_OUTLIER_MS) buf.lats.push(lat);
            } catch (e) { /* fail-safe */ }
        },

        /**
         * flushSession(tier) — слить session buffer в localStorage. Вызывать на
         * finishStep/finishExercise. Идемпотентно очищает буфер тира после записи.
         */
        flushSession(tier) {
            try {
                const tb = sessionBuf[tier];
                if (!tb) return;
                const all = readAll();
                const bucket = tierBucket(all, tier);
                const now = new Date().toISOString();
                for (const k in tb) {
                    const d = tb[k];
                    let rec = bucket.keys[k];
                    if (!rec || typeof rec !== 'object') { rec = emptyKeyRec(); bucket.keys[k] = rec; }
                    if (!Array.isArray(rec.latencies)) rec.latencies = [];
                    if (!rec.confused || typeof rec.confused !== 'object') rec.confused = {};

                    rec.attempts += d.attempts;
                    rec.errors += d.errors;
                    // correctStreak: продолжаем накопленный, обнуляем на ошибке.
                    let streak = rec.correctStreak || 0;
                    for (let i = 0; i < d.seq.length; i++) streak = d.seq[i] ? streak + 1 : 0;
                    rec.correctStreak = streak;
                    // ring buffer латентностей (max LAT_BUFFER, храним последние).
                    for (let i = 0; i < d.lats.length; i++) rec.latencies.push(d.lats[i]);
                    if (rec.latencies.length > TUNE.LAT_BUFFER) {
                        rec.latencies = rec.latencies.slice(rec.latencies.length - TUNE.LAT_BUFFER);
                    }
                    for (const c in d.confused) rec.confused[c] = (rec.confused[c] || 0) + d.confused[c];
                    rec.lastSeenAt = now;
                }
                bucket.updatedAt = now;
                writeAll(all);
                delete sessionBuf[tier];
            } catch (e) { /* fail-safe: не роняем финиш упражнения */ }
        },

        /**
         * computeReps(tier, step) -> int | null
         * Число групп-повторов для шага по слабейшей клавише (bottleneck, §4.2).
         * Возвращает null, если шаг НЕ декларативный (нет unit/baseReps) — вызывающий
         * код тогда использует legacy target как есть (backward-compat §5.1).
         * Холодный старт / нет данных → все клавиши "unknown" → factor 1.0 → baseReps.
         */
        computeReps(tier, step) {
            try {
                if (!step || step.unit == null || !Number.isFinite(Number(step.baseReps))) return null;
                const baseReps = Math.max(1, Math.round(Number(step.baseReps)));
                // Remediation-шаг (§4.3): короткий фиксированный дрилл, НЕ масштабируем
                // адаптивом (weak-клавиша дала бы factor 1.6-2.0 — анти-фрустрация).
                // Заодно превью в lesson-page и target в task.js гарантированно совпадают.
                if (step.remediation === true) return baseReps;
                const cfg = profileForTier(tier);

                const all = readAll();
                const bucket = tierBucket(all, tier);
                const pMedian = personalMedianLatency(bucket);
                const keys = stepKeys(step);

                // Bottleneck: худший статус среди клавиш шага.
                // ранг: weak_high_lat > weak > learning/unknown > mastered.
                let anyWeakHighLat = false, anyWeak = false, anyNonMastered = false, hadKey = false;
                for (const k of keys) {
                    hadKey = true;
                    const st = keyStatus(bucket.keys[k], pMedian, cfg);
                    if (st === 'weak_high_lat') anyWeakHighLat = true;
                    else if (st === 'weak') anyWeak = true;
                    if (st !== 'mastered') anyNonMastered = true;
                }

                // Приоритет bottleneck (§4.2): weak+high-lat > weak > all-mastered > learning/unknown.
                let factor;
                if (anyWeakHighLat) factor = cfg.FACTOR_WEAK_HIGH_LAT;
                else if (anyWeak) factor = cfg.FACTOR_WEAK;
                else if (hadKey && !anyNonMastered) factor = cfg.FACTOR_MASTERED;  // все клавиши mastered
                else factor = cfg.FACTOR_LEARNING;  // есть learning/unknown, либо клавиши не заданы

                const repsMax = Math.max(cfg.REPS_MIN, Math.round(baseReps * cfg.REPS_MAX_MULT));
                return clamp(Math.round(baseReps * factor), cfg.REPS_MIN, repsMax);
            } catch (e) {
                // Fail-safe: при любом сбое отдаём baseReps (если он валиден), иначе null.
                const b = step && Number(step.baseReps);
                return Number.isFinite(b) ? Math.max(1, Math.round(b)) : null;
            }
        },

        /**
         * buildTarget(unit, reps) -> string
         * Собрать target-строку шага из группы-повтора: Array(reps).fill(unit).join(' ').
         */
        buildTarget(unit, reps) {
            const u = String(unit == null ? '' : unit);
            const n = Math.max(1, Math.round(Number(reps) || 1));
            return Array(n).fill(u).join(' ');
        },

        /**
         * targetForStep(tier, step) -> string | null
         * Удобный хелпер для вызывающего кода: декларативный шаг → адаптивный target.
         * null → шаг не декларативный, использовать legacy step.target.
         */
        targetForStep(tier, step) {
            const reps = this.computeReps(tier, step);
            if (reps == null) return null;
            return this.buildTarget(step.unit, reps);
        },

        /**
         * weakKeys(tier, limit) -> [{key, errorRate, attempts, status}]
         * Слабейшие клавиши (для remediation 2-й итерации / будущего дашборда).
         * В MVP-cut не влияет на поток — предоставлен как read-API.
         */
        weakKeys(tier, limit) {
            try {
                const cfg = profileForTier(tier);
                const all = readAll();
                const bucket = tierBucket(all, tier);
                const pMedian = personalMedianLatency(bucket);
                const out = [];
                for (const k in bucket.keys) {
                    const rec = bucket.keys[k];
                    const st = keyStatus(rec, pMedian, cfg);
                    if (st === 'weak' || st === 'weak_high_lat') {
                        out.push({
                            key: k,
                            errorRate: rec.attempts > 0 ? rec.errors / rec.attempts : 0,
                            attempts: rec.attempts,
                            status: st,
                        });
                    }
                }
                out.sort((a, b) => b.errorRate - a.errorRate);
                return (limit && limit > 0) ? out.slice(0, limit) : out;
            } catch (e) { return []; }
        },

        /**
         * remediationStepForKey(tier, lessonNum, key) -> step | null
         * Построить точечный remediation-шаг (§4.3) на конкретную клавишу.
         * unit: если топ-конфузия клавиши mastered — чередование k+c+k («нан»,
         * методика «чередование с ближайшей освоенной»), иначе изоляция k+k+k («ннн»).
         * Тон §6: kids — нейтральный title/hint без «слабая/ошибки».
         */
        remediationStepForKey(tier, lessonNum, key) {
            try {
                const k = normKey(key);
                if (!k || k === ' ') return null;
                const cfg = profileForTier(tier);
                const all = readAll();
                const bucket = tierBucket(all, tier);
                const rec = bucket.keys[k];

                // unit: чередование с топ-конфузией со статусом mastered, иначе изоляция.
                let unit = k + k + k;
                if (rec && rec.confused && typeof rec.confused === 'object') {
                    let top = null, topN = 0;
                    for (const c in rec.confused) {
                        const n = Number(rec.confused[c]);
                        if (Number.isFinite(n) && n > topN) { top = normKey(c); topN = n; }
                    }
                    if (top && top !== k
                        && keyStatus(bucket.keys[top], personalMedianLatency(bucket), cfg) === 'mastered') {
                        unit = k + top + k;
                    }
                }

                const up = k.toUpperCase();
                const aud = audienceForTier(tier);
                // Тон §6: для kids — нейтрально (без намёка на слабость/ошибки),
                // для teen/adult — мягко, без «слабая/ошибки».
                const title = aud === 'kids' ? `Ещё разок: «${up}»` : `Дожмём букву «${up}»`;
                const hint = aud === 'kids'
                    ? `Потренируем букву ${up} ещё немного — спокойно, в своём темпе.`
                    : `Короткий дополнительный дрилл: буква ${up} просит чуть больше внимания. Не спеши, ровный ритм важнее скорости.`;

                return {
                    type: 'step', kind: 'drill', remediation: true,
                    key: k, unit, baseReps: TUNE.REMEDIATION_REPS, keys: [k],
                    // target прибит заранее: computeReps для remediation не масштабирует.
                    target: this.buildTarget(unit, TUNE.REMEDIATION_REPS),
                    finger: CHAR_FINGER[k] || 'blue',
                    title, hint,
                };
            } catch (e) { return null; }
        },

        /**
         * remediationStep(tier, lesson, doneSteps) -> step | null
         * Выбрать remediation-шаг для лестницы урока (§4.3):
         *   кандидаты = weak-клавиши тира ∩ клавиши шагов урока;
         *   − клавиши с passes >= REMEDIATION_MAX_PASSES (persisted weak — не зацикливаем);
         *   cap по уроку: суммарно выдано >= MAX_REMEDIATION → null;
         *   из оставшихся — худшая по errorRate.
         * doneSteps сейчас не участвует в решении (контракт §5.2 — на будущее).
         */
        remediationStep(tier, lesson, doneSteps) {
            try {
                if (!lesson || lesson.guided !== true || !Array.isArray(lesson.tips)) return null;
                const lessonNum = Number(lesson.lesson_number);
                if (!Number.isFinite(lessonNum) || lessonNum <= 0) return null;

                const all = readAll();
                const bucket = tierBucket(all, tier);
                // Нет накопленных adaptiveReps-данных → нечего лечить.
                if (!Object.keys(bucket.keys).length) return null;

                // Cap на урок (§4.3, анти-фрустрация): суммарно уже выдано >= MAX_REMEDIATION
                // заходов — новый НЕ выдаём (проверка на выдачу, счётчики не трогаем).
                const cfg = profileForTier(tier);
                if (remediationTotal(bucket, lessonNum) >= cfg.MAX_REMEDIATION) return null;

                // Клавиши шагов урока (union stepKeys по всем tips type='step').
                const lessonKeys = {};
                for (const tp of lesson.tips) {
                    if (tp && tp.type === 'step') {
                        const ks = stepKeys(tp);
                        for (let i = 0; i < ks.length; i++) lessonKeys[ks[i]] = true;
                    }
                }

                // weak/weak_high_lat ∩ клавиши урока, минус persisted weak.
                // weakKeys уже отсортирован по errorRate desc → первый прошедший = худший.
                const candidates = this.weakKeys(tier);
                for (const w of candidates) {
                    if (!lessonKeys[w.key]) continue;
                    if (remediationPasses(bucket, lessonNum, w.key) >= cfg.REMEDIATION_MAX_PASSES) {
                        // Explainability (§4.3/§9): дрилл не помог за N заходов — пропускаем
                        // вперёд, не превращаем урок в наказание.
                        console.info('adaptive: persisted weak', w.key);
                        continue;
                    }
                    return this.remediationStepForKey(tier, lessonNum, w.key);
                }
                return null;
            } catch (e) { return null; }
        },

        /**
         * noteRemediationPass(tier, lessonNum, key) — заход на remediation-шаг
         * завершён (вызывает task.js на финише). passes++ в bucket.remediation.
         */
        noteRemediationPass(tier, lessonNum, key) {
            try {
                const k = normKey(key);
                if (!k) return;
                const all = readAll();
                const bucket = tierBucket(all, tier);
                if (!bucket.remediation || typeof bucket.remediation !== 'object') bucket.remediation = {};
                const lk = String(lessonNum);
                if (!bucket.remediation[lk] || typeof bucket.remediation[lk] !== 'object') bucket.remediation[lk] = {};
                const cur = Number(bucket.remediation[lk][k]);
                bucket.remediation[lk][k] = ((Number.isFinite(cur) && cur > 0) ? Math.floor(cur) : 0) + 1;
                bucket.updatedAt = new Date().toISOString();
                writeAll(all);
            } catch (e) { /* fail-safe */ }
        },

        /** audienceForTier(tier) -> 'kids'|'teen'|'adult' — для UI (§6 видимость). */
        audienceForTier(tier) { return audienceForTier(tier); },

        /** keyStatusFor(tier, key) — для тестов/дашборда. */
        keyStatusFor(tier, key) {
            try {
                const cfg = profileForTier(tier);
                const all = readAll();
                const bucket = tierBucket(all, tier);
                return keyStatus(bucket.keys[normKey(key)], personalMedianLatency(bucket), cfg);
            } catch (e) { return 'unknown'; }
        },
    };

    window.adaptiveReps = adaptiveReps;
})();
