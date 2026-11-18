import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD',os.environ.get('DB_PASSWORD', '')), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

ids = [
    10268, 10950, 11617, 20141, 20270, 20290, 20194, 883, 884, 885, 886, 887, 898, 890, 892, 893,
    912, 1119, 1096, 1104, 1093, 1059, 1064, 1001, 1002, 1117, 992, 993, 985, 979, 1035, 1041,
    1077, 1085, 1114
]

format_strings = ','.join(['%s'] * len(ids))
cur.execute(f"SELECT id, front_text, part_of_speech, back_text, updated_at FROM flashcards_backup_req2_20261118_141021 WHERE id IN ({format_strings}) ORDER BY FIELD(id, {format_strings})", tuple(ids) + tuple(ids))
backup_rows = cur.fetchall()

cur.execute(f"SELECT id, front_text, part_of_speech, back_text, updated_at FROM flashcards WHERE id IN ({format_strings}) ORDER BY FIELD(id, {format_strings})", tuple(ids) + tuple(ids))
current_rows = cur.fetchall()

b_map = {r['id']: r for r in backup_rows}
c_map = {r['id']: r for r in current_rows}

print(f"{'ID':<6} | {'FRONT (BACKUP -> CURRENT)':<35} | {'POS (BACKUP -> CURRENT)':<25} | {'BACK (BACKUP -> CURRENT)'}")
print("=" * 130)

really_changed = []
pos_only_changed = []
unchanged = []

for cid in ids:
    b = b_map.get(cid, {})
    c = c_map.get(cid, {})
    
    b_front = b.get('front_text', '')
    c_front = c.get('front_text', '')
    b_pos = b.get('part_of_speech', '')
    c_pos = c.get('part_of_speech', '')
    b_back = b.get('back_text', '')
    c_back = c.get('back_text', '')
    
    front_str = f"{b_front} -> {c_front}" if b_front != c_front else b_front
    pos_str = f"{b_pos} -> {c_pos}" if b_pos != c_pos else b_pos
    back_str = f"\"{b_back}\" -> \"{c_back}\"" if b_back != c_back else f"\"{b_back}\""
    
    print(f"{cid:<6} | {front_str:<35} | {pos_str:<25} | {back_str}")
    
    is_front_diff = (b_front != c_front)
    is_pos_diff = (b_pos != c_pos)
    is_back_diff = (b_back != c_back)
    
    if is_front_diff or is_back_diff:
        really_changed.append((cid, b_front, c_front, b_pos, c_pos, b_back, c_back))
    elif is_pos_diff:
        pos_only_changed.append((cid, b_front, b_pos, c_pos, b_back))
    else:
        unchanged.append(cid)

print("\n" + "=" * 130)
print(f"Tổng số ID kiểm tra: {len(ids)}")
print(f"Số dòng THỰC SỰ thay đổi (front hoặc back): {len(really_changed)}")
print(f"Số dòng CHỈ THAY ĐỔI POS (front/back giữ nguyên): {len(pos_only_changed)}")
print(f"Số dòng HOÀN TOÀN KHÔNG ĐỔI: {len(unchanged)} -> IDs: {unchanged}")
