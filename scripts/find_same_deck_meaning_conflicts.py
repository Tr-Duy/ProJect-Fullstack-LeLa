import os, pymysql, re, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

def extract_senses(back):
    if not back:
        return set()
    parts = re.split(r'[,;]', back)
    senses = set()
    for p in parts:
        clean = re.sub(r'[\(\)\[\]\.!?"\'~/|`]', ' ', p.lower()).strip()
        clean = re.sub(r'\s+', ' ', clean)
        if clean:
            senses.add(clean)
    return senses

# Get active cards of qualified decks
cur.execute("""
    SELECT f.id, f.deck_id, d.title as deck_title, f.front_text, f.back_text, f.part_of_speech
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE f.is_active=1 AND f.deleted_at IS NULL AND f.back_text NOT LIKE '%%từ vựng thuộc nhóm%%'
    ORDER BY f.deck_id, f.id
""")
cards = cur.fetchall()

by_deck = {}
for c in cards:
    by_deck.setdefault(c['deck_id'], []).append(c)

conflicts_by_deck = []
for did, deck_cards in by_deck.items():
    if len(deck_cards) < 8:
        continue
    deck_title = deck_cards[0]['deck_title']
    for i in range(len(deck_cards)):
        senses_i = extract_senses(deck_cards[i]['back_text'])
        for j in range(i + 1, len(deck_cards)):
            senses_j = extract_senses(deck_cards[j]['back_text'])
            common = senses_i.intersection(senses_j)
            if common:
                conflicts_by_deck.append({
                    'deck_id': did,
                    'deck_title': deck_title,
                    'card1_id': deck_cards[i]['id'],
                    'card1_front': deck_cards[i]['front_text'],
                    'card1_back': deck_cards[i]['back_text'],
                    'card2_id': deck_cards[j]['id'],
                    'card2_front': deck_cards[j]['front_text'],
                    'card2_back': deck_cards[j]['back_text'],
                    'common_senses': list(common)
                })

print(f"Total decks scanned: {len(by_deck)}")
print(f"Total conflicting pairs in same deck: {len(conflicts_by_deck)}")
for c in conflicts_by_deck[:30]:
    print(f"Deck {c['deck_id']} ({c['deck_title']}): Card {c['card1_id']} '{c['card1_front']}' vs Card {c['card2_id']} '{c['card2_front']}' -> Common: {c['common_senses']}")
