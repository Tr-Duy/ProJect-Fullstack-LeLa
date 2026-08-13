-- V14__clear_dummy_data.sql
-- Xóa toàn bộ dữ liệu mẫu (Dummy data) để chuẩn bị cho môi trường thực tế.
-- Lưu ý: Chúng ta dùng DELETE thay vì TRUNCATE để giữ nguyên Auto Increment 
-- và tránh lỗi Foreign Key Constraint trong MySQL.

-- 1. Xóa lịch sử học tập & Gamification
DELETE FROM srs_reviews;
DELETE FROM card_progress;
DELETE FROM daily_learning_activities;
DELETE FROM user_achievements;
DELETE FROM review_sessions;

-- 2. Xóa dữ liệu học viên tham gia bộ thẻ
DELETE FROM deck_enrollments;

-- 3. Xóa nội dung học (Flashcards, Quizzes)
DELETE FROM flashcards;
DELETE FROM quiz_answers;
DELETE FROM quiz_attempt_options;
DELETE FROM quiz_attempt_questions;
DELETE FROM quiz_attempts;
DELETE FROM quiz_question_options;
DELETE FROM quiz_questions;
DELETE FROM quizzes;

-- 4. Xóa bộ thẻ
DELETE FROM decks;

-- (Optional) Nếu muốn xóa luôn users ảo, bỏ comment bên dưới:
-- DELETE FROM users WHERE username NOT IN ('admin', 'testuser');
