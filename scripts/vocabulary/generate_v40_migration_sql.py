import os
import sys
import json
import pymysql

sys.stdout.reconfigure(encoding='utf-8')

from build_v40_u500_vocabulary import TOEIC_U500_DATA

TOPIC_IMAGE_MAP = {
    15: [ "https://images.unsplash.com/photo-1542744801-43245f175232?q=80&w=800&auto=format&fit=crop" ],
    16: [ "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop" ],
    17: [ "https://images.unsplash.com/photo-1533750349088-cd871a92f312?q=80&w=800&auto=format&fit=crop" ],
    18: [ "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop" ],
    19: [ "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop" ],
    20: [ "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop" ],
    21: [ "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop" ],
    22: [ "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop" ],
    23: [ "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop" ],
    24: [ "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop" ],
    25: [ "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop" ],
    1:  [ "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop" ]
}

conn = pymysql.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db',
    charset='utf8mb4'
)
cursor = conn.cursor()

# Get existing topics from DB
cursor.execute("SELECT id, name FROM topics")
existing_topics_db = {row[1].lower().strip(): row[0] for row in cursor.fetchall()}

# Get existing flashcard front_texts
cursor.execute("SELECT LOWER(TRIM(front_text)), id, deck_id FROM flashcards")
existing_cards_db = {row[0]: {'id': row[1], 'deck_id': row[2]} for row in cursor.fetchall()}

# Get max IDs from DB to prevent collisions
cursor.execute("SELECT COALESCE(MAX(id), 0) FROM topics")
max_topic_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM decks")
max_deck_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM flashcards")
max_card_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quizzes")
max_quiz_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_questions")
max_question_id = cursor.fetchone()[0]

cursor.execute("SELECT COALESCE(MAX(id), 0) FROM quiz_question_options")
max_option_id = cursor.fetchone()[0]

print(f"Max Existing DB IDs - Topic: {max_topic_id}, Deck: {max_deck_id}, Card: {max_card_id}, Quiz: {max_quiz_id}, Question: {max_question_id}, Option: {max_option_id}")

topic_id_counter = max_topic_id + 100
deck_id_counter = max(max_deck_id + 1, 2000)
card_id_counter = max(max_card_id + 1, 20000)
quiz_id_counter = max(max_quiz_id + 1, 10000)
question_id_counter = max(max_question_id + 1, 100000)
option_id_counter = max(max_option_id + 1, 400000)

def escape_sql(val):
    if val is None:
        return ""
    return str(val).replace("'", "''").replace("\\", "\\\\")

# Map 17 topics to topic_ids
TOPIC_NAME_TO_ID = {}
topics_to_seed = []

requested_topics = [
    ("Computers - Electronics", "computers-electronics", "Từ vựng máy tính và thiết bị điện tử"),
    ("Correspondence", "correspondence", "Từ vựng thư từ và giao tiếp văn phòng"),
    ("Media", "media", "Từ vựng truyền thông và báo chí"),
    ("Contracts", "contracts", "Từ vựng hợp đồng và điều khoản pháp lý"),
    ("Applying and Interviewing", "applying-interviewing", "Từ vựng xin việc và phỏng vấn"),
    ("Hiring", "hiring", "Từ vựng tuyển dụng nhân sự"),
    ("Training", "training", "Từ vựng đào tạo và phát triển nhân lực"),
    ("Office Procedures", "office-procedures", "Từ vựng quy trình làm việc văn phòng"),
    ("Salaries and Benefits", "salaries-benefits", "Từ vựng tiền lương và chế độ phúc lợi"),
    ("Marketing", "marketing", "Từ vựng tiếp thị và quảng cáo"),
    ("Shopping", "shopping", "Từ vựng mua sắm và thương mại"),
    ("Event", "event", "Từ vựng tổ chức sự kiện và hội nghị"),
    ("Travel", "travel", "Từ vựng du lịch và đi lại"),
    ("Music", "music", "Từ vựng âm nhạc và nghệ thuật"),
    ("Musical Instruments", "musical-instruments", "Từ vựng các loại nhạc cụ"),
    ("Movie", "movie", "Từ vựng điện ảnh và phim ảnh"),
    ("Hotel", "hotel", "Từ vựng khách sạn và dịch vụ lưu trú")
]

for t_name, t_slug, t_desc in requested_topics:
    key = t_name.lower().strip()
    if key in existing_topics_db:
        TOPIC_NAME_TO_ID[t_name] = existing_topics_db[key]
    else:
        topic_id_counter += 1
        TOPIC_NAME_TO_ID[t_name] = topic_id_counter
        topics_to_seed.append((topic_id_counter, t_name, t_slug, t_desc))

sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- V40: SEED TOEIC BASIC (DƯỚI 500) VOCABULARY DECKS & QUIZZES")
sql_lines.append("-- ==========================================================")
sql_lines.append("SET @admin_id = COALESCE((SELECT id FROM users WHERE email = 'admin@lela.com' OR username = 'admin' LIMIT 1), 2);")
sql_lines.append("SET @lang_en_id = COALESCE((SELECT id FROM languages WHERE language_code = 'en' OR id = 1 LIMIT 1), 1);")

# 1. Seed New Topics
sql_lines.append("\n-- 1. Seed Missing Topics")
for t_id, t_name, t_slug, t_desc in topics_to_seed:
    sql_lines.append(
        f"INSERT INTO topics (id, name, slug, description, icon_url, is_active, created_at, updated_at) "
        f"SELECT {t_id}, '{escape_sql(t_name)}', '{t_slug}', '{escape_sql(t_desc)}', 'BookOutlined', 1, NOW(), NOW() "
        f"WHERE NOT EXISTS (SELECT 1 FROM topics WHERE id = {t_id});"
    )

# Group entries by topic
grouped_by_topic = {}
for item in TOEIC_U500_DATA:
    top = item['topic']
    if top not in grouped_by_topic:
        grouped_by_topic[top] = []
    grouped_by_topic[top].append(item)

sql_lines.append("\n-- 2. Seed Decks, Flashcards, Quizzes & Questions")

total_new_cards_created = 0
total_new_decks_created = 0
total_new_quizzes_created = 0
total_new_questions_created = 0

for top_name, items in grouped_by_topic.items():
    topic_id = TOPIC_NAME_TO_ID[top_name]
    
    # Check existing decks for Level 1 & this topic
    cursor.execute("""
        SELECT id, title, total_cards FROM decks 
        WHERE level_id = 1 AND topic_id = %s AND is_active = 1
    """, (topic_id,))
    existing_level1_decks = cursor.fetchall()
    
    target_deck_id = None
    if existing_level1_decks:
        for ed in existing_level1_decks:
            if ed[2] < 30:
                target_deck_id = ed[0]
                break
    
    if not target_deck_id:
        deck_id_counter += 1
        target_deck_id = deck_id_counter
        total_new_decks_created += 1
        
        deck_title = escape_sql(f"TOEIC Dưới 500 - {top_name}")
        deck_desc = escape_sql(f"Bộ từ vựng TOEIC Cơ bản (Dưới 500) - Chủ đề {top_name}.")
        deck_code = f"TOEIC-U500-T{topic_id}-D{target_deck_id}"
        deck_slug = f"toeic-u500-t{topic_id}-d{target_deck_id}"
        
        img_list = TOPIC_IMAGE_MAP.get(topic_id, TOPIC_IMAGE_MAP[1])
        cover_img = img_list[target_deck_id % len(img_list)]
        
        sql_lines.append(
            f"\n-- Create Deck for {top_name}"
        )
        sql_lines.append(
            f"INSERT INTO decks (id, deck_code, slug, title, description, owner_id, language_id, topic_id, level_id, exam_type_id, cover_image_url, visibility, status, is_active, total_cards, created_at, updated_at) "
            f"VALUES ({target_deck_id}, '{deck_code}', '{deck_slug}', '{deck_title}', '{deck_desc}', @admin_id, @lang_en_id, {topic_id}, 1, 1, '{cover_img}', 'PUBLIC', 'PUBLISHED', 1, {len(items)}, NOW(), NOW());"
        )
    
    # Insert Flashcards
    deck_card_items = []
    for card_idx, item in enumerate(items):
        w_clean = item['word'].lower().strip()
        
        if w_clean in existing_cards_db:
            continue
        
        card_id_counter += 1
        current_card_id = card_id_counter
        total_new_cards_created += 1
        
        w = escape_sql(item['word'])
        trans = escape_sql(item['translation'])
        ipa = escape_sql(item['phonetic'])
        ex = escape_sql(item['example'])
        pos = escape_sql(item['pos'])
        
        hint = escape_sql(f"{pos} | {top_name}")
        note = escape_sql(f"POS: {pos} | Level: TOEIC Dưới 500 | Source: TOEIC Vocabulary 600")
        
        sql_lines.append(
            f"INSERT INTO flashcards (id, deck_id, front_text, back_text, phonetic, example_text, hint, note, card_order, is_active, created_by, created_at, updated_at) "
            f"VALUES ({current_card_id}, {target_deck_id}, '{w}', '{trans}', '{ipa}', '{ex}', '{hint}', '{note}', {card_idx + 1}, 1, @admin_id, NOW(), NOW());"
        )
        deck_card_items.append(item)
    
    # Determine Quizzes count for this Deck
    quiz_count = 2 if len(items) >= 15 else 1
    
    for qz_idx in range(quiz_count):
        quiz_id_counter += 1
        current_quiz_id = quiz_id_counter
        total_new_quizzes_created += 1
        
        quiz_num = qz_idx + 1
        quiz_title = escape_sql(f"TOEIC Dưới 500 Quiz - {top_name} #{quiz_num:02d}")
        quiz_desc = escape_sql(f"Bài kiểm tra từ vựng TOEIC Cơ bản (Dưới 500) chủ đề {top_name}.")
        quiz_code = f"TOEIC-U500-QUIZ-T{topic_id}-Q{current_quiz_id}"
        
        sql_lines.append(
            f"INSERT INTO quizzes (id, deck_id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, total_questions, is_active, quiz_category, exam_type_id, level_id, created_by, created_at, updated_at) "
            f"VALUES ({current_quiz_id}, {target_deck_id}, '{quiz_code}', '{quiz_title}', '{quiz_desc}', 'MULTIPLE_CHOICE', 1200, 80, {len(items)}, 1, 'NORMAL', 1, 1, @admin_id, NOW(), NOW());"
        )
        
        # Create Quiz Questions from items
        for q_idx, item in enumerate(items):
            question_id_counter += 1
            current_question_id = question_id_counter
            total_new_questions_created += 1
            
            w = escape_sql(item['word'])
            trans = escape_sql(item['translation'])
            pos = escape_sql(item['pos'])
            
            if q_idx % 3 == 0:
                q_text = escape_sql(f"Từ '{w}' ({pos}) có nghĩa là gì trong tiếng Việt?")
                q_exp = escape_sql(f"'{w}' ({pos}) nghĩa là: {trans}. Ví dụ: {item['example']}")
            elif q_idx % 3 == 1:
                sentence_blank = item['example'].replace(item['word'], "______").replace(item['word'].capitalize(), "______")
                q_text = escape_sql(f"Chọn từ đúng điền vào chỗ trống: \"{sentence_blank}\"")
                q_exp = escape_sql(f"Đáp án đúng là '{w}' ({trans}). Câu hoàn chỉnh: {item['example']}")
            else:
                q_text = escape_sql(f"Từ tiếng Anh nào có nghĩa là '{trans}' ({pos})?")
                q_exp = escape_sql(f"Nghĩa '{trans}' tương ứng với từ tiếng Anh '{w}'.")

            sql_lines.append(
                f"INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, display_order, explanation, is_active, created_at, updated_at) "
                f"VALUES ({current_question_id}, {current_quiz_id}, '{q_text}', 'MULTIPLE_CHOICE', 10, {q_idx + 1}, '{q_exp}', 1, NOW(), NOW());"
            )
            
            distractors = [it for it in items if it['word'] != item['word']]
            if len(distractors) < 3:
                distractors = [it for it in TOEIC_U500_DATA if it['word'] != item['word']]
            
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

# Recount total_cards for all Level 1 decks
sql_lines.append("\n-- 3. Recount total_cards for Level 1 Decks")
sql_lines.append("""
UPDATE decks d
SET total_cards = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id)
WHERE d.level_id = 1;
""")

output_v40_sql_path = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V40__seed_u500_toeic_vocabulary_decks_quizzes.sql"

with open(output_v40_sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"\nGenerated V40 Migration File at: {output_v40_sql_path}")
print(f"Summary: New Cards Created: {total_new_cards_created}, New Decks: {total_new_decks_created}, New Quizzes: {total_new_quizzes_created}, New Questions: {total_new_questions_created}")

conn.close()
