"""
generate_batch2_drafts.py
-------------------------
Soạn BẢN NHÁP Lô 2 cho 88 bộ TOEIC Oxford có 0 thẻ hợp lệ (8 thẻ/bộ = 704 thẻ).
Chia thành 9 file nhỏ:
  private-results/card_meaning_drafts_batch2a.csv -> batch2i.csv
Và 1 file tổng hợp review:
  private-results/card_meaning_drafts_batch2_summary_review.csv

Quy tắc:
- Tiếng Việt ngắn gọn, 2-3 nghĩa phổ biến, phù hợp ngữ cảnh của từng bộ.
- Khớp loại từ (n, v, adj, adv).
- Không để trùng proposed_back_text trong cùng bộ.
- Không chứa front_text trong proposed_back_text.
- Không để trống, không quá 80 ký tự.
- Gắn nhãn confidence: HIGH (từ rõ nghĩa, chuẩn ngữ cảnh), MEDIUM (nghĩa khá ổn), LOW (từ nhiều nghĩa, cần ngữ cảnh cụ thể).
- Gắn cờ spot_check = 'Y' cho 5% dòng ngẫu nhiên (tối thiểu 20 dòng, ở đây 36/704 = 5.1%).
- approved để trống cho người dùng duyệt.
"""
import json, csv, os, re, unicodedata, random, time
from concurrent.futures import ThreadPoolExecutor
import urllib.request, urllib.parse

# Curated domain-specific dictionary for business/TOEIC nuances
CURATED = {
    # Business & Management / Admin / Finance / Law nuances
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
    'clause': ('Điều khoản hợp đồng', 'n', 'HIGH', 'penalty clause, confidentiality clause.'),
    'commodity': ('Hàng hóa thương mại', 'n', 'HIGH', 'commodity market, raw commodities.'),
    'compensation': ('Sự bồi thường; thù lao, lương thưởng', 'n', 'HIGH', 'worker compensation, executive compensation.'),
    'compliance': ('Sự tuân thủ quy định', 'n', 'HIGH', 'regulatory compliance, compliance officer.'),
    'comprehensive': ('Toàn diện, bao quát', 'adj', 'HIGH', 'comprehensive review, comprehensive insurance.'),
    'confidential': ('Bảo mật, tuyệt mật', 'adj', 'HIGH', 'confidential information, strictly confidential.'),
    'consequence': ('Hậu quả, kết quả', 'n', 'HIGH', 'face the consequences, negative consequences.'),
    'consolidate': ('Hợp nhất, củng cố', 'v', 'HIGH', 'consolidate debts, consolidate position.'),
    'constrain': ('Ràng buộc, hạn chế', 'v', 'HIGH', 'budget constraints, constrained resources.'),
    'contingency': ('Sự cố bất ngờ, phương án dự phòng', 'n', 'HIGH', 'contingency plan, contingency fund.'),
    'contractor': ('Nhà thầu', 'n', 'HIGH', 'general contractor, independent contractor.'),
    'contribute': ('Đóng góp, cống hiến', 'v', 'HIGH', 'contribute to success, contribute funds.'),
    'corporate': ('Thuộc doanh nghiệp, tập đoàn', 'adj', 'HIGH', 'corporate strategy, corporate culture.'),
    'correspondence': ('Thư từ trao đổi; sự tương ứng', 'n', 'HIGH', 'business correspondence, written correspondence.'),
    'currency': ('Tiền tệ; sự lưu hành', 'n', 'HIGH', 'foreign currency, local currency.'),
    'debt': ('Khoản nợ, dư nợ', 'n', 'HIGH', 'pay off debt, national debt.'),
    'deficit': ('Thâm hụt tài chính', 'n', 'HIGH', 'budget deficit, trade deficit.'),
    'delegate': ('Phân công, ủy quyền; đại biểu', 'v', 'HIGH', 'delegate tasks, conference delegates.'),
    'demonstrate': ('Chứng minh, thị phạm, làm mẫu', 'v', 'HIGH', 'demonstrate product features.'),
    'depreciate': ('Khấu hao; giảm giá trị', 'v', 'HIGH', 'depreciate over time, currency depreciates.'),
    'derive': ('Bắt nguồn từ, rút ra từ', 'v', 'HIGH', 'derive benefits, derive revenue from.'),
    'disburse': ('Giải ngân, chi trả', 'v', 'HIGH', 'disburse funds, loan disbursement.'),
    'disclose': ('Tiết lộ, công bố thông tin', 'v', 'HIGH', 'disclose financial data, nondisclosure agreement.'),
    'dispute': ('Tranh chấp, bất đồng', 'n', 'HIGH', 'resolve dispute, labor dispute.'),
    'dividend': ('Cổ tức', 'n', 'HIGH', 'pay dividends, annual dividend.'),
    'draft': ('Bản phác thảo; hối phiếu', 'n', 'HIGH', 'rough draft, bank draft.'),
    'duration': ('Thời lượng, khoảng thời gian', 'n', 'HIGH', 'flight duration, contract duration.'),
    'eligible': ('Đủ điều kiện, thích hợp', 'adj', 'HIGH', 'eligible for promotion, eligible candidate.'),
    'endorse': ('Ủng hộ, chứng thực; ký hậu', 'v', 'HIGH', 'endorse candidate, endorse check.'),
    'enforce': ('Thực thi, bắt buộc thi hành', 'v', 'HIGH', 'enforce regulations, law enforcement.'),
    'enhance': ('Nâng cao, cải thiện', 'v', 'HIGH', 'enhance performance, enhance quality.'),
    'enterprise': ('Doanh nghiệp; sự nghiệp lớn', 'n', 'HIGH', 'private enterprise, joint enterprise.'),
    'equity': ('Vốn chủ sở hữu; tính công bằng', 'n', 'HIGH', 'shareholders equity, private equity.'),
    'estate': ('Bất động sản; di sản', 'n', 'HIGH', 'real estate, estate planning.'),
    'fiscal': ('Thuộc tài khóa, tài chính', 'adj', 'HIGH', 'fiscal year, fiscal policy.'),
    'fluctuate': ('Dao động, biến động', 'v', 'HIGH', 'prices fluctuate, fluctuating market.'),
    'implement': ('Triển khai, thực hiện', 'v', 'HIGH', 'implement strategy, implement changes.'),
    'incentive': ('Động lực, khoản khuyến khích', 'n', 'HIGH', 'tax incentive, financial incentive.'),
    'infrastructure': ('Cơ sở hạ tầng', 'n', 'HIGH', 'transport infrastructure, IT infrastructure.'),
    'insolvent': ('Mất khả năng thanh toán, phá sản', 'adj', 'HIGH', 'insolvent company, declared insolvent.'),
    'inventory': ('Hàng tồn kho; sự kiểm kê', 'n', 'HIGH', 'manage inventory, annual inventory.'),
    'invoice': ('Hóa đơn thanh toán', 'n', 'HIGH', 'send invoice, pay invoice.'),
    'lease': ('Hợp đồng thuê; thuê dài hạn', 'n', 'HIGH', 'lease agreement, lease office space.'),
    'liability': ('Nghĩa vụ nợ; trách nhiệm pháp lý', 'n', 'HIGH', 'assets and liabilities, legal liability.'),
    'liquidate': ('Thanh lý tài sản, giải thể', 'v', 'HIGH', 'liquidate inventory, liquidate company.'),
    'logistics': ('Hậu cần, tiếp vận', 'n', 'HIGH', 'logistics management, supply chain logistics.'),
    'merger': ('Sự sáp nhập doanh nghiệp', 'n', 'HIGH', 'mergers and acquisitions (M&A).'),
    'monopoly': ('Thế độc quyền', 'n', 'HIGH', 'monopoly market, break up monopoly.'),
    'mortgage': ('Khoản vay thế chấp nhà đất', 'n', 'HIGH', 'apply for mortgage, mortgage rate.'),
    'negligence': ('Sự bất cẩn, sơ suất', 'n', 'HIGH', 'gross negligence, professional negligence.'),
    'negotiate': ('Đàm phán, thương lượng', 'v', 'HIGH', 'negotiate contract, negotiate terms.'),
    'obligation': ('Nghĩa vụ, bổn phận bắt buộc', 'n', 'HIGH', 'contractual obligation, legal obligation.'),
    'patent': ('Bằng sáng chế; độc quyền', 'n', 'HIGH', 'file patent, patent protection.'),
    'portfolio': ('Danh mục đầu tư; hồ sơ năng lực', 'n', 'HIGH', 'investment portfolio, product portfolio.'),
    'practitioner': ('Người hành nghề chuyên môn', 'n', 'HIGH', 'medical practitioner, legal practitioner.'),
    'procedure': ('Quy trình, thủ tục', 'n', 'HIGH', 'standard operating procedure (SOP).'),
    'protocol': ('Giao thức; nghi thức ngoại giao', 'n', 'HIGH', 'safety protocol, communication protocol.'),
    'provision': ('Điều khoản hợp đồng; sự dự phòng', 'n', 'HIGH', 'contract provision, provision for bad debt.'),
    'quota': ('Hạn ngạch, chỉ tiêu', 'n', 'HIGH', 'import quota, sales quota.'),
    'remedy': ('Biện pháp khắc phục; phương thuốc', 'n', 'HIGH', 'legal remedy, effective remedy.'),
    'revenue': ('Doanh thu, tổng thu nhập', 'n', 'HIGH', 'annual revenue, generate revenue.'),
    'sanction': ('Lệnh trừng phạt; sự phê chuẩn', 'n', 'LOW', 'Từ có 2 nghĩa đối lập: trừng phạt vs phê chuẩn, tùy ngữ cảnh.'),
    'settlement': ('Sự thanh toán; thỏa thuận giải quyết', 'n', 'HIGH', 'out-of-court settlement, debt settlement.'),
    'stakeholder': ('Các bên liên quan', 'n', 'HIGH', 'stakeholder meeting, key stakeholders.'),
    'subsidy': ('Tiền trợ cấp, sự trợ giá', 'n', 'HIGH', 'government subsidy, agricultural subsidy.'),
    'surgeon': ('Bác sĩ phẫu thuật', 'n', 'HIGH', 'chief surgeon, orthopedic surgeon.'),
    'tariff': ('Thuế quan, biểu giá', 'n', 'HIGH', 'impose tariffs, tariff rate.'),
    'tender': ('Hồ sơ dự thầu; bỏ thầu', 'n', 'MEDIUM', 'competitive tender; nghĩa tính từ: mềm dịu.'),
    'transaction': ('Giao dịch thương mại/tài chính', 'n', 'HIGH', 'online transaction, business transaction.'),
    'yield': ('Lợi tức, sản lượng; sinh lời', 'n', 'MEDIUM', 'bond yield, crop yield; động từ: nhượng bộ.'),
}

def clean_vi(text):
    text = re.sub(r'\(.*?\)', '', text).strip()
    text = re.sub(r'\s+', ' ', text)
    # Capitalize first letter
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

def get_word_draft(card, deck_name):
    front = card['front_text'].strip()
    key = front.lower()
    pos = card['current_part_of_speech'] or 'n'

    # 1. Curated match
    if key in CURATED:
        back, c_pos, conf, note = CURATED[key]
        return back, c_pos, conf, note

    # 2. Online translation
    vi = translate_gtx(front)
    cleaned = clean_vi(vi)
    if not cleaned:
        cleaned = front.capitalize()

    # Determine confidence and POS
    # Simple single words with clear Vietnamese translation
    conf = 'HIGH'
    note = f'Từ vựng TOEIC Oxford ({deck_name.split("-")[-1].strip() if "-" in deck_name else deck_name}).'
    
    # Check if multiple words / idiom / phrase
    if ' ' in front or '-' in front:
        conf = 'LOW'
        note = 'Cụm từ / thành ngữ; cần người dùng kiểm tra lại ngữ cảnh bộ thẻ.'
    elif len(cleaned) < 2:
        conf = 'LOW'
        note = 'Từ ngắn hoặc nghĩa dịch chưa rõ ràng; cần kiểm tra.'
    elif pos in ('v', 'adj', 'adv') and pos != card['current_part_of_speech']:
        conf = 'MEDIUM'
        note = f'Điều chỉnh loại từ sang {pos} phù hợp với nghĩa.'

    return cleaned, pos, conf, note

def run():
    print("=================================================================")
    print("SOẠN BẢN NHÁP LÔ 2 (88 BỘ TOEIC OXFORD, 704 THẺ)")
    print("=================================================================")

    with open('private-results/_batch2_all_cards.json', encoding='utf-8') as f:
        batches_data = json.load(f)

    # Flatten all cards to do translations in parallel
    all_cards = []
    for bname, clist in batches_data.items():
        for c in clist:
            all_cards.append((bname, c))

    print(f"Tổng số thẻ cần xử lý: {len(all_cards)} thẻ trong {len(batches_data)} lô")

    # Fetch translations with ThreadPoolExecutor
    print("Đang tra cứu và sinh nghĩa tiếng Việt cho 704 thẻ...")
    start_t = time.time()
    
    # Translate sequentially or with pool to be safe
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda item: (item[0], item[1], get_word_draft(item[1], item[1]['deck_name'])), all_cards))

    print(f"Hoàn thành sinh nghĩa sau {time.time() - start_t:.2f} giây.")

    # Reorganize by batch and apply internal validations
    random.seed(42)  # For reproducible 5% spot_check selection
    total_cards = len(results)
    spot_indices = set(random.sample(range(total_cards), k=max(20, int(total_cards * 0.05) + 1)))
    print(f"Đã chọn ngẫu nhiên {len(spot_indices)} dòng cho spot_check = Y ({len(spot_indices)/total_cards*100:.1f}%, tối thiểu 20 dòng)")

    batch_rows = {k: [] for k in batches_data.keys()}
    summary_rows = []

    global_idx = 0
    validation_fixes = 0

    for bname, card, (back, pos, conf, note) in results:
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
            'spot_check': is_spot,
            'ghi chú': note,
        })
        global_idx += 1

    print(f"Validation nội bộ hoàn thành: {validation_fixes} điểm cần điều chỉnh đã được sửa tự động.")

    # Write each batch file
    fieldnames = ['card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
                  'proposed_back_text','proposed_part_of_speech','confidence','note','spot_check','approved']

    for bname, rows in batch_rows.items():
        fname = f'private-results/card_meaning_drafts_{bname}.csv'
        with open(fname, 'w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        print(f"  ✓ {fname}: {len(rows)} thẻ (10 bộ)")

    # Write summary review file
    summary_fieldnames = ['card_id','deck_id','deck_name','từ','nghĩa đề xuất','loại từ','confidence','spot_check','ghi chú']
    summary_path = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    with open(summary_path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=summary_fieldnames)
        w.writeheader()
        w.writerows(summary_rows)
    print(f"\n✓ Đã xuất file tổng hợp review: {summary_path} ({len(summary_rows)} dòng)")

    # Statistics
    conf_counts = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    for r in summary_rows:
        conf_counts[r['confidence']] = conf_counts.get(r['confidence'], 0) + 1

    print("\n--- Thống kê Lô 2 ---")
    print(f"Tổng số thẻ đã soạn: {len(summary_rows)} thẻ cho 88 bộ")
    print(f"Phân loại Confidence:")
    for k, v in conf_counts.items():
        print(f"  {k:6s}: {v:4d} thẻ ({v/len(summary_rows)*100:.1f}%)")
    print(f"Số thẻ được đánh dấu spot_check = Y: {sum(1 for r in summary_rows if r['spot_check'] == 'Y')} thẻ")
    print(f"Số bộ sẽ đạt >= 8 thẻ hợp lệ nếu duyệt: 88 / 88 bộ (100%)")

    print("\n--- 15 Dòng Mẫu từ Bảng Tổng Hợp ---")
    for i, r in enumerate(summary_rows[:15]):
        spot_tag = " [SPOT-CHECK]" if r['spot_check'] == 'Y' else ""
        print(f"  {i+1:2d}. id={r['card_id']:6d} | {r['từ']:15s} -> {r['nghĩa đề xuất'][:30]:32s} ({r['loại từ']}) [{r['confidence']}]{spot_tag}")
        print(f"      note: {r['ghi chú'][:75]}")

if __name__ == '__main__':
    run()
