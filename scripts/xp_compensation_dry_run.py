import pymysql
import os

db_pwd = os.environ.get('DB_PASSWORD', '123456')
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=db_pwd, database='lela_db')
cur = conn.cursor(pymysql.cursors.DictCursor)

# Fix timestamp: commit 2317b85 deployed at 2026-11-17 14:18:20
FIX_TIMESTAMP = '2026-11-17 14:18:20'

print("=" * 80)
print(f"XP COMPENSATION AUDIT & DRY-RUN SCRIPT")
print(f"Filter: Achievements unlocked BEFORE fix timestamp: {FIX_TIMESTAMP}")
print(f"Excluding test accounts (vocabfix*, dashqa*, test_*, voicecheck*, etc.)")
print("=" * 80)

query = """
SELECT u.id, u.username, u.email, u.xp_total,
       COALESCE((SELECT SUM(dla.xp_earned) FROM daily_learning_activities dla WHERE dla.user_id = u.id), 0) AS sum_dla_xp,
       COALESCE((
           SELECT SUM(a.xp_reward)
           FROM user_achievements ua
           JOIN achievements a ON ua.achievement_id = a.id
           WHERE ua.user_id = u.id AND ua.unlocked_at <= '2026-11-17 14:18:20'
       ), 0) AS uncredited_ach_xp
FROM users u
WHERE u.username NOT LIKE 'vocabfix%'
  AND u.username NOT LIKE 'dashqa%'
  AND u.username NOT LIKE 'test_%'
  AND u.username NOT LIKE 'voicecheck%'
  AND u.username NOT LIKE 'voiceprobe%'
  AND u.username NOT LIKE 'vocabprobe%'
  AND u.username NOT LIKE 'quizregression%'
ORDER BY u.id;
"""

cur.execute(query)
rows = cur.fetchall()

print(f"{'User ID':<8} {'Username':<20} {'xp_total':<10} {'sum(DLA)':<10} {'Diff(Old)':<10} {'Bù (Ach XP)':<12} {'xp_new':<10} {'Diff(New)':<10}")
print("-" * 94)

total_compensation = 0
affected_users = 0

for r in rows:
    uid = r['id']
    username = r['username']
    xp_old = r['xp_total']
    sum_dla = int(r['sum_dla_xp'])
    ach_xp = int(r['uncredited_ach_xp'])
    diff_old = xp_old - sum_dla
    xp_new = xp_old + ach_xp
    diff_new = xp_new - sum_dla

    if ach_xp > 0:
        affected_users += 1
        total_compensation += ach_xp

    print(f"{uid:<8} {username:<20} {xp_old:<10} {sum_dla:<10} {diff_old:<10} {ach_xp:<12} {xp_new:<10} {diff_new:<10}")

print("-" * 94)
print(f"Total candidate users: {len(rows)}")
print(f"Users needing compensation (ach_xp > 0): {affected_users}")
print(f"Total XP to compensate: {total_compensation}")

print("\n" + "=" * 80)
print("PROPOSED SAFE DRY-RUN SQL STATEMENTS (DO NOT EXECUTE WITHOUT USER CONFIRMATION):")
print("=" * 80)
print("""
-- 1. SAfETY BACKUP BEFORE ANY DATA MODIFICATION:
-- Option A: MySQL table copy backup (Instantaneous inside database)
CREATE TABLE users_backup_20261117 AS SELECT * FROM users;
-- Verification of backup row count:
SELECT COUNT(*) FROM users_backup_20261117;

-- Option B: mysqldump from terminal:
-- mysqldump -u root -p lela_db users > backup_users_20261117.sql

-- 2. SAFE UPDATE STATEMENT (Only compensates uncredited achievements unlocked before fix timestamp):
UPDATE users u
JOIN (
    SELECT ua.user_id, SUM(a.xp_reward) AS total_reward
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.unlocked_at <= '2026-11-17 14:18:20'
    GROUP BY ua.user_id
) ach ON u.id = ach.user_id
SET u.xp_total = u.xp_total + ach.total_reward
WHERE u.username NOT LIKE 'vocabfix%'
  AND u.username NOT LIKE 'dashqa%'
  AND u.username NOT LIKE 'test_%'
  AND u.username NOT LIKE 'voicecheck%'
  AND u.username NOT LIKE 'voiceprobe%'
  AND u.username NOT LIKE 'vocabprobe%'
  AND u.username NOT LIKE 'quizregression%';
""")

conn.close()
