import os
import pymysql
import csv

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id")
all_active = cur.fetchall()

def is_valid_card(front, back):
    if not front or not back:
        return False
    f = front.strip()
    b = back.strip()
    if not f or not b:
        return False
    if "từ vựng thuộc nhóm" in b.lower() or "đang cập nhật" in b.lower():
        return False
    if "từ vựng thuộc nhóm" in f.lower() or "đang cập nhật" in f.lower():
        return False
    if len(f) > 60:
        return False
    return True

valid_cards = [c for c in all_active if is_valid_card(c['front_text'], c['back_text'])]
valid_ids = {c['id'] for c in valid_cards}
print("Total valid cards in DB:", len(valid_ids))

reviewed_ids = set()

# Batch 1
if os.path.exists("private-results/card_meaning_drafts_batch1.csv"):
    with open("private-results/card_meaning_drafts_batch1.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            cid = r.get('card_id', '').strip()
            if cid.isdigit():
                reviewed_ids.add(int(cid))

# Batch 1b (ids 20354 to 20362)
for i in range(20354, 20363):
    reviewed_ids.add(i)

# Batch 2 (704 lines)
if os.path.exists("private-results/batch2_704_lines.txt"):
    with open("private-results/batch2_704_lines.txt", "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split('|')
            if parts and parts[0].isdigit():
                reviewed_ids.add(int(parts[0]))

if os.path.exists("private-results/card_meaning_drafts_batch2_summary_review.csv"):
    with open("private-results/card_meaning_drafts_batch2_summary_review.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            cid = r.get('card_id', '').strip()
            if cid.isdigit():
                reviewed_ids.add(int(cid))

# The 35 cards reviewed
cards_35 = {10268, 10950, 11617, 20141, 20270, 20290, 20194, 883, 884, 885, 887, 898, 890, 892, 893, 912, 1119, 1096, 1104, 1093, 1059, 1064, 1001, 1002, 1117, 992, 993, 985, 979, 1035, 1041, 1077, 1085, 1114, 886}
reviewed_ids.update(cards_35)

print(f"Total distinct reviewed IDs in DB: {len(reviewed_ids & valid_ids)}")

unreviewed_valid_ids = valid_ids - reviewed_ids
print(f"Valid cards unreviewed count: {len(unreviewed_valid_ids)}")

conn.close()
