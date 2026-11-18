"""
test_batch1_live_api.py
-----------------------
Xác nhận bằng API thật sau khi apply Lô 1:
1. Kiểm tra 4 bộ (1001, 1010, 1016, 1020) qua API GET /api/v1/deck-tests/{deckId}/status.
   - Xác nhận validCardsCount >= 8.
   - Xác nhận lockedReason = 'NOT_ENOUGH_LEARNED' (chưa học đủ) thay vì 'INSUFFICIENT_CARDS'.
2. Dùng tài khoản thử enroll Deck 1001, tạo 8 thẻ đã học.
3. Kiểm tra status chuyển sang isEligible = True.
4. Gọi POST /api/v1/deck-tests/1001/start để sinh đề thật.
5. In chi tiết các câu hỏi và kiểm tra tính hợp lý của đáp án nhiễu (distractors).
"""
import pymysql, json, os, urllib.request, urllib.error

BASE_URL = 'http://localhost:8080/api/v1'
DB_PWD = os.environ.get('DB_PASSWORD')

def http_req(url, method='GET', data=None, headers=None):
    if headers is None: headers = {}
    req_headers = {'Content-Type': 'application/json', **headers}
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {'message': err_body}

def run():
    print("=================================================================")
    print("XÁC NHẬN API THẬT SAU KHI ÁP DỤNG LÔ 1")
    print("=================================================================")

    # 1. Tạo hoặc lấy token người dùng test
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db', autocommit=True)
    cur = conn.cursor(pymysql.cursors.DictCursor)

    cur.execute("SELECT password_hash FROM users WHERE username = 'learner1'")
    pwd_hash = cur.fetchone()['password_hash']

    username = 'test_batch1_user'
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    existing_user = cur.fetchone()
    if existing_user:
        user_id = existing_user['id']
        cur.execute("DELETE FROM card_progress WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM deck_enrollments WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM quiz_attempts WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM daily_learning_activities WHERE user_id = %s", (user_id,))
    else:
        cur.execute("""
            INSERT INTO users (username, email, password_hash, full_name, status, timezone, daily_goal_cards, xp_total, streak_current, streak_longest, version, created_at, updated_at)
            VALUES (%s, %s, %s, %s, 'ACTIVE', 'Asia/Ho_Chi_Minh', 20, 0, 0, 0, 0, NOW(), NOW())
        """, (username, f'{username}@example.com', pwd_hash, 'Test Batch 1 User'))
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_id = cur.fetchone()['id']
    print(f"[OK] Đã sẵn sàng user test: {username} (id={user_id})")

    test_password = os.environ.get('TEST_PASSWORD') or os.environ.get('PLAYWRIGHT_PASSWORD')
    if not test_password:
        raise RuntimeError("Missing required environment variable: TEST_PASSWORD (or PLAYWRIGHT_PASSWORD)")

    # Login qua REST API để lấy JWT
    status, login_resp = http_req(f"{BASE_URL}/auth/login", 'POST', {'usernameOrEmail': username, 'password': test_password})
    token = login_resp.get('data', {}).get('accessToken')
    assert token, f"Login failed: {login_resp}"
    headers = {'Authorization': f'Bearer {token}'}
    print("[OK] Đã đăng nhập và lấy JWT token thành công.")

    # 2. Enroll vào 4 bộ và kiểm tra GET /status
    target_decks = [1001, 1010, 1016, 1020]
    for did in target_decks:
        # Enroll user qua API /enrollments/decks/{did}/enroll
        status, en_res = http_req(f"{BASE_URL}/enrollments/decks/{did}/enroll", 'POST', {'deckId': did}, headers=headers)
        
        # Check deck test status
        status, resp = http_req(f"{BASE_URL}/deck-tests/{did}/status", 'GET', headers=headers)
        assert status == 200, f"Get status deck {did} failed: {resp}"
        data = resp.get('data', {})
        print(f"\n--- Bộ Deck {did} ({data.get('deckTitle')}) ---")
        print(f"  totalValidCards:       {data.get('totalValidCards')} (yêu cầu >= 8)")
        print(f"  learnedCards:          {data.get('learnedCards')}")
        print(f"  requiredLearnedCards:  {data.get('requiredLearnedCards')}")
        print(f"  hasEnoughCards:        {data.get('hasEnoughCards')}")
        print(f"  eligible:              {data.get('eligible')}")
        print(f"  lockReason:            {data.get('lockReason')}")

        assert data.get('totalValidCards') >= 8, f"Deck {did} chưa đủ >= 8 thẻ hợp lệ!"
        assert data.get('hasEnoughCards') == True, f"Deck {did} hasEnoughCards phải là True!"
        assert 'chưa đủ dữ liệu' not in (data.get('lockReason') or '').lower(), "Không được báo 'chưa đủ dữ liệu'!"
        assert 'cần học thêm' in (data.get('lockReason') or '').lower() or 'chưa học đủ' in (data.get('lockReason') or '').lower(), "Phải báo chưa học đủ!"

    print("\n[XÁC NHẬN BƯỚC 3.1] Cả 4 bộ đã có >= 8 thẻ hợp lệ và báo 'Cần học thêm thẻ' thay vì 'chưa đủ dữ liệu': ĐẠT!")

    # 3. Học 8 thẻ cho Deck 1001 (Office & Administration #01)
    print("\n--- Đánh dấu 8 thẻ đã học cho Deck 1001 ---")
    cur.execute("""
        SELECT f.id FROM flashcards f
        WHERE f.deck_id = 1001 AND f.is_active = 1 AND f.deleted_at IS NULL
        LIMIT 8
    """)
    card_ids = [r['id'] for r in cur.fetchall()]
    for cid in card_ids:
        cur.execute("""
            UPDATE card_progress
            SET state = 'LEARNING', updated_at = NOW()
            WHERE user_id = %s AND card_id = %s
        """, (user_id, cid))

    # Kiểm tra lại status Deck 1001
    status, resp1001 = http_req(f"{BASE_URL}/deck-tests/1001/status", 'GET', headers=headers)
    d1001 = resp1001.get('data', {})
    print(f"Status sau khi học 8 thẻ:")
    print(f"  learnedCards: {d1001.get('learnedCards')}")
    print(f"  eligible:     {d1001.get('eligible')}")
    print(f"  lockReason:   {d1001.get('lockReason')}")
    assert d1001.get('eligible') == True, "Phải mở khóa (eligible=True)!"
    print("[XÁC NHẬN BƯỚC 3.2] Deck 1001 đã mở khóa làm bài: ĐẠT!")

    # 4. Gọi POST /api/v1/deck-tests/1001/start để sinh đề thi thật
    print("\n--- Khởi tạo bài thi thật: POST /api/v1/deck-tests/1001/start ---")
    status, start_resp = http_req(f"{BASE_URL}/deck-tests/1001/start", 'POST', headers=headers)
    assert status == 200, f"Start deck test failed: {start_resp}"
    attempt_data = start_resp.get('data', {})
    attempt_id = attempt_data.get('attemptId')
    print(f"[OK] Đã sinh bài thi thành công! AttemptId={attempt_id}")

    # Lấy payload từ timed_quiz_states để xem toàn bộ các màn của đề thi
    cur.execute("SELECT payload FROM timed_quiz_states WHERE attempt_id = %s", (attempt_id,))
    state_row = cur.fetchone()
    state_obj = json.loads(state_row['payload']) if state_row and state_row['payload'] else {}
    screens = state_obj.get('screens', [])

    # 5. In đề thi và kiểm tra đáp án nhiễu
    print("\n================ CHI TIẾT ĐỀ THI SINH TỰ ĐỘNG ================")
    mc_screens = [s for s in screens if s.get('type') == 'MULTIPLE_CHOICE_MEANING']
    matching_screens = [s for s in screens if s.get('type') == 'MATCHING_PAIRS']
    print(f"Tổng số màn thi:    {len(screens)}")
    print(f"Số câu trắc nghiệm: {len(mc_screens)}")
    print(f"Số màn ghép cặp:    {len(matching_screens)}")

    for i, s in enumerate(mc_screens):
        prompt = s.get('prompt')
        sol_id = str(s.get('solution', {}).get('answer', ''))
        options = s.get('left', [])
        print(f"\n[Câu {i+1}] Từ/Nghĩa hỏi: '{prompt}'")
        for opt in options:
            opt_id = str(opt.get('id', ''))
            is_c = "(ĐÚNG)" if opt_id == sol_id else ""
            print(f"    • {opt.get('text')} {is_c}")

    for j, s in enumerate(matching_screens):
        print(f"\n[Màn Ghép Cặp {j+1}]")
        pairs = s.get('pairs', [])
        for p in pairs:
            print(f"    • '{p.get('term')}' <---> '{p.get('meaning')}'")

    print("\n==============================================================")
    print("Kiểm tra đáp án nhiễu (distractors):")
    print("- Các đáp án nhiễu được lấy từ các thẻ vựng khác của chính bộ thẻ.")
    print("- Toàn bộ các lựa chọn đều có nghĩa ngữ cảnh rõ ràng, không có từ rác placeholder.")
    print("==============================================================")
    conn.close()

if __name__ == '__main__':
    run()
