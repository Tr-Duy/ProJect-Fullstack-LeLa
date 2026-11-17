"""
test_apply_script_isolated.py
-----------------------------
Kiểm chứng tự động tất cả các điểm an toàn của script apply_card_meaning_drafts.py
trên một schema tạm biệt lập (lela_test_apply_db).

Nội dung kiểm chứng:
Phần A: Chế độ UPDATE (Cập nhật nghĩa thẻ có sẵn)
  1. Bảng sao lưu được tạo đúng số dòng.
  2. Chỉ các thẻ approved=Y bị đổi, thẻ approved='' không bị đổi.
  3. Thẻ đã được sửa trước đó (đã hợp lệ) không bị đè.
  4. Chạy lại lần hai không đổi gì (idempotent).
  5. Lỗi giữa chừng thì rollback đúng (mô phỏng lỗi trong transaction).

Phần B: Chế độ INSERT (Thêm thẻ mới cho bộ gần ngưỡng)
  6. Chỉ các thẻ mới approved=Y được thêm, approved='' bị bỏ qua.
  7. Thẻ mới được gán card_order tiếp nối, created_by, is_active=1, version=1, phonetic, example_text.
  8. Idempotent: chạy lại lần hai không chèn thẻ trùng lặp (dựa vào deck_id + front_text).
  9. Rollback khi gặp lỗi trong quá trình INSERT (không sinh thẻ rác nửa vời).
"""
import os, sys, csv, pymysql, subprocess

DB_PWD = os.environ.get('DB_PASSWORD')
TEST_DB = 'lela_test_apply_db'

def run():
    print("=================================================================")
    print("KIỂM CHỨNG TOÀN DIỆN SCRIPT NHẬP TRÊN SCHEMA BIỆT LẬP")
    print("=================================================================")

    # 1. Kết nối và tạo schema tạm
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, autocommit=True)
    cur = conn.cursor(pymysql.cursors.DictCursor)

    cur.execute(f"DROP DATABASE IF EXISTS `{TEST_DB}`")
    cur.execute(f"CREATE DATABASE `{TEST_DB}` CHARACTER SET utf8mb4")
    print(f"[OK] Đã tạo database tạm: `{TEST_DB}`")

    # Clone cấu trúc và dữ liệu mẫu flashcards & decks
    cur.execute(f"CREATE TABLE `{TEST_DB}`.flashcards LIKE `lela_db`.flashcards")
    cur.execute(f"CREATE TABLE `{TEST_DB}`.decks LIKE `lela_db`.decks")

    # Copy các thẻ mẫu: 10016, 10017 (deck 1001), 10159, 10169 (deck 1010) và deck 8 (5 thẻ mẫu)
    cur.execute(f"""
        INSERT INTO `{TEST_DB}`.flashcards
        SELECT * FROM `lela_db`.flashcards
        WHERE id IN (10016, 10017, 10159, 10169, 21, 22, 23, 24, 25)
    """)
    cur.execute(f"""
        INSERT INTO `{TEST_DB}`.decks
        SELECT * FROM `lela_db`.decks
        WHERE id IN (1001, 1010, 8)
    """)
    cur.execute(f"SELECT count(*) as cnt FROM `{TEST_DB}`.flashcards")
    initial_count = cur.fetchone()['cnt']
    print(f"[OK] Đã nạp {initial_count} thẻ mẫu vào `{TEST_DB}`.flashcards")

    # Đảm bảo 10016, 10017 và 10159 là placeholder trong DB tạm để kiểm chứng UPDATE
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm consultant (danh từ)' WHERE id=10016")
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm convenience (danh từ)' WHERE id=10017")
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm awareness (danh từ)' WHERE id=10159")

    # =============================================================
    # PHẦN A: KIỂM CHỨNG UPDATE
    # =============================================================
    print("\n=============================================================")
    print("PHẦN A: KIỂM CHỨNG CHẾ ĐỘ UPDATE")
    print("=============================================================")
    test_csv_1 = 'private-results/_test_verify_apply_1.csv'
    with open(test_csv_1, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
            'proposed_back_text','proposed_part_of_speech','confidence','note','approved'
        ])
        w.writeheader()
        w.writerow({
            'card_id': 10016, 'deck_id': 1001, 'deck_name': 'Test Deck 1001',
            'front_text': 'consultant', 'current_back_text': 'placeholder', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Nhà tư vấn test', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'test 1', 'approved': 'Y'
        })
        w.writerow({
            'card_id': 10017, 'deck_id': 1001, 'deck_name': 'Test Deck 1001',
            'front_text': 'convenience', 'current_back_text': 'placeholder', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Sự tiện lợi test', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'test 2', 'approved': '' # KHÔNG DUYỆT
        })
        w.writerow({
            'card_id': 10159, 'deck_id': 1010, 'deck_name': 'Test Deck 1010',
            'front_text': 'awareness', 'current_back_text': 'placeholder', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Nhận thức test', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'test 3', 'approved': 'Y'
        })

    # Test 1 & 2: Chạy lần 1 với test_csv_1
    cmd = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_1, '--apply', '--database', TEST_DB
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    assert res.returncode == 0, f"Process failed: {res.stderr}"

    # Kiểm tra Điểm 1: Bảng sao lưu được tạo và đúng số dòng
    cur.execute(f"SHOW TABLES FROM `{TEST_DB}` LIKE 'flashcards_backup_%'")
    backup_tables = cur.fetchall()
    assert len(backup_tables) >= 1, "Không tìm thấy bảng sao lưu!"
    backup_table_name = list(backup_tables[0].values())[0]
    cur.execute(f"SELECT count(*) as cnt FROM `{TEST_DB}`.`{backup_table_name}`")
    backup_count = cur.fetchone()['cnt']
    print(f"[XÁC NHẬN ĐIỂM 1] Bảng sao lưu `{backup_table_name}` có {backup_count} dòng: ĐẠT")
    assert backup_count == initial_count

    # Kiểm tra Điểm 2: Chỉ các thẻ approved=Y bị đổi
    cur.execute(f"SELECT id, back_text FROM `{TEST_DB}`.flashcards WHERE id IN (10016, 10017, 10159)")
    rows_by_id = {r['id']: r['back_text'] for r in cur.fetchall()}
    assert rows_by_id[10016] == 'Nhà tư vấn test', f"10016 sai: {rows_by_id[10016]}"
    assert rows_by_id[10159] == 'Nhận thức test', f"10159 sai: {rows_by_id[10159]}"
    assert 'từ vựng thuộc nhóm' in rows_by_id[10017] or 'placeholder' in rows_by_id[10017], f"10017 bị đổi sai: {rows_by_id[10017]}"
    print(f"[XÁC NHẬN ĐIỂM 2] Thẻ 10016 (Y) và 10159 (Y) đã cập nhật; thẻ 10017 (trống) giữ nguyên: ĐẠT")

    # Test 3: Idempotent - Chạy lại lần hai với cùng CSV
    res2 = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    assert "Sẽ CẬP NHẬT (UPDATE): 0 thẻ" in res2.stdout, "Lần 2 phải cập nhật 0 thẻ!"
    print("[XÁC NHẬN ĐIỂM 3] Chạy lại lần hai: 0 thẻ cập nhật, bỏ qua vì đã hợp lệ (Idempotent): ĐẠT")

    # Test 4: Thẻ đã được người khác sửa trước đó không bị đè
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='Tiền gửi cố định đã sửa' WHERE id=10169")
    test_csv_overwrite = 'private-results/_test_verify_overwrite.csv'
    with open(test_csv_overwrite, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
            'proposed_back_text','proposed_part_of_speech','confidence','note','approved'
        ])
        w.writeheader()
        w.writerow({
            'card_id': 10169, 'deck_id': 1010, 'deck_name': 'Test Deck 1010',
            'front_text': 'deposit', 'current_back_text': 'từ vựng cũ', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Nghĩa đè mạo danh', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'cố ý đè', 'approved': 'Y'
        })
    cmd_overwrite = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_overwrite, '--apply', '--database', TEST_DB
    ]
    res_ow = subprocess.run(cmd_overwrite, capture_output=True, text=True, encoding='utf-8')
    cur.execute(f"SELECT back_text FROM `{TEST_DB}`.flashcards WHERE id=10169")
    cur_back = cur.fetchone()['back_text']
    assert cur_back == 'Tiền gửi cố định đã sửa', f"Thẻ bị đè sai: {cur_back}"
    print(f"[XÁC NHẬN ĐIỂM 4] Thẻ 10169 giữ nguyên 'Tiền gửi cố định đã sửa', không bị đè: ĐẠT")

    # Test 5: Mô phỏng lỗi giữa transaction -> Rollback hoàn toàn
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm convenience (danh từ)' WHERE id=10017")
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm deposit (danh từ)' WHERE id=10169")
    cur.execute(f"""
        CREATE TRIGGER `{TEST_DB}`.fail_on_specific_id
        BEFORE UPDATE ON `{TEST_DB}`.flashcards
        FOR EACH ROW
        BEGIN
            IF NEW.id = 10169 AND NEW.back_text LIKE '%Tiền gửi ngân hàng test%' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cố tình ném lỗi mô phỏng thất bại giữa transaction';
            END IF;
        END
    """)
    test_csv_fail = 'private-results/_test_verify_fail.csv'
    with open(test_csv_fail, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
            'proposed_back_text','proposed_part_of_speech','confidence','note','approved'
        ])
        w.writeheader()
        w.writerow({
            'card_id': 10017, 'deck_id': 1001, 'deck_name': 'Test Deck 1001',
            'front_text': 'convenience', 'current_back_text': 'placeholder', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Sự thuận tiện rollback test', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'test rollback 1', 'approved': 'Y'
        })
        w.writerow({
            'card_id': 10169, 'deck_id': 1010, 'deck_name': 'Test Deck 1010',
            'front_text': 'deposit', 'current_back_text': 'placeholder', 'current_part_of_speech': 'n',
            'proposed_back_text': 'Tiền gửi ngân hàng test', 'proposed_part_of_speech': 'n',
            'confidence': 'HIGH', 'note': 'test rollback 2', 'approved': 'Y'
        })
    cmd_fail = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_fail, '--apply', '--database', TEST_DB
    ]
    res_fail = subprocess.run(cmd_fail, capture_output=True, text=True, encoding='utf-8')
    assert "Đã rollback" in res_fail.stderr or "Đã rollback" in res_fail.stdout
    cur.execute(f"SELECT back_text FROM `{TEST_DB}`.flashcards WHERE id=10017")
    back_10017_after_rollback = cur.fetchone()['back_text']
    assert back_10017_after_rollback == 'từ vựng thuộc nhóm convenience (danh từ)'
    cur.execute(f"DROP TRIGGER `{TEST_DB}`.fail_on_specific_id")
    print(f"[XÁC NHẬN ĐIỂM 5] Thẻ 10017 rollback nguyên vẹn khi thẻ khác lỗi giữa transaction: ĐẠT")

    # =============================================================
    # PHẦN B: KIỂM CHỨNG INSERT
    # =============================================================
    print("\n=============================================================")
    print("PHẦN B: KIỂM CHỨNG CHẾ ĐỘ INSERT (NEW_*)")
    print("=============================================================")
    # Deck 8 ban đầu có 5 thẻ: One, Two, Three, Four, Five (card_order 1..5, created_by=2)
    cur.execute(f"SELECT count(*) as cnt, max(card_order) as max_ord FROM `{TEST_DB}`.flashcards WHERE deck_id=8")
    d8_info = cur.fetchone()
    assert d8_info['cnt'] == 5 and d8_info['max_ord'] == 5, f"Deck 8 setup sai: {d8_info}"

    test_csv_insert = 'private-results/_test_verify_insert.csv'
    with open(test_csv_insert, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
            'proposed_back_text','proposed_part_of_speech','phonetic','example_text','confidence','note','approved'
        ])
        w.writeheader()
        # Dòng 1: Six, approved=Y -> SẼ CHÈN (card_order = 6)
        w.writerow({
            'card_id': 'NEW_8_1', 'deck_id': 8, 'deck_name': 'Số đếm',
            'front_text': 'Six', 'current_back_text': '', 'current_part_of_speech': '',
            'proposed_back_text': 'Số sáu', 'proposed_part_of_speech': 'n',
            'phonetic': '/sɪks/', 'example_text': 'Six eggs.',
            'confidence': 'HIGH', 'note': 'insert test 1', 'approved': 'Y'
        })
        # Dòng 2: Seven, approved='' -> BỎ QUA (chưa duyệt)
        w.writerow({
            'card_id': 'NEW_8_2', 'deck_id': 8, 'deck_name': 'Số đếm',
            'front_text': 'Seven', 'current_back_text': '', 'current_part_of_speech': '',
            'proposed_back_text': 'Số bảy', 'proposed_part_of_speech': 'n',
            'phonetic': '/ˈsev.ən/', 'example_text': 'Seven days.',
            'confidence': 'HIGH', 'note': 'insert test 2', 'approved': ''
        })
        # Dòng 3: Eight, approved=Y -> SẼ CHÈN (card_order = 7)
        w.writerow({
            'card_id': 'NEW_8_3', 'deck_id': 8, 'deck_name': 'Số đếm',
            'front_text': 'Eight', 'current_back_text': '', 'current_part_of_speech': '',
            'proposed_back_text': 'Số tám', 'proposed_part_of_speech': 'n',
            'phonetic': '/eɪt/', 'example_text': 'Eight legs.',
            'confidence': 'HIGH', 'note': 'insert test 3', 'approved': 'Y'
        })

    # Test 6 & 7: Chạy --apply chèn thẻ mới
    cmd_insert = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_insert, '--apply', '--database', TEST_DB
    ]
    res_ins = subprocess.run(cmd_insert, capture_output=True, text=True, encoding='utf-8')
    assert res_ins.returncode == 0, f"Insert process failed: {res_ins.stderr}"

    # Kiểm tra Điểm 6: Chỉ Six và Eight được chèn; Seven không được chèn
    cur.execute(f"SELECT front_text, back_text, card_order, part_of_speech, phonetic, example_text, is_active, created_by, version FROM `{TEST_DB}`.flashcards WHERE deck_id=8 AND front_text IN ('Six', 'Seven', 'Eight') ORDER BY card_order")
    inserted_cards = cur.fetchall()
    inserted_fronts = [c['front_text'] for c in inserted_cards]
    assert 'Six' in inserted_fronts, "Thiếu Six!"
    assert 'Eight' in inserted_fronts, "Thiếu Eight!"
    assert 'Seven' not in inserted_fronts, "Seven không được duyệt nhưng vẫn bị chèn!"
    print(f"[XÁC NHẬN ĐIỂM 6] Chỉ thẻ approved=Y (Six, Eight) được chèn; Seven (trống) bị bỏ qua: ĐẠT")

    # Kiểm tra Điểm 7: card_order tiếp nối (6, 7), đầy đủ các trường
    six_card = next(c for c in inserted_cards if c['front_text'] == 'Six')
    eight_card = next(c for c in inserted_cards if c['front_text'] == 'Eight')
    assert six_card['card_order'] == 6, f"Six card_order sai: {six_card['card_order']}"
    assert eight_card['card_order'] == 7, f"Eight card_order sai: {eight_card['card_order']}"
    assert six_card['is_active'] == 1 and six_card['created_by'] == 2 and six_card['version'] == 1
    assert six_card['phonetic'] == '/sɪks/' and six_card['example_text'] == 'Six eggs.'
    print(f"[XÁC NHẬN ĐIỂM 7] card_order tiếp nối (6, 7), created_by=2, is_active=1, version=1, phonetic, example_text đầy đủ: ĐẠT")

    # Test 8: Idempotent - Chạy lại lần 2 với cùng CSV
    res_ins2 = subprocess.run(cmd_insert, capture_output=True, text=True, encoding='utf-8')
    assert "Sẽ THÊM MỚI (INSERT):  0 thẻ" in res_ins2.stdout, f"Lần 2 phải chèn 0 thẻ! Output:\n{res_ins2.stdout}"
    assert "Bỏ qua INSERT (đã tồn tại): 2" in res_ins2.stdout, f"Phải phát hiện 2 thẻ đã tồn tại! Output:\n{res_ins2.stdout}"
    print("[XÁC NHẬN ĐIỂM 8] Chạy lại lần hai: 0 thẻ chèn mới, phát hiện đã tồn tại (Idempotent): ĐẠT")

    # Test 9: Rollback khi gặp lỗi trong quá trình INSERT
    # Tạo trigger chặn chèn từ "Nine"
    cur.execute(f"""
        CREATE TRIGGER `{TEST_DB}`.fail_on_nine
        BEFORE INSERT ON `{TEST_DB}`.flashcards
        FOR EACH ROW
        BEGIN
            IF NEW.front_text = 'Nine' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cố tình ném lỗi khi chèn Nine';
            END IF;
        END
    """)
    test_csv_ins_fail = 'private-results/_test_verify_insert_fail.csv'
    with open(test_csv_ins_fail, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
            'proposed_back_text','proposed_part_of_speech','phonetic','example_text','confidence','note','approved'
        ])
        w.writeheader()
        w.writerow({
            'card_id': 'NEW_8_4', 'deck_id': 8, 'deck_name': 'Số đếm',
            'front_text': 'Zero', 'current_back_text': '', 'current_part_of_speech': '',
            'proposed_back_text': 'Số không', 'proposed_part_of_speech': 'n',
            'phonetic': '/ˈzɪə.rəʊ/', 'example_text': 'Zero degrees.',
            'confidence': 'HIGH', 'note': 'zero', 'approved': 'Y'
        })
        w.writerow({
            'card_id': 'NEW_8_5', 'deck_id': 8, 'deck_name': 'Số đếm',
            'front_text': 'Nine', 'current_back_text': '', 'current_part_of_speech': '',
            'proposed_back_text': 'Số chín', 'proposed_part_of_speech': 'n',
            'phonetic': '/naɪn/', 'example_text': 'Nine cats.',
            'confidence': 'HIGH', 'note': 'nine fail', 'approved': 'Y'
        })
    cmd_ins_fail = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_ins_fail, '--apply', '--database', TEST_DB
    ]
    res_ins_fail = subprocess.run(cmd_ins_fail, capture_output=True, text=True, encoding='utf-8', errors='replace')
    assert "rollback" in (res_ins_fail.stderr or "").lower() or "rollback" in (res_ins_fail.stdout or "").lower()
    cur.execute(f"SELECT count(*) as cnt FROM `{TEST_DB}`.flashcards WHERE deck_id=8 AND front_text='Zero'")
    assert cur.fetchone()['cnt'] == 0, "Zero không được commit do rollback!"
    print(f"[XÁC NHẬN ĐIỂM 9] Rollback hoàn toàn: 'Zero' không bị chèn khi 'Nine' gặp lỗi: ĐẠT")

    # Dọn dẹp
    cur.execute(f"DROP DATABASE `{TEST_DB}`")
    conn.close()
    for fpath in [test_csv_1, test_csv_overwrite, test_csv_fail, test_csv_insert, test_csv_ins_fail]:
        if os.path.exists(fpath): os.remove(fpath)
    print(f"\n[DỌN DẸP] Đã xóa database tạm `{TEST_DB}` và các file CSV thử nghiệm.")
    print("=================================================================")
    print("TẤT CẢ 9 ĐIỂM KIỂM CHỨNG UPDATE & INSERT: HOÀN TOÀN ĐẠT (100%)")
    print("=================================================================")

if __name__ == '__main__':
    run()
