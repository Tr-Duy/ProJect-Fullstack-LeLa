import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT d.id as deck_id, d.title as deck_title, f.id as card_id, f.front_text, f.back_text, f.part_of_speech, f.phonetic, f.example_text
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE f.deck_id BETWEEN 22 AND 36 AND f.is_active=1 AND f.deleted_at IS NULL
    ORDER BY f.deck_id, f.card_order, f.id
""")
cards = cur.fetchall()

with open("private-results/cards_22_36_dump.json", "w", encoding="utf-8") as fp:
    json.dump(cards, fp, ensure_ascii=False, indent=2)

print(f"Dumped {len(cards)} cards from decks 22-36")
