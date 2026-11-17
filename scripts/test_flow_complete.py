import urllib.request
import json
import os
import uuid
import pymysql
from decimal import Decimal

pwd = os.environ.get('PLAYWRIGHT_PASSWORD', '123456')
db_pwd = os.environ.get('DB_PASSWORD')

def get_db():
    return pymysql.connect(host='127.0.0.1', port=3306, user='root', password=db_pwd, database='lela_db', autocommit=True)

def create_user(username):
    conn = get_db()
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    old = cur.fetchone()
    if old:
        uid = old['id']
        cur.execute("DELETE FROM card_progress WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM deck_enrollments WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM user_achievements WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM daily_learning_activities WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM user_roles WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM quiz_attempts WHERE user_id = %s", (uid,))
        cur.execute("DELETE FROM users WHERE id = %s", (uid,))
    
    cur.execute("SELECT password_hash FROM users WHERE username = 'learner1'")
    pwd_hash = cur.fetchone()['password_hash']
    cur.execute('''
        INSERT INTO users (username, email, password_hash, full_name, status, timezone, daily_goal_cards, xp_total, streak_current, streak_longest, version, created_at, updated_at, current_exam_type_id, current_level_id)
        VALUES (%s, %s, %s, %s, 'ACTIVE', 'Asia/Ho_Chi_Minh', 20, 0, 0, 0, 0, NOW(), NOW(), 1, 1)
    ''', (username, f'{username}@test.com', pwd_hash, f'Real Flow User {username}'))
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    uid = cur.fetchone()['id']
    cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, 2)", (uid,))

    # Enroll deck 18 with 8 learned cards
    cur.execute("INSERT INTO deck_enrollments (user_id, deck_id, enrolled_at, status, created_at, updated_at, version) VALUES (%s, 18, NOW(), 'ACTIVE', NOW(), NOW(), 0)", (uid,))
    cur.execute('SELECT id FROM flashcards WHERE deck_id = 18 AND is_active = 1 LIMIT 8')
    card_ids = [r['id'] for r in cur.fetchall()]
    for cid in card_ids:
        cur.execute("INSERT INTO card_progress (user_id, card_id, state, repetitions, interval_days, ease_factor, due_at, created_at, updated_at, version) VALUES (%s, %s, 'REVIEW', 1, 1, 2.5, NOW(), NOW(), NOW(), 0)", (uid, cid))
    
    conn.close()
    return uid

def login(username):
    req = urllib.request.Request('http://localhost:8080/api/v1/auth/login',
        data=json.dumps({'usernameOrEmail': username, 'password': pwd}).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())['data']['accessToken']

def solve_and_submit_deck_test(token, mc_correct_count=10, pairs_to_solve_count=4):
    # 1. Start deck test
    req = urllib.request.Request('http://localhost:8080/api/v1/deck-tests/18/start',
        data=b'',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        test_view = json.loads(resp.read().decode())['data']
    attempt_id = test_view['attemptId']

    conn = get_db()
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute('SELECT payload FROM timed_quiz_states WHERE attempt_id = %s', (attempt_id,))
    state = json.loads(cur.fetchone()['payload'])
    conn.close()

    screens = state['screens']
    mc_screens = [s for s in screens if s['type'] == 'MULTIPLE_CHOICE_MEANING']
    match_screens = [s for s in screens if s['type'] == 'MATCHING_PAIRS']

    # 2. Answer MC screens
    for i, screen in enumerate(mc_screens):
        ans = screen['solution'].get('answer')
        
        # BEGIN
        req1 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'BEGIN', 'index': i, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req1): pass

        # ANSWER
        chosen_left = ans if i < mc_correct_count else (screen['left'][1]['id'] if screen['left'][0]['id'] == ans else screen['left'][0]['id'])
        req2 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'ANSWER', 'index': i, 'leftId': chosen_left, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req2): pass

        # NEXT
        req3 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'NEXT', 'index': i, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req3): pass

    # 3. Handle Matching screens
    pairs_remaining_to_solve = pairs_to_solve_count
    for m_idx, screen in enumerate(match_screens):
        s_idx = len(mc_screens) + m_idx
        solution = screen['solution']

        # BEGIN
        req1 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'BEGIN', 'index': s_idx, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req1): pass

        # Match up to 4 pairs on this screen
        pairs_on_screen = min(4, pairs_remaining_to_solve)
        items = list(solution.items())[:pairs_on_screen]
        for l_id, r_id in items:
            p_req = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
                data=json.dumps({'action': 'PAIR', 'index': s_idx, 'leftId': l_id, 'rightId': r_id, 'requestId': str(uuid.uuid4())}).encode(),
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(p_req): pass
        
        pairs_remaining_to_solve -= pairs_on_screen

        # NEXT (if completed all 4 pairs)
        if pairs_on_screen == 4:
            req3 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
                data=json.dumps({'action': 'NEXT', 'index': s_idx, 'requestId': str(uuid.uuid4())}).encode(),
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req3): pass

    # 4. Submit
    sub_req = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/submit',
        data=json.dumps({'abandoned': False, 'answers': []}).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(sub_req) as resp:
        sub_res = json.loads(resp.read().decode())['data']

    return attempt_id, sub_res

print("=" * 80)
print("TEST SCRIPT: VERIFY PASS FLOW, REAL NEXT-DAY 50% XP, FAIL FLOW & BEST SCORE RETENTION")
print("=" * 80)

# ==============================================================================
# PART 1: LUỒNG ĐẠT THẬT (Tài khoản mới, Deck 18, 11/14 điểm = 78.57% >= 70%)
# ==============================================================================
username = "real_pass_user_01"
user_id = create_user(username)
token = login(username)

# Trigger achievement check so DECKS_1 gives 150 XP baseline
ach_req = urllib.request.Request('http://localhost:8080/api/v1/achievements/my-progress',
    headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(ach_req): pass

print(f"\n[1.1] Bắt đầu thi lần 1 với 7 câu trắc nghiệm đúng + 4 cặp từ đúng (11/14 điểm = 78.57%):")
att1_id, att1_res = solve_and_submit_deck_test(token, mc_correct_count=7, pairs_to_solve_count=4)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id, passed, score_percent, xp_awarded, time_spent_seconds FROM quiz_attempts WHERE id = %s", (att1_id,))
att_row = cur.fetchone()

cur.execute("SELECT topic_test_passed, topic_test_best_score, topic_test_last_attempt_at FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_id,))
en_row = cur.fetchone()

cur.execute("SELECT xp_total, streak_current, streak_longest, last_activity_date FROM users WHERE id = %s", (user_id,))
user_row = cur.fetchone()
conn.close()

print(f"  Attempt ID:                              {att1_id}")
print(f"  quiz_attempts.passed:                    {att_row['passed']}")
print(f"  quiz_attempts.score_percent:             {att_row['score_percent']}%")
print(f"  quiz_attempts.xp_awarded:                {att_row['xp_awarded']} XP (Expected: 15 XP)")
print(f"  deck_enrollments.topic_test_passed:      {en_row['topic_test_passed']}")
print(f"  deck_enrollments.topic_test_best_score:  {en_row['topic_test_best_score']}%")
print(f"  deck_enrollments.topic_test_last_attempt_at: {en_row['topic_test_last_attempt_at']}")
print(f"  users.xp_total:                          {user_row['xp_total']} XP (150 thành tựu + 15 bài thi = 165)")
print(f"  users.streak_current:                    {user_row['streak_current']}")
print(f"  users.last_activity_date:                {user_row['last_activity_date']}")

assert att_row['passed'] == 1, "Attempt must be passed (1)"
assert Decimal(str(att_row['score_percent'])) >= Decimal('70.0'), "Score percent must be >= 70%"
assert en_row['topic_test_passed'] == 1, "topic_test_passed must be 1"
assert Decimal(str(en_row['topic_test_best_score'])) == Decimal('78.57'), "best_score must be 78.57"
assert att_row['xp_awarded'] == 15, f"xp_awarded must be 15, got {att_row['xp_awarded']}"
assert user_row['xp_total'] == 165, f"users.xp_total must be 165, got {user_row['xp_total']}"

# ==============================================================================
# [1.2] NỘP LẠI LẦN 2 CÙNG NGÀY -> Nhận 0 XP, streak duy trì
# ==============================================================================
print(f"\n[1.2] Nộp lại lần 2 cùng ngày (cùng làm đúng 11/14 điểm):")
att2_id, att2_res = solve_and_submit_deck_test(token, mc_correct_count=7, pairs_to_solve_count=4)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id, passed, score_percent, xp_awarded FROM quiz_attempts WHERE id = %s", (att2_id,))
att2_row = cur.fetchone()

cur.execute("SELECT xp_total, streak_current FROM users WHERE id = %s", (user_id,))
user2_row = cur.fetchone()

cur.execute("SELECT xp_earned, quiz_count FROM daily_learning_activities WHERE user_id = %s", (user_id,))
dla2_row = cur.fetchone()
conn.close()

print(f"  Attempt #2 ID:               {att2_id}")
print(f"  quiz_attempts.xp_awarded:    {att2_row['xp_awarded']} XP (Expected: 0 XP)")
print(f"  users.xp_total:              {user2_row['xp_total']} XP (Unchanged: 165)")
print(f"  users.streak_current:        {user2_row['streak_current']} (Streak maintained: >= 1)")
print(f"  dla.quiz_count:              {dla2_row['quiz_count']} (Quiz count incremented: 2)")

assert att2_row['xp_awarded'] == 0, "Second attempt same day must award 0 XP"
assert user2_row['xp_total'] == 165, "xp_total must remain 165"

# ==============================================================================
# [1.3] MÔ PHỎNG NGÀY KHÁC (Chuyển ngày của attempt 1 & 2 và lastAttemptAt về hôm qua)
# Trạng thái topic_test_passed = 1 và best_score = 78.57 được giữ NGUYÊN từ lượt thi thật trên!
# ==============================================================================
print(f"\n[1.3] Mô phỏng ngày khác (đổi ngày attempt 1, 2 và lastAttemptAt về hôm qua, GIỮ NGUYÊN topic_test_passed và best_score thật):")
conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute('''
    UPDATE quiz_attempts 
    SET submitted_at = NOW() - INTERVAL 1 DAY, started_at = NOW() - INTERVAL 1 DAY
    WHERE user_id = %s
''', (user_id,))
cur.execute('''
    UPDATE deck_enrollments
    SET topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY
    WHERE user_id = %s AND deck_id = 18
''', (user_id,))
conn.close()

att3_id, att3_res = solve_and_submit_deck_test(token, mc_correct_count=7, pairs_to_solve_count=4)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id, passed, score_percent, xp_awarded FROM quiz_attempts WHERE id = %s", (att3_id,))
att3_row = cur.fetchone()

cur.execute("SELECT xp_total, streak_current FROM users WHERE id = %s", (user_id,))
user3_row = cur.fetchone()
conn.close()

print(f"  Attempt #3 ID:               {att3_id}")
print(f"  quiz_attempts.passed:        {att3_row['passed']}")
print(f"  quiz_attempts.score_percent: {att3_row['score_percent']}%")
print(f"  quiz_attempts.xp_awarded:    {att3_row['xp_awarded']} XP (Expected: 8 XP - đúng 50% của 15 XP làm tròn)")
print(f"  users.xp_total:              {user3_row['xp_total']} XP (165 + 8 = 173)")

assert att3_row['xp_awarded'] == 8, f"Different day with real passed state must award 50% XP (8), got {att3_row['xp_awarded']}"
assert user3_row['xp_total'] == 173, f"users.xp_total must be 173, got {user3_row['xp_total']}"

# ==============================================================================
# PART 2: KIỂM TRA THI TRƯỢT VÀ CẬP NHẬT ĐIỂM TỐT NHẤT
# ==============================================================================
print("\n" + "=" * 80)
print("PART 2: BÀI THI TRƯỢT KHÔNG ĐƯỢC ĐÁNH DẤU PASSED, ĐIỂM TỐT NHẤT CHỈ TĂNG KHI CAO HƠN")
print("=" * 80)

user_fail_name = "test_fail_flow_user"
user_fail_id = create_user(user_fail_name)
token_fail = login(user_fail_name)

# 2.1 Thi trượt lần đầu (chỉ đúng 4 câu trắc nghiệm = 4/14 = 28.57% < 70%)
print(f"\n[2.1] Nộp bài thi trượt (4/14 điểm = 28.57%):")
fail_att1_id, fail_att1_res = solve_and_submit_deck_test(token_fail, mc_correct_count=4, pairs_to_solve_count=0)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT passed, score_percent FROM quiz_attempts WHERE id = %s", (fail_att1_id,))
f1_row = cur.fetchone()
cur.execute("SELECT topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
f1_en = cur.fetchone()
conn.close()

print(f"  quiz_attempts.passed:                    {f1_row['passed']} (Expected: 0)")
print(f"  quiz_attempts.score_percent:             {f1_row['score_percent']}%")
print(f"  deck_enrollments.topic_test_passed:      {f1_en['topic_test_passed']} (Expected: None or 0 - KHÔNG đánh dấu passed)")
print(f"  deck_enrollments.topic_test_best_score:  {f1_en['topic_test_best_score']}% (Điểm ban đầu: 28.57%)")

assert f1_row['passed'] == 0, "Failed attempt passed must be 0"
assert f1_en['topic_test_passed'] is None or f1_en['topic_test_passed'] == 0, "topic_test_passed must NOT be set when failed"
assert Decimal(str(f1_en['topic_test_best_score'])) == Decimal('28.57'), "topic_test_best_score starts at first attempt score"

# 2.2 Thi lại nhưng điểm THẤP HƠN (2/14 = 14.29%) -> điểm tốt nhất KHÔNG GIẢM, vẫn giữ 28.57%
conn = get_db()
cur = conn.cursor()
cur.execute("UPDATE quiz_attempts SET submitted_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s", (user_fail_id,))
cur.execute("UPDATE deck_enrollments SET topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
conn.close()

print(f"\n[2.2] Thi lại nhưng điểm thấp hơn (2/14 = 14.29%):")
lower_fail_att_id, lower_fail_att_res = solve_and_submit_deck_test(token_fail, mc_correct_count=2, pairs_to_solve_count=0)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT passed, score_percent FROM quiz_attempts WHERE id = %s", (lower_fail_att_id,))
f2_row = cur.fetchone()
cur.execute("SELECT topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
f2_en = cur.fetchone()
conn.close()

print(f"  quiz_attempts.passed:                    {f2_row['passed']} (Expected: 0)")
print(f"  quiz_attempts.score_percent:             {f2_row['score_percent']}%")
print(f"  deck_enrollments.topic_test_passed:      {f2_en['topic_test_passed']} (Vẫn chưa passed: 0)")
print(f"  deck_enrollments.topic_test_best_score:  {f2_en['topic_test_best_score']}% (KHÔNG GIẢM, giữ nguyên: 28.57%)")

assert f2_row['passed'] == 0
assert f2_en['topic_test_passed'] is None or f2_en['topic_test_passed'] == 0
assert Decimal(str(f2_en['topic_test_best_score'])) == Decimal('28.57'), "best_score must NOT decrease when new score is lower"

# 2.3 Sau đó thi ĐẠT (11/14 điểm = 78.57% >= 70%) -> topic_test_passed chuyển thành 1, best_score TĂNG LÊN 78.57%
conn = get_db()
cur = conn.cursor()
cur.execute("UPDATE quiz_attempts SET submitted_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s", (user_fail_id,))
cur.execute("UPDATE deck_enrollments SET topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
conn.close()

print(f"\n[2.3] Sau đó thi đạt (11/14 điểm = 78.57%):")
pass_att_id, pass_att_res = solve_and_submit_deck_test(token_fail, mc_correct_count=7, pairs_to_solve_count=4)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT passed, score_percent FROM quiz_attempts WHERE id = %s", (pass_att_id,))
p_row = cur.fetchone()
cur.execute("SELECT topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
p_en = cur.fetchone()
conn.close()

print(f"  quiz_attempts.passed:                    {p_row['passed']} (Expected: 1 - ĐÃ ĐẠT)")
print(f"  quiz_attempts.score_percent:             {p_row['score_percent']}%")
print(f"  deck_enrollments.topic_test_passed:      {p_en['topic_test_passed']} (Expected: 1 - Đã cập nhật thành công)")
print(f"  deck_enrollments.topic_test_best_score:  {p_en['topic_test_best_score']}% (TĂNG LÊN: 78.57%)")
assert p_row['passed'] == 1
assert p_en['topic_test_passed'] == 1
assert Decimal(str(p_en['topic_test_best_score'])) == Decimal('78.57')

# 2.4 Thi lại nhưng điểm THẤP HƠN (5/14 điểm = 35.71%) -> topic_test_passed VẪN LÀ 1, best_score GIỮ NGUYÊN 78.57%
conn = get_db()
cur = conn.cursor()
cur.execute("UPDATE quiz_attempts SET submitted_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s", (user_fail_id,))
cur.execute("UPDATE deck_enrollments SET topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
conn.close()

print(f"\n[2.4] Thi lại nhưng điểm thấp hơn (5/14 = 35.71%):")
lower_att_id, lower_att_res = solve_and_submit_deck_test(token_fail, mc_correct_count=5, pairs_to_solve_count=0)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
lower_en = cur.fetchone()
conn.close()

print(f"  deck_enrollments.topic_test_passed:      {lower_en['topic_test_passed']} (Vẫn giữ: 1)")
print(f"  deck_enrollments.topic_test_best_score:  {lower_en['topic_test_best_score']}% (KHÔNG GIẢM, giữ nguyên: 78.57%)")
assert lower_en['topic_test_passed'] == 1
assert Decimal(str(lower_en['topic_test_best_score'])) == Decimal('78.57'), "best_score must NOT decrease"

# 2.5 Thi lại với điểm CAO HƠN (14/14 = 100%) -> best_score TĂNG LÊN 100.00%
conn = get_db()
cur = conn.cursor()
cur.execute("UPDATE quiz_attempts SET submitted_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s", (user_fail_id,))
cur.execute("UPDATE deck_enrollments SET topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
conn.close()

print(f"\n[2.5] Thi lại với điểm cao hơn (14/14 = 100%):")
higher_att_id, higher_att_res = solve_and_submit_deck_test(token_fail, mc_correct_count=10, pairs_to_solve_count=4)

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 18", (user_fail_id,))
higher_en = cur.fetchone()
conn.close()

print(f"  deck_enrollments.topic_test_passed:      {higher_en['topic_test_passed']} (Remains: 1)")
print(f"  deck_enrollments.topic_test_best_score:  {higher_en['topic_test_best_score']}% (TĂNG LÊN: 100.00%)")
assert higher_en['topic_test_passed'] == 1
assert Decimal(str(higher_en['topic_test_best_score'])) == Decimal('100.00'), "best_score must increase to 100.00%"

print("\n" + "=" * 80)
print("ALL ASSERTIONS PASSED 100% SUCCESFULLY!")
print("=" * 80)
