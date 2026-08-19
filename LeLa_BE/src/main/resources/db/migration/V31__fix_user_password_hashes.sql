-- V31__fix_user_password_hashes.sql
-- Cập nhật password_hash hợp lệ cho các tài khoản seed (admin, learner1, learner2) với mật khẩu '123456'

UPDATE users 
SET password_hash = '$2a$10$70NHF6uEzsz.eR97n0I29..XrPftergfKlJwDR0AhQ.boDRn73ble' 
WHERE username IN ('admin', 'learner1', 'learner2');
