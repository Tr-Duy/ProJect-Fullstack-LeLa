-- V32__seed_600_toeic_vocabulary.sql
-- Seed toàn bộ 600 TOEIC Vocabulary (792 từ & dạng từ xuất hiện trong PDF 50 Lessons)

-- 1. Variables setup
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @lang_en_id = (SELECT id FROM languages WHERE language_code = 'en' LIMIT 1);

-- 2. Tạo Topic 'TOEIC Vocabulary' nếu chưa có
INSERT INTO topics (name, slug, description, is_active)
VALUES ('TOEIC Vocabulary', 'toeic-vocabulary', 'Từ vựng tiếng Anh luyện thi TOEIC theo 50 chủ đề thông dụng.', true)
ON DUPLICATE KEY UPDATE id=id;

SET @topic_id = (SELECT id FROM topics WHERE slug = 'toeic-vocabulary' LIMIT 1);

-- 3. Tạo Deck '600 TOEIC Vocabulary' nếu chưa có
INSERT INTO decks (
    deck_code, slug, title, description, cover_image_url, owner_id, language_id, topic_id, 
    difficulty, visibility, status, is_featured, total_cards, display_mode
) VALUES (
    'DECK-TOEIC-600', 
    '600-tu-vung-toeic-co-dich-tieng-viet', 
    '600 Từ Vựng TOEIC Căn Bản (Có dịch tiếng Việt)', 
    'Bộ từ vựng luyện thi TOEIC đầy đủ 50 bài học từ tài liệu 600 Từ Vựng TOEIC có dịch tiếng Việt.', 
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop', 
    @admin_id, 
    @lang_en_id, 
    @topic_id, 
    'BEGINNER', 
    'PUBLIC', 
    'PUBLISHED', 
    true, 
    792, 
    'RANDOM'
) ON DUPLICATE KEY UPDATE id=id;

SET @toeic_deck_id = (SELECT id FROM decks WHERE deck_code = 'DECK-TOEIC-600' LIMIT 1);

-- 4. Insert Flashcards dùng INSERT ... SELECT ... WHERE NOT EXISTS (...)
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Abide by (v.)', 'Tuân theo, chịu theo', 'to comply with, to conform', 'L1 Contracts', 1, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Abide by (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Agreement (n.)', 'Sự thoả thuận', 'a mutual arrangement, a contract', 'L1 Contracts', 2, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Agreement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Agree (v.)', 'Đồng ý', 'agreeable adj.', 'L1 Contracts', 3, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Agree (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assurance (n.)', 'Bảo đảm, chắc chắn', 'q guarantee, confidence', 'L1 Contracts', 4, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assurance (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Cancel (v.)', 'Hủy bỏ', 'to annul, to call off', 'L1 Contracts', 5, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Cancel (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Determine (v.)', 'Giải quyết vấn đề, xác định', 'to find out, to influence', 'L1 Contracts', 6, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Determine (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Engage (v.)', 'Thuê mướn, hứa hẹn', 'to hire, to involve+', 'L1 Contracts', 7, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Engage (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Establish (v.)', 'Thành lập, thiết lập', 'to institute permanently, to bring about', 'L1 Contracts', 8, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Establish (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Obligate (v.)', 'Bắt buộc, ép buộc', 'to bind legally or morally', 'L1 Contracts', 9, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Obligate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Obligation (n.)', 'Nghĩa vụ, bổn phận', 'obligatory adj.', 'L1 Contracts', 10, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Obligation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Party (n.)', 'Nhóm làm việc chung, bên tham gia', 'a person or group participating in an action or plan, the persons or sides concerned in a legal matter', 'L1 Contracts', 11, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Party (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Provision (n.)', 'Sự cung cấp, điều khoản', 'a measure taken beforehand, a stipulation', 'L1 Contracts', 12, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Provision (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Provider (n.)', 'Nhà cung cấp', 'provision n.', 'L1 Contracts', 13, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Provider (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Resolve (v.)', 'Kiên quyết, giải quyết', 'to deal with successfully, to declare', 'L1 Contracts', 14, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Resolve (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Specify (v.)', 'Định rõ, ghi rõ', 'to mention explicitly', 'L1 Contracts', 15, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Specify (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Specification (v.)', 'Sự chỉ rõ, đặc tả', 'specific adj.', 'L1 Contracts', 16, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Specification (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attract (v.)', 'Thu hút, hấp dẫn', 'to draw by appeal', 'L2 Marketing', 17, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attract (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attraction (n.)', 'Sự thu hút, sức hấp dẫn', 'attractive adj.', 'L2 Marketing', 18, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attraction (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compare (v.)', 'So sánh, đối chiếu', 'to examine similarities and differences', 'L2 Marketing', 19, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compare (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Comparison (n.)', 'Sự so sánh', 'comparable adj.', 'L2 Marketing', 20, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Comparison (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compete (v.)', 'Cạnh tranh, tranh đua', 'to strive against a rival', 'L2 Marketing', 21, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compete (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consume (v.)', 'Tiêu dùng, sử dụng', 'to absorb, to use up', 'L2 Marketing', 22, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consume (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consumer (n.)', 'Người tiêu dùng', 'consumable adj.', 'L2 Marketing', 23, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consumer (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Convince (v.)', 'Thuyết phục', 'to bring to believe by argument, to persuade', 'L2 Marketing', 24, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Convince (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Current (adj.)', 'Đang thịnh hành, hiện tại', 'Happening or existing at the present time, adv. To be on top of things', 'L2 Marketing', 25, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Current (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fad (n.)', 'Mốt nhất thời, xu hướng ngắn hạn', 'a practice followed enthusiastically for a short time, a craze', 'L2 Marketing', 26, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fad (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Inspire (v.)', 'Truyền cảm hứng', 'to spur on, to stimulate imagination or emotion', 'L2 Marketing', 27, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Inspire (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Market (v.)', 'Thị trường, chợ', 'the course of buying and selling a product, n. the demand for a product', 'L2 Marketing', 28, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Market (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Marketing (n.)', 'Tiếp thị, thương mại hóa', 'marketable adj.', 'L2 Marketing', 29, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Marketing (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Persuade (v.)', 'Thuyết phục', 'to move by argument or logic', 'L2 Marketing', 30, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Persuade (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Productive (adj.)', 'Sản xuất, thu hoạch, có năng suất', 'Constructive, high yield', 'L2 Marketing', 31, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Productive (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Satisfy (v.)', 'Làm hài lòng, thỏa mãn', 'to make happy', 'L2 Marketing', 32, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Satisfy (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Characteristic (adj.)', 'Nét đặc trưng, đặc điểm', 'Revealing of individual traits', 'L3 Warranties', 33, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Characteristic (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consequence (n.)', 'Hậu quả, kết quả', 'that which follows necessarily', 'L3 Warranties', 34, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consequence (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consider (v.)', 'Cân nhắc, suy nghĩ', 'to think about carefully', 'L3 Warranties', 35, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consider (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consideration (n.)', 'Sự cân nhắc, sự xem xét', 'considerable adj.', 'L3 Warranties', 36, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consideration (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Cover (v.)', 'Bảo hộ, kiểm soát, bao phủ', 'to provide protection against', 'L3 Warranties', 37, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Cover (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expire (v.)', 'Kết thúc, hết hiệu lực', 'to come to an end', 'L3 Warranties', 38, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expire (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Frequently (adv.)', 'Thường xuyên', 'Occurring commonly, widespread', 'L3 Warranties', 39, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Frequently (adv.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Imply (v.)', 'Hàm ý, nói bóng', 'to indicate by inference', 'L3 Warranties', 40, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Imply (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Promise (v.)', 'Lời hứa, hứa hẹn', 'n. to pledge to do, bring about, or provide', 'L3 Warranties', 41, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Promise (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Protect (v.)', 'Bảo vệ, che chở', 'to guard', 'L3 Warranties', 42, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Protect (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Protection (n.)', 'Sự bảo vệ', 'protective adj.', 'L3 Warranties', 43, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Protection (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reputation (n.)', 'Sự nổi tiếng, danh tiếng', 'the overall quality of character', 'L3 Warranties', 44, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reputation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reputable (adj.)', 'Có uy tín', 'Reputed adj.', 'L3 Warranties', 45, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reputable (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Require (v.)', 'Yêu cầu, đòi hỏi', 'to deem necessary or essential', 'L3 Warranties', 46, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Require (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Requirement (n.)', 'Sự yêu cầu, điều kiện cần thiết', 'requisite adj.', 'L3 Warranties', 47, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Requirement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Vary (v.)', 'Thay đổi, biến đổi', 'to be different from another, to change', 'L3 Warranties', 48, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Vary (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Address (v.)', 'Giải quyết, hướng tới', 'to direct to the attention of', 'L4 Business planning', 49, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Address (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Avoid (v.)', 'Tránh, ngăn ngừa', 'to stay clear of, to keep from happening', 'L4 Business planning', 50, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Avoid (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Demonstrate (v.)', 'Chứng minh, giải thích', 'to show clearly and deliberately, to present by example', 'L4 Business planning', 51, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Demonstrate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Demonstration (n.)', 'Sự chứng minh, sự biểu thị', 'demonstrative adj.', 'L4 Business planning', 52, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Demonstration (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Develop (v.)', 'Phát triển, mở rộng', 'to expand, progress, or improve', 'L4 Business planning', 53, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Develop (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Development (n.)', 'Sự phát triển', 'developer n.', 'L4 Business planning', 54, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Development (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Evaluate (v.)', 'Đánh giá, định giá', 'to determine the value or impact of', 'L4 Business planning', 55, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Evaluate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Evaluation (n.)', 'Sự đánh giá', 'evaluator n.', 'L4 Business planning', 56, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Evaluation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Gather (v.)', 'Tổng kết, thu thập ý kiến', 'to accumulate, to conclude', 'L4 Business planning', 57, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Gather (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Offer (v.)', 'Đề nghị, gợi ý', 'to propose, to present in order to meet a need or satisfy a requirement', 'L4 Business planning', 58, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Offer (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Primary (adj.)', 'Điều quan trọng nhất, cơ bản', 'Most important, first in a list, series, or sequence', 'L4 Business planning', 59, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Primary (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Risk (n.)', 'Rủi ro, nguy cơ', 'the chance of loss or damage', 'L4 Business planning', 60, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Risk (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Strategy (n.)', 'Chiến lược, kế hoạch', 'a plan of action', 'L4 Business planning', 61, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Strategy (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Strategize (n.)', 'Lập chiến lược', 'strategic adj.', 'L4 Business planning', 62, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Strategize (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Strong (adj.)', 'Mạnh mẽ, kiên cố', 'Powerful, economically or financially sound', 'L4 Business planning', 63, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Strong (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Substitute (v.)', 'Lựa chọn thay thế, thay thế', 'to take the place of another', 'L4 Business planning', 64, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Substitute (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accommodate (v.)', 'Cung cấp cho sự cần thiết, đáp ứng', 'to fit, to provide with something needed', 'L5 Conferences', 65, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accommodate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accommodation (n.)', 'Sự thích nghi, chỗ ở', 'accommodating adj.', 'L5 Conferences', 66, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accommodation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Arrangement (n.)', 'Sự tổ chức sắp xếp', 'the plan or organization', 'L5 Conferences', 67, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Arrangement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Association (n.)', 'Liên kết, kết hợp, hội liên hiệp', 'an organization of persons or groups having a common interest', 'L5 Conferences', 68, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Association (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attend (v.)', 'Rất chú tâm, tham dự', 'to go to, to pay attention to', 'L5 Conferences', 69, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attend (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attendee (n.)', 'Người tham dự', 'attendance n.', 'L5 Conferences', 70, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attendee (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Get in touch (v.)', 'Liên lạc với', 'to make contact with', 'L5 Conferences', 71, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Get in touch (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Hold (v.)', 'Dàn xếp, tổ chức, nắm giữ', 'to accommodate; to conduct', 'L5 Conferences', 72, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Hold (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Location (n.)', 'Địa điểm, vị trí', 'a position or site', 'L5 Conferences', 73, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Location (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Overcrowded (a.)', 'Chật nịch, đông nghịt', 'too crowded', 'L5 Conferences', 74, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Overcrowded (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Register (v.)', 'Ghi vào sổ, đăng ký', 'to record', 'L5 Conferences', 75, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Register (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Register (n.)', 'Sổ đăng ký', 'registration n.', 'L5 Conferences', 76, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Register (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Select (v.)', 'Lựa chọn, chọn lọc', 'to choose from a group', 'L5 Conferences', 77, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Select (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Selection (n.)', 'Sự lựa chọn', 'selective adj.', 'L5 Conferences', 78, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Selection (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Session (n.)', 'Buổi họp, phiên họp', 'a meeting', 'L5 Conferences', 79, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Session (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Take part in (v.)', 'Tham dự, tham gia', 'to join or participate', 'L5 Conferences', 80, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Take part in (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Access (v.)', 'Truy cập', 'to obtain, to gain entry', 'L6 Computers', 81, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Access (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Access (n.)', 'Quyền truy cập', 'accessible adj.', 'L6 Computers', 82, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Access (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Allocate (v.)', 'Chỉ định, phân bổ', 'to designate for a specific purpose', 'L6 Computers', 83, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Allocate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compatible (a.)', 'Tương thích, hợp nhau', 'able to function together', 'L6 Computers', 84, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compatible (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Delete (v.)', 'Xóa bỏ', 'to remove; to erase', 'L6 Computers', 85, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Delete (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Display (n.)', 'Hiển thị, trình bày', 'what is visible on a monitor; v, to show', 'L6 Computers', 86, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Display (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Duplicate (v.)', 'Tạo bản sao', 'to produce something equal; to make identical', 'L6 Computers', 87, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Duplicate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Duplicate (n.)', 'Bản sao', 'duplication n.', 'L6 Computers', 88, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Duplicate (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fail (v.)', 'Thất bại, hỏng', 'not to succeed; not to work correctly', 'L6 Computers', 89, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fail (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Failure (n.)', 'Sự thất bại', 'fallible adj.', 'L6 Computers', 90, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Failure (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Figure out (v.)', 'Suy ra, hiểu ra', 'to understand, to solve', 'L6 Computers', 91, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Figure out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ignore (v.)', 'Lờ đi, không để ý', 'not to notice; to disregard', 'L6 Computers', 92, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ignore (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Search (v.)', 'Tìm kiếm', 'to look for; n, investigation', 'L6 Computers', 93, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Search (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Shot down (v.)', 'Tắt máy, dừng hoạt động', 'to turn off; to cease operation', 'L6 Computers', 94, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Shot down (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Warn (v.)', 'Cảnh báo', 'to alert; to tell about a danger or problem', 'L6 Computers', 95, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Warn (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Warning (n.)', 'Lời cảnh báo', 'warning adj.', 'L6 Computers', 96, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Warning (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Affordable (a.)', 'Phải chăng, vừa phải', 'able to be paid for; not too expensive', 'L7 Office Technology', 97, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Affordable (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'As needed (adv.)', 'Khi cần thiết', 'as necessary', 'L7 Office Technology', 98, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'As needed (adv.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Be in charge of (v.)', 'Đứng đầu, phụ trách', 'to be in control or command of', 'L7 Office Technology', 99, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Be in charge of (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Capacity (n.)', 'Sức chứa, khả năng', 'the ability to contain or hold; the maximum that something can hold', 'L7 Office Technology', 100, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Capacity (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Durable (a.)', 'Bền bỉ, lâu bền', 'sturdy, strong, lasting', 'L7 Office Technology', 101, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Durable (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Initiative (n.)', 'Sáng kiến, làm đầu tàu', 'the first step; an active role', 'L7 Office Technology', 102, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Initiative (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Initiate (v.)', 'Khởi xướng', 'initiation n.', 'L7 Office Technology', 103, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Initiate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Physical (a.)', 'Vật chất, thực thể', 'perceived by the senses', 'L7 Office Technology', 104, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Physical (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Provider (n.)', 'Nhà cung cấp', 'a supplier', 'L7 Office Technology', 105, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Provider (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Provide (v.)', 'Cung cấp', 'provision n.', 'L7 Office Technology', 106, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Provide (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recur (v.)', 'Lặp lại, tái diễn', 'to occur again or repeatedly', 'L7 Office Technology', 107, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recur (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recurrence (n.)', 'Sự lặp lại', 'recurring adj.', 'L7 Office Technology', 108, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recurrence (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reduction (n.)', 'Sự thu nhỏ, giảm nhẹ', 'a lessening, a decrease', 'L7 Office Technology', 109, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reduction (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reduce (v.)', 'Giảm bớt', 'reducible adj.', 'L7 Office Technology', 110, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reduce (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Stay on top of (v.)', 'Xếp hạng đầu, nắm bắt thông tin', 'to know what is going on; to know the latest information', 'L7 Office Technology', 111, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Stay on top of (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Stock (n.)', 'Kho dự trữ, cổ phiếu', 'a supply; v, to keep on hand', 'L7 Office Technology', 112, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Stock (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Appreciate (v.)', 'Thông cảm, đánh giá cao', 'to recognize, understand the importance of; to be thankful for', 'L8 Office Procedures', 113, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Appreciate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Appreciation (n.)', 'Sự đánh giá cao, sự biết ơn', 'appreciated adj.', 'L8 Office Procedures', 114, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Appreciation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Be exposed to (v.)', 'Bị phơi bày, tiếp xúc với', 'to become aware of; to gain experience in', 'L8 Office Procedures', 115, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Be exposed to (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Bring in (v.)', 'Thuê, mướn, mang vào', 'to hire or recruit; to cause to appear', 'L8 Office Procedures', 116, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Bring in (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Casual (a.)', 'Tình cờ, ngẫu nhiên, tự nhiên', 'informal', 'L8 Office Procedures', 117, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Casual (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Code (n.)', 'Luật, quy tắc, mã', 'rules of behavior', 'L8 Office Procedures', 118, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Code (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Glimpse (n.)', 'Cái nhìn lướt qua', 'a quick look', 'L8 Office Procedures', 119, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Glimpse (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Made of (v.)', 'Bao gồm, làm bằng', 'to consist of', 'L8 Office Procedures', 120, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Made of (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Out of (a.)', 'Hết, cạn kiệt', 'no longer having, missing', 'L8 Office Procedures', 121, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Out of (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Outdated (a.)', 'Hết hạn sử dụng, lỗi thời', 'obsolete; not currently in use', 'L8 Office Procedures', 122, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Outdated (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Practice (n.)', 'Sự thực hành, thói quen', 'method of doing something', 'L8 Office Procedures', 123, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Practice (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Practice (v.)', 'Thực hành', 'practical adj.', 'L8 Office Procedures', 124, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Practice (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reinforce (v.)', 'Tăng cường, củng cố', 'to strengthen, support', 'L8 Office Procedures', 125, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reinforce (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reinforcement (n.)', 'Sự tăng cường', 'reinforcing gerund', 'L8 Office Procedures', 126, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reinforcement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Verbal (a.)', 'Bằng lời nói', 'oral', 'L8 Office Procedures', 127, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Verbal (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Verbalize (v.)', 'Diễn đạt bằng lời', 'verbally adv.', 'L8 Office Procedures', 128, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Verbalize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disk (n.)', 'Đĩa máy tính, ổ đĩa', 'an object used to store digital information', 'L9 Electronics', 129, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disk (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Facilitate (v.)', 'Tạo điều kiện, làm cho dễ dàng', 'to make easier', 'L9 Electronics', 130, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Facilitate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Network (n.)', 'Mạng lưới', 'an interconnected group or system', 'L9 Electronics', 131, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Network (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Popularity (n.)', 'Sự phổ biến, tính phổ biến', 'the state of being widely admired, sought', 'L9 Electronics', 132, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Popularity (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Popularize (v.)', 'Làm cho phổ biến', 'popular adj.', 'L9 Electronics', 133, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Popularize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Process (n.)', 'Quá trình, quy trình', 'a series of operations or actions to bring about a result', 'L9 Electronics', 134, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Process (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Replace (v.)', 'Thay thế', 'to put back in a former place or position', 'L9 Electronics', 135, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Replace (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Replacement (n.)', 'Sự thay thế, vật thay thế', 'replaceable adj.', 'L9 Electronics', 136, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Replacement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Revolution (n.)', 'Sự xoay vòng, cuộc cách mạng', 'a sudden or momentous change in a situation', 'L9 Electronics', 137, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Revolution (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Revolutionized (v.)', 'Cách mạng hóa', 'revolutionary adj.', 'L9 Electronics', 138, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Revolutionized (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sharp (a.)', 'Sắc bén, nhạy bén', 'abrupt or acute; smart', 'L9 Electronics', 139, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sharp (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Skills (n.)', 'Kỹ năng, kỹ thảo', 'developed ability', 'L9 Electronics', 140, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Skills (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Software (n.)', 'Phần mềm', 'the programs for a computer', 'L9 Electronics', 141, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Software (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Storage (n.)', 'Sự lưu trữ', 'the safekeeping of goods or information', 'L9 Electronics', 142, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Storage (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Store (v.)', 'Lưu trữ, cửa hàng', 'n.', 'L9 Electronics', 143, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Store (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Technical (a.)', 'Chuyên môn, kỹ thuật', 'special skill or knowledge', 'L9 Electronics', 144, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Technical (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assemble (v.)', 'Tập hợp, thu thập', 'to put together; to bring together', 'L10 Correspondence', 145, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assemble (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Beforehand (adv.)', 'Trước, sớm', 'early, in advance', 'L10 Correspondence', 146, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Beforehand (adv.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Complicated (a.)', 'Phức tạp', 'not easy to understand', 'L10 Correspondence', 147, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Complicated (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Complication (n.)', 'Sự phức tạp', 'complicated adj.', 'L10 Correspondence', 148, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Complication (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Courier (n.)', 'Người đưa thư, chuyển phát nhanh', 'a messenger', 'L10 Correspondence', 149, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Courier (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Express (a.)', 'Nhanh chóng, hoả tốc', 'fast and direct', 'L10 Correspondence', 150, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Express (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fold (v.)', 'Gấp lại', 'to bend paper', 'L10 Correspondence', 151, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fold (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Layout (n.)', 'Sự bố trí trang giấy, bố cục', 'a format; the organization of material on a page', 'L10 Correspondence', 152, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Layout (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mention (v.)', 'Đề cập đến', 'to refer to; n, something read or written', 'L10 Correspondence', 153, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mention (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mention (n.)', 'Sự đề cập', 'mentionable adj.', 'L10 Correspondence', 154, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mention (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Petition (n.)', 'Đơn xin, kiến nghị', 'a formal, written request; v, to make a formal request', 'L10 Correspondence', 155, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Petition (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Proof (v.)', 'Chứng minh, kiểm lỗi', 'to look for errors', 'L10 Correspondence', 156, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Proof (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Proofreader (n.)', 'Bằng chứng, người sửa bản in thử', 'proofing gerund', 'L10 Correspondence', 157, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Proofreader (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Registered (a.)', 'Đăng ký, đã ghi sổ', 'recorded and tracked', 'L10 Correspondence', 158, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Registered (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Registration (n.)', 'Sự đăng ký', 'registered adj.', 'L10 Correspondence', 159, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Registration (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Revise (v.)', 'Sửa lại, đọc lại', 'to rewrite', 'L10 Correspondence', 160, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Revise (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Abundant (a.)', 'Nhiều quá, thừa, phong phú', 'plentiful, in large quantities; n, a large number', 'L11 Job Advertising and Recruiting', 161, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Abundant (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accomplishment (n.)', 'Hoàn thành, đạt được, thành tựu', 'an achievement, a success', 'L11 Job Advertising and Recruiting', 162, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accomplishment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accomplish (v.)', 'Hoàn thành', 'accomplished adj.', 'L11 Job Advertising and Recruiting', 163, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accomplish (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Bring together (v.)', 'Nhóm lại, họp lại', 'to join, to gather', 'L11 Job Advertising and Recruiting', 164, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Bring together (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Candidate (n.)', 'Ứng cử viên', 'one being considered for a position, office', 'L11 Job Advertising and Recruiting', 165, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Candidate (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Come up with (v.)', 'Ý định, nghĩ ra', 'to plan, to invent, to think of', 'L11 Job Advertising and Recruiting', 166, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Come up with (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Commensurate (a.)', 'Bằng kích cỡ với, tương ứng', 'in proportion to, corresponding, equal to', 'L11 Job Advertising and Recruiting', 167, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Commensurate (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Match (n.)', 'Mô tả tính chất, phù hợp, trận đấu', 'a fit, a similarity', 'L11 Job Advertising and Recruiting', 168, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Match (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Profile (n.)', 'Hồ sơ, tiểu sử', 'a group of characteristics or traits', 'L11 Job Advertising and Recruiting', 169, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Profile (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Qualifications (n.)', 'Năng lực, trình độ chuyên môn', 'requirements, qualities, or abilities needed for something', 'L11 Job Advertising and Recruiting', 170, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Qualifications (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Qualify (v.)', 'Đủ khả năng, đủ điều kiện', 'qualified adj.', 'L11 Job Advertising and Recruiting', 171, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Qualify (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recruit (v.)', 'Tuyển dụng', 'to attract people to join an organization of a cause', 'L11 Job Advertising and Recruiting', 172, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recruit (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recruitment (n.)', 'Sự tuyển dụng', 'recruiter n.', 'L11 Job Advertising and Recruiting', 173, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recruitment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Submit (v.)', 'Biện hộ, nộp, trình', 'to present for consideration', 'L11 Job Advertising and Recruiting', 174, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Submit (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Submission (n.)', 'Sự biện hộ, sự trình nộp', 'submittal n.', 'L11 Job Advertising and Recruiting', 175, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Submission (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Time-consuming (a.)', 'Cần nhiều thời gian', 'taking up a lot of time', 'L11 Job Advertising and Recruiting', 176, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Time-consuming (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ability (n.)', 'Khả năng, năng lực', 'a skill, a competence', 'L12 Applying and Interviewing', 177, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ability (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Apply (v.)', 'Xin việc, nộp đơn xin việc', 'to look for', 'L12 Applying and Interviewing', 178, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Apply (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Applicant (n.)', 'Người nộp đơn xin việc', 'application n.', 'L12 Applying and Interviewing', 179, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Applicant (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Background (n.)', 'Kinh nghiệm, nền tảng', 'a person’s experience', 'L12 Applying and Interviewing', 180, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Background (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Be ready for (v.)', 'Sẵn sàng cho', 'to be prepared', 'L12 Applying and Interviewing', 181, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Be ready for (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Call in (v.)', 'Yêu cầu, gọi vào', 'to request', 'L12 Applying and Interviewing', 182, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Call in (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Confidence (n.)', 'Tự tin', 'a belief in one’s ability', 'L12 Applying and Interviewing', 183, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Confidence (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Confident (adj.)', 'Sự tự tin', 'Confidently adv.', 'L12 Applying and Interviewing', 184, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Confident (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Constantly (a.)', 'Luôn luôn, không đổi', 'on a continual basis, happening all the time', 'L12 Applying and Interviewing', 185, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Constantly (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expert (n.)', 'Thành thạo, tinh thông, chuyên gia', 'a specialist', 'L12 Applying and Interviewing', 186, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expert (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expertise (n.)', 'Chuyên môn', 'expert adj.', 'L12 Applying and Interviewing', 187, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expertise (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Follow up (v.)', 'Tiếp tục, tiếp theo', 'to take additional steps, to continue', 'L12 Applying and Interviewing', 188, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Follow up (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Hesitate (v.)', 'Do dự, lưỡng lự', 'to pause, to be reluctant', 'L12 Applying and Interviewing', 189, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Hesitate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Present (v.)', 'Đưa ra, bày tỏ, giới thiệu', 'to introduce, to show, to offer for consideration', 'L12 Applying and Interviewing', 190, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Present (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Presentation (n.)', 'Bài thuyết trình, sự trình bày', 'presentable adj.', 'L12 Applying and Interviewing', 191, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Presentation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Weakness (n.)', 'Nhược điểm, điểm yếu', 'a fault, a quality lacking strength', 'L12 Applying and Interviewing', 192, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Weakness (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conduct (v.)', 'Cư xử, tiến hành', 'to hold, to take place, to behave', 'L13 Hiring and Training', 193, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conduct (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Generate (v.)', 'Tạo ra, sinh ra', 'to create, to produce', 'L13 Hiring and Training', 194, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Generate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Hire (v.)', 'Thuê, mướn', 'to employ, to offer a job or position', 'L13 Hiring and Training', 195, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Hire (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Hire (n.)', 'Sự thuê mướn', 'hiring gerund', 'L13 Hiring and Training', 196, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Hire (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Keep up with (v.)', 'Theo kịp, ngang hàng với', 'to stay equal with', 'L13 Hiring and Training', 197, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Keep up with (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Look up to (v.)', 'Khâm phục, ngưỡng mộ', 'to admire, to think highly of', 'L13 Hiring and Training', 198, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Look up to (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mentor (n.)', 'Người cố vấn', 'a person who guides', 'L13 Hiring and Training', 199, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mentor (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'On track (a.)', 'Theo dõi, đúng hướng', 'on schedule', 'L13 Hiring and Training', 200, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'On track (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reject (v.)', 'Từ chối, loại bỏ', 'to turn down, to say no', 'L13 Hiring and Training', 201, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reject (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Rejection (n.)', 'Sự từ chối', 'rejecting gerund', 'L13 Hiring and Training', 202, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Rejection (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Set up (v.)', 'Thiết lập, định trước', 'to establish, to arrange; a, arranged', 'L13 Hiring and Training', 203, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Set up (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Success (n.)', 'Thành công', 'reaching a goal', 'L13 Hiring and Training', 204, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Success (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Succeed (v.)', 'Thành công', 'successful adj.', 'L13 Hiring and Training', 205, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Succeed (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Training (n.)', 'Đào tạo, huấn luyện', 'the preparation or education for a specific job', 'L13 Hiring and Training', 206, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Training (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Trainer (n.)', 'Người huấn luyện', 'trainee n.', 'L13 Hiring and Training', 207, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Trainer (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Update (v.)', 'Cập nhật', 'to make current. N, the latest information', 'L13 Hiring and Training', 208, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Update (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Basis (n.)', 'Nền tảng, cơ sở', 'the main reason for something, a base or foundation', 'L14 Salaries and benefits', 209, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Basis (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Be aware of (v.)', 'Am hiểu về...', 'to be conscious of, to be knowledgeable about', 'L14 Salaries and benefits', 210, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Be aware of (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Benefits (n.)', 'Tiền trợ cấp, lợi ích', 'the advantages provided to a employee in addition to salary', 'L14 Salaries and benefits', 211, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Benefits (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Benefit (v.)', 'Giúp ích cho', 'beneficial adj.', 'L14 Salaries and benefits', 212, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Benefit (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compensate (v.)', 'Đền bù, bồi thường', 'to pay, to make up for', 'L14 Salaries and benefits', 213, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compensate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compensation (n.)', 'Khoản bồi thường', 'compensatory adj.', 'L14 Salaries and benefits', 214, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compensation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Delicate (adj.)', 'Nhạy bén, khéo léo', 'Sensitive, adv. With sensitivity', 'L14 Salaries and benefits', 215, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Delicate (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Eligible (adj.)', 'Đủ tư cách', 'Able to participate in something, qualified', 'L14 Salaries and benefits', 216, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Eligible (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Flexible (adj.)', 'Dễ sai khiến, dễ uốn nắn, linh hoạt', 'Not rigid, able to change easily', 'L14 Salaries and benefits', 217, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Flexible (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Negotiate (v.)', 'Đàm phán, thương lượng', 'to talk for the purpose of reaching an agreement, especially on prices or contracts', 'L14 Salaries and benefits', 218, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Negotiate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Negotiation (n.)', 'Sự đàm phán', 'negotiator n.', 'L14 Salaries and benefits', 219, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Negotiation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Raise (n.)', 'Sự tăng lương', 'an increase in salary', 'L14 Salaries and benefits', 220, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Raise (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Retire (v.)', 'Nghỉ hưu', 'to stop working, to withdraw from a business or profession', 'L14 Salaries and benefits', 221, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Retire (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Retirement (n.)', 'Sự nghỉ hưu', 'retired adj.', 'L14 Salaries and benefits', 222, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Retirement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Vested (adj.)', 'Được quyền, được phép', 'Absolute, authorized', 'L14 Salaries and benefits', 223, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Vested (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Wage (n.)', 'Tiền công', 'the money paid for work done, usually hourly', 'L14 Salaries and benefits', 224, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Wage (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Achieve (v.)', 'Đạt được, giành được', 'to succeed, to reach a goal', 'L15 Promotions, Pensions and Awards', 225, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Achieve (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Achievement (n.)', 'Thành tựu', 'achiever n.', 'L15 Promotions, Pensions and Awards', 226, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Achievement (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Contribute (v.)', 'Đóng góp, góp phần', 'to add to, to donate, to give', 'L15 Promotions, Pensions and Awards', 227, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Contribute (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Contribution (n.)', 'Sự đóng góp', 'contributor n.', 'L15 Promotions, Pensions and Awards', 228, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Contribution (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Dedication (n.)', 'Sự cống hiến', 'a commitment to something', 'L15 Promotions, Pensions and Awards', 229, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Dedication (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Dedicate (v.)', 'Cống hiến', 'dedicated adj.', 'L15 Promotions, Pensions and Awards', 230, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Dedicate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Look forward to (v.)', 'Háo hức chờ mong', 'to anticipate, to be eager for something to happen', 'L15 Promotions, Pensions and Awards', 231, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Look forward to (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Looked to (v.)', 'Nhờ vào, trông cậy vào', 'to depend on, to rely on', 'L15 Promotions, Pensions and Awards', 232, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Looked to (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Loyal (a.)', 'Trung thành', 'faithful, believing in something or somebody', 'L15 Promotions, Pensions and Awards', 233, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Loyal (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Merit (n.)', 'Công lao', 'experience, high quality', 'L15 Promotions, Pensions and Awards', 234, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Merit (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Obvious (a.)', 'Rõ ràng, rành mạch', 'easy to see or understand', 'L15 Promotions, Pensions and Awards', 235, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Obvious (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Productive (a.)', 'Hữu ích, có hiệu quả', 'useful, getting a lot done', 'L15 Promotions, Pensions and Awards', 236, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Productive (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Promote (v.)', 'Thăng chức, quảng bá', 'to give someone a better job; to support, to make known', 'L15 Promotions, Pensions and Awards', 237, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Promote (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Promotion (n.)', 'Sự thăng chức', 'promoter n.', 'L15 Promotions, Pensions and Awards', 238, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Promotion (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recognition (n.)', 'Sự công nhận, khen ngợi', 'credit, praise for doing something well', 'L15 Promotions, Pensions and Awards', 239, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recognition (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Value (n.)', 'Giá trị', 'worth', 'L15 Promotions, Pensions and Awards', 240, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Value (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Bargain (n.)', 'Trả giá, mặc cả', 'something offered or acquired at a price advantageous to the buyer', 'L16 Shopping', 241, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Bargain (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Bear (v.)', 'Chịu đựng, cam chịu', 'to have a tolerance for, to endure', 'L16 Shopping', 242, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Bear (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Behavior (n.)', 'Cách cư xử', 'the manner of one’s action', 'L16 Shopping', 243, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Behavior (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Checkout (n.)', '(Sự) thanh toán tiền', 'the act, time, or place of checking out, as at a hotel or a supermarket', 'L16 Shopping', 244, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Checkout (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Comfort (n.)', 'Thoải mái, tiện nghi', 'a condition or feeling of pleasurable ease, well-being, and contentment', 'L16 Shopping', 245, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Comfort (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Comfortable (adj.)', 'Sự thoải mái', 'Comfortably adv.', 'L16 Shopping', 246, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Comfortable (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expand (v.)', 'Mở rộng', 'to increase the size, volume, quantity, or scope of; to enlarge', 'L16 Shopping', 247, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expand (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expansion (n.)', 'Sự mở rộng', 'expanded adj.', 'L16 Shopping', 248, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expansion (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Explore (v.)', 'Thăm dò, khảo sát', 'to investigate systematically', 'L16 Shopping', 249, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Explore (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Exploration (n.)', 'Sự thăm dò', 'exploratory adj.', 'L16 Shopping', 250, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Exploration (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Item (n.)', 'Điều khoản, món hàng', 'a single article or unit', 'L16 Shopping', 251, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Item (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mandatory (a.)', 'Bắt buộc, thiết yếu', 'required or commanded, obligatory', 'L16 Shopping', 252, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mandatory (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Merchandise (n.)', 'Hàng hoá', 'items available in stores', 'L16 Shopping', 253, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Merchandise (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Strict (a.)', 'Nghiêm khắc, chính xác', 'precise. Exact', 'L16 Shopping', 254, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Strict (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Strictness (n.)', 'Sự nghiêm khắc', 'strictly adv.', 'L16 Shopping', 255, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Strictness (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Trend (n.)', 'Xu hướng', 'the current style', 'L16 Shopping', 256, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Trend (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Diverse (a.)', 'Đa dạng', 'different; made up of distinct qualities', 'L17 Ordering Supplies', 257, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Diverse (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Diversify (v.)', 'Đa dạng hoá', 'diversity n.', 'L17 Ordering Supplies', 258, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Diversify (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Enterprise (n.)', 'Công trình, dự án lớn', 'a business; a large project', 'L17 Ordering Supplies', 259, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Enterprise (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Essential (a.)', 'Cần thiết', 'indispensable, necessary', 'L17 Ordering Supplies', 260, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Essential (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Everyday (a.)', 'Hàng ngày', 'common, ordinary', 'L17 Ordering Supplies', 261, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Everyday (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Function (v.)', 'Hoạt động', 'to perform tasks', 'L17 Ordering Supplies', 262, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Function (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Function (n.)', 'Chức năng', 'functional adj.', 'L17 Ordering Supplies', 263, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Function (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Maintain (v.)', 'Duy trì', 'to continue, to support, to sustain', 'L17 Ordering Supplies', 264, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Maintain (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Maintainability (n.)', 'Khả năng duy trì', 'maintainable adj.', 'L17 Ordering Supplies', 265, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Maintainability (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Obtain (v.)', 'Đạt được, giành được', 'to acquire', 'L17 Ordering Supplies', 266, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Obtain (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prerequisite (n.)', 'Điều kiện ưu tiên', 'something that is required or necessary as a prior condition', 'L17 Ordering Supplies', 267, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prerequisite (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Quality (n.)', 'Chất lượng', 'a distinguishing characteristic', 'L17 Ordering Supplies', 268, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Quality (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Smooth (a.)', 'Êm thấm, suôn sẻ', 'without difficulties; deliberately polite and agreeable in order to win favor', 'L17 Ordering Supplies', 269, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Smooth (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Smooth out (v.)', 'Làm cho suôn sẻ', 'Smoothly adv', 'L17 Ordering Supplies', 270, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Smooth out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Source (n.)', 'Nguồn, nguồn gốc', 'the origin', 'L17 Ordering Supplies', 271, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Source (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Stationery (n.)', 'Đồ dùng văn phòng', 'writing paper and envelopes', 'L17 Ordering Supplies', 272, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Stationery (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accurate (a.)', 'Đúng, chính xác', 'exact; errorless', 'L18 Shipping', 273, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accurate (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accuracy (n.)', 'Sự chính xác', 'accurately adv.', 'L18 Shipping', 274, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accuracy (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Carrier (n.)', 'Người hoặc vật chở cái gì', 'a person or business that transports passengers or goods', 'L18 Shipping', 275, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Carrier (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Catalog (a.)', 'Sách danh mục chi tiết', 'a list or itemized display; v, to make an itemized list of', 'L18 Shipping', 276, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Catalog (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fulfill (v.)', 'Hoàn thành công việc, nhiệm vụ', 'to finish completely', 'L18 Shipping', 277, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fulfill (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fulfilling gerund fulfillment n.', 'Sự hoàn thành', NULL, 'L18 Shipping', 278, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fulfilling gerund fulfillment n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Integral (a.)', 'Cần thiết', 'necessary for completion', 'L18 Shipping', 279, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Integral (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Inventory (n.)', 'Kiểm kê hàng hoá', 'goods in stock; an itemized record of these goods', 'L18 Shipping', 280, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Inventory (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Minimize (v.)', 'Giảm bớt, hạn chế', 'to reduce, to give less importance to', 'L18 Shipping', 281, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Minimize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Minimal (adj.)', 'Tối thiểu', 'Minimum n.', 'L18 Shipping', 282, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Minimal (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'On hand (a.)', 'Có sẵn', 'available', 'L18 Shipping', 283, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'On hand (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Remember (v.)', 'Nhớ, nhớ lại', 'to think of again', 'L18 Shipping', 284, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Remember (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ship (v.)', 'Vận chuyển', 'to transport; to send', 'L18 Shipping', 285, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ship (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Shipper (n.)', 'Việc gởi hàng', 'shipment n.', 'L18 Shipping', 286, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Shipper (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sufficient (a.)', 'Đủ', 'as much as is needed', 'L18 Shipping', 287, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sufficient (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Supply (v.)', 'Cung cấp', 'to make available for use', 'L18 Shipping', 288, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Supply (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Charge (n.)', 'Phí tổn', 'an expense or a cost; v, to demand payment', 'L19 Invoices', 289, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Charge (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compile (v.)', 'Thu thập, tập hợp', 'to gather together from several sources', 'L19 Invoices', 290, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compile (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Customer (n.)', 'Khách hàng', 'one who purchases a commodity or service', 'L19 Invoices', 291, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Customer (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Discount (n.)', 'Phần tiền giảm giá', 'a reduction in price; to reduce in price', 'L19 Invoices', 292, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Discount (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Efficient (a.)', 'Có năng suất cao', 'acting or producing effectively with a minimum of waste', 'L19 Invoices', 293, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Efficient (a.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Estimate (v.)', 'Ước lượng, định giá', 'to approximate the amount or value of something; to form an opinion about something', 'L19 Invoices', 294, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Estimate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Estimation (n.)', 'Sự ước lượng', 'estimating gerund', 'L19 Invoices', 295, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Estimation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Impose (v.)', 'Bắt ai phải làm gì, đánh thuế', 'to establish or apply as compulsory; to force upon others', 'L19 Invoices', 296, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Impose (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Imposition (n.)', 'Sự đánh thuế', 'imposing adj.', 'L19 Invoices', 297, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Imposition (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mistake (n.)', 'Lỗi', 'an error or a fault', 'L19 Invoices', 298, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mistake (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mistaken (v.)', 'Bị nhầm lẫn', 'adj.', 'L19 Invoices', 299, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mistaken (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Order (n.)', 'Đơn đặt hàng', 'a request made to purchase something; v, to command or direct', 'L19 Invoices', 300, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Order (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prompt adj being on time or punctual, carried out without delay, (n.)', 'Ngay lập tức, không chậm trễ', 'a reminder or a cue', 'L19 Invoices', 301, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prompt adj being on time or punctual, carried out without delay, (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Promptness (n.)', 'Sự nhanh chóng', 'prompt v.', 'L19 Invoices', 302, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Promptness (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Rectify (v.)', 'Sửa lại, hiệu chỉnh', 'to set right or correct', 'L19 Invoices', 303, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Rectify (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Terms (n.)', 'Điều khoản', 'conditions', 'L19 Invoices', 304, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Terms (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Adjust (v.)', 'Điều chỉnh, dàn xếp', 'to change in order to match or fit, to cause to correspond', 'L20 Inventory', 305, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Adjust (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Adjustment (n.)', 'Sự điều chỉnh', 'adjustable adj.', 'L20 Inventory', 306, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Adjustment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Automatic (adj.)', 'Tự động', 'Operating independently', 'L20 Inventory', 307, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Automatic (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Automation (n.)', 'Sự tự động hóa', 'automatically adv.', 'L20 Inventory', 308, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Automation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Crucial (adj.)', 'Cốt yếu, chủ yếu', 'Extremely significant or important', 'L20 Inventory', 309, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Crucial (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Discrepancy (n.)', 'Sự bất đồng, bất hoà', 'a divergence or disagreement', 'L20 Inventory', 310, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Discrepancy (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disturb (v.)', 'Làm rối loạn, gây cản trở', 'to interfere with, to interrupt', 'L20 Inventory', 311, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disturb (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disturbance (n.)', 'Sự rối loạn', 'disturbingly adv.', 'L20 Inventory', 312, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disturbance (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Liability (n.)', 'Nghĩa vụ', 'an obligation a responsibility', 'L20 Inventory', 313, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Liability (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reflect (v.)', 'Phản ánh, tương ứng với', 'to give back a likeness', 'L20 Inventory', 314, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reflect (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reflection (n.)', 'Sự phản ánh', 'reflector n.', 'L20 Inventory', 315, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reflection (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Run (v.)', 'Chạy, hoạt động', 'to operate', 'L20 Inventory', 316, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Run (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Scan (v.)', 'Kiểm tra nhanh', 'to look over quickly', 'L20 Inventory', 317, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Scan (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Subtract (v.)', 'Trừ đi, khấu trừ', 'to take away, to deduct', 'L20 Inventory', 318, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Subtract (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Tedious (adj.)', 'Chán ngắt, buồn tẻ', 'Tiresome by reason of length, slowness, or dullness, boring', 'L20 Inventory', 319, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Tedious (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Verify (v.)', 'Xác minh, kiểm lại', 'to prove the truth of', 'L20 Inventory', 320, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Verify (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accept (v.)', 'Nhận, chấp nhận', 'to receive, to respond favorably', 'L21 Banking', 321, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accept (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Acceptance (n.)', 'Sự chấp nhận', 'acceptable adj.', 'L21 Banking', 322, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Acceptance (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Balance (n.)', 'Số dư tài khoản', 'the remainder, v. to compute the difference between credits and debits of an account', 'L21 Banking', 323, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Balance (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Borrow (v.)', 'Vay, mượn', 'to use temporarily', 'L21 Banking', 324, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Borrow (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Cautious (adj.)', 'Thận trọng', 'Careful, wary', 'L21 Banking', 325, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Cautious (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Deduct (v.)', 'Trừ đi, khấu trừ', 'to take away from a total, to subtract', 'L21 Banking', 326, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Deduct (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Deductible (n.)', 'Khoản khấu trừ', 'deduction n.', 'L21 Banking', 327, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Deductible (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Dividend (n.)', 'Tiền lãi cổ phần', 'a share in a distribution', 'L21 Banking', 328, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Dividend (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Down payment (n.)', 'Sự trả trước 1 phần khi mua hàng', 'an initial partial payment', 'L21 Banking', 329, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Down payment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mortgage (n.)', 'Tiền thế chấp', 'the amount due on a property, v. to borrow money with your house as collateral', 'L21 Banking', 330, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mortgage (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Restriction (n.)', 'Hạn chế, giới hạn', 'a limitation', 'L21 Banking', 331, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Restriction (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Restrict (v.)', 'Hạn chế', 'restricted adj.', 'L21 Banking', 332, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Restrict (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Signature (n.)', 'Chữ ký', 'the name of a person written by the person', 'L21 Banking', 333, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Signature (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sign (n.)', 'Ký tên', 'v.', 'L21 Banking', 334, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sign (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Take out (v.)', 'Rút tiền', 'withdraw, remove', 'L21 Banking', 335, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Take out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Transaction (n.)', 'Giao dịch', 'a business deal', 'L21 Banking', 336, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Transaction (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accounting (n.)', 'Ngành kế toán, công việc kế toán', 'the recording and gathering of financial information for a company', 'L22 Accounting', 337, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accounting (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accountant (n.)', 'Nhân viên kế toán', 'account n.', 'L22 Accounting', 338, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accountant (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accumulate (v.)', 'Tích luỹ', 'to gather, to collect', 'L22 Accounting', 339, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accumulate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accumulation (n.)', 'Sự tích lũy', 'accumulated adj.', 'L22 Accounting', 340, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accumulation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Asset (n.)', 'Tài sản', 'something of value', 'L22 Accounting', 341, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Asset (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Audit (n.)', 'Kiểm toán', 'a formal examination of financial records, v. to examine the financial', 'L22 Accounting', 342, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Audit (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Budget (n.)', 'Ngân sách, ngân quỹ', 'a list of probable expenses and income for a given period', 'L22 Accounting', 343, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Budget (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Budget (v.)', 'Ghi vào ngân sách', 'budgetary adj.', 'L22 Accounting', 344, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Budget (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Build up (n.)', 'Sự tăng cường, xây dựng dần', 'to increase over time', 'L22 Accounting', 345, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Build up (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Client (n.)', 'Khách hàng', 'a customer', 'L22 Accounting', 346, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Client (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Debt (n.)', 'Món nợ', 'something owed, as in money or goods', 'L22 Accounting', 347, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Debt (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Outstanding (adj.)', 'Chưa trả nợ, đọng lại', 'Still due, not paid or settled', 'L22 Accounting', 348, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Outstanding (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Profitable (adj.)', 'Có sinh lợi', 'advantageous, beneficial', 'L22 Accounting', 349, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Profitable (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Profit (v.)', 'Lợi nhuận, thu lợi', 'n.', 'L22 Accounting', 350, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Profit (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reconcile (v.)', 'Đành chấp nhận, hòa giải', 'to make consistent', 'L22 Accounting', 351, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reconcile (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Turnover (n.)', 'Doanh số, doanh thu', 'the number of times a product is sold and replaced or an employee leaves and another employee is hired', 'L22 Accounting', 352, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Turnover (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Aggressive (adj.)', 'Có sức cạnh tranh, hăng hái', 'Competitive, assertive', 'L23 Investments', 353, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Aggressive (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attitude (n.)', 'Thái độ', 'a feeling about something or someone', 'L23 Investments', 354, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attitude (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Commitment (n.)', 'Lời cam kết', 'a promise', 'L23 Investments', 355, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Commitment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Commit (v.)', 'Cam kết', 'noncommittal adj.', 'L23 Investments', 356, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Commit (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conservative (adj.)', 'Thận trọng, cẩn thận', 'Cautious, restrained', 'L23 Investments', 357, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conservative (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fund (n.)', 'Quỹ', 'an amount of money for something specific, v to provide money for', 'L23 Investments', 358, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fund (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Invest (v.)', 'Đầu tư', 'to put money into a business or activity with the hope of making more money, to put effort into something', 'L23 Investments', 359, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Invest (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Investment (n.)', 'Sự đầu tư, người đầu tư', 'investor n.', 'L23 Investments', 360, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Investment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Long-term (adj.)', 'Dài hạn', 'involving or extending over a long period', 'L23 Investments', 361, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Long-term (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Portfolio (n.)', 'Danh mục vốn đầu tư', 'a list of investments', 'L23 Investments', 362, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Portfolio (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Pull out (v.)', 'Sự rút lui', 'to withdraw, to stop participating, n. a withdrawal, removal', 'L23 Investments', 363, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Pull out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Resource (n.)', 'Tài sản công ty, tài nguyên', 'assets, valuable things', 'L23 Investments', 364, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Resource (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Return (n.)', 'Tiền thu về, lợi nhuận', 'the amount of money gained as profit', 'L23 Investments', 365, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Return (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Returns (n.)', 'Lợi tức', 'returnable adj.', 'L23 Investments', 366, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Returns (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Wise (adj.)', 'Từng trải, hiểu biết nhiều', 'Knowledgeable, able to offer advice based on experience', 'L23 Investments', 367, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Wise (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Wisdom (n.)', 'Sự khôn ngoan', 'wisely adv.', 'L23 Investments', 368, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Wisdom (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Calculate (v.)', 'Tính toán', 'to figure out, to compute', 'L24 Taxes', 369, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Calculate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Calculation (n.)', 'Sự tính toán', 'calculator n.', 'L24 Taxes', 370, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Calculation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Deadline (n.)', 'Đường giới hạn, hạn chót', 'a time by which something must be finished', 'L24 Taxes', 371, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Deadline (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'File (v.)', 'Hồ sơ, tài liệu', 'to enter into public record, n. a group of documents or information about a person or an event', 'L24 Taxes', 372, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'File (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fill out (v.)', 'Đầy đủ, hoàn tất', 'to complete', 'L24 Taxes', 373, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fill out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Give up (v.)', 'Đầu hàng, từ bỏ', 'to quit, to stop', 'L24 Taxes', 374, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Give up (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Joint (adj.)', 'Nối, gia nhập, chung', 'Together, shared', 'L24 Taxes', 375, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Joint (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Owe (v.)', 'Nợ', 'to have a debt. To be obligated to pay', 'L24 Taxes', 376, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Owe (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Owner (n.)', 'Chủ nhân', 'owing gerund', 'L24 Taxes', 377, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Owner (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Penalty (n.)', 'Sự trừng phạt, tiền phạt', 'a punishment, a consequence', 'L24 Taxes', 378, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Penalty (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Penalize (v.)', 'Trừng phạt', 'penal adj.', 'L24 Taxes', 379, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Penalize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prepare (v.)', 'Chuẩn bị', 'to make ready', 'L24 Taxes', 380, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prepare (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Preparation (n.)', 'Sự chuẩn bị', 'preparatory adj.', 'L24 Taxes', 381, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Preparation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Refund (n.)', 'Sự trả lại, tiền hoàn lại', 'the amount paid back, v. to give back', 'L24 Taxes', 382, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Refund (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Spouse (n.)', 'Chồng, vợ', 'a husband or wife', 'L24 Taxes', 383, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Spouse (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Withhold (v.)', 'Ngăn cản, giữ lại', 'to keep from. To refrain from', 'L24 Taxes', 384, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Withhold (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Desired (adj.)', 'Mong muốn', 'Wished or longed for', 'L25 Financial Statements', 385, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Desired (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Desire (n.)', 'Sự mong muốn', 'v.', 'L25 Financial Statements', 386, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Desire (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Detail (v.)', 'Chi tiết', 'to report or relate minutely or in particulars', 'L25 Financial Statements', 387, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Detail (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Forecast (n.)', 'Dự đoán, dự báo', 'a prediction of a future event .v. to estimate or calculate in advance', 'L25 Financial Statements', 388, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Forecast (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Level (n.)', 'Mức độ, cấp độ', 'a relative position or rank on a scale', 'L25 Financial Statements', 389, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Level (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Overall (adj.)', 'Toàn bộ, toàn diện', 'Regarded as a whole, general', 'L25 Financial Statements', 390, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Overall (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Perspective (n.)', 'Quan điểm, cách nhìn', 'a mental view or outlook', 'L25 Financial Statements', 391, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Perspective (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Projected (adj.)', 'Có kế hoạch, dự kiến', 'Estimated, or predicted based or present data', 'L25 Financial Statements', 392, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Projected (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Project (n.)', 'Kế hoạch, dự án', 'v.', 'L25 Financial Statements', 393, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Project (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Realistic (adj.)', 'Có óc thực tế', 'Tending to or expressing an awareness of things as they really are', 'L25 Financial Statements', 394, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Realistic (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reality (n.)', 'Thực tế, thực tại', 'realistic adj.', 'L25 Financial Statements', 395, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reality (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Target (v.)', 'Mục tiêu', 'to establish as a goal, n. a goal', 'L25 Financial Statements', 396, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Target (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Translation (n.)', 'Bản dịch, sự dịch', 'the act or process of translating', 'L25 Financial Statements', 397, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Translation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Translate (v.)', 'Dịch', 'translatable adj.', 'L25 Financial Statements', 398, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Translate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Typical (adj.)', 'Đặc thù, đặc trưng', 'Conforming to a type', 'L25 Financial Statements', 399, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Typical (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Yield (n.)', 'Lợi nhuận, lợi tức', 'an amount produced, v. to produce a profit', 'L25 Financial Statements', 400, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Yield (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Adjacent (adj.)', 'Kế liền, sát ngay', 'next to', 'L26 Property and department', 401, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Adjacent (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Collaboration (n.)', 'Sự cộng tác', 'the act of working with someone', 'L26 Property and department', 402, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Collaboration (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Collaborate (v.)', 'Cộng tác', 'collaboration n.', 'L26 Property and department', 403, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Collaborate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Concentrate (v.)', 'Tập trung', 'to focus, to think about', 'L26 Property and department', 404, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Concentrate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conducive (adj.)', 'Có ích, có lợi', 'Contributing to, leading to', 'L26 Property and department', 405, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conducive (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disrupt (v.)', 'Quấy rối, phá vỡ', 'to interrupt, to disturb', 'L26 Property and department', 406, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disrupt (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disruption (n.)', 'Sự phá vỡ', 'disruptive adj.', 'L26 Property and department', 407, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disruption (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Hamper (v.)', 'Cản trở', 'to impede or interfere', 'L26 Property and department', 408, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Hamper (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Inconsiderate (adj.)', 'Thiếu quan tâm', 'Rude, impolite', 'L26 Property and department', 409, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Inconsiderate (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Lobby (n.)', 'Phòng ngoài, hành lang', 'an anteroom, foyer, or waiting room', 'L26 Property and department', 410, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Lobby (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Move up (v.)', 'Tiến lên', 'to advance, improve position', 'L26 Property and department', 411, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Move up (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Open to (adj.)', 'Cởi mở, sẵn sàng đón nhận', 'Receptive to, vulnerable', 'L26 Property and department', 412, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Open to (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Opt (v.)', 'Chọn lựa, chọn', 'to choose, to decide on', 'L26 Property and department', 413, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Opt (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Option (n.)', 'Vật được chọn, điều được chọn', 'optimal adj.', 'L26 Property and department', 414, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Option (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Scrutinize (v.)', 'Nhìn kỹ, chăm chú', 'to look at carefully and closely', 'L26 Property and department', 415, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Scrutinize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Scrutiny (n.)', 'Sự nhìn chăm chú', 'inscrutable adj.', 'L26 Property and department', 416, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Scrutiny (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Adhere to (v.)', 'Tuân thủ', 'to follow, to pay attention to', 'L27 Board Meetings and committees', 417, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Adhere to (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Agenda (n.)', 'Những vấn đề, công việc phải bàn tại cuộc họp', 'a list of topics to be discussed', 'L27 Board Meetings and committees', 418, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Agenda (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Bring up (v.)', 'Đưa ra', 'to introduce a topic', 'L27 Board Meetings and committees', 419, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Bring up (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conclude (v.)', 'Kết thúc, chấm dứt', 'to stop, to come to a decision', 'L27 Board Meetings and committees', 420, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conclude (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conclusion (n.)', 'Sự kết thúc, cuối cùng', 'conclusive adj.', 'L27 Board Meetings and committees', 421, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conclusion (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Go ahead (v.)', 'Cho phép, tiếp tục', 'to proceed with, n. permission to do something', 'L27 Board Meetings and committees', 422, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Go ahead (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Goal (n.)', 'Mục tiêu, mục đích', 'objective, purpose', 'L27 Board Meetings and committees', 423, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Goal (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Lengthy (adj.)', 'Dài dòng', 'Long in time, duration, or distance', 'L27 Board Meetings and committees', 424, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Lengthy (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Matter (n.)', 'Chủ đề, vấn đề', 'an item, issue, topic of interest', 'L27 Board Meetings and committees', 425, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Matter (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Periodically (adv.)', 'Một cách định kỳ', 'From time to time', 'L27 Board Meetings and committees', 426, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Periodically (adv.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Period (n.)', 'Giai đoạn, thời kỳ', 'periodic adj.', 'L27 Board Meetings and committees', 427, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Period (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Priority (n.)', 'Quyền ưu tiên', 'something of importance, something that should be done before other things', 'L27 Board Meetings and committees', 428, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Priority (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prioritize (v.)', 'Dành ưu tiên', 'prior adj.', 'L27 Board Meetings and committees', 429, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prioritize (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Progress (n.)', 'Sự tiến tới, sự đi lên', 'a movement forward, v. to move forward on something, especially work or a project', 'L27 Board Meetings and committees', 430, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Progress (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Progression (n.)', 'Sự tiến tới', 'progressive adj.', 'L27 Board Meetings and committees', 431, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Progression (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Waste (n.)', 'Không giá trị, lãng phí', 'not to use wisely, n. not worthwhile', 'L27 Board Meetings and committees', 432, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Waste (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Brand (n.)', 'Nhãn hàng hóa', 'an identifying mark or label, a trademark', 'L28 Quality control', 433, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Brand (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conform (v.)', 'Làm cho phù hợp', 'to match specifications or qualities', 'L28 Quality control', 434, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conform (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Defect (n.)', 'Nhược điểm, khuyết điểm', 'an imperfection or flaw', 'L28 Quality control', 435, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Defect (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Enhance (v.)', 'Làm tăng, nâng cao', 'to make more attractive or valuable', 'L28 Quality control', 436, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Enhance (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Garment (n.)', 'Áo quần', 'an article of clothing', 'L28 Quality control', 437, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Garment (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Inspect (v.)', 'Xem xét kỹ, kiểm tra', 'to look at closely, to examine carefully or officially', 'L28 Quality control', 438, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Inspect (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Inspection (n.)', 'Sự xem xét kỹ', 'inspector n.', 'L28 Quality control', 439, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Inspection (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Perceive (v.)', 'Nhận thấy, nhận biết', 'to notice, to become aware of, to see', 'L28 Quality control', 440, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Perceive (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Perception (n.)', 'Sự nhận biết, mẫn cảm', 'perceptive adj.', 'L28 Quality control', 441, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Perception (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Repel (v.)', 'Đẩy đi xa, chống lại', 'to keep away, to fight against', 'L28 Quality control', 442, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Repel (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Repellent (n.)', 'Cái đẩy lùi', 'adj.', 'L28 Quality control', 443, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Repellent (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Take back (v.)', 'Lấy lại', 'to return something, to withdraw or retract', 'L28 Quality control', 444, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Take back (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Throw out (v.)', 'Vứt bỏ', 'to dispose of', 'L28 Quality control', 445, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Throw out (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Uniform (adj.)', 'Không thay đổi về tính cách hay hình thức, đồng phục', 'Consistent in form or appearance', 'L28 Quality control', 446, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Uniform (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Wrinkle (n.)', 'Vết nhăn, nếp nhăn', 'a crease, ridge, or furrow, especially in skin or fabric', 'L28 Quality control', 447, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Wrinkle (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Anxious (adj.)', 'Lo âu, băn khoăn', 'Worried', 'L29 Product Development', 448, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Anxious (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Anxiety (n.)', 'Mối lo âu', 'anxiously adv.', 'L29 Product Development', 449, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Anxiety (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ascertain (v.)', 'Xác định', 'to discover, to find out for certain', 'L29 Product Development', 450, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ascertain (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assume (v.)', 'Cho rằng, thừa nhận', 'to take upon oneself, to believe to be true', 'L29 Product Development', 451, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assume (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assumed (adj.)', 'Làm ra vẻ, giả bộ', 'Assumption n.', 'L29 Product Development', 452, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assumed (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Decade (n.)', 'Thập kỷ', 'a period of ten years', 'L29 Product Development', 453, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Decade (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Examine (v.)', 'Xem xét chi tiết', 'to interrogate, to scrutinize', 'L29 Product Development', 454, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Examine (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Experiment (v.)', 'Làm thí nghiệm', 'to try out a new procedure or idea, n. a test or trial', 'L29 Product Development', 455, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Experiment (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Experimentation (n.)', 'Sự thí nghiệm', 'experimental adj.', 'L29 Product Development', 456, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Experimentation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Logical (adj.)', 'Hợp logic, hợp lý', 'formally valid, using orderly reasoning', 'L29 Product Development', 457, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Logical (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Research (n.)', 'Nghiên cứu', 'the act of collecting in formation about a particular subject', 'L29 Product Development', 458, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Research (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Responsibility (n.)', 'Trách nhiệm', 'task', 'L29 Product Development', 459, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Responsibility (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Responsible (adj.)', 'Chịu trách nhiệm', 'Responsibly adv.', 'L29 Product Development', 460, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Responsible (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Solve (v.)', 'Giải quyết', 'to find a solution, explanation, or answer', 'L29 Product Development', 461, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Solve (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Supervisor (n.)', 'Người giám sát', 'an administrator in charge', 'L29 Product Development', 462, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Supervisor (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Systematic (adj.)', 'Có hệ thống', 'Methodical in procedure, organized', 'L29 Product Development', 463, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Systematic (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Apprehensive (adj.)', 'Sợ hãi, e sợ', 'Anxious about the future', 'L30 Renting and Leasing', 464, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Apprehensive (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Apprehend (v.)', 'Sợ, e sợ', 'apprehension n.', 'L30 Renting and Leasing', 465, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Apprehend (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Circumstance (n.)', 'Hoàn cảnh, tình huống', 'a condition, a situation', 'L30 Renting and Leasing', 466, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Circumstance (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Condition (n.)', 'Điều kiện', 'the state of something, a requirement', 'L30 Renting and Leasing', 467, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Condition (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Conditional (adj.)', 'Có điều kiện', 'Condition v.', 'L30 Renting and Leasing', 468, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Conditional (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Due to (prep.)', 'Bởi vì', 'Because of', 'L30 Renting and Leasing', 469, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Due to (prep.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fluctuate (v.)', 'Dao động, thay đổi bất thường', 'to go up and down, to change', 'L30 Renting and Leasing', 470, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fluctuate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fluctuation (n.)', 'Sự dao động', 'fluctuating gerund', 'L30 Renting and Leasing', 471, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fluctuation (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Get out of (v.)', 'Rời khỏi', 'to escape, to exit', 'L30 Renting and Leasing', 472, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Get out of (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Indicator (n.)', 'Người chỉ', 'a sign, a signal', 'L30 Renting and Leasing', 473, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Indicator (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Indicate (v.)', 'Chỉ, cho biết, ra dấu', 'indication n.', 'L30 Renting and Leasing', 474, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Indicate (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Lease (n.)', 'Hợp đồng cho thuê', 'a contract to pay to use property for an amount of time, v. to make a contract to use property', 'L30 Renting and Leasing', 475, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Lease (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Lock into (v.)', 'Khóa lại, cam kết', 'to commit, to be unable to change', 'L30 Renting and Leasing', 476, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Lock into (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Occupancy (n.)', 'Sự cư ngụ', 'the state of being or living in a certain place', 'L30 Renting and Leasing', 477, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Occupancy (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Option (n.)', 'Sự chọn lựa', 'a choice, an alternative', 'L30 Renting and Leasing', 478, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Option (n.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Subject to (adj.)', 'Tùy thuộc vào', 'Under legal power, dependent', 'L30 Renting and Leasing', 479, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Subject to (adj.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Appeal adj., to be attractive or interesting', 'Hấp dẫn', NULL, 'L31 Selecting a Restaurant', 480, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Appeal adj., to be attractive or interesting'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Arrive v., to reach a destination', 'Tới một nơi', NULL, 'L31 Selecting a Restaurant', 481, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Arrive v., to reach a destination'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Compromise n., a settlement of differences in which each side makes concessions', 'Thỏa hiệp', NULL, 'L31 Selecting a Restaurant', 482, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Compromise n., a settlement of differences in which each side makes concessions'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Daring adj., to have the courage required', 'Táo bạo, cả gan', NULL, 'L31 Selecting a Restaurant', 483, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Daring adj., to have the courage required'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Familiar adj., often encountered or seen; common', 'Quen thuộc, thường thấy', NULL, 'L31 Selecting a Restaurant', 484, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Familiar adj., often encountered or seen; common'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Guide n., one who leads, directs, or gives advice', 'Người chỉ dẫn', NULL, 'L31 Selecting a Restaurant', 485, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Guide n., one who leads, directs, or gives advice'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Guidance n., guidable adj.', 'Sự chỉ đạo, có thể chỉ dẫn', NULL, 'L31 Selecting a Restaurant', 486, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Guidance n., guidable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Majority n., the greater number or part', 'Phần lớn, đa số', NULL, 'L31 Selecting a Restaurant', 487, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Majority n., the greater number or part'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mix v., to combine or blend into one mass; n., a combination', 'Trộn, pha lẫn', NULL, 'L31 Selecting a Restaurant', 488, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mix v., to combine or blend into one mass; n., a combination'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mixture n., mixable adj.', 'Sự pha trộn', NULL, 'L31 Selecting a Restaurant', 489, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mixture n., mixable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Rely v., to have confidence in; to depend on', 'Tin vào, dựa vào', NULL, 'L31 Selecting a Restaurant', 490, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Rely v., to have confidence in; to depend on'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reliability n., reliable adj.', 'Độ tin cậy, chắc chắn', NULL, 'L31 Selecting a Restaurant', 491, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reliability n., reliable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Basic adj., serving as a starting point or basis', 'Cơ bản', NULL, 'L32 Eating out', 492, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Basic adj., serving as a starting point or basis'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Complete adj., having all necessary or normal parts, components, or steps', 'Đầy đủ, trọn vẹn', NULL, 'L32 Eating out', 493, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Complete adj., having all necessary or normal parts, components, or steps'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Completion n., completely adv.', 'Làm cho đầy đủ', NULL, 'L32 Eating out', 494, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Completion n., completely adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Excite v., to arouse an emotion', 'Gây hứng thú', NULL, 'L32 Eating out', 495, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Excite v., to arouse an emotion'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Excitement n., exciting adj.', 'Sự phấn khích, kích thích', NULL, 'L32 Eating out', 496, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Excitement n., exciting adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Flavor n., a distinctive taste', 'Vị ngon, mùi vị', NULL, 'L32 Eating out', 497, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Flavor n., a distinctive taste'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Forget v., to be unable to remember', 'Hay quên', NULL, 'L32 Eating out', 498, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Forget v., to be unable to remember'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Forgetful adj., forgettable adj.', 'Có thể quên được', NULL, 'L32 Eating out', 499, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Forgetful adj., forgettable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ingredient n., an element in a mixture', 'Thành phần', NULL, 'L32 Eating out', 500, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ingredient n., an element in a mixture'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Judge v., to form an opinion', 'Đánh giá', NULL, 'L32 Eating out', 501, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Judge v., to form an opinion'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Mix-up n., a confusion; v., to confuse', 'Lộn xộn', NULL, 'L32 Eating out', 502, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Mix-up n., a confusion; v., to confuse'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Patron n., a customer, especially a regular customer', 'Khách hàng quen', NULL, 'L32 Eating out', 503, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Patron n., a customer, especially a regular customer'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Predict v., to state, tell about, or make known in advance', 'Báo trước, nói trước', NULL, 'L32 Eating out', 504, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Predict v., to state, tell about, or make known in advance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prediction n., predictable adv.', 'Sự dự đoán', NULL, 'L32 Eating out', 505, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prediction n., predictable adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Random adj., having no specific pattern, purpose, or objective', 'Ngẫu nhiên', NULL, 'L32 Eating out', 506, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Random adj., having no specific pattern, purpose, or objective'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Remind v., to cause to remember', 'Nhắc nhở', NULL, 'L32 Eating out', 507, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Remind v., to cause to remember'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Burdensome adj., of or like a burden; onerous', 'Khó nhọc, phiền hà', NULL, 'L33 Ordering Lunch', 508, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Burdensome adj., of or like a burden; onerous'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Common adj., widespread, frequent, usual', 'Thông thường, phổ biến', NULL, 'L33 Ordering Lunch', 509, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Common adj., widespread, frequent, usual'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'In common n., commonly', 'Có điểm chung', NULL, 'L33 Ordering Lunch', 510, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'In common n., commonly'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Delivery n., the act of conveying or delivering', 'Phân phát, giao hàng', NULL, 'L33 Ordering Lunch', 511, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Delivery n., the act of conveying or delivering'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Elegant adj., exhibiting refined, tasteful beauty', 'Thanh lịch, tao nhã', NULL, 'L33 Ordering Lunch', 512, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Elegant adj., exhibiting refined, tasteful beauty'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Elegance n., elegantly adv.', 'Sự thanh lịch', NULL, 'L33 Ordering Lunch', 513, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Elegance n., elegantly adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fall to v., to become one’s responsibility', 'Giao trách nhiệm', NULL, 'L33 Ordering Lunch', 514, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fall to v., to become one’s responsibility'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Impress v., to affect strongly, often favorably', 'Gây ấn tượng', NULL, 'L33 Ordering Lunch', 515, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Impress v., to affect strongly, often favorably'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Impression n., impressionable adj.', 'Ấn tượng, nhạy cảm', NULL, 'L33 Ordering Lunch', 516, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Impression n., impressionable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Individual adj., by or for one person; special; particular', 'Thuộc về hoặc cho ai đó, riêng biệt', NULL, 'L33 Ordering Lunch', 517, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Individual adj., by or for one person; special; particular'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Individualize v., individually adv.', 'Cá nhân hóa', NULL, 'L33 Ordering Lunch', 518, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Individualize v., individually adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'List n., a series of names, words, or other items; v., to make a list', 'Danh sách', NULL, 'L33 Ordering Lunch', 519, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'List n., a series of names, words, or other items; v., to make a list'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Multiple adj., having, relating to, or consisting of more than one part', 'Nhiều, phức tạp', NULL, 'L33 Ordering Lunch', 520, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Multiple adj., having, relating to, or consisting of more than one part'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Narrow v., to limit or restrict; adj., limited', 'Thu hẹp', NULL, 'L33 Ordering Lunch', 521, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Narrow v., to limit or restrict; adj., limited'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Pick up v., to take on passengers or freight', 'Đón ai đó', NULL, 'L33 Ordering Lunch', 522, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Pick up v., to take on passengers or freight'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Settle v., to make compensation for, to pay; to choose', 'Giải quyết, thanh toán', NULL, 'L33 Ordering Lunch', 523, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Settle v., to make compensation for, to pay; to choose'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Accustom to v., to become familiar with, to become used to', 'Làm quen với', NULL, 'L34 Cooking as a career', 524, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Accustom to v., to become familiar with, to become used to'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Apprentice n., a student worker in a chosen field v.', 'Người học việc', NULL, 'L34 Cooking as a career', 525, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Apprentice n., a student worker in a chosen field v.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Apprenticeship n.', 'Sự học việc', NULL, 'L34 Cooking as a career', 526, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Apprenticeship n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Culinary adj., relating to the kitchen or cooking', 'Thuộc về bếp núc, nấu nướng', NULL, 'L34 Cooking as a career', 527, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Culinary adj., relating to the kitchen or cooking'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Demanding adj., requiring much effort or attention', 'Đòi hỏi khắt khe', NULL, 'L34 Cooking as a career', 528, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Demanding adj., requiring much effort or attention'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Draw v., to cause to come by attracting', 'Lôi kéo, thu hút', NULL, 'L34 Cooking as a career', 529, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Draw v., to cause to come by attracting'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Incorporate v., to unite one thing with something else already in existence', 'Sáp nhập, hợp nhất', NULL, 'L34 Cooking as a career', 530, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Incorporate v., to unite one thing with something else already in existence'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Incorporation n., incorporating gerund', 'Sự sáp nhập', NULL, 'L34 Cooking as a career', 531, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Incorporation n., incorporating gerund'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Influx n., a flowing in', 'Sự chảy vào, tràn vào', NULL, 'L34 Cooking as a career', 532, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Influx n., a flowing in'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Method n., a procedure', 'Phương pháp', NULL, 'L34 Cooking as a career', 533, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Method n., a procedure'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Methodology n., methodical adj.', 'Hệ phương pháp', NULL, 'L34 Cooking as a career', 534, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Methodology n., methodical adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Outlet n., a means of release or gratification', 'Chỗ thoát ra, lối thoát', NULL, 'L34 Cooking as a career', 535, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Outlet n., a means of release or gratification'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Profession n., an occupation requiring considerable training and specialized study', 'Nghề nghiệp', NULL, 'L34 Cooking as a career', 536, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Profession n., an occupation requiring considerable training and specialized study'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Professional adj., professionally adv.', 'Chuyên nghiệp', NULL, 'L34 Cooking as a career', 537, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Professional adj., professionally adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Relinquish v., to let go; to surrender', 'Từ bỏ', NULL, 'L34 Cooking as a career', 538, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Relinquish v., to let go; to surrender'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Theme n., an implicit or recurrent idea; a motif', 'Đề tài, chủ đề', NULL, 'L34 Cooking as a career', 539, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Theme n., an implicit or recurrent idea; a motif'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assist v., to give help or support to', 'Giúp đỡ, trợ lý', NULL, 'L35 Events', 540, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assist v., to give help or support to'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assistance n., assistant n.', 'Sự giúp đỡ', NULL, 'L35 Events', 541, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assistance n., assistant n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Coordinate v., to adjust or arrange parts to work together', 'Sắp xếp, sắp đặt', NULL, 'L35 Events', 542, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Coordinate v., to adjust or arrange parts to work together'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Dimension n., a measure of width, height, or length', 'Kích thước', NULL, 'L35 Events', 543, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Dimension n., a measure of width, height, or length'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Exact adj., characterized by accurate measurements or inferences', 'Chính xác', NULL, 'L35 Events', 544, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Exact adj., characterized by accurate measurements or inferences'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'General adj., involving only the main feature rather than precise details', 'Chung chung', NULL, 'L35 Events', 545, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'General adj., involving only the main feature rather than precise details'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Generalize v., generally adv.', 'Diễn tả chung chung', NULL, 'L35 Events', 546, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Generalize v., generally adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Ideal adj., imaginary; existing as a perfect model', 'Tưởng tượng, lý tưởng', NULL, 'L35 Events', 547, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Ideal adj., imaginary; existing as a perfect model'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Idealize v., ideally adv.', 'Lý tưởng hóa', NULL, 'L35 Events', 548, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Idealize v., ideally adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Lead time n., the time between the initial stage of a project and the appearance of results', 'Thời gian giữa lúc bắt đầu và hoàn thành', NULL, 'L35 Events', 549, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Lead time n., the time between the initial stage of a project and the appearance of results'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Plan n., a scheme for making something happen; v., to formulate a scheme', 'Kế hoạch', NULL, 'L35 Events', 550, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Plan n., a scheme for making something happen; v., to formulate a scheme'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Proximity n., the state, quality, sense, or fact of being near or next to; closeness', 'Sự gần gũi', NULL, 'L35 Events', 551, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Proximity n., the state, quality, sense, or fact of being near or next to; closeness'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Regulation n., rules, laws, or controls; v., to control', 'Quy tắc, điều lệ', NULL, 'L35 Events', 552, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Regulation n., rules, laws, or controls; v., to control'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Regulate v., regulatory adj.', 'Điều chỉnh, lập quy', NULL, 'L35 Events', 553, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Regulate v., regulatory adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Site n., a place or setting', 'Chỗ, vị trí', NULL, 'L35 Events', 554, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Site n., a place or setting'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Stage v., to exhibit or present', 'Trình diễn', NULL, 'L35 Events', 555, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Stage v., to exhibit or present'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Agency n., an establishment engaged in doing business', 'Đại lý', NULL, 'L36 General Travel', 556, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Agency n., an establishment engaged in doing business'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Announcement n., a public notification', 'Thông cáo', NULL, 'L36 General Travel', 557, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Announcement n., a public notification'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Announce v., announcer n.', 'Loan báo', NULL, 'L36 General Travel', 558, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Announce v., announcer n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Beverage n., a drink other than plain water', 'Nước giải khát', NULL, 'L36 General Travel', 559, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Beverage n., a drink other than plain water'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Blanket n., a covering for keeping warm, especially during sleep; any full coverage; v., to cover uniformly', 'Mền, chăn', NULL, 'L36 General Travel', 560, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Blanket n., a covering for keeping warm, especially during sleep; any full coverage; v., to cover uniformly'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Board v., to enter a boat, plane, or train; to furnish to see the roads v.', 'Lên tàu', NULL, 'L36 General Travel', 561, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Board v., to enter a boat, plane, or train; to furnish to see the roads v.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Onboard adj.', 'Trên tàu', NULL, 'L36 General Travel', 562, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Onboard adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Claim v., to take as rightful; to retrieve', 'Đòi', NULL, 'L36 General Travel', 563, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Claim v., to take as rightful; to retrieve'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Delay v., to postpone until a later time; n., the period of time during which one is delayed n.', 'Trì hoãn', NULL, 'L36 General Travel', 564, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Delay v., to postpone until a later time; n., the period of time during which one is delayed n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Embark v., to go onboard a flight or ship; to begin', 'Lên tàu', NULL, 'L36 General Travel', 565, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Embark v., to go onboard a flight or ship; to begin'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Itinerary n., a proposed rout for a journey, showing dates and means of travel', 'Sách hướng dẫn du lịch', NULL, 'L36 General Travel', 566, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Itinerary n., a proposed rout for a journey, showing dates and means of travel'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prohibit v., to forbid by authority or to prevent', 'Ngăn chặn', NULL, 'L36 General Travel', 567, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prohibit v., to forbid by authority or to prevent'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Valid adj., having legal efficacy or correctness', 'Hợp lý, đúng đắn', NULL, 'L36 General Travel', 568, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Valid adj., having legal efficacy or correctness'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Validate v., validation n.', 'Phê chuẩn', NULL, 'L36 General Travel', 569, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Validate v., validation n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Deal with v., (phrase,)', 'Xử lý, giải quyết', 'to attend to; mange; to see to', 'L37 Airlines', 570, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Deal with v., (phrase,)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Destination n., the place to which one is going or directed', 'Nơi đến', NULL, 'L37 Airlines', 571, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Destination n., the place to which one is going or directed'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Distinguish v., to make noticeable or different', 'Nhận ra, nhận biết', NULL, 'L37 Airlines', 572, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Distinguish v., to make noticeable or different'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Distinguishable adj., distinguishably adv.', 'Có thể nhận ra', NULL, 'L37 Airlines', 573, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Distinguishable adj., distinguishably adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Economical adj., intended to save money, time, or effort', 'Tiết kiệm', NULL, 'L37 Airlines', 574, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Economical adj., intended to save money, time, or effort'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Economy n., economize v.', 'Sự tiết kiệm', NULL, 'L37 Airlines', 575, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Economy n., economize v.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Equivalent adj., equal', 'Tương đương, bằng nhau', NULL, 'L37 Airlines', 576, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Equivalent adj., equal'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Excursion n., a pleasure trip; a trip at a reduced fare', 'Chuyến thăm quan', NULL, 'L37 Airlines', 577, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Excursion n., a pleasure trip; a trip at a reduced fare'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expensive adj., marked by high prices', 'Vật đắt tiền', NULL, 'L37 Airlines', 578, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expensive adj., marked by high prices'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expense n., expensively adv.', 'Chi phí', NULL, 'L37 Airlines', 579, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expense n., expensively adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Extend v., to make longer; to offer', 'Kéo dài', NULL, 'L37 Airlines', 580, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Extend v., to make longer; to offer'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prospective adj., likely to become or be', 'Về sau, sắp tới', NULL, 'L37 Airlines', 581, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prospective adj., likely to become or be'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Situation n., the combination of circumstances at a given moment', 'Tình huống', NULL, 'L37 Airlines', 582, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Situation n., the combination of circumstances at a given moment'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Substantial adj., considerable in importance, value degree amount, or extent', 'Đáng kể', NULL, 'L37 Airlines', 583, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Substantial adj., considerable in importance, value degree amount, or extent'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Substance n., substantially adv.', 'Thực chất, căn bản', NULL, 'L37 Airlines', 584, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Substance n., substantially adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'System n., a functionally related group of elements', 'Hệ thống', NULL, 'L37 Airlines', 585, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'System n., a functionally related group of elements'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Comprehensive adj., covering broadly; inclusive', 'Bao gồm tất cả', NULL, 'L38 Trains', 586, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Comprehensive adj., covering broadly; inclusive'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Comprehensiveness n., comprehensively adv.', 'Tính toàn diện', NULL, 'L38 Trains', 587, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Comprehensiveness n., comprehensively adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Deluxe adj., noticeably luxurious', 'Sang trọng', NULL, 'L38 Trains', 588, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Deluxe adj., noticeably luxurious'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Directory n., a book or collection of information or directions', 'Danh bạ', NULL, 'L38 Trains', 589, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Directory n., a book or collection of information or directions'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Duration n., the time during which something lasts', 'Khoảng thời gian', NULL, 'L38 Trains', 590, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Duration n., the time during which something lasts'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Entitle v., to allow or qualify', 'Cho quyền', NULL, 'L38 Trains', 591, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Entitle v., to allow or qualify'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fare n., the money paid for transportation', 'Tiền xe, tiền vé', NULL, 'L38 Trains', 592, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fare n., the money paid for transportation'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Offset v., to counterbalance', 'Đền bù, bù đắp', NULL, 'L38 Trains', 593, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Offset v., to counterbalance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Operate v., to perform a function', 'Hoạt động', NULL, 'L38 Trains', 594, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Operate v., to perform a function'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Operation n., operational adj.', 'Sự hoạt động', NULL, 'L38 Trains', 595, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Operation n., operational adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Punctual adj., prompt', 'Đúng giờ', NULL, 'L38 Trains', 596, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Punctual adj., prompt'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Punctuality n., punctually adv.', 'Tính đúng giờ', NULL, 'L38 Trains', 597, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Punctuality n., punctually adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Relatively adv., somewhat', 'Vừa phải, tương đối', NULL, 'L38 Trains', 598, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Relatively adv., somewhat'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Remainder n., the remaining part', 'Phần còn lại', NULL, 'L38 Trains', 599, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Remainder n., the remaining part'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Remote adj., far removed', 'Xa xôi, cách biệt', NULL, 'L38 Trains', 600, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Remote adj., far removed'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Remoteness n., remotely adv.', 'Sự xa xôi', NULL, 'L38 Trains', 601, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Remoteness n., remotely adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Advance n., a move forward', 'Sự tiến lên', NULL, 'L39 Hotels', 602, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Advance n., a move forward'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Chain n., a group of enterprises under a single control', 'Chuỗi kinh doanh', NULL, 'L39 Hotels', 603, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Chain n., a group of enterprises under a single control'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Check in v., to register at a hotel; to report one’s presence', 'Đăng ký ở khách sạn', NULL, 'L39 Hotels', 604, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Check in v., to register at a hotel; to report one’s presence'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Confirm v., to validate', 'Xác nhận', NULL, 'L39 Hotels', 605, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Confirm v., to validate'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Confirmation n., confirmed adj.', 'Sự xác nhận', NULL, 'L39 Hotels', 606, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Confirmation n., confirmed adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expect v., to consider probable or reasonable', 'Trông đợi', NULL, 'L39 Hotels', 607, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expect v., to consider probable or reasonable'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Expectation n., expectant adj.', 'Sự trông đợi', NULL, 'L39 Hotels', 608, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Expectation n., expectant adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Housekeeper n., someone employed to do domestic work', 'Quản gia', NULL, 'L39 Hotels', 609, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Housekeeper n., someone employed to do domestic work'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Notify v., to report', 'Thông báo', NULL, 'L39 Hotels', 610, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Notify v., to report'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Preclude v., to make impossible; to rule out', 'Ngăn cản', NULL, 'L39 Hotels', 611, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Preclude v., to make impossible; to rule out'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Quote v., to give exact information on; n., a quotation', 'Trích dẫn', NULL, 'L39 Hotels', 612, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Quote v., to give exact information on; n., a quotation'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Quotation n., quotable adj.', 'Lời trích dẫn', NULL, 'L39 Hotels', 613, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Quotation n., quotable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Rate n., the payment or price according to a standard', 'Giá cả', NULL, 'L39 Hotels', 614, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Rate n., the payment or price according to a standard'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reserve v., to set aside', 'Để dành', NULL, 'L39 Hotels', 615, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reserve v., to set aside'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reservation n., in reserve n.', 'Sự đặt trước', NULL, 'L39 Hotels', 616, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reservation n., in reserve n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Service n., useful functions', 'Sự giúp ích, dịch vụ', NULL, 'L39 Hotels', 617, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Service n., useful functions'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Busy adj., engaged in activity', 'Bận rộn', NULL, 'L40 Car Rentals', 618, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Busy adj., engaged in activity'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Coincide v., to happen at the same time', 'Xảy ra đồng thời', NULL, 'L40 Car Rentals', 619, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Coincide v., to happen at the same time'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Coincidence n., coincidentally adv.', 'Trùng hợp ngẫu nhiên', NULL, 'L40 Car Rentals', 620, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Coincidence n., coincidentally adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Confusion n., a lack of clarity, order, or understanding', 'Nhầm lẫn', NULL, 'L40 Car Rentals', 621, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Confusion n., a lack of clarity, order, or understanding'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Contact v., to get in touch with', 'Liên lạc với ai', NULL, 'L40 Car Rentals', 622, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Contact v., to get in touch with'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disappoint v., to fail to satisfy the hope, desire, or expectation of', 'Làm thất vọng', NULL, 'L40 Car Rentals', 623, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disappoint v., to fail to satisfy the hope, desire, or expectation of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Intend v., to have in mind', 'Định, dự định', NULL, 'L40 Car Rentals', 624, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Intend v., to have in mind'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Intention n., intent adj.', 'Ý định, mục đích', NULL, 'L40 Car Rentals', 625, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Intention n., intent adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'License n., the legal permission to do or own a specified thing', 'Giấy phép', NULL, 'L40 Car Rentals', 626, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'License n., the legal permission to do or own a specified thing'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Nervous adj., easily agitated or distressed; uneasy or apprehensive', 'Lo lắng', NULL, 'L40 Car Rentals', 627, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Nervous adj., easily agitated or distressed; uneasy or apprehensive'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Nervousness n., nervously adv.', 'Sự lo lắng', NULL, 'L40 Car Rentals', 628, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Nervousness n., nervously adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Optional adj., not compulsory or automatic', 'Không bắt buộc', NULL, 'L40 Car Rentals', 629, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Optional adj., not compulsory or automatic'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Tempt v., to be inviting or attractive to', 'Lôi cuốn', NULL, 'L40 Car Rentals', 630, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Tempt v., to be inviting or attractive to'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Temptation n., tempting adj.', 'Cái lôi cuốn', NULL, 'L40 Car Rentals', 631, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Temptation n., tempting adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Thrill n., the source or cause of excitement or emotion', 'Xúc động', NULL, 'L40 Car Rentals', 632, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Thrill n., the source or cause of excitement or emotion'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Tier n., a rank or class', 'Dãy, tầng, lớp', NULL, 'L40 Car Rentals', 633, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Tier n., a rank or class'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attain v., to achieve', 'Giành được, đạt được', NULL, 'L41 Movies', 634, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attain v., to achieve'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Attainment n., attainable adj.', 'Sự đạt được', NULL, 'L41 Movies', 635, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Attainment n., attainable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Combine v., to come together', 'Kết hợp', NULL, 'L41 Movies', 636, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Combine v., to come together'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Continue v., to maintain without interruption', 'Tiếp tục', NULL, 'L41 Movies', 637, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Continue v., to maintain without interruption'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Continuation n., continual adj.', 'Sự tiếp tục', NULL, 'L41 Movies', 638, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Continuation n., continual adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Description n., a representation in words or pictures', 'Mô tả', NULL, 'L41 Movies', 639, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Description n., a representation in words or pictures'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Describe v., descriptive adj.', 'Diễn tả', NULL, 'L41 Movies', 640, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Describe v., descriptive adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disperse v., to spread widely, to scatter', 'Phân tán', NULL, 'L41 Movies', 641, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disperse v., to spread widely, to scatter'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Entertainment n., a diverting performance or activity', 'Sự giải trí', NULL, 'L41 Movies', 642, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Entertainment n., a diverting performance or activity'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Entertain v., entertaining adj.', 'Giải trí', NULL, 'L41 Movies', 643, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Entertain v., entertaining adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Influence v., to alter or affect', 'Ảnh hưởng', NULL, 'L41 Movies', 644, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Influence v., to alter or affect'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Range n., the scope', 'Phạm vi', NULL, 'L41 Movies', 645, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Range n., the scope'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Release v., to make available to the public; to give permission for performance', 'Phát hành', NULL, 'L41 Movies', 646, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Release v., to make available to the public; to give permission for performance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Represent v., to typify', 'Đại diện, đóng kịch', NULL, 'L41 Movies', 647, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Represent v., to typify'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Separate adj., detached; kept apart', 'Riêng biệt', NULL, 'L41 Movies', 648, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Separate adj., detached; kept apart'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Successive adj., following in order', 'Lần lượt', NULL, 'L41 Movies', 649, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Successive adj., following in order'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Acting n., the series of events that form the plot of a story or play', 'Diễn xuất', NULL, 'L42 Theater', 650, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Acting n., the series of events that form the plot of a story or play'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Approach (v.)', 'Đến gần, tiếp cận', 'to go near; to come close to in appearance or quality; n., a way or means of reaching something', 'L42 Theater', 651, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Approach (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Approachable adj., approach n.', 'Có thể đến gần', NULL, 'L42 Theater', 652, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Approachable adj., approach n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Audience n., the spectators at a performance', 'Khán giả', NULL, 'L42 Theater', 653, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Audience n., the spectators at a performance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Create v., to produce through artistic or imaginative effort', 'Tạo ra, sáng tạo', NULL, 'L42 Theater', 654, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Create v., to produce through artistic or imaginative effort'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Creation n., creative adj.', 'Sự sáng tạo', NULL, 'L42 Theater', 655, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Creation n., creative adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Dialogue n., a conversation between two or more persons', 'Đối thoại', NULL, 'L42 Theater', 656, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Dialogue n., a conversation between two or more persons'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Element n., fundamental or essential constituent', 'Yếu tố, chi tiết', NULL, 'L42 Theater', 657, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Element n., fundamental or essential constituent'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Experience n., an event or a series of events participated in or lived through v.', 'Kinh nghiệm', NULL, 'L42 Theater', 658, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Experience n., an event or a series of events participated in or lived through v.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Experienced adj.', 'Giàu kinh nghiệm', NULL, 'L42 Theater', 659, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Experienced adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Occur v., to take place; to come about', 'Xảy ra, xuất hiện', NULL, 'L42 Theater', 660, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Occur v., to take place; to come about'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Perform v., to act before an audience, to give a public presentation of', 'Biểu diễn', NULL, 'L42 Theater', 661, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Perform v., to act before an audience, to give a public presentation of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Performance n., performer n.', 'Sự biểu diễn', NULL, 'L42 Theater', 662, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Performance n., performer n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Rehearse v., to practice in preparation for a public performance; to direct in rehearsal', 'Diễn tập', NULL, 'L42 Theater', 663, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Rehearse v., to practice in preparation for a public performance; to direct in rehearsal'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Review n., a critical estimate of a work or performance; v., writing a criticism of a performance', 'Sự phê bình', NULL, 'L42 Theater', 664, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Review n., a critical estimate of a work or performance; v., writing a criticism of a performance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sold out adj., having all tickets or accommodations completely sold, especially ahead of time; v., to sell all the tickets', 'Bán hết', NULL, 'L42 Theater', 665, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sold out adj., having all tickets or accommodations completely sold, especially ahead of time; v., to sell all the tickets'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Available adj., ready for use; willing to serve', 'Sẵn sàng để dùng', NULL, 'L43 Music', 666, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Available adj., ready for use; willing to serve'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Broad adj., covering a wide scope', 'Bao la, mênh mông', NULL, 'L43 Music', 667, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Broad adj., covering a wide scope'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Category n., a division in a system of classification; a general class of ideas', 'Hạng, loại', NULL, 'L43 Music', 668, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Category n., a division in a system of classification; a general class of ideas'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Categorize v., categorical adj.', 'Phân loại', NULL, 'L43 Music', 669, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Categorize v., categorical adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disparate adj., fundamentally distinct or different', 'Khác loại', NULL, 'L43 Music', 670, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disparate adj., fundamentally distinct or different'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Divide v., to separate into parts', 'Chia, phân ra', NULL, 'L43 Music', 671, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Divide v., to separate into parts'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Favorite adj., preferred', 'Được yêu thích nhất', NULL, 'L43 Music', 672, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Favorite adj., preferred'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Favorable adj., favorably adv.', 'Thuận lợi', NULL, 'L43 Music', 673, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Favorable adj., favorably adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Instinct n., an inborn pattern that is a powerful motivation', 'Bản năng', NULL, 'L43 Music', 674, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Instinct n., an inborn pattern that is a powerful motivation'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Preference n., someone or something liked over another or others', 'Sở thích', NULL, 'L43 Music', 675, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Preference n., someone or something liked over another or others'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prefer v., preferential adj.', 'Thích hơn', NULL, 'L43 Music', 676, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prefer v., preferential adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Reason n., the basis or motive for a action; an underlying fact or cause', 'Lý do', NULL, 'L43 Music', 677, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Reason n., the basis or motive for a action; an underlying fact or cause'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Relaxation n., the act of reacting or the state of being relaxed; refreshment of body or mind', 'Sự nghỉ ngơi', NULL, 'L43 Music', 678, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Relaxation n., the act of reacting or the state of being relaxed; refreshment of body or mind'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Relax v., relaxed adj.', 'Nghỉ ngơi', NULL, 'L43 Music', 679, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Relax v., relaxed adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Taste n., the ability to discern what is excellent or appropriate', 'Sự thưởng thức', NULL, 'L43 Music', 680, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Taste n., the ability to discern what is excellent or appropriate'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Urge v., to advocate earnestly; a., a natural desire', 'Thúc giục', NULL, 'L43 Music', 681, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Urge v., to advocate earnestly; a., a natural desire'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Acquire v., to gain possession of; to get by one’s own efforts', 'Thu được, giành được', NULL, 'L44 Museums', 682, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Acquire v., to gain possession of; to get by one’s own efforts'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Admire v., to regard with pleasure; to have esteem or respect for', 'Khâm phục, hâm mộ', NULL, 'L44 Museums', 683, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Admire v., to regard with pleasure; to have esteem or respect for'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Collection n., a group of objects or works to be seen, studied, or kept together', 'Bộ sưu tập', NULL, 'L44 Museums', 684, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Collection n., a group of objects or works to be seen, studied, or kept together'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Collect v., collector n.', 'Sưu tầm', NULL, 'L44 Museums', 685, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Collect v., collector n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Criticism n., an evaluation, especially of literary or other artistic works', 'Lời phê bình', NULL, 'L44 Museums', 686, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Criticism n., an evaluation, especially of literary or other artistic works'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Criticize v., critic n.', 'Phê bình', NULL, 'L44 Museums', 687, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Criticize v., critic n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Express v., to give an opinion or depict emotion', 'Bày tỏ', NULL, 'L44 Museums', 688, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Express v., to give an opinion or depict emotion'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Fashion n., the prevailing style or custom', 'Thời trang', NULL, 'L44 Museums', 689, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Fashion n., the prevailing style or custom'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Leisure n., freedom from time-consuming duties; free time', 'Thời gian rỗi', NULL, 'L44 Museums', 690, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Leisure n., freedom from time-consuming duties; free time'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Respond v., to make a reply; to react', 'Đáp lại, phản ứng lại', NULL, 'L44 Museums', 691, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Respond v., to make a reply; to react'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Response n., responsive adj.', 'Sự trả lời', NULL, 'L44 Museums', 692, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Response n., responsive adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Schedule n., a list of times of events; v., to enter on a schedule', 'Kế hoạch làm việc', NULL, 'L44 Museums', 693, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Schedule n., a list of times of events; v., to enter on a schedule'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Significant adj., meaningful; having a major effect; important', 'Có ý nghĩa, quan trọng', NULL, 'L44 Museums', 694, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Significant adj., meaningful; having a major effect; important'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Specialize v., to concentrate on a particular activity', 'Chuyên môn hóa', NULL, 'L44 Museums', 695, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Specialize v., to concentrate on a particular activity'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Specialist n., specialized adj.', 'Chuyên gia', NULL, 'L44 Museums', 696, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Specialist n., specialized adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assignment n., v., something, such as a task, that is assigned', 'Nhiệm vụ, công việc', NULL, 'L45 Media', 697, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assignment n., v., something, such as a task, that is assigned'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Choose v., to select one thing over another', 'Chọn lựa', NULL, 'L45 Media', 698, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Choose v., to select one thing over another'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Choice n., choosy adj.', 'Sự chọn lựa', NULL, 'L45 Media', 699, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Choice n., choosy adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Constant n., something that is unchanging or invariable', 'Hằng số, không đổi', NULL, 'L45 Media', 700, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Constant n., something that is unchanging or invariable'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Constitute n., to be the elements or parts of', 'Cấu thành, tạo thành', NULL, 'L45 Media', 701, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Constitute n., to be the elements or parts of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Decisive adj., characterized by decision and firmness', 'Kiên quyết, dứt khoát', NULL, 'L45 Media', 702, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Decisive adj., characterized by decision and firmness'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Disseminate v., to scatter widely; to distribute', 'Truyền bá phổ biến', NULL, 'L45 Media', 703, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Disseminate v., to scatter widely; to distribute'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Impact n., a strong, immediate impression', 'Tác động, ảnh hưởng', NULL, 'L45 Media', 704, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Impact n., a strong, immediate impression'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'In depth adj., in complete detail; thorough', 'Tỉ mỉ, cẩn thận', NULL, 'L45 Media', 705, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'In depth adj., in complete detail; thorough'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Investigative adj., specializing in uncovering and reporting hidden information', 'Điều tra', NULL, 'L45 Media', 706, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Investigative adj., specializing in uncovering and reporting hidden information'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Investigation n., investigate v.', 'Sự điều tra', NULL, 'L45 Media', 707, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Investigation n., investigate v.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Link n., an association; a relationship', 'Mối liên hệ', NULL, 'L45 Media', 708, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Link n., an association; a relationship'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Subscribe v., to receive a periodical regularly on order', 'Đặt mua báo, tạp chí', NULL, 'L45 Media', 709, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Subscribe v., to receive a periodical regularly on order'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Subscription n., subscribers n.', 'Sự đặt mua', NULL, 'L45 Media', 710, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Subscription n., subscribers n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Thorough adj., exhaustively complete', 'Kỹ lưỡng, thấu đáo', NULL, 'L45 Media', 711, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Thorough adj., exhaustively complete'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Thoroughness n., thoroughly adv.', 'Sự thấu đáo', NULL, 'L45 Media', 712, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Thoroughness n., thoroughly adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Annual adj., yearly', 'Xảy ra hàng năm', NULL, 'L46 Doctor’s Office', 713, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Annual adj., yearly'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Appointment n., arrangements for a meeting; a position in a profession', 'Cuộc hẹn', NULL, 'L46 Doctor’s Office', 714, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Appointment n., arrangements for a meeting; a position in a profession'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assess v., to determine the value or rate of something', 'Ước định, định giá', NULL, 'L46 Doctor’s Office', 715, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assess v., to determine the value or rate of something'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Assessment n., assessable adj.', 'Sự đánh giá', NULL, 'L46 Doctor’s Office', 716, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Assessment n., assessable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Diagnose v., to recognize a disease; to analyze the nature of something', 'Tiến hành chẩn đoán', NULL, 'L46 Doctor’s Office', 717, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Diagnose v., to recognize a disease; to analyze the nature of something'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Diagnosis n., diagnostic adj.', 'Chẩn đoán', NULL, 'L46 Doctor’s Office', 718, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Diagnosis n., diagnostic adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Effective adj., producing the desired effect; being in effect', 'Có hiệu quả', NULL, 'L46 Doctor’s Office', 719, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Effective adj., producing the desired effect; being in effect'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Instrument n., a tool for precise work; the means whereby something is achieved', 'Dụng cụ, công cụ', NULL, 'L46 Doctor’s Office', 720, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Instrument n., a tool for precise work; the means whereby something is achieved'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Manage v., to handle; to deal with; to guide', 'Tìm cách xoay sở', NULL, 'L46 Doctor’s Office', 721, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Manage v., to handle; to deal with; to guide'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prevent v., to keep from happening; to hinder', 'Tránh, ngăn ngừa', NULL, 'L46 Doctor’s Office', 722, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prevent v., to keep from happening; to hinder'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Prevention n., preventive', 'Sự ngăn ngừa', NULL, 'L46 Doctor’s Office', 723, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Prevention n., preventive'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recommend v., to present as worthy; to endorse', 'Đề nghị, giới thiệu', NULL, 'L46 Doctor’s Office', 724, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recommend v., to present as worthy; to endorse'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Recommendation n., recommendable adj.', 'Lời giới thiệu', NULL, 'L46 Doctor’s Office', 725, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Recommendation n., recommendable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Record v., to set down in writing; n., a official copy of documents', 'Ghi lại, hồ sơ', NULL, 'L46 Doctor’s Office', 726, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Record v., to set down in writing; n., a official copy of documents'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Refer v., to direct for treatment or information; to mention', 'Tham khảo, giới thiệu', NULL, 'L46 Doctor’s Office', 727, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Refer v., to direct for treatment or information; to mention'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Serious adj., weighty', 'Nghiêm trọng', NULL, 'L46 Doctor’s Office', 728, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Serious adj., weighty'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Aware adj., having knowledge', 'Có kiến thức', NULL, 'L47 Dentist’s office', 729, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Aware adj., having knowledge'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Catch up v., to bring up to date', 'Theo kịp', NULL, 'L47 Dentist’s office', 730, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Catch up v., to bring up to date'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Distraction n., the act of being turned away from the focus', 'Sự sao nhãng', NULL, 'L47 Dentist’s office', 731, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Distraction n., the act of being turned away from the focus'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Distract v., distracted adj.', 'Làm sao nhãng', NULL, 'L47 Dentist’s office', 732, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Distract v., distracted adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Encouragement n., inspiration or support', 'Khuyến khích, động viên', NULL, 'L47 Dentist’s office', 733, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Encouragement n., inspiration or support'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Evident adj., easily seen or understood; obvious', 'Hiển nhiên, rõ ràng', NULL, 'L47 Dentist’s office', 734, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Evident adj., easily seen or understood; obvious'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Evidence n., evidently adv.', 'Bằng chứng', NULL, 'L47 Dentist’s office', 735, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Evidence n., evidently adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Habit n., a customary manner or practice', 'Thói quen, tập quán', NULL, 'L47 Dentist’s office', 736, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Habit n., a customary manner or practice'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Habitual adj., habitually adv.', 'Theo thói quen', NULL, 'L47 Dentist’s office', 737, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Habitual adj., habitually adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Illuminate v., to provide or brighten with light', 'Chiếu sáng, rọi sáng', NULL, 'L47 Dentist’s office', 738, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Illuminate v., to provide or brighten with light'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Irritate v., to chafe or inflame, to bother', 'Làm phát cáu, chọc tức', NULL, 'L47 Dentist’s office', 739, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Irritate v., to chafe or inflame, to bother'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Irritation n., irritable adj.', 'Sự chọc tức', NULL, 'L47 Dentist’s office', 740, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Irritation n., irritable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Overview n., a summary; a survey; a quick look', 'Khái quát, tổng quan', NULL, 'L47 Dentist’s office', 741, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Overview n., a summary; a survey; a quick look'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Position n., the right or appropriate place', 'Vị trí', NULL, 'L47 Dentist’s office', 742, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Position n., the right or appropriate place'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Regularly adv., occurring at fixed intervals', 'Thường xuyên, đều đặn', NULL, 'L47 Dentist’s office', 743, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Regularly adv., occurring at fixed intervals'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Restore v., to bring back to an original condition', 'Phục hồi', NULL, 'L47 Dentist’s office', 744, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Restore v., to bring back to an original condition'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Allow v., to let do or happen; to permit', 'Đồng ý, cho phép', NULL, 'L48 Health Insurance', 745, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Allow v., to let do or happen; to permit'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Allowance n., allowable adj.', 'Sự cho phép', NULL, 'L48 Health Insurance', 746, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Allowance n., allowable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Alternative n., the choice between two mutually exclusive possibilities', 'Sự lựa chọn', NULL, 'L48 Health Insurance', 747, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Alternative n., the choice between two mutually exclusive possibilities'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Alternate v., alternatively adv.', 'Thay phiên', NULL, 'L48 Health Insurance', 748, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Alternate v., alternatively adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Aspect n., a feature element; an appearance', 'Khía cạnh, diện mạo', NULL, 'L48 Health Insurance', 749, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Aspect n., a feature element; an appearance'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Concern v., to be of interest or importance to', 'Bận tâm, lo lắng', NULL, 'L48 Health Insurance', 750, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Concern v., to be of interest or importance to'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Emphasize v., to stress', 'Nhấn mạnh', NULL, 'L48 Health Insurance', 751, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Emphasize v., to stress'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Emphasis n., emphatic adj.', 'Sự nhấn mạnh', NULL, 'L48 Health Insurance', 752, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Emphasis n., emphatic adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Incur v., to acquire or come into', 'Gánh chịu, chịu lấy', NULL, 'L48 Health Insurance', 753, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Incur v., to acquire or come into'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Personnel n., a group of employees or workers', 'Cán bộ nhân viên', NULL, 'L48 Health Insurance', 754, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Personnel n., a group of employees or workers'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Policy n., a set of rules and regulations', 'Chính sách, điều khoản', NULL, 'L48 Health Insurance', 755, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Policy n., a set of rules and regulations'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Portion n., a section or quantity within a larger thing; a part of a whole', 'Phần chia, khẩu phần', NULL, 'L48 Health Insurance', 756, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Portion n., a section or quantity within a larger thing; a part of a whole'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Regardless adv., in spite of', 'Bất chấp, không đếm xỉa', NULL, 'L48 Health Insurance', 757, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Regardless adv., in spite of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Salary n., a fixed compensation paid regularly for work done; one’s pay', 'Lương', NULL, 'L48 Health Insurance', 758, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Salary n., a fixed compensation paid regularly for work done; one’s pay'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Suitable adj., appropriate to a purpose or an occasion', 'Phù hợp, thích hợp', NULL, 'L48 Health Insurance', 759, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Suitable adj., appropriate to a purpose or an occasion'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Suit v., suitably adv.', 'Thích hợp', NULL, 'L48 Health Insurance', 760, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Suit v., suitably adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Admit v., to permit to enter', 'Cho vào, nhận vào', NULL, 'L49 Hospitals', 761, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Admit v., to permit to enter'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Admittance n., admission n.', 'Sự cho vào', NULL, 'L49 Hospitals', 762, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Admittance n., admission n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Authorization n., the act of sanctioning', 'Sự cấp phép', NULL, 'L49 Hospitals', 763, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Authorization n., the act of sanctioning'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Designate v., to indicate or specify', 'Chỉ định', NULL, 'L49 Hospitals', 764, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Designate v., to indicate or specify'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Designation n., designator n.', 'Sự chỉ định', NULL, 'L49 Hospitals', 765, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Designation n., designator n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Escort n., a person accompanying another to guide or protect', 'Vệ sĩ, người hộ tống', NULL, 'L49 Hospitals', 766, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Escort n., a person accompanying another to guide or protect'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Identify v., to ascertain the name or belongings of', 'Nhận dạng, nhận biết', NULL, 'L49 Hospitals', 767, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Identify v., to ascertain the name or belongings of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Identifiable adj., identification n.', 'Có thể nhận dạng', NULL, 'L49 Hospitals', 768, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Identifiable adj., identification n.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Missing n., an inner calling to pursue an activity or perform a service', 'Vắng mặt, thất lạc', NULL, 'L49 Hospitals', 769, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Missing n., an inner calling to pursue an activity or perform a service'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consult v., to seek advice or information of', 'Hỏi ý kiến, tham khảo', NULL, 'L50 Pharmacy', 770, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consult v., to seek advice or information of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Consultation n., consultative adj.', 'Sự tham khảo', NULL, 'L50 Pharmacy', 771, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Consultation n., consultative adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Control v., to exercise authoritative or dominating influence', 'Có quyền hành', NULL, 'L50 Pharmacy', 772, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Control v., to exercise authoritative or dominating influence'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Convenient adj., suited or favorable to one’s purpose; easy to reach', 'Tiện lợi, thuận tiện', NULL, 'L50 Pharmacy', 773, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Convenient adj., suited or favorable to one’s purpose; easy to reach'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Convenience n., conveniently adv.', 'Sự tiện lợi', NULL, 'L50 Pharmacy', 774, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Convenience n., conveniently adv.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Detect v., to discover or ascertain', 'Phát hiện ra', NULL, 'L50 Pharmacy', 775, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Detect v., to discover or ascertain'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Detection n., detectable adj.', 'Sự phát hiện', NULL, 'L50 Pharmacy', 776, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Detection n., detectable adj.'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Factor n., a contribution to an accomplishment, a result, or a process', 'Nhân tố, yếu tố', NULL, 'L50 Pharmacy', 777, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Factor n., a contribution to an accomplishment, a result, or a process'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Interaction n., an influence; a mutual activity', 'Sự ảnh hưởng lẫn nhau', NULL, 'L50 Pharmacy', 778, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Interaction n., an influence; a mutual activity'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Limit n., the point beyond which something cannot proceed', 'Giới hạn', NULL, 'L50 Pharmacy', 779, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Limit n., the point beyond which something cannot proceed'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Monitor v., to keep track of', 'Theo dõi, giám sát', NULL, 'L50 Pharmacy', 780, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Monitor v., to keep track of'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Potential adj., capable of being but not yet in existence; possible', 'Tiềm năng', NULL, 'L50 Pharmacy', 781, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Potential adj., capable of being but not yet in existence; possible'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sample n., a portion, piece, or segment that is representative of a whole', 'Mẫu, vật mẫu', NULL, 'L50 Pharmacy', 782, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sample n., a portion, piece, or segment that is representative of a whole'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Sense n., a judgment; an intellectual interpretation', 'Khả năng phán đoán, giác quan', NULL, 'L50 Pharmacy', 783, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Sense n., a judgment; an intellectual interpretation'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Volunteer n., one who performs a service without pay; (v.)', 'Tình nguyện viên', 'to perform as a volunteer', 'L50 Pharmacy', 784, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Volunteer n., one who performs a service without pay; (v.)'
);
INSERT INTO flashcards (deck_id, front_text, back_text, note, hint, card_order, is_active, created_by, card_color)
SELECT @toeic_deck_id, 'Volunteerism n., voluntary adj.', 'Phong trào tình nguyện', NULL, 'L50 Pharmacy', 785, true, @admin_id, 'bg-brand-coral'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards WHERE deck_id = @toeic_deck_id AND front_text = 'Volunteerism n., voluntary adj.'
);

-- Sync total_cards count for DECK-TOEIC-600
UPDATE decks SET total_cards = (SELECT COUNT(*) FROM flashcards WHERE deck_id = @toeic_deck_id) WHERE id = @toeic_deck_id;
