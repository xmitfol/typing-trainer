#!/usr/bin/env python3
"""JSON-валидность data/ + config/ — слой compile-checks в CI.

Прогоняет json.load по всем *.json под data/ (471 файл, из них 459 уроков)
и config/. Ловит битый JSON до того, как тяжёлые Docker/Playwright-джобы
успеют подняться. Только stdlib.

Запуск:  python scripts/ci_check_json.py
Exit 0 — все файлы парсятся; exit 1 — есть битые (каждый печатается).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCAN_DIRS = ("data", "config")


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # Windows-консоль по умолчанию cp1251
    except Exception:
        pass
    files: list[Path] = []
    for d in SCAN_DIRS:
        files.extend(sorted((ROOT / d).rglob("*.json")))
    if not files:
        print(f"JSON-файлы не найдены в {SCAN_DIRS} — неожиданно для этого репо", file=sys.stderr)
        return 1
    bad = 0
    for path in files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"FAIL {path.relative_to(ROOT)}: {e}")
            bad += 1
    print(f"Проверено JSON: {len(files)} | битых: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
