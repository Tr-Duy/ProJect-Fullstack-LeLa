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

print("=== FINAL REPORT DATA METRICS ===")

levels = [
    (1, "Level 1: Cơ bản (Dưới 500)"),
    (2, "Level 2: Trung bình - Khá (500 - 700)"),
    (3, "Level 3: Khá - Giỏi (700 - 850)"),
    (4, "Level 4: Xuất sắc (850 - 990)")
]

for lvl_id, name in levels:
    cur.execute("SELECT COUNT(*) AS cnt FROM decks WHERE level_id = %s AND deleted_at IS NULL", (lvl_id,))
    deck_cnt = cur.fetchone()['cnt']
    
    cur.execute("""
        SELECT 
            COUNT(*) AS total_quiz,
            SUM(CASE WHEN difficulty = 'EASY' THEN 1 ELSE 0 END) AS easy_cnt,
            SUM(CASE WHEN difficulty = 'MEDIUM' THEN 1 ELSE 0 END) AS med_cnt,
            SUM(CASE WHEN difficulty = 'HARD' THEN 1 ELSE 0 END) AS hard_cnt
        FROM quizzes
        WHERE level_id = %s AND quiz_category = 'NORMAL' AND deleted_at IS NULL
    """, (lvl_id,))
    q_stats = cur.fetchone()
    
    print(f"\n{name}:")
    print(f"  Deck count: {deck_cnt}")
    print(f"  Quiz count: {q_stats['total_quiz']}")
    print(f"  EASY (🟢 Dễ - 5 câu): {q_stats['easy_cnt']}")
    print(f"  MEDIUM (🟡 Vừa - 10 câu): {q_stats['med_cnt']}")
    print(f"  HARD (🔴 Khó - 15 câu): {q_stats['hard_cnt']}")

cur.execute("SELECT COUNT(*) AS cnt FROM decks WHERE level_id IS NULL AND deleted_at IS NULL")
unassigned_decks = cur.fetchone()['cnt']
cur.execute("SELECT COUNT(*) AS cnt FROM quizzes WHERE level_id IS NULL AND quiz_category = 'NORMAL' AND deleted_at IS NULL")
unassigned_quizzes = cur.fetchone()['cnt']
print(f"\nUnassigned / Basic Decks (level_id IS NULL):")
print(f"  Deck count: {unassigned_decks}")
print(f"  Quiz count: {unassigned_quizzes}")

cur.execute("SELECT COUNT(*) AS cnt FROM decks WHERE deleted_at IS NULL")
total_decks = cur.fetchone()['cnt']
cur.execute("SELECT COUNT(*) AS cnt FROM quizzes WHERE quiz_category = 'NORMAL' AND deleted_at IS NULL")
total_normal_quizzes = cur.fetchone()['cnt']
print(f"\nTỔNG THỐNG KÊ:")
print(f"  TOTAL DECKS: {total_decks}")
print(f"  TOTAL NORMAL QUIZZES: {total_normal_quizzes}")

cur.close()
cnx.close()
