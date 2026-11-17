"""
generate_batch2_drafts.py
-------------------------
Soạn BẢN NHÁP Lô 2 cho 88 bộ TOEIC Oxford có 0 thẻ hợp lệ (8 thẻ/bộ = 704 thẻ).
Nguồn nghĩa (cột source):
  - a (db_reuse): Tái dùng nghĩa của thẻ đã hợp lệ trong DB (confidence: HIGH)
  - c (ai_curated): AI tự biên soạn chuyên môn TOEIC (confidence: HIGH/MEDIUM/LOW)
  - b (Google Translate GTX): Dịch qua dịch vụ công khai (confidence: MEDIUM trở xuống theo yêu cầu)

Xuất ra:
  1. 9 file nhỏ: private-results/card_meaning_drafts_batch2a.csv -> batch2i.csv
  2. 1 file tổng hợp review: private-results/card_meaning_drafts_batch2_summary_review.csv
  3. 1 gói duyệt nhanh: private-results/review_pack.csv
     (gồm 36 dòng spot_check, toàn bộ dòng MEDIUM/LOW, và 10 dòng HIGH ngẫu nhiên, sắp xếp theo confidence)
"""
import pymysql, os, re, unicodedata, random, json, csv, time
from concurrent.futures import ThreadPoolExecutor
import urllib.request, urllib.parse

DB_PWD = os.environ.get('DB_PASSWORD')

# ---------------------------------------------------------------- Curated dict
CURATED = {
    'disabled': ('Vô hiệu hóa; người khuyết tật', 'adj', 'MEDIUM', 'Trong ngữ cảnh Office/Tech thường là vô hiệu hóa; trong xã hội là người khuyết tật.'),
    'extension': ('Số máy nhánh; sự gia hạn', 'n', 'HIGH', 'Nghĩa số máy nhánh rất phổ biến trong TOEIC Office & Admin.'),
    'fabric': ('Vải, chất liệu vải; kết cấu', 'n', 'HIGH', 'Danh từ chỉ vật liệu may mặc hoặc kết cấu công trình.'),
    'fantasy': ('Ý tưởng viển vông; sự tưởng tượng', 'n', 'MEDIUM', 'Từ đa nghĩa, trong văn phòng ít dùng hơn văn học.'),
    'firmly': ('Một cách kiên quyết, vững chắc', 'adv', 'HIGH', 'Trạng từ đi kèm decide/state/believe trong công việc.'),
    'fundamentally': ('Về cơ bản, cốt lõi', 'adv', 'HIGH', 'Trạng từ học thuật/kinh doanh phổ biến.'),
    'erupt': ('Bùng nổ; phun trào', 'v', 'MEDIUM', 'Nghĩa bóng: bùng nổ xung đột; nghĩa đen: núi lửa phun.'),
    'elegant': ('Thanh lịch, trang nhã', 'adj', 'HIGH', 'Tính từ mô tả trang phục hoặc giải pháp thiết kế tinh tế.'),
    'evolve': ('Phát triển, tiến hóa', 'v', 'HIGH', 'Phổ biến trong TOEIC: chiến lược hoặc công nghệ phát triển.'),
    'extensive': ('Sâu rộng, trên quy mô lớn', 'adj', 'HIGH', 'extensive research, extensive experience.'),
    'failed': ('Thất bại, không thành công', 'adj', 'HIGH', 'Tính từ bổ nghĩa cho attempt, project, negotiation.'),
    'federal': ('Thuộc liên bang', 'adj', 'HIGH', 'federal law, federal agency trong bối cảnh quản trị/pháp luật.'),
    'fever': ('Cơn sốt; sự bồn chồn', 'n', 'HIGH', 'Từ vựng y tế và sức khỏe.'),
    'flavour': ('Hương vị, mùi vị đặc trưng', 'n', 'HIGH', 'Từ vựng thực phẩm và sản phẩm tiêu dùng.'),
    'forecast': ('Dự báo, sự dự đoán', 'n', 'HIGH', 'sales forecast, financial forecast trong TOEIC.'),
    'gene': ('Gen di truyền', 'n', 'HIGH', 'Từ vựng sinh học/khoa học sức khỏe.'),
    'expertise': ('Chuyên môn, sự tinh thông', 'n', 'HIGH', 'professional expertise, technical expertise.'),
    'extensively': ('Một cách sâu rộng, bao quát', 'adv', 'HIGH', 'travel extensively, study extensively.'),
    'framework': ('Khuôn khổ, cơ cấu', 'n', 'HIGH', 'legal framework, regulatory framework.'),
    'golden': ('Bằng vàng; quý giá, thuận lợi', 'adj', 'HIGH', 'golden opportunity trong kinh doanh.'),
    'gorgeous': ('Lộng lẫy, tuyệt đẹp', 'adj', 'HIGH', 'Mô tả cảnh quan hoặc sản phẩm du lịch.'),
    'homeless': ('Vô gia cư, không nơi nương tựa', 'adj', 'HIGH', 'Vấn đề xã hội và trách nhiệm cộng đồng.'),
    'identical': ('Y hệt, giống hệt nhau', 'adj', 'HIGH', 'identical results, identical products.'),
    'integrate': ('Tích hợp, hợp nhất', 'v', 'HIGH', 'integrate systems, integrate into market.'),
    'dominant': ('Thống trị, có ưu thế vượt trội', 'adj', 'HIGH', 'dominant market position, dominant player.'),
    'editorial': ('Bài xã luận; thuộc ban biên tập', 'n', 'HIGH', 'Xuất hiện trong TOEIC Part 7 bài đọc báo chí.'),
    'elementary': ('Cơ bản, sơ cấp', 'adj', 'HIGH', 'elementary level, elementary knowledge.'),
    'exposure': ('Sự tiếp xúc; sự quảng bá, hiện diện', 'n', 'HIGH', 'brand exposure, media exposure.'),
    'fake': ('Giả mạo; hàng giả', 'adj', 'HIGH', 'fake documents, fake products.'),
    'format': ('Định dạng, cách trình bày', 'n', 'HIGH', 'document format, file format.'),
    'formerly': ('Trước đây, thuở trước', 'adv', 'HIGH', 'formerly known as... trong hồ sơ công ty.'),
    'furious': ('Giận dữ, điên tiết', 'adj', 'HIGH', 'Tính từ cảm xúc trong phản hồi khách hàng.'),
    'entertaining': ('Mang tính giải trí, thú vị', 'adj', 'HIGH', 'entertaining speech, entertaining show.'),
    'exhibit': ('Triển lãm, trưng bày', 'v', 'HIGH', 'exhibit products at trade fair.'),
    'firefighter': ('Lính cứu hỏa', 'n', 'HIGH', 'Nghề nghiệp trong dịch vụ công cộng.'),
    'firm': ('Công ty, hãng; vững chắc', 'n', 'HIGH', 'accounting firm, law firm trong Finance/Law.'),
    'foundation': ('Quỹ tài trợ; nền tảng, cơ sở', 'n', 'HIGH', 'charitable foundation, solid foundation.'),
    'greatly': ('Rất nhiều, đáng kể', 'adv', 'HIGH', 'greatly appreciated, greatly improved.'),
    'helmet': ('Mũ bảo hiểm, mũ bảo hộ', 'n', 'HIGH', 'safety helmet trong công trường/hậu cần.'),
    'incorrect': ('Không đúng, sai sót', 'adj', 'HIGH', 'incorrect information, incorrect invoice.'),
    'accurately': ('Một cách chính xác', 'adv', 'HIGH', 'calculate accurately, record accurately.'),
    'activate': ('Kích hoạt, khởi động', 'v', 'HIGH', 'activate account, activate card.'),
    'astonishing': ('Đáng kinh ngạc, sửng sốt', 'adj', 'HIGH', 'astonishing growth, astonishing results.'),
    'bat': ('Gậy bóng chày; con dơi', 'n', 'LOW', 'Từ có 2 nghĩa hoàn toàn khác biệt; cần ngữ cảnh cụ thể.'),
    'beneficial': ('Có lợi, mang lại lợi ích', 'adj', 'HIGH', 'mutually beneficial relationship.'),
    'bid': ('Giá đấu thầu, sự bỏ thầu', 'n', 'HIGH', 'submit a bid, winning bid trong kinh doanh.'),
    'brick': ('Gạch xây dựng', 'n', 'HIGH', 'Vật liệu xây dựng cơ bản.'),
    'casual': ('Bình thường, giản dị; không chính thức', 'adj', 'HIGH', 'casual wear, casual meeting.'),
    'sanction': ('Lệnh trừng phạt; sự phê chuẩn', 'n', 'LOW', 'Từ có 2 nghĩa đối lập: trừng phạt vs phê chuẩn, tùy ngữ cảnh.'),
    'yield': ('Lợi tức, sản lượng; sinh lời', 'n', 'MEDIUM', 'bond yield, crop yield; động từ: nhượng bộ.'),
}

def normalize(text):
    if text is None: text = ''
    return unicodedata.normalize('NFC', text).lower().strip()

GARBAGE_SUFFIX = re.compile(r'^.+\s+(ad|adv|adj|n|v)\.?$', re.IGNORECASE)

def is_valid(front_text, back_text, is_active, deleted_at):
    if not is_active or deleted_at is not None: return False
    fn, bk = normalize(front_text), normalize(back_text)
    if not fn or not bk or len(fn)<=1 or len(bk)<=1: return False
    if 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk: return False
    if GARBAGE_SUFFIX.match(bk) or GARBAGE_SUFFIX.match(fn): return False
    if re.search(r'[<>={}]', bk): return False
    return True

def clean_vi(text):
    text = re.sub(r'\(.*?\)', '', text).strip()
    text = re.sub(r'\s+', ' ', text)
    if text:
        text = text[0].upper() + text[1:]
    return text

def translate_gtx(word):
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + urllib.parse.quote(word)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data[0][0][0]
    except Exception:
        return ''

def get_word_draft(card, deck_name, valid_dict):
    front = card['front_text'].strip()
    key = front.lower()
    pos = card['current_part_of_speech'] or 'n'

    # Nguồn a: Tái dùng thẻ hợp lệ trong DB (đối chiếu nội bộ)
    if key in valid_dict:
        back, d_pos = valid_dict[key]
        return back, (d_pos or pos), 'HIGH', 'a (db_reuse)', 'Tái dùng từ thẻ hợp lệ đã có trong DB.'

    # Nguồn c: AI tự biên soạn chuyên môn TOEIC
    if key in CURATED:
        back, c_pos, conf, note = CURATED[key]
        return back, c_pos, conf, 'c (ai_curated)', note + ' [AI tự soạn chuyên môn TOEIC]'

    # Nguồn b: Dịch qua Google Translate GTX (dịch vụ công khai)
    vi = translate_gtx(front)
    cleaned = clean_vi(vi)
    if not cleaned:
        cleaned = front.capitalize()

    # Theo quy tắc: Nguồn (b) phải đánh MEDIUM trở xuống, trừ khi đối chiếu độc lập
    conf = 'MEDIUM'
    note = f'Dịch tự động qua Google Translate GTX ({deck_name.split("-")[-1].strip() if "-" in deck_name else deck_name}); cần duyệt ToS.'

    # Nếu từ ngắn, hoặc cụm từ -> LOW
    if ' ' in front or '-' in front or len(cleaned) < 2:
        conf = 'LOW'
        note = 'Cụm từ / từ ngắn dịch tự động; đánh dấu LOW để người dùng kiểm tra.'

    return cleaned, pos, conf, 'b (Google Translate GTX)', note

def run():
    print("=================================================================")
    print("SOẠN BẢN NHÁP LÔ 2 (88 BỘ TOEIC OXFORD, 704 THẺ)")
    print("=================================================================")

    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db')
    cur = conn.cursor(pymysql.cursors.DictCursor)

    # 1. Từ điển thẻ hợp lệ hiện có trong DB
    cur.execute('''
        SELECT LOWER(TRIM(front_text)) as word, back_text, part_of_speech
        FROM flashcards
        WHERE is_active=1 AND deleted_at IS NULL
          AND back_text NOT LIKE '%từ vựng thuộc nhóm%'
          AND back_text NOT LIKE '%đang cập nhật%'
          AND LENGTH(back_text) > 1
    ''')
    valid_dict = {}
    for r in cur.fetchall():
        w = r['word']
        if w not in valid_dict and is_valid(w, r['back_text'], 1, None):
            valid_dict[w] = (r['back_text'], r['part_of_speech'])
    print(f"[OK] Đã tải từ điển đối chiếu nội bộ: {len(valid_dict)} từ hợp lệ có sẵn trong DB.")

    # 2. Lấy 88 bộ TOEIC có 0 thẻ hợp lệ
    cur.execute('''
        SELECT d.id, d.deck_code, d.title
        FROM decks d
        JOIN flashcards f ON f.deck_id = d.id AND f.is_active=1 AND f.deleted_at IS NULL
        GROUP BY d.id, d.deck_code, d.title
        ORDER BY d.id
    ''')
    all_decks = cur.fetchall()
    zero_valid_decks = []
    for d in all_decks:
        cur.execute('SELECT front_text, back_text, is_active, deleted_at FROM flashcards WHERE deck_id = %s', (d['id'],))
        cards = cur.fetchall()
        valid_count = sum(1 for c in cards if is_valid(c['front_text'], c['back_text'], c['is_active'], c['deleted_at']))
        if valid_count == 0 and ('OXFORD' in d['deck_code'] or 'TOEIC' in d['title']):
            zero_valid_decks.append(d)

    print(f"[OK] Số bộ TOEIC 0 thẻ hợp lệ: {len(zero_valid_decks)} bộ.")

    # 3. Gom 8 thẻ mỗi bộ và chia 9 batch
    chunks = [zero_valid_decks[i:i+10] for i in range(0, len(zero_valid_decks), 10)]
    batches_data = {}
    all_cards = []

    for idx, chunk in enumerate(chunks):
        letter = chr(ord('a') + idx)
        bname = f"batch2{letter}"
        batches_data[bname] = []
        for d in chunk:
            did = d['id']
            cur.execute("""
                SELECT id as card_id, deck_id, front_text, back_text as current_back_text, part_of_speech as current_part_of_speech
                FROM flashcards
                WHERE deck_id = %s AND is_active = 1 AND deleted_at IS NULL
                ORDER BY id
                LIMIT 8
            """, (did,))
            cards = cur.fetchall()
            for c in cards:
                c['deck_name'] = d['title']
                batches_data[bname].append(c)
                all_cards.append((bname, c))

    conn.close()
    print(f"[OK] Đã chọn {len(all_cards)} thẻ từ {len(zero_valid_decks)} bộ.")

    # 4. Sinh nghĩa với ThreadPoolExecutor
    print("Đang biên soạn và tra cứu nghĩa...")
    start_t = time.time()
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(
            lambda item: (item[0], item[1], get_word_draft(item[1], item[1]['deck_name'], valid_dict)),
            all_cards
        ))
    print(f"[OK] Hoàn thành sinh nghĩa sau {time.time() - start_t:.2f} giây.")

    # 5. Spot check: chọn 36 dòng ngẫu nhiên (5.1% >= 20 dòng)
    random.seed(42)
    total_cards = len(results)
    spot_indices = set(random.sample(range(total_cards), k=max(20, int(total_cards * 0.05) + 1)))

    batch_rows = {k: [] for k in batches_data.keys()}
    summary_rows = []

    global_idx = 0
    validation_fixes = 0

    for bname, card, (back, pos, conf, source, note) in results:
        did = card['deck_id']
        front = card['front_text'].strip()

        # Validation 1: back không chứa front
        if front.lower() in back.lower():
            back = back.replace(front.lower(), '').strip(' ,;')
            if not back: back = 'Từ chuyên môn ' + front
            validation_fixes += 1

        # Validation 2: không để trống
        if not back:
            back = 'Từ vựng ' + front
            conf = 'LOW'
            validation_fixes += 1

        # Validation 3: không quá 80 ký tự
        if len(back) > 80:
            back = back[:77] + '...'
            validation_fixes += 1

        # Validation 4: không trùng nghĩa trong cùng bộ
        existing_in_deck = [r['proposed_back_text'].lower().strip() for r in batch_rows[bname] if r['deck_id'] == did]
        if back.lower().strip() in existing_in_deck:
            back = back + f" ({pos})"
            validation_fixes += 1

        is_spot = 'Y' if global_idx in spot_indices else ''

        row = {
            'card_id': card['card_id'],
            'deck_id': did,
            'deck_name': card['deck_name'],
            'front_text': front,
            'current_back_text': card['current_back_text'],
            'current_part_of_speech': card['current_part_of_speech'],
            'proposed_back_text': back,
            'proposed_part_of_speech': pos,
            'confidence': conf,
            'source': source,
            'note': note,
            'spot_check': is_spot,
            'approved': '',
        }
        batch_rows[bname].append(row)

        summary_rows.append({
            'card_id': card['card_id'],
            'deck_id': did,
            'deck_name': card['deck_name'],
            'từ': front,
            'nghĩa đề xuất': back,
            'loại từ': pos,
            'confidence': conf,
            'source': source,
            'spot_check': is_spot,
            'ghi chú': note,
        })
        global_idx += 1

    print(f"[OK] Validation hoàn tất ({validation_fixes} điểm đã tự động hiệu chỉnh).")

    # 6. Xuất 9 file batch CSV
    os.makedirs('private-results', exist_ok=True)
    fieldnames = ['card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
                  'proposed_back_text','proposed_part_of_speech','confidence','source','note','spot_check','approved']

    for bname, rows in batch_rows.items():
        fname = f'private-results/card_meaning_drafts_{bname}.csv'
        with open(fname, 'w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        print(f"  ✓ {fname}: {len(rows)} thẻ")

    # 7. Xuất file tổng hợp review
    summary_path = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    summary_fieldnames = ['card_id','deck_id','deck_name','từ','nghĩa đề xuất','loại từ','confidence','source','spot_check','ghi chú']
    with open(summary_path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=summary_fieldnames)
        w.writeheader()
        w.writerows(summary_rows)
    print(f"\n✓ Đã xuất file tổng hợp review: {summary_path} ({len(summary_rows)} dòng)")

    # 8. Tạo Gói Duyệt Nhanh (private-results/review_pack.csv)
    # Gồm: 36 dòng spot_check, toàn bộ dòng MEDIUM/LOW, và 10 dòng HIGH ngẫu nhiên khác nữa
    spot_rows = [r for r in summary_rows if r['spot_check'] == 'Y']
    med_low_rows = [r for r in summary_rows if r['confidence'] in ('MEDIUM', 'LOW')]
    high_rows = [r for r in summary_rows if r['confidence'] == 'HIGH' and r['spot_check'] != 'Y']
    
    random.seed(123)
    sample_high = random.sample(high_rows, k=min(10, len(high_rows)))

    # Deduplicate by card_id
    seen_ids = set()
    pack_rows = []
    for r in med_low_rows + spot_rows + sample_high:
        if r['card_id'] not in seen_ids:
            seen_ids.add(r['card_id'])
            pack_rows.append(r)

    # Sắp xếp theo mức confidence: LOW -> MEDIUM -> HIGH
    conf_order = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3}
    pack_rows.sort(key=lambda r: (conf_order.get(r['confidence'], 9), r['card_id']))

    review_pack_path = 'private-results/review_pack.csv'
    pack_fieldnames = ['card_id', 'từ', 'loại từ', 'nghĩa đề xuất', 'confidence', 'source', 'note']
    with open(review_pack_path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=pack_fieldnames)
        w.writeheader()
        for r in pack_rows:
            w.writerow({
                'card_id': r['card_id'],
                'từ': r['từ'],
                'loại từ': r['loại từ'],
                'nghĩa đề xuất': r['nghĩa đề xuất'],
                'confidence': r['confidence'],
                'source': r['source'],
                'note': r['ghi chú'],
            })

    print(f"✓ Đã xuất gói duyệt nhanh: {review_pack_path} ({len(pack_rows)} dòng)")

    # In thống kê
    source_counts = {}
    conf_counts = {}
    for r in summary_rows:
        s = r['source']
        c = r['confidence']
        source_counts[s] = source_counts.get(s, 0) + 1
        conf_counts[c] = conf_counts.get(c, 0) + 1

    print("\n--- THỐNG KÊ NGUỒN NGHĨA (704 thẻ Lô 2) ---")
    for s, count in sorted(source_counts.items()):
        print(f"  {s:30s}: {count:4d} thẻ ({count/total_cards*100:.1f}%)")

    print("\n--- THỐNG KÊ CONFIDENCE (704 thẻ Lô 2) ---")
    for c, count in sorted(conf_counts.items(), key=lambda x: -x[1]):
        print(f"  {c:6s}: {count:4d} thẻ ({count/total_cards*100:.1f}%)")

    print(f"\n--- GÓI DUYỆT NHANH (review_pack.csv) ---")
    print(f"  Tổng số dòng gói duyệt: {len(pack_rows)} dòng")
    print(f"    - LOW:    {sum(1 for r in pack_rows if r['confidence']=='LOW')} dòng")
    print(f"    - MEDIUM: {sum(1 for r in pack_rows if r['confidence']=='MEDIUM')} dòng")
    print(f"    - HIGH:   {sum(1 for r in pack_rows if r['confidence']=='HIGH')} dòng")

if __name__ == '__main__':
    run()
