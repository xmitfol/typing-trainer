#!/usr/bin/env python3
"""Линтер уроков — регрессионный гейт печатаемого текста (контент-QA).

Проверяет ТОЛЬКО автоматизируемый HIGH-слой (по чеклисту Полины): символы,
которые тренажёр реально даёт печатать, и рассинхроны метаданных. Голос
эксперта / методику / опечатки в реальных словах здесь НЕ проверяем — это
человеко-вычитка.

Что печатает юзер: поле `text` урока + `target` каждого drill-шага
(`tips[].type=='step'` / `steps[]`). Для этих строк:
  - RU-тиры (tier1, ru_kids, ru_teen, block_1): только кириллица+цифры+
    разрешённая пунктуация; латиница и типографика (— – … ₽ № • ~ | emoji) — HIGH.
  - EN-тиры (en_*): только латиница+цифры+пунктуация; кириллица — HIGH.
    Тильда/пайп (~ |) в EN легитимны (symbol-уроки).
  - двойные пробелы, ведущий/хвостовой пробел — HIGH.
  - `text` == склейка `text_sequence[].char` (если есть) — иначе рассинхрон HIGH.

Запуск:  python scripts/lint_lessons.py
Exit 0 — чисто; exit 1 — есть HIGH-находки (для CI-гейта).
"""

from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

LESSONS_DIR = Path(__file__).resolve().parent.parent / "data" / "lessons"

# RU-тиры печатают кириллицу; всё, что начинается с en_ — латиницу.
EN_PREFIX = "en_"

# Разрешённая пунктуация/символы в печатаемом (общая для RU и EN).
COMMON_PUNCT = set(" .,!?;:—-()\"'«»\n")  # дефис-минус ок; длинное тире — проверим отдельно
DIGITS = set("0123456789")
# Типографика/непечатаемое, недопустимое в печатаемом тексте. Только НЕ-ASCII
# типографские знаки — ASCII-символы клавиатуры (~ | и пр.) легитимны (символ-
# уроки типа «Математика и операторы» их печатают).
FORBIDDEN_TYPO = set("—–…₽№•©")
EMOJI_RANGES = ((0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0x2190, 0x21FF), (0xFE00, 0xFE0F))


def _is_emoji(ch: str) -> bool:
    o = ord(ch)
    return any(lo <= o <= hi for lo, hi in EMOJI_RANGES)


def _is_cyrillic(ch: str) -> bool:
    return "CYRILLIC" in unicodedata.name(ch, "")


def _is_latin(ch: str) -> bool:
    return "LATIN" in unicodedata.name(ch, "")


def _printable_targets(lesson: dict) -> list[tuple[str, str]]:
    """Строки, которые юзер реально печатает: (метка, строка)."""
    out: list[tuple[str, str]] = []
    if isinstance(lesson.get("text"), str):
        out.append(("text", lesson["text"]))
    for tp in lesson.get("tips", []) or []:
        if isinstance(tp, dict) and tp.get("type") == "step" and isinstance(tp.get("target"), str):
            out.append(("tips.step.target", tp["target"]))
    for st in lesson.get("steps", []) or []:
        if isinstance(st, dict) and isinstance(st.get("target"), str):
            out.append(("steps.target", st["target"]))
    return out


def _check_string(label: str, s: str, is_en: bool) -> list[str]:
    problems: list[str] = []
    forbidden = FORBIDDEN_TYPO
    for ch in s:
        if ch in forbidden:
            problems.append(f"{label}: недопустимый символ {ch!r}")
        elif _is_emoji(ch):
            problems.append(f"{label}: emoji {ch!r} в печатаемом")
        elif is_en and _is_cyrillic(ch):
            problems.append(f"{label}: кириллица {ch!r} в EN-тексте")
        elif (not is_en) and _is_latin(ch):
            problems.append(f"{label}: латиница {ch!r} в RU-тексте")
    if "  " in s:
        problems.append(f"{label}: двойной пробел")
    if s != s.strip("\n").strip(" ") and (s.startswith(" ") or s.endswith(" ")):
        problems.append(f"{label}: ведущий/хвостовой пробел")
    # dedupe, ограничим шум
    seen: list[str] = []
    for p in problems:
        if p not in seen:
            seen.append(p)
    return seen


def _check_sequence_sync(lesson: dict) -> list[str]:
    seq = lesson.get("text_sequence")
    text = lesson.get("text")
    if not isinstance(seq, list) or not seq or not isinstance(text, str):
        return []
    try:
        joined = "".join(str(item.get("char", "")) for item in seq if isinstance(item, dict))
    except Exception:
        return ["text_sequence: не читается"]
    if joined and joined != text:
        return ["text ≠ склейка text_sequence[].char (рассинхрон отображения и трека)"]
    return []


def main() -> int:
    # UTF-8 вывод (Windows-консоль по умолчанию cp1251 не кодирует кириллицу/≠).
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    files = sorted(LESSONS_DIR.glob("*/lesson_*.json"))
    if not files:
        print(f"Уроки не найдены в {LESSONS_DIR}", file=sys.stderr)
        return 1
    high = 0
    warn = 0
    checked = 0
    for path in files:
        tier = path.parent.name
        is_en = tier.startswith(EN_PREFIX)
        try:
            lesson = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"HIGH {tier}/{path.name}: не парсится JSON ({e})")
            high += 1
            continue
        checked += 1
        # HIGH: печатаемый текст (тренажёр реально даёт печатать эти символы).
        for label, s in _printable_targets(lesson):
            for p in _check_string(label, s, is_en):
                print(f"HIGH {tier}/{path.name}: {p}")
                high += 1
        # WARN: text_sequence — неиспользуемая тренажёром метадата; рассинхрон
        # не ломает набор, но сигналит data-quality долг (не валит гейт).
        for p in _check_sequence_sync(lesson):
            print(f"WARN {tier}/{path.name}: {p}")
            warn += 1

    print(f"\nПроверено уроков: {checked} | HIGH: {high} | WARN: {warn}")
    # Гейт падает только на HIGH (реальные дефекты печатаемого текста).
    return 1 if high else 0


if __name__ == "__main__":
    sys.exit(main())
