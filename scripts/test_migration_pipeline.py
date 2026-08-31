import pymysql
import sys
import os
import glob
import time
import re

sys.stdout.reconfigure(encoding='utf-8')

MIGRATION_DIR = r'LeLa_BE/src/main/resources/db/migration'

def get_db_connection(db_name=None):
    return pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='123456',
        database=db_name,
        charset='utf8mb4',
        autocommit=False
    )

def remove_comments(sql):
    # Remove block comments /* ... */
    pattern = r'/\*.*?\*/'
    sql = re.sub(pattern, '', sql, flags=re.DOTALL)
    # Remove line comments -- ...
    lines = []
    for line in sql.splitlines():
        # check if line has --
        # if -- is outside quotes
        in_str = False
        res = []
        i = 0
        while i < len(line):
            ch = line[i]
            if ch == "'":
                in_str = not in_str
                res.append(ch)
            elif not in_str and line[i:i+2] == '--':
                break
            else:
                res.append(ch)
            i += 1
        lines.append(''.join(res))
    return '\n'.join(lines)

def split_sql_file(content):
    cleaned = remove_comments(content)
    stmts = []
    current = []
    in_str = False
    escape = False
    for char in cleaned:
        if char == '\\' and in_str:
            escape = not escape
            current.append(char)
            continue
        if char == "'" and not escape:
            in_str = not in_str
            current.append(char)
            continue
        escape = False
        if char == ';' and not in_str:
            stmt = ''.join(current).strip()
            if stmt:
                stmts.append(stmt)
            current = []
        else:
            current.append(char)
    last = ''.join(current).strip()
    if last:
        stmts.append(last)
    
    clean_stmts = [s.strip() for s in stmts if s.strip()]
    return clean_stmts

def test_migration_pipeline():
    test_db = 'test_v40_v41_verification'
    print(f"Creating test database `{test_db}`...")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(f"DROP DATABASE IF EXISTS `{test_db}`")
    cur.execute(f"CREATE DATABASE `{test_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    conn.commit()
    cur.close()
    conn.close()

    conn = get_db_connection(test_db)
    cur = conn.cursor()

    files = glob.glob(os.path.join(MIGRATION_DIR, "V*__*.sql"))
    def get_version(f):
        base = os.path.basename(f)
        v = base.split('__')[0][1:]
        return int(v)
    
    files.sort(key=get_version)

    for fpath in files:
        v = get_version(fpath)
        fname = os.path.basename(fpath)
        print(f"\n---> Executing {fname} (Version {v})...")
        with open(fpath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        stmts = split_sql_file(content)
        t0 = time.time()
        for idx, stmt in enumerate(stmts):
            try:
                cur.execute(stmt)
            except Exception as e:
                print(f"ERROR in {fname} at statement #{idx+1}:")
                print(stmt[:300])
                print(f"Exception: {e}")
                conn.rollback()
                cur.close()
                conn.close()
                return False
        conn.commit()
        elapsed = time.time() - t0
        print(f"     SUCCESS in {elapsed:.3f}s ({len(stmts)} statements)")
        
        if v == 40:
            print("     [V40 STATE CHECK]")
            cur.execute("SELECT COUNT(*) FROM topics WHERE id BETWEEN 126 AND 142")
            print(f"       topics (126-142): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM decks WHERE id BETWEEN 2001 AND 2017")
            print(f"       decks (2001-2017): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM flashcards WHERE id BETWEEN 20001 AND 20187")
            print(f"       flashcards (20001-20187): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM quizzes WHERE id BETWEEN 10001 AND 10034")
            print(f"       quizzes (10001-10034): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM quiz_questions WHERE id BETWEEN 100001 AND 100510")
            print(f"       quiz_questions (100001-100510): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM quiz_question_options WHERE id BETWEEN 400001 AND 402040")
            print(f"       quiz_question_options (400001-402040): {cur.fetchone()[0]}")

        if v == 41:
            print("     [V41 STATE CHECK]")
            cur.execute("SELECT COUNT(*) FROM quizzes WHERE id BETWEEN 35001 AND 35010")
            print(f"       quizzes (35001-35010): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM quiz_questions WHERE id BETWEEN 500001 AND 500300")
            print(f"       quiz_questions (500001-500300): {cur.fetchone()[0]}")
            cur.execute("SELECT COUNT(*) FROM quiz_question_options WHERE id BETWEEN 1500001 AND 1501200")
            print(f"       quiz_question_options (1500001-1501200): {cur.fetchone()[0]}")

    cur.close()
    conn.close()
    print("\nALL MIGRATIONS V1-V45 EXECUTED SUCCESSFULLY ON TEST DB!")
    return True

if __name__ == '__main__':
    test_migration_pipeline()
