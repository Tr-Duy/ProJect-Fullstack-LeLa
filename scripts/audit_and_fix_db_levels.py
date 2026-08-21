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

print("=== 1. PROFICIENCY LEVELS IN DB ===")
cur.execute("SELECT id, exam_type_id, code, name, min_score, max_score, display_order FROM proficiency_levels ORDER BY display_order, id")
levels = cur.fetchall()
for l in levels:
    print(l)

# Update level 2 name if it contains 650 or non-standard text
for l in levels:
    if l['id'] == 2 or 'INTERMEDIATE' in l['code']:
        cur.execute("""
            UPDATE proficiency_levels 
            SET name = 'Trung bình - Khá (500 - 700)', min_score = 500.00, max_score = 700.99 
            WHERE id = %s
        """, (l['id'],))
cnx.commit()

print("\n=== 2. FIXING DECK & QUIZ TITLES AND LEVEL_IDS ===")
# Replace 500-650 or 500–650 in deck titles with 500-700
cur.execute("UPDATE decks SET title = REPLACE(REPLACE(title, '500-650', '500-700'), '500–650', '500-700') WHERE title LIKE '%500-650%' OR title LIKE '%500–650%'")
# Replace 500-650 or 500–650 in quiz titles with 500-700
cur.execute("UPDATE quizzes SET title = REPLACE(REPLACE(title, '500-650', '500-700'), '500–650', '500-700') WHERE title LIKE '%500-650%' OR title LIKE '%500–650%'")

# Ensure all quizzes have level_id matching their deck's level_id
cur.execute("""
    UPDATE quizzes q
    JOIN decks d ON q.deck_id = d.id
    SET q.level_id = d.level_id
    WHERE q.quiz_category = 'NORMAL' AND (q.level_id IS NULL OR q.level_id <> d.level_id)
""")
cnx.commit()
print("Updated deck/quiz titles and synchronized quiz.level_id = deck.level_id!")

print("\n=== 3. DECK COUNT BY LEVEL ===")
cur.execute("""
SELECT
    d.level_id,
    pl.name AS level_name,
    COUNT(*) AS deck_count
FROM decks d
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id
WHERE d.deleted_at IS NULL
GROUP BY d.level_id, pl.name
ORDER BY d.level_id;
""")
for r in cur.fetchall():
    print(r)

print("\n=== 4. QUIZ COUNT BY LEVEL & DIFFICULTY ===")
cur.execute("""
SELECT
    q.level_id,
    pl.name AS level_name,
    q.difficulty,
    COUNT(*) AS quiz_count
FROM quizzes q
LEFT JOIN proficiency_levels pl ON q.level_id = pl.id
WHERE q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
GROUP BY q.level_id, pl.name, q.difficulty
ORDER BY q.level_id, q.difficulty;
""")
for r in cur.fetchall():
    print(r)

print("\n=== 5. CHECK IF ANY QUIZ HAS MISMATCHED LEVEL WITH ITS DECK ===")
cur.execute("""
SELECT
    d.id AS deck_id,
    d.title AS deck_title,
    d.level_id AS deck_level,
    q.id AS quiz_id,
    q.title AS quiz_title,
    q.level_id AS quiz_level
FROM decks d
JOIN quizzes q ON q.deck_id = d.id AND q.quiz_category = 'NORMAL'
WHERE d.level_id <> q.level_id OR (d.level_id IS NULL AND q.level_id IS NOT NULL) OR (d.level_id IS NOT NULL AND q.level_id IS NULL);
""")
mismatched = cur.fetchall()
print(f"Mismatched quiz/deck level_ids count: {len(mismatched)}")

print("\n=== 6. CHECK IF ANY DECK HAS QUIZ COUNT != 3 ===")
cur.execute("""
SELECT
    d.id,
    d.title,
    d.level_id,
    COUNT(q.id) AS quiz_count
FROM decks d
LEFT JOIN quizzes q ON q.deck_id = d.id AND q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.title, d.level_id
HAVING COUNT(q.id) <> 3;
""")
invalid_quiz_counts = cur.fetchall()
print(f"Decks missing 3 quizzes: {len(invalid_quiz_counts)}")

print("\n=== 7. CHECK DIFFICULTY BREAKDOWN PER DECK ===")
cur.execute("""
SELECT
    d.id,
    d.title,
    d.level_id,
    SUM(CASE WHEN q.difficulty = 'EASY' THEN 1 ELSE 0 END) AS easy_count,
    SUM(CASE WHEN q.difficulty = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
    SUM(CASE WHEN q.difficulty = 'HARD' THEN 1 ELSE 0 END) AS hard_count
FROM decks d
LEFT JOIN quizzes q ON q.deck_id = d.id AND q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.title, d.level_id
HAVING easy_count <> 1 OR medium_count <> 1 OR hard_count <> 1;
""")
invalid_difficulty_counts = cur.fetchall()
print(f"Decks without 1 EASY, 1 MEDIUM, 1 HARD: {len(invalid_difficulty_counts)}")

print("\n=== 8. QUESTION COUNT PER DIFFICULTY ===")
cur.execute("""
SELECT
    q.difficulty,
    MIN(t.q_count) AS min_qs,
    MAX(t.q_count) AS max_qs,
    COUNT(DISTINCT q.id) AS total_quizzes
FROM quizzes q
JOIN (
    SELECT quiz_id, COUNT(*) AS q_count
    FROM quiz_questions
    GROUP BY quiz_id
) t ON t.quiz_id = q.id
WHERE q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL
GROUP BY q.difficulty;
""")
for r in cur.fetchall():
    print(r)

cur.close()
cnx.close()
