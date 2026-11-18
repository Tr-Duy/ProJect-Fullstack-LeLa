import os
import pymysql
from datetime import datetime

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_enrollment_table = f"deck_enrollments_backup_learner1_deck22_{timestamp}"
backup_progress_table = f"card_progress_backup_learner1_deck22_{timestamp}"

# Check user id
cur.execute("SELECT id, username FROM users WHERE username = 'learner1'")
u = cur.fetchone()
uid = u['id']

print(f"Creating backup tables with timestamp: {timestamp}")
cur.execute(f"CREATE TABLE {backup_enrollment_table} AS SELECT * FROM deck_enrollments WHERE id = 101 AND user_id = {uid} AND deck_id = 22")
cur.execute(f"""
    CREATE TABLE {backup_progress_table} AS
    SELECT cp.*
    FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = {uid} AND f.deck_id = 22
""")

cur.execute(f"SELECT COUNT(*) as cnt FROM {backup_enrollment_table}")
cnt_enr = cur.fetchone()['cnt']
cur.execute(f"SELECT COUNT(*) as cnt FROM {backup_progress_table}")
cnt_prog = cur.fetchone()['cnt']
print(f"Backed up: {cnt_enr} enrollment rows into {backup_enrollment_table}, {cnt_prog} card_progress rows into {backup_progress_table}")

# Delete from card_progress
cur.execute(f"""
    DELETE cp FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = {uid} AND f.deck_id = 22
""")
del_prog = cur.rowcount

# Delete from deck_enrollments
cur.execute(f"DELETE FROM deck_enrollments WHERE id = 101 AND user_id = {uid} AND deck_id = 22")
del_enr = cur.rowcount

conn.commit()
print(f"Deleted {del_prog} rows from card_progress and {del_enr} rows from deck_enrollments")

# Verify deck 22 status for learner1
cur.execute("SELECT COUNT(*) as cnt FROM deck_enrollments WHERE user_id = %s AND deck_id = 22", (uid,))
remaining_enr = cur.fetchone()['cnt']
cur.execute("""
    SELECT COUNT(*) as cnt FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = %s AND f.deck_id = 22
""", (uid,))
remaining_prog = cur.fetchone()['cnt']
print(f"Verification: remaining enrollments for deck 22 = {remaining_enr}, remaining progress = {remaining_prog}")

conn.close()
