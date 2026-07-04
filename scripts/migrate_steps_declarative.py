#!/usr/bin/env python3
"""Миграция гайдед-шагов уроков на декларативный формат unit/baseReps/keys.

Спека: docs/spec/methodology/adaptive_repetition_spec.md §5.1 — адаптивный
движок (assets/js/ai/adaptive-repetition.js) масштабирует число повторов
декларативных шагов; target СОХРАНЯЕТСЯ как fallback (backward-compat),
рантайм собирает его как Array(reps).fill(unit).join(' ') (buildTarget).

Мигрируем ТОЛЬКО периодический случай: target = unit×N (N>=2) через
одиночный пробел, unit = минимальный период по токенам. Покрывает и
одиночные группы («а а а», «кофе кофе кофе» → unit «а»/«кофе»), и
чередования из нескольких токенов («а о а о» → unit «а о», reps 2;
«фыва олдж» ×10 → unit «фыва олдж»): движок собирает target как
Array(reps).fill(unit).join(' ') — unit со внутренним пробелом даёт
байт-в-байт ту же строку. keys = уникальные буквы unit в нижнем регистре
без пробела (тот же алгоритм, что fallback stepKeys() движка; spec
предпочитает ЯВНЫЙ keys).

НЕ мигрируются:
  - непериодические target («вол вал лов лава», прогрессии «12 23 34…») —
    движок их не адаптирует и берёт legacy target как есть (§5.1
    backward-compat, так и задумано);
  - «набор слов/фраза ×2»: период k>=2 многобуквенных токенов при ровно
    двух повторах («ask sad lad fall salad flask» ×2, «маленький котик» ×2).
    Формально периодично, но адаптив умножал бы целый список слов —
    включать ли такие шаги, отдельное продуктовое решение PO; отложено.

Запись — точечная вставка полей в сырой текст (после "kind", перед "target"):
файлы уроков разноформатные (компактные однострочные шаги в lesson_01 vs
развёрнутые в остальных), полная пересериализация json.dumps(indent=2)
переформатировала бы файлы целиком. Вставка гарантирует: ни один
существующий байт (в т.ч. весь печатаемый слой text/target) не меняется.

Жёсткие самопроверки:
  - ' '.join([unit]*baseReps) == target для каждого мигрируемого шага,
    иначе шаг НЕ мигрируется (и попадает в отчёт);
  - новый файл парсится и его структура == старая + ровно добавленные поля.

Запуск:  python scripts/migrate_steps_declarative.py [--check] [tier ...]
  --check    только отчёт, без записи
  tier       каталоги data/lessons/<tier> (default: tier1)
Exit 0 — ок (пропуск непериодических шагов — норма); exit 1 — структурная
ошибка (шаги не сопоставились с сырым текстом / самопроверка файла не сошлась).
"""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS_DIR = ROOT / "data" / "lessons"

STEP_MARKER = '"type": "step"'


def keys_for_unit(unit: str) -> list[str]:
    """Уникальные буквы unit в нижнем регистре, без пробела, в порядке появления.

    Идентично fallback stepKeys() в adaptive-repetition.js (JS-объект хранит
    строковые ключи в порядке вставки → порядок первого вхождения).
    """
    out: list[str] = []
    for ch in unit:
        c = ch.lower()
        if c != " " and c not in out:
            out.append(c)
    return out


def decompose(target: str) -> tuple[str, int] | str:
    """target → (unit, baseReps) либо строка-причина, почему шаг не мигрируем.

    unit = минимальный период по токенам (k=1 — одиночная группа,
    k>=2 — чередование «а о» / «фыва олдж» с пробелом внутри unit).
    Исключение (продуктовое, решение PO отложено): k>=2 многобуквенных
    токенов при ровно двух повторах — это «набор слов ×2», а не дрилл-
    чередование; адаптив умножал бы целый список слов.
    """
    groups = target.split(" ")
    if "" in groups:
        return "двойной/ведущий/хвостовой пробел в target"
    if len(groups) < 2:
        return "одна группа (N<2) — нечего масштабировать"
    m = len(groups)
    for k in range(1, m // 2 + 1):
        if m % k:
            continue
        if all(groups[i] == groups[i % k] for i in range(m)):
            reps = m // k
            if k > 1 and reps == 2 and any(len(g) > 1 for g in groups[:k]):
                preview = " ".join(groups[:k])
                return f"набор слов/фраза ×2 — отложено решением PO: «{preview}» ×2"
            return " ".join(groups[:k]), reps
    preview = " ".join(groups[:4]) + ("…" if len(groups) > 4 else "")
    return f"группы не периодичны (не unit×N): «{preview}»"


def find_step_spans(raw: str) -> list[tuple[int, int, dict]]:
    """Найти span'ы всех step-объектов в сыром тексте: [(start, end, obj)].

    Ищем маркер '"type": "step"', откатываемся к ближайшей '{' слева и парсим
    объект raw_decode'ом. Валидность сопоставления (порядок и равенство с
    tips[]) проверяет вызывающий код — рассинхрон означает структурную ошибку.
    """
    dec = json.JSONDecoder()
    spans: list[tuple[int, int, dict]] = []
    idx = 0
    while True:
        m = raw.find(STEP_MARKER, idx)
        if m == -1:
            break
        start = raw.rfind("{", 0, m)
        if start == -1:
            raise ValueError(f"маркер шага на смещении {m} без открывающей '{{'")
        obj, end = dec.raw_decode(raw, start)
        spans.append((start, end, obj))
        idx = end
    return spans


def build_insert(raw: str, span_start: int, tpos: int, fields: list[tuple[str, object]]) -> tuple[int, str]:
    """Построить (позиция, текст) вставки полей перед "target" в стиле файла.

    Компактный шаг (target не первый на строке) → инлайн '"k": v, ...';
    развёрнутый (target начинает строку) → по строке на поле с тем же отступом.
    """
    pairs = [f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in fields]
    line_start = raw.rfind("\n", 0, tpos) + 1
    prefix = raw[line_start:tpos]
    if prefix.strip() == "":
        # Развёрнутый стиль: "target" начинает строку, prefix = отступ.
        nl = "\r\n" if "\r\n" in raw else "\n"
        return line_start, "".join(f"{prefix}{p},{nl}" for p in pairs)
    return tpos, "".join(f"{p}, " for p in pairs)


def process_file(path: Path, check_only: bool, report: dict) -> bool:
    """Обработать один файл урока. False → структурная ошибка (в report)."""
    rel = path.relative_to(ROOT)
    with open(path, encoding="utf-8", newline="") as f:
        raw = f.read()
    data = json.loads(raw)
    tips = data.get("tips") or []
    steps = [(i, t) for i, t in enumerate(tips)
             if isinstance(t, dict) and t.get("type") == "step"]
    if not steps:
        return True
    report["steps_total"] += len(steps)

    spans = find_step_spans(raw)
    if len(spans) != len(steps) or any(obj != t for (_, _, obj), (_, t) in zip(spans, steps)):
        report["errors"].append(f"{rel}: step-объекты в сыром тексте не сопоставились с tips[] "
                                f"(spans={len(spans)}, steps={len(steps)}) — файл пропущен")
        return False

    edits: list[tuple[int, str]] = []   # (позиция, вставляемый текст)
    migrated_idx: list[tuple[int, str, int, list[str]]] = []  # (tips-индекс, unit, reps, keys)
    for (start, end, _obj), (i, step) in zip(spans, steps):
        label = f"{rel} tips[{i}] «{step.get('title') or step.get('hint', '')[:40]}»"
        if "unit" in step:
            report["already"] += 1
            continue
        target = step.get("target")
        if not isinstance(target, str) or not target:
            report["skipped"].append((label, "нет строкового target"))
            continue
        got = decompose(target)
        if isinstance(got, str):
            report["skipped"].append((label, got))
            continue
        unit, reps = got
        # Жёсткая самопроверка: рантайм-сборка buildTarget(unit, reps) обязана
        # дать байт-в-байт исходный target, иначе fallback и адаптив разойдутся.
        if " ".join([unit] * reps) != target:
            report["skipped"].append((label, "самопроверка unit×reps != target"))
            continue
        fields: list[tuple[str, object]] = []
        if "kind" not in step:
            fields.append(("kind", "drill"))   # как в эталоне lesson_01
        fields.extend([("unit", unit), ("baseReps", reps), ("keys", keys_for_unit(unit))])
        tpos = raw.find('"target"', start, end)
        edits.append(build_insert(raw, start, tpos, fields))
        migrated_idx.append((i, unit, reps, keys_for_unit(unit)))

    if not migrated_idx:
        return True

    new_raw = raw
    for pos, text in sorted(edits, key=lambda e: e[0], reverse=True):
        new_raw = new_raw[:pos] + text + new_raw[pos:]

    # Самопроверка файла: парсится и равен старой структуре + ровно новые поля.
    expected = copy.deepcopy(data)
    for i, unit, reps, keys in migrated_idx:
        st = expected["tips"][i]
        st.setdefault("kind", "drill")
        st["unit"], st["baseReps"], st["keys"] = unit, reps, keys
    try:
        new_data = json.loads(new_raw)
    except Exception as e:
        report["errors"].append(f"{rel}: результат вставки не парсится ({e}) — файл не записан")
        return False
    if new_data != expected:
        report["errors"].append(f"{rel}: структура после вставки != ожидаемой — файл не записан")
        return False
    # Печатаемый слой: text и все target неизменны (следует из равенства выше,
    # но проверяем явно — это контракт миграции).
    assert new_data.get("text") == data.get("text")
    assert all(nt.get("target") == ot.get("target")
               for nt, ot in zip(new_data["tips"], tips) if isinstance(ot, dict))

    report["migrated"] += len(migrated_idx)
    report["files_changed"].append(str(rel))
    if not check_only:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(new_raw)
    return True


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    check_only = "--check" in sys.argv
    tiers = [a for a in sys.argv[1:] if not a.startswith("--")] or ["tier1"]

    report = {"steps_total": 0, "migrated": 0, "already": 0,
              "skipped": [], "errors": [], "files_changed": []}
    for tier in tiers:
        tier_dir = LESSONS_DIR / tier
        files = sorted(tier_dir.glob("lesson_*.json"))
        if not files:
            print(f"Нет уроков в {tier_dir}", file=sys.stderr)
            return 1
        for path in files:
            process_file(path, check_only, report)

    mode = "[check, без записи] " if check_only else ""
    print(f"{mode}Шагов всего: {report['steps_total']} | мигрировано: {report['migrated']} "
          f"| уже декларативных: {report['already']} | пропущено: {len(report['skipped'])} "
          f"| файлов изменено: {len(report['files_changed'])}")
    if report["skipped"]:
        print("\nПропущенные шаги (остаются legacy target — движок их не адаптирует):")
        for label, reason in report["skipped"]:
            print(f"  {label}: {reason}")
    if report["errors"]:
        print("\nСТРУКТУРНЫЕ ОШИБКИ:")
        for e in report["errors"]:
            print(f"  {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
