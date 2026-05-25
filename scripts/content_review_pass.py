"""
Content review pass — Катя audit of teen B3 + kids B4.

Findings:
- Teen L33 (Dates/time chat): run-on without periods, hard to parse — add periods
- Teen L35 (Twitter posts): run-on phrases, no breaks — add periods
- Teen L36 (Rhythm social feed): improved readability with light periods
- Teen L37 (Instagram captions): missing apostrophe "cant" → "can't"
- Teen L40 (40-lesson milestone): lowercase start inconsistent with other milestones — sentence case

Kids B4: reviewed, mostly solid. No edits needed.
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
    ('en_teen', 33,
     "See you at 3 today. Meet at 4:30. The show starts at 8 PM on June 15. My flight at 9:45 AM tomorrow at noon sharp."),
    ('en_teen', 35,
     "ok but why is everyone sleeping on this. anyway just dropped my new playlist — link in bio. fr fr go check it out."),
    ('en_teen', 36,
     "live laugh log on. grind never stop. monday energy hits different fr. no thoughts head empty. good vibes only. literally me."),
    ('en_teen', 37,
     "sunset vibes never get old. can't wait for summer. blessed and grateful. coffee first, talk later. #goals #mood #weekend"),
    ('en_teen', 40,
     "Forty lessons in. Your speed is double what it was on day one — that's real progress. Keep showing up; the second half is where things really click into place."),
]

for tier, num, new_text in EDITS:
    p = ROOT / 'data' / 'lessons' / tier / f'lesson_{num:02d}.json'
    if not p.exists():
        print(f'  MISSING: {p}')
        continue
    d = json.loads(p.read_text(encoding='utf-8'))
    old_text = d['text']
    old_len = d['text_length']
    pct = d['error_limit_percent']
    d['text'] = new_text
    d['text_length'] = len(new_text)
    d['error_limit'] = max(3, int(len(new_text) * pct / 100))
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'  {tier}/L{num}: {old_len}→{d["text_length"]} chars, err_limit={d["error_limit"]}')

print(f'\nApplied {len(EDITS)} content edits.')
