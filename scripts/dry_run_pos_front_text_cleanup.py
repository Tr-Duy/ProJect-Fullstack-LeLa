"""
scripts/dry_run_pos_front_text_cleanup.py
-----------------------------------------
Script Dry-run kiểm tra và đề xuất làm sạch 34 thẻ có chứa chú thích loại từ '(a.)' trong front_text.
KHÔNG ghi hay sửa đổi cơ sở dữ liệu.
"""

import os
import re
import pymysql

pw = os.environ.get("DB_PASSWORD")
if not pw:
    raise RuntimeError("Missing required environment variable DB_PASSWORD")

conn = pymysql.connect(
    host="127.0.0.1",
    port=3306,
    user="root",
    password=pw,
    database="lela_db",
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor
)

cur = conn.cursor()

# 1. Truy vấn 34 thẻ chứa chú thích loại từ trong front_text
sql_34 = """
SELECT id, deck_id, front_text, back_text, part_of_speech, phonetic, example_text, card_order
FROM flashcards
WHERE is_active = 1 AND deleted_at IS NULL AND front_text LIKE '%(%)%'
ORDER BY deck_id, card_order, id
"""
cur.execute(sql_34)
cards = cur.fetchall()

print(f"Tổng số thẻ phát hiện có chứa chú thích loại từ: {len(cards)}")
print("=" * 110)
print(f"{'ID':<6} | {'Deck':<5} | {'Front cũ':<22} | {'Front sạch đề xuất':<20} | {'POS cũ':<6} | {'POS mới':<8} | {'Trùng bộ?'}")
print("=" * 110)

proposals = []

for c in cards:
    cid = c['id']
    did = c['deck_id']
    front_old = c['front_text']
    pos_old = c['part_of_speech']

    # Làm sạch: bỏ phần ' (a.)' hoặc '(...)'' ở cuối
    front_clean = re.sub(r'\s*\([a-zA-Z.]+\)$', '', front_old).strip()

    # Xác định loại từ phù hợp
    clean_lower = front_clean.lower()
    if clean_lower in ('out of', 'on track', 'on hand'):
        pos_proposed = 'phr'
    elif clean_lower == 'constantly':
        pos_proposed = 'adv'
    elif clean_lower == 'catalog':
        pos_proposed = 'n'  # hoặc v, trong ngữ cảnh catalog là danh từ/động từ
    else:
        pos_proposed = 'adj'

    # Kiểm tra xem nếu làm sạch thì có bị trùng với thẻ nào khác trong cùng bộ không
    cur.execute("""
        SELECT id, front_text 
        FROM flashcards 
        WHERE deck_id = %s AND id != %s AND is_active = 1 AND deleted_at IS NULL
          AND LOWER(TRIM(front_text)) = %s
    """, (did, cid, clean_lower))
    dups = cur.fetchall()
    dup_str = f"TRÙNG với ID {dups[0]['id']}" if dups else "KHÔNG TRÙNG (An toàn)"

    proposals.append({
        'id': cid,
        'deck_id': did,
        'front_old': front_old,
        'front_clean': front_clean,
        'pos_old': pos_old,
        'pos_proposed': pos_proposed,
        'dup_status': dup_str
    })

    print(f"{cid:<6} | {did:<5} | {front_old:<22} | {front_clean:<20} | {pos_old:<6} | {pos_proposed:<8} | {dup_str}")

print("=" * 110)

# Tổng kết va chạm
total_dups = sum(1 for p in proposals if "TRÙNG với" in p['dup_status'])
print(f"Tổng số thẻ: {len(proposals)}")
print(f"Số thẻ an toàn 100% không trùng lặp khi làm sạch: {len(proposals) - total_dups}")
print(f"Số thẻ có nguy cơ trùng lặp: {total_dups}")

conn.close()
