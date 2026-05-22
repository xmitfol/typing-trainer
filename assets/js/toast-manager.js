/**
 * Toast Manager — singleton-уведомления персонажа.
 * API ожидается character-system.js: window.toastManager.show(message, emoji, duration).
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.activeToasts = new Set();
        this.ensureContainer();
    }

    ensureContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    show(message, emoji = '💬', duration = 3500, options = {}) {
        if (!message) return null;

        const toast = document.createElement('div');
        toast.className = `toast ${options.type || 'info'}`;

        const iconEl = document.createElement('div');
        iconEl.className = 'toast-icon';
        iconEl.textContent = emoji;

        const content = document.createElement('div');
        content.className = 'toast-content';

        if (options.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast-title';
            titleEl.textContent = options.title;
            content.appendChild(titleEl);
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Закрыть');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        progress.style.width = '100%';

        toast.append(iconEl, content, closeBtn, progress);
        this.container.appendChild(toast);
        this.activeToasts.add(toast);

        // Запускаем slide-in на следующем кадре
        requestAnimationFrame(() => {
            toast.classList.add('show');
            // Прогресс-бар стартует одновременно с toast.show
            requestAnimationFrame(() => {
                progress.style.transition = `width ${duration}ms linear`;
                progress.style.width = '0%';
            });
        });

        const timer = setTimeout(() => this.dismiss(toast), duration);
        toast._dismissTimer = timer;

        return toast;
    }

    dismiss(toast) {
        if (!toast || !this.activeToasts.has(toast)) return;

        clearTimeout(toast._dismissTimer);
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            toast.remove();
            this.activeToasts.delete(toast);
        }, 250);
    }

    dismissAll() {
        this.activeToasts.forEach(t => this.dismiss(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.toastManager = new ToastManager();
});

window.ToastManager = ToastManager;
