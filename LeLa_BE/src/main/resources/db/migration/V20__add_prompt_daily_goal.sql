-- V20: Add prompt_daily_goal to users
ALTER TABLE users ADD COLUMN prompt_daily_goal BOOLEAN NOT NULL DEFAULT TRUE;
