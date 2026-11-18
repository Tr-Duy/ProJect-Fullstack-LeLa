import os
import datetime
import pymysql
import csv

pw = os.environ.get('DB_PASSWORD', '')

conn = pymysql.connect(
    host="127.0.0.1", port=3306,
    user="root", password=pw,
    database="lela_db", charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=False
)
cur = conn.cursor()

# 1. Kiểm tra giá trị hiện tại
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE id IN (10502, 10521)")
current_cards = {r['id']: r for r in cur.fetchall()}
print("Giá trị hiện tại trong DB:")
for cid, r in current_cards.items():
    print(f"  Card {cid}: front='{r['front_text']}', back='{r['back_text']}'")

# 2. Tạo bảng sao lưu
ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_table = f"flashcards_backup_loanwords_{ts}"
print(f"\nTạo bảng sao lưu: {backup_table} ...")
cur.execute(f"CREATE TABLE `{backup_table}` SELECT * FROM flashcards")
conn.commit()
print(f"✓ Sao lưu thành công: {backup_table}")

# 3. Cập nhật DB dev với điều kiện chỉ cập nhật nếu back_text vẫn là giá trị hiện tại
updates = [
    (10502, 'Thị thực nhập cảnh', 'Thị thực (visa)'),
    (10521, 'Đồ uống pha chế từ rượu và nước hoa quả', 'Đồ uống pha chế (cocktail)')
]

for cid, new_back, expected_old in updates:
    cur.execute("""
        UPDATE flashcards 
        SET back_text = %s, updated_at = NOW() 
        WHERE id = %s AND back_text = %s
    """, (new_back, cid, expected_old))
    print(f"Cập nhật card {cid}: {cur.rowcount} dòng bị ảnh hưởng (kỳ vọng 1).")
    assert cur.rowcount == 1, f"Không khớp giá trị hiện tại cho card {cid}"

conn.commit()

# Xác nhận lại giá trị sau cập nhật
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE id IN (10502, 10521)")
print("\nGiá trị trong DB sau khi UPDATE:")
for r in cur.fetchall():
    print(f"  Card {r['id']}: front='{r['front_text']}', back='{r['back_text']}'")

conn.close()

# 4. Cập nhật CSV
csv_replacements = {
    '10502': 'Thị thực nhập cảnh',
    '10521': 'Đồ uống pha chế từ rượu và nước hoa quả'
}

csv_files = [
    'private-results/card_meaning_drafts_batch2b.csv',
    'private-results/card_meaning_drafts_batch2_summary_review.csv'
]

for p in csv_files:
    with open(p, encoding='utf-8-sig', newline='') as f:
        reader = list(csv.DictReader(f))
        fn = reader[0].keys()
    
    count = 0
    for row in reader:
        cid = row['card_id']
        if cid in csv_replacements:
            row['proposed_back_text'] = csv_replacements[cid]
            count += 1
            
    with open(p, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fn)
        writer.writeheader()
        writer.writerows(reader)
    print(f"✓ Cập nhật CSV {p}: {count} dòng")
