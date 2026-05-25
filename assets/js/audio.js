// assets/js/audio.js
// Простые звуки через Web Audio API: beep на нажатия + metronome по target_wpm.
// Управляется display toggle'ами 'sound' и 'rhythm' из keyboard.js.

const AUDIO_TOGGLES_KEY = 'typing_trainer_display_toggles';

let audioCtx = null;
let metronomeIntervalId = null;

function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
        audioCtx = new Ctx();
        // Browser autoplay policy — resume по first user gesture
        if (audioCtx.state === 'suspended') {
            const resume = () => {
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                document.removeEventListener('click', resume);
                document.removeEventListener('keydown', resume);
            };
            document.addEventListener('click', resume, { once: true });
            document.addEventListener('keydown', resume, { once: true });
        }
        return audioCtx;
    } catch (e) {
        console.warn('AudioContext недоступен:', e);
        return null;
    }
}

function isToggleOn(id) {
    try {
        const raw = localStorage.getItem(AUDIO_TOGGLES_KEY);
        if (!raw) return false;
        const state = JSON.parse(raw);
        return !!state[id];
    } catch (e) { return false; }
}

// Короткий tone через oscillator. type='sine' тише и приятнее.
function playTone(frequency, durationMs, volume) {
    const ctx = ensureAudioContext();
    if (!ctx || ctx.state === 'suspended') return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        const v = typeof volume === 'number' ? volume : 0.08;
        gain.gain.setValueAtTime(v, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) { /* silent */ }
}

// Public: beep на правильное / неправильное нажатие.
// Управляется display toggle 'sound'.
function playKeyBeep(correct) {
    if (!isToggleOn('sound')) return;
    if (correct) {
        playTone(880, 25, 0.05);   // короткий высокий клик
    } else {
        playTone(180, 90, 0.1);    // более длинный низкий tone (ошибка)
    }
}

// Public: тик метронома (нейтральный mid-tone).
function playMetronomeTick() {
    playTone(440, 20, 0.06);
}

// Public: запуск метронома по target_wpm.
// Управляется display toggle 'rhythm'. Internal interval автоматически
// останавливается при stopMetronome().
function startMetronome(targetWpm) {
    stopMetronome();
    if (!isToggleOn('rhythm')) return;
    if (!targetWpm || targetWpm <= 0) return;
    // Метроном тикает по символам: 1 word = 5 chars, WPM × 5 = char/min
    const charsPerMin = targetWpm * 5;
    const intervalMs = Math.max(120, Math.floor(60000 / charsPerMin));
    // Первый тик сразу
    playMetronomeTick();
    metronomeIntervalId = setInterval(playMetronomeTick, intervalMs);
}

function stopMetronome() {
    if (metronomeIntervalId) {
        clearInterval(metronomeIntervalId);
        metronomeIntervalId = null;
    }
}

// Экспорт
window.AudioFeedback = {
    playKeyBeep,
    playMetronomeTick,
    startMetronome,
    stopMetronome,
    isSoundOn: () => isToggleOn('sound'),
    isMetronomeOn: () => isToggleOn('rhythm'),
};

console.log('🔊 Audio module загружен');
