import mysql.connector
import sys
import os
import re
import random

sys.stdout.reconfigure(encoding='utf-8')

def escape_sql(val):
    if val is None:
        return ""
    # For SQL file generation: replace ' with '' and \ with \\
    return str(val).replace("\\", "\\\\").replace("'", "''")

def clean_deck_title(title):
    if not title:
        return "Vocabulary"
    t = title
    t = re.sub(r'^(TOEIC\s+(Dưới 500|500-700|700-850|850-990)\s*-\s*)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'^(Oxford 5000\s*-\s*TOEIC\s+[^-\n]+\s*-\s*)', '', t, flags=re.IGNORECASE)
    return t.strip()

def main():
    cnx = mysql.connector.connect(
        host='localhost',
        port=3306,
        user='root',
        password='123456',
        database='lela_db'
    )
    cur = cnx.cursor(dictionary=True)

    print("=== 1. CHECK & ALTER TABLE QUIZZES FOR DIFFICULTY COLUMN ===")
    cur.execute("SHOW COLUMNS FROM quizzes LIKE 'difficulty'")
    diff_col = cur.fetchone()
    if not diff_col:
        print("Adding difficulty column to quizzes table...")
        cur.execute("ALTER TABLE quizzes ADD COLUMN difficulty VARCHAR(20) DEFAULT NULL")
        cnx.commit()

    print("=== 2. FETCH ALL DECKS & FLASHCARDS ===")
    cur.execute("SELECT id, deck_code, title, level_id, topic_id FROM decks WHERE deleted_at IS NULL ORDER BY level_id, id")
    decks = cur.fetchall()
    print(f"Total active decks found: {len(decks)}")

    # Fetch all flashcards grouped by deck
    cur.execute("SELECT id, deck_id, front_text, back_text, phonetic, example_text, hint FROM flashcards WHERE deleted_at IS NULL")
    all_cards = cur.fetchall()
    cards_by_deck = {}
    cards_by_level = {}
    all_card_list = []

    for c in all_cards:
        dk = c['deck_id']
        cards_by_deck.setdefault(dk, []).append(c)
        all_card_list.append(c)

    for d in decks:
        lvl = d['level_id']
        cards_by_level.setdefault(lvl, []).extend(cards_by_deck.get(d['id'], []))

    # Fetch admin user ID
    cur.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1")
    admin_user = cur.fetchone()
    admin_id = admin_user['id'] if admin_user else 1

    # Fetch max IDs for new inserts
    cur.execute("SELECT COALESCE(MAX(id), 0) AS m FROM quizzes")
    max_quiz_id = cur.fetchone()['m']
    cur.execute("SELECT COALESCE(MAX(id), 0) AS m FROM quiz_questions")
    max_question_id = cur.fetchone()['m']
    cur.execute("SELECT COALESCE(MAX(id), 0) AS m FROM quiz_question_options")
    max_option_id = cur.fetchone()['m']

    quiz_id_counter = max(max_quiz_id + 1, 3000)
    question_id_counter = max(max_question_id + 1, 30000)
    option_id_counter = max(max_option_id + 1, 120000)

    sql_statements = []
    sql_statements.append("-- ========================================================")
    sql_statements.append("-- V43: SYNC 3 QUIZZES (EASY, MEDIUM, HARD) PER DECK")
    sql_statements.append("-- ========================================================")
    sql_statements.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_statements.append(f"SET @admin_id = {admin_id};")
    sql_statements.append("")

    total_easy_quizzes = 0
    total_medium_quizzes = 0
    total_hard_quizzes = 0
    total_questions_generated = 0

    for deck in decks:
        deck_id = deck['id']
        deck_level = deck['level_id']
        raw_title = deck['title']
        clean_title = clean_deck_title(raw_title)

        deck_cards = cards_by_deck.get(deck_id, [])
        level_cards = cards_by_level.get(deck_level, [])
        if len(level_cards) < 15:
            level_cards = all_card_list

        # Fetch existing normal quizzes for this deck
        cur.execute("SELECT id, quiz_code, title, total_questions, difficulty, pass_score FROM quizzes WHERE deck_id = %s AND quiz_category = 'NORMAL' AND deleted_at IS NULL ORDER BY id", (deck_id,))
        existing_quizzes = cur.fetchall()

        # Map or assign 3 quizzes (EASY, MEDIUM, HARD)
        quiz_map = {'EASY': None, 'MEDIUM': None, 'HARD': None}
        unassigned_existing = []

        for eq in existing_quizzes:
            code = (eq['quiz_code'] or '').upper()
            diff = (eq['difficulty'] or '').upper()
            if 'EASY' in diff or 'QUICK' in code or 'EASY' in code:
                if not quiz_map['EASY']:
                    quiz_map['EASY'] = eq
                else:
                    unassigned_existing.append(eq)
            elif 'MEDIUM' in diff or 'STD' in code or 'MEDIUM' in code:
                if not quiz_map['MEDIUM']:
                    quiz_map['MEDIUM'] = eq
                else:
                    unassigned_existing.append(eq)
            elif 'HARD' in diff or 'CHALLENGE' in code or 'HARD' in code:
                if not quiz_map['HARD']:
                    quiz_map['HARD'] = eq
                else:
                    unassigned_existing.append(eq)
            else:
                unassigned_existing.append(eq)

        # Fill in unassigned into empty slots if any
        for target_diff in ['EASY', 'MEDIUM', 'HARD']:
            if not quiz_map[target_diff] and unassigned_existing:
                quiz_map[target_diff] = unassigned_existing.pop(0)

        # Deactivate extra unassigned quizzes if any
        for extra in unassigned_existing:
            cur.execute("UPDATE quizzes SET is_active = 0, deleted_at = NOW() WHERE id = %s", (extra['id'],))
            sql_statements.append(f"UPDATE quizzes SET is_active = 0, deleted_at = NOW() WHERE id = {extra['id']};")

        # Configurations for 3 difficulties
        diff_configs = [
            ('EASY', 5, f"🟢 Luyện nhanh - {clean_title}", f"DECK-{deck_id}-EASY", "Bài kiểm tra cấp độ Dễ (5 câu, đạt 70%)"),
            ('MEDIUM', 10, f"🟡 Kiểm tra - {clean_title}", f"DECK-{deck_id}-MEDIUM", "Bài kiểm tra cấp độ Vừa (10 câu, đạt 70%)"),
            ('HARD', 15, f"🔴 Thử thách - {clean_title}", f"DECK-{deck_id}-HARD", "Bài kiểm tra cấp độ Khó (15 câu, đạt 70%)")
        ]

        for diff, target_q_count, default_quiz_title, default_quiz_code, quiz_desc in diff_configs:
            existing_q = quiz_map[diff]
            if existing_q:
                quiz_id = existing_q['id']
                cur.execute("""
                    UPDATE quizzes SET 
                        title = %s, 
                        description = %s, 
                        total_questions = %s, 
                        pass_score = 70.00, 
                        difficulty = %s, 
                        level_id = %s, 
                        is_active = 1, 
                        updated_at = NOW() 
                    WHERE id = %s
                """, (default_quiz_title, quiz_desc, target_q_count, diff, deck_level, quiz_id))

                sql_statements.append(
                    f"UPDATE quizzes SET "
                    f"title = '{escape_sql(default_quiz_title)}', "
                    f"description = '{escape_sql(quiz_desc)}', "
                    f"total_questions = {target_q_count}, "
                    f"pass_score = 70.00, "
                    f"difficulty = '{diff}', "
                    f"level_id = {deck_level if deck_level is not None else 'NULL'}, "
                    f"is_active = 1, "
                    f"updated_at = NOW() "
                    f"WHERE id = {quiz_id};"
                )
            else:
                quiz_id_counter += 1
                quiz_id = quiz_id_counter
                cur.execute("""
                    INSERT INTO quizzes (id, deck_id, quiz_code, title, description, quiz_type, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, version, created_at, updated_at, quiz_category, level_id, difficulty, created_by) 
                    VALUES (%s, %s, %s, %s, %s, 'MULTIPLE_CHOICE', 70.00, 3, 1, 1, %s, 1, 0, NOW(), NOW(), 'NORMAL', %s, %s, %s)
                """, (quiz_id, deck_id, default_quiz_code, default_quiz_title, quiz_desc, target_q_count, deck_level, diff, admin_id))

                sql_statements.append(
                    f"INSERT INTO quizzes (id, deck_id, quiz_code, title, description, quiz_type, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, version, created_at, updated_at, quiz_category, level_id, difficulty, created_by) "
                    f"VALUES ({quiz_id}, {deck_id}, '{default_quiz_code}', '{escape_sql(default_quiz_title)}', '{escape_sql(quiz_desc)}', 'MULTIPLE_CHOICE', 70.00, 3, 1, 1, {target_q_count}, 1, 0, NOW(), NOW(), 'NORMAL', {deck_level if deck_level is not None else 'NULL'}, '{diff}', {admin_id});"
                )

            if diff == 'EASY':
                total_easy_quizzes += 1
            elif diff == 'MEDIUM':
                total_medium_quizzes += 1
            else:
                total_hard_quizzes += 1

            # Delete existing questions for this quiz to replace with standardized question set
            cur.execute("DELETE FROM quiz_question_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = %s)", (quiz_id,))
            cur.execute("DELETE FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))

            sql_statements.append(f"DELETE FROM quiz_question_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = {quiz_id});")
            sql_statements.append(f"DELETE FROM quiz_questions WHERE quiz_id = {quiz_id};")

            # Generate target_q_count questions
            rng = random.Random(deck_id * 100 + target_q_count)

            pool = list(deck_cards)
            if len(pool) == 0:
                pool = list(level_cards)

            extended_pool = list(pool)
            while len(extended_pool) < target_q_count:
                extra = rng.choice(level_cards)
                extended_pool.append(extra)

            rng.shuffle(extended_pool)

            for q_idx in range(target_q_count):
                card = extended_pool[q_idx % len(extended_pool)]
                word = (card['front_text'] or "vocabulary").strip()
                meaning = (card['back_text'] or "nghĩa của từ").strip()
                phonetic = (card['phonetic'] or "").strip()
                example = (card['example_text'] or "").strip()

                # Distractors pool
                other_distractors = [c['back_text'].strip() for c in level_cards if c['back_text'] and c['back_text'].strip() != meaning]
                if len(other_distractors) < 3:
                    other_distractors.extend(["Phương án khác A", "Phương án khác B", "Phương án khác C", "Phương án khác D"])
                rng.shuffle(other_distractors)
                wrong_meanings = other_distractors[:3]

                # Question type template
                q_type_mod = (q_idx + (1 if diff == 'MEDIUM' else (2 if diff == 'HARD' else 0))) % 4

                if q_type_mod == 0:
                    q_text = f"Nghĩa của từ \"{word}\" ({phonetic}) là gì?" if phonetic else f"Nghĩa của từ \"{word}\" là gì?"
                    correct_opt = meaning
                    wrong_opts = wrong_meanings
                elif q_type_mod == 1:
                    q_text = f"Từ tiếng Anh nào có nghĩa là: \"{meaning}\"?"
                    correct_opt = word
                    wrong_words = [c['front_text'].strip() for c in level_cards if c['front_text'] and c['front_text'].strip().lower() != word.lower()]
                    if len(wrong_words) < 3:
                        wrong_words.extend(["Option A", "Option B", "Option C"])
                    rng.shuffle(wrong_words)
                    wrong_opts = wrong_words[:3]
                elif q_type_mod == 2:
                    if example and word.lower() in example.lower():
                        pattern = re.compile(re.escape(word), re.IGNORECASE)
                        blanked_sentence = pattern.sub("________", example)
                        q_text = f"Chọn từ thích hợp điền vào chỗ trống: \"{blanked_sentence}\""
                    else:
                        q_text = f"Điền từ phù hợp vào ngữ cảnh: \"The manager requested a clear ________ regarding {word}.\""
                    correct_opt = word
                    wrong_words = [c['front_text'].strip() for c in level_cards if c['front_text'] and c['front_text'].strip().lower() != word.lower()]
                    if len(wrong_words) < 3:
                        wrong_words.extend(["strategy", "compliance", "agreement"])
                    rng.shuffle(wrong_words)
                    wrong_opts = wrong_words[:3]
                else:
                    q_text = f"Trong môi trường làm việc, từ \"{word}\" mang ý nghĩa nào sau đây?"
                    correct_opt = meaning
                    wrong_opts = wrong_meanings

                question_id_counter += 1
                question_id = question_id_counter
                card_id_val = card['id'] if card.get('id') is not None else None

                cur.execute("""
                    INSERT INTO quiz_questions (id, quiz_id, source_card_id, question_text, question_type, explanation, points, question_time_limit_seconds, display_order, is_active, version, created_at, updated_at) 
                    VALUES (%s, %s, %s, %s, 'MULTIPLE_CHOICE', %s, 10, 30, %s, 1, 0, NOW(), NOW())
                """, (question_id, quiz_id, card_id_val, q_text, f"Đáp án chính xác là: {correct_opt}", q_idx + 1))

                card_id_sql = card_id_val if card_id_val is not None else 'NULL'
                sql_statements.append(
                    f"INSERT INTO quiz_questions (id, quiz_id, source_card_id, question_text, question_type, explanation, points, question_time_limit_seconds, display_order, is_active, version, created_at, updated_at) "
                    f"VALUES ({question_id}, {quiz_id}, {card_id_sql}, '{escape_sql(q_text)}', 'MULTIPLE_CHOICE', 'Đáp án chính xác là: {escape_sql(correct_opt)}', 10, 30, {q_idx + 1}, 1, 0, NOW(), NOW());"
                )
                total_questions_generated += 1

                # Generate 4 options (1 correct, 3 wrong)
                options = [(correct_opt, 1)] + [(w, 0) for w in wrong_opts]
                rng.shuffle(options)

                opt_keys = ['A', 'B', 'C', 'D']
                for opt_idx, (opt_text, is_correct) in enumerate(options):
                    option_id_counter += 1
                    opt_key = opt_keys[opt_idx]
                    cur.execute("""
                        INSERT INTO quiz_question_options (id, question_id, option_key, option_text, normalized_text, is_correct, display_order, created_at, updated_at) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, (option_id_counter, question_id, opt_key, opt_text, opt_text.lower().strip(), is_correct, opt_idx + 1))

                    sql_statements.append(
                        f"INSERT INTO quiz_question_options (id, question_id, option_key, option_text, normalized_text, is_correct, display_order, created_at, updated_at) "
                        f"VALUES ({option_id_counter}, {question_id}, '{opt_key}', '{escape_sql(opt_text)}', '{escape_sql(opt_text.lower().strip())}', {is_correct}, {opt_idx + 1}, NOW(), NOW());"
                    )

    sql_statements.append("")
    sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;")
    sql_statements.append("")

    # Commit all DB transactions
    cnx.commit()
    print("Direct MySQL Database Synchronization Completed Successfully!")

    # Write SQL Migration file V43
    be_migration_dir = os.path.abspath(r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration")
    v43_file_path = os.path.join(be_migration_dir, "V43__sync_three_quizzes_per_deck.sql")

    print(f"\nWriting migration SQL to: {v43_file_path}")
    with open(v43_file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))

    print(f"Migration file V43 created successfully!")

    # Record migration in flyway_schema_history if table exists
    cur.execute("SHOW TABLES LIKE 'flyway_schema_history'")
    if cur.fetchone():
        cur.execute("SELECT COALESCE(MAX(installed_rank), 0) + 1 AS next_rank FROM flyway_schema_history")
        next_rank = cur.fetchone()['next_rank']
        cur.execute("""
            INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
            VALUES (%s, '43', 'sync three quizzes per deck', 'SQL', 'V43__sync_three_quizzes_per_deck.sql', 0, 'root', NOW(), 100, 1)
            ON DUPLICATE KEY UPDATE success = 1
        """, (next_rank,))
        cnx.commit()
        print("Updated flyway_schema_history for V43!")

    print(f"\n=== FINAL SUMMARY ===")
    print(f"Total Decks Processed: {len(decks)}")
    print(f"EASY Quizzes (5 Qs, 70%): {total_easy_quizzes}")
    print(f"MEDIUM Quizzes (10 Qs, 70%): {total_medium_quizzes}")
    print(f"HARD Quizzes (15 Qs, 70%): {total_hard_quizzes}")
    print(f"Total NORMAL Quizzes: {total_easy_quizzes + total_medium_quizzes + total_hard_quizzes}")
    print(f"Total Questions Created: {total_questions_generated}")

    cur.close()
    cnx.close()

if __name__ == "__main__":
    main()
