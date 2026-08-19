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

# Fetch flashcards per level
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

print("Flashcards per Level:")
for lvl, cards in flashcards_by_level.items():
    print(f"  Level {lvl}: {len(cards)} cards")

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quizzes")
max_quiz_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_questions")
max_question_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_question_options")
max_option_id = cursor.fetchone()[0]

print(f"Max DB IDs - Quiz: {max_quiz_id}, Question: {max_question_id}, Option: {max_option_id}")

quiz_id_counter = max(max_quiz_id + 1, 40000)
question_id_counter = max(max_question_id + 1, 600000)
option_id_counter = max(max_option_id + 1, 2000000)

sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- V42: SEED 40 FINAL LEVEL TESTS (10 PER LEVEL, 20 Qs EACH)")
sql_lines.append("-- ==========================================================")
sql_lines.append("SET @admin_id = COALESCE((SELECT id FROM users WHERE email = 'admin@lela.com' OR username = 'admin' LIMIT 1), 2);")

# Add cycle_number to quiz_attempts if missing
sql_lines.append("\n-- Add cycle_number to quiz_attempts")
sql_lines.append("ALTER TABLE quiz_attempts ADD COLUMN cycle_number INT NOT NULL DEFAULT 1;")

# Level descriptions and title prefixes
level_names = {
    1: "Cơ bản (Dưới 500)",
    2: "Trung bình - Khá (500 - 700)",
    3: "Khá - Giỏi (700 - 850)",
    4: "Xuất sắc (850 - 990)"
}

level_code_prefixes = {
    1: "FINAL-U500",
    2: "FINAL-500",
    3: "FINAL-650",
    4: "FINAL-850"
}

for lvl in [1, 2, 3, 4]:
    cards = flashcards_by_level[lvl]
    prefix = level_code_prefixes[lvl]
    lvl_name = level_names[lvl]
    
    sql_lines.append(f"\n-- Seed 10 Final Level Tests for Level {lvl} ({lvl_name})")
    
    for i in range(1, 11):
        quiz_id_counter += 1
        current_quiz_id = quiz_id_counter
        q_code = f"{prefix}-{i:02d}"
        q_title = escape_sql(f"Bài kiểm tra kết thúc mức độ {lvl_name} - #{i:02d}")
        q_desc = escape_sql(f"Bài kiểm tra kết thúc trình độ {lvl_name} - Đề số #{i:02d}. Gồm 20 câu hỏi, đạt từ 70% (14/20 câu) để nâng trình độ.")
        
        sql_lines.append(
            f"INSERT INTO quizzes (id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, total_questions, is_active, quiz_category, exam_type_id, level_id, created_by, created_at, updated_at) "
            f"VALUES ({current_quiz_id}, '{q_code}', '{q_title}', '{q_desc}', 'MULTIPLE_CHOICE', 1200, 70, 20, 1, 'FINAL_LEVEL', 1, {lvl}, @admin_id, NOW(), NOW());"
        )
        
        # 20 questions
        for q_idx in range(20):
            question_id_counter += 1
            current_question_id = question_id_counter
            
            card = cards[(i * 5 + q_idx) % len(cards)]
            w = escape_sql(card['word'])
            trans = escape_sql(card['translation'])
            ex = escape_sql(card['example'] or f"Study the vocabulary word '{w}'.")
            
            if q_idx % 4 == 0:
                q_text = escape_sql(f"Từ '{w}' trong Tiếng Việt có nghĩa là gì?")
                q_exp = escape_sql(f"'{w}' có nghĩa chính xác là: {trans}. Ví dụ: {ex}")
            elif q_idx % 4 == 1:
                sentence_blank = ex.replace(card['word'], "______").replace(card['word'].capitalize(), "______")
                q_text = escape_sql(f"Điền từ thích hợp vào chỗ trống: \"{sentence_blank}\"")
                q_exp = escape_sql(f"Đáp án đúng là '{w}' ({trans}). Câu đầy đủ: {ex}")
            elif q_idx % 4 == 2:
                q_text = escape_sql(f"Từ tiếng Anh nào mang nghĩa '{trans}'?")
                q_exp = escape_sql(f"Nghĩa '{trans}' tương ứng với từ tiếng Anh '{w}'.")
            else:
                q_text = escape_sql(f"Xác định từ đúng trong câu: \"{ex}\"")
                q_exp = escape_sql(f"Từ trọng tâm trong ngữ cảnh này là '{w}' ({trans}).")
                
            sql_lines.append(
                f"INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, display_order, explanation, is_active, created_at, updated_at) "
                f"VALUES ({current_question_id}, {current_quiz_id}, '{q_text}', 'MULTIPLE_CHOICE', 5, {q_idx + 1}, '{q_exp}', 1, NOW(), NOW());"
            )
            
            distractors = [c for c in cards if c['word'] != card['word']]
            d1, d2, d3 = distractors[0], distractors[1], distractors[2]
            
            if q_idx % 4 in [2, 3]:
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

output_v42_sql_path = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V42__seed_40_final_level_tests.sql"
with open(output_v42_sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"\nGenerated V42 Migration File at: {output_v42_sql_path}")
conn.close()
