import os, pymysql, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

print("--- BACKUP TABLE INFO ---")
cur.execute("SELECT * FROM flashcards_backup_loanwords_20261118_134327")
print(json.dumps(cur.fetchall(), default=str, indent=2))

print("\n--- UPDATED CARDS 10502, 10521 IN DEV DB ---")
cur.execute("SELECT id, front_text, back_text, updated_at FROM flashcards WHERE id IN (10502, 10521)")
print(json.dumps(cur.fetchall(), default=str, indent=2))

print("\n--- FRONT IN BACK VIOLATIONS (NON-PLACEHOLDER) ---")
cur.execute("""
    SELECT id, front_text, back_text, part_of_speech 
    FROM flashcards 
    WHERE is_active=1 AND deleted_at IS NULL 
      AND back_text NOT LIKE '%từ vựng thuộc nhóm%'
      AND LOWER(back_text) LIKE CONCAT('%', LOWER(TRIM(front_text)), '%')
    ORDER BY id
""")
rows = cur.fetchall()
print(f"Total non-placeholder violations: {len(rows)}")
for r in rows:
    print(f"ID={r['id']} | front='{r['front_text']}' | part_of_speech='{r['part_of_speech']}' | back='{r['back_text']}'")
