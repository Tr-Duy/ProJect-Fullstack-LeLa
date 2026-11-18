import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
cur.execute("SELECT id, username, email, status FROM users WHERE id IN (1, 2, 3)")
print("Users:", cur.fetchall())

cur.execute("SHOW TABLES LIKE '%role%'")
print("Role tables:", cur.fetchall())
