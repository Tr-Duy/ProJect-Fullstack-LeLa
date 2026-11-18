import os
import mysql.connector

db_password = os.environ.get('DB_PASSWORD')
if not db_password:
    raise RuntimeError("Missing required environment variable: DB_PASSWORD")

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password=db_password,
    database=os.environ.get('DB_NAME', 'lela_db')
)
cur = cnx.cursor(dictionary=True)

test_user = os.environ.get('TEST_USER') or os.environ.get('TEST_USERNAME') or 'admin'

queries = [
    ("FINAL quizzes", "SELECT q.id, q.quiz_code, q.title, q.quiz_category, q.exam_type_id, q.level_id, q.is_active FROM quizzes q WHERE q.quiz_category = 'FINAL' ORDER BY q.id LIMIT 50"),
    ("Proficiency levels", "SELECT id, name, min_score, max_score, exam_type_id FROM proficiency_levels ORDER BY exam_type_id, min_score"),
    (f"User {test_user}", f"SELECT u.id, u.username, u.current_level_id, u.current_exam_type_id, pl.name AS current_level_name, et.name AS current_exam_type_name FROM users u LEFT JOIN proficiency_levels pl ON u.current_level_id = pl.id LEFT JOIN exam_types et ON u.current_exam_type_id = et.id WHERE u.username = '{test_user}'"),
]

for title, query in queries:
    print(f"\n=== {title} ===")
    cur.execute(query)
    for row in cur.fetchall():
        print(row)

cur.close()
cnx.close()
