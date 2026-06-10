#!/bin/bash
# Production startup script: миграции → gunicorn.
# Любой failure миграций → exit 1 (контейнер не стартует, оркестратор знает).

set -euo pipefail

echo "[start.sh] Running alembic upgrade head..."
alembic upgrade head

echo "[start.sh] Starting gunicorn (workers=${WEB_CONCURRENCY:-4})..."
exec gunicorn app.main:app \
    -w "${WEB_CONCURRENCY:-4}" \
    -k uvicorn.workers.UvicornWorker \
    --bind "0.0.0.0:${HTTP_PORT:-8000}" \
    --access-logfile - \
    --error-logfile - \
    --timeout 60
