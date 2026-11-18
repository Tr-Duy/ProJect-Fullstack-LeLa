import os
import pymysql
from datetime import datetime

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_table = f"flashcards_backup_req5_{timestamp}"

# 1. Inspect cards before update
print("=== TRẠNG THÁI TRƯỚC KHI CẬP NHẬT ===")
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE id IN (1181, 1344, 1380, 1477) ORDER BY id")
before_rows = cur.fetchall()
for r in before_rows:
    print(f"Card {r['id']}: front='{r['front_text']}', pos='{r['part_of_speech']}', back='{r['back_text']}'")

# Check if any is placeholder or wrong
# 1181: back='Sự rút lui' -> valid (will change to 'Rút lui, rút khỏi')
# 1344: back='Sự học việc' -> valid
# 1380: back='Trên tàu' -> valid
# 1477: back='Giàu kinh nghiệm' -> valid

# 2. Count card_progress before
cur.execute("SELECT COUNT(*) AS cnt FROM card_progress")
progress_before = cur.fetchone()['cnt']
print(f"Tổng số bản ghi card_progress trước: {progress_before}")

# 3. Create backup table
print(f"\nTạo bảng sao lưu: {backup_table}...")
cur.execute(f"CREATE TABLE {backup_table} AS SELECT * FROM flashcards")
cur.execute(f"SELECT COUNT(*) AS cnt FROM {backup_table}")
backup_cnt = cur.fetchone()['cnt']
print(f"Đã sao lưu {backup_cnt} dòng vào {backup_table}")

# 4. Check duplicates for new fronts
for cid, did, new_front in [(1344, 51, 'Apprenticeship'), (1380, 53, 'Onboard'), (1477, 59, 'Experienced')]:
    cur.execute("""
        SELECT id, front_text FROM flashcards
        WHERE deck_id = %s AND LOWER(TRIM(front_text)) = %s AND id != %s AND is_active = 1 AND deleted_at IS NULL
    """, (did, new_front.lower().strip(), cid))
    dups = cur.fetchall()
    if dups:
        raise RuntimeError(f"Duplicate found for card {cid}: {dups}")
print("Kiểm tra trùng (deck_id, front_text): Hoàn toàn không phát sinh trùng lặp.")

# 5. Conditional updates
cur.execute("UPDATE flashcards SET back_text = 'Rút lui, rút khỏi' WHERE id = 1181 AND back_text = 'Sự rút lui'")
cnt_1181 = cur.rowcount

cur.execute("UPDATE flashcards SET front_text = 'Apprenticeship', part_of_speech = 'n' WHERE id = 1344 AND front_text = 'Apprenticeship n'")
cnt_1344 = cur.rowcount

cur.execute("UPDATE flashcards SET front_text = 'Onboard', part_of_speech = 'adj' WHERE id = 1380 AND front_text = 'Onboard adj'")
cnt_1380 = cur.rowcount

cur.execute("UPDATE flashcards SET front_text = 'Experienced', part_of_speech = 'adj' WHERE id = 1477 AND front_text = 'Experienced adj'")
cnt_1477 = cur.rowcount

print(f"Kết quả cập nhật 4 thẻ:")
print(f"  - Card 1181: {cnt_1181} dòng cập nhật")
print(f"  - Card 1344: {cnt_1344} dòng cập nhật")
print(f"  - Card 1380: {cnt_1380} dòng cập nhật")
print(f"  - Card 1477: {cnt_1477} dòng cập nhật")

# 6. Normalize POS: 'noun' -> 'n', 'adjective' -> 'adj'
cur.execute("UPDATE flashcards SET part_of_speech = 'n' WHERE part_of_speech = 'noun'")
cnt_noun = cur.rowcount

cur.execute("UPDATE flashcards SET part_of_speech = 'adj' WHERE part_of_speech = 'adjective'")
cnt_adj = cur.rowcount

print(f"Kết quả chuẩn hóa POS:")
print(f"  - 'noun' -> 'n': {cnt_noun} dòng cập nhật")
print(f"  - 'adjective' -> 'adj': {cnt_adj} dòng cập nhật")

conn.commit()

# 7. Check card_progress after
cur.execute("SELECT COUNT(*) AS cnt FROM card_progress")
progress_after = cur.fetchone()['cnt']
print(f"Tổng số bản ghi card_progress sau: {progress_after} (giữ nguyên: {progress_before == progress_after})")

# 8. Print after state of 4 cards
print("\n=== TRẠNG THÁI SAU KHI CẬP NHẬT ===")
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE id IN (1181, 1344, 1380, 1477) ORDER BY id")
after_rows = cur.fetchall()
for r in after_rows:
    print(f"Card {r['id']}: front='{r['front_text']}', pos='{r['part_of_speech']}', back='{r['back_text']}'")

conn.close()
