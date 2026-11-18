import os
import pymysql

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

# 1. Check learner1 user id
cur.execute("SELECT id, username, email FROM users WHERE username = 'learner1'")
learner1 = cur.fetchone()
print("learner1:", learner1)
uid = learner1['id']

# 2. Check deck_enrollments for deck 22
cur.execute("SELECT id, user_id, deck_id, status, topic_test_passed, topic_test_best_score FROM deck_enrollments WHERE user_id = %s AND deck_id = 22", (uid,))
enrollment_deck22 = cur.fetchall()
print(f"Enrollments deck 22 (count={len(enrollment_deck22)}):", enrollment_deck22)

# 3. Check card_progress for deck 22
cur.execute("""
    SELECT cp.id, cp.user_id, cp.card_id, f.deck_id, f.front_text, cp.state, cp.repetitions, cp.total_reviews, cp.last_reviewed_at
    FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = %s AND f.deck_id = 22
    ORDER BY cp.id
""", (uid,))
progress_deck22 = cur.fetchall()
print(f"card_progress deck 22 (count={len(progress_deck22)}):")
for r in progress_deck22:
    print("  ", r)

# 4. Check card_progress for decks 8, 10, 18
for d_id in [8, 10, 18]:
    cur.execute("""
        SELECT cp.id, cp.user_id, cp.card_id, f.deck_id, f.front_text, cp.state, cp.repetitions, cp.total_reviews, cp.last_reviewed_at
        FROM card_progress cp
        JOIN flashcards f ON cp.card_id = f.id
        WHERE cp.user_id = %s AND f.deck_id = %s
        ORDER BY cp.id
    """, (uid, d_id))
    rows = cur.fetchall()
    print(f"\n--- Deck {d_id} card_progress (count={len(rows)}) ---")
    for r in rows:
        print("  ", r)

conn.close()
