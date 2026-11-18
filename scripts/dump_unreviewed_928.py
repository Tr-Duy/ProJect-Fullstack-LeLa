import os, pymysql, csv, json, re

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

# 1. Batch 1
batch1_ids = {10001, 10018, 10100, 10168, 10255, 10278, 10292, 10300, 10329, 10332, 10359}
# 2. Batch 1b
batch1b_ids = set(range(20354, 20363))
# 3. Batch 2
batch2_ids = set()
with open("private-results/card_meaning_drafts_batch2_summary_review.csv", "r", encoding="utf-8-sig") as fp:
    reader = csv.DictReader(fp)
    for r in reader:
        batch2_ids.add(int(r['card_id']))

# 4. Decks 22-36
cur.execute("SELECT id FROM flashcards WHERE deck_id BETWEEN 22 AND 36")
deck_22_36_ids = {r['id'] for r in cur.fetchall()}

all_reviewed_ids = batch1_ids | batch1b_ids | batch2_ids | deck_22_36_ids

cur.execute("""
    SELECT f.id, f.deck_id, f.front_text, f.back_text, f.part_of_speech, f.is_active, f.deleted_at
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE d.is_active = 1 AND d.deleted_at IS NULL
    ORDER BY f.deck_id, f.id
""")
all_cards = cur.fetchall()

cards_by_deck = {}
for c in all_cards:
    cards_by_deck.setdefault(c['deck_id'], []).append(c)

valid_qualified_cards = []
for did, dcards in cards_by_deck.items():
    seen_fronts = set()
    valid_list = []
    for c in dcards:
        if c['is_active'] == 1 and c['deleted_at'] is None:
            fn = c['front_text'].lower().strip() if c['front_text'] else ''
            bk = c['back_text'].strip() if c['back_text'] else ''
            if fn and bk and len(fn) > 1 and len(bk) > 1 and 'từ vựng thuộc nhóm' not in bk and 'đang cập nhật' not in bk:
                if not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', bk, re.I) and not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', fn, re.I):
                    if not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', bk, re.I) and not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', fn, re.I):
                        if not re.match(r'.*[<>={}].*', bk):
                            if fn not in seen_fronts:
                                seen_fronts.add(fn)
                                valid_list.append(c)
    if len(valid_list) >= 8:
        valid_qualified_cards.extend(valid_list)

unreviewed_valid_cards = [c for c in valid_qualified_cards if c['id'] not in all_reviewed_ids]
print(f"Total unreviewed valid cards: {len(unreviewed_valid_cards)}")

with open("private-results/unreviewed_928_cards.json", "w", encoding="utf-8") as fp:
    json.dump(unreviewed_valid_cards, fp, ensure_ascii=False, indent=2)

conn.close()
