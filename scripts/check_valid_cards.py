import os
import pymysql
import re

def is_valid_card(front, back):
    if not front or not back:
        return False
    f = front.strip()
    b = back.strip()
    if not f or not b:
        return False
    # Placeholder checks
    if "từ vựng thuộc nhóm" in b.lower() or "đang cập nhật" in b.lower():
        return False
    if "từ vựng thuộc nhóm" in f.lower() or "đang cập nhật" in f.lower():
        return False
    # Suffix check or length
    if len(f) > 60:
        return False
    return True

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)
cur.execute("SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id")
cards = cur.fetchall()

valid_cards = [c for c in cards if is_valid_card(c['front_text'], c['back_text'])]
print(f"Total cards: {len(cards)}, Valid cards: {len(valid_cards)}")

# Check cards in private-results or previously reviewed
# Let's inspect private-results directory
conn.close()
