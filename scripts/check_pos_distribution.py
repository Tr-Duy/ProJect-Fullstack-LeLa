import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

cur.execute("SELECT part_of_speech, count(*) FROM flashcards WHERE is_active=1 AND deleted_at IS NULL GROUP BY part_of_speech")
print(cur.fetchall())
