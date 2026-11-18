import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT id, front_text, back_text, part_of_speech, phonetic, example_text 
    FROM flashcards 
    WHERE deck_id = 22 AND is_active=1 AND deleted_at IS NULL
    ORDER BY card_order, id
""")
cards = cur.fetchall()
for c in cards:
    print(f"ID={c['id']} | {c['front_text']} ({c['part_of_speech']}): {c['back_text']}")
