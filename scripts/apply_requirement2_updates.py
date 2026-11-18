import os, pymysql, json, datetime

db_pwd = os.environ.get('DB_PASSWORD', '')
conn = pymysql.connect(
    host='127.0.0.1', port=3306,
    user='root', password=db_pwd,
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

# 1. Create backup table
backup_table_name = f"flashcards_backup_req2_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
cur.execute(f"CREATE TABLE {backup_table_name} AS SELECT * FROM flashcards")
print(f"✓ Created backup table: {backup_table_name}")

# Updates definition
# Format: card_id, new_front, new_pos, new_back
updates = [
    (10268, "", "adj", "Yêu mến, thích, có cảm tình"),
    (10950, "", "adj", "Có sức thúc đẩy, mạnh mẽ"),
    (11617, "", "n", "Lợi ích, mục đích"),
    (20141, "", "", "Đĩa nhạc; tập ảnh"),
    (20270, "", "", "Gấu túi"),
    (20290, "", "", "Chuột đồng nuôi làm cảnh"),
    (20194, "", "n", "Quả kiwi"), # chuẩn hóa pos 'noun' -> 'n' cho Kiwi
    (883, "", "", "Cung cấp chỗ ở; đáp ứng được"),
    (884, "", "", "Chỗ ở, nơi lưu trú; sự thu xếp"),
    (885, "", "", "Sự sắp xếp, sự thu xếp"),
    (886, "", "", "Hiệp hội; sự liên kết"),
    (887, "", "", "Tham dự, có mặt"),
    (898, "", "", "Tham gia vào"),
    (890, "", "", "Tổ chức, tiến hành; nắm giữ"),
    (892, "", "", "Quá đông đúc, chật ních"),
    (893, "", "", "Đăng ký, ghi danh"),
    (912, "Shut down", "", "Tắt máy, ngừng hoạt động"),
    (1119, "Prompt", "adj", "Nhanh chóng, đúng giờ"),
    (1096, "Fulfillment", "n", "Sự hoàn thành, sự đáp ứng"),
    (1104, "", "", "Người gửi hàng, hãng vận chuyển"),
    (1093, "", "", "Công ty vận chuyển, đơn vị vận tải"),
    (1059, "", "", "Món hời; sự mặc cả"),
    (1064, "", "", "Thoải mái, tiện nghi, dễ chịu"),
    (1001, "", "", "Sự tự tin, lòng tin"),
    (1002, "", "", "Tự tin, tin tưởng"),
    (1117, "", "adj", "Sai, nhầm lẫn"),
    (992, "", "", "Nộp, đệ trình"),
    (993, "", "", "Sự nộp hồ sơ, bản đệ trình"),
    (985, "", "", "Tương xứng, phù hợp"),
    (979, "", "", "Dồi dào, phong phú"),
    (1035, "", "", "Linh hoạt, mềm dẻo"),
    (1041, "", "", "Được bảo đảm quyền lợi, chính thức thụ hưởng"),
    (1077, "", "", "Doanh nghiệp, công ty"),
    (1085, "", "", "Điều kiện tiên quyết, điều kiện bắt buộc"),
    (1114, "", "", "Áp đặt; đánh thuế")
]

audit_results = []

for cid, n_front, n_pos, n_back in updates:
    cur.execute("SELECT id, deck_id, front_text, part_of_speech, back_text FROM flashcards WHERE id=%s", (cid,))
    curr = cur.fetchone()
    if not curr:
        print(f"ERROR: Card {cid} not found!")
        continue

    deck_id = curr['deck_id']
    old_front = curr['front_text']
    old_pos = curr['part_of_speech']
    old_back = curr['back_text']

    eff_front = n_front.strip() if n_front.strip() else old_front
    eff_pos = n_pos.strip() if n_pos.strip() else old_pos
    eff_back = n_back.strip() if n_back.strip() else old_back

    # Kiểm tra trùng lặp front_text trong cùng deck
    if n_front.strip():
        cur.execute("""
            SELECT id, front_text FROM flashcards 
            WHERE deck_id=%s AND LOWER(TRIM(front_text))=%s AND id!=%s AND is_active=1 AND deleted_at IS NULL
        """, (deck_id, eff_front.lower().strip(), cid))
        dupe = cur.fetchone()
        if dupe:
            print(f"BLOCKED: Thay đổi front_text cho card {cid} thành '{eff_front}' tạo trùng với card {dupe['id']} trong deck {deck_id}!")
            continue

    # Execute conditional UPDATE
    sql = """
        UPDATE flashcards 
        SET front_text=%s, part_of_speech=%s, back_text=%s, updated_at=NOW()
        WHERE id=%s AND back_text=%s AND front_text=%s
    """
    cur.execute(sql, (eff_front, eff_pos, eff_back, cid, old_back, old_front))
    affected = cur.rowcount

    audit_results.append({
        'id': cid,
        'deck_id': deck_id,
        'old_front': old_front,
        'new_front': eff_front,
        'old_pos': old_pos,
        'new_pos': eff_pos,
        'old_back': old_back,
        'new_back': eff_back,
        'affected': affected
    })

conn.commit()
conn.close()

print("\n" + "=" * 120)
print(f"{'ID':<6} | {'DECK':<5} | {'FRONT (CŨ -> MỚI)':<35} | {'POS':<12} | {'BACK (CŨ -> MỚI)'}")
print("=" * 120)
for r in audit_results:
    front_str = f"{r['old_front']} -> {r['new_front']}" if r['old_front'] != r['new_front'] else r['old_front']
    pos_str = f"{r['old_pos']} -> {r['new_pos']}" if r['old_pos'] != r['new_pos'] else r['old_pos']
    back_str = f"\"{r['old_back']}\" -> \"{r['new_back']}\""
    print(f"{r['id']:<6} | {r['deck_id']:<5} | {front_str:<35} | {pos_str:<12} | {back_str}")
print("=" * 120)
print(f"Tổng số thẻ cập nhật thành công: {sum(r['affected'] for r in audit_results)} / {len(updates)}")
