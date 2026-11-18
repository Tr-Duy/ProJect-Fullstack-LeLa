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

placeholders = []
real_meaning_violations = []

for c in cards:
    fn = normalize(c['front_text'])
    bk = normalize(c['back_text'])
    if fn and fn in bk:
        if 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk:
            placeholders.append(c)
        else:
            real_meaning_violations.append(c)

print(f"Tổng số thẻ đang hoạt động được quét: {len(cards)}")
print(f"Tổng số thẻ vi phạm quy tắc (back_text chứa front_text): {len(placeholders) + len(real_meaning_violations)}")
print(f"  - Số thẻ placeholder chưa được duyệt (từ V38 gốc): {len(placeholders)}")
print(f"  - Số thẻ mang nghĩa thật nhưng vi phạm (chứa front_text kể cả trong ngoặc): {len(real_meaning_violations)}")

print("\n" + "=" * 95)
print("DANH SÁCH TOÀN BỘ CÁC THẺ MANG NGHĨA THẬT VI PHẠM (BACK_TEXT CHỨA FRONT_TEXT):")
print("=" * 95)
print(f"{'ID':<6} | {'Deck':<5} | {'Front Text':<20} | {'Back Text'}")
print("-" * 95)
for v in real_meaning_violations:
    print(f"{v['id']:<6d} | {v['deck_id']:<5d} | {v['front_text']:<20s} | {v['back_text']}")
print("=" * 95)

conn.close()
