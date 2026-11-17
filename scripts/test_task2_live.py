import urllib.request
import json
import os
import pymysql

pwd = os.environ.get('PLAYWRIGHT_PASSWORD', '123456')
db_pwd = os.environ.get('DB_PASSWORD')

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=db_pwd, database='lela_db')
cur = conn.cursor(pymysql.cursors.DictCursor)

username = 'test_proof_cap'
cur.execute('SELECT id FROM users WHERE username = %s', (username,))
u_old = cur.fetchone()
if u_old:
    uid = u_old['id']
    cur.execute('DELETE FROM card_progress WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM deck_enrollments WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM user_achievements WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM daily_learning_activities WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM user_roles WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM quiz_attempts WHERE user_id = %s', (uid,))
    cur.execute('DELETE FROM users WHERE id = %s', (uid,))
    conn.commit()

cur.execute("SELECT * FROM users WHERE username = 'learner1'")
base_user = cur.fetchone()

cur.execute('''
    INSERT INTO users (username, email, password_hash, full_name, status, timezone, daily_goal_cards, xp_total, streak_current, streak_longest, version, created_at, updated_at, current_exam_type_id, current_level_id)
    VALUES (%s, %s, %s, %s, %s, %s, 20, 0, 0, 0, 0, NOW(), NOW(), 1, 1)
''', (username, f'{username}@example.com', base_user['password_hash'], 'Proof User', 'ACTIVE', 'Asia/Ho_Chi_Minh'))
conn.commit()

cur.execute('SELECT id FROM users WHERE username = %s', (username,))
user_id = cur.fetchone()['id']
print('1. Created user:', user_id, username)

# Role assignment
cur.execute('INSERT INTO user_roles (user_id, role_id) VALUES (%s, 2)', (user_id,))
conn.commit()

# 2. Login to get token
req = urllib.request.Request('http://localhost:8080/api/v1/auth/login',
    data=json.dumps({'usernameOrEmail': username, 'password': pwd}).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read().decode())['data']['accessToken']
print('2. Logged in, token obtained')

# 3. Enroll in deck 18 and add 8 card_progress records
cur.execute("INSERT INTO deck_enrollments (user_id, deck_id, enrolled_at, status, created_at, updated_at, version) VALUES (%s, 18, NOW(), 'ACTIVE', NOW(), NOW(), 0)", (user_id,))
cur.execute('SELECT id FROM flashcards WHERE deck_id = 18 AND is_active = 1 LIMIT 8')
card_ids = [r['id'] for r in cur.fetchall()]
for cid in card_ids:
    cur.execute("INSERT INTO card_progress (user_id, card_id, state, repetitions, interval_days, ease_factor, due_at, created_at, updated_at, version) VALUES (%s, %s, 'REVIEW', 1, 1, 2.5, NOW(), NOW(), NOW(), 0)", (user_id, cid))
conn.commit()
print('3. Enrolled deck 18 with 8 learned cards')

# 4. Trigger achievements evaluate via GET /api/v1/achievements/my-progress
req = urllib.request.Request('http://localhost:8080/api/v1/achievements/my-progress',
    headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as resp:
    ach_res = json.loads(resp.read().decode())

cur.execute('SELECT xp_total FROM users WHERE id = %s', (user_id,))
print('4. User xp_total after achievement:', cur.fetchone()['xp_total'])

cur.execute('SELECT * FROM daily_learning_activities WHERE user_id = %s', (user_id,))
act = cur.fetchone()
print('   DailyLearningActivity xp_earned after achievement:', act['xp_earned'] if act else None)

# 5. Start topic test for deck 18
req = urllib.request.Request('http://localhost:8080/api/v1/deck-tests/18/start',
    data=b'',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    test_view = json.loads(resp.read().decode())['data']
attempt_id = test_view['attemptId']
print('5. Started topic test attempt:', attempt_id)

# 6. Event: answer 8 questions
import uuid

for i in range(8):
    req_id1 = str(uuid.uuid4())
    ev1 = {'action': 'BEGIN', 'index': i, 'requestId': req_id1}
    ev_req1 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
        data=json.dumps(ev1).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(ev_req1) as r1:
        view1 = json.loads(r1.read().decode())['data']
    
    # Query correct option from DB for the question at this screen
    conn.commit()
    cur.execute('SELECT payload FROM timed_quiz_states WHERE attempt_id = %s', (attempt_id,))
    state = json.loads(cur.fetchone()['payload'])
    screen = state['screens'][i]
    ans = screen['solution'].get('answer')
    
    req_id2 = str(uuid.uuid4())
    ev2 = {'action': 'ANSWER', 'index': i, 'leftId': ans, 'requestId': req_id2}
    ev_req2 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
        data=json.dumps(ev2).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(ev_req2) as r2:
        view2 = json.loads(r2.read().decode())['data']

    req_id3 = str(uuid.uuid4())
    ev3 = {'action': 'NEXT', 'index': i, 'requestId': req_id3}
    ev_req3 = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/event',
        data=json.dumps(ev3).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(ev_req3) as r3:
        pass

req = urllib.request.Request(f'http://localhost:8080/api/v1/deck-tests/{attempt_id}/submit',
    data=json.dumps({'abandoned': False, 'answers': []}).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    sub_res = json.loads(resp.read().decode())['data']

print('6. Topic Test Result:')
print('   correctAnswers:', sub_res.get('correctAnswers'))
print('   scorePercent:', sub_res.get('scorePercent'))
print('   xpAwarded:', sub_res.get('xpAwarded'))

cur.execute('SELECT xp_total FROM users WHERE id = %s', (user_id,))
print('7. User final xp_total:', cur.fetchone()['xp_total'])
cur.execute('SELECT * FROM daily_learning_activities WHERE user_id = %s', (user_id,))
print('   Final DailyLearningActivity xp_earned:', cur.fetchone()['xp_earned'])

conn.close()
