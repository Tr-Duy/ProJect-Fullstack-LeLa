import os
import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3306,
    user='root',
    password=os.environ.get('DB_PASSWORD', '123456'),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

for did in [1034, 1060, 1101]:
    cur.execute('SELECT id, deck_id, front_text, back_text, part_of_speech, card_order FROM flashcards WHERE deck_id = %s ORDER BY card_order, id', (did,))
    rows = cur.fetchall()
    print(f"\n=== Deck {did} (Total cards: {len(rows)}) ===")
    for r in rows:
        print(f"  order={r['card_order']}: id={r['id']} | front='{r['front_text']}' | pos='{r['part_of_speech']}' | back='{r['back_text']}'")
