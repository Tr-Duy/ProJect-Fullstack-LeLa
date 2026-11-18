import os
import pymysql
import unicodedata
import csv

def normalize(text):
    if not text:
        return ''
    return unicodedata.normalize('NFC', text).lower().strip()

conn = pymysql.connect(
    host='127.0.0.1', port=3306,
    user='root', password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

# Load batch2 card ids
with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    b2_ids = set(int(r['card_id']) for r in csv.DictReader(f))

cur.execute("""
    SELECT id, deck_id, front_text, back_text
    FROM flashcards
    WHERE is_active = 1 AND deleted_at IS NULL
      AND back_text NOT LIKE '%từ vựng thuộc nhóm%'
      AND back_text NOT LIKE '%đang cập nhật%'
    ORDER BY id
""")
valid_cards = cur.fetchall()

b2_violations = []
all_valid_violations = []

for c in valid_cards:
    fn = normalize(c['front_text'])
    bk = normalize(c['back_text'])
    if fn and fn in bk:
        all_valid_violations.append(c)
        if c['id'] in b2_ids:
            b2_violations.append(c)

print(f"Total valid non-placeholder cards: {len(valid_cards)}")
print(f"Violations in Batch 2 (704 cards): {len(b2_violations)}")
print("-" * 80)
for v in b2_violations:
    print(f"Batch2: ID={v['id']:<6d} | Deck={v['deck_id']:<5d} | Front={v['front_text']:<20s} | Back={v['back_text']}")
print("-" * 80)

print(f"\nViolations in ALL valid cards (total {len(all_valid_violations)}):")
print("-" * 80)
for v in all_valid_violations:
    print(f"Valid:  ID={v['id']:<6d} | Deck={v['deck_id']:<5d} | Front={v['front_text']:<20s} | Back={v['back_text']}")
print("-" * 80)

conn.close()
