import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("SELECT id, front_text, back_text FROM flashcards WHERE deck_id = 22 AND is_active=1 AND deleted_at IS NULL ORDER BY card_order")
cards = cur.fetchall()

seen = set()
unique = []
dupes = []
for c in cards:
    fn = c['front_text'].strip().lower()
    if fn in seen:
        dupes.append(c)
    else:
        seen.add(fn)
        unique.append(c)

print("Total cards:", len(cards))
print("Unique front_text:", len(unique))
print("Duplicates:", dupes)
