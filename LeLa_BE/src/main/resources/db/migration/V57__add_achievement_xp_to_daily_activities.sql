-- V57__add_achievement_xp_to_daily_activities.sql
-- Tách riêng achievement_xp trong daily_learning_activities để không cắn vào dailyXpCap của phần luyện tập
ALTER TABLE daily_learning_activities
    ADD COLUMN achievement_xp INT NOT NULL DEFAULT 0 AFTER xp_earned;
