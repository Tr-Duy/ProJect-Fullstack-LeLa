-- V51__clean_dirty_flashcard_data.sql
-- Làm sạch dữ liệu flashcards bị lỗi cào: tách từ gốc, trích xuất từ loại, chuyển định nghĩa tiếng Anh sang definition

-- 1. Xử lý các thẻ có 'v.,'
UPDATE flashcards
SET
    part_of_speech = 'v',
    definition = CASE
        WHEN definition IS NULL OR definition = '' THEN TRIM(SUBSTRING(front_text, LOCATE('v.,', front_text) + 4))
        ELSE definition
    END,
    front_text = TRIM(SUBSTRING(front_text, 1, LOCATE('v.,', front_text) - 1))
WHERE front_text LIKE '%v.,%';

-- 2. Xử lý các thẻ có 'n.,'
UPDATE flashcards
SET
    part_of_speech = 'n',
    definition = CASE
        WHEN definition IS NULL OR definition = '' THEN TRIM(SUBSTRING(front_text, LOCATE('n.,', front_text) + 4))
        ELSE definition
    END,
    front_text = TRIM(SUBSTRING(front_text, 1, LOCATE('n.,', front_text) - 1))
WHERE front_text LIKE '%n.,%';

-- 3. Xử lý các thẻ có 'adj.,'
UPDATE flashcards
SET
    part_of_speech = 'adj',
    definition = CASE
        WHEN definition IS NULL OR definition = '' THEN TRIM(SUBSTRING(front_text, LOCATE('adj.,', front_text) + 6))
        ELSE definition
    END,
    front_text = TRIM(SUBSTRING(front_text, 1, LOCATE('adj.,', front_text) - 1))
WHERE front_text LIKE '%adj.,%';

-- 4. Xử lý các thẻ có 'adv.,'
UPDATE flashcards
SET
    part_of_speech = 'adv',
    definition = CASE
        WHEN definition IS NULL OR definition = '' THEN TRIM(SUBSTRING(front_text, LOCATE('adv.,', front_text) + 6))
        ELSE definition
    END,
    front_text = TRIM(SUBSTRING(front_text, 1, LOCATE('adv.,', front_text) - 1))
WHERE front_text LIKE '%adv.,%';

-- 5. Xử lý dấu ngoặc chứa từ loại '(v.)', '(n.)', '(adj.)', '(adv.)'
UPDATE flashcards SET part_of_speech = 'v', front_text = TRIM(REPLACE(front_text, '(v.)', '')) WHERE front_text LIKE '%(v.)%';
UPDATE flashcards SET part_of_speech = 'n', front_text = TRIM(REPLACE(front_text, '(n.)', '')) WHERE front_text LIKE '%(n.)%';
UPDATE flashcards SET part_of_speech = 'adj', front_text = TRIM(REPLACE(front_text, '(adj.)', '')) WHERE front_text LIKE '%(adj.)%';
UPDATE flashcards SET part_of_speech = 'adv', front_text = TRIM(REPLACE(front_text, '(adv.)', '')) WHERE front_text LIKE '%(adv.)%';

-- 6. Xử lý dấu ngoặc '(v)', '(n)', '(adj)', '(adv)'
UPDATE flashcards SET part_of_speech = 'v', front_text = TRIM(REPLACE(front_text, '(v)', '')) WHERE front_text LIKE '%(v)%';
UPDATE flashcards SET part_of_speech = 'n', front_text = TRIM(REPLACE(front_text, '(n)', '')) WHERE front_text LIKE '%(n)%';
UPDATE flashcards SET part_of_speech = 'adj', front_text = TRIM(REPLACE(front_text, '(adj)', '')) WHERE front_text LIKE '%(adj)%';
UPDATE flashcards SET part_of_speech = 'adv', front_text = TRIM(REPLACE(front_text, '(adv)', '')) WHERE front_text LIKE '%(adv)%';

-- 7. Xóa dấu phẩy, chấm thừa ở cuối từ vựng
UPDATE flashcards SET front_text = TRIM(TRAILING ',' FROM front_text) WHERE front_text LIKE '%,';
UPDATE flashcards SET front_text = TRIM(TRAILING '.' FROM front_text) WHERE front_text LIKE '%.';
UPDATE flashcards SET front_text = TRIM(TRAILING ';' FROM front_text) WHERE front_text LIKE '%;';

-- 8. Làm sạch các chuỗi phiên âm phonetic bị rác gán nguyên cả câu dài
UPDATE flashcards SET phonetic = NULL
WHERE phonetic LIKE '%to become%'
   OR phonetic LIKE '%v.,%'
   OR phonetic LIKE '%n.,%'
   OR phonetic LIKE '%to reach%'
   OR phonetic LIKE '%to have%'
   OR phonetic LIKE '%to find%'
   OR LENGTH(phonetic) > 40;
