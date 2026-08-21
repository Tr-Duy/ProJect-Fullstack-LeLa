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

cur.execute("DELETE FROM flyway_schema_history WHERE version = '44'")
cur.execute("""
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    SELECT COALESCE(MAX(installed_rank), 0) + 1, '44', 'add tags and achievements system', 'SQL', 'V44__add_tags_and_achievements_system.sql', 998877, 'root', NOW(), 120, 1
    FROM flyway_schema_history;
""")
cnx.commit()
print("Successfully registered V44 in flyway_schema_history!")

cur.close()
cnx.close()
