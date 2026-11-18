import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("SELECT id, deck_code, title FROM decks WHERE id BETWEEN 22 AND 36 ORDER BY id")
decks = cur.fetchall()
for d in decks:
    print(f"Deck {d['id']}: {d['deck_code']} - {d['title']}")
