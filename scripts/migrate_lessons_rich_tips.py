#!/usr/bin/env python3
"""
Migration: data/lessons/**/lesson_*.json — преобразование tips[] из массива
строк в массив структурированных объектов (rich tip schema).

Старый формат:
    tips: ["string", "string", ...]

Новый формат (по design lesson.jsx):
    tips: [
        {"type": "lead",  "text": "первый абзац-лид"},
        {"type": "drop",  "text": "второй абзац с drop-cap"},
        {"type": "callout", "icon": "💡", "title": "...", "text": "..."},
        {"type": "exercise", "target": "...", "finger": "blue", "hint": "..."},
        {"type": "pullquote", "text": "...", "by": "методика курса"},
        ...
    ]

Эвристика:
  - 0-й строковый tip → lead
  - 1-й → drop
  - каждый 3-й (idx 3,6,9...) → callout
  - 5-й → pullquote (если есть; редко)
  - остальные → "p"
  - После 2-го tip вставляется inline-exercise из первой половины lesson.text
  - Если text длинный (>20 chars) — добавляется второй exercise из второй половины
  - finger цвет: определяется по lesson.finger_focus / phase

Уже мигрированные (tips[0] — dict, не str) — пропускаются.

Usage:
    python scripts/migrate_lessons_rich_tips.py [--dry-run] [--tier tier1]
"""
import argparse
import io
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

ROOT = Path(__file__).resolve().parent.parent
LESSONS_ROOT = ROOT / 'data' / 'lessons'

# Эвристика finger color по finger_focus
def pick_finger(lesson: dict) -> str:
    ff = (lesson.get('finger_focus') or '').lower()
    if any(w in ff for w in ('мизин', 'pinky')):    return 'pink'
    if any(w in ff for w in ('безым', 'ring')):     return 'orange'
    if any(w in ff for w in ('средн', 'middle')):   return 'green'
    if any(w in ff for w in ('указ',  'index')):    return 'blue'
    if any(w in ff for w in ('больш', 'thumb')):    return 'purple'
    if (lesson.get('phase') or 0) >= 4:             return 'purple'
    return 'blue'


def split_exercise_text(text: str) -> list:
    """Делит lesson.text на 1-2 части по словам. Короткий (<20 chars) → 1 кусок."""
    text = (text or '').strip()
    if len(text) < 20:
        return [text] if text else []
    words = text.split(' ')
    if len(words) < 4:
        return [text]
    half = len(words) // 2
    return [' '.join(words[:half]), ' '.join(words[half:])]


def short_hint(lesson: dict) -> str:
    """Короткая подсказка под полем target в exercise."""
    ff = lesson.get('finger_focus')
    if ff and len(ff) < 60:
        return ff
    nk = lesson.get('new_keys') or []
    if nk:
        return 'Буквы: ' + ' '.join(str(k) for k in nk[:6])
    return ''


def callout_for(tip_text: str) -> dict:
    """Подбирает icon+title для callout под лексику tip'а."""
    t = (tip_text or '').lower()
    if any(w in t for w in ('не смотри', 'не торопись', 'медлен', 'осторожн')):
        return {'type': 'callout', 'icon': '🎯', 'title': 'Главный приём', 'text': tip_text}
    if any(w in t for w in ('помн', 'важн', 'обрат')):
        return {'type': 'callout', 'icon': '💡', 'title': 'Запомни', 'text': tip_text}
    if any(w in t for w in ('после', 'затем', 'когда')):
        return {'type': 'callout', 'icon': '➡️', 'title': 'Порядок', 'text': tip_text}
    return {'type': 'callout', 'icon': '💡', 'title': 'Подсказка', 'text': tip_text}


def is_legacy(tips: list) -> bool:
    """True если хотя бы один tip — строка (нужна миграция)."""
    return any(isinstance(t, str) for t in (tips or []))


def migrate_tips(lesson: dict) -> list:
    """Главная логика: на вход — старый tips, на выход — новый rich list."""
    old_tips = list(lesson.get('tips') or [])
    text = (lesson.get('text') or '').strip()
    finger = pick_finger(lesson)
    hint = short_hint(lesson)
    exercises = split_exercise_text(text)

    new_tips = []

    # Tips мапим по позиции
    for idx, tip in enumerate(old_tips):
        if not isinstance(tip, str):
            new_tips.append(tip)
            continue
        if idx == 0:
            new_tips.append({'type': 'lead', 'text': tip})
        elif idx == 1:
            new_tips.append({'type': 'drop', 'text': tip})
        elif idx > 0 and idx % 3 == 0:
            new_tips.append(callout_for(tip))
        elif idx == 5 and len(old_tips) >= 6:
            new_tips.append({'type': 'pullquote', 'text': tip, 'by': 'методика курса'})
        else:
            new_tips.append({'type': 'p', 'text': tip})

    # Вставляем inline-exercises:
    # 1-й exercise — после 2-го текстового tip (idx 1 → вставка на 2)
    # 2-й exercise — в конец, если есть второй кусок текста
    if exercises:
        insert_pos = min(2, len(new_tips))
        first_ex = {'type': 'exercise', 'target': exercises[0], 'finger': finger}
        if hint: first_ex['hint'] = hint
        new_tips.insert(insert_pos, first_ex)

    if len(exercises) > 1:
        # Второй exercise — другой пальцевый цвет для разнообразия (если возможно)
        alt_finger = {'blue': 'green', 'green': 'blue', 'orange': 'pink', 'pink': 'orange'}.get(finger, finger)
        second_ex = {'type': 'exercise', 'target': exercises[1], 'finger': alt_finger}
        if hint: second_ex['hint'] = hint
        new_tips.append(second_ex)

    return new_tips


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='Не записывать, только показать diff')
    ap.add_argument('--tier', help='Ограничиться одним tier (например tier1)')
    ap.add_argument('--limit', type=int, default=None, help='Обработать не более N файлов (для тестов)')
    ap.add_argument('--verbose', '-v', action='store_true')
    args = ap.parse_args()

    pattern = f'{args.tier}/lesson_*.json' if args.tier else '**/lesson_*.json'
    files = sorted(LESSONS_ROOT.glob(pattern))
    if args.limit:
        files = files[:args.limit]

    stats = {'migrated': 0, 'already': 0, 'errors': 0, 'no_tips': 0}
    samples = []

    for f in files:
        try:
            with f.open('r', encoding='utf-8') as fh:
                lesson = json.load(fh)
        except Exception as e:
            print(f'  ❌ {f.relative_to(ROOT)}: read error — {e}')
            stats['errors'] += 1
            continue

        tips = lesson.get('tips')
        if not tips:
            stats['no_tips'] += 1
            if args.verbose:
                print(f'  ⏭️  {f.relative_to(ROOT)}: пустые tips — пропуск')
            continue

        if not is_legacy(tips):
            stats['already'] += 1
            if args.verbose:
                print(f'  ⏭️  {f.relative_to(ROOT)}: уже мигрирован')
            continue

        new_tips = migrate_tips(lesson)
        lesson['tips'] = new_tips

        if args.dry_run:
            samples.append((f.relative_to(ROOT), len(tips), len(new_tips), new_tips))
        else:
            with f.open('w', encoding='utf-8', newline='\n') as fh:
                json.dump(lesson, fh, ensure_ascii=False, indent=2)
                fh.write('\n')

        stats['migrated'] += 1
        if args.verbose:
            ex_count = sum(1 for t in new_tips if isinstance(t, dict) and t.get('type') == 'exercise')
            print(f'  ✅ {f.relative_to(ROOT)}: {len(tips)} → {len(new_tips)} ({ex_count} exercises)')

    print()
    print('=' * 60)
    print(f'Files scanned: {len(files)}')
    print(f'  Migrated:    {stats["migrated"]}')
    print(f'  Already OK:  {stats["already"]}')
    print(f'  No tips:     {stats["no_tips"]}')
    print(f'  Errors:      {stats["errors"]}')

    if args.dry_run and samples:
        print()
        print(f'DRY-RUN: показываю первые {min(2, len(samples))} samples:')
        for path, old_n, new_n, new_tips in samples[:2]:
            print()
            print(f'--- {path} ---')
            print(f'  {old_n} string-tips → {new_n} typed-tips:')
            for t in new_tips:
                if isinstance(t, dict):
                    summary = {'type': t['type']}
                    for k in ('icon', 'title', 'finger', 'by'):
                        if k in t: summary[k] = t[k]
                    text_field = t.get('text') or t.get('target') or ''
                    if text_field: summary['text'] = (text_field[:50] + '…') if len(text_field) > 50 else text_field
                    print(f'    {summary}')

    return 0 if stats['errors'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
