import os
import pymysql

conn = pymysql.connect(
    host='127.0.0.1', port=3306, user='root',
    password=os.environ.get('DB_PASSWORD', ''),
    database='lela_db'
)
cur = conn.cursor(pymysql.cursors.DictCursor)

ids_35 = [
    10268, 10950, 11617, 20141, 20270, 20290, 20194, 883, 884, 885, 887, 898, 890, 892, 893,
    912, 1119, 1096, 1104, 1093, 1059, 1064, 1001, 1002, 1117, 992, 993, 985, 979, 1035,
    1041, 1077, 1085, 1114, 886
]

print("=== VERBATIM QUERY FROM BACKUP: flashcards_backup_req2_20261118_141021 ===")
cur.execute(f"""
    SELECT id, front_text, part_of_speech, back_text
    FROM flashcards_backup_req2_20261118_141021
    WHERE id IN ({','.join(map(str, ids_35))})
    ORDER BY FIELD(id, {','.join(map(str, ids_35))})
""")
backup_rows = cur.fetchall()
for r in backup_rows:
    print(f"{r['id']:<6} | {r['front_text']:<45} | {r['part_of_speech']:<10} | {r['back_text']}")

print("\n=== VERBATIM QUERY FROM CURRENT flashcards ===")
cur.execute(f"""
    SELECT id, front_text, part_of_speech, back_text
    FROM flashcards
    WHERE id IN ({','.join(map(str, ids_35))})
    ORDER BY FIELD(id, {','.join(map(str, ids_35))})
""")
current_rows = cur.fetchall()
for r in current_rows:
    print(f"{r['id']:<6} | {r['front_text']:<45} | {r['part_of_speech']:<10} | {r['back_text']}")

conn.close()
