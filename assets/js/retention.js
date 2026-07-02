/**
 * retention.js — удержание/стрики v1 (methodology/retention_streaks_spec.md).
 *
 * Чистые функции над массивом истории попыток (`typing_trainer_test_history`
 * ⟷ apiClient.getHistory()). Считает стрик (дни подряд с занятием) и дневную
 * цель «10 минут». БЕЗ backend-изменений — данные из существующей истории.
 *
 * window.retention.computeStreak(history, now) →
 *   { streakDays, todayMinutes, goalMet, longestStreak, activeToday }
 *
 * Даты группируем по ЛОКАЛЬНОЙ календарной дате (не UTC — иначе TZ-сдвиг
 * может «съесть» день). Стрик оканчивается сегодня или вчера (сегодня-без-
 * занятия ещё не рвёт до конца дня → activeToday=false, подсказка «продли»).
 * Fail-safe: пустая/битая история → нули, ничего не падает.
 */
(function () {
    'use strict';

    var DAILY_GOAL_MIN = 10;

    // Локальный ключ дня 'YYYY-MM-DD' по локальной TZ (без UTC-сдвига).
    function localDayKey(d) {
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
    }

    // Разбор timestamp записи → Date | null. Поддерживает completedAt/created_at/
    // timestamp; ISO-строки и epoch-миллисекунды.
    function parseTs(rec) {
        if (!rec) return null;
        var t = rec.completedAt || rec.created_at || rec.timestamp;
        if (t == null) return null;
        var d = (typeof t === 'number') ? new Date(t) : new Date(String(t));
        return isNaN(d.getTime()) ? null : d;
    }

    // Длительность записи в секундах (duration | duration_ms | time).
    function durationSec(rec) {
        if (!rec) return 0;
        if (typeof rec.duration === 'number' && isFinite(rec.duration)) return rec.duration;
        if (typeof rec.duration_ms === 'number' && isFinite(rec.duration_ms)) return rec.duration_ms / 1000;
        if (typeof rec.time === 'number' && isFinite(rec.time)) return rec.time;
        return 0;
    }

    var EMPTY = { streakDays: 0, todayMinutes: 0, goalMet: false, longestStreak: 0, activeToday: false };

    function computeStreak(history, now) {
        var res = { streakDays: 0, todayMinutes: 0, goalMet: false, longestStreak: 0, activeToday: false };
        if (!Array.isArray(history) || !history.length) return res;

        var nowDate = (now instanceof Date && !isNaN(now.getTime())) ? now : new Date();

        // Сумма секунд по дням (локальным).
        var secByDay = Object.create(null);
        for (var i = 0; i < history.length; i++) {
            var d = parseTs(history[i]);
            if (!d) continue;
            var key = localDayKey(d);
            secByDay[key] = (secByDay[key] || 0) + durationSec(history[i]);
        }

        var dayKeys = Object.keys(secByDay);
        if (!dayKeys.length) return res;

        // todayMinutes / goalMet.
        var todayKey = localDayKey(nowDate);
        var todaySec = secByDay[todayKey] || 0;
        res.todayMinutes = Math.round(todaySec / 60);
        res.goalMet = res.todayMinutes >= DAILY_GOAL_MIN;

        // longestStreak — макс. цепочка последовательных дней во всей истории.
        var sorted = dayKeys.slice().sort(); // возрастание 'YYYY-MM-DD'
        var longest = 1, run = 1;
        for (var j = 1; j < sorted.length; j++) {
            if (dayDiff(sorted[j - 1], sorted[j]) === 1) { run++; if (run > longest) longest = run; }
            else run = 1;
        }
        res.longestStreak = longest;

        // Текущий стрик: идём назад от «якоря». Якорь = сегодня, если есть
        // занятие сегодня (activeToday=true); иначе вчера, если есть занятие
        // вчера (стрик «жив», activeToday=false). Если ни сегодня, ни вчера —
        // стрик прерван (0).
        var yesterdayKey = localDayKey(addDays(nowDate, -1));
        var anchor;
        if (secByDay[todayKey]) { anchor = todayKey; res.activeToday = true; }
        else if (secByDay[yesterdayKey]) { anchor = yesterdayKey; res.activeToday = false; }
        else { res.streakDays = 0; res.activeToday = false; return res; }

        var streak = 1;
        var cursor = anchor;
        while (true) {
            var prev = shiftDayKey(cursor, -1);
            if (secByDay[prev]) { streak++; cursor = prev; } else break;
        }
        res.streakDays = streak;
        return res;
    }

    // ── Хелперы по датам ────────────────────────────────────────────
    function addDays(date, n) {
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        d.setDate(d.getDate() + n);
        return d;
    }

    // Разница в целых днях между двумя 'YYYY-MM-DD' (b - a). Через локальную
    // полночь — DST-safe (округляем к ближайшему дню).
    function dayDiff(aKey, bKey) {
        var a = keyToDate(aKey), b = keyToDate(bKey);
        return Math.round((b - a) / 86400000);
    }

    function shiftDayKey(key, n) {
        return localDayKey(addDays(keyToDate(key), n));
    }

    function keyToDate(key) {
        var p = String(key).split('-');
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }

    window.retention = {
        computeStreak: computeStreak,
        DAILY_GOAL_MIN: DAILY_GOAL_MIN,
        EMPTY: EMPTY,
        // экспорт для тест-фикстуры
        _localDayKey: localDayKey
    };
})();
