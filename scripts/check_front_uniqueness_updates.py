import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

checks = [
    (912, 23, 'shut down'),
    (1096, 35, 'fulfillment'),
    (1119, 36, 'prompt')
]

for cid, did, new_front in checks:
    cur.execute("""
        SELECT id, front_text, back_text 
        FROM flashcards 
        WHERE deck_id = %s AND LOWER(TRIM(front_text)) = %s AND id != %s AND is_active=1 AND deleted_at IS NULL
    """, (did, new_front, cid))
    dupes = cur.fetchall()
    print(f"Card {cid} in Deck {did} with new front '{new_front}': duplicates found = {len(dupes)}: {dupes}")
