"""
fix/keys-trained-metadata — data integrity fix (minimal-diff version).

Scan all lesson JSON files. If a lesson's `text` field contains capital
letters but `keys_trained` doesn't include "Shift", add it via regex
edit to preserve original formatting (avoid touching text_sequence layout).

Not user-facing — purely metadata for documentation/audit.
"""
import io
import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

ROOT = Path(__file__).resolve().parent.parent
TIERS = ['tier1', 'block_1', 'en_tier1', 'en_teen', 'en_kids']

fixed_count = 0
scanned_count = 0
fixes_by_tier = {}

# Regex для поиска и обновления "keys_trained": [...] inline-edit'ом.
# Сначала находим закрывающую ] этого массива.
# Подход: найти "keys_trained": [, потом сматчить балансом до закрывающей ].
KEYS_RE = re.compile(r'("keys_trained"\s*:\s*\[)([^\]]*)(\])', re.DOTALL)


def patch_keys_trained_text(file_text):
    """Returns (new_text, was_changed)."""
    # Parse only to read text + check Shift presence
    try:
        d = json.loads(file_text)
    except Exception:
        return file_text, False

    text = d.get('text', '')
    keys = d.get('keys_trained', []) or []

    has_capitals = any(c.isupper() and c.isalpha() for c in text)
    has_shift = 'Shift' in keys

    if not has_capitals or has_shift:
        return file_text, False

    # In-place regex edit на keys_trained — добавляем "Shift" в конец массива
    def add_shift(match):
        prefix = match.group(1)  # "keys_trained": [
        body = match.group(2)    # contents
        suffix = match.group(3)  # ]
        body_stripped = body.rstrip()
        if body_stripped.endswith(','):
            # already has trailing comma → just append
            return f'{prefix}{body_stripped} "Shift"{suffix}'
        elif body_stripped == '' or body_stripped.endswith('['):
            # empty array
            return f'{prefix}"Shift"{suffix}'
        else:
            # has content без trailing comma → add ", Shift"
            return f'{prefix}{body_stripped}, "Shift"{suffix}'

    new_text, n = KEYS_RE.subn(add_shift, file_text, count=1)
    return new_text, n > 0


for tier in TIERS:
    tier_dir = ROOT / 'data' / 'lessons' / tier
    if not tier_dir.exists():
        continue
    fixes_by_tier[tier] = []
    for lesson_file in sorted(tier_dir.glob('lesson_*.json')):
        scanned_count += 1
        original = lesson_file.read_text(encoding='utf-8')
        new_text, changed = patch_keys_trained_text(original)
        if changed:
            # Verify still valid JSON before writing
            try:
                json.loads(new_text)
            except Exception as e:
                print(f'  SKIP {lesson_file.name}: regex edit broke JSON ({e})')
                continue
            lesson_file.write_text(new_text, encoding='utf-8')
            d = json.loads(new_text)
            num = d.get('lesson_number', '?')
            fixes_by_tier[tier].append(num)
            fixed_count += 1

print(f'Scanned: {scanned_count} lessons across {len(TIERS)} tiers')
print(f'Fixed:   {fixed_count} lessons (added "Shift" to keys_trained)')
print()
for tier, nums in fixes_by_tier.items():
    if nums:
        print(f'  {tier}: L{nums}')
    else:
        print(f'  {tier}: clean (no fixes needed)')
