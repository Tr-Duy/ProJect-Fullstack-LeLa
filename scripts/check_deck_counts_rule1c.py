import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

decks_to_check = [35, 36, 51, 53, 59]
for did in decks_to_check:
    cur.execute("""
        SELECT count(*) as total,
               SUM(CASE WHEN back_text NOT LIKE '%%từ vựng thuộc nhóm%%' THEN 1 ELSE 0 END) as valid
        FROM flashcards 
        WHERE deck_id = %s AND is_active=1 AND deleted_at IS NULL
    """, (did,))
    row = cur.fetchone()
    print(f"Deck {did}: total={row['total']}, current_valid={row['valid']}")
