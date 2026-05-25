"""
Teen B5 review pass — Катя audit findings.

Findings (only 2 minor issues; rest of B5 is solid):
- L65: digit/word inconsistency («65 lessons» + «ten lessons» в одном абзаце)
- L75: meta-commentary «350 characters» не совпадает с фактом (344 chars) +
  narratively странно говорить юзеру «текст на 350 символов» прямо в тексте
"""
import io
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

ROOT = Path(__file__).resolve().parent.parent

# (tier, lesson_number, new_text)
EDITS = [
    # Teen B5
    ('en_teen', 65,
     "65 lessons. You can write a school essay faster than you can think it. That's a real skill. The remaining 10 lessons polish what you have, and then you'll face the final tournament-style exam at lesson 75."),
    ('en_teen', 75,
     "Seventy-five lessons ago, the keyboard was a puzzle. Today, it's an extension of your thinking. You can write essays in minutes, send messages faster than you can speak, and keep up with any deadline. This final passage is the gate — long, dense, mixed content at 95 WPM. Pass it, and the Teen Mastery certificate is yours. Type with care."),
    # Kids B5
    ('en_kids', 47,
     "a b c d e f g h i j k l m n o p q r s t u v w x y z next time won't you sing with me a b c d e f g"),
]

for tier, num, new_text in EDITS:
    p = ROOT / 'data' / 'lessons' / tier / f'lesson_{num:02d}.json'
    if not p.exists():
        print(f'  MISSING: {p}')
        continue
    d = json.loads(p.read_text(encoding='utf-8'))
    old_len = d['text_length']
    pct = d['error_limit_percent']
    d['text'] = new_text
    d['text_length'] = len(new_text)
    d['error_limit'] = max(3, int(len(new_text) * pct / 100))
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'  {tier}/L{num}: {old_len} -> {d["text_length"]} chars, err_limit={d["error_limit"]}')

print(f'\nApplied {len(EDITS)} content edits to Teen B5.')
