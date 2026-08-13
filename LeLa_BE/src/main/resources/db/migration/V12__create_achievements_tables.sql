CREATE TABLE achievements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    icon_url VARCHAR(200),
    xp_reward INT NOT NULL,
    condition_type VARCHAR(50),
    condition_value INT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_achievements_code (code)
);

CREATE TABLE user_achievements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    unlocked_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_achievements (user_id, achievement_id),
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
);

INSERT INTO achievements (code, title, description, xp_reward, condition_type, condition_value) VALUES
('FIRST_REVIEW', 'Bước đi đầu tiên', 'Hoàn thành thẻ ôn tập đầu tiên của bạn.', 50, 'CARDS_REVIEWED', 1),
('STREAK_3_DAYS', 'Ba ngày nhiệt huyết', 'Duy trì chuỗi học tập trong 3 ngày liên tiếp.', 100, 'STREAK', 3),
('STREAK_7_DAYS', 'Một tuần nỗ lực', 'Duy trì chuỗi học tập trong 7 ngày liên tiếp.', 300, 'STREAK', 7),
('XP_1000', 'Thợ săn điểm số', 'Đạt tổng cộng 1,000 XP.', 200, 'XP', 1000),
('DECKS_1', 'Người mới bắt đầu', 'Học xong ít nhất 1 bộ thẻ.', 150, 'DECKS_LEARNED', 1);
