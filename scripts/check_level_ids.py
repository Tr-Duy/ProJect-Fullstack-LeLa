import mysql.connector
import sys

sys.stdout.reconfigure(encoding='utf-8')

cnx = mysql.connector.connect(host='localhost', port=3306, user='root', password='123456', database='lela_db')
cur = cnx.cursor(dictionary=True)

cur.execute("SELECT id, code, name, display_order FROM proficiency_levels ORDER BY display_order")
levels = cur.fetchall()
print("=== PROFICIENCY LEVELS IN DB ===")
for l in levels:
    print(f"  Level ID={l['id']}: code='{l['code']}', name='{l['name']}', order={l['display_order']}")

cur.execute("SELECT level_id, COUNT(*) AS cnt FROM decks WHERE is_active = 1 GROUP BY level_id")
decks_by_level = cur.fetchall()
print("\n=== DECKS COUNT BY LEVEL_ID IN DB ===")
for d in decks_by_level:
    print(f"  level_id={d['level_id']} => {d['cnt']} decks")

cur.close()
cnx.close()
