import os, pymysql, csv, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

# Get reviewed IDs
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
print(f"Total reviewed IDs: {len(all_reviewed_ids)} (Batch 1: {len(batch1_ids)}, Batch 1b: {len(batch1b_ids)}, Batch 2: {len(batch2_ids)}, Decks 22-36: {len(deck_22_36_ids)})")

# Check all valid cards in the 166 qualified decks
import re
cur.execute("""
    SELECT f.id, f.deck_id, f.front_text, f.back_text, f.is_active, f.deleted_at, f.created_at
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

print(f"Total valid cards in qualified decks: {len(valid_qualified_cards)}")

unreviewed_valid_cards = [c for c in valid_qualified_cards if c['id'] not in all_reviewed_ids]
print(f"Total UNREVIEWED valid cards in qualified decks: {len(unreviewed_valid_cards)}")

# Check ID ranges / sources of unreviewed cards
# Let's inspect ID ranges of unreviewed cards
ranges = {}
for c in unreviewed_valid_cards:
    cid = c['id']
    did = c['deck_id']
    # Check deck code / migration
    ranges[did] = ranges.get(did, 0) + 1

print(f"Unreviewed cards spread across {len(ranges)} decks")

# Let's check which migrations seeded these cards:
# V33: decks 19..73 (TOEIC decks split from DECK-TOEIC-600)
# V38: decks 1001..1100 (Oxford 3000 / 5000)
# V40: decks 2001..2050 (IELTS)
# V5: decks 1, 2, 3
# V17/V20: other decks
sources = {'V33_toeic': 0, 'V38_oxford_first8': 0, 'V40_ielts': 0, 'V5_basic': 0, 'other': 0}
for c in unreviewed_valid_cards:
    cid = c['id']
    did = c['deck_id']
    if 19 <= did <= 73:
        sources['V33_toeic'] += 1
    elif 1001 <= did <= 1100:
        sources['V38_oxford_first8'] += 1
    elif 2001 <= did <= 2050:
        sources['V40_ielts'] += 1
    elif did in [1, 2, 3]:
        sources['V5_basic'] += 1
    else:
        sources['other'] += 1

print("Sources breakdown:", sources)
