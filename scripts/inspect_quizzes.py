import mysql.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='flashcard_platfom'
)
cur = cnx.cursor(dictionary=True)

print("=== PROFICIENCY LEVELS ===")
cur.execute("SELECT id, code, name, min_score, max_score FROM proficiency_levels ORDER BY id")
for r in cur.fetchall():
    print(r)

print("\n=== DECK STATS BY LEVEL ===")
cur.execute("""
SELECT 
    d.level_id, 
    pl.code AS level_code, 
    pl.name AS level_name, 
    COUNT(d.id) AS deck_count 
FROM decks d 
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id 
GROUP BY d.level_id, pl.code, pl.name 
ORDER BY d.level_id
""")
for r in cur.fetchall():
    print(r)

print("\n=== ALL DECKS ===")
cur.execute("""
SELECT d.id, d.deck_code, d.title, d.level_id, pl.name as level_name, d.total_cards
FROM decks d
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id
ORDER BY d.level_id, d.id
""")
decks = cur.fetchall()
for d in decks:
    print(f"Deck ID: {d['id']}, Code: {d['deck_code']}, Title: '{d['title']}', LevelId: {d['level_id']} ({d['level_name']}), Cards: {d['total_cards']}")

print("\n=== QUIZ CATEGORIES ===")
cur.execute("SELECT quiz_category, COUNT(*) AS c FROM quizzes GROUP BY quiz_category")
for r in cur.fetchall():
    print(r)

print("\n=== ALL QUIZZES ===")
cur.execute("""
SELECT q.id, q.deck_id, d.title AS deck_title, q.quiz_code, q.title, q.quiz_category, q.total_questions, q.pass_score, q.level_id
FROM quizzes q
LEFT JOIN decks d ON q.deck_id = d.id
ORDER BY q.id
""")
quizzes = cur.fetchall()
for q in quizzes:
    print(f"Quiz ID: {q['id']}, DeckID: {q['deck_id']} ('{q['deck_title']}'), Code: {q['quiz_code']}, Category: {q['quiz_category']}, Title: '{q['title']}', Qs: {q['total_questions']}, Pass: {q['pass_score']}, LevelId: {q['level_id']}")

cur.close()
cnx.close()
