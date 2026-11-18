import os, pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db')
cur = conn.cursor()
cur.execute("SELECT * FROM user_roles WHERE user_id=3")
print("user_roles for 3:", cur.fetchall())
