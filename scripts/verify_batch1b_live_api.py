import pymysql, json, os, urllib.request, urllib.error

BASE_URL = 'http://localhost:8080/api/v1'
DB_PWD = os.environ.get('DB_PASSWORD')

def http_req(url, method='GET', data=None, headers=None):
    if headers is None: headers = {}
    req_headers = {'Content-Type': 'application/json', **headers}
    body = json.dumps(data).encode('utf-8') if data is not None else None
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
    print("XÁC NHẬN API THẬT CHO LÔ 1b (BỘ 8, 9, 10 ĐÃ CHÈN 9 THẺ)")
    print("=================================================================")

    # 1. Login user test
    username = 'learner1'
    status, login_resp = http_req(f"{BASE_URL}/auth/login", 'POST', {'usernameOrEmail': username, 'password': '123456'})
    token = login_resp.get('data', {}).get('accessToken')
    assert token, f"Login failed: {login_resp}"
    headers = {'Authorization': f'Bearer {token}'}
    print(f"[OK] Đã đăng nhập user {username} thành công.")

    # 2. Kiểm tra status 3 bộ 8, 9, 10
    print("\n--- KIỂM TRA STATUS 3 BỘ 8, 9, 10 ---")
    for did in [8, 9, 10]:
        st, data_resp = http_req(f"{BASE_URL}/deck-tests/{did}/status", 'GET', headers=headers)
        d = data_resp.get('data', {})
        print(f"Deck {did:2d} ({d.get('deckTitle', ''):20s}): hasEnoughCards={d.get('hasEnoughCards')} | totalValidCards={d.get('totalValidCards')}/8 | eligible={d.get('eligible')} | lockReason='{d.get('lockReason')}'")
        assert d.get('hasEnoughCards') is True, f"Deck {did} chưa đủ 8 thẻ hợp lệ!"
        assert d.get('totalValidCards') >= 8, f"Deck {did} có ít hơn 8 thẻ!"

    # 3. Ghi danh bộ 8 và học đủ 4 thẻ để mở khóa bài thi
    print("\n--- GHI DANH BỘ 8 VÀ HỌC 4 THẺ ---")
    st, en_resp = http_req(f"{BASE_URL}/enrollments/decks/8/enroll", 'POST', headers=headers)
    
    # Cập nhật hoặc chèn 4 thẻ sang LEARNING trong DB cho user
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db', autocommit=True)
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    uid = cur.fetchone()['id']
    cur.execute("SELECT id FROM flashcards WHERE deck_id=8 LIMIT 4")
    cids = [r['id'] for r in cur.fetchall()]
    for cid in cids:
        cur.execute("""
            INSERT INTO card_progress (user_id, card_id, state, ease_factor, interval_days, repetitions, lapse_count, version, created_at, updated_at)
            VALUES (%s, %s, 'LEARNING', 2.5, 1, 1, 0, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE state='LEARNING'
        """, (uid, cid))
    conn.close()

    # Kiểm tra lại status bộ 8
    st, data_resp = http_req(f"{BASE_URL}/deck-tests/8/status", 'GET', headers=headers)
    d = data_resp.get('data', {})
    print(f"Deck 8 sau khi học 4 thẻ: eligible={d.get('eligible')} | learnedCards={d.get('learnedCards')}/4 | lockReason='{d.get('lockReason')}'")
    assert d.get('eligible') is True, f"Deck 8 chưa mở khóa! data: {d}"

    # 4. Sinh đề thi thật POST /deck-tests/8/start
    print("\n=================================================================")
    print("SINH ĐỀ THI THẬT CHO BỘ 8 (Số đếm / Numbers) QUA API POST /start")
    print("=================================================================")
    st, start_resp = http_req(f"{BASE_URL}/deck-tests/8/start", 'POST', headers=headers)
    assert st == 200, f"Sinh đề thi thất bại: {start_resp}"
    quiz_data = start_resp.get('data', {})
    attempt_id = quiz_data.get('attemptId') or quiz_data.get('id')
    print(f"Attempt ID sinh ra: #{attempt_id}")

    # Đọc payload từ timed_quiz_states
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db', autocommit=True)
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute("SELECT payload FROM timed_quiz_states WHERE attempt_id=%s", (attempt_id,))
    row = cur.fetchone()
    conn.close()

    assert row and row['payload'], "Không tìm thấy payload trong timed_quiz_states!"
    payload = json.loads(row['payload'])
    screens = payload.get('screens', [])
    mc_screens = [s for s in screens if s['type'] == 'MULTIPLE_CHOICE_MEANING']
    match_screens = [s for s in screens if s['type'] == 'MATCHING_PAIRS']
    print(f"Tổng số câu hỏi sinh ra: {len(screens)} câu (Part 1 MC: {len(mc_screens)}, Part 2 Matching: {len(match_screens)})")

    print("\nChi tiết các câu hỏi trong đề:")
    for idx, screen in enumerate(screens, 1):
        stype = screen.get('type')
        prompt = screen.get('prompt')
        if stype == 'MULTIPLE_CHOICE_MEANING':
            ans_key = screen.get('solution', {}).get('answer')
            left = screen.get('left', [])
            print(f"\nCâu {idx:02d} [Trắc nghiệm] Prompt: \"{prompt}\"")
            for cell in left:
                is_ans = cell['id'] == ans_key
                marker = " [ĐÁP ÁN ĐÚNG]" if is_ans else ""
                print(f"   - {cell['text']:20s}{marker}")
        elif stype == 'MATCHING_PAIRS':
            print(f"\nCâu {idx:02d} [Ghép cặp] Prompt: \"{prompt}\"")
            left = screen.get('left', [])
            right = screen.get('right', [])
            sol = screen.get('solution', {})
            for lcell in left:
                r_id = sol.get(lcell['id'])
                r_text = next((rc['text'] for rc in right if rc['id'] == r_id), '?')
                print(f"   * {lcell['text']:15s} <---> {r_text}")

    print("\n=================================================================")
    print("XÁC NHẬN TOÀN BỘ LÔ 1b QUA API REST: HOÀN TOÀN THÀNH CÔNG (100%)")
    print("=================================================================")

if __name__ == '__main__':
    run()
