/**
 * achievements.js — единый каталог достижений + вычисление состояния.
 *
 * Используется на dashboard (топ-6), achievements.html (все, по группам)
 * и в task.js (детекция «только что разблокированных» для toast'а).
 *
 * Чистая функция getAchievements(stats) → массив { id, label, desc, icon,
 * group, earned, progress (0..1), threshold, current }.
 */
(function (global) {
    'use strict';

    // ─── Каталог достижений ──────────────────────────────────────
    // Каждое: id, label, desc, icon, group, metric(stats) → текущее значение, threshold.
    const CATALOG = [
        // Прогресс по курсу
        { id: 'first',      group: 'progress', icon: '🎯',  label: 'Первый урок',         desc: 'Пройти 1 урок',
          metric: s => s.completed, threshold: 1 },
        { id: 'streak5',    group: 'progress', icon: '🚀',  label: '5 уроков',            desc: 'Пройти 5 уроков',
          metric: s => s.completed, threshold: 5 },
        { id: 'streak10',   group: 'progress', icon: '🎓',  label: '10 уроков',           desc: 'Пройти 10 уроков',
          metric: s => s.completed, threshold: 10 },
        { id: 'streak25',   group: 'progress', icon: '📚',  label: 'Bookworm · 25 уроков', desc: 'Пройти 25 уроков',
          metric: s => s.completed, threshold: 25 },
        { id: 'half',       group: 'progress', icon: '🏔',  label: 'Половина курса',      desc: 'Пройти половину курса',
          metric: s => s.completed, threshold: s => Math.ceil(s.totalLessons / 2) },
        { id: 'finish',     group: 'progress', icon: '🏆',  label: 'Champion · весь курс', desc: 'Завершить курс целиком',
          metric: s => s.completed, threshold: s => s.totalLessons },

        // Скорость
        { id: 'wpm30',      group: 'speed',    icon: '🏃',  label: '30 зн/мин',            desc: 'Достичь скорости 30 зн/мин',
          metric: s => s.bestWpm, threshold: 30 },
        { id: 'wpm40',      group: 'speed',    icon: '⚡',  label: 'Lightning · 40 зн/мин', desc: 'Достичь скорости 40 зн/мин',
          metric: s => s.bestWpm, threshold: 40 },
        { id: 'wpm60',      group: 'speed',    icon: '🔥',  label: 'Speed Demon · 60 зн/мин', desc: 'Достичь скорости 60 зн/мин',
          metric: s => s.bestWpm, threshold: 60 },
        { id: 'wpm80',      group: 'speed',    icon: '💫',  label: 'Звезда · 80 зн/мин',   desc: 'Достичь скорости 80 зн/мин',
          metric: s => s.bestWpm, threshold: 80 },
        { id: 'wpm100',     group: 'speed',    icon: '🚄',  label: 'Сверхзвук · 100 зн/мин', desc: 'Достичь скорости 100 зн/мин',
          metric: s => s.bestWpm, threshold: 100 },

        // Точность
        { id: 'acc90',      group: 'accuracy', icon: '🎲',  label: '90% точность',         desc: 'Достичь точности 90%',
          metric: s => s.bestAcc, threshold: 90 },
        { id: 'acc95',      group: 'accuracy', icon: '🎯',  label: 'Sniper · 95% точность', desc: 'Достичь точности 95%',
          metric: s => s.bestAcc, threshold: 95 },
        { id: 'acc100',     group: 'accuracy', icon: '💎',  label: 'Перфекционист · 100%', desc: 'Пройти урок со 100% точностью',
          metric: s => s.bestAcc, threshold: 100 },

        // Серии (дни подряд)
        { id: 'streakDays3',  group: 'streak', icon: '📅',  label: '3 дня подряд',         desc: 'Заниматься 3 дня подряд',
          metric: s => s.streakDays, threshold: 3 },
        { id: 'streakDays7',  group: 'streak', icon: '🗓',  label: 'Неделя подряд',        desc: 'Заниматься 7 дней подряд',
          metric: s => s.streakDays, threshold: 7 },
        { id: 'streakDays14', group: 'streak', icon: '🔥',  label: 'Две недели в строю',   desc: 'Заниматься 14 дней подряд',
          metric: s => s.streakDays, threshold: 14 },
        { id: 'streakDays30', group: 'streak', icon: '🏅',  label: 'Месяц без пропусков',  desc: 'Заниматься 30 дней подряд',
          metric: s => s.streakDays, threshold: 30 },

        // Звёзды / мастерство
        { id: 'stars20',    group: 'mastery',  icon: '⭐',  label: '20 звёзд',             desc: 'Заработать 20 звёзд',
          metric: s => s.totalStars, threshold: 20 },
        { id: 'stars100',   group: 'mastery',  icon: '🌟',  label: '100 звёзд',            desc: 'Заработать 100 звёзд',
          metric: s => s.totalStars, threshold: 100 },
        { id: 'fivestars5', group: 'mastery',  icon: '✨',  label: '5 идеальных',          desc: 'Пройти 5 уроков на 5★',
          metric: s => s.perfectFive, threshold: 5 },
        { id: 'fivestars20',group: 'mastery',  icon: '👑',  label: 'Король точности',      desc: 'Пройти 20 уроков на 5★',
          metric: s => s.perfectFive, threshold: 20 }
    ];

    const GROUPS = [
        { id: 'progress', label: 'Прогресс по курсу' },
        { id: 'speed',    label: 'Скорость' },
        { id: 'accuracy', label: 'Точность' },
        { id: 'streak',   label: 'Серии и регулярность' },
        { id: 'mastery',  label: 'Мастерство' }
    ];

    // ─── Вычисление stats из profile/progress/history ────────────
    function computeStats(progress, history, totalLessons) {
        progress = progress || {};
        const completedNums = Object.keys(progress)
            .map(n => parseInt(n, 10))
            .filter(n => Number.isFinite(n) && progress[String(n)] && progress[String(n)].stars > 0);
        const completed = completedNums.length;

        let bestWpm = 0, bestAcc = 0, totalStars = 0, perfectFive = 0;
        Object.values(progress).forEach(p => {
            if (!p) return;
            if (p.bestWPM && p.bestWPM > bestWpm)         bestWpm = p.bestWPM;
            if (p.bestAccuracy && p.bestAccuracy > bestAcc) bestAcc = p.bestAccuracy;
            if (p.stars) totalStars += p.stars;
            if (p.stars === 5) perfectFive++;
        });

        // Streak в днях — последовательные дни активности от последнего
        const days = new Set();
        (history || []).forEach(h => {
            const t = h && (h.completedAt || h.timestamp);
            if (t) days.add(new Date(t).toISOString().slice(0, 10));
        });
        let streakDays = 0;
        const sorted = [...days].sort().reverse();
        if (sorted.length) {
            streakDays = 1;
            let prev = new Date(sorted[0]);
            for (let i = 1; i < sorted.length; i++) {
                const cur = new Date(sorted[i]);
                const diff = Math.round((prev - cur) / 86400000);
                if (diff === 1) { streakDays++; prev = cur; } else break;
            }
        }

        return { completed, bestWpm, bestAcc, totalStars, perfectFive, streakDays, totalLessons: totalLessons || 99 };
    }

    // ─── Главная функция: список достижений с computed состоянием ─
    function getAchievements(stats) {
        return CATALOG.map(a => {
            const threshold = typeof a.threshold === 'function' ? a.threshold(stats) : a.threshold;
            const current = a.metric(stats);
            const progress = threshold > 0 ? Math.min(1, current / threshold) : 0;
            return {
                id: a.id, group: a.group, icon: a.icon, label: a.label, desc: a.desc,
                threshold, current,
                earned: current >= threshold,
                progress
            };
        });
    }

    // Удобный helper: вернуть IDs только заработанных
    function earnedIds(achievements) {
        return new Set(achievements.filter(a => a.earned).map(a => a.id));
    }

    global.achievements = { CATALOG, GROUPS, computeStats, getAchievements, earnedIds };
})(window);
