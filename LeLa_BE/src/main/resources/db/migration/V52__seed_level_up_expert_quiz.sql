-- =========================================================================
-- V52: SEED LEVEL-UP EXPERT QUIZ (TOEIC Mastery Level-Up Test - 850 - 990)
-- =========================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @admin_id = COALESCE((SELECT id FROM users WHERE email = 'admin@lela.com' OR username = 'admin' LIMIT 1), 1);
SET @toeic_exam_id = COALESCE((SELECT id FROM exam_types WHERE code = 'TOEIC' LIMIT 1), 1);
SET @level_4_id = COALESCE((SELECT id FROM proficiency_levels WHERE code = 'TOEIC_EXCELLENT' OR display_order = 4 LIMIT 1), 4);

-- 1. Ensure Proficiency Level 4 exists
INSERT INTO proficiency_levels (id, exam_type_id, code, name, min_score, max_score, display_order, created_at, updated_at)
SELECT 4, @toeic_exam_id, 'TOEIC_EXCELLENT', 'Xuất sắc (850 - 990)', 851.00, 990.00, 4, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM proficiency_levels WHERE id = 4 OR code = 'TOEIC_EXCELLENT');

-- 2. Update existing UPGRADE-650-01 if it exists
UPDATE quizzes 
SET title = 'TOEIC Mastery Level-Up Test - 30 Câu / 25 Phút',
    description = 'Bài kiểm tra nâng cấp trình độ TOEIC Xuất sắc (850 - 990) - 30 Câu / 25 Phút. Đạt từ 80% (24/30 câu) để nâng cấp trình độ ngay lập tức.',
    time_limit_seconds = 1500,
    level_id = @level_4_id,
    quiz_category = 'LEVEL_UP',
    is_active = 1
WHERE quiz_code = 'UPGRADE-650-01';

-- 3. Ensure UPGRADE-850-01 exists as the dedicated Expert Level-Up Quiz
INSERT INTO quizzes (id, quiz_code, title, description, quiz_type, quiz_category, time_limit_seconds, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, exam_type_id, level_id, created_by, created_at, updated_at)
SELECT 40031, 'UPGRADE-850-01', 'TOEIC Mastery Level-Up Test - 30 Câu / 25 Phút', 'Bài kiểm tra nâng cấp trình độ TOEIC Xuất sắc (850 - 990) - 30 Câu / 25 Phút. Đạt từ 80% (24/30 câu) để nâng cấp trình độ ngay lập tức.', 'MULTIPLE_CHOICE', 'LEVEL_UP', 1500, 80.00, 999, 1, 1, 30, 1, @toeic_exam_id, @level_4_id, @admin_id, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE id = 40031 OR quiz_code = 'UPGRADE-850-01');

-- Seed 30 Questions for UPGRADE-850-01 (ID 40031) if not exists
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, explanation, points, display_order, is_active, created_at, updated_at)
SELECT q.id, 40031, q.txt, 'MULTIPLE_CHOICE', q.exp, 10, q.ord, 1, NOW(), NOW()
FROM (
    SELECT 750001 AS id, 'The board of directors unanimously ______ the proposal to acquire the European logistics branch.' AS txt, 'Approved (chấp thuận) là động từ phù hợp nhất với chủ ngữ the board of directors.' AS exp, 1 AS ord UNION ALL
    SELECT 750002, 'Despite the economic downturn, the company managed to maintain a ______ revenue growth of 12%.' AS txt, 'Substantial (đáng kể) là tính từ bổ nghĩa cho revenue growth.' AS exp, 2 UNION ALL
    SELECT 750003, 'Employees are required to submit their expense reimbursement forms ______ five business days.' AS txt, 'Within (trong vòng) chỉ khoảng thời gian hoàn thành thủ tục.' AS exp, 3 UNION ALL
    SELECT 750004, 'The new safety regulations will be strictly ______ across all manufacturing plants.' AS txt, 'Enforced (được thi hành, thực thi) là phân từ hai phù hợp với regulations.' AS exp, 4 UNION ALL
    SELECT 750005, 'Mr. Henderson was commended for his ______ in managing the complex restructuring project.' AS txt, 'Leadership (khả năng lãnh đạo) là danh từ phù hợp sau tính từ sở hữu his.' AS exp, 5 UNION ALL
    SELECT 750006, 'The keynote speaker delivered an ______ presentation on artificial intelligence trends.' AS txt, 'Insightful (sâu sắc) là tính từ bổ nghĩa cho presentation.' AS exp, 6 UNION ALL
    SELECT 750007, 'Neither the project manager ______ the team leads anticipated the sudden increase in customer demand.' AS txt, 'Neither đi liền với nor trong cấu trúc ngữ pháp tương quan.' AS exp, 7 UNION ALL
    SELECT 750008, 'All participants must register online ______ advance of the international summit.' AS txt, 'Cụm từ cố định: in advance of (trước khi).' AS exp, 8 UNION ALL
    SELECT 750009, 'The quarterly financial report indicated that operating costs had risen ______.' AS txt, 'Significantly (một cách đáng kể) là trạng từ bổ nghĩa cho had risen.' AS exp, 9 UNION ALL
    SELECT 750010, 'Ms. Patel has demonstrated exceptional dedication ______ joining the firm three years ago.' AS txt, 'Since đi với mốc thời gian trong quá khứ khi động từ chính ở thì hiện tại hoàn thành.' AS exp, 10 UNION ALL
    SELECT 750011, 'The research facility was equipped with ______ laboratory instruments.' AS txt, 'Sophisticated (tinh vi, hiện đại) miêu tả các thiết bị công nghệ cao.' AS exp, 11 UNION ALL
    SELECT 750012, 'Our customer support team is committed to ______ inquiries within 24 hours.' AS txt, 'Cấu trúc be committed to + V-ing (cam kết làm gì).' AS exp, 12 UNION ALL
    SELECT 750013, 'The contract negotiations reached a standstill due to ______ disagreements over intellectual property rights.' AS txt, 'Persistent (dai dẳng) là tính từ bổ nghĩa cho disagreements.' AS exp, 13 UNION ALL
    SELECT 750014, 'Had the shipment arrived on schedule, the production line ______ operational without delay.' AS txt, 'Đảo ngữ câu điều kiện loại 3: Had + S + V3, S + would have been.' AS exp, 14 UNION ALL
    SELECT 750015, 'The marketing campaign was remarkably effective, ______ brand awareness by nearly 40 percent.' AS txt, 'Rút gọn mệnh đề quan hệ dạng chủ động dùng V-ing: boosting.' AS exp, 15 UNION ALL
    SELECT 750016, 'Only candidates who meet all minimum requirements will be ______ for the senior executive role.' AS txt, 'Eligible (đủ điều kiện) đi với giới từ for.' AS exp, 16 UNION ALL
    SELECT 750017, 'The merger between the two retail giants is subject to ______ approval.' AS txt, 'Regulatory approval (sự phê duyệt của cơ quan quản lý).' AS exp, 17 UNION ALL
    SELECT 750018, 'Under no circumstances ______ employees disclose confidential client information.' AS txt, 'Đảo ngữ với Under no circumstances: trợ động từ should đứng trước chủ ngữ.' AS exp, 18 UNION ALL
    SELECT 750019, 'The venue was chosen primarily because of its ______ to public transit hubs.' AS txt, 'Proximity to (sự gần gũi, vị trí gần với nơi nào).' AS exp, 19 UNION ALL
    SELECT 750020, 'Please ensure that the enclosed non-disclosure agreement is signed and ______ promptly.' AS txt, 'Đồng dạng thể bị động: is signed and returned.' AS exp, 20 UNION ALL
    SELECT 750021, 'The auditor pointed out several minor ______ in the subsidiary balance sheet.' AS txt, 'Discrepancies (sự khác biệt, không nhất quán).' AS exp, 21 UNION ALL
    SELECT 750022, 'The revised employee handbook provides ______ guidelines on remote work arrangements.' AS txt, 'Comprehensive (toàn diện, chi tiết) bổ nghĩa cho guidelines.' AS exp, 22 UNION ALL
    SELECT 750023, 'Technological advances have ______ transformed the logistics and warehousing industry.' AS txt, 'Dramatically (một cách ngoạn mục) bổ nghĩa cho transformed.' AS exp, 23 UNION ALL
    SELECT 750024, 'All delegates are cordially invited to the welcoming banquet, ______ will begin at 7:00 PM.' AS txt, 'Đại từ quan hệ which bổ nghĩa cho the welcoming banquet.' AS exp, 24 UNION ALL
    SELECT 750025, 'The facility management team conducted a thorough ______ of all fire safety systems.' AS txt, 'Inspection (sự thanh tra, kiểm tra kỹ lưỡng).' AS exp, 25 UNION ALL
    SELECT 750026, 'Should you require any further assistance, please do not ______ to contact our office.' AS txt, 'Hesitate (ngần ngại) trong cấu trúc do not hesitate to contact.' AS exp, 26 UNION ALL
    SELECT 750027, 'The software upgrade includes innovative features designed to ______ workflow bottlenecks.' AS txt, 'Alleviate (giảm bớt, xoa dịu).' AS exp, 27 UNION ALL
    SELECT 750028, 'Investing in renewable energy infrastructure yields both environmental and ______ dividends.' AS txt, 'Economic (thuộc về kinh tế) song hành với environmental.' AS exp, 28 UNION ALL
    SELECT 750029, 'By the time the new facility opens next year, the company ______ over $50 million in regional development.' AS txt, 'Thì tương lai hoàn thành: will have invested.' AS exp, 29 UNION ALL
    SELECT 750030, 'The quality assurance committee praised the team for their ______ adherence to industrial standards.' AS txt, 'Meticulous (tỉ mỉ, cẩn trọng) bổ nghĩa cho adherence.' AS exp, 30
) q
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_id = 40031);

-- Seed Options for all 30 questions of UPGRADE-850-01 (ID 40031)
INSERT INTO quiz_question_options (question_id, option_key, option_text, normalized_text, is_correct, display_order, created_at, updated_at)
SELECT opt.qid, opt.k, opt.txt, opt.txt, opt.cor, opt.ord, NOW(), NOW()
FROM (
    -- Q1
    SELECT 750001 AS qid, 'A' AS k, 'approved' AS txt, 1 AS cor, 1 AS ord UNION ALL
    SELECT 750001, 'B', 'approval', 0, 2 UNION ALL
    SELECT 750001, 'C', 'approvingly', 0, 3 UNION ALL
    SELECT 750001, 'D', 'approve', 0, 4 UNION ALL

    -- Q2
    SELECT 750002, 'A', 'substantial', 1, 1 UNION ALL
    SELECT 750002, 'B', 'substance', 0, 2 UNION ALL
    SELECT 750002, 'C', 'substantially', 0, 3 UNION ALL
    SELECT 750002, 'D', 'substantiate', 0, 4 UNION ALL

    -- Q3
    SELECT 750003, 'A', 'within', 1, 1 UNION ALL
    SELECT 750003, 'B', 'along', 0, 2 UNION ALL
    SELECT 750003, 'C', 'among', 0, 3 UNION ALL
    SELECT 750003, 'D', 'between', 0, 4 UNION ALL

    -- Q4
    SELECT 750004, 'A', 'enforcing', 0, 1 UNION ALL
    SELECT 750004, 'B', 'enforced', 1, 2 UNION ALL
    SELECT 750004, 'C', 'enforcement', 0, 3 UNION ALL
    SELECT 750004, 'D', 'enforce', 0, 4 UNION ALL

    -- Q5
    SELECT 750005, 'A', 'leadership', 1, 1 UNION ALL
    SELECT 750005, 'B', 'leader', 0, 2 UNION ALL
    SELECT 750005, 'C', 'leading', 0, 3 UNION ALL
    SELECT 750005, 'D', 'lead', 0, 4 UNION ALL

    -- Q6
    SELECT 750006, 'A', 'insightful', 1, 1 UNION ALL
    SELECT 750006, 'B', 'insight', 0, 2 UNION ALL
    SELECT 750006, 'C', 'insightfully', 0, 3 UNION ALL
    SELECT 750006, 'D', 'insights', 0, 4 UNION ALL

    -- Q7
    SELECT 750007, 'A', 'nor', 1, 1 UNION ALL
    SELECT 750007, 'B', 'or', 0, 2 UNION ALL
    SELECT 750007, 'C', 'and', 0, 3 UNION ALL
    SELECT 750007, 'D', 'but', 0, 4 UNION ALL

    -- Q8
    SELECT 750008, 'A', 'in', 1, 1 UNION ALL
    SELECT 750008, 'B', 'at', 0, 2 UNION ALL
    SELECT 750008, 'C', 'on', 0, 3 UNION ALL
    SELECT 750008, 'D', 'for', 0, 4 UNION ALL

    -- Q9
    SELECT 750009, 'A', 'significantly', 1, 1 UNION ALL
    SELECT 750009, 'B', 'significance', 0, 2 UNION ALL
    SELECT 750009, 'C', 'significant', 0, 3 UNION ALL
    SELECT 750009, 'D', 'signify', 0, 4 UNION ALL

    -- Q10
    SELECT 750010, 'A', 'since', 1, 1 UNION ALL
    SELECT 750010, 'B', 'during', 0, 2 UNION ALL
    SELECT 750010, 'C', 'until', 0, 3 UNION ALL
    SELECT 750010, 'D', 'while', 0, 4 UNION ALL

    -- Q11
    SELECT 750011, 'A', 'sophisticated', 1, 1 UNION ALL
    SELECT 750011, 'B', 'sophistication', 0, 2 UNION ALL
    SELECT 750011, 'C', 'sophisticate', 0, 3 UNION ALL
    SELECT 750011, 'D', 'sophisticatedly', 0, 4 UNION ALL

    -- Q12
    SELECT 750012, 'A', 'resolving', 1, 1 UNION ALL
    SELECT 750012, 'B', 'resolve', 0, 2 UNION ALL
    SELECT 750012, 'C', 'resolution', 0, 3 UNION ALL
    SELECT 750012, 'D', 'resolved', 0, 4 UNION ALL

    -- Q13
    SELECT 750013, 'A', 'persistent', 1, 1 UNION ALL
    SELECT 750013, 'B', 'persistently', 0, 2 UNION ALL
    SELECT 750013, 'C', 'persistence', 0, 3 UNION ALL
    SELECT 750013, 'D', 'persist', 0, 4 UNION ALL

    -- Q14
    SELECT 750014, 'A', 'would have been', 1, 1 UNION ALL
    SELECT 750014, 'B', 'will be', 0, 2 UNION ALL
    SELECT 750014, 'C', 'would be', 0, 3 UNION ALL
    SELECT 750014, 'D', 'had been', 0, 4 UNION ALL

    -- Q15
    SELECT 750015, 'A', 'boosting', 1, 1 UNION ALL
    SELECT 750015, 'B', 'boosted', 0, 2 UNION ALL
    SELECT 750015, 'C', 'boost', 0, 3 UNION ALL
    SELECT 750015, 'D', 'booster', 0, 4 UNION ALL

    -- Q16
    SELECT 750016, 'A', 'eligible', 1, 1 UNION ALL
    SELECT 750016, 'B', 'eligibility', 0, 2 UNION ALL
    SELECT 750016, 'C', 'eligibly', 0, 3 UNION ALL
    SELECT 750016, 'D', 'election', 0, 4 UNION ALL

    -- Q17
    SELECT 750017, 'A', 'regulatory', 1, 1 UNION ALL
    SELECT 750017, 'B', 'regular', 0, 2 UNION ALL
    SELECT 750017, 'C', 'regulate', 0, 3 UNION ALL
    SELECT 750017, 'D', 'regulation', 0, 4 UNION ALL

    -- Q18
    SELECT 750018, 'A', 'should', 1, 1 UNION ALL
    SELECT 750018, 'B', 'will', 0, 2 UNION ALL
    SELECT 750018, 'C', 'have', 0, 3 UNION ALL
    SELECT 750018, 'D', 'did', 0, 4 UNION ALL

    -- Q19
    SELECT 750019, 'A', 'proximity', 1, 1 UNION ALL
    SELECT 750019, 'B', 'approximate', 0, 2 UNION ALL
    SELECT 750019, 'C', 'approximately', 0, 3 UNION ALL
    SELECT 750019, 'D', 'approximation', 0, 4 UNION ALL

    -- Q20
    SELECT 750020, 'A', 'returned', 1, 1 UNION ALL
    SELECT 750020, 'B', 'returning', 0, 2 UNION ALL
    SELECT 750020, 'C', 'returns', 0, 3 UNION ALL
    SELECT 750020, 'D', 'return', 0, 4 UNION ALL

    -- Q21
    SELECT 750021, 'A', 'discrepancies', 1, 1 UNION ALL
    SELECT 750021, 'B', 'discrepant', 0, 2 UNION ALL
    SELECT 750021, 'C', 'discretion', 0, 3 UNION ALL
    SELECT 750021, 'D', 'discreetly', 0, 4 UNION ALL

    -- Q22
    SELECT 750022, 'A', 'comprehensive', 1, 1 UNION ALL
    SELECT 750022, 'B', 'comprehensively', 0, 2 UNION ALL
    SELECT 750022, 'C', 'comprehend', 0, 3 UNION ALL
    SELECT 750022, 'D', 'comprehension', 0, 4 UNION ALL

    -- Q23
    SELECT 750023, 'A', 'dramatically', 1, 1 UNION ALL
    SELECT 750023, 'B', 'dramatic', 0, 2 UNION ALL
    SELECT 750023, 'C', 'drama', 0, 3 UNION ALL
    SELECT 750023, 'D', 'dramatize', 0, 4 UNION ALL

    -- Q24
    SELECT 750024, 'A', 'which', 1, 1 UNION ALL
    SELECT 750024, 'B', 'that', 0, 2 UNION ALL
    SELECT 750024, 'C', 'who', 0, 3 UNION ALL
    SELECT 750024, 'D', 'where', 0, 4 UNION ALL

    -- Q25
    SELECT 750025, 'A', 'inspection', 1, 1 UNION ALL
    SELECT 750025, 'B', 'inspector', 0, 2 UNION ALL
    SELECT 750025, 'C', 'inspecting', 0, 3 UNION ALL
    SELECT 750025, 'D', 'inspect', 0, 4 UNION ALL

    -- Q26
    SELECT 750026, 'A', 'hesitate', 1, 1 UNION ALL
    SELECT 750026, 'B', 'hesitation', 0, 2 UNION ALL
    SELECT 750026, 'C', 'hesitant', 0, 3 UNION ALL
    SELECT 750026, 'D', 'hesitantly', 0, 4 UNION ALL

    -- Q27
    SELECT 750027, 'A', 'alleviate', 1, 1 UNION ALL
    SELECT 750027, 'B', 'alleviation', 0, 2 UNION ALL
    SELECT 750027, 'C', 'alleviated', 0, 3 UNION ALL
    SELECT 750027, 'D', 'alleviating', 0, 4 UNION ALL

    -- Q28
    SELECT 750028, 'A', 'economic', 1, 1 UNION ALL
    SELECT 750028, 'B', 'economical', 0, 2 UNION ALL
    SELECT 750028, 'C', 'economize', 0, 3 UNION ALL
    SELECT 750028, 'D', 'economist', 0, 4 UNION ALL

    -- Q29
    SELECT 750029, 'A', 'will have invested', 1, 1 UNION ALL
    SELECT 750029, 'B', 'has invested', 0, 2 UNION ALL
    SELECT 750029, 'C', 'invests', 0, 3 UNION ALL
    SELECT 750029, 'D', 'invested', 0, 4 UNION ALL

    -- Q30
    SELECT 750030, 'A', 'meticulous', 1, 1 UNION ALL
    SELECT 750030, 'B', 'meticulously', 0, 2 UNION ALL
    SELECT 750030, 'C', 'meticulousness', 0, 3 UNION ALL
    SELECT 750030, 'D', 'metric', 0, 4
) opt
JOIN quiz_questions qq ON qq.id = opt.qid
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question_options qo 
    WHERE qo.question_id = opt.qid AND qo.option_key = opt.k
);
