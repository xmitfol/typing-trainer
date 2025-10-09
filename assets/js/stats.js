// assets/js/stats.js - Система статистики и рейтинга

let statsUpdateInterval = null;
let bestStats = {
    time: Infinity,
    speed: 0,
    minErrors: Infinity
};

// DOM элементы статистики
const statsElements = {
    timeValue: null,
    speedValue: null,
    errorsValue: null,
    stars: null
};

// Инициализация системы статистики
function initStats() {
    console.log('📊 Инициализация системы статистики...');
    
    try {
        // Находим элементы статистики
        statsElements.timeValue = document.getElementById('timeValue');
        statsElements.speedValue = document.getElementById('speedValue');
        statsElements.errorsValue = document.getElementById('errorsValue');
        statsElements.stars = document.querySelectorAll('.star');
        
        // Проверяем наличие элементов
        if (!statsElements.timeValue || !statsElements.speedValue || !statsElements.errorsValue) {
            console.warn('⚠️ Не все элементы статистики найдены');
        }
        
        // Загружаем лучшие результаты
        loadBestStats();
        
        // Сбрасываем отображение статистики
        resetStats();
        
        console.log('✅ Система статистики инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации статистики:', error);
    }
}

// Сброс статистики
function resetStats() {
    try {
        // Останавливаем интервал обновления
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            statsUpdateInterval = null;
        }
        
        // Сбрасываем значения
        updateStatsDisplay({
            time: 0,
            wpm: 0,
            errors: 0,
            accuracy: 100
        });
        
        // Сбрасываем звезды
        updateStarRating(0);
        
        DebugUtils.log('📊 Статистика сброшена');
        
    } catch (error) {
        console.error('❌ Ошибка сброса статистики:', error);
    }
}

// Обновление отображения статистики
function updateStatsDisplay(stats) {
    try {
        // Обновляем время
        if (statsElements.timeValue) {
            const timeString = TimeUtils.formatTime(stats.time);
            statsElements.timeValue.textContent = timeString;
        }
        
        // Обновляем скорость
        if (statsElements.speedValue) {
            statsElements.speedValue.innerHTML = `${stats.wpm || 0} <span class="unit">зн/мин</span>`;
        }
        
        // Обновляем ошибки
        if (statsElements.errorsValue) {
            const accuracy = stats.accuracy !== undefined ? stats.accuracy : 100;
            const errorPercentage = (100 - accuracy).toFixed(1);
            statsElements.errorsValue.innerHTML = `${stats.errors || 0} <span class="unit">/ ${errorPercentage}%</span>`;
        }
        
    } catch (error) {
        console.error('❌ Ошибка обновления отображения:', error);
    }
}

// Обновление статистики (вызывается из main.js)
function updateStats() {
    try {
        // Получаем текущие данные из основного модуля
        if (typeof window.getStats === 'function') {
            const stats = window.getStats();
            updateStatsDisplay(stats);
            
            // Обновляем рейтинг в реальном времени
            const rating = calculateRating(stats);
            updateStarRating(rating);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обновления статистики:', error);
    }
}

// Запуск отслеживания статистики
function startStatsTracking() {
    try {
        // Запускаем интервал обновления каждые 100мс
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
        }
        
        const updateInterval = Settings.get('testing.statsUpdateInterval', 100);
        statsUpdateInterval = setInterval(updateStats, updateInterval);
        
        DebugUtils.log('📊 Отслеживание статистики запущено');
        
    } catch (error) {
        console.error('❌ Ошибка запуска отслеживания:', error);
    }
}

// Остановка отслеживания статистики
function stopStatsTracking() {
    try {
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            statsUpdateInterval = null;
            
            DebugUtils.log('📊 Отслеживание статистики остановлено');
        }
    } catch (error) {
        console.error('❌ Ошибка остановки отслеживания:', error);
    }
}

// Показ финальной статистики
function showFinalStats() {
    try {
        const stats = window.getStats ? window.getStats() : {};
        
        // Проверяем и обновляем лучшие результаты
        updateBestStats(stats);
        
        // Вычисляем финальный рейтинг
        const rating = calculateRating(stats);
        updateStarRating(rating);
        
        // Показываем лучшие результаты
        displayBestStats();
        
        // Анимируем финальные значения
        animateStatsCompletion();
        
        DebugUtils.log('📊 Финальная статистика:', stats);
        
    } catch (error) {
        console.error('❌ Ошибка показа финальной статистики:', error);
    }
}

// Вычисление рейтинга в звездах
function calculateRating(stats) {
    try {
        let rating = 0;
        const wpm = stats.wpm || 0;
        const accuracy = stats.accuracy || 0;
        
        // Получаем критерии рейтинга из настроек
        const criteria = Settings.getRatingCriteria();
        
        // Проверяем каждый уровень от 5 до 1 звезды
        for (let stars = 5; stars >= 1; stars--) {
            const requirement = criteria[stars];
            if (requirement && wpm >= requirement.minWPM && accuracy >= requirement.minAccuracy) {
                rating = stars;
                break;
            }
        }
        
        return Math.max(0, Math.min(5, rating));
        
    } catch (error) {
        console.error('❌ Ошибка вычисления рейтинга:', error);
        return 0;
    }
}

// Обновление отображения звезд
function updateStarRating(rating) {
    try {
        if (!statsElements.stars) return;
        
        statsElements.stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
                star.textContent = '★';
            } else {
                star.classList.remove('filled');
                star.textContent = '☆';
            }
        });
        
        DebugUtils.log('⭐ Рейтинг обновлен:', rating, 'звезд');
        
    } catch (error) {
        console.error('❌ Ошибка обновления звезд:', error);
    }
}

// Обновление лучших результатов
function updateBestStats(currentStats) {
    try {
        let updated = false;
        
        // Лучшее время (меньше = лучше)
        if (currentStats.time > 0 && currentStats.time < bestStats.time) {
            bestStats.time = currentStats.time;
            updated = true;
        }
        
        // Лучшая скорость (больше = лучше)
        if (currentStats.wpm > bestStats.speed) {
            bestStats.speed = currentStats.wpm;
            updated = true;
        }
        
        // Меньше ошибок (меньше = лучше)
        if (currentStats.errors >= 0 && currentStats.errors < bestStats.minErrors) {
            bestStats.minErrors = currentStats.errors;
            updated = true;
        }
        
        // Сохраняем в localStorage если были обновления
        if (updated) {
            saveBestStats();
            DebugUtils.log('🏆 Лучшие результаты обновлены:', bestStats);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обновления лучших результатов:', error);
    }
}

// Отображение лучших результатов
function displayBestStats() {
    try {
        // Находим элементы для лучших результатов
        const timeElement = document.querySelector('#timeValue').parentNode.querySelector('.stat-best');
        const speedElement = document.querySelector('#speedValue').parentNode.querySelector('.stat-best');
        const errorsElement = document.querySelector('#errorsValue').parentNode.querySelector('.stat-best');
        
        if (timeElement && bestStats.time !== Infinity) {
            const bestTime = TimeUtils.formatTime(bestStats.time);
            timeElement.textContent = `лучшее: ${bestTime}`;
        }
        
        if (speedElement && bestStats.speed > 0) {
            speedElement.textContent = `максимум: ${bestStats.speed}`;
        }
        
        if (errorsElement && bestStats.minErrors !== Infinity) {
            errorsElement.textContent = `минимум: ${bestStats.minErrors}`;
        }
        
    } catch (error) {
        console.error('❌ Ошибка отображения лучших результатов:', error);
    }
}

// Сохранение лучших результатов
function saveBestStats() {
    try {
        const storageKey = Settings.get('storage.keys.bestStats');
        StorageUtils.set(storageKey, bestStats);
        
    } catch (error) {
        console.error('❌ Ошибка сохранения лучших результатов:', error);
    }
}

// Загрузка лучших результатов
function loadBestStats() {
    try {
        const storageKey = Settings.get('storage.keys.bestStats');
        const saved = StorageUtils.get(storageKey);
        
        if (saved) {
            bestStats = {
                time: saved.time || Infinity,
                speed: saved.speed || 0,
                minErrors: saved.minErrors || Infinity
            };
            displayBestStats();
            DebugUtils.log('📈 Лучшие результаты загружены:', bestStats);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки лучших результатов:', error);
    }
}

// Анимация завершения теста
function animateStatsCompletion() {
    try {
        // Добавляем анимационные классы
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'statUpdate 0.5s ease';
                setTimeout(() => {
                    item.style.animation = '';
                }, 500);
            }, index * 100);
        });
        
        // Анимируем звезды
        if (statsElements.stars) {
            statsElements.stars.forEach((star, index) => {
                if (star.classList.contains('filled')) {
                    setTimeout(() => {
                        star.style.animation = 'starTwinkle 2s ease-in-out';
                    }, index * 200);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка анимации завершения:', error);
    }
}

// Сброс лучших результатов
function resetBestStats() {
    try {
        bestStats = {
            time: Infinity,
            speed: 0,
            minErrors: Infinity
        };
        saveBestStats();
        displayBestStats();
        
        console.log('🔄 Лучшие результаты сброшены');
        
    } catch (error) {
        console.error('❌ Ошибка сброса лучших результатов:', error);
    }
}

// Получение детальной статистики
function getDetailedStats() {
    try {
        const currentStats = window.getStats ? window.getStats() : {};
        
        return {
            current: currentStats,
            best: bestStats,
            rating: calculateRating(currentStats),
            recommendations: generateRecommendations(currentStats)
        };
        
    } catch (error) {
        console.error('❌ Ошибка получения детальной статистики:', error);
        return null;
    }
}

// Генерация рекомендаций
function generateRecommendations(stats) {
    try {
        const recommendations = [];
        const wpm = stats.wpm || 0;
        const accuracy = stats.accuracy || 100;
        
        // Рекомендации по скорости
        if (wpm < 30) {
            recommendations.push("Сосредоточьтесь на правильной постановке пальцев");
            recommendations.push("Начните с простых упражнений на отдельные буквы");
        } else if (wpm < 60) {
            recommendations.push("Увеличивайте скорость постепенно, не жертвуя точностью");
            recommendations.push("Тренируйте сложные буквосочетания");
        } else if (wpm < 100) {
            recommendations.push("Работайте над ритмичностью печати");
            recommendations.push("Изучайте тексты с разной тематикой");
        } else {
            recommendations.push("Отличный результат! Поддерживайте навык");
            recommendations.push("Попробуйте печать на других языках");
        }
        
        // Рекомендации по точности
        if (accuracy < 90) {
            recommendations.push("Уделите больше внимания точности, а не скорости");
            recommendations.push("Перепечатывайте сложные слова несколько раз");
        } else if (accuracy < 95) {
            recommendations.push("Хорошая точность, работайте над проблемными буквами");
        }
        
        return recommendations;
        
    } catch (error) {
        console.error('❌ Ошибка генерации рекомендаций:', error);
        return [];
    }
}

// Экспорт функций в глобальную область видимости
window.initStats = initStats;
window.resetStats = resetStats;
window.updateStats = updateStats;
window.startStatsTracking = startStatsTracking;
window.stopStatsTracking = stopStatsTracking;
window.showFinalStats = showFinalStats;
window.getDetailedStats = getDetailedStats;
window.resetBestStats = resetBestStats;

// Логирование загрузки модуля
console.log('📊 Модуль статистики загружен и готов к работе');