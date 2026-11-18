import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

print("=== USERS (learner1) ===")
cur.execute("SELECT id, username, xp_total, streak_current, streak_longest, last_activity_date, last_active_at FROM users WHERE id=3")
print(json.dumps(cur.fetchone(), default=str, indent=2))

print("\n=== DECK ENROLLMENTS (learner1) ===")
cur.execute("SELECT * FROM deck_enrollments WHERE user_id=3")
print(json.dumps(cur.fetchall(), default=str, indent=2))

print("\n=== CARD PROGRESS DECK 22 (learner1) ===")
cur.execute("""
    SELECT cp.*, f.front_text 
    FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id=3 AND f.deck_id=22
""")
deck22_cp = cur.fetchall()
print(f"Total card_progress in deck 22: {len(deck22_cp)}")
print("Sample row:", json.dumps(deck22_cp[0] if deck22_cp else {}, default=str, indent=2))

print("\n=== CHECK ANY USER ACTIVITIES / SRS REVIEWS LOGGED ===")
cur.execute("SHOW TABLES LIKE '%activity%'")
print("Activity tables:", cur.fetchall())
cur.execute("SHOW TABLES LIKE '%srs%'")
print("SRS tables:", cur.fetchall())
