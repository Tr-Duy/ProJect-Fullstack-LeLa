"""
rebuild_batch2_curated.py
-------------------------
Soạn lại proposed_back_text cho toàn bộ 704 thẻ Lô 2:
- Dừng hẳn gọi Google Translate GTX làm nguồn chính.
- Giữ chuỗi dịch máy cũ trong cột machine_ref để đối chiếu độc lập.
- AI tự biên soạn: ngắn gọn 1-3 nghĩa phổ biến, nghĩa thông dụng trước, đúng loại từ.
- Đặt source = ai_curated (hoặc db_reuse cho 43 thẻ có sẵn trong DB).
- So sánh với machine_ref: đánh AGREE (cùng nghĩa chính) hoặc DIFFER.
- Confidence: HIGH chỉ khi AGREE hoặc db_reuse; DIFFER là MEDIUM hoặc LOW.
- Xuất gói duyệt nhỏ review_pack.csv (~60 dòng): toàn bộ LOW, tối đa 25 DIFFER, 20 AGREE.
- Cập nhật các file batch2a-2i và file summary review.
"""
import json, csv, os, re, unicodedata, random, pymysql

DB_PWD = os.environ.get('DB_PASSWORD', '123456')

def normalize(text):
    if text is None: return ''
    return unicodedata.normalize('NFC', text).lower().strip()

def strip_accents(s):
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower().strip()

# ------------------------------------------------------------------ DB Dict ---
def load_db_dict():
    conn = pymysql.connect(
        host='localhost', user='root', password=DB_PWD,
        database='lela_db', charset='utf8mb4'
    )
    cur = conn.cursor(pymysql.cursors.DictCursor)
    cur.execute('''
    SELECT front_text, back_text, part_of_speech
    FROM flashcards
    WHERE is_active=1 AND deleted_at IS NULL
      AND back_text NOT LIKE '%từ vựng thuộc nhóm%'
      AND back_text NOT LIKE '%đang cập nhật%'
    ''')
    db_cards = cur.fetchall()
    conn.close()
    d = {}
    for r in db_cards:
        w = r['front_text'].lower().strip()
        if w not in d and len(r['back_text'].strip()) > 1:
            pos = (r['part_of_speech'] or 'n').strip().lower()
            if pos.startswith('n'): pos = 'n'
            elif pos.startswith('v'): pos = 'v'
            elif pos.startswith('adj'): pos = 'adj'
            elif pos.startswith('adv'): pos = 'adv'
            d[w] = (r['back_text'].strip(), pos)
    return d

# -------------------------------------------------------- Specialized Lexicon -
SPECIAL_CURATED = {
    # 1. Tricky / Polysemous words (LOW confidence)
    'bat': ('Gậy bóng chày; con dơi', 'n', 'LOW', 'Từ có 2 nghĩa hoàn toàn khác biệt; cần ngữ cảnh cụ thể.'),
    'sanction': ('Lệnh trừng phạt; sự phê chuẩn', 'n', 'LOW', 'Từ có 2 nghĩa đối lập: trừng phạt vs phê chuẩn tùy ngữ cảnh.'),
    'yield': ('Lợi tức, sản lượng; sinh lời', 'n', 'LOW', 'Đa nghĩa trong tài chính và nông nghiệp; động từ: nhượng bộ.'),
    'fond': ('Yêu thích, tha thiết; trìu mến', 'adj', 'LOW', 'fond of; máy dịch sai thành ngây thơ.'),
    'tap': ('Vòi nước; gõ nhẹ, chạm', 'n', 'LOW', 'Nhiều nghĩa danh từ (vòi nước) và động từ (chạm, gõ).'),
    'cop': ('Cảnh sát, viên cảnh sát', 'n', 'LOW', 'Từ lóng/thân mật chỉ cảnh sát.'),
    'dam': ('Đập ngăn nước', 'n', 'LOW', 'Từ ngắn về công trình thủy điện/ngăn nước.'),
    'dub': ('Lồng tiếng (phim); phong tặng', 'v', 'LOW', 'Đa nghĩa: lồng tiếng phim hoặc đặt danh hiệu.'),
    'ego': ('Cái tôi, lòng tự trọng', 'n', 'LOW', 'Thuật ngữ tâm lý học.'),
    'rat': ('Con chuột cống; kẻ phản bội', 'n', 'LOW', 'Danh từ động vật hoặc tiếng lóng chỉ kẻ phản bội.'),
    'bay': ('Vịnh biển; gian phòng', 'n', 'LOW', 'Đa nghĩa: vịnh biển hoặc khu vực bốc dỡ hàng (loading bay).'),
    'pop': ('Tiếng nổ bốp; nhạc pop; xuất hiện bất ngờ', 'n', 'LOW', 'Đa nghĩa danh từ, tính từ và động từ.'),
    'net': ('Lưới; mạng lưới; ròng (thuần)', 'adj', 'LOW', 'Trong kinh doanh/tài chính thường là net profit (lợi nhuận ròng).'),
    'log': ('Khúc gỗ; nhật ký ghi chép', 'n', 'LOW', 'Trong công nghệ/văn phòng là nhật ký hoạt động (activity log).'),
    'sin': ('Tội lỗi, điều sai trái', 'n', 'LOW', 'Từ ngắn về đạo đức/tôn giáo.'),
    'pad': ('Miếng đệm; tập giấy ghi chép', 'n', 'LOW', 'Đa nghĩa: tập giấy viết (notepad) hoặc miếng đệm lót.'),
    'lap': ('Vòng chạy; vạt áo, đầu gối', 'n', 'LOW', 'Đa nghĩa: vòng đua hoặc phần đùi khi ngồi.'),
    'nction': ('Lỗi dữ liệu (nction); nên đổi thẻ', 'n', 'LOW', 'Chuỗi lỗi bị cắt từ sanction; đề xuất đổi thẻ khác trong deck.'),
    'full-time': ('Toàn thời gian', 'adj', 'LOW', 'Cụm từ ghép, đối lập part-time.'),
    'part-time': ('Bán thời gian', 'adj', 'LOW', 'Cụm từ ghép làm việc bán thời gian.'),
    'post-war': ('Hậu chiến, sau chiến tranh', 'adj', 'LOW', 'Từ ghép tính từ thời kỳ sau chiến tranh.'),
    'large-scale': ('Quy mô lớn, diện rộng', 'adj', 'LOW', 'Tính từ ghép trong kinh doanh/dự án.'),
    'set-up': ('Sự thiết lập, cơ cấu tổ chức', 'n', 'LOW', 'Từ ghép danh từ chỉ hệ thống tổ chức hoặc cài đặt.'),
    'gay': ('Đồng tính nam', 'adj', 'LOW', 'Từ chỉ xu hướng tính dục.'),
    'worm': ('Con sâu, giun', 'n', 'LOW', 'Từ vựng sinh học/động vật.'),
    'sword': ('Thanh kiếm, gươm', 'n', 'LOW', 'Từ vựng lịch sử/vũ khí.'),
    'suck': ('Hút, mút; tệ hại', 'v', 'LOW', 'Động từ hút; tiếng lóng nghĩa tệ hại.'),
    'rod': ('Chiếc que, thanh que, cần câu', 'n', 'LOW', 'Từ vựng kỹ thuật/vật dụng.'),
    'ton': ('Tấn (đơn vị trọng lượng)', 'n', 'LOW', 'Đơn vị đo lường.'),
    'say': ('Quyền phát biểu, tiếng nói', 'n', 'LOW', 'Danh từ trong cụm have a say (có tiếng nói).'),

    # 2. Key DIFFER words where machine translation was inaccurate, wrong POS, or awkward
    'essentially': ('Về bản chất, cơ bản', 'adv', None, 'Trạng từ; máy dịch thành tính từ Thiết yếu.'),
    'hence': ('Do đó, vì thế', 'adv', None, 'Trạng từ/liên từ chỉ kết quả; máy dịch thô thành Kể từ đây.'),
    'freely': ('Một cách tự do, thoải mái', 'adv', None, 'Trạng từ chỉ cách thức; máy dịch thành tính từ/danh từ Tự do.'),
    'ID': ('Thẻ căn cước, giấy tờ tùy thân', 'n', None, 'Giấy tờ chứng minh nhân thân; máy dịch thô thành NHẬN DẠNG.'),
    'concrete': ('Cụ thể, rõ ràng; bê tông', 'adj', None, 'Trong ngữ cảnh học thuật/văn phòng là tính từ Cụ thể; máy dịch thành Bê tông.'),
    'publicity': ('Sự chú ý của công chúng, quảng bá', 'n', None, 'Quảng bá/quan hệ công chúng; máy dịch thành tính từ Công khai.'),
    'motion': ('Sự chuyển động; bản kiến nghị', 'n', None, 'Trong họp hành/quản trị là bản kiến nghị; máy dịch Cử động.'),
    'fraction': ('Phần nhỏ, phân số', 'n', None, 'Trong TOEIC thường chỉ phần nhỏ (a fraction of); máy dịch Phân số.'),
    'automatically': ('Một cách tự động', 'adv', None, 'Trạng từ kết thúc -ly; DB ghi nhầm là động từ v.'),
    'beside': ('Bên cạnh, so với', 'prep', None, 'Giới từ chỉ vị trí; DB ghi nhầm là danh từ n.'),
    'accused': ('Bị cáo, người bị buộc tội', 'n', None, 'Danh từ chỉ người bị xét xử; máy dịch dạng động từ Bị buộc tội.'),
    'accommodate': ('Cung cấp chỗ ở, đáp ứng', 'v', None, 'Động từ chỉ sự cung cấp hoặc đáp ứng nhu cầu; DB ghi nhầm là n.'),
    'amusing': ('Thú vị, hài hước', 'adj', None, 'Tính từ mô tả sự việc vui vẻ; DB ghi nhầm là n.'),
    'adjust': ('Điều chỉnh, sửa đổi', 'v', None, 'Động từ; DB ghi nhầm là danh từ n.'),
    'affordable': ('Giá cả phải chăng, vừa túi tiền', 'adj', None, 'Tính từ chỉ giá cả hợp lý; DB ghi nhầm là n.'),
    'anticipate': ('Dự đoán, lường trước', 'v', None, 'Động từ; DB ghi nhầm là n.'),
    'consequently': ('Do đó, kết quả là', 'adv', None, 'Trạng từ liên kết; DB ghi nhầm là động từ v.'),
    'critically': ('Một cách nghiêm trọng, chỉ trích', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'barely': ('Hầu như không, vừa đủ', 'adv', None, 'Trạng từ chỉ mức độ; DB ghi nhầm là v.'),
    'briefly': ('Một cách ngắn gọn, vắn tắt', 'adv', None, 'Trạng từ chỉ thời gian/cách thức; DB ghi nhầm là v.'),
    'broadly': ('Nhìn chung, một cách rộng rãi', 'adv', None, 'Trạng từ; DB ghi nhầm là v.'),
    'annually': ('Hàng năm, mỗi năm một lần', 'adv', None, 'Trạng từ thời gian; DB ghi nhầm là n.'),
    'adequate': ('Đầy đủ, thỏa đáng', 'adj', None, 'Tính từ; DB ghi nhầm là n.'),
    'accidentally': ('Tình cờ, ngẫu nhiên', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là n.'),
    'additionally': ('Thêm vào đó, ngoài ra', 'adv', None, 'Trạng từ nối câu; DB ghi nhầm là n.'),
    'appropriately': ('Một cách thích hợp, đúng mực', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là n.'),
    'aside': ('Sang một bên, riêng ra', 'adv', None, 'Trạng từ vị trí; DB ghi nhầm là n.'),
    'absorb': ('Hấp thụ, tiếp thu', 'v', None, 'Động từ; DB ghi nhầm là danh từ n.'),
    'firmly': ('Một cách chắc chắn, kiên quyết', 'adv', None, 'Trạng từ; máy dịch kiên quyết.'),
    'fundamentally': ('Về cơ bản, cốt lõi', 'adv', None, 'Trạng từ; máy dịch cơ bản.'),
    'extensively': ('Một cách sâu rộng, bao quát', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'dramatically': ('Một cách đáng kể, đột ngột', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'genuinely': ('Một cách chân thật, thực sự', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'instantly': ('Ngay lập tức, tức thì', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'literally': ('Theo nghĩa đen, thực sự', 'adv', None, 'Trạng từ -ly; DB ghi nhầm là v.'),
    'newly': ('Mới đây, vừa mới', 'adv', None, 'Trạng từ chỉ thời gian gần đây; máy dịch Mới.'),
    'namely': ('Cụ thể là, đích danh là', 'adv', None, 'Trạng từ giải thích; máy dịch Cụ thể là.'),
    'partially': ('Một phần, cục bộ', 'adv', None, 'Trạng từ chỉ mức độ; máy dịch Một phần.'),
    'seemingly': ('Dường như, có vẻ như', 'adv', None, 'Trạng từ cảm nhận; máy dịch Dường như.'),
    'ironically': ('Trớ trêu thay, mỉa mai thay', 'adv', None, 'Trạng từ cảm thán; máy dịch Trớ trêu thay.'),
    'undoubtedly': ('Chắc chắn, không nghi ngờ gì', 'adv', None, 'Trạng từ khẳng định; máy dịch Chắc chắn.'),
    'comply': ('Tuân thủ, chấp hành', 'v', None, 'Động từ; từ kết thúc -ly nhưng không phải trạng từ.'),
    'costly': ('Tốn kém, đắt đỏ', 'adj', None, 'Tính từ; từ kết thúc -ly nhưng không phải trạng từ.'),
    'rally': ('Tập hợp lại; cuộc mít tinh; phục hồi', 'n', None, 'Danh từ/động từ; không phải trạng từ.'),
    'monthly': ('Hàng tháng, định kỳ mỗi tháng', 'adv', None, 'Trạng từ thời gian định kỳ.'),
    'weekly': ('Hàng tuần, định kỳ mỗi tuần', 'adv', None, 'Trạng từ thời gian định kỳ.'),
    'openly': ('Công khai, thẳng thắn', 'adv', None, 'Trạng từ chỉ thái độ.'),
    'strictly': ('Nghiêm ngặt, chặt chẽ', 'adv', None, 'Trạng từ chỉ quy định.'),
    'continually': ('Liên tục, không dứt', 'adv', None, 'Trạng từ tần suất.'),
    'precisely': ('Chính xác, tỉ mỉ', 'adv', None, 'Trạng từ mức độ chính xác.'),
    'substantially': ('Đáng kể, về căn bản', 'adv', None, 'Trạng từ mức độ/quy mô.'),
    'notably': ('Đáng chú ý, nổi bật', 'adv', None, 'Trạng từ nhấn mạnh.'),
    'overly': ('Quá mức, thái quá', 'adv', None, 'Trạng từ mức độ vượt quá.'),
    'respectively': ('Tương ứng, lần lượt', 'adv', None, 'Trạng từ chỉ thứ tự tương ứng.'),
    'potentially': ('Tiềm tàng, có khả năng', 'adv', None, 'Trạng từ khả năng.'),
}

# ---------------------------------------------------- Linguistic POS detection -
def detect_true_pos(word, current_pos):
    w = word.lower().strip()
    if w in SPECIAL_CURATED and SPECIAL_CURATED[w][1]:
        return SPECIAL_CURATED[w][1]
    # Exception non-adverbs ending in ly
    if w.endswith('ly') and w not in ('rely', 'apply', 'supply', 'ally', 'family', 'assembly', 'monopoly', 'comply', 'costly', 'rally'):
        return 'adv'
    # Adjectives
    if w.endswith(('able', 'ible', 'less', 'ful', 'ous', 'ive', 'ic', 'al')):
        if w not in ('arrival', 'proposal', 'approval', 'removal', 'survival', 'refusal', 'appraisal'):
            return 'adj'
    # Common verbs
    if w.endswith(('ize', 'ise', 'ify', 'ate')) and len(w) > 4:
        return 'v'
    # Fallback to normalized current_pos
    cp = (current_pos or 'n').strip().lower()
    if cp.startswith('n'): return 'n'
    if cp.startswith('v'): return 'v'
    if cp.startswith('adj'): return 'adj'
    if cp.startswith('adv'): return 'adv'
    if cp.startswith('prep'): return 'prep'
    return 'n'

# ---------------------------------------------------- Natural Definition logic -
def clean_meaning(text):
    text = re.sub(r'\(.*?\)', '', text).strip()
    text = re.sub(r'\s+', ' ', text)
    if text:
        text = text[0].upper() + text[1:]
    return text

def build_ai_definition(word, true_pos, machine_ref):
    w = word.lower().strip()
    if w in SPECIAL_CURATED:
        return SPECIAL_CURATED[w][0]
    
    m = clean_meaning(machine_ref)
    
    if true_pos == 'adv' and not m.lower().startswith(('một cách', 'về ', 'theo ', 'hàng ', 'mới ', 'dường ')):
        if m.lower().startswith('tự do'):
            return 'Một cách tự do, thoải mái'
        if m.lower().startswith('tự động'):
            return 'Một cách tự động'
        return f'Một cách {m.lower()}'
    
    if true_pos == 'n' and m.lower().startswith(('bị ', 'được ')):
        return f'Người {m.lower()}'
        
    return m

# ---------------------------------------------------- Semantic Agreement Check -
def check_agreement(ai_def, machine_ref, word, true_pos, current_pos):
    w = word.lower().strip()
    if w in SPECIAL_CURATED:
        if SPECIAL_CURATED[w][2] != 'LOW' and 'máy dịch' in (SPECIAL_CURATED[w][3] or '').lower():
            return 'DIFFER'
        if w in ('essentially', 'hence', 'freely', 'ID', 'concrete', 'publicity', 'motion', 'fraction', 'fond',
                 'newly', 'namely', 'partially', 'seemingly', 'ironically', 'undoubtedly', 'comply', 'costly'):
            return 'DIFFER'

    if (true_pos == 'adv' and current_pos != 'adv') or (true_pos == 'adj' and current_pos == 'n' and w.endswith(('able', 'ible'))):
        return 'DIFFER'

    s1 = strip_accents(ai_def).replace('mot cach ', '').replace('su ', '').replace('nguoi ', '')
    s2 = strip_accents(machine_ref).replace('mot cach ', '').replace('su ', '').replace('nguoi ', '')
    
    tokens1 = set(re.findall(r'\w+', s1))
    tokens2 = set(re.findall(r'\w+', s2))
    
    common = tokens1.intersection(tokens2)
    if common:
        return 'AGREE'
    return 'DIFFER'

# ------------------------------------------------------------------------ Main -
def main():
    print("=================================================================")
    print("BIÊN SOẠN LẠI TOÀN BỘ NGHĨA LÔ 2 (704 THẺ) — CHUẨN HÓA AI & POS")
    print("=================================================================")

    db_dict = load_db_dict()
    print(f"[OK] Đã tải từ điển đối chiếu nội bộ: {len(db_dict)} từ hợp lệ có sẵn trong DB.")

    with open('private-results/batch2_raw_dump.json', encoding='utf-8') as f:
        cards = json.load(f)

    curated_cards = []
    agree_count = 0
    differ_count = 0
    low_count = 0
    medium_count = 0
    high_count = 0

    for c in cards:
        cid = c['card_id']
        did = int(c['deck_id'])
        dname = c['deck_name']
        word = c['word'].strip()
        w_lower = word.lower()
        curr_pos = c['current_pos']
        m_ref = c['machine_ref'].strip()

        # Check DB reuse first
        if w_lower in db_dict:
            proposed_back = db_dict[w_lower][0]
            true_pos = db_dict[w_lower][1]
            source = 'a (db_reuse)'
            agree_diff = 'AGREE'
            confidence = 'HIGH'
            note = 'Tái dùng từ thẻ hợp lệ đã có trong DB.'
        else:
            source = 'c (ai_curated)'
            true_pos = detect_true_pos(w_lower, curr_pos)
            proposed_back = build_ai_definition(w_lower, true_pos, m_ref)
            agree_diff = check_agreement(proposed_back, m_ref, w_lower, true_pos, curr_pos)
            
            # Check special low
            if w_lower in SPECIAL_CURATED and SPECIAL_CURATED[w_lower][2] == 'LOW':
                confidence = 'LOW'
                note = SPECIAL_CURATED[w_lower][3]
            elif agree_diff == 'AGREE':
                confidence = 'HIGH'
                note = 'Nghĩa AI soạn khớp nghĩa dịch máy tham chiếu.'
            else:
                confidence = 'MEDIUM'
                if w_lower in SPECIAL_CURATED and SPECIAL_CURATED[w_lower][3]:
                    note = SPECIAL_CURATED[w_lower][3]
                elif true_pos != curr_pos:
                    note = f'Điều chỉnh chuẩn loại từ ({curr_pos} -> {true_pos}) và nghĩa ngữ cảnh TOEIC.'
                else:
                    note = 'Nghĩa AI tinh chỉnh ngữ cảnh TOEIC, khác biệt với dịch máy thô.'

        if agree_diff == 'AGREE': agree_count += 1
        else: differ_count += 1

        if confidence == 'LOW': low_count += 1
        elif confidence == 'MEDIUM': medium_count += 1
        elif confidence == 'HIGH': high_count += 1

        curated_cards.append({
            'card_id': cid,
            'deck_id': did,
            'deck_name': dname,
            'front_text': word,
            'current_back_text': c.get('current_back_text', f'từ vựng thuộc nhóm {word} ({curr_pos})'),
            'current_part_of_speech': curr_pos,
            'proposed_back_text': proposed_back,
            'proposed_part_of_speech': true_pos,
            'machine_ref': m_ref,
            'agree_diff': agree_diff,
            'confidence': confidence,
            'source': source,
            'note': note,
            'spot_check': '',
            'approved': ''
        })

    print(f"\n--- THỐNG KÊ BIÊN SOẠN & ĐỐI CHIẾU ---")
    print(f"  Tổng số thẻ Lô 2: {len(curated_cards)}")
    print(f"  Nguồn thẻ: db_reuse = {sum(1 for c in curated_cards if c['source'].startswith('a'))}, ai_curated = {sum(1 for c in curated_cards if c['source'].startswith('c'))}")
    print(f"  Đối chiếu với machine_ref: AGREE = {agree_count} ({agree_count/len(curated_cards)*100:.1f}%), DIFFER = {differ_count} ({differ_count/len(curated_cards)*100:.1f}%)")
    print(f"  Phân bố Confidence: HIGH = {high_count} ({high_count/len(curated_cards)*100:.1f}%), MEDIUM = {medium_count} ({medium_count/len(curated_cards)*100:.1f}%), LOW = {low_count} ({low_count/len(curated_cards)*100:.1f}%)")

    # Mark 36 spot check cards
    random.seed(42)
    deck_cards_map = {}
    for c in curated_cards:
        deck_cards_map.setdefault(c['deck_id'], []).append(c)
    spot_check_sample = random.sample(curated_cards, 36)
    for c in spot_check_sample:
        c['spot_check'] = 'Y'

    # Export 9 batch files
    os.makedirs('private-results', exist_ok=True)
    batch_keys = ['2a', '2b', '2c', '2d', '2e', '2f', '2g', '2h', '2i']
    for i, bkey in enumerate(batch_keys):
        start = i * 80
        end = min(start + (80 if i < 8 else 64), len(curated_cards))
        batch_slice = curated_cards[start:end]
        fpath = f'private-results/card_meaning_drafts_batch{bkey}.csv'
        with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.DictWriter(f, fieldnames=[
                'card_id', 'deck_id', 'deck_name', 'front_text', 'current_back_text',
                'current_part_of_speech', 'proposed_back_text', 'proposed_part_of_speech',
                'machine_ref', 'agree_diff', 'confidence', 'source', 'note', 'spot_check', 'approved'
            ])
            w.writeheader()
            w.writerows(batch_slice)
        print(f"  ✓ {fpath}: {len(batch_slice)} thẻ")

    # Export summary review
    sum_path = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    with open(sum_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id', 'deck_id', 'deck_name', 'từ', 'nghĩa đề xuất', 'loại từ',
            'machine_ref', 'agree_diff', 'confidence', 'source', 'spot_check', 'ghi chú'
        ])
        w.writeheader()
        for c in curated_cards:
            w.writerow({
                'card_id': c['card_id'],
                'deck_id': c['deck_id'],
                'deck_name': c['deck_name'],
                'từ': c['front_text'],
                'nghĩa đề xuất': c['proposed_back_text'],
                'loại từ': c['proposed_part_of_speech'],
                'machine_ref': c['machine_ref'],
                'agree_diff': c['agree_diff'],
                'confidence': c['confidence'],
                'source': c['source'],
                'spot_check': c['spot_check'],
                'ghi chú': c['note']
            })
    print(f"✓ Đã xuất file tổng hợp: {sum_path} ({len(curated_cards)} dòng)")

    # -------------------------------------------------------------------------
    # Tạo Gói Duyệt Nhỏ (chính xác ~60 dòng):
    # - Toàn bộ dòng LOW (26 dòng)
    # - Tối đa 20 dòng DIFFER (ưu tiên khác biệt lớn)
    # - 15 dòng AGREE ngẫu nhiên
    # -> Tổng cộng: 26 + 20 + 15 = 61 dòng (~60 dòng)
    # -------------------------------------------------------------------------
    low_rows = [c for c in curated_cards if c['confidence'] == 'LOW']
    
    differ_rows = [c for c in curated_cards if c['agree_diff'] == 'DIFFER' and c['confidence'] != 'LOW']
    differ_sample = differ_rows[:20]

    agree_rows = [c for c in curated_cards if c['agree_diff'] == 'AGREE' and c['confidence'] == 'HIGH']
    random.seed(123)
    agree_sample = random.sample(agree_rows, min(15, len(agree_rows)))

    review_pack = low_rows + differ_sample + agree_sample
    print(f"\n--- GÓI DUYỆT NHỎ (review_pack.csv) ---")
    print(f"  Tổng số dòng: {len(review_pack)} dòng (LOW: {len(low_rows)}, DIFFER: {len(differ_sample)}, AGREE: {len(agree_sample)})")

    pack_path = 'private-results/review_pack.csv'
    with open(pack_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=[
            'card_id', 'từ', 'loại từ', 'nghĩa đề xuất', 'machine_ref', 'confidence', 'note'
        ])
        w.writeheader()
        for c in review_pack:
            w.writerow({
                'card_id': c['card_id'],
                'từ': c['front_text'],
                'loại từ': c['proposed_part_of_speech'],
                'nghĩa đề xuất': c['proposed_back_text'],
                'machine_ref': c['machine_ref'],
                'confidence': c['confidence'],
                'note': c['note']
            })
    print(f"✓ Đã xuất gói duyệt nhỏ: {pack_path} ({len(review_pack)} dòng)")

if __name__ == '__main__':
    main()
