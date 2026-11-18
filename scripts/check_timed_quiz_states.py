import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
cur.execute("SELECT count(*) FROM timed_quiz_states WHERE attempt_id IN (739, 740, 741)")
print("timed_quiz_states count:", cur.fetchone()[0])
