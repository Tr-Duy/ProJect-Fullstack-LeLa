"""
test_apply_script_isolated.py
-----------------------------
Kiểm chứng tự động 5 điểm an toàn của script apply_card_meaning_drafts.py
trên một schema tạm biệt lập (lela_test_apply_db).

5 Điểm kiểm chứng:
1. Bảng sao lưu được tạo đúng số dòng.
2. Chỉ các thẻ approved=Y bị đổi, thẻ approved='' không bị đổi.
3. Thẻ đã được sửa trước đó (đã hợp lệ) không bị đè.
4. Chạy lại lần hai không đổi gì (idempotent).
5. Lỗi giữa chừng thì rollback đúng (mô phỏng lỗi trong transaction).
"""
import os, sys, csv, pymysql, subprocess

DB_PWD = os.environ.get('DB_PASSWORD', '123456')
TEST_DB = 'lela_test_apply_db'

def run():
    print("=================================================================")
    print("BƯỚC 2: KIỂM CHỨNG SCRIPT NHẬP TRÊN SCHEMA BIỆT LẬP")
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

    # Copy các thẻ mẫu: 10016, 10017 (deck 1001) và 10159, 10169 (deck 1010)
    cur.execute(f"""
        INSERT INTO `{TEST_DB}`.flashcards
        SELECT * FROM `lela_db`.flashcards
        WHERE id IN (10016, 10017, 10159, 10169)
    """)
    cur.execute(f"""
        INSERT INTO `{TEST_DB}`.decks
        SELECT * FROM `lela_db`.decks
        WHERE id IN (1001, 1010)
    """)
    cur.execute(f"SELECT count(*) as cnt FROM `{TEST_DB}`.flashcards")
    initial_count = cur.fetchone()['cnt']
    print(f"[OK] Đã nạp {initial_count} thẻ mẫu vào `{TEST_DB}`.flashcards")

    # Tạo CSV test 1:
    # - 10016: approved=Y
    # - 10017: approved='' (không duyệt)
    # - 10159: approved=Y
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

    # -------------------------------------------------------------
    # Test 1 & 2: Chạy lần 1 với test_csv_1
    # -------------------------------------------------------------
    print("\n--- [TEST 1 & 2] Chạy --apply lần 1 trên bản sao ---")
    cmd = [
        sys.executable, 'scripts/apply_card_meaning_drafts.py',
        test_csv_1, '--apply', '--database', TEST_DB
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print("STDOUT:", res.stdout.strip())
    assert res.returncode == 0, f"Process failed: {res.stderr}"

    # Kiểm tra Điểm 1: Bảng sao lưu được tạo và đúng số dòng
    cur.execute(f"SHOW TABLES FROM `{TEST_DB}` LIKE 'flashcards_backup_%'")
    backup_tables = cur.fetchall()
    assert len(backup_tables) == 1, "Không tìm thấy bảng sao lưu!"
    backup_table_name = list(backup_tables[0].values())[0]
    cur.execute(f"SELECT count(*) as cnt FROM `{TEST_DB}`.`{backup_table_name}`")
    backup_count = cur.fetchone()['cnt']
    print(f"\n[XÁC NHẬN ĐIỂM 1] Bảng sao lưu `{backup_table_name}` có {backup_count} dòng (khớp bảng gốc {initial_count} dòng): ĐẠT")
    assert backup_count == initial_count

    # Kiểm tra Điểm 2: Chỉ các thẻ approved=Y bị đổi
    cur.execute(f"SELECT id, back_text FROM `{TEST_DB}`.flashcards WHERE id IN (10016, 10017, 10159)")
    rows_by_id = {r['id']: r['back_text'] for r in cur.fetchall()}
    assert rows_by_id[10016] == 'Nhà tư vấn test', f"10016 sai: {rows_by_id[10016]}"
    assert rows_by_id[10159] == 'Nhận thức test', f"10159 sai: {rows_by_id[10159]}"
    assert 'từ vựng thuộc nhóm' in rows_by_id[10017] or 'placeholder' in rows_by_id[10017], f"10017 bị đổi sai: {rows_by_id[10017]}"
    print(f"[XÁC NHẬN ĐIỂM 2] Thẻ 10016 (Y) và 10159 (Y) đã cập nhật; thẻ 10017 (trống) giữ nguyên: ĐẠT")

    # -------------------------------------------------------------
    # Test 3: Idempotent - Chạy lại lần hai với cùng CSV
    # -------------------------------------------------------------
    print("\n--- [TEST 3] Chạy lại lần 2 (Kiểm tra tính Idempotent) ---")
    res2 = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print("STDOUT:\n", res2.stdout.strip())
    assert "Sẽ cập nhật:   0 thẻ" in res2.stdout, "Lần 2 phải cập nhật 0 thẻ!"
    assert "Bỏ qua (đã hợp lệ): 2" in res2.stdout, "Phải bỏ qua 2 thẻ đã hợp lệ!"
    print("[XÁC NHẬN ĐIỂM 3] Chạy lại lần hai: 0 thẻ cập nhật, bỏ qua vì đã hợp lệ (Idempotent): ĐẠT")

    # -------------------------------------------------------------
    # Test 4: Thẻ đã được người khác sửa trước đó không bị đè
    # -------------------------------------------------------------
    print("\n--- [TEST 4] Thẻ đã hợp lệ không bị đè bởi nghĩa mới ---")
    # Gán 10169 thành nghĩa hợp lệ thủ công
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
    print("STDOUT:\n", res_ow.stdout.strip())
    cur.execute(f"SELECT back_text FROM `{TEST_DB}`.flashcards WHERE id=10169")
    cur_back = cur.fetchone()['back_text']
    assert cur_back == 'Tiền gửi cố định đã sửa', f"Thẻ bị đè sai: {cur_back}"
    print(f"[XÁC NHẬN ĐIỂM 4] Thẻ 10169 giữ nguyên 'Tiền gửi cố định đã sửa', không bị đè bởi 'Nghĩa đè mạo danh': ĐẠT")

    # -------------------------------------------------------------
    # Test 5: Mô phỏng lỗi giữa transaction -> Rollback hoàn toàn
    # -------------------------------------------------------------
    print("\n--- [TEST 5] Mô phỏng lỗi giữa transaction -> Kiểm tra Rollback ---")
    # Đặt lại 10017 và 10169 thành placeholder trước khi tạo trigger
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm convenience (danh từ)' WHERE id=10017")
    cur.execute(f"UPDATE `{TEST_DB}`.flashcards SET back_text='từ vựng thuộc nhóm deposit (danh từ)' WHERE id=10169")

    # Đặt trigger tạm thời trên flashcards: chỉ ném lỗi khi cập nhật 10169 với giá trị mới từ CSV
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
    # Tạo CSV có 2 dòng: dòng 1 là 10017 (thành công), dòng 2 là 10169 (sẽ gây lỗi)
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
    print("STDOUT:\n", res_fail.stdout.strip())
    print("STDERR:\n", res_fail.stderr.strip())
    assert "Đã rollback" in res_fail.stderr or "Đã rollback" in res_fail.stdout, "Phải thông báo đã rollback!"

    # Kiểm tra dòng 1 (10017) có bị commit không?
    cur.execute(f"SELECT back_text FROM `{TEST_DB}`.flashcards WHERE id=10017")
    back_10017_after_rollback = cur.fetchone()['back_text']
    assert back_10017_after_rollback == 'từ vựng thuộc nhóm convenience (danh từ)', f"10017 không được thay đổi do rollback! Thực tế: {back_10017_after_rollback}"
    print(f"[XÁC NHẬN ĐIỂM 5] Thẻ 10017 không bị cập nhật vào DB nhờ rollback khi 10169 gặp lỗi: ĐẠT")

    # -------------------------------------------------------------
    # Dọn dẹp schema tạm và file test
    # -------------------------------------------------------------
    cur.execute(f"DROP DATABASE `{TEST_DB}`")
    conn.close()
    for fpath in [test_csv_1, test_csv_overwrite, test_csv_fail]:
        if os.path.exists(fpath): os.remove(fpath)
    print(f"\n[DỌN DẸP] Đã xóa database tạm `{TEST_DB}` và các file CSV thử nghiệm.")
    print("=================================================================")
    print("TẤT CẢ 5 ĐIỂM KIỂM CHỨNG TRƯỚC KHI DÙNG VỚI DB THẬT: HOÀN TOÀN ĐẠT")
    print("=================================================================")

if __name__ == '__main__':
    run()
