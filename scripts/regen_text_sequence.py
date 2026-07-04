#!/usr/bin/env python3
"""Регенерация text_sequence из канонического text (data-гигиена block_1).

text — печатаемый слой, истина (его гейтит lint_lessons.py). text_sequence —
производная метадата (char/hand/finger/key/space_side); тренажёр её НЕ читает
(правило пробела захардкожено в task.js spaceSideFor), но рассинхрон сигналит
WARN линтера и вводит в заблуждение при чтении данных.

Канон метадаты — постановка ЙЦУКЕН (совпадает с task.js CHAR_FINGER +
LEFT_HAND/RIGHT_HAND). Метадате соседних уроков доверять нельзя: в части
block_1-файлов руки исторически перепутаны (см. PR #47).

Правило space_side: рука, противоположная предыдущему символу (в существующих
данных выполняется 207/207); для пробела в начале текста — right.

Запуск:  python scripts/regen_text_sequence.py [--check] [--force] [файлы...]
  --check      только проверить, exit 1 при рассинхроне (для отладки)
  --force      структурное сравнение build_sequence(text) != text_sequence
               вместо склейки char — ловит перепутанные руки/пальцы/space_side
               при синхронном char-слое (болезнь block_1). Только с явным
               списком файлов, где FINGER_MAP покрывает все символы: на
               tier1/ru_teen (цифры/пунктуация вне канона) упадёт SystemExit.
  без файлов   все data/lessons/*/lesson_*.json, у которых есть text_sequence
Перезаписывает text_sequence только в файлах с фактическим рассинхроном.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS_DIR = ROOT / "data" / "lessons"

# Постановка ЙЦУКЕН: символ → (hand, finger). Идентична логике тренажёра
# (task.js CHAR_FINGER: pink=pinky, orange=ring, green=middle, blue/indigo=index).
FINGER_MAP: dict[str, tuple[str, str]] = {}
for ch in "йфяё":
    FINGER_MAP[ch] = ("left", "pinky")
for ch in "цыч":
    FINGER_MAP[ch] = ("left", "ring")
for ch in "увс":
    FINGER_MAP[ch] = ("left", "middle")
for ch in "камепи":
    FINGER_MAP[ch] = ("left", "index")
for ch in "нртгоь":
    FINGER_MAP[ch] = ("right", "index")
for ch in "шлб":
    FINGER_MAP[ch] = ("right", "middle")
for ch in "щдю":
    FINGER_MAP[ch] = ("right", "ring")
for ch in "зжхэъ":
    FINGER_MAP[ch] = ("right", "pinky")


def build_sequence(text: str) -> list[dict]:
    seq: list[dict] = []
    prev_hand = None
    for ch in text:
        if ch == " ":
            side = "left" if prev_hand == "right" else "right"
            seq.append({"char": " ", "hand": side, "finger": "thumb",
                        "key": "Space", "space_side": side})
            # prev_hand не меняем: side следующего пробела определяет буква
            continue
        low = ch.lower()
        if low not in FINGER_MAP:
            raise SystemExit(f"нет канона для символа {ch!r} — дополни FINGER_MAP")
        hand, finger = FINGER_MAP[low]
        seq.append({"char": ch, "hand": hand, "finger": finger, "key": ch.upper()})
        prev_hand = hand
    return seq


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_only = "--check" in sys.argv
    force = "--force" in sys.argv
    # resolve() — иначе относительные пути из аргументов роняют relative_to(ROOT)
    files = [Path(a).resolve() for a in args] if args else sorted(LESSONS_DIR.glob("*/lesson_*.json"))
    desynced = 0
    for path in files:
        # newline='' — иначе read_text нормализует \r\n в \n и CRLF-детект слепнет
        with open(path, encoding="utf-8", newline="") as f:
            raw = f.read()
        data = json.loads(raw)
        seq = data.get("text_sequence")
        text = data.get("text")
        if not isinstance(seq, list) or not seq or not isinstance(text, str):
            continue
        if force:
            # Полный канон, а не только char-слой: руки/пальцы/space_side.
            if seq == build_sequence(text):
                continue
        else:
            joined = "".join(str(i.get("char", "")) for i in seq if isinstance(i, dict))
            if joined == text:
                continue
        desynced += 1
        rel = path.relative_to(ROOT)
        if check_only:
            print(f"РАССИНХРОН {rel}")
            continue
        data["text_sequence"] = build_sequence(text)
        # Сохраняем стиль файла: indent=2 как в block_1; перевод строки — как в исходнике.
        nl = "\r\n" if "\r\n" in raw else "\n"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8", newline=nl)
        print(f"перегенерирован {rel} ({len(data['text_sequence'])} элементов)")
    print(f"Рассинхронов: {desynced}")
    return 1 if (check_only and desynced) else 0


if __name__ == "__main__":
    sys.exit(main())
