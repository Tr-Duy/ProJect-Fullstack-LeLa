CREATE TABLE exam_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    max_scale_score DECIMAL(7,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE proficiency_levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_type_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    min_score DECIMAL(7,2) NOT NULL,
    max_score DECIMAL(7,2) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE
);

-- Seed Exam Types
INSERT INTO exam_types (id, code, name, max_scale_score) VALUES 
(1, 'TOEIC', 'TOEIC', 990.00),
(2, 'VSTEP', 'VSTEP', 10.00);

-- Seed Proficiency Levels for TOEIC
INSERT INTO proficiency_levels (exam_type_id, code, name, min_score, max_score, display_order) VALUES
(1, 'TOEIC_BASIC', 'Cơ bản (Dưới 500)', 0, 499.99, 1),
(1, 'TOEIC_INTERMEDIATE', 'Trung bình - Khá (500 - 700)', 500, 700.99, 2),
(1, 'TOEIC_ADVANCED', 'Khá - Giỏi (700 - 850)', 701, 850.99, 3),
(1, 'TOEIC_EXCELLENT', 'Xuất sắc (850 - 990)', 851, 990, 4);

-- Seed Proficiency Levels for VSTEP
INSERT INTO proficiency_levels (exam_type_id, code, name, min_score, max_score, display_order) VALUES
(2, 'VSTEP_B1', 'Bậc 3 / B1 (4.0 - 5.5)', 4.0, 5.59, 1),
(2, 'VSTEP_B2', 'Bậc 4 / B2 (6.0 - 8.0)', 6.0, 8.09, 2),
(2, 'VSTEP_C1', 'Bậc 5 / C1 (8.5 - 10)', 8.5, 10, 3);

-- Alter Tables
ALTER TABLE decks ADD COLUMN exam_type_id BIGINT NULL;
ALTER TABLE decks ADD COLUMN level_id BIGINT NULL;
ALTER TABLE decks ADD CONSTRAINT fk_deck_exam FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE SET NULL;
ALTER TABLE decks ADD CONSTRAINT fk_deck_level FOREIGN KEY (level_id) REFERENCES proficiency_levels(id) ON DELETE SET NULL;

ALTER TABLE quizzes ADD COLUMN quiz_category VARCHAR(30) DEFAULT 'NORMAL';
ALTER TABLE quizzes ADD COLUMN exam_type_id BIGINT NULL;
ALTER TABLE quizzes ADD COLUMN level_id BIGINT NULL;
ALTER TABLE quizzes MODIFY COLUMN deck_id BIGINT NULL;
ALTER TABLE quizzes ADD CONSTRAINT fk_quiz_exam FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE SET NULL;
ALTER TABLE quizzes ADD CONSTRAINT fk_quiz_level FOREIGN KEY (level_id) REFERENCES proficiency_levels(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN current_exam_type_id BIGINT NULL;
ALTER TABLE users ADD COLUMN current_level_id BIGINT NULL;
ALTER TABLE users ADD CONSTRAINT fk_user_exam FOREIGN KEY (current_exam_type_id) REFERENCES exam_types(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_user_level FOREIGN KEY (current_level_id) REFERENCES proficiency_levels(id) ON DELETE SET NULL;
