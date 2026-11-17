import os
import pymysql
import json
from decimal import Decimal

pw = os.environ.get("DB_PASSWORD")
if not pw:
    raise RuntimeError("Missing required environment variable DB_PASSWORD")

conn = pymysql.connect(host="localhost", port=3306, user="root", password=pw, database="lela_db")
c = conn.cursor(pymysql.cursors.DictCursor)

def default_json(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

# 1. Raw breakdown for decks 1001, 1004, 1005, 1006, 1007
print("=== 1. RAW BREAKDOWN FOR DECKS 1001, 1004, 1005, 1006, 1007 ===")
c.execute("""
    SELECT deck_id, COALESCE(part_of_speech, '(NULL)') as pos, COUNT(*) as card_count
    FROM flashcards
    WHERE deck_id IN (1001, 1004, 1005, 1006, 1007) AND is_active = 1 AND deleted_at IS NULL
    GROUP BY deck_id, part_of_speech
    ORDER BY deck_id, card_count DESC
""")
rows_target = c.fetchall()
print(json.dumps(rows_target, indent=2, default=default_json))

# 2. Raw breakdown for the 13 decks (100% single-POS)
print("\n=== 2. RAW BREAKDOWN FOR THE 13 DECKS (100% same POS) ===")
c.execute("""
    SELECT deck_id, COALESCE(part_of_speech, '(NULL)') as pos, COUNT(*) as card_count
    FROM flashcards
    WHERE deck_id IN (8, 9, 10, 2001, 2003, 2005, 2007, 2008, 2009, 2011, 2012, 2014, 2015)
      AND is_active = 1 AND deleted_at IS NULL
    GROUP BY deck_id, part_of_speech
    ORDER BY deck_id
""")
rows_13 = c.fetchall()
print(json.dumps(rows_13, indent=2, default=default_json))

# 3. All decks with >= 90% cards of a single POS
print("\n=== 3. ALL DECKS WITH >= 90% OF A SINGLE POS ===")
c.execute("""
    SELECT 
        d.id as deck_id,
        d.title as deck_title,
        totals.total_cards,
        top_pos.part_of_speech as dominant_pos,
        top_pos.pos_count,
        ROUND(top_pos.pos_count * 100.0 / totals.total_cards, 1) as dominant_pct
    FROM decks d
    JOIN (
        SELECT deck_id, COUNT(*) as total_cards
        FROM flashcards
        WHERE is_active = 1 AND deleted_at IS NULL
        GROUP BY deck_id
    ) totals ON d.id = totals.deck_id
    JOIN (
        SELECT f1.deck_id, f1.part_of_speech, COUNT(*) as pos_count
        FROM flashcards f1
        WHERE f1.is_active = 1 AND f1.deleted_at IS NULL
        GROUP BY f1.deck_id, f1.part_of_speech
    ) top_pos ON d.id = top_pos.deck_id
    WHERE top_pos.pos_count * 100.0 / totals.total_cards >= 90.0
    ORDER BY dominant_pct DESC, d.id
""")
ninety_pct_decks = c.fetchall()
print(f"Total decks with >= 90% cards of a single POS: {len(ninety_pct_decks)}")
print(json.dumps(ninety_pct_decks, indent=2, default=default_json))

conn.close()
