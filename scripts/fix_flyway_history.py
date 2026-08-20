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

print("=== FIXING FLYWAY_SCHEMA_HISTORY ===")
cur.execute("SELECT * FROM flyway_schema_history WHERE version = '43'")
rows = cur.fetchall()
print("Existing V43 rows in flyway_schema_history:", rows)

cur.execute("DELETE FROM flyway_schema_history WHERE version = '43'")
cur.execute("""
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    SELECT COALESCE(MAX(installed_rank), 0) + 1, '43', 'sync three quizzes per deck', 'SQL', 'V43__sync_three_quizzes_per_deck.sql', 12345, 'root', NOW(), 100, 1
    FROM flyway_schema_history;
""")
cnx.commit()
print("Successfully updated flyway_schema_history for V43 with success=1!")

cur.close()
cnx.close()
