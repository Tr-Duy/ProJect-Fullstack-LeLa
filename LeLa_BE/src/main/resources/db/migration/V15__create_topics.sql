-- V15__create_topics.sql

CREATE TABLE topics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon_url VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_topics_name (name),
    UNIQUE KEY uk_topics_slug (slug)
);

-- Bổ sung một Chủ đề mặc định trước khi liên kết
INSERT INTO topics (id, name, slug, description) VALUES (1, 'General', 'general', 'Chủ đề mặc định');

-- Thêm cột topic_id vào decks
ALTER TABLE decks ADD COLUMN topic_id BIGINT;

-- Cập nhật tất cả các decks hiện tại (nếu có) sang topic mặc định
UPDATE decks SET topic_id = 1;

-- Thêm khóa ngoại cho decks
ALTER TABLE decks ADD CONSTRAINT fk_decks_topic FOREIGN KEY (topic_id) REFERENCES topics (id);

-- Cuối cùng, drop cột category cũ
ALTER TABLE decks DROP COLUMN category;
