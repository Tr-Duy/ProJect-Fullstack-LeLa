import pymysql
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = pymysql.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db',
    charset='utf8mb4'
)
cursor = conn.cursor()

def escape_sql(val):
    if val is None:
        return ""
    return str(val).replace("'", "''").replace("\\", "\\\\")

# Fetch vocabulary cards per level for question generation
flashcards_by_level = {1: [], 2: [], 3: [], 4: []}

cursor.execute("""
    SELECT f.id, f.front_text, f.back_text, f.phonetic, f.example_text, f.hint, d.level_id
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE f.is_active = 1 AND f.back_text IS NOT NULL
""")
for row in cursor.fetchall():
    lvl = row[6]
    if lvl in flashcards_by_level:
        flashcards_by_level[lvl].append({
            'id': row[0],
            'word': row[1],
            'translation': row[2],
            'phonetic': row[3],
            'example': row[4],
            'hint': row[5]
        })

print("Flashcards per Level for Question Generation:")
for lvl, cards in flashcards_by_level.items():
    print(f"  Level {lvl}: {len(cards)} cards")

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quizzes")
max_quiz_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_questions")
max_question_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_question_options")
max_option_id = cursor.fetchone()[0]

print(f"Max DB IDs - Quiz: {max_quiz_id}, Question: {max_question_id}, Option: {max_option_id}")

quiz_id_counter = max(max_quiz_id + 1, 20000)
question_id_counter = max(max_question_id + 1, 200000)
option_id_counter = max(max_option_id + 1, 800000)

sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- V41: FIX & SEED 40 SEQUENTIAL UPGRADE TESTS (10 PER LEVEL)")
sql_lines.append("-- ==========================================================")
sql_lines.append("SET @admin_id = COALESCE((SELECT id FROM users WHERE email = 'admin@lela.com' OR username = 'admin' LIMIT 1), 2);")

# 1. Update Level 1 Upgrade Tests (IDs 171-180 -> level_id = 1, quiz_code = 'UPGRADE-U500-01'..'10')
sql_lines.append("\n-- 1. Update Level 1 Upgrade Tests (level_id = 1)")
for i in range(1, 11):
    q_id = 170 + i
    q_code = f"UPGRADE-U500-{i:02d}"
    q_title = escape_sql(f"Bài kiểm tra nâng cấp TOEIC Dưới 500 - #{i:02d}")
    sql_lines.append(
        f"UPDATE quizzes SET level_id = 1, quiz_code = '{q_code}', title = '{q_title}', quiz_category = 'LEVEL_UP', pass_score = 80, time_limit_seconds = 1800, total_questions = 30, is_active = 1 WHERE id = {q_id};"
    )

# 2. Update Level 2 Upgrade Tests (IDs 181-190 -> level_id = 2, quiz_code = 'UPGRADE-500-01'..'10')
sql_lines.append("\n-- 2. Update Level 2 Upgrade Tests (level_id = 2)")
for i in range(1, 11):
    q_id = 180 + i
    q_code = f"UPGRADE-500-{i:02d}"
    q_title = escape_sql(f"Bài kiểm tra nâng cấp TOEIC 500 - 700 - #{i:02d}")
    sql_lines.append(
        f"UPDATE quizzes SET level_id = 2, quiz_code = '{q_code}', title = '{q_title}', quiz_category = 'LEVEL_UP', pass_score = 80, time_limit_seconds = 1800, total_questions = 30, is_active = 1 WHERE id = {q_id};"
    )

# 3. Update Level 3 Upgrade Tests (IDs 191-200 -> level_id = 3, quiz_code = 'UPGRADE-650-01'..'10')
sql_lines.append("\n-- 3. Update Level 3 Upgrade Tests (level_id = 3)")
for i in range(1, 11):
    q_id = 190 + i
    q_code = f"UPGRADE-650-{i:02d}"
    q_title = escape_sql(f"Bài kiểm tra nâng cấp TOEIC 700 - 850 - #{i:02d}")
    sql_lines.append(
        f"UPDATE quizzes SET level_id = 3, quiz_code = '{q_code}', title = '{q_title}', quiz_category = 'LEVEL_UP', pass_score = 80, time_limit_seconds = 1800, total_questions = 30, is_active = 1 WHERE id = {q_id};"
    )

# 4. Seed 10 New Level 4 Upgrade Tests (level_id = 4, quiz_code = 'UPGRADE-850-01'..'10')
sql_lines.append("\n-- 4. Seed 10 New Level 4 Upgrade Tests (level_id = 4)")

level4_cards = flashcards_by_level[4] if len(flashcards_by_level[4]) >= 30 else flashcards_by_level[3]

for i in range(1, 11):
    quiz_id_counter += 1
    current_quiz_id = quiz_id_counter
    q_code = f"UPGRADE-850-{i:02d}"
    q_title = escape_sql(f"Bài kiểm tra nâng cấp TOEIC 850 - 990 - #{i:02d}")
    q_desc = escape_sql(f"Bài kiểm tra nâng cấp trình độ TOEIC Xuất sắc (850 - 990) - Đề số #{i:02d}. Đạt từ 80% (24/30 câu) để nâng cấp trình độ ngay lập tức.")
    
    sql_lines.append(
        f"INSERT INTO quizzes (id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, total_questions, is_active, quiz_category, exam_type_id, level_id, created_by, created_at, updated_at) "
        f"VALUES ({current_quiz_id}, '{q_code}', '{q_title}', '{q_desc}', 'MULTIPLE_CHOICE', 1800, 80, 30, 1, 'LEVEL_UP', 1, 4, @admin_id, NOW(), NOW());"
    )
    
    # Select 30 cards for questions
    for q_idx in range(30):
        question_id_counter += 1
        current_question_id = question_id_counter
        
        card = level4_cards[(i * 3 + q_idx) % len(level4_cards)]
        w = escape_sql(card['word'])
        trans = escape_sql(card['translation'])
        ex = escape_sql(card['example'] or f"Study the advanced word '{w}'.")
        
        if q_idx % 3 == 0:
            q_text = escape_sql(f"Từ '{w}' có nghĩa là gì trong tiếng Việt?")
            q_exp = escape_sql(f"'{w}' nghĩa là: {trans}. Ví dụ: {ex}")
        elif q_idx % 3 == 1:
            sentence_blank = ex.replace(card['word'], "______").replace(card['word'].capitalize(), "______")
            q_text = escape_sql(f"Chọn từ đúng điền vào chỗ trống: \"{sentence_blank}\"")
            q_exp = escape_sql(f"Đáp án đúng là '{w}' ({trans}). Câu hoàn chỉnh: {ex}")
        else:
            q_text = escape_sql(f"Từ tiếng Anh nào có nghĩa là '{trans}'?")
            q_exp = escape_sql(f"Nghĩa '{trans}' tương ứng với từ tiếng Anh '{w}'.")
            
        sql_lines.append(
            f"INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, display_order, explanation, is_active, created_at, updated_at) "
            f"VALUES ({current_question_id}, {current_quiz_id}, '{q_text}', 'MULTIPLE_CHOICE', 10, {q_idx + 1}, '{q_exp}', 1, NOW(), NOW());"
        )
        
        # Distractors
        distractors = [c for c in level4_cards if c['word'] != card['word']]
        d1, d2, d3 = distractors[0], distractors[1], distractors[2]
        
        if q_idx % 3 == 2:
            correct_opt = w
            opt1, opt2, opt3 = escape_sql(d1['word']), escape_sql(d2['word']), escape_sql(d3['word'])
        else:
            correct_opt = trans
            opt1, opt2, opt3 = escape_sql(d1['translation']), escape_sql(d2['translation']), escape_sql(d3['translation'])
            
        # Option A (Correct)
        option_id_counter += 1
        sql_lines.append(
            f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
            f"VALUES ({option_id_counter}, {current_question_id}, 'A', '{correct_opt}', 1, 1, NOW(), NOW());"
        )
        # Option B
        option_id_counter += 1
        sql_lines.append(
            f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
            f"VALUES ({option_id_counter}, {current_question_id}, 'B', '{opt1}', 0, 2, NOW(), NOW());"
        )
        # Option C
        option_id_counter += 1
        sql_lines.append(
            f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
            f"VALUES ({option_id_counter}, {current_question_id}, 'C', '{opt2}', 0, 3, NOW(), NOW());"
        )
        # Option D
        option_id_counter += 1
        sql_lines.append(
            f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
            f"VALUES ({option_id_counter}, {current_question_id}, 'D', '{opt3}', 0, 4, NOW(), NOW());"
        )

output_v41_sql_path = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V41__fix_and_seed_40_upgrade_tests.sql"

with open(output_v41_sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"\nGenerated V41 Migration File at: {output_v41_sql_path}")
conn.close()
