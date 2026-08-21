import mysql.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db'
)
cur = cnx.cursor(dictionary=True)

print("=== 1. TAGS TABLES ===")
cur.execute("SHOW TABLES LIKE '%tag%'")
tag_tables = cur.fetchall()
print("Tag tables:", tag_tables)

for t in tag_tables:
    t_name = list(t.values())[0]
    cur.execute(f"DESCRIBE {t_name}")
    print(f"\n--- Structure of {t_name} ---")
    for col in cur.fetchall():
        print(f"  {col['Field']}: {col['Type']} | Null:{col['Null']} | Key:{col['Key']} | Default:{col['Default']}")
    
    cur.execute(f"SELECT COUNT(*) AS cnt FROM {t_name}")
    print(f"Total rows in {t_name}: {cur.fetchone()['cnt']}")

print("\n=== 2. ACHIEVEMENTS TABLES ===")
cur.execute("SHOW TABLES LIKE '%achievement%'")
ach_tables = cur.fetchall()
print("Achievement tables:", ach_tables)

for t in ach_tables:
    t_name = list(t.values())[0]
    cur.execute(f"DESCRIBE {t_name}")
    print(f"\n--- Structure of {t_name} ---")
    for col in cur.fetchall():
        print(f"  {col['Field']}: {col['Type']} | Null:{col['Null']} | Key:{col['Key']} | Default:{col['Default']}")
    
    cur.execute(f"SELECT COUNT(*) AS cnt FROM {t_name}")
    print(f"Total rows in {t_name}: {cur.fetchone()['cnt']}")

print("\n=== 3. SAMPLE EXISTING ACHIEVEMENTS ===")
cur.execute("SELECT * FROM achievements LIMIT 20")
for a in cur.fetchall():
    print(" ", a)

print("\n=== 4. SAMPLE EXISTING TAGS ===")
cur.execute("SELECT * FROM tags LIMIT 20")
for t in cur.fetchall():
    print(" ", t)

cur.close()
cnx.close()
