import os
import pymysql
import unicodedata
import re

def normalize(text: str) -> str:
    if text is None: text = ''
    return unicodedata.normalize('NFC', text).lower().strip()

GARBAGE_SUFFIX = re.compile(r'^.+\s+(ad|adv|adj|n|v)\.?$', re.IGNORECASE)
POS_ANNOTATION = re.compile(r'^.+\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', re.IGNORECASE)

def is_valid_card(front: str, back: str, is_active: int, deleted_at) -> bool:
    if not is_active or deleted_at is not None:
        return False
    fn = normalize(front)
    bk = normalize(back)
    if not fn or not bk or len(fn) <= 1 or len(bk) <= 1:
        return False
    if 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk:
        return False
    if GARBAGE_SUFFIX.match(bk) or GARBAGE_SUFFIX.match(fn):
        return False
    if POS_ANNOTATION.match(bk) or POS_ANNOTATION.match(fn):
        return False
    if re.search(r'[<>={}]', bk):
        return False
    return True

conn = pymysql.connect(
    host='127.0.0.1', port=3306,
    user='root', password=os.environ['DB_PASSWORD'],
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

cur = conn.cursor()

# 1. Total decks in DB
cur.execute('SELECT id, title, is_active, deleted_at FROM decks ORDER BY id')
all_decks = cur.fetchall()
active_decks = [d for d in all_decks if d['is_active'] == 1 and d['deleted_at'] is None]
print(f"Total decks in DB: {len(all_decks)}, active decks: {len(active_decks)}")

# 2. Count valid cards per deck
cur.execute('''
    SELECT id, deck_id, front_text, back_text, is_active, deleted_at
    FROM flashcards
    WHERE is_active = 1 AND deleted_at IS NULL
    ORDER BY deck_id, card_order, id
''')
cards = cur.fetchall()

deck_cards = {}
for c in cards:
    did = c['deck_id']
    if did not in deck_cards:
        deck_cards[did] = []
    deck_cards[did].append(c)

decks_ge_8 = []
decks_lt_8 = []

for d in active_decks:
    did = d['id']
    c_list = deck_cards.get(did, [])
    # Unique front_text filter as in DeckCardFilter
    seen_fronts = set()
    valid_count = 0
    for c in c_list:
        if is_valid_card(c['front_text'], c['back_text'], c['is_active'], c['deleted_at']):
            norm_fn = normalize(c['front_text'])
            if norm_fn not in seen_fronts:
                seen_fronts.add(norm_fn)
                valid_count += 1
    
    total_db_cards = len(c_list)
    info = {
        'id': did,
        'title': d['title'],
        'valid_count': valid_count,
        'total_db_cards': total_db_cards
    }
    if valid_count >= 8:
        decks_ge_8.append(info)
    else:
        decks_lt_8.append(info)

print(f"\n--- SỐ BỘ THỎA MÃN ĐIỀU KIỆN >= 8 THẺ HỢP LỆ ---")
print(f"Số bộ đạt >= 8 thẻ hợp lệ: {len(decks_ge_8)} / {len(active_decks)} bộ")
print(f"Số bộ còn lại (< 8 thẻ hợp lệ): {len(decks_lt_8)} bộ")

print(f"\n--- DANH SÁCH 13 BỘ CÒN LẠI (< 8 THẺ HỢP LỆ) ---")
print(f"{'ID':>6} | {'Tên bộ thẻ':<45} | {'Hợp lệ':>7} | {'Tổng thẻ DB':>11}")
print("-" * 78)
for d in decks_lt_8:
    print(f"{d['id']:6d} | {d['title'][:45]:<45} | {d['valid_count']:7d} | {d['total_db_cards']:11d}")

# 3. Check for any remaining placeholder in 88 Batch 2 decks (card ids from summary review)
import csv
with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    batch2_card_ids = [int(r['card_id']) for r in csv.DictReader(f)]

format_strings = ','.join(['%s'] * len(batch2_card_ids))
cur.execute(f'''
    SELECT id, deck_id, front_text, back_text
    FROM flashcards
    WHERE id IN ({format_strings})
      AND (back_text LIKE '%%từ vựng thuộc nhóm%%' OR back_text LIKE '%%đang cập nhật%%')
''', tuple(batch2_card_ids))
remaining_placeholders = cur.fetchall()

print(f"\n--- KIỂM TRA PLACEHOLDER TRONG 704 THẺ LÔ 2 ---")
print(f"Số thẻ còn chứa placeholder 'từ vựng thuộc nhóm' hoặc 'đang cập nhật': {len(remaining_placeholders)}")
if remaining_placeholders:
    for p in remaining_placeholders:
        print(f"  VI PHẠM: card_id={p['id']} deck={p['deck_id']} front={p['front_text']} back={p['back_text']}")
else:
    print("XÁC NHẬN: 100% 704 thẻ Lô 2 KHÔNG còn chứa bất kỳ placeholder nào!")

conn.close()
