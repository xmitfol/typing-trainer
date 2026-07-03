# Multi-stage build для typing-trainer backend.
# По TSD §6.3 — production-готовый образ на python:3.12-slim.

# ─── Stage 1: deps (cacheable layer) ───────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /build

# Installer (uv быстрее pip для CI); fallback на pip если uv недоступен.
RUN pip install --no-cache-dir uv

COPY pyproject.toml ./
# Если есть uv.lock — используем для воспроизводимости. Иначе sync без lock.
COPY uv.loc[k] ./
# Без process substitution <(...): RUN выполняется в /bin/sh (dash), где
# `<()` не поддерживается (только bash). Компилируем в файл, затем ставим.
RUN uv pip compile pyproject.toml --quiet --output-file /tmp/requirements.txt && \
    uv pip install --system --no-cache --requirement /tmp/requirements.txt

# ─── Stage 2: runtime ──────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Non-root юзер для безопасности
RUN useradd --create-home --shell /bin/bash app

# Системные зависимости (минимум)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем установленные пакеты из stage 1
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Код приложения
COPY --chown=app:app app/ ./app/
COPY --chown=app:app alembic/ ./alembic/
COPY --chown=app:app alembic.ini ./
# Гейт-скрипты (ASGI, без браузера) — гоняются внутри контейнера:
#   docker exec tt_backend python scripts/verify_admin_billing.py
# Нужны в образе для CI stack-e2e (на VM их подкладывал override/копирование).
COPY --chown=app:app scripts/ ./scripts/

# Switch на non-root
USER app

# Healthcheck — Cloud Build / Compose проверяет /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

# Стартовая команда: alembic upgrade head + gunicorn.
# Скрипт start.sh обрабатывает оба шага и migration failure.
COPY --chown=app:app scripts/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
