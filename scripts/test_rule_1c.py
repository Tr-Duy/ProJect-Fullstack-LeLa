import os, pymysql, re, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT f.id, f.deck_id, d.title as deck_title, f.front_text, f.back_text, f.part_of_speech
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE f.is_active=1 AND f.deleted_at IS NULL
    ORDER BY f.deck_id, f.id
""")
cards = cur.fetchall()

flagged = []
pos_tokens = {'adj', 'adj.', 'adv', 'adv.', 'gerund', 'v.', 'v', 'n.', 'n'}

for c in cards:
    front = c['front_text'].strip() if c['front_text'] else ''
    words = front.split()
    
    reasons = []
    if len(front) > 40:
        reasons.append(f"len={len(front)} > 40")
    if len(words) > 4:
        reasons.append(f"words={len(words)} > 4")
    
    # Check pos tokens after first word
    if len(words) > 1:
        for idx, w in enumerate(words[1:], start=1):
            w_clean = re.sub(r'[\(\)\[\],;]', '', w.lower())
            if w_clean in pos_tokens:
                reasons.append(f"pos_token='{w}' at word {idx+1}")
                break
                
    if reasons:
        c['reasons'] = reasons
        flagged.append(c)

print(f"Total active cards scanned: {len(cards)}")
print(f"Total cards flagged by rule 1c: {len(flagged)}")
for f in flagged:
    print(f"ID={f['id']} | Deck {f['deck_id']} ({f['deck_title']}) | front='{f['front_text']}' | reasons={f['reasons']}")
