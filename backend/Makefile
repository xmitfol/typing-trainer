# Backend developer commands.
# Usage: make <target>

.DEFAULT_GOAL := help
.PHONY: help install lint format type test test-cov run dev migrate migrate-create docker-up docker-down clean

PYTHON := python
UV := uv

help:
	@echo "Backend make targets:"
	@echo ""
	@echo "  install        Установить зависимости через uv (или pip)"
	@echo "  lint           Запустить ruff check"
	@echo "  format         Запустить ruff format (--check для CI)"
	@echo "  type           Запустить mypy"
	@echo "  test           Запустить pytest"
	@echo "  test-cov       Запустить pytest с coverage"
	@echo "  run            Запустить gunicorn (prod-like)"
	@echo "  dev            Запустить uvicorn в dev-режиме с reload"
	@echo "  migrate        alembic upgrade head"
	@echo "  migrate-create Создать новую миграцию (msg=...)"
	@echo "  docker-up      docker compose up (postgres + redis + adminer)"
	@echo "  docker-down    docker compose down"
	@echo "  clean          Удалить __pycache__/ и .pytest_cache/"

install:
	$(UV) sync --all-extras --dev 2>/dev/null || pip install -e ".[dev]"

lint:
	$(UV) run ruff check . 2>/dev/null || ruff check .

format:
	$(UV) run ruff format . 2>/dev/null || ruff format .

format-check:
	$(UV) run ruff format --check . 2>/dev/null || ruff format --check .

type:
	$(UV) run mypy app 2>/dev/null || mypy app

test:
	$(UV) run pytest 2>/dev/null || pytest

test-cov:
	$(UV) run pytest --cov=app --cov-report=term-missing 2>/dev/null || pytest --cov=app --cov-report=term-missing

run:
	gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	alembic upgrade head

migrate-create:
	@if [ -z "$(msg)" ]; then echo "Usage: make migrate-create msg='описание'"; exit 1; fi
	alembic revision --autogenerate -m "$(msg)"

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

# CI targets (используются в Cloud Build pipeline)
ci-lint: lint format-check type
ci-test: test
ci: ci-lint ci-test
