import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD',os.environ.get('DB_PASSWORD', '')), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

# 1. Check all tables with backup in name
cur.execute("SHOW TABLES LIKE '%backup%'")
backup_tables = [r[list(r.keys())[0]] for r in cur.fetchall()]
print("Backup tables:", backup_tables)

for bt in backup_tables:
    try:
        cur.execute(f"SELECT id, front_text, back_text, part_of_speech, updated_at FROM {bt} WHERE id=20290")
        r = cur.fetchone()
        if r:
            print(f"In {bt}: {r}")
    except Exception as e:
        pass

cur.execute("SELECT id, front_text, back_text, part_of_speech, updated_at FROM flashcards WHERE id=20290")
print("In current flashcards:", cur.fetchone())
