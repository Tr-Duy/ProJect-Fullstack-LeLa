import urllib.request
import json
import os
import uuid
import pymysql

pwd = os.environ.get('PLAYWRIGHT_PASSWORD', '123456')
db_pwd = os.environ.get('DB_PASSWORD')

def get_db():
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=db_pwd, database='lela_db', autocommit=True)
    return conn

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
    ''', (username, f'{username}@test.com', pwd_hash, f'User {username}'))
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    uid = cur.fetchone()['id']
    cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, 2)", (uid,))

    # Enroll deck 18 with 8 cards
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

def take_topic_test(token, correct_count=8):
    # 1. Start
    req = urllib.request.Request('http://localhost:8080/api/v1/deck-tests/18/start',
        data=b'',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        attempt_id = json.loads(resp.read().decode())['data']['attemptId']

    conn = get_db()
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute('SELECT payload FROM timed_quiz_states WHERE attempt_id = %s', (attempt_id,))
    state = json.loads(cur.fetchone()['payload'])
    conn.close()

    # 2. Answer correct_count screens
    for i in range(correct_count):
        screen = state['screens'][i]
        ans = screen['solution'].get('answer')

        # BEGIN
        req1 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'BEGIN', 'index': i, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req1) as r1:
            pass

        # ANSWER
        req2 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'ANSWER', 'index': i, 'leftId': ans, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req2) as r2:
            pass

        # NEXT
        req3 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
            data=json.dumps({'action': 'NEXT', 'index': i, 'requestId': str(uuid.uuid4())}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req3) as r3:
            pass

    # 3. Submit
    sub_req = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/submit',
        data=json.dumps({'abandoned': False, 'answers': []}).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(sub_req) as resp:
        return json.loads(resp.read().decode())['data']

print("=" * 80)
print("TESTING TASK 1: XP RULE 'NGÀY KHÁC'")
print("=" * 80)

# -------------------------------------------------------------
# CASE (a): Chưa từng đạt trước đó, ngày khác -> full 100% XP
# -------------------------------------------------------------
user_a_id = create_user("test_xp_branch_a")
token_a = login("test_xp_branch_a")

# Simulate a failed attempt yesterday:
conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id FROM quizzes WHERE deck_id = 18 AND quiz_category = 'DECK_TEST' LIMIT 1")
quiz_id = cur.fetchone()['id']
cur.execute('''
    INSERT INTO quiz_attempts (public_id, quiz_id, user_id, attempt_number, status, started_at, submitted_at, total_questions, correct_answers, score_points, score_percent, passed, xp_awarded, version, created_at, updated_at)
    VALUES (UUID(), %s, %s, 1, 'SUBMITTED', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 14, 5, 5, 35.71, 0, 5, 1, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY)
''', (quiz_id, user_a_id))
cur.execute('''
    UPDATE deck_enrollments
    SET topic_test_passed = 0, topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY, topic_test_best_score = 35.71
    WHERE user_id = %s AND deck_id = 18
''', (user_a_id,))
conn.close()

result_a = take_topic_test(token_a, 8)
print("Case (a) [Chưa từng đạt, ngày khác]:")
print(f"  correctAnswers: {result_a['correctAnswers']}")
print(f"  scorePercent:   {result_a['scorePercent']}%")
print(f"  xpAwarded:      {result_a['xpAwarded']} (Expected: 8 XP - 100% full XP)")
assert result_a['xpAwarded'] == 8, f"Expected 8 XP but got {result_a['xpAwarded']}"

# Check user's total XP
conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT xp_total FROM users WHERE id = %s", (user_a_id,))
print(f"  users.xp_total: {cur.fetchone()['xp_total']} (Expected: 8)")
conn.close()

# -------------------------------------------------------------
# CASE (b): Đã từng đạt trước đó, ngày khác -> 50% XP
# -------------------------------------------------------------
user_b_id = create_user("test_xp_branch_b")
token_b = login("test_xp_branch_b")

# Simulate a passed attempt yesterday:
conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute('''
    INSERT INTO quiz_attempts (public_id, quiz_id, user_id, attempt_number, status, started_at, submitted_at, total_questions, correct_answers, score_points, score_percent, passed, xp_awarded, version, created_at, updated_at)
    VALUES (UUID(), %s, %s, 1, 'SUBMITTED', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 14, 11, 11, 78.57, 1, 11, 1, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY)
''', (quiz_id, user_b_id))
cur.execute('''
    UPDATE deck_enrollments
    SET topic_test_passed = 1, topic_test_last_attempt_at = NOW() - INTERVAL 1 DAY, topic_test_best_score = 78.57
    WHERE user_id = %s AND deck_id = 18
''', (user_b_id,))
conn.close()

result_b = take_topic_test(token_b, 8)
print("\nCase (b) [Đã đạt trước đó, ngày khác]:")
print(f"  correctAnswers: {result_b['correctAnswers']}")
print(f"  scorePercent:   {result_b['scorePercent']}%")
print(f"  xpAwarded:      {result_b['xpAwarded']} (Expected: 4 XP - 50% discounted XP)")
assert result_b['xpAwarded'] == 4, f"Expected 4 XP but got {result_b['xpAwarded']}"

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT xp_total FROM users WHERE id = %s", (user_b_id,))
print(f"  users.xp_total: {cur.fetchone()['xp_total']} (Expected: 4)")
conn.close()

# -------------------------------------------------------------
# CASE (c): Cùng ngày lần 2 -> 0 XP nhưng vẫn ghi streak
# -------------------------------------------------------------
result_c = take_topic_test(token_b, 8)
print("\nCase (c) [Cùng ngày lần 2]:")
print(f"  correctAnswers: {result_c['correctAnswers']}")
print(f"  scorePercent:   {result_c['scorePercent']}%")
print(f"  xpAwarded:      {result_c['xpAwarded']} (Expected: 0 XP)")
assert result_c['xpAwarded'] == 0, f"Expected 0 XP but got {result_c['xpAwarded']}"

conn = get_db()
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT xp_total, streak_current, last_activity_date FROM users WHERE id = %s", (user_b_id,))
u_b = cur.fetchone()
print(f"  users.xp_total:        {u_b['xp_total']} (Unchanged: 4)")
print(f"  users.streak_current:  {u_b['streak_current']} (Streak recorded: >= 1)")
print(f"  last_activity_date:    {u_b['last_activity_date']}")

cur.execute("SELECT xp_earned, quiz_count FROM daily_learning_activities WHERE user_id = %s", (user_b_id,))
dla_b = cur.fetchone()
print(f"  dla.xp_earned:         {dla_b['xp_earned']} (XP unchanged: 4)")
print(f"  dla.quiz_count:        {dla_b['quiz_count']} (Quiz count incremented: 2)")
conn.close()

print("\nALL BRANCHES (a), (b), (c) VERIFIED SUCCESSFULLY AND ASSERTIONS PASSED!")
