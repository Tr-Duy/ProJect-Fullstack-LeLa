import mysql.connector
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def slugify(text):
    text = text.lower()
    text = re.sub(r'[àáảãạăằắẳẵặâầấẩẫậ]', 'a', text)
    text = re.sub(r'[èéẻẽẹêềếểễệ]', 'e', text)
    text = re.sub(r'[ìíỉĩị]', 'i', text)
    text = re.sub(r'[òóỏõọôồốổỗộơờớởỡợ]', 'o', text)
    text = re.sub(r'[ùúủũụưừứửữự]', 'u', text)
    text = re.sub(r'[ỳýỷỹỵ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

cnx = mysql.connector.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db'
)
cur = cnx.cursor(dictionary=True)

print("=== 1. ALTER TABLES AND UNIQUE CONSTRAINTS FOR TAGS & ACHIEVEMENTS ===")

# Check if description column exists on tags
cur.execute("SHOW COLUMNS FROM tags LIKE 'description'")
if not cur.fetchone():
    cur.execute("ALTER TABLE tags ADD COLUMN description VARCHAR(500) AFTER slug")
    print("Added description column to tags table.")

# Ensure unique constraint on tags.slug
try:
    cur.execute("ALTER TABLE tags ADD UNIQUE INDEX uk_tags_slug (slug)")
    print("Added UNIQUE index on tags.slug.")
except Exception as e:
    print("uk_tags_slug index existing or status:", e)

# Ensure deck_tags table
cur.execute("""
CREATE TABLE IF NOT EXISTS deck_tags (
    deck_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (deck_id, tag_id),
    CONSTRAINT fk_dt_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
    CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
print("Created/verified deck_tags table.")

# Ensure flashcard_tags table
cur.execute("""
CREATE TABLE IF NOT EXISTS flashcard_tags (
    flashcard_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (flashcard_id, tag_id),
    CONSTRAINT fk_ft_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE,
    CONSTRAINT fk_ft_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
print("Created/verified flashcard_tags table.")

# Ensure achievements table schema updates
cur.execute("SHOW COLUMNS FROM achievements LIKE 'category'")
if not cur.fetchone():
    cur.execute("ALTER TABLE achievements ADD COLUMN category VARCHAR(50) AFTER condition_value")
    print("Added category column to achievements table.")

cur.execute("SHOW COLUMNS FROM achievements LIKE 'is_active'")
if not cur.fetchone():
    cur.execute("ALTER TABLE achievements ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER category")
    print("Added is_active column to achievements table.")

try:
    cur.execute("ALTER TABLE achievements ADD UNIQUE INDEX uk_achievements_code (code)")
    print("Added UNIQUE index on achievements.code.")
except Exception as e:
    print("uk_achievements_code status:", e)

# Ensure UNIQUE constraint on user_achievements (user_id, achievement_id)
try:
    cur.execute("ALTER TABLE user_achievements ADD UNIQUE INDEX uk_user_achievement (user_id, achievement_id)")
    print("Added UNIQUE index on user_achievements(user_id, achievement_id).")
except Exception as e:
    print("uk_user_achievement status:", e)

cnx.commit()

print("\n=== 2. SEEDING 35 TOEIC TAGS ===")
tags_data = [
    ("Business", "business", "Từ vựng liên quan đến kinh doanh, doanh nghiệp và giao dịch thương mại."),
    ("Office", "office", "Từ vựng văn phòng, thiết bị, môi trường làm việc hành chính."),
    ("Employment", "employment", "Tuyển dụng, công việc, phỏng vấn, hồ sơ xin việc và nhân sự."),
    ("Human Resources", "human-resources", "Quản lý nhân sự, đào tạo, chế độ đãi ngộ và đãi ngộ nhân viên."),
    ("Finance", "finance", "Tài chính, ngân sách, đầu tư, doanh thu và vốn."),
    ("Accounting", "accounting", "Kế toán, kiểm toán, hóa đơn, thu chi và báo cáo tài chính."),
    ("Banking", "banking", "Ngân hàng, tài khoản, dịch vụ tín dụng và thanh toán."),
    ("Marketing", "marketing", "Thị trường, quảng cáo, chiến lược tiếp thị và khuyến mãi."),
    ("Sales", "sales", "Bán hàng, doanh số, đàm phán và đơn đặt hàng."),
    ("Customer Service", "customer-service", "Chăm sóc khách hàng, tư vấn, giải quyết khiếu nại."),
    ("Travel", "travel", "Du lịch, lịch trình, hành lý, vé máy bay và di chuyển."),
    ("Transportation", "transportation", "Vận tải, logistics, giao thông và phương tiện chuyên chở."),
    ("Hotels", "hotels", "Khách sạn, đặt phòng, dịch vụ lưu trú và nghỉ dưỡng."),
    ("Restaurants", "restaurants", "Nhà hàng, ẩm thực, thực đơn, ăn uống và phục vụ."),
    ("Shopping", "shopping", "Mua sắm, cửa hàng, bán lẻ, giá cả và hàng hóa."),
    ("Contracts", "contracts", "Hợp đồng, điều khoản, thỏa thuận và ký kết."),
    ("Meetings", "meetings", "Cuộc họp, hội thảo, thảo luận và chương trình nghị sự."),
    ("Correspondence", "correspondence", "Thư từ, email, văn bản và thông báo chính thức."),
    ("Technology", "technology", "Công nghệ, phần mềm, thiết bị điện tử và phần cứng."),
    ("Computers", "computers", "Máy tính, mạng internet, cơ sở dữ liệu và hệ thống."),
    ("Manufacturing", "manufacturing", "Sản xuất, nhà máy, dây chuyền và chế tạo."),
    ("Construction", "construction", "Xây dựng, công trình, vật liệu và thiết kế kiến trúc."),
    ("Events", "events", "Sự kiện, hội nghị, triển lãm và tổ chức hoạt động."),
    ("Media", "media", "Truyền thông, báo chí, phát thanh và xuất bản."),
    ("Education", "education", "Giáo dục, đào tạo, trường học và khóa học."),
    ("Health", "health", "Sức khỏe, y tế, bệnh viện và chăm sóc y khoa."),
    ("Environment", "environment", "Môi trường, sinh thái, bảo tồn và tài nguyên."),
    ("Government", "government", "Chính phủ, chính sách, pháp lý và hành chính công."),
    ("Sports", "sports", "Thể thao, thi đấu, rèn luyện thể chất và giải đấu."),
    ("Food", "food", "Thực phẩm, chế biến, nguyên liệu và dinh dưỡng."),
    ("Law", "law", "Pháp luật, quy định, tư vấn pháp lý và tranh chấp."),
    ("Real Estate", "real-estate", "Bất động sản, nhà đất, thuê và mua bán địa ốc."),
    ("Insurance", "insurance", "Bảo hiểm, bồi thường, hợp đồng bảo hiểm và rủi ro."),
    ("Entertainment", "entertainment", "Giải trí, nghệ thuật, âm nhạc và điện ảnh."),
    ("Logistics", "logistics", "Hậu cần, kho bãi, vận chuyển và phân phối hàng hóa.")
]

tag_id_map = {}
for name, slug, desc in tags_data:
    cur.execute("SELECT id FROM tags WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        tag_id = row['id']
        cur.execute("UPDATE tags SET name=%s, description=%s, is_active=1 WHERE id=%s", (name, desc, tag_id))
    else:
        cur.execute("INSERT INTO tags (name, slug, description, is_active, created_at) VALUES (%s, %s, %s, 1, NOW())", (name, slug, desc))
        tag_id = cur.lastrowid
    tag_id_map[slug] = tag_id

cnx.commit()
print(f"Seeded/Updated {len(tag_id_map)} Tags successfully!")

print("\n=== 3. AUTOMATICALLY LINKING DECKS & FLASHCARDS TO TAGS ===")
# Keyword rule dictionary to tag decks & flashcards based on title/description/vocab
rules = {
    'business': ['business', 'company', 'corporate', 'firm', 'executive', 'trade', 'commerce', 'enterprise', 'thương mại', 'doanh nghiệp', 'kinh doanh'],
    'office': ['office', 'desk', 'stationery', 'paperwork', 'chair', 'supplies', 'clerk', 'văn phòng', 'hành chính'],
    'employment': ['employment', 'job', 'hiring', 'recruit', 'interview', 'resume', 'candidate', 'applicant', 'salary', 'wage', 'tuyển dụng', 'xin việc', 'lương'],
    'human-resources': ['human resource', 'personnel', 'staff', 'employee', 'training', 'benefits', 'payroll', 'nhân sự'],
    'finance': ['finance', 'budget', 'invest', 'revenue', 'profit', 'capital', 'financial', 'fund', 'tài chính', 'ngân sách', 'lợi nhuận'],
    'accounting': ['account', 'audit', 'invoice', 'receipt', 'tax', 'expense', 'balance', 'kế toán', 'hóa đơn', 'thuế'],
    'banking': ['bank', 'deposit', 'withdraw', 'credit', 'loan', 'interest', 'teller', 'ngân hàng', 'vay', 'tín dụng'],
    'marketing': ['market', 'advertise', 'campaign', 'brand', 'promote', 'commercial', 'target', 'tiếp thị', 'quảng cáo'],
    'sales': ['sale', 'discount', 'client', 'deal', 'order', 'purchase', 'bargain', 'bán hàng', 'doanh số', 'chiết khấu'],
    'customer-service': ['customer', 'service', 'complaint', 'feedback', 'support', 'inquiry', 'satisfaction', 'chăm sóc khách hàng', 'khiếu nại'],
    'travel': ['travel', 'flight', 'trip', 'tour', 'passenger', 'airline', 'luggage', 'passport', 'visa', 'du lịch', 'chuyến bay', 'hành lý'],
    'transportation': ['transport', 'vehicle', 'car', 'bus', 'train', 'cargo', 'shipment', 'freight', 'vận tải', 'xe', 'tàu'],
    'hotels': ['hotel', 'resort', 'reservation', 'room', 'suite', 'reception', 'guest', 'check-in', 'khách sạn', 'đặt phòng'],
    'restaurants': ['restaurant', 'dining', 'menu', 'chef', 'waiter', 'meal', 'dish', 'recipe', 'nhà hàng', 'ăn uống', 'thực đơn'],
    'shopping': ['shop', 'store', 'retail', 'mall', 'item', 'checkout', 'price', 'receipt', 'mua sắm', 'cửa hàng', 'giá cả'],
    'contracts': ['contract', 'agreement', 'clause', 'terms', 'sign', 'bind', 'legal', 'hợp đồng', 'ký kết', 'thỏa thuận'],
    'meetings': ['meeting', 'conference', 'agenda', 'discuss', 'session', 'presentation', 'minutes', 'cuộc họp', 'hội thảo'],
    'correspondence': ['correspondence', 'letter', 'email', 'memo', 'notice', 'envelope', 'message', 'thư từ', 'thông báo'],
    'technology': ['technology', 'tech', 'software', 'device', 'digital', 'electronic', 'innovation', 'công nghệ', 'phần mềm', 'thiết bị'],
    'computers': ['computer', 'laptop', 'internet', 'network', 'database', 'system', 'program', 'screen', 'máy tính', 'mạng'],
    'manufacturing': ['manufacture', 'factory', 'production', 'assembly', 'plant', 'machinery', 'sản xuất', 'nhà máy'],
    'construction': ['construction', 'build', 'architect', 'material', 'site', 'structure', 'xây dựng', 'công trình'],
    'events': ['event', 'ceremony', 'banquet', 'exhibition', 'fair', 'organize', 'sự kiện', 'triển lãm'],
    'media': ['media', 'press', 'broadcast', 'publish', 'news', 'journal', 'truyền thông', 'báo chí'],
    'education': ['education', 'school', 'university', 'course', 'lecture', 'degree', 'scholar', 'giáo dục', 'trường'],
    'health': ['health', 'medical', 'hospital', 'doctor', 'patient', 'clinic', 'medicine', 'sức khỏe', 'y tế', 'bệnh viện'],
    'environment': ['environment', 'nature', 'ecological', 'recycle', 'pollution', 'green', 'môi trường', 'sinh thái'],
    'government': ['government', 'policy', 'official', 'public', 'regulation', 'civic', 'chính phủ', 'chính sách'],
    'sports': ['sport', 'game', 'stadium', 'athlete', 'match', 'fitness', 'match', 'thể thao', 'sân vận động'],
    'food': ['food', 'ingredient', 'cook', 'beverage', 'nutrition', 'flavor', 'thực phẩm', 'dinh dưỡng'],
    'law': ['law', 'attorney', 'court', 'legal', 'lawyer', 'regulation', 'dispute', 'pháp luật', 'luật sư', 'tòa án'],
    'real-estate': ['real estate', 'property', 'lease', 'rent', 'tenant', 'landlord', 'realty', 'bất động sản', 'địa ốc'],
    'insurance': ['insurance', 'policy', 'claim', 'coverage', 'premium', 'bảo hiểm', 'bồi thường'],
    'entertainment': ['entertainment', 'movie', 'film', 'music', 'theater', 'show', 'ticket', 'giải trí', 'nghệ thuật'],
    'logistics': ['logistics', 'warehouse', 'stock', 'inventory', 'supply chain', 'hậu cần', 'kho bãi']
}

cur.execute("SELECT id, title, description FROM decks WHERE deleted_at IS NULL")
decks = cur.fetchall()

linked_deck_count = 0
for d in decks:
    deck_text = f"{d['title']} {d['description'] or ''}".lower()
    matched_tag_ids = set()
    for slug, kw_list in rules.items():
        if any(kw in deck_text for kw in kw_list):
            matched_tag_ids.add(tag_id_map[slug])
    
    # If no keyword matched, assign general Business / Office tags by default
    if not matched_tag_ids:
        matched_tag_ids.add(tag_id_map['business'])
        matched_tag_ids.add(tag_id_map['office'])
    
    for tid in matched_tag_ids:
        cur.execute("INSERT IGNORE INTO deck_tags (deck_id, tag_id, created_at) VALUES (%s, %s, NOW())", (d['id'], tid))
    linked_deck_count += 1

cnx.commit()
print(f"Successfully linked tags to all {linked_deck_count} Decks!")

# Link flashcards based on their word/definition/example or inherit from deck_tags
cur.execute("""
    INSERT IGNORE INTO flashcard_tags (flashcard_id, tag_id, created_at)
    SELECT f.id, dt.tag_id, NOW()
    FROM flashcards f
    JOIN deck_tags dt ON f.deck_id = dt.deck_id
    WHERE f.deleted_at IS NULL
""")
cnx.commit()
print("Successfully populated flashcard_tags inherited from deck_tags!")

print("\n=== 4. SEEDING 42 ACHIEVEMENTS ===")
achievements_seed = [
    # Start / Getting Started
    ("FIRST_LOGIN", "Chào mừng đến với LeLa", "Đăng nhập và bắt đầu hành trình học từ vựng TOEIC.", "👋", "START", "FIRST_LOGIN", 1, 25),
    ("FIRST_CARD", "Lá bài đầu tiên", "Ôn tập thẻ từ vựng đầu tiên của bạn.", "🎴", "FLASHCARDS", "FIRST_CARD", 1, 25),
    ("FIRST_DECK", "Bộ thẻ đầu tiên", "Ghi danh và học bộ thẻ từ vựng đầu tiên.", "📚", "DECK", "FIRST_DECK", 1, 25),
    ("FIRST_QUIZ", "Bài kiểm tra đầu tiên", "Hoàn thành 1 bài kiểm tra từ vựng.", "📝", "QUIZ", "FIRST_QUIZ", 1, 25),
    ("FIRST_PERFECT_QUIZ", "Điểm tuyệt đối đầu tiên", "Đạt điểm 100% trong một bài kiểm tra.", "🎯", "QUIZ", "FIRST_PERFECT_QUIZ", 1, 50),
    
    # Streak (Preserving existing codes)
    ("STREAK_3_DAYS", "Ba ngày nhiệt huyết", "Duy trì chuỗi học tập trong 3 ngày liên tiếp.", "🔥", "STREAK", "STREAK", 3, 50),
    ("STREAK_7_DAYS", "Một tuần nỗ lực", "Duy trì chuỗi học tập trong 7 ngày liên tiếp.", "🔥", "STREAK", "STREAK", 7, 100),
    ("STREAK_14_DAYS", "Hai tuần kiên trì", "Duy trì chuỗi học tập trong 14 ngày liên tiếp.", "🔥", "STREAK", "STREAK", 14, 150),
    ("STREAK_30_DAYS", "Một tháng chuyên cần", "Duy trì chuỗi học tập trong 30 ngày liên tiếp.", "🏆", "STREAK", "STREAK", 30, 300),
    ("STREAK_60_DAYS", "Hai tháng bền bỉ", "Duy trì chuỗi học tập trong 60 ngày liên tiếp.", "💎", "STREAK", "STREAK", 60, 500),
    ("STREAK_100_DAYS", "Bách nhật học giả", "Duy trì chuỗi học tập trong 100 ngày liên tiếp.", "👑", "STREAK", "STREAK", 100, 800),
    ("STREAK_365_DAYS", "Huyền thoại 365 ngày", "Duy trì chuỗi học tập tròn 1 năm liên tiếp.", "🌟", "STREAK", "STREAK", 365, 2000),
    
    # Flashcard / Vocabulary
    ("CARDS_10", "10 từ đầu tiên", "Ôn tập tích lũy 10 thẻ từ vựng.", "🌱", "FLASHCARDS", "CARDS_REVIEWED", 10, 25),
    ("CARDS_50", "Người học chăm chỉ", "Ôn tập tích lũy 50 thẻ từ vựng.", "🌿", "FLASHCARDS", "CARDS_REVIEWED", 50, 50),
    ("CARDS_100", "Bộ nhớ tốt", "Ôn tập tích lũy 100 thẻ từ vựng.", "🌳", "FLASHCARDS", "CARDS_REVIEWED", 100, 100),
    ("CARDS_250", "Thợ săn từ vựng", "Ôn tập tích lũy 250 thẻ từ vựng.", "🎯", "FLASHCARDS", "CARDS_REVIEWED", 250, 150),
    ("CARDS_500", "Kho từ vựng phong phú", "Ôn tập tích lũy 500 thẻ từ vựng.", "📖", "FLASHCARDS", "CARDS_REVIEWED", 500, 250),
    ("CARDS_1000", "Chuyên gia nhớ từ", "Ôn tập tích lũy 1,000 thẻ từ vựng.", "🧠", "FLASHCARDS", "CARDS_REVIEWED", 1000, 400),
    ("CARDS_2500", "Đại sứ từ vựng", "Ôn tập tích lũy 2,500 thẻ từ vựng.", "🎖️", "FLASHCARDS", "CARDS_REVIEWED", 2500, 750),
    ("CARDS_5000", "Bậc thầy ngôn ngữ", "Ôn tập tích lũy 5,000 thẻ từ vựng.", "👑", "FLASHCARDS", "CARDS_REVIEWED", 5000, 1500),
    
    # Decks
    ("DECKS_1", "Người mới bắt đầu", "Học xong ít nhất 1 bộ thẻ.", "📘", "DECK", "DECKS_LEARNED", 1, 50),
    ("DECKS_3", "Nhà sưu tập bộ thẻ", "Học xong 3 bộ thẻ từ vựng.", "📙", "DECK", "DECKS_LEARNED", 3, 75),
    ("DECKS_5", "Nhà thám hiểm kiến thức", "Học xong 5 bộ thẻ từ vựng.", "📗", "DECK", "DECKS_LEARNED", 5, 100),
    ("DECKS_10", "Chinh phục 10 bộ thẻ", "Học xong 10 bộ thẻ từ vựng.", "🎓", "DECK", "DECKS_LEARNED", 10, 200),
    ("DECKS_25", "Bậc thầy ôn tập", "Học xong 25 bộ thẻ từ vựng.", "🎖️", "DECK", "DECKS_LEARNED", 25, 400),
    ("DECKS_50", "Đại cao thủ bộ thẻ", "Học xong 50 bộ thẻ từ vựng.", "🏆", "DECK", "DECKS_LEARNED", 50, 800),
    
    # Quiz Performance
    ("QUIZ_PASS_5", "Vượt qua 5 thử thách", "Đạt kết quả PASS ở 5 bài kiểm tra.", "✅", "QUIZ", "QUIZ_PASS", 5, 75),
    ("QUIZ_PASS_10", "Chinh phục 10 bài test", "Đạt kết quả PASS ở 10 bài kiểm tra.", "🥈", "QUIZ", "QUIZ_PASS", 10, 150),
    ("QUIZ_PASS_25", "Bậc thầy bài kiểm tra", "Đạt kết quả PASS ở 25 bài kiểm tra.", "🥇", "QUIZ", "QUIZ_PASS", 25, 300),
    ("QUIZ_PERFECT_5", "Cú đúp 100%", "Đạt điểm tuyệt đối 100% trong 5 bài kiểm tra.", "⭐", "QUIZ", "QUIZ_PERFECT", 5, 200),
    ("QUIZ_PERFECT_10", "Thần đồng trắc nghiệm", "Đạt điểm tuyệt đối 100% trong 10 bài kiểm tra.", "🌟", "QUIZ", "QUIZ_PERFECT", 10, 400),
    
    # TOEIC Levels
    ("TOEIC_500", "Nền tảng 500 TOEIC", "Đạt trình độ TOEIC Cơ bản (Dưới 500).", "🥉", "TOEIC", "TOEIC_LEVEL", 1, 150),
    ("TOEIC_700", "Bứt phá 700 TOEIC", "Đạt trình độ TOEIC 500 - 700.", "🥈", "TOEIC", "TOEIC_LEVEL", 2, 300),
    ("TOEIC_850", "Làm chủ 850 TOEIC", "Đạt trình độ TOEIC 700 - 850.", "🥇", "TOEIC", "TOEIC_LEVEL", 3, 600),
    ("TOEIC_990", "Đỉnh cao 990 TOEIC", "Đạt trình độ xuất sắc TOEIC 850 - 990.", "👑", "TOEIC", "TOEIC_LEVEL", 4, 1200),
    
    # Topic & Mastery
    ("TOPIC_BUSINESS", "Chuyên gia Business", "Hoàn thành 3 bộ thẻ thuộc chủ đề Business & Office.", "💼", "TOPIC", "TOPIC_DECKS", 3, 150),
    ("TOPIC_TRAVEL", "Chuyên gia Du lịch", "Hoàn thành 3 bộ thẻ thuộc chủ đề Travel & Hotels.", "✈️", "TOPIC", "TOPIC_DECKS", 3, 150),
    ("TOPIC_TECH", "Chuyên gia Công nghệ", "Hoàn thành 3 bộ thẻ thuộc chủ đề Technology & Computers.", "💻", "TOPIC", "TOPIC_DECKS", 3, 150),
    ("TOPIC_FINANCE", "Chuyên gia Tài chính", "Hoàn thành 3 bộ thẻ thuộc chủ đề Finance & Accounting.", "📊", "TOPIC", "TOPIC_DECKS", 3, 150),
    ("POLYGLOT_MIND", "Đa dạng chủ đề", "Hoàn thành các bộ thẻ thuộc ít nhất 5 chủ đề khác nhau.", "🌐", "MASTERY", "TOPICS_MASTERED", 5, 250),
    ("XP_1000", "Thợ săn điểm số", "Đạt tổng cộng 1,000 XP.", "🎯", "MASTERY", "XP", 1000, 200),
    ("XP_5000", "Đại gia XP", "Đạt tổng cộng 5,000 XP.", "💰", "MASTERY", "XP", 5000, 500)
]

for code, title, desc, icon, cat, ctype, cval, xp in achievements_seed:
    cur.execute("SELECT id FROM achievements WHERE code = %s", (code,))
    row = cur.fetchone()
    if row:
        cur.execute("""
            UPDATE achievements 
            SET title=%s, description=%s, icon_url=%s, category=%s, condition_type=%s, condition_value=%s, xp_reward=%s, is_active=1, updated_at=NOW()
            WHERE id=%s
        """, (title, desc, icon, cat, ctype, cval, xp, row['id']))
    else:
        cur.execute("""
            INSERT INTO achievements (code, title, description, icon_url, category, condition_type, condition_value, xp_reward, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, NOW(), NOW())
        """, (code, title, desc, icon, cat, ctype, cval, xp))

cnx.commit()
print(f"Seeded/Updated {len(achievements_seed)} Achievements successfully!")

cur.close()
cnx.close()
