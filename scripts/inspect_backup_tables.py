import os
import pymysql

pw = os.environ.get("DB_PASSWORD")
if not pw:
    raise RuntimeError("Missing required environment variable DB_PASSWORD")

conn = pymysql.connect(host="localhost", port=3306, user="root", password=pw, database="lela_db")
c = conn.cursor(pymysql.cursors.DictCursor)

c.execute("""
    SELECT TABLE_NAME, CREATE_TIME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'lela_db' AND TABLE_NAME LIKE 'flashcards_backup_%'
    ORDER BY CREATE_TIME DESC, TABLE_NAME DESC
""")
tbls = c.fetchall()
print(f"Total backup tables: {len(tbls)}")
for t in tbls:
    name = t['TABLE_NAME']
    c.execute(f"SELECT count(*) as cnt FROM {name}")
    cnt = c.fetchone()['cnt']
    print(f"Table: {name:<45} | Rows: {cnt:<6} | Created: {t['CREATE_TIME']}")

conn.close()
