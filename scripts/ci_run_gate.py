#!/usr/bin/env python3
"""CI-раннер гейт-скриптов — замена vm_run_verify.py для GitHub Actions.

Прогоняет курируемые списки scripts/verify_*.py, агрегирует exit-коды и
печатает итоговую таблицу PASS/FAIL. Один упавший скрипт = exit 1 всей джобы.

Сьюты:
  --suite static — браузерные проверки против статики http://127.0.0.1:8000
                   (python -m http.server, без Docker; скрипты сидируют
                   состояние через localStorage);
  --suite stack  — проверки против single-origin стека http://localhost:8090
                   (docker compose --profile app up: nginx + backend + PG + Redis).

Исключены из CI осознанно (не добавлять без причины):
  vm_run_verify.py                      — paramiko/VM-оркестратор, его CI и заменяет;
  verify_api_client_mock.py             — сам поднимает :8000 (коллизия с нашим
                                          сервером) + FastAPI-мок на :9001;
  verify_e2e_onboarding_first_lesson.py — диагностический, всегда exit 0 — нет сигнала;
  verify_oauth_flow.py                  — завязан на `docker exec tt_postgres/tt_redis`
                                          и dev-JWT-секрет compose; кандидат в stack-сьюту
                                          отдельным осознанным шагом.

Запуск:
  python scripts/ci_run_gate.py --suite static [--shard 1/2] [--only a.py,b.py]
  BASE=http://localhost:8090 python scripts/ci_run_gate.py --suite stack

Exit 0 — все зелёные; exit 1 — есть упавшие или таймауты.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent

# 27 CI-безопасных статических проверок (Playwright + localStorage, без бэкенда).
STATIC_SUITE = [
    "verify_achievements.py",
    "verify_adaptive_phase2.py",
    "verify_all_pages_smoke.py",
    "verify_api_client.py",
    "verify_bestwpm_migration.py",
    "verify_builder.py",
    "verify_course.py",
    "verify_course_gating.py",
    "verify_dashboard.py",
    "verify_gender_override.py",
    "verify_i18n.py",
    "verify_kb_prefs.py",
    "verify_lesson_gating.py",
    "verify_lesson_inline_exercises.py",
    "verify_lesson_page.py",
    "verify_lesson_url_lock.py",
    "verify_lessons_migration.py",
    "verify_mentor_bubble.py",
    "verify_navigation_flow.py",
    "verify_onboarding_v2.py",
    "verify_polish_pack.py",
    "verify_pricing.py",
    "verify_profile.py",
    "verify_quick_wins.py",
    "verify_settings.py",
    "verify_task_keyboard.py",
    "verify_wpm_sanity.py",
]

# Проверки против живого стека :8090 (Sprint-1 auth-гейт — флагман).
STACK_SUITE = [
    "verify_signup_flow.py",
]

SUITES = {"static": STATIC_SUITE, "stack": STACK_SUITE}
DEFAULT_BASE = {"static": "http://127.0.0.1:8000", "stack": "http://localhost:8090"}


def parse_shard(spec: str, total_hint: int) -> tuple[int, int]:
    """'1/2' → (0, 2). Валидация: 1 <= k <= n."""
    try:
        k_s, n_s = spec.split("/", 1)
        k, n = int(k_s), int(n_s)
    except ValueError:
        raise SystemExit(f"--shard ожидает 'k/n', получено {spec!r}")
    if not (1 <= k <= n):
        raise SystemExit(f"--shard: нужно 1 <= k <= n, получено {spec!r}")
    if n > total_hint:
        raise SystemExit(f"--shard: n={n} больше числа скриптов ({total_hint})")
    return k - 1, n


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # Windows-консоль по умолчанию cp1251
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--suite", choices=sorted(SUITES), required=True)
    ap.add_argument("--shard", default=None, help="k/n — взять каждый n-й скрипт начиная с k-го (для матрицы)")
    ap.add_argument("--only", default=None, help="запятая-список имён скриптов (локальная отладка)")
    ap.add_argument("--timeout", type=int, default=600, help="таймаут одного скрипта, сек (default 600)")
    args = ap.parse_args()

    scripts = list(SUITES[args.suite])
    if args.only:
        wanted = {w.strip() for w in args.only.split(",") if w.strip()}
        unknown = wanted - set(scripts)
        if unknown:
            raise SystemExit(f"--only: не в сьюте {args.suite}: {sorted(unknown)}")
        scripts = [s for s in scripts if s in wanted]
    if args.shard:
        offset, step = parse_shard(args.shard, len(scripts))
        scripts = scripts[offset::step]

    env = dict(os.environ)
    env.setdefault("BASE", DEFAULT_BASE[args.suite])
    env.setdefault("PYTHONIOENCODING", "utf-8")
    env.setdefault("PYTHONUTF8", "1")
    if args.suite == "stack":
        env.setdefault("MAILPIT_URL", "http://127.0.0.1:8025")

    print(f"Сьюта {args.suite}: {len(scripts)} скриптов | BASE={env['BASE']}"
          + (f" | shard {args.shard}" if args.shard else ""))

    results: list[tuple[str, str, float]] = []  # (имя, статус, сек)
    for name in scripts:
        print(f"\n{'=' * 72}\n>>> {name}\n{'=' * 72}", flush=True)
        t0 = time.monotonic()
        try:
            proc = subprocess.run(
                [sys.executable, str(SCRIPTS_DIR / name)],
                env=env, cwd=SCRIPTS_DIR.parent, timeout=args.timeout,
            )
            status = "PASS" if proc.returncode == 0 else f"FAIL({proc.returncode})"
        except subprocess.TimeoutExpired:
            status = f"FAIL(timeout {args.timeout}s)"
        dt = time.monotonic() - t0
        results.append((name, status, dt))
        print(f"<<< {name}: {status} за {dt:.1f}s", flush=True)

    failed = [r for r in results if r[1] != "PASS"]
    print(f"\n{'=' * 72}\nИтог сьюты {args.suite}:")
    for name, status, dt in results:
        print(f"  {'✓' if status == 'PASS' else '✗'} {name:<44} {status:<20} {dt:6.1f}s")
    print(f"Всего: {len(results)} | PASS: {len(results) - len(failed)} | FAIL: {len(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
