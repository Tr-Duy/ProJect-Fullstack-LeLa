"""
Khảo sát bộ thẻ thiếu thẻ hợp lệ. Chỉ đọc DB, không ghi.
Xuất private-results/decks_survey.csv và in report.
"""
import pymysql, re, unicodedata, csv, os
from collections import defaultdict

DB_PWD = os.environ.get('DB_PASSWORD')

def normalize(text):
    if text is None: text = ''
    text = unicodedata.normalize('NFC', text)
    return text.lower().strip()

GARBAGE_SUFFIX = re.compile(r'^.+\s+(ad|adv|adj|n|v)\.?$', re.IGNORECASE)

def invalid_reason(front_text, back_text, is_active, deleted_at):
    """Return None if valid, else return a reason string."""
    if not is_active or deleted_at is not None:
        return 'inactive_or_deleted'
    fn = normalize(front_text or '')
    bk = normalize(back_text or '')
    if not fn or not bk:
        return 'blank_field'
    if len(fn) <= 1 or len(bk) <= 1:
        return 'too_short'
    if 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk:
        return 'placeholder_text'
    if GARBAGE_SUFFIX.match(bk):
        return 'garbage_suffix_back'
    if GARBAGE_SUFFIX.match(fn):
        return 'garbage_suffix_front'
    if re.search(r'[<>={}]', bk):
        return 'special_chars_back'
    return None   # valid

def is_valid(front_text, back_text, is_active, deleted_at):
    return invalid_reason(front_text, back_text, is_active, deleted_at) is None

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db')
cur = conn.cursor(pymysql.cursors.DictCursor)

cur.execute('''
SELECT f.id as card_id, f.deck_id, d.deck_code, d.title as deck_name,
       f.front_text, f.back_text, f.part_of_speech, f.is_active, f.deleted_at
FROM flashcards f
JOIN decks d ON f.deck_id = d.id
WHERE f.deleted_at IS NULL AND f.is_active = 1
ORDER BY f.deck_id, f.id
''')
rows = cur.fetchall()
conn.close()

deck_meta = {}
deck_valid = defaultdict(list)
deck_invalid = defaultdict(list)

for r in rows:
    did = r['deck_id']
    deck_meta[did] = {'code': r['deck_code'], 'name': r['deck_name']}
    reason = invalid_reason(r['front_text'], r['back_text'], r['is_active'], r['deleted_at'])
    if reason is None:
        deck_valid[did].append(r)
    else:
        r['_reason'] = reason
        deck_invalid[did].append(r)

# Also capture decks in CSV that have 0 cards at all (not in flashcards)
# (They appear in the CSV with 0,0,0)
empty_decks = [
    {'code': 'DECK-BODY', 'name': 'Cơ thể người (Body)'},
    {'code': 'DECK-CLOTHES', 'name': 'Quần áo (Clothes)'},
    {'code': 'DECK-HOBBIES', 'name': 'Sở thích (Hobbies)'},
    {'code': 'DECK-JOBS', 'name': 'Nghề nghiệp (Jobs)'},
    {'code': 'DECK-TRANS', 'name': 'Giao thông (Transport)'},
    {'code': 'DECK-WEATHER', 'name': 'Thời tiết (Weather)'},
]

# Compile stats
below8 = []
for did in sorted(deck_meta.keys()):
    n_valid = len(deck_valid[did])
    n_invalid = len(deck_invalid[did])
    if n_valid < 8:
        gap = 8 - n_valid
        code = deck_meta[did]['code']
        name = deck_meta[did]['name']
        group = 'TOEIC' if 'TOEIC' in name or 'toeic' in code.lower() else ('Oxford' if 'Oxford' in name else 'Other')
        below8.append({'valid': n_valid, 'gap': gap, 'did': did, 'code': code, 'name': name,
                       'invalid': n_invalid, 'group': group})

below8.sort(key=lambda x: (-x['valid'], x['did']))

# --- Summary ---
print(f"=== Khảo sát bộ thẻ thiếu thẻ hợp lệ (<8) ===")
print(f"Tổng số bộ có <8 thẻ hợp lệ (trong DB, có thẻ): {len(below8)}")
print(f"  Nhóm thiếu 1-4 thẻ (valid 4-7): {sum(1 for d in below8 if 4 <= d['valid'] <= 7)}")
print(f"  Nhóm thiếu nhiều (valid 1-3):   {sum(1 for d in below8 if 1 <= d['valid'] <= 3)}")
print(f"  Nhóm 0 thẻ hợp lệ:              {sum(1 for d in below8 if d['valid'] == 0)}")
print(f"  Ngoài ra 6 bộ không có thẻ nào trong DB (DECK-BODY, CLOTHES, HOBBIES, JOBS, TRANS, WEATHER)")

by_group = defaultdict(list)
for d in below8:
    by_group[d['group']].append(d)
for grp, ds in sorted(by_group.items()):
    print(f"  [{grp}] {len(ds)} bộ, thiếu tổng {sum(d['gap'] for d in ds)} thẻ")

print(f"\nTổng số thẻ cần bổ sung (trong DB): {sum(d['gap'] for d in below8)}")

print(f"\n--- Chi tiết bộ thiếu 1-4 thẻ (valid 4-7) ---")
for d in below8:
    if 4 <= d['valid'] <= 7:
        print(f"  valid={d['valid']}, gap={d['gap']}, deck_id={d['did']}, code={d['code']}, name={d['name'][:60]}, placeholder={d['invalid']}")

print(f"\n--- 10 ví dụ thẻ placeholder (mẫu từ các bộ thiếu thẻ) ---")
shown = 0
for d in below8:
    if shown >= 10: break
    for card in deck_invalid[d['did']][:3]:
        if shown >= 10: break
        print(f"  card_id={card['card_id']} deck={d['code'][:30]} front='{card['front_text']}' back='{card['back_text']}' pos='{card['part_of_speech']}' reason={card['_reason']}")
        shown += 1

# --- Reason breakdown ---
reason_counts = defaultdict(int)
for did in deck_invalid:
    for card in deck_invalid[did]:
        reason_counts[card['_reason']] += 1
print(f"\n--- Lý do loại (tất cả bộ) ---")
for r, cnt in sorted(reason_counts.items(), key=lambda x: -x[1]):
    print(f"  {r}: {cnt} thẻ")
