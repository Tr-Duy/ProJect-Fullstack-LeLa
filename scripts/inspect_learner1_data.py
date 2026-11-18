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

# Check user learner1
cur.execute("SELECT id, username, email, password_hash, status, deleted_at FROM users WHERE username='learner1'")
u = cur.fetchall()
print("LEARNER1:", json.dumps(u, default=str))

# Check attempts 739, 740, 741
cur.execute("""
    SELECT qa.id, qa.user_id, q.deck_id, qa.status, qa.total_questions, qa.score_percent, qa.started_at, qa.submitted_at 
    FROM quiz_attempts qa 
    LEFT JOIN quizzes q ON qa.quiz_id = q.id 
    WHERE qa.id IN (739, 740, 741)
""")
att = cur.fetchall()
print("ATTEMPTS 739-741:", json.dumps(att, default=str))

# Check all quiz_attempts for learner1
cur.execute("""
    SELECT qa.id, qa.user_id, q.deck_id, qa.status, qa.total_questions, qa.score_percent, qa.started_at, qa.submitted_at 
    FROM quiz_attempts qa 
    LEFT JOIN quizzes q ON qa.quiz_id = q.id 
    WHERE qa.user_id=3 
    ORDER BY qa.id DESC
""")
att_all = cur.fetchall()
print("ALL ATTEMPTS USER 3:", json.dumps(att_all, default=str))

# Check deck_enrollments for learner1
cur.execute("SELECT id, user_id, deck_id, status, enrolled_at FROM deck_enrollments WHERE user_id=3 ORDER BY deck_id")
enr = cur.fetchall()
print("ENROLLMENTS USER 3:", json.dumps(enr, default=str))

# Check card_progress for learner1
cur.execute("""
    SELECT f.deck_id, count(*) as count 
    FROM card_progress cp 
    JOIN flashcards f ON cp.card_id = f.id 
    WHERE cp.user_id=3 
    GROUP BY f.deck_id
""")
cp = cur.fetchall()
print("CARD PROGRESS COUNT BY DECK:", json.dumps(cp, default=str))

# Check qa_topic_test_01
cur.execute("SELECT id, username, email, status FROM users WHERE username='qa_topic_test_01'")
qa = cur.fetchall()
print("QA USER:", json.dumps(qa, default=str))
