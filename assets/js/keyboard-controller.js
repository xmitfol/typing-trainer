// Keyboard Controller
// Manages virtual keyboard display and interactions

class KeyboardController {
    constructor() {
        this.layouts = new KeyboardLayouts();
        this.currentShift = false;
        this.activeKey = null;
        this.keyboardElement = null;

        this.init();
    }

    init() {
        this.keyboardElement = document.getElementById('virtualKeyboard');
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for physical keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Listen for layout changes from modal
        document.addEventListener('modal:layoutChanged', (e) => {
            this.changeLayout(e.detail.layout);
        });
    }

    // Render keyboard HTML
    render() {
        if (!this.keyboardElement) {
            console.error('Keyboard element not found');
            return;
        }

        const html = this.layouts.generateKeyboardHTML();
        console.log('Generated keyboard HTML:', html.substring(0, 200) + '...');
        this.keyboardElement.innerHTML = html;

        // Verify keyboard was rendered
        const renderedKeys = this.keyboardElement.querySelectorAll('.key');
        console.log(`Rendered ${renderedKeys.length} keys`);
    }

    // Change keyboard layout
    changeLayout(layoutName) {
        const layout = this.layouts.setLayout(layoutName);
        if (layout) {
            this.render();
            console.log(`Keyboard layout changed to: ${layout.name}`);
        }
    }

    // Handle physical key press
    handleKeyDown(event) {
        // Prevent default for special keys that might interfere
        if (['Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key)) {
            event.preventDefault();
        }

        // Update shift state
        if (event.key === 'Shift') {
            this.currentShift = true;
            this.updateShiftDisplay(true);
        }

        // Highlight active key
        this.highlightKey(event.key, event.code);
    }

    // Handle physical key release
    handleKeyUp(event) {
        // Update shift state
        if (event.key === 'Shift') {
            this.currentShift = false;
            this.updateShiftDisplay(false);
        }

        // Remove highlight
        this.removeHighlight(event.key, event.code);
    }

    // Highlight key on virtual keyboard
    highlightKey(key, code) {
        // Remove previous highlights
        this.clearHighlights();

        // Find the key element
        let keyElement = this.findKeyElement(key, code);

        if (keyElement) {
            keyElement.classList.add('active');
            this.activeKey = keyElement;

            // Add pulse animation for better visibility
            keyElement.style.animation = 'key-pulse 0.15s ease';
            setTimeout(() => {
                if (keyElement.style) {
                    keyElement.style.animation = '';
                }
            }, 150);
        }
    }

    // Remove key highlight
    removeHighlight(key, code) {
        if (this.activeKey) {
            this.activeKey.classList.remove('active');
            this.activeKey = null;
        }
    }

    // Clear all highlights
    clearHighlights() {
        if (this.keyboardElement) {
            const activeKeys = this.keyboardElement.querySelectorAll('.key.active');
            activeKeys.forEach(key => key.classList.remove('active'));
        }
    }

    // Find key element by key or code
    findKeyElement(key, code) {
        if (!this.keyboardElement) return null;

        // Try to find by data-key attribute first
        let element = this.keyboardElement.querySelector(`[data-key="${key}"]`);

        // If not found, try by data-code
        if (!element && code) {
            element = this.keyboardElement.querySelector(`[data-code="${code}"]`);
        }

        // Special cases for space and some keys
        if (!element) {
            switch (key) {
                case ' ':
                    element = this.keyboardElement.querySelector('[data-key=" "]');
                    break;
                case 'Enter':
                    element = this.keyboardElement.querySelector('.enter');
                    break;
                case 'Backspace':
                    element = this.keyboardElement.querySelector('.backspace');
                    break;
                case 'Tab':
                    element = this.keyboardElement.querySelector('.tab');
                    break;
                case 'CapsLock':
                    element = this.keyboardElement.querySelector('.caps');
                    break;
                case 'Shift':
                    // Find the appropriate shift key (left or right based on location)
                    element = this.keyboardElement.querySelector('.shift-left');
                    break;
                case 'Control':
                    element = this.keyboardElement.querySelector('.ctrl');
                    break;
                case 'Alt':
                    element = this.keyboardElement.querySelector('.alt');
                    break;
                case 'Insert':
                    element = this.keyboardElement.querySelector('[data-key="Insert"]');
                    break;
                case 'Home':
                    element = this.keyboardElement.querySelector('[data-key="Home"]');
                    break;
                case 'PageUp':
                    element = this.keyboardElement.querySelector('[data-key="PageUp"]');
                    break;
                case 'Delete':
                    element = this.keyboardElement.querySelector('[data-key="Delete"]');
                    break;
                case 'End':
                    element = this.keyboardElement.querySelector('[data-key="End"]');
                    break;
                case 'PageDown':
                    element = this.keyboardElement.querySelector('[data-key="PageDown"]');
                    break;
                case 'ArrowUp':
                    element = this.keyboardElement.querySelector('[data-key="ArrowUp"]');
                    break;
                case 'ArrowDown':
                    element = this.keyboardElement.querySelector('[data-key="ArrowDown"]');
                    break;
                case 'ArrowLeft':
                    element = this.keyboardElement.querySelector('[data-key="ArrowLeft"]');
                    break;
                case 'ArrowRight':
                    element = this.keyboardElement.querySelector('[data-key="ArrowRight"]');
                    break;
                // Numpad keys
                case 'NumLock':
                    element = this.keyboardElement.querySelector('[data-key="NumLock"]');
                    break;
                case 'NumpadDivide':
                case '/':
                    element = this.keyboardElement.querySelector('[data-key="NumpadDivide"]');
                    break;
                case 'NumpadMultiply':
                case '*':
                    element = this.keyboardElement.querySelector('[data-key="NumpadMultiply"]');
                    break;
                case 'NumpadSubtract':
                case '-':
                    element = this.keyboardElement.querySelector('[data-key="NumpadSubtract"]');
                    break;
                case 'NumpadAdd':
                case '+':
                    element = this.keyboardElement.querySelector('[data-key="NumpadAdd"]');
                    break;
                case 'NumpadEnter':
                    element = this.keyboardElement.querySelector('[data-key="NumpadEnter"]');
                    break;
                case 'NumpadDecimal':
                case '.':
                    element = this.keyboardElement.querySelector('[data-key="NumpadDecimal"]');
                    break;
                case 'Numpad0':
                case 'Numpad1':
                case 'Numpad2':
                case 'Numpad3':
                case 'Numpad4':
                case 'Numpad5':
                case 'Numpad6':
                case 'Numpad7':
                case 'Numpad8':
                case 'Numpad9':
                    element = this.keyboardElement.querySelector(`[data-key="${key}"]`);
                    break;
            }
        }

        return element;
    }

    // Update shift key display
    updateShiftDisplay(isPressed) {
        if (!this.keyboardElement) return;

        const shiftKeys = this.keyboardElement.querySelectorAll('.shift-left, .shift-right');
        const keys = this.keyboardElement.querySelectorAll('.key[data-shift]');

        shiftKeys.forEach(shift => {
            if (isPressed) {
                shift.classList.add('pressed');
            } else {
                shift.classList.remove('pressed');
            }
        });

        // Toggle between main and shift symbols
        keys.forEach(key => {
            const mainSpan = key.querySelector('.key-main');
            const shiftSpan = key.querySelector('.key-shift');

            if (mainSpan && shiftSpan) {
                if (isPressed) {
                    mainSpan.style.opacity = '0.4';
                    shiftSpan.style.opacity = '1';
                } else {
                    mainSpan.style.opacity = '1';
                    shiftSpan.style.opacity = '0.4';
                }
            }
        });
    }

    // Get current layout info
    getCurrentLayoutInfo() {
        return {
            key: this.layouts.currentLayout,
            layout: this.layouts.getCurrentLayout()
        };
    }

    // Highlight next expected key (for guided typing)
    highlightExpectedKey(expectedChar) {
        this.clearHighlights();

        // Find key that produces this character
        const keyElement = this.findKeyByCharacter(expectedChar);
        if (keyElement) {
            keyElement.classList.add('expected');

            // Check if shift is needed
            const shiftChar = keyElement.dataset.shift;
            if (shiftChar === expectedChar) {
                this.updateShiftDisplay(true);
                const shiftKeys = this.keyboardElement.querySelectorAll('.shift-left, .shift-right');
                shiftKeys.forEach(shift => shift.classList.add('expected'));
            }
        }
    }

    // Clear expected key highlight
    clearExpectedHighlight() {
        if (this.keyboardElement) {
            const expectedKeys = this.keyboardElement.querySelectorAll('.expected');
            expectedKeys.forEach(key => key.classList.remove('expected'));
        }
    }

    // Find key element by character it produces
    findKeyByCharacter(char) {
        if (!this.keyboardElement) return null;

        // Try to find key that has this character as main or shift
        const keys = this.keyboardElement.querySelectorAll('.key[data-key], .key[data-shift]');

        for (const key of keys) {
            const mainChar = key.dataset.key;
            const shiftChar = key.dataset.shift;

            if (mainChar === char || shiftChar === char) {
                return key;
            }
        }

        return null;
    }

    // Get layout names for dropdown
    getAvailableLayouts() {
        return this.layouts.getAvailableLayouts();
    }
}

// Add CSS for keyboard animations
const keyboardStyles = `
<style>
@keyframes key-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.key.active {
    background: #3b82f6 !important;
    color: white !important;
    transform: scale(0.95);
}

.key.expected {
    background: #fbbf24 !important;
    color: #92400e !important;
    box-shadow: 0 0 0 2px #fbbf24;
    animation: expected-pulse 1s infinite;
}

.key.pressed {
    background: #1e40af !important;
    color: white !important;
}

@keyframes expected-pulse {
    0%, 100% { box-shadow: 0 0 0 2px #fbbf24; }
    50% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.5); }
}

.key .key-shift {
    opacity: 0.4;
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 10px;
}

.key .key-main {
    opacity: 1;
}
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', keyboardStyles);

// Export for other modules
window.KeyboardController = KeyboardController;