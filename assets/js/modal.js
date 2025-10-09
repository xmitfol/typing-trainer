// Modal Controller for Typing Trainer
// Manages modal window behavior, panels, and UI interactions

class ModalController {
    constructor() {
        this.isVisible = false;
        this.activePanel = null;
        this.isTestActive = false;
        this.isReadyForTyping = true;
        this.elements = {};

        this.init();
    }

    init() {
        this.bindElements();
        this.setupEventListeners();
        this.initializeKeyboard();
        this.show(); // Show modal on page load
    }

    initializeKeyboard() {
        // Initialize keyboard controller after DOM is ready
        setTimeout(() => {
            if (window.KeyboardController) {
                this.keyboardController = new KeyboardController();
                console.log('Keyboard controller initialized');
            }
        }, 100);
    }

    bindElements() {
        this.elements = {
            overlay: document.getElementById('modalOverlay'),
            container: document.getElementById('modalContainer'),
            closeBtn: document.getElementById('modalClose'),

            // Toolbar buttons
            fingerHintsBtn: document.getElementById('fingerHintsBtn'),
            statisticsBtn: document.getElementById('statisticsBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            themeBtn: document.getElementById('themeBtn'),
            resetBtn: document.getElementById('resetBtn'),
            languageBtn: document.getElementById('languageBtn'),
            layoutBtn: document.getElementById('layoutBtn'),
            layoutDropdown: document.getElementById('layoutDropdown'),
            statusIndicator: document.getElementById('statusIndicator'),

            // Side panels
            fingerHintsPanel: document.getElementById('fingerHintsPanel'),
            statisticsPanel: document.getElementById('statisticsPanel'),

            // Results
            resultsOverlay: document.getElementById('resultsOverlay'),
            tryAgainBtn: document.getElementById('tryAgainBtn'),
            nextLevelBtn: document.getElementById('nextLevelBtn')
        };
    }

    setupEventListeners() {
        // Modal close
        this.elements.closeBtn?.addEventListener('click', () => this.hide());
        this.elements.overlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.hide();
            }
        });

        // ESC key to close and click outside dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.layoutDropdown?.classList.contains('open')) {
                    this.hideLayoutDropdown();
                } else if (this.elements.resultsOverlay?.classList.contains('active')) {
                    this.hideResults();
                } else if (this.activePanel) {
                    this.hidePanel(this.activePanel);
                } else {
                    this.hide();
                }
            }
        });

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (this.elements.layoutDropdown?.classList.contains('open')) {
                if (!e.target.closest('.layout-selector')) {
                    this.hideLayoutDropdown();
                }
            }
        });

        // Toolbar buttons
        this.elements.fingerHintsBtn?.addEventListener('click', () => {
            this.togglePanel('fingerHints');
        });

        this.elements.statisticsBtn?.addEventListener('click', () => {
            this.togglePanel('statistics');
        });

        this.elements.settingsBtn?.addEventListener('click', () => {
            this.openSettings();
        });

        this.elements.themeBtn?.addEventListener('click', () => {
            this.toggleTheme();
        });

        this.elements.resetBtn?.addEventListener('click', () => {
            this.resetExercise();
        });

        this.elements.languageBtn?.addEventListener('click', () => {
            this.switchLanguage();
        });

        this.elements.layoutBtn?.addEventListener('click', () => {
            this.toggleLayoutDropdown();
        });

        // Layout dropdown items
        this.elements.layoutDropdown?.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const layout = item.dataset.layout;
                this.selectLayout(layout);
            }
        });

        // Auto-start on first keystroke
        document.addEventListener('keydown', (e) => {
            if (this.isReadyForTyping && !this.isTestActive && this.isValidTypingKey(e)) {
                this.startTest();
            }
        });

        // Panel close buttons
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.side-panel');
                if (panel?.classList.contains('finger-hints-panel')) {
                    this.hidePanel('fingerHints');
                } else if (panel?.classList.contains('statistics-panel')) {
                    this.hidePanel('statistics');
                }
            });
        });

        // Results actions
        this.elements.tryAgainBtn?.addEventListener('click', () => {
            this.tryAgain();
        });

        this.elements.nextLevelBtn?.addEventListener('click', () => {
            this.nextLevel();
        });
    }

    // Modal visibility
    show() {
        if (this.elements.overlay) {
            this.elements.overlay.style.display = 'flex';
            setTimeout(() => {
                this.elements.overlay.style.opacity = '1';
                this.isVisible = true;
            }, 10);
        }
    }

    hide() {
        if (this.elements.overlay) {
            this.elements.overlay.style.opacity = '0';
            setTimeout(() => {
                this.elements.overlay.style.display = 'none';
                this.isVisible = false;
                this.hideAllPanels();
            }, 300);
        }
    }

    // Panel management
    togglePanel(panelType) {
        if (this.activePanel === panelType) {
            this.hidePanel(panelType);
        } else {
            this.showPanel(panelType);
        }
    }

    showPanel(panelType) {
        // Hide other panels first
        this.hideAllPanels();

        const panelElement = this.elements[`${panelType}Panel`];
        const buttonElement = this.elements[`${panelType}Btn`];

        if (panelElement && buttonElement) {
            panelElement.classList.add('active');
            buttonElement.classList.add('active');
            this.activePanel = panelType;

            // Emit event for other components
            this.emit('panelShown', { panelType });
        }
    }

    hidePanel(panelType) {
        const panelElement = this.elements[`${panelType}Panel`];
        const buttonElement = this.elements[`${panelType}Btn`];

        if (panelElement && buttonElement) {
            panelElement.classList.remove('active');
            buttonElement.classList.remove('active');

            if (this.activePanel === panelType) {
                this.activePanel = null;
            }

            // Emit event for other components
            this.emit('panelHidden', { panelType });
        }
    }

    hideAllPanels() {
        ['fingerHints', 'statistics'].forEach(panelType => {
            this.hidePanel(panelType);
        });
    }

    // Toolbar actions
    openSettings() {
        console.log('Opening settings...');
        // TODO: Implement settings modal
    }

    toggleTheme() {
        const currentTheme = document.body.dataset.theme || 'adult';
        const newTheme = currentTheme === 'adult' ? 'kids' : 'adult';

        document.body.dataset.theme = newTheme;

        // Update theme button
        const themeIcon = this.elements.themeBtn?.querySelector('.btn-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'kids' ? '🎈' : '🎨';
        }

        this.emit('themeChanged', { theme: newTheme });
        console.log(`Theme switched to: ${newTheme}`);
    }

    switchLanguage() {
        const currentLang = this.elements.languageBtn?.dataset.lang || 'ru';
        const newLang = currentLang === 'ru' ? 'en' : 'ru';

        // Update language button
        this.elements.languageBtn.dataset.lang = newLang;
        const flagSpan = this.elements.languageBtn?.querySelector('.btn-flag');
        const textSpan = this.elements.languageBtn?.querySelector('.btn-text');

        if (flagSpan && textSpan) {
            if (newLang === 'en') {
                flagSpan.textContent = '🇺🇸';
                textSpan.textContent = 'EN';
            } else {
                flagSpan.textContent = '🇷🇺';
                textSpan.textContent = 'RU';
            }
        }

        this.emit('languageChanged', { language: newLang });
        console.log(`Language switched to: ${newLang}`);
    }

    resetExercise() {
        if (confirm('Сбросить текущее упражнение?')) {
            this.emit('exerciseReset');
            console.log('Exercise reset');
        }
    }

    startTest() {
        this.isTestActive = true;
        this.isReadyForTyping = false;

        this.updateStatus('testing', '⏱️', 'Идет тест...');
        this.emit('testStarted');

        console.log('Test started');
    }

    // Results management
    showResults(results) {
        const resultsOverlay = this.elements.resultsOverlay;
        if (resultsOverlay) {
            // Populate results data
            this.populateResults(results);

            // Show overlay
            resultsOverlay.classList.add('active');

            // Reset for new test
            this.resetForNewTest();
        }
    }

    hideResults() {
        const resultsOverlay = this.elements.resultsOverlay;
        if (resultsOverlay) {
            resultsOverlay.classList.remove('active');
        }
    }

    populateResults(results) {
        // Update stars rating
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach((star, index) => {
            if (index < results.rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        // TODO: Populate detailed statistics
        console.log('Results populated:', results);
    }

    tryAgain() {
        this.hideResults();
        this.emit('tryAgain');
        console.log('Try again clicked');
    }

    nextLevel() {
        this.hideResults();
        this.emit('nextLevel');
        console.log('Next level clicked');
    }

    resetForNewTest() {
        this.isTestActive = false;
        this.isReadyForTyping = true;
        this.updateStatus('ready', '✏️', 'Готов к печати');
    }

    // Event system for communication with other components
    emit(eventType, data = {}) {
        const event = new CustomEvent(`modal:${eventType}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // Public API methods
    updateProgress(current, total) {
        const fractionElement = document.getElementById('progressFraction');
        const fillElement = document.getElementById('progressFill');

        if (fractionElement) {
            fractionElement.textContent = `${current}/${total}`;
        }

        if (fillElement) {
            const percentage = total > 0 ? (current / total) * 100 : 0;
            fillElement.style.width = `${percentage}%`;
        }
    }

    updateStats(stats) {
        // Update time
        const timeElement = document.getElementById('timeValue');
        if (timeElement && stats.time) {
            timeElement.textContent = this.formatTime(stats.time);
        }

        // Update speed
        const speedElement = document.getElementById('speedValue');
        if (speedElement && typeof stats.wpm === 'number') {
            speedElement.innerHTML = `${Math.round(stats.wpm)} <span class="unit">зн/мин</span>`;
        }

        // Update errors
        const errorsElement = document.getElementById('errorsValue');
        if (errorsElement && typeof stats.errors === 'number' && typeof stats.accuracy === 'number') {
            errorsElement.innerHTML = `${stats.errors} <span class="unit">/ ${stats.accuracy.toFixed(1)}%</span>`;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Status management
    updateStatus(state, icon, text) {
        const statusIndicator = this.elements.statusIndicator;
        if (statusIndicator) {
            const iconElement = statusIndicator.querySelector('.status-icon');
            const textElement = statusIndicator.querySelector('.status-text');

            if (iconElement) iconElement.textContent = icon;
            if (textElement) textElement.textContent = text;

            // Update CSS classes
            statusIndicator.className = 'status-indicator';
            if (state !== 'ready') {
                statusIndicator.classList.add(state);
            }
        }
    }

    // Check if key is valid for typing
    isValidTypingKey(event) {
        // Ignore modifier keys, function keys, etc.
        if (event.ctrlKey || event.altKey || event.metaKey) return false;
        if (event.key.length > 1 && !['Backspace', 'Delete', 'Enter', 'Space'].includes(event.key)) return false;
        if (event.key === 'Escape' || event.key === 'Tab') return false;

        return true;
    }

    // Layout dropdown management
    toggleLayoutDropdown() {
        const dropdown = this.elements.layoutDropdown;
        const button = this.elements.layoutBtn;

        if (dropdown && button) {
            const isOpen = dropdown.classList.contains('open');

            if (isOpen) {
                this.hideLayoutDropdown();
            } else {
                this.showLayoutDropdown();
            }
        }
    }

    showLayoutDropdown() {
        const dropdown = this.elements.layoutDropdown;
        const button = this.elements.layoutBtn;

        if (dropdown && button) {
            dropdown.classList.add('open');
            button.classList.add('open');
        }
    }

    hideLayoutDropdown() {
        const dropdown = this.elements.layoutDropdown;
        const button = this.elements.layoutBtn;

        if (dropdown && button) {
            dropdown.classList.remove('open');
            button.classList.remove('open');
        }
    }

    selectLayout(layoutKey) {
        // Update UI
        this.updateLayoutButton(layoutKey);
        this.updateDropdownSelection(layoutKey);
        this.hideLayoutDropdown();

        // Emit event for keyboard controller
        this.emit('layoutChanged', { layout: layoutKey });

        console.log(`Layout selected: ${layoutKey}`);
    }

    updateLayoutButton(layoutKey) {
        const button = this.elements.layoutBtn;
        if (!button) return;

        const layouts = {
            standard: 'Стандартная',
            phonetic: 'Фонетическая',
            typewriter: 'Машинопись',
            mac: 'macOS'
        };

        const textSpan = button.querySelector('.btn-text');
        if (textSpan && layouts[layoutKey]) {
            textSpan.textContent = layouts[layoutKey];
        }
    }

    updateDropdownSelection(layoutKey) {
        const dropdown = this.elements.layoutDropdown;
        if (!dropdown) return;

        // Remove active class from all items
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected item
        const selectedItem = dropdown.querySelector(`[data-layout="${layoutKey}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    setTestText(text) {
        const textElement = document.getElementById('textToType');
        if (textElement) {
            textElement.textContent = text;
        }
    }

    updateTypedText(typed) {
        const typedElement = document.getElementById('typedText');
        if (typedElement) {
            typedElement.textContent = typed;
        }
    }
}

// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modalController = new ModalController();
});

// Export for other modules
window.ModalController = ModalController;