import os
import pymysql

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

checks = [
    (1344, 51, 'Apprenticeship'),
    (1380, 53, 'Onboard'),
    (1477, 59, 'Experienced'),
]

for cid, did, new_front in checks:
    cur.execute("""
        SELECT id, deck_id, front_text, back_text, part_of_speech
        FROM flashcards
        WHERE deck_id = %s AND LOWER(TRIM(front_text)) = %s AND id != %s AND is_active = 1 AND deleted_at IS NULL
    """, (did, new_front.lower().strip(), cid))
    dups = cur.fetchall()
    print(f"Card {cid} (deck {did}) target front '{new_front}': duplicates found = {len(dups)}")
    for d in dups:
        print("  DUPLICATE:", d)

# Count 'noun' and 'adjective'
cur.execute("SELECT COUNT(*) AS cnt FROM flashcards WHERE part_of_speech = 'noun' AND is_active = 1 AND deleted_at IS NULL")
print("Active 'noun' cards:", cur.fetchone()['cnt'])

cur.execute("SELECT COUNT(*) AS cnt FROM flashcards WHERE part_of_speech = 'adjective' AND is_active = 1 AND deleted_at IS NULL")
print("Active 'adjective' cards:", cur.fetchone()['cnt'])

conn.close()
