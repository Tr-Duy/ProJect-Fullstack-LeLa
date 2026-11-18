import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
for table in ['quiz_attempt_questions', 'quiz_attempt_options']:
    cur.execute(f"DESCRIBE {table}")
    print(table, [r[0] for r in cur.fetchall()])
