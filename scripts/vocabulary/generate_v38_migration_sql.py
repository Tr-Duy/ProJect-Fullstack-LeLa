import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

scratch_dataset = r"C:\Users\doant\.gemini\antigravity-ide\brain\d4a7301f-5beb-46f3-b3e8-4ce98dc27b3d\scratch\oxford_dataset_processed.json"
output_sql = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V38__seed_oxford_5000_vocabulary.sql"

with open(scratch_dataset, "r", encoding="utf-8") as f:
    dataset = json.load(f)

print(f"Generating V38 Migration SQL for {len(dataset)} entries...")

# Topic Mapping to DB IDs
TOPIC_ID_MAP = {
    "Business & Management": 15,
    "Finance & Accounting": 16,
    "Marketing & Sales": 17,
    "Technology & Computing": 18,
    "Law & Governance": 19,
    "Health & Medicine": 20,
    "Travel & Logistics": 21,
    "Education & Career": 22,
    "Communication & Media": 23,
    "Environment & Science": 24,
    "Office & Administration": 25,
    "General & Daily Life": 1,
}

# Group entries by (toeic_level_id, topic_name)
grouped = {}
for item in dataset:
    key = (item['toeic_level_id'], item['topic'])
    if key not in grouped:
        grouped[key] = []
    grouped[key].append(item)

sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- V38: SEED OXFORD 5000 VOCABULARY DECKS, FLASHCARDS & QUIZZES")
sql_lines.append("-- ==========================================================")
sql_lines.append("SET @admin_id = COALESCE((SELECT id FROM users WHERE email = 'admin@lela.com' OR username = 'admin' LIMIT 1), 2);")
sql_lines.append("SET @lang_en_id = COALESCE((SELECT id FROM languages WHERE language_code = 'en' OR id = 1 LIMIT 1), 1);")

# 1. Seed Topics if not exists
sql_lines.append("\n-- 1. Ensure Topics Exist")
topics_seed = [
    (15, "Business & Management", "business-management", "Từ vựng quản trị kinh doanh & doanh nghiệp"),
    (16, "Finance & Accounting", "finance-accounting", "Từ vựng tài chính, kế toán & ngân hàng"),
    (17, "Marketing & Sales", "marketing-sales", "Từ vựng tiếp thị, bán hàng & thị trường"),
    (18, "Technology & Computing", "technology-computing", "Từ vựng công nghệ thông tin & máy tính"),
    (19, "Law & Governance", "law-governance", "Từ vựng luật pháp, hành chính & chính sách"),
    (20, "Health & Medicine", "health-medicine", "Từ vựng y tế, sức khỏe & chăm sóc"),
    (21, "Travel & Logistics", "travel-logistics", "Từ vựng du lịch, khách sạn & vận tải"),
    (22, "Education & Career", "education-career", "Từ vựng giáo dục, tuyển dụng & sự nghiệp"),
    (23, "Communication & Media", "communication-media", "Từ vựng giao tiếp, truyền thông & báo chí"),
    (24, "Environment & Science", "environment-science", "Từ vựng môi trường, khoa học & tự nhiên"),
    (25, "Office & Administration", "office-administration", "Từ vựng văn phòng & quy trình công việc"),
]

for t_id, t_name, t_slug, t_desc in topics_seed:
    sql_lines.append(
        f"INSERT INTO topics (id, name, slug, description, icon_url, is_active, created_at, updated_at) "
        f"SELECT {t_id}, '{t_name}', '{t_slug}', '{t_desc}', 'BookOutlined', 1, NOW(), NOW() "
        f"WHERE NOT EXISTS (SELECT 1 FROM topics WHERE id = {t_id});"
    )

deck_id_counter = 1000
card_id_counter = 10000
quiz_id_counter = 5000
question_id_counter = 50000
option_id_counter = 200000

def escape_sql(val):
    if val is None:
        return ""
    return str(val).replace("'", "''").replace("\\", "\\\\")

sql_lines.append("\n-- 2. Seed Decks, Flashcards, Quizzes & Questions")

for (lvl_id, topic_name), items in grouped.items():
    topic_id = TOPIC_ID_MAP.get(topic_name, 1)
    
    # Split items into chunks of 20
    chunk_size = 20
    chunks = [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
    
    for c_idx, chunk in enumerate(chunks):
        deck_id_counter += 1
        current_deck_id = deck_id_counter
        deck_num = c_idx + 1
        
        level_display = "500-700" if lvl_id == 2 else ("700-850" if lvl_id == 3 else "850-990")
        deck_title = escape_sql(f"Oxford 5000 - TOEIC {level_display} - {topic_name} #{deck_num:02d}")
        deck_desc = escape_sql(f"Bộ từ vựng Oxford 5000 CEFR cho trình độ TOEIC {level_display} - Chủ đề {topic_name}.")
        deck_code = f"OXFORD-L{lvl_id}-T{topic_id}-D{current_deck_id}"
        deck_slug = f"oxford-l{lvl_id}-t{topic_id}-d{current_deck_id}"
        
        # Insert Deck (owner_id = @admin_id, language_id = @lang_en_id, status = 'PUBLISHED')
        sql_lines.append(
            f"INSERT INTO decks (id, deck_code, slug, title, description, owner_id, language_id, topic_id, level_id, exam_type_id, visibility, status, is_active, total_cards, created_at, updated_at) "
            f"VALUES ({current_deck_id}, '{deck_code}', '{deck_slug}', '{deck_title}', '{deck_desc}', @admin_id, @lang_en_id, {topic_id}, {lvl_id}, 1, 'PUBLIC', 'PUBLISHED', 1, {len(chunk)}, NOW(), NOW());"
        )
        
        # Insert Flashcards
        for card_idx, item in enumerate(chunk):
            card_id_counter += 1
            w = escape_sql(item['word'])
            trans = escape_sql(item['translation'])
            ipa = escape_sql(item['phonetic'])
            ex = escape_sql(item['example'])
            pos = escape_sql(item['pos'])
            cefr = escape_sql(item['cefr'])
            page = item['page']
            
            hint = escape_sql(f"{pos} | {topic_name}")
            note = escape_sql(f"CEFR: {cefr} | Source: Oxford 5000 (p.{page}) | POS: {pos}")
            
            sql_lines.append(
                f"INSERT INTO flashcards (id, deck_id, front_text, back_text, phonetic, example_text, hint, note, card_order, is_active, created_by, created_at, updated_at) "
                f"VALUES ({card_id_counter}, {current_deck_id}, '{w}', '{trans}', '{ipa}', '{ex}', '{hint}', '{note}', {card_idx + 1}, 1, @admin_id, NOW(), NOW());"
            )
        
        # Insert Quiz for this Deck (quiz_type = 'MULTIPLE_CHOICE')
        quiz_id_counter += 1
        current_quiz_id = quiz_id_counter
        quiz_title = escape_sql(f"Vocabulary Quiz - TOEIC {level_display} - {topic_name} #{deck_num:02d}")
        quiz_desc = escape_sql(f"Bài kiểm tra từ vựng Oxford 5000 cho bộ thẻ {deck_title}.")
        quiz_code = f"OXFORD-QUIZ-L{lvl_id}-T{topic_id}-Q{current_quiz_id}"
        
        sql_lines.append(
            f"INSERT INTO quizzes (id, deck_id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, total_questions, is_active, quiz_category, exam_type_id, level_id, created_by, created_at, updated_at) "
            f"VALUES ({current_quiz_id}, {current_deck_id}, '{quiz_code}', '{quiz_title}', '{quiz_desc}', 'MULTIPLE_CHOICE', 1800, 80, {len(chunk)}, 1, 'NORMAL', 1, {lvl_id}, @admin_id, NOW(), NOW());"
        )
        
        # Insert Questions & Options
        for q_idx, item in enumerate(chunk):
            question_id_counter += 1
            current_question_id = question_id_counter
            
            w = escape_sql(item['word'])
            trans = escape_sql(item['translation'])
            pos = escape_sql(item['pos'])
            
            q_text = escape_sql(f"Từ '{w}' ({pos}) có nghĩa là gì trong tiếng Việt?")
            q_exp = escape_sql(f"'{w}' ({pos}) nghĩa là: {trans}. Ví dụ: {item['example']}")
            
            sql_lines.append(
                f"INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, display_order, explanation, is_active, created_at, updated_at) "
                f"VALUES ({current_question_id}, {current_quiz_id}, '{q_text}', 'MULTIPLE_CHOICE', 10, {q_idx + 1}, '{q_exp}', 1, NOW(), NOW());"
            )
            
            # Select 3 distractors from chunk or items
            distractors = [it['translation'] for it in items if it['word'] != item['word']]
            if len(distractors) < 3:
                distractors = ["từ chối", "trì hoãn", "thay đổi"]
            
            opt_trans = [trans, distractors[0], distractors[1], distractors[2]]
            
            # Option A (Correct)
            option_id_counter += 1
            sql_lines.append(
                f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
                f"VALUES ({option_id_counter}, {current_question_id}, 'A', '{escape_sql(opt_trans[0])}', 1, 1, NOW(), NOW());"
            )
            # Option B
            option_id_counter += 1
            sql_lines.append(
                f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
                f"VALUES ({option_id_counter}, {current_question_id}, 'B', '{escape_sql(opt_trans[1])}', 0, 2, NOW(), NOW());"
            )
            # Option C
            option_id_counter += 1
            sql_lines.append(
                f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
                f"VALUES ({option_id_counter}, {current_question_id}, 'C', '{escape_sql(opt_trans[2])}', 0, 3, NOW(), NOW());"
            )
            # Option D
            option_id_counter += 1
            sql_lines.append(
                f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, is_correct, display_order, created_at, updated_at) "
                f"VALUES ({option_id_counter}, {current_question_id}, 'D', '{escape_sql(opt_trans[3])}', 0, 4, NOW(), NOW());"
            )

print(f"Generated SQL statements for {deck_id_counter - 1000} Decks, {card_id_counter - 10000} Flashcards, {quiz_id_counter - 5000} Quizzes, {question_id_counter - 50000} Questions.")

# Write to V38 Migration File
with open(output_sql, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"V38 Migration file written to: {output_sql}")
