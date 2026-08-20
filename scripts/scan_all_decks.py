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

cur.execute("""
SELECT 
    d.id,
    d.deck_code,
    d.title,
    d.level_id,
    d.topic_id,
    pl.code AS level_code,
    pl.name AS level_name,
    (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id AND f.deleted_at IS NULL) AS card_count,
    (SELECT COUNT(*) FROM quizzes q WHERE q.deck_id = d.id AND q.quiz_category = 'NORMAL' AND q.deleted_at IS NULL) AS quiz_count
FROM decks d
LEFT JOIN proficiency_levels pl ON d.level_id = pl.id
WHERE d.deleted_at IS NULL
ORDER BY d.level_id, d.id
""")

decks = cur.fetchall()
print(f"TOTAL DECKS SCANNED: {len(decks)}")

level_counts = {}
missing_quiz_decks = []
exact_3_quiz_decks = []
other_quiz_decks = []

for d in decks:
    lvl = d['level_id']
    level_counts[lvl] = level_counts.get(lvl, 0) + 1
    qc = d['quiz_count']
    if qc == 3:
        exact_3_quiz_decks.append(d)
    elif qc < 3:
        missing_quiz_decks.append(d)
    else:
        other_quiz_decks.append(d)

print(f"\nDECK BREAKDOWN BY LEVEL: {level_counts}")
print(f"Decks with EXACT 3 quizzes: {len(exact_3_quiz_decks)}")
print(f"Decks with LESS THAN 3 quizzes (MISSING): {len(missing_quiz_decks)}")
print(f"Decks with MORE THAN 3 quizzes: {len(other_quiz_decks)}")

print("\n--- SAMPLE DECKS WITH MISSING QUIZZES ---")
for d in missing_quiz_decks[:20]:
    print(f"Deck #{d['id']} [{d['deck_code']}] Level={d['level_id']} ({d['level_name']}) Cards={d['card_count']} NormalQuizzes={d['quiz_count']} Title='{d['title']}'")

print("\n--- DECKS WITH OTHER QUIZ COUNTS (>3) ---")
for d in other_quiz_decks:
    print(f"Deck #{d['id']} [{d['deck_code']}] Level={d['level_id']} ({d['level_name']}) Cards={d['card_count']} NormalQuizzes={d['quiz_count']} Title='{d['title']}'")

cur.close()
cnx.close()
