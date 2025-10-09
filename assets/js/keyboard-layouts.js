// Keyboard Layout System
// Manages different keyboard layouts with consistent finger color mapping

class KeyboardLayouts {
    constructor() {
        this.currentLayout = 'standard';
        this.layouts = this.defineLayouts();
        this.fingerColors = this.defineFingerColors();
    }

    defineFingerColors() {
        return {
            pinky_left: 'pink',      // Левый мизинец
            ring_left: 'orange',     // Левый безымянный
            middle_left: 'green',    // Левый средний
            index_left: 'cyan',      // Левый указательный
            index_right: 'blue',     // Правый указательный
            middle_right: 'green',   // Правый средний
            ring_right: 'orange',    // Правый безымянный
            pinky_right: 'pink',     // Правый мизинец
            thumb: 'purple'          // Большие пальцы
        };
    }

    defineLayouts() {
        return {
            standard: {
                name: 'Стандартная ЙЦУКЕН',
                description: 'Стандартная русская раскладка',
                rows: {
                    numbers: [
                        { key: 'ё', shift: 'Ё', finger: 'pinky_left', code: 'Backquote' },
                        { key: '1', shift: '!', finger: 'pinky_left', code: 'Digit1' },
                        { key: '2', shift: '"', finger: 'ring_left', code: 'Digit2' },
                        { key: '3', shift: '№', finger: 'middle_left', code: 'Digit3' },
                        { key: '4', shift: ';', finger: 'index_left', code: 'Digit4' },
                        { key: '5', shift: '%', finger: 'index_left', code: 'Digit5' },
                        { key: '6', shift: ':', finger: 'index_right', code: 'Digit6' },
                        { key: '7', shift: '?', finger: 'index_right', code: 'Digit7' },
                        { key: '8', shift: '*', finger: 'middle_right', code: 'Digit8' },
                        { key: '9', shift: '(', finger: 'ring_right', code: 'Digit9' },
                        { key: '0', shift: ')', finger: 'pinky_right', code: 'Digit0' },
                        { key: '-', shift: '_', finger: 'pinky_right', code: 'Minus' },
                        { key: '=', shift: '+', finger: 'pinky_right', code: 'Equal' }
                    ],
                    top: [
                        { key: 'й', shift: 'Й', finger: 'pinky_left', code: 'KeyQ' },
                        { key: 'ц', shift: 'Ц', finger: 'ring_left', code: 'KeyW' },
                        { key: 'у', shift: 'У', finger: 'middle_left', code: 'KeyE' },
                        { key: 'к', shift: 'К', finger: 'index_left', code: 'KeyR' },
                        { key: 'е', shift: 'Е', finger: 'index_left', code: 'KeyT' },
                        { key: 'н', shift: 'Н', finger: 'index_right', code: 'KeyY' },
                        { key: 'г', shift: 'Г', finger: 'index_right', code: 'KeyU' },
                        { key: 'ш', shift: 'Ш', finger: 'middle_right', code: 'KeyI' },
                        { key: 'щ', shift: 'Щ', finger: 'ring_right', code: 'KeyO' },
                        { key: 'з', shift: 'З', finger: 'pinky_right', code: 'KeyP' },
                        { key: 'х', shift: 'Х', finger: 'pinky_right', code: 'BracketLeft' },
                        { key: 'ъ', shift: 'Ъ', finger: 'pinky_right', code: 'BracketRight' }
                    ],
                    home: [
                        { key: 'ф', shift: 'Ф', finger: 'pinky_left', code: 'KeyA' },
                        { key: 'ы', shift: 'Ы', finger: 'ring_left', code: 'KeyS' },
                        { key: 'в', shift: 'В', finger: 'middle_left', code: 'KeyD' },
                        { key: 'а', shift: 'А', finger: 'index_left', code: 'KeyF' },
                        { key: 'п', shift: 'П', finger: 'index_left', code: 'KeyG' },
                        { key: 'р', shift: 'Р', finger: 'index_right', code: 'KeyH' },
                        { key: 'о', shift: 'О', finger: 'index_right', code: 'KeyJ' },
                        { key: 'л', shift: 'Л', finger: 'middle_right', code: 'KeyK' },
                        { key: 'д', shift: 'Д', finger: 'ring_right', code: 'KeyL' },
                        { key: 'ж', shift: 'Ж', finger: 'pinky_right', code: 'Semicolon' },
                        { key: 'э', shift: 'Э', finger: 'pinky_right', code: 'Quote' }
                    ],
                    bottom: [
                        { key: 'я', shift: 'Я', finger: 'pinky_left', code: 'KeyZ' },
                        { key: 'ч', shift: 'Ч', finger: 'ring_left', code: 'KeyX' },
                        { key: 'с', shift: 'С', finger: 'middle_left', code: 'KeyC' },
                        { key: 'м', shift: 'М', finger: 'index_left', code: 'KeyV' },
                        { key: 'и', shift: 'И', finger: 'index_left', code: 'KeyB' },
                        { key: 'т', shift: 'Т', finger: 'index_right', code: 'KeyN' },
                        { key: 'ь', shift: 'Ь', finger: 'index_right', code: 'KeyM' },
                        { key: 'б', shift: 'Б', finger: 'middle_right', code: 'Comma' },
                        { key: 'ю', shift: 'Ю', finger: 'ring_right', code: 'Period' },
                        { key: '.', shift: ',', finger: 'pinky_right', code: 'Slash' }
                    ]
                }
            },

            phonetic: {
                name: 'Фонетическая',
                description: 'Русские буквы на позициях похожих английских',
                rows: {
                    numbers: [
                        { key: 'ё', shift: 'Ё', finger: 'pinky_left', code: 'Backquote' },
                        { key: '1', shift: '!', finger: 'pinky_left', code: 'Digit1' },
                        { key: '2', shift: '@', finger: 'ring_left', code: 'Digit2' },
                        { key: '3', shift: '#', finger: 'middle_left', code: 'Digit3' },
                        { key: '4', shift: '$', finger: 'index_left', code: 'Digit4' },
                        { key: '5', shift: '%', finger: 'index_left', code: 'Digit5' },
                        { key: '6', shift: '^', finger: 'index_right', code: 'Digit6' },
                        { key: '7', shift: '&', finger: 'index_right', code: 'Digit7' },
                        { key: '8', shift: '*', finger: 'middle_right', code: 'Digit8' },
                        { key: '9', shift: '(', finger: 'ring_right', code: 'Digit9' },
                        { key: '0', shift: ')', finger: 'pinky_right', code: 'Digit0' },
                        { key: '-', shift: '_', finger: 'pinky_right', code: 'Minus' },
                        { key: '=', shift: '+', finger: 'pinky_right', code: 'Equal' }
                    ],
                    top: [
                        { key: 'я', shift: 'Я', finger: 'pinky_left', code: 'KeyQ' },
                        { key: 'в', shift: 'В', finger: 'ring_left', code: 'KeyW' },
                        { key: 'е', shift: 'Е', finger: 'middle_left', code: 'KeyE' },
                        { key: 'р', shift: 'Р', finger: 'index_left', code: 'KeyR' },
                        { key: 'т', shift: 'Т', finger: 'index_left', code: 'KeyT' },
                        { key: 'ы', shift: 'Ы', finger: 'index_right', code: 'KeyY' },
                        { key: 'у', shift: 'У', finger: 'index_right', code: 'KeyU' },
                        { key: 'и', shift: 'И', finger: 'middle_right', code: 'KeyI' },
                        { key: 'о', shift: 'О', finger: 'ring_right', code: 'KeyO' },
                        { key: 'п', shift: 'П', finger: 'pinky_right', code: 'KeyP' },
                        { key: 'ш', shift: 'Ш', finger: 'pinky_right', code: 'BracketLeft' },
                        { key: 'щ', shift: 'Щ', finger: 'pinky_right', code: 'BracketRight' }
                    ],
                    home: [
                        { key: 'а', shift: 'А', finger: 'pinky_left', code: 'KeyA' },
                        { key: 'с', shift: 'С', finger: 'ring_left', code: 'KeyS' },
                        { key: 'д', shift: 'Д', finger: 'middle_left', code: 'KeyD' },
                        { key: 'ф', shift: 'Ф', finger: 'index_left', code: 'KeyF' },
                        { key: 'г', shift: 'Г', finger: 'index_left', code: 'KeyG' },
                        { key: 'х', shift: 'Х', finger: 'index_right', code: 'KeyH' },
                        { key: 'й', shift: 'Й', finger: 'index_right', code: 'KeyJ' },
                        { key: 'к', shift: 'К', finger: 'middle_right', code: 'KeyK' },
                        { key: 'л', shift: 'Л', finger: 'ring_right', code: 'KeyL' },
                        { key: 'ж', shift: 'Ж', finger: 'pinky_right', code: 'Semicolon' },
                        { key: 'э', shift: 'Э', finger: 'pinky_right', code: 'Quote' }
                    ],
                    bottom: [
                        { key: 'з', shift: 'З', finger: 'pinky_left', code: 'KeyZ' },
                        { key: 'ь', shift: 'Ь', finger: 'ring_left', code: 'KeyX' },
                        { key: 'ц', shift: 'Ц', finger: 'middle_left', code: 'KeyC' },
                        { key: 'ч', shift: 'Ч', finger: 'index_left', code: 'KeyV' },
                        { key: 'б', shift: 'Б', finger: 'index_left', code: 'KeyB' },
                        { key: 'н', shift: 'Н', finger: 'index_right', code: 'KeyN' },
                        { key: 'м', shift: 'М', finger: 'index_right', code: 'KeyM' },
                        { key: 'ю', shift: 'Ю', finger: 'middle_right', code: 'Comma' },
                        { key: '.', shift: '>', finger: 'ring_right', code: 'Period' },
                        { key: 'ъ', shift: '?', finger: 'pinky_right', code: 'Slash' }
                    ]
                }
            },

            typewriter: {
                name: 'Машинопись',
                description: 'Классическая раскладка печатных машинок',
                rows: {
                    numbers: [
                        { key: '№', shift: '№', finger: 'pinky_left', code: 'Backquote' },
                        { key: '1', shift: '!', finger: 'pinky_left', code: 'Digit1' },
                        { key: '2', shift: '"', finger: 'ring_left', code: 'Digit2' },
                        { key: '3', shift: '№', finger: 'middle_left', code: 'Digit3' },
                        { key: '4', shift: ';', finger: 'index_left', code: 'Digit4' },
                        { key: '5', shift: '%', finger: 'index_left', code: 'Digit5' },
                        { key: '6', shift: ':', finger: 'index_right', code: 'Digit6' },
                        { key: '7', shift: '?', finger: 'index_right', code: 'Digit7' },
                        { key: '8', shift: '*', finger: 'middle_right', code: 'Digit8' },
                        { key: '9', shift: '(', finger: 'ring_right', code: 'Digit9' },
                        { key: '0', shift: ')', finger: 'pinky_right', code: 'Digit0' },
                        { key: '-', shift: '_', finger: 'pinky_right', code: 'Minus' },
                        { key: '=', shift: '+', finger: 'pinky_right', code: 'Equal' }
                    ],
                    top: [
                        { key: 'й', shift: 'Й', finger: 'pinky_left', code: 'KeyQ' },
                        { key: 'ц', shift: 'Ц', finger: 'ring_left', code: 'KeyW' },
                        { key: 'у', shift: 'У', finger: 'middle_left', code: 'KeyE' },
                        { key: 'к', shift: 'К', finger: 'index_left', code: 'KeyR' },
                        { key: 'е', shift: 'Е', finger: 'index_left', code: 'KeyT' },
                        { key: 'н', shift: 'Н', finger: 'index_right', code: 'KeyY' },
                        { key: 'г', shift: 'Г', finger: 'index_right', code: 'KeyU' },
                        { key: 'ш', shift: 'Ш', finger: 'middle_right', code: 'KeyI' },
                        { key: 'щ', shift: 'Щ', finger: 'ring_right', code: 'KeyO' },
                        { key: 'з', shift: 'З', finger: 'pinky_right', code: 'KeyP' },
                        { key: 'х', shift: 'Х', finger: 'pinky_right', code: 'BracketLeft' },
                        { key: 'ъ', shift: 'Ъ', finger: 'pinky_right', code: 'BracketRight' }
                    ],
                    home: [
                        { key: 'ф', shift: 'Ф', finger: 'pinky_left', code: 'KeyA' },
                        { key: 'ы', shift: 'Ы', finger: 'ring_left', code: 'KeyS' },
                        { key: 'в', shift: 'В', finger: 'middle_left', code: 'KeyD' },
                        { key: 'а', shift: 'А', finger: 'index_left', code: 'KeyF' },
                        { key: 'п', shift: 'П', finger: 'index_left', code: 'KeyG' },
                        { key: 'р', shift: 'Р', finger: 'index_right', code: 'KeyH' },
                        { key: 'о', shift: 'О', finger: 'index_right', code: 'KeyJ' },
                        { key: 'л', shift: 'Л', finger: 'middle_right', code: 'KeyK' },
                        { key: 'д', shift: 'Д', finger: 'ring_right', code: 'KeyL' },
                        { key: 'ж', shift: 'Ж', finger: 'pinky_right', code: 'Semicolon' },
                        { key: 'э', shift: 'Э', finger: 'pinky_right', code: 'Quote' }
                    ],
                    bottom: [
                        { key: 'я', shift: 'Я', finger: 'pinky_left', code: 'KeyZ' },
                        { key: 'ч', shift: 'Ч', finger: 'ring_left', code: 'KeyX' },
                        { key: 'с', shift: 'С', finger: 'middle_left', code: 'KeyC' },
                        { key: 'м', shift: 'М', finger: 'index_left', code: 'KeyV' },
                        { key: 'и', shift: 'И', finger: 'index_left', code: 'KeyB' },
                        { key: 'т', shift: 'Т', finger: 'index_right', code: 'KeyN' },
                        { key: 'ь', shift: 'Ь', finger: 'index_right', code: 'KeyM' },
                        { key: 'б', shift: 'Б', finger: 'middle_right', code: 'Comma' },
                        { key: 'ю', shift: 'Ю', finger: 'ring_right', code: 'Period' },
                        { key: '.', shift: ',', finger: 'pinky_right', code: 'Slash' }
                    ]
                }
            },

            mac: {
                name: 'macOS',
                description: 'Раскладка для macOS',
                rows: {
                    numbers: [
                        { key: 'ё', shift: 'Ё', finger: 'pinky_left', code: 'Backquote' },
                        { key: '1', shift: '!', finger: 'pinky_left', code: 'Digit1' },
                        { key: '2', shift: '"', finger: 'ring_left', code: 'Digit2' },
                        { key: '3', shift: '№', finger: 'middle_left', code: 'Digit3' },
                        { key: '4', shift: ';', finger: 'index_left', code: 'Digit4' },
                        { key: '5', shift: '%', finger: 'index_left', code: 'Digit5' },
                        { key: '6', shift: ':', finger: 'index_right', code: 'Digit6' },
                        { key: '7', shift: '?', finger: 'index_right', code: 'Digit7' },
                        { key: '8', shift: '*', finger: 'middle_right', code: 'Digit8' },
                        { key: '9', shift: '(', finger: 'ring_right', code: 'Digit9' },
                        { key: '0', shift: ')', finger: 'pinky_right', code: 'Digit0' },
                        { key: '-', shift: '_', finger: 'pinky_right', code: 'Minus' },
                        { key: '=', shift: '+', finger: 'pinky_right', code: 'Equal' }
                    ],
                    top: [
                        { key: 'й', shift: 'Й', finger: 'pinky_left', code: 'KeyQ' },
                        { key: 'ц', shift: 'Ц', finger: 'ring_left', code: 'KeyW' },
                        { key: 'у', shift: 'У', finger: 'middle_left', code: 'KeyE' },
                        { key: 'к', shift: 'К', finger: 'index_left', code: 'KeyR' },
                        { key: 'е', shift: 'Е', finger: 'index_left', code: 'KeyT' },
                        { key: 'н', shift: 'Н', finger: 'index_right', code: 'KeyY' },
                        { key: 'г', shift: 'Г', finger: 'index_right', code: 'KeyU' },
                        { key: 'ш', shift: 'Ш', finger: 'middle_right', code: 'KeyI' },
                        { key: 'щ', shift: 'Щ', finger: 'ring_right', code: 'KeyO' },
                        { key: 'з', shift: 'З', finger: 'pinky_right', code: 'KeyP' },
                        { key: 'х', shift: 'Х', finger: 'pinky_right', code: 'BracketLeft' },
                        { key: 'ъ', shift: 'Ъ', finger: 'pinky_right', code: 'BracketRight' }
                    ],
                    home: [
                        { key: 'ф', shift: 'Ф', finger: 'pinky_left', code: 'KeyA' },
                        { key: 'ы', shift: 'Ы', finger: 'ring_left', code: 'KeyS' },
                        { key: 'в', shift: 'В', finger: 'middle_left', code: 'KeyD' },
                        { key: 'а', shift: 'А', finger: 'index_left', code: 'KeyF' },
                        { key: 'п', shift: 'П', finger: 'index_left', code: 'KeyG' },
                        { key: 'р', shift: 'Р', finger: 'index_right', code: 'KeyH' },
                        { key: 'о', shift: 'О', finger: 'index_right', code: 'KeyJ' },
                        { key: 'л', shift: 'Л', finger: 'middle_right', code: 'KeyK' },
                        { key: 'д', shift: 'Д', finger: 'ring_right', code: 'KeyL' },
                        { key: 'ж', shift: 'Ж', finger: 'pinky_right', code: 'Semicolon' },
                        { key: 'э', shift: 'Э', finger: 'pinky_right', code: 'Quote' }
                    ],
                    bottom: [
                        { key: 'я', shift: 'Я', finger: 'pinky_left', code: 'KeyZ' },
                        { key: 'ч', shift: 'Ч', finger: 'ring_left', code: 'KeyX' },
                        { key: 'с', shift: 'С', finger: 'middle_left', code: 'KeyC' },
                        { key: 'м', shift: 'М', finger: 'index_left', code: 'KeyV' },
                        { key: 'и', shift: 'И', finger: 'index_left', code: 'KeyB' },
                        { key: 'т', shift: 'Т', finger: 'index_right', code: 'KeyN' },
                        { key: 'ь', shift: 'Ь', finger: 'index_right', code: 'KeyM' },
                        { key: 'б', shift: 'Б', finger: 'middle_right', code: 'Comma' },
                        { key: 'ю', shift: 'Ю', finger: 'ring_right', code: 'Period' },
                        { key: '.', shift: ',', finger: 'pinky_right', code: 'Slash' }
                    ]
                }
            }
        };
    }

    // Get current layout
    getCurrentLayout() {
        return this.layouts[this.currentLayout];
    }

    // Switch layout
    setLayout(layoutName) {
        if (this.layouts[layoutName]) {
            this.currentLayout = layoutName;
            return this.layouts[layoutName];
        }
        return null;
    }

    // Get all available layouts
    getAvailableLayouts() {
        return Object.keys(this.layouts).map(key => ({
            key,
            name: this.layouts[key].name,
            description: this.layouts[key].description
        }));
    }

    // Get finger color for a key
    getFingerColor(fingerName) {
        return this.fingerColors[fingerName] || 'default';
    }

    // Generate keyboard HTML with 3 distinct sections
    generateKeyboardHTML() {
        const layout = this.getCurrentLayout();
        let html = '';

        // Main keyboard block
        html += '<div class="keyboard-main">';

        // Numbers row
        html += '<div class="keyboard-row numbers-row">';
        layout.rows.numbers.forEach(keyData => {
            const colorClass = this.getFingerColor(keyData.finger);
            html += `
                <div class="key ${colorClass}"
                     data-key="${keyData.key}"
                     data-shift="${keyData.shift || ''}"
                     data-code="${keyData.code}"
                     data-finger="${keyData.finger}">
                    <span class="key-main">${keyData.key}</span>
                    ${keyData.shift ? `<span class="key-shift">${keyData.shift}</span>` : ''}
                </div>`;
        });
        html += '<div class="key backspace" data-key="Backspace">Backspace</div>';
        html += '</div>';

        // Tab + Top row
        html += '<div class="keyboard-row top-row">';
        html += '<div class="key tab" data-key="Tab">Tab</div>';
        layout.rows.top.forEach(keyData => {
            const colorClass = this.getFingerColor(keyData.finger);
            html += `
                <div class="key ${colorClass}"
                     data-key="${keyData.key}"
                     data-shift="${keyData.shift || ''}"
                     data-code="${keyData.code}"
                     data-finger="${keyData.finger}">
                    <span class="key-main">${keyData.key}</span>
                    ${keyData.shift ? `<span class="key-shift">${keyData.shift}</span>` : ''}
                </div>`;
        });
        html += '<div class="key backslash" data-key="\\"">\\</div>';
        html += '</div>';

        // Caps + Home row
        html += '<div class="keyboard-row home-row">';
        html += '<div class="key caps" data-key="CapsLock">Caps</div>';
        layout.rows.home.forEach(keyData => {
            const colorClass = this.getFingerColor(keyData.finger);
            html += `
                <div class="key ${colorClass}"
                     data-key="${keyData.key}"
                     data-shift="${keyData.shift || ''}"
                     data-code="${keyData.code}"
                     data-finger="${keyData.finger}">
                    <span class="key-main">${keyData.key}</span>
                    ${keyData.shift ? `<span class="key-shift">${keyData.shift}</span>` : ''}
                </div>`;
        });
        html += '<div class="key enter" data-key="Enter">Enter</div>';
        html += '</div>';

        // Shift + Bottom row
        html += '<div class="keyboard-row bottom-row">';
        html += '<div class="key shift-left" data-key="Shift">Shift</div>';
        layout.rows.bottom.forEach(keyData => {
            const colorClass = this.getFingerColor(keyData.finger);
            html += `
                <div class="key ${colorClass}"
                     data-key="${keyData.key}"
                     data-shift="${keyData.shift || ''}"
                     data-code="${keyData.code}"
                     data-finger="${keyData.finger}">
                    <span class="key-main">${keyData.key}</span>
                    ${keyData.shift ? `<span class="key-shift">${keyData.shift}</span>` : ''}
                </div>`;
        });
        html += '<div class="key shift-right" data-key="Shift">Shift</div>';
        html += '</div>';

        // Space row
        html += '<div class="keyboard-row space-row">';
        html += '<div class="key ctrl" data-key="Control">Ctrl</div>';
        html += '<div class="key meta" data-key="Meta">⊞</div>';
        html += '<div class="key alt" data-key="Alt">Alt</div>';
        html += '<div class="key spacebar purple" data-key=" " data-finger="thumb">Пробел</div>';
        html += '<div class="key alt" data-key="AltGraph">Alt</div>';
        html += '<div class="key meta" data-key="Meta">⊞</div>';
        html += '<div class="key menu" data-key="ContextMenu">▤</div>';
        html += '<div class="key ctrl" data-key="Control">Ctrl</div>';
        html += '</div>';

        html += '</div>'; // End main keyboard

        // Navigation keys block
        html += '<div class="keyboard-nav">';
        html += '<div class="nav-keys-block">';
        html += '<div class="nav-row">';
        html += '<div class="key nav" data-key="Insert">Ins</div>';
        html += '<div class="key nav" data-key="Home">Home</div>';
        html += '<div class="key nav" data-key="PageUp">PgUp</div>';
        html += '</div>';
        html += '<div class="nav-row">';
        html += '<div class="key nav" data-key="Delete">Del</div>';
        html += '<div class="key nav" data-key="End">End</div>';
        html += '<div class="key nav" data-key="PageDown">PgDn</div>';
        html += '</div>';
        html += '</div>';

        // Arrow keys
        html += '<div class="arrow-keys-block">';
        html += '<div class="arrow-row">';
        html += '<div class="key-spacer"></div>';
        html += '<div class="key arrow" data-key="ArrowUp">↑</div>';
        html += '<div class="key-spacer"></div>';
        html += '</div>';
        html += '<div class="arrow-row">';
        html += '<div class="key arrow" data-key="ArrowLeft">←</div>';
        html += '<div class="key arrow" data-key="ArrowDown">↓</div>';
        html += '<div class="key arrow" data-key="ArrowRight">→</div>';
        html += '</div>';
        html += '</div>';

        html += '</div>'; // End navigation

        // Numpad block
        html += '<div class="keyboard-numpad">';
        html += this.generateNumpadHTML();
        html += '</div>'; // End numpad

        return html;
    }

    // Generate numpad HTML
    generateNumpadHTML() {
        return `
            <div class="numpad-section">
                <div class="numpad-row">
                    <div class="key numlock" data-key="NumLock">Num</div>
                    <div class="key green" data-key="NumpadDivide" data-finger="middle_right">/</div>
                    <div class="key orange" data-key="NumpadMultiply" data-finger="ring_right">*</div>
                    <div class="key orange" data-key="NumpadSubtract" data-finger="ring_right">-</div>
                </div>
                <div class="numpad-row">
                    <div class="key blue" data-key="Numpad7" data-finger="index_right">7</div>
                    <div class="key green" data-key="Numpad8" data-finger="middle_right">8</div>
                    <div class="key orange" data-key="Numpad9" data-finger="ring_right">9</div>
                    <div class="key orange numpad-plus" data-key="NumpadAdd" data-finger="ring_right">+</div>
                </div>
                <div class="numpad-row">
                    <div class="key blue" data-key="Numpad4" data-finger="index_right">4</div>
                    <div class="key green" data-key="Numpad5" data-finger="middle_right">5</div>
                    <div class="key orange" data-key="Numpad6" data-finger="ring_right">6</div>
                </div>
                <div class="numpad-row">
                    <div class="key blue" data-key="Numpad1" data-finger="index_right">1</div>
                    <div class="key green" data-key="Numpad2" data-finger="middle_right">2</div>
                    <div class="key orange" data-key="Numpad3" data-finger="ring_right">3</div>
                    <div class="key purple numpad-enter" data-key="NumpadEnter" data-finger="thumb">Enter</div>
                </div>
                <div class="numpad-row">
                    <div class="key purple numpad-zero" data-key="Numpad0" data-finger="thumb">0</div>
                    <div class="key orange" data-key="NumpadDecimal" data-finger="ring_right">.</div>
                </div>
            </div>`;
    }
}

// Export for use in other modules
window.KeyboardLayouts = KeyboardLayouts;