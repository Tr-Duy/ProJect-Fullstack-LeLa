import os
import pymysql
import json

db_pwd = os.environ.get('DB_PASSWORD', '')
conn = pymysql.connect(
    host='127.0.0.1', port=3306,
    user='root', password=db_pwd,
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

print("=== 1. VERIFY LEARNER1 PASSWORD HASH ===")
cur.execute("SELECT id, username, email, password_hash, status FROM users WHERE username='learner1'")
learner1 = cur.fetchone()
print("learner1:", json.dumps(learner1, default=str))

print("\n=== 2. AUDIT & CLEANUP ATTEMPTS 739, 740, 741 ===")
# Check questions
cur.execute("SELECT id FROM quiz_attempt_questions WHERE attempt_id IN (739, 740, 741)")
q_ids = [r['id'] for r in cur.fetchall()]
print(f"Found {len(q_ids)} questions for attempts 739-741")

# Delete options
if q_ids:
    format_strings = ','.join(['%s'] * len(q_ids))
    cur.execute(f"DELETE FROM quiz_attempt_options WHERE attempt_question_id IN ({format_strings})", tuple(q_ids))
    print(f"Deleted {cur.rowcount} attempt options")

# Delete questions
cur.execute("DELETE FROM quiz_attempt_questions WHERE attempt_id IN (739, 740, 741)")
print(f"Deleted {cur.rowcount} attempt questions")

# Delete timed_quiz_states
cur.execute("DELETE FROM timed_quiz_states WHERE attempt_id IN (739, 740, 741)")
print(f"Deleted {cur.rowcount} timed_quiz_states")

# Delete attempts
cur.execute("DELETE FROM quiz_attempts WHERE id IN (739, 740, 741)")
print(f"Deleted {cur.rowcount} quiz_attempts")

print("\n=== 3. CLEANUP ENROLLMENTS OF LEARNER1 FOR DECKS 1001 & 1002 ===")
cur.execute("DELETE FROM deck_enrollments WHERE user_id=%s AND deck_id IN (1001, 1002)", (learner1['id'],))
print(f"Deleted {cur.rowcount} deck_enrollments (decks 1001, 1002)")

print("\n=== 4. CLEANUP CARD PROGRESS OF LEARNER1 FOR DECKS 1001 & 1002 ===")
cur.execute("""
    DELETE cp FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = %s AND f.deck_id IN (1001, 1002)
""", (learner1['id'],))
print(f"Deleted {cur.rowcount} card_progress records (decks 1001, 1002)")

print("\n=== 5. CHECK REMAINING PROGRESS & ENROLLMENT FOR LEARNER1 ===")
cur.execute("SELECT id, deck_id, status, enrolled_at FROM deck_enrollments WHERE user_id=%s", (learner1['id'],))
print("Remaining enrollments:", json.dumps(cur.fetchall(), default=str))

cur.execute("""
    SELECT f.deck_id, count(*) as count 
    FROM card_progress cp 
    JOIN flashcards f ON cp.card_id = f.id 
    WHERE cp.user_id=%s 
    GROUP BY f.deck_id
""", (learner1['id'],))
print("Remaining card progress count by deck:", json.dumps(cur.fetchall(), default=str))

print("\n=== 6. CREATE DEDICATED QA USER: qa_topic_test_01 ===")
cur.execute("SELECT id FROM users WHERE username='qa_topic_test_01'")
existing_qa = cur.fetchone()
if not existing_qa:
    # Use standard bcrypt hash for '123456': $2a$10$70NHF6uEzsz.eR97n0I29..XrPftergfKlJwDR0AhQ.boDRn73ble
    cur.execute("""
        INSERT INTO users (username, email, password_hash, full_name, status, timezone, version, created_at, updated_at)
        VALUES ('qa_topic_test_01', 'qa_topic_test_01@lela.com', '$2a$10$70NHF6uEzsz.eR97n0I29..XrPftergfKlJwDR0AhQ.boDRn73ble',
                'QA Topic Test Account 01', 'ACTIVE', 'Asia/Ho_Chi_Minh', 0, NOW(), NOW())
    """)
    qa_id = cur.lastrowid
    print(f"Created user qa_topic_test_01 with id={qa_id}")
    cur.execute("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (%s, 2, NOW())", (qa_id,))
    print(f"Assigned role LEARNER (role_id=2) to qa_topic_test_01")
else:
    print(f"User qa_topic_test_01 already exists with id={existing_qa['id']}")

conn.commit()
conn.close()
print("\n=== DONE CLEANUP & QA USER SETUP ===")
