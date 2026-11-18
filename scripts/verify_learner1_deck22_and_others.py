import os
import pymysql

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

cur.execute("SELECT id, username FROM users WHERE username = 'learner1'")
u = cur.fetchone()
uid = u['id']

# Check enrollment on deck 22
cur.execute("SELECT * FROM deck_enrollments WHERE user_id = %s AND deck_id = 22", (uid,))
enr = cur.fetchall()
print(f"Deck 22 enrollment for learner1 (count={len(enr)}): {enr}")

# Check card_progress on deck 22
cur.execute("""
    SELECT cp.* FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = %s AND f.deck_id = 22
""", (uid,))
prog = cur.fetchall()
print(f"Deck 22 card_progress for learner1 (count={len(prog)}): {prog}")

# Print card_progress for decks 8, 10, 18
print("\n=== VERBATIM CARD_PROGRESS FOR DECKS 8, 10, 18 OF LEARNER1 ===")
cur.execute("""
    SELECT cp.id, cp.user_id, f.deck_id, f.front_text, cp.state, cp.repetitions, cp.total_reviews, cp.last_reviewed_at
    FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = %s AND f.deck_id IN (8, 10, 18)
    ORDER BY f.deck_id, cp.id
""", (uid,))
rows = cur.fetchall()
print(f"{'ID':<6} | {'DECK':<5} | {'FRONT':<15} | {'STATE':<10} | {'REPS':<5} | {'REVIEWS':<8} | {'LAST_REVIEWED_AT'}")
print("-" * 75)
for r in rows:
    lra = str(r['last_reviewed_at']) if r['last_reviewed_at'] else 'NULL'
    print(f"{r['id']:<6} | {r['deck_id']:<5} | {r['front_text']:<15} | {r['state']:<10} | {r['repetitions']:<5} | {r['total_reviews']:<8} | {lra}")

conn.close()
