import mysql.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db'
)
cur = cnx.cursor(dictionary=True)

print("=== 1. DECK QUIZ COUNT VALIDATION (EXPECTED: 0 ROWS WITH QUIZ_COUNT != 3) ===")
cur.execute("""
SELECT
    d.id,
    d.title,
    d.level_id,
    COUNT(DISTINCT q.id) AS quiz_count
FROM decks d
LEFT JOIN quizzes q
    ON q.deck_id = d.id
   AND q.quiz_category = 'NORMAL'
   AND q.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.title, d.level_id
HAVING COUNT(DISTINCT q.id) <> 3;
""")
invalid_quiz_counts = cur.fetchall()
print(f"Decks with quiz_count != 3: {len(invalid_quiz_counts)}")
for r in invalid_quiz_counts:
    print(r)

print("\n=== 2. DIFFICULTY VALIDATION PER DECK (EXPECTED: EASY=1, MEDIUM=1, HARD=1 FOR ALL DECKS) ===")
cur.execute("""
SELECT
    q.difficulty,
    COUNT(*) AS count
FROM quizzes q
WHERE q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
GROUP BY q.difficulty;
""")
for r in cur.fetchall():
    print(r)

print("\n=== 3. QUESTION COUNT VALIDATION PER DIFFICULTY (EXPECTED: EASY=5, MEDIUM=10, HARD=15) ===")
cur.execute("""
SELECT
    q.difficulty,
    COUNT(qq.id) / COUNT(DISTINCT q.id) AS avg_questions_per_quiz,
    MIN(t.q_count) AS min_qs,
    MAX(t.q_count) AS max_qs
FROM quizzes q
JOIN (
    SELECT quiz_id, COUNT(*) AS q_count
    FROM quiz_questions
    GROUP BY quiz_id
) t ON t.quiz_id = q.id
JOIN quiz_questions qq ON qq.quiz_id = q.id
WHERE q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
GROUP BY q.difficulty;
""")
for r in cur.fetchall():
    print(r)

print("\n=== 4. PASS SCORE THRESHOLD VALIDATION (EXPECTED: ALL 70.00) ===")
cur.execute("""
SELECT pass_score, COUNT(*) AS count
FROM quizzes
WHERE quiz_category = 'NORMAL' AND deleted_at IS NULL
GROUP BY pass_score;
""")
for r in cur.fetchall():
    print(r)

print("\n=== 5. LEVEL BREAKDOWN OF NORMAL QUIZZES ===")
cur.execute("""
SELECT
    d.level_id,
    pl.name AS level_name,
    COUNT(DISTINCT d.id) AS deck_count,
    COUNT(DISTINCT q.id) AS quiz_count
FROM decks d
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id
LEFT JOIN quizzes q ON q.deck_id = d.id AND q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.level_id, pl.name
ORDER BY d.level_id;
""")
for r in cur.fetchall():
    print(r)

cur.close()
cnx.close()
