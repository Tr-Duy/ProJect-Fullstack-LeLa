import os
import re
import datetime
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
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=False
)
cur = conn.cursor()

# 1. Fetch the 34 target cards
sql_target = """
SELECT id, deck_id, front_text, back_text, part_of_speech, phonetic, example_text, card_order
FROM flashcards
WHERE is_active = 1 AND deleted_at IS NULL AND front_text LIKE '%(%)%'
ORDER BY deck_id, card_order, id
"""
cur.execute(sql_target)
target_cards = cur.fetchall()
print(f"Tìm thấy {len(target_cards)} thẻ cần làm sạch hậu tố '(a.)'.")
assert len(target_cards) == 34, f"Kỳ vọng 34 thẻ, thực tế tìm thấy {len(target_cards)}"

# 2. Tạo bảng sao lưu
ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_table = f"flashcards_backup_pos_cleanup_{ts}"
print(f"Đang tạo bảng sao lưu: {backup_table} ...")
cur.execute(f"CREATE TABLE `{backup_table}` SELECT * FROM `flashcards`")
conn.commit()
print(f"✓ Đã tạo bảng sao lưu thành công: {backup_table}")

# 3. Chuẩn bị danh sách cập nhật
updates = []
for c in target_cards:
    cid = c['id']
    did = c['deck_id']
    old_front = c['front_text']
    old_pos = c['part_of_speech']

    clean_front = re.sub(r'\s*\([a-zA-Z.]+\)$', '', old_front).strip()
    clean_lower = clean_front.lower()

    if clean_lower in ('out of', 'on track', 'on hand'):
        new_pos = 'phr'
    elif clean_lower == 'constantly':
        new_pos = 'adv'
    elif clean_lower == 'catalog':
        new_pos = 'n'
    else:
        new_pos = 'adj'

    updates.append({
        'id': cid,
        'deck_id': did,
        'old_front': old_front,
        'new_front': clean_front,
        'old_pos': old_pos,
        'new_pos': new_pos
    })

# 4. Thực thi UPDATE trong transaction
try:
    for u in updates:
        cur.execute("""
            UPDATE flashcards
            SET front_text = %s, part_of_speech = %s, updated_at = NOW()
            WHERE id = %s
        """, (u['new_front'], u['new_pos'], u['id']))

    # 5. Kiểm tra không phát sinh trùng lặp cho bất kỳ thẻ nào trong 34 thẻ được cập nhật
    new_dups = []
    for u in updates:
        cur.execute("""
            SELECT id, front_text, part_of_speech
            FROM flashcards
            WHERE deck_id = %s AND id != %s AND is_active = 1 AND deleted_at IS NULL
              AND LOWER(TRIM(front_text)) = %s
        """, (u['deck_id'], u['id'], u['new_front'].lower()))
        clashes = cur.fetchall()
        if clashes:
            new_dups.append((u['id'], u['new_front'], clashes))

    if new_dups:
        raise RuntimeError(f"PHÁT SINH TRÙNG LẶP MỚI SAU KHI CẬP NHẬT: {new_dups}")
    print("✓ Xác nhận: Không phát sinh bất kỳ trùng lặp (deck_id, front_text) nào cho 34 thẻ!")

    # 6. Kiểm tra tính toàn vẹn card_progress
    card_ids_tuple = tuple(u['id'] for u in updates)
    format_strings = ','.join(['%s'] * len(card_ids_tuple))
    cur.execute(f"""
        SELECT COUNT(*) AS total_progress
        FROM card_progress
        WHERE card_id IN ({format_strings})
    """, card_ids_tuple)
    progress_count = cur.fetchone()['total_progress']
    print(f"Xác nhận card_progress liên quan đến 34 thẻ: {progress_count} bản ghi (không bị ảnh hưởng).")

    conn.commit()
    print(f"✓ Cập nhật thành công 34 thẻ vào cơ sở dữ liệu!")
except Exception as e:
    conn.rollback()
    print(f"LỖI: {e}. Đã rollback transaction!", file=os.sys.stderr)
    conn.close()
    raise

# 7. In so sánh TRƯỚC/SAU cho 10 thẻ mẫu (dán nguyên văn)
print("\n" + "=" * 115)
print(f"BẢNG SO SÁNH TRƯỚC VÀ SAU LÀM SẠCH (10 THẺ MẪU)")
print("=" * 115)
print(f"{'ID':<6} | {'Deck':<5} | {'Front CŨ (Backup)':<24} | {'Front MỚI (Hiện tại)':<22} | {'POS cũ':<7} | {'POS mới':<8}")
print("-" * 115)

cur.execute(f"""
    SELECT b.id, b.deck_id, b.front_text AS old_front, f.front_text AS new_front,
           b.part_of_speech AS old_pos, f.part_of_speech AS new_pos
    FROM `{backup_table}` b
    JOIN flashcards f ON b.id = f.id
    WHERE b.id IN ({format_strings})
    ORDER BY b.deck_id, b.card_order, b.id
    LIMIT 10
""", card_ids_tuple)

sample_10 = cur.fetchall()
for r in sample_10:
    print(f"{r['id']:<6d} | {r['deck_id']:<5d} | {r['old_front']:<24s} | {r['new_front']:<22s} | {str(r['old_pos']):<7s} | {str(r['new_pos']):<8s}")

print("=" * 115)
conn.close()
