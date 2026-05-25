// assets/js/certification.js
// Система сертификации — Bronze/Silver/Gold/Platinum при завершении курса.
// Триггерится из main.js notifyLessonOutcome когда сдан финальный урок тира.

function certStorageKey() {
    return (window.Settings && window.Settings.get('storage.keys.certifications'))
        || 'typing_trainer_certifications';
}

function getCertLevels() {
    return (window.Settings && window.Settings.get('certification.levels', [])) || [];
}

// Подобрать level по WPM/accuracy (от высшего к низшему)
function calculateLevel(wpm, accuracy) {
    const levels = getCertLevels(); // отсортированы от platinum (минимальные пороги) к bronze
    for (const lvl of levels) {
        if (wpm >= lvl.minWpm && accuracy >= lvl.minAccuracy) return lvl;
    }
    return null; // не дотянул даже до bronze
}

// Все сертификаты пользователя (map: tier → certData)
function getAllCertifications() {
    try {
        const raw = localStorage.getItem(certStorageKey());
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}

// Сертификат для конкретного tier
function getCertification(tier) {
    return getAllCertifications()[tier] || null;
}

// Сохранить или обновить сертификат tier (берём max от существующего)
function saveCertification(tier, levelId, wpm, accuracy) {
    if (!tier || !levelId) return;
    const all = getAllCertifications();
    const prev = all[tier];
    const levels = getCertLevels();
    const newLevelRank = levels.findIndex(l => l.id === levelId);
    const prevLevelRank = prev ? levels.findIndex(l => l.id === prev.level) : -1;

    // Записываем только если новый ранг ВЫШЕ (меньший индекс = выше: platinum→0, bronze→3)
    // или это первая сертификация
    if (prev && prevLevelRank !== -1 && newLevelRank >= prevLevelRank) {
        // существующий ранг уже не хуже — обновляем только stats если выше
        if (wpm > (prev.finalWpm || 0)) {
            all[tier] = Object.assign({}, prev, { finalWpm: wpm, finalAccuracy: Math.max(prev.finalAccuracy || 0, accuracy) });
            localStorage.setItem(certStorageKey(), JSON.stringify(all));
        }
        return false; // не upgrade
    }

    all[tier] = {
        level: levelId,
        finalWpm: wpm,
        finalAccuracy: accuracy,
        awardedAt: new Date().toISOString()
    };
    localStorage.setItem(certStorageKey(), JSON.stringify(all));
    return true; // новый или upgrade
}

// Является ли урок ФИНАЛЬНЫМ для тира (т.е. последний по lessons.tierLessonCount)
function isFinalLessonOfTier(tier, lessonNumber) {
    const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
    return counts[tier] === lessonNumber;
}

// Главная точка входа: вызывается из main.js после успешной сдачи урока.
// Если урок — финальный для tier, и WPM/accuracy дотягивает до bronze+ —
// присуждаем сертификат и показываем modal.
function maybeAwardCertification(tier, lessonNumber, wpm, accuracy) {
    if (!isFinalLessonOfTier(tier, lessonNumber)) return;

    const level = calculateLevel(wpm, accuracy);
    if (!level) {
        // Курс завершён, но порог bronze не достигнут — toast-поздравление без сертификата
        if (window.toastManager) {
            window.toastManager.show(
                `Курс ${tier} завершён! Для Bronze нужно ≥ ${getCertLevels().slice(-1)[0].minWpm} WPM при ≥ ${getCertLevels().slice(-1)[0].minAccuracy}% точности. Повторите последний урок для апгрейда.`,
                '🎯', 6000, { type: 'info' }
            );
        }
        return;
    }

    const isNewOrUpgrade = saveCertification(tier, level.id, wpm, accuracy);
    if (isNewOrUpgrade) {
        showCertificationModal(tier, level, wpm, accuracy);
    } else {
        // Тот же уровень или ниже — просто показать toast
        if (window.toastManager) {
            window.toastManager.show(
                `Курс ${tier} пройден повторно. Текущий уровень: ${level.name} ${level.emoji}`,
                level.emoji, 4500, { type: 'success' }
            );
        }
    }
}

// Modal с поздравительным сертификатом
function showCertificationModal(tier, level, wpm, accuracy) {
    const existing = document.getElementById('certModal');
    if (existing) existing.remove();

    const tierLabel = (window.typingTrainer && typeof window.typingTrainer.getTierLabel === 'function')
        ? window.typingTrainer.getTierLabel(tier) : tier;

    const modal = document.createElement('div');
    modal.id = 'certModal';
    modal.className = 'cert-modal active';
    modal.innerHTML = `
        <div class="cert-card" style="border-color: ${level.color}">
            <div class="cert-badge" style="background: ${level.color}">
                <div class="cert-emoji">${level.emoji}</div>
                <div class="cert-level-name">${level.name}</div>
            </div>
            <h2 class="cert-title">Курс ${tierLabel} пройден!</h2>
            <p class="cert-subtitle">Вы получаете сертификат уровня <b>${level.name}</b></p>
            <div class="cert-stats">
                <div class="cert-stat"><span class="cert-stat-value">${wpm}</span><span class="cert-stat-label">WPM</span></div>
                <div class="cert-stat"><span class="cert-stat-value">${accuracy}%</span><span class="cert-stat-label">Точность</span></div>
                <div class="cert-stat"><span class="cert-stat-value">${new Date().toLocaleDateString('ru-RU')}</span><span class="cert-stat-label">Дата</span></div>
            </div>
            <p class="cert-next">${nextLevelHint(level)}</p>
            <button type="button" class="cert-close-btn" onclick="document.getElementById('certModal').remove()">Принять 🎉</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function nextLevelHint(currentLevel) {
    const levels = getCertLevels();
    const idx = levels.findIndex(l => l.id === currentLevel.id);
    if (idx <= 0) return 'Высший уровень достигнут — вы мастер! 💎';
    const next = levels[idx - 1];
    return `Для уровня ${next.name} ${next.emoji}: ≥ ${next.minWpm} WPM при ≥ ${next.minAccuracy}% точности. Перепройдите для апгрейда!`;
}

// Экспорт
window.Certification = {
    calculateLevel,
    getCertification,
    getAllCertifications,
    saveCertification,
    isFinalLessonOfTier,
    maybeAwardCertification,
    showCertificationModal
};

console.log('🏆 Certification module loaded');
