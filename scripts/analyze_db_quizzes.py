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

print("=== 1. DECK SUMMARY BY LEVEL ===")
cur.execute("""
SELECT 
    d.level_id, 
    pl.code AS level_code, 
    pl.name AS level_name, 
    COUNT(DISTINCT d.id) AS total_decks
FROM decks d 
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id 
WHERE d.is_active = 1 OR d.is_active IS NULL
GROUP BY d.level_id, pl.code, pl.name 
ORDER BY d.level_id
""")
levels_summary = cur.fetchall()
for l in levels_summary:
    print(l)

print("\n=== 2. QUIZZES PER DECK ANALYSIS ===")
cur.execute("""
SELECT 
    d.id AS deck_id, 
    d.deck_code,
    d.title AS deck_title, 
    d.level_id AS deck_level, 
    pl.name AS level_name,
    COUNT(DISTINCT f.id) AS card_count,
    COUNT(DISTINCT q.id) AS quiz_count
FROM decks d
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id
LEFT JOIN flashcards f ON f.deck_id = d.id AND (f.deleted_at IS NULL)
LEFT JOIN quizzes q ON q.deck_id = d.id AND q.quiz_category = 'NORMAL' AND (q.deleted_at IS NULL)
WHERE (d.deleted_at IS NULL)
GROUP BY d.id, d.deck_code, d.title, d.level_id, pl.name
ORDER BY d.level_id, d.id
""")
deck_rows = cur.fetchall()

print(f"Total active decks: {len(deck_rows)}")
by_level = {}
for r in deck_rows:
    lvl = r['deck_level']
    if lvl not in by_level:
        by_level[lvl] = {'decks': 0, 'quizzes': 0, 'cards': 0, 'deck_quiz_counts': {}}
    by_level[lvl]['decks'] += 1
    by_level[lvl]['quizzes'] += r['quiz_count']
    by_level[lvl]['cards'] += r['card_count']
    qc = r['quiz_count']
    by_level[lvl]['deck_quiz_counts'][qc] = by_level[lvl]['deck_quiz_counts'].get(qc, 0) + 1

for lvl, data in by_level.items():
    print(f"Level {lvl}: Decks={data['decks']}, Total Normal Quizzes={data['quizzes']}, Total Cards={data['cards']}, Deck Quiz Count Breakdown={data['deck_quiz_counts']}")

print("\n=== 3. CHECKING EXISTING NORMAL QUIZZES ===")
cur.execute("""
SELECT 
    q.id, q.deck_id, d.title AS deck_title, q.quiz_code, q.title, q.total_questions, q.pass_score, q.level_id, d.level_id AS deck_level_id
FROM quizzes q
JOIN decks d ON q.deck_id = d.id
WHERE q.quiz_category = 'NORMAL'
ORDER BY d.level_id, q.deck_id, q.id
""")
normal_quizzes = cur.fetchall()
print(f"Total NORMAL quizzes: {len(normal_quizzes)}")

pass_scores = {}
question_counts = {}
for q in normal_quizzes:
    ps = float(q['pass_score'])
    tq = q['total_questions']
    pass_scores[ps] = pass_scores.get(ps, 0) + 1
    question_counts[tq] = question_counts.get(tq, 0) + 1

print("Pass score distribution in existing NORMAL quizzes:", pass_scores)
print("Question count distribution in existing NORMAL quizzes:", question_counts)

print("\n=== 4. CHECKING COLUMNS ON QUIZZES TABLE ===")
cur.execute("SHOW COLUMNS FROM quizzes")
cols = [r['Field'] for r in cur.fetchall()]
print("Quizzes columns:", cols)

cur.close()
cnx.close()
