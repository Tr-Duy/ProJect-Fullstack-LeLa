import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
cur.execute("SHOW TABLES LIKE '%quiz%'")
print([r[0] for r in cur.fetchall()])
