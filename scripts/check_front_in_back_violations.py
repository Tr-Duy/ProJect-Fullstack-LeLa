import os
import pymysql
import unicodedata

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

cur.execute("""
    SELECT id, deck_id, front_text, back_text
    FROM flashcards
    WHERE is_active = 1 AND deleted_at IS NULL
    ORDER BY id
""")
cards = cur.fetchall()

violations = []
for c in cards:
    fn = normalize(c['front_text'])
    bk = normalize(c['back_text'])
    if fn and fn in bk:
        violations.append(c)

print(f"Total active cards checked: {len(cards)}")
print(f"Total violations where back_text contains front_text: {len(violations)}")
print("-" * 90)
print(f"{'ID':<6} | {'Deck':<5} | {'Front Text':<22} | {'Back Text'}")
print("-" * 90)
for v in violations:
    print(f"{v['id']:<6d} | {v['deck_id']:<5d} | {v['front_text']:<22s} | {v['back_text']}")
print("-" * 90)

conn.close()
