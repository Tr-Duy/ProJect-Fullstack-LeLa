import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
for table in ['quiz_attempt_questions', 'quiz_attempt_options', 'quiz_answers']:
    try:
        cur.execute(f"SELECT count(*) FROM {table} WHERE attempt_id IN (739, 740, 741)")
        print(table, cur.fetchone()[0])
    except Exception as e:
        print(table, "error:", e)
