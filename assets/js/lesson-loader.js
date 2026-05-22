/**
 * Lesson Loader — асинхронная загрузка уроков из data/lessons/{tier}/lesson_NN.json.
 * Канонический курс — tier1 (см. config/settings.js -> lessons.defaultTier).
 */

class LessonLoader {
    constructor() {
        this.basePath = (window.Settings && window.Settings.get('lessons.basePath', 'data/lessons')) || 'data/lessons';
        this.defaultTier = (window.Settings && window.Settings.get('lessons.defaultTier', 'tier1')) || 'tier1';
        this.cache = new Map();
    }

    /**
     * Загрузить урок по тиру и номеру.
     * @param {string} tier - например, 'tier1'
     * @param {number} lessonNumber - 1..39
     * @returns {Promise<Object|null>}
     */
    async loadLesson(tier, lessonNumber) {
        const tierKey = tier || this.defaultTier;
        const paddedNum = String(lessonNumber).padStart(2, '0');
        const key = `${tierKey}/lesson_${paddedNum}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            const response = await fetch(`${this.basePath}/${tierKey}/lesson_${paddedNum}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${key}`);
            }
            const lesson = await response.json();
            this.cache.set(key, lesson);
            return lesson;
        } catch (error) {
            console.error(`Failed to load lesson ${key}:`, error);
            return null;
        }
    }

    /**
     * Загрузить первый урок канонического tier.
     */
    async loadFirstLesson() {
        const firstNum = (window.Settings && window.Settings.get('lessons.firstLessonNumber', 1)) || 1;
        return this.loadLesson(this.defaultTier, firstNum);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lessonLoader = new LessonLoader();
});

window.LessonLoader = LessonLoader;
