import mysql.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db'
)
cur = cnx.cursor(dictionary=True)

print("=== TAGGING AUDIT REPORT (MANDATORY REQUIREMENT 5) ===")

cur.execute("SELECT COUNT(*) AS cnt FROM decks WHERE deleted_at IS NULL")
total_decks = cur.fetchone()['cnt']

cur.execute("SELECT COUNT(DISTINCT deck_id) AS cnt FROM deck_tags")
decks_with_tags = cur.fetchone()['cnt']
decks_without_tags = total_decks - decks_with_tags

cur.execute("SELECT COUNT(*) AS cnt FROM flashcards WHERE deleted_at IS NULL")
total_cards = cur.fetchone()['cnt']

cur.execute("SELECT COUNT(DISTINCT flashcard_id) AS cnt FROM flashcard_tags")
cards_with_tags = cur.fetchone()['cnt']
cards_without_tags = total_cards - cards_with_tags

cur.execute("SELECT COUNT(*) AS cnt FROM tags WHERE is_active = 1")
total_tags = cur.fetchone()['cnt']

cur.execute("SELECT COUNT(DISTINCT tag_id) AS cnt FROM deck_tags")
tags_in_use = cur.fetchone()['cnt']

print(f"  TỔNG SỐ DECKS: {total_decks}")
print(f"  DECKS CÓ ≥ 1 TAG: {decks_with_tags}")
print(f"  DECKS CHƯA CÓ TAG: {decks_without_tags}")
print(f"  TỔNG SỐ FLASHCARDS: {total_cards}")
print(f"  FLASHCARDS CÓ TAG: {cards_with_tags}")
print(f"  FLASHCARDS CHƯA CÓ TAG: {cards_without_tags}")
print(f"  TỔNG SỐ TAGS TRONG HỆ THỐNG: {total_tags}")
print(f"  SỐ TAGS ĐANG ĐƯỢC SỬ DỤNG: {tags_in_use}")

print("\n=== ACHIEVEMENTS SEED AUDIT ===")
cur.execute("SELECT COUNT(*) AS cnt FROM achievements")
total_ach = cur.fetchone()['cnt']
cur.execute("SELECT category, COUNT(*) AS cnt FROM achievements GROUP BY category ORDER BY category")
cat_breakdown = cur.fetchall()

print(f"  TỔNG SỐ ACHIEVEMENTS: {total_ach}")
print("  PHÂN BỐ THEO DANH MỤC (CATEGORIES):")
for cb in cat_breakdown:
    print(f"    - {cb['category']}: {cb['cnt']} achievements")

cur.close()
cnx.close()
