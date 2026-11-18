import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT deck_id, count(*) as total,
           SUM(CASE WHEN back_text NOT LIKE '%từ vựng thuộc nhóm%' THEN 1 ELSE 0 END) as valid
    FROM flashcards 
    WHERE deck_id BETWEEN 22 AND 36 AND is_active=1 AND deleted_at IS NULL
    GROUP BY deck_id
    ORDER BY deck_id
""")
rows = cur.fetchall()
for r in rows:
    print(f"Deck {r['deck_id']}: total={r['total']}, valid={r['valid']}")
