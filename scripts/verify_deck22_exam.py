import pymysql, json, os, urllib.request, urllib.error

BASE_URL = 'http://localhost:8080/api/v1'
DB_PWD = os.environ.get('DB_PASSWORD')
if not DB_PWD:
    raise RuntimeError("Missing required environment variable DB_PASSWORD")

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
    print("=== KIỂM TRA ĐỀ THI BỘ 22 (CÓ CẶP TRÙNG 'Register' 893 & 894) ===")
    username = 'learner1'
    status, login_resp = http_req(f"{BASE_URL}/auth/login", 'POST', {'usernameOrEmail': username, 'password': 'password'})
    if status != 200:
        status, login_resp = http_req(f"{BASE_URL}/auth/login", 'POST', {'usernameOrEmail': username, 'password': '123456'})
    token = login_resp.get('data', {}).get('accessToken')
    assert token, f"Login failed: {login_resp}"
    headers = {'Authorization': f'Bearer {token}'}

    # Enroll in deck 22
    st, en_resp = http_req(f"{BASE_URL}/enrollments/decks/22/enroll", 'POST', headers=headers)

    # Setup 8 cards in learning
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db', autocommit=True)
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    uid = cur.fetchone()['id']
    cur.execute("SELECT id FROM flashcards WHERE deck_id=22 AND is_active=1 LIMIT 8")
    cids = [r['id'] for r in cur.fetchall()]
    for cid in cids:
        cur.execute("""
            INSERT INTO card_progress (user_id, card_id, state, ease_factor, interval_days, repetitions, lapse_count, version, created_at, updated_at)
            VALUES (%s, %s, 'LEARNING', 2.5, 1, 1, 0, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE state='LEARNING'
        """, (uid, cid))
    conn.close()

    # Check status
    st, status_resp = http_req(f"{BASE_URL}/deck-tests/22/status", 'GET', headers=headers)
    print(f"Status Deck 22: {status_resp.get('data')}")

    # Start test
    st, start_resp = http_req(f"{BASE_URL}/deck-tests/22/start", 'POST', headers=headers)
    print(f"Start Response Status: {st}")
    data = start_resp.get('data', {})
    attempt_id = data.get('attemptId') or data.get('id')
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
    print(f"Tổng số câu hỏi sinh ra: {len(screens)} màn (MC: {len(mc_screens)}, Matching: {len(match_screens)})")

    # Kiểm tra xem có câu nào hay đáp án nào chứa từ trùng lặp không
    target_words = []
    print("\nChi tiết các câu hỏi trong đề:")
    for idx, screen in enumerate(screens, 1):
        stype = screen.get('type')
        prompt = screen.get('prompt')
        if stype == 'MULTIPLE_CHOICE_MEANING':
            ans_key = screen.get('solution', {}).get('answer')
            left = screen.get('left', [])
            correct_opt = next((c['text'] for c in left if c['id'] == ans_key), '')
            target_words.append(prompt)
            print(f"\nCâu {idx:02d} [Trắc nghiệm] Prompt: \"{prompt}\" | Đáp án đúng: \"{correct_opt}\"")
            for cell in left:
                is_ans = cell['id'] == ans_key
                marker = " [ĐÚNG]" if is_ans else ""
                print(f"   - {cell['text']:25s}{marker}")
        elif stype == 'MATCHING_PAIRS':
            print(f"\nCâu {idx:02d} [Ghép cặp] Prompt: \"{prompt}\"")
            left = screen.get('left', [])
            right = screen.get('right', [])
            sol = screen.get('solution', {})
            for lcell in left:
                r_id = sol.get(lcell['id'])
                r_text = next((rc['text'] for rc in right if rc['id'] == r_id), '?')
                print(f"   * {lcell['text']:20s} <---> {r_text}")

    print("\nKiểm tra từ đích trong đề:")
    print("Danh sách prompt:", target_words)

if __name__ == '__main__':
    run()
