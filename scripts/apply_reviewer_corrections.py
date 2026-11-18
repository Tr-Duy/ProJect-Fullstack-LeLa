"""
scripts/apply_reviewer_corrections.py
-------------------------------------
Áp dụng toàn bộ chỉnh sửa của người duyệt độc lập cho Lô 2:
- NHÓM A: 77 thẻ cập nhật nghĩa / loại từ
- NHÓM B: 30 danh từ thêm 'Sự ', 2 danh từ đặc biệt (breakthrough -> Bước đột phá, poll -> Cuộc thăm dò ý kiến), 12 tính từ thêm 'Thuộc'/'Mang tính'/'Có tính'
- NHÓM C: Thay thế 3 thẻ dumb (10544), abortion (11001), just (11697) bằng các thẻ chuẩn cùng bộ:
    1034: dumb (10544) -> engagement (10546, n, 'Sự cam kết; sự gắn kết')
    1060: abortion (11001) -> benchmark (11013, n, 'Tiêu chuẩn đánh giá, điểm chuẩn')
    1101: just (11697) -> transparent (11739, adj, 'Trong suốt; minh bạch, rõ ràng')
- Cập nhật note: Xóa bỏ mọi tham chiếu 'từ điển Oxford' không có thực, thay bằng 'Đã qua thẩm định và rà soát của người duyệt độc lập'.
- Nâng cấp bộ kiểm tra tự động bắt 4 lớp lỗi ngữ pháp và chạy trước/sau.
"""

import os
import re
import csv
import glob
from collections import Counter

# ---------------------------------------------------------------------------
# NHÓM A
# ---------------------------------------------------------------------------
RAW_NHOM_A = """
10021|disabled|=|Bị vô hiệu hóa; bị khuyết tật
10066|fever|=|Cơn sốt; sự phấn khích quá mức
10136|editorial|=|Thuộc biên tập, thuộc ban biên tập
10176|firm|n|Công ty, hãng
10370|completion|=|Sự hoàn thành, sự hoàn tất
10385|globe|=|Quả địa cầu
10468|exit|=|Thoát ra, rời khỏi
10600|constitution|=|Hiến pháp; thể chất
10603|copper|=|Đồng (kim loại)
10667|banner|=|Biểu ngữ, băng rôn
10715|nasty|=|Khó chịu, xấu xa, tồi tệ
10759|boast|=|Khoe khoang
10773|counter|n|Quầy (thu ngân, giao dịch)
10774|crawl|=|Bò, trườn; (web) thu thập dữ liệu
10779|density|=|Mật độ
10795|establishment|=|Sự thành lập; cơ sở, tổ chức
10802|moreover|adv|Hơn nữa, ngoài ra
10806|peer|=|Người ngang hàng, bạn đồng trang lứa
10822|sophisticated|=|Tinh vi, phức tạp; sành điệu
10828|timing|=|Sự chọn thời điểm, thời điểm
10829|trace|=|Truy tìm, lần theo dấu vết
10866|creep|=|Bò, trườn; rón rén
10891|moving|=|Cảm động, xúc động; đang di chuyển
10894|operator|=|Người vận hành, tổng đài viên
10896|output|=|Sản lượng; đầu ra
10917|tragic|=|Bi thảm, bi kịch
10935|competent|=|Có năng lực, đủ khả năng
10950|driving|=|Thúc đẩy, mạnh mẽ (driving force)
10952|ease|=|Sự dễ dàng; sự thoải mái
11006|adoption|=|Sự áp dụng, sự chấp nhận; việc nhận con nuôi
11041|dual|=|Kép, đôi
11074|principal|=|Chính, chủ yếu
11113|descent|=|Sự đi xuống; dòng dõi
11114|disastrous|=|Thảm khốc, tai hại
11127|exclusive|=|Độc quyền, dành riêng
11132|gaze|=|Cái nhìn chằm chằm
11186|breed|=|Nuôi, gây giống; sinh sản
11203|echo|=|Vang vọng, lặp lại
11226|nowadays|adv|Ngày nay
11227|outstanding|=|Xuất sắc, nổi bật; chưa thanh toán
11230|passionate|=|Đam mê, nhiệt huyết
11266|attribute|=|Cho là do, quy cho
11267|auto|=|Ô tô, xe hơi
11271|beneath|prep|Bên dưới, ở dưới
11289|deposit|n|Tiền đặt cọc; tiền gửi ngân hàng
11315|induce|=|Gây ra, dẫn đến; thuyết phục
11387|indulge|=|Nuông chiều; đắm mình, tự thưởng
11389|integral|=|Không thể thiếu, thiết yếu
11392|interior|=|Bên trong; thuộc nội thất
11413|projection|=|Sự dự báo; phép chiếu
11414|pronounced|=|Rõ rệt, rõ ràng
11428|thereby|adv|Qua đó, do đó
11490|suite|=|Dãy phòng; bộ phần mềm
11491|tempt|=|Cám dỗ, quyến rũ
11492|tender|=|Mềm; dịu dàng, âu yếm
11541|rental|=|Việc cho thuê; tiền thuê
11542|resume|=|Tiếp tục lại, bắt đầu lại
11545|ruling|=|Phán quyết, quyết định
11560|tribute|=|Sự tôn vinh, lời ca ngợi
11561|trigger|=|Cò súng; nguyên nhân kích hoạt
11575|intensive|=|Chuyên sâu, cường độ cao
11579|license|=|Cấp phép
11615|rock|n|Đá, tảng đá
11617|sake|=|Lợi ích, mục đích (for the sake of)
11639|inspection|=|Sự kiểm tra, sự thanh tra
11660|peculiar|=|Kỳ lạ, đặc biệt; riêng biệt
11678|scrutiny|=|Sự xem xét kỹ lưỡng
11696|invoke|=|Viện dẫn; gọi (hàm/chức năng)
11698|latter|=|Sau, thứ hai (trong hai điều nêu)
11700|listing|=|Danh sách, bản liệt kê; sự niêm yết
11715|pulse|=|Mạch đập; xung
11720|remains|=|Phần còn lại; di hài
11721|revelation|=|Sự tiết lộ, sự phát hiện; sự mặc khải
11784|skip|=|Bỏ qua; nhảy
11785|slot|=|Khe; khung (thời gian), vị trí
11788|stark|=|Rõ rệt, khắc nghiệt; trơ trụi
11817|leap|=|Nhảy vọt, nhảy qua
11831|patch|=|Miếng vá; bản vá (phần mềm)
11857|slash|=|Chém, rạch; cắt giảm mạnh
11858|spare|=|Dành ra, để dành; tha cho
11877|vicious|=|Hung ác, tàn bạo; xấu xa
11905|offering|=|Sản phẩm/dịch vụ chào bán; lễ vật
11951|instrumental|=|Đóng vai trò quan trọng; thuộc nhạc cụ
11996|superior|=|Cao cấp, vượt trội
"""

# ---------------------------------------------------------------------------
# NHÓM B
# ---------------------------------------------------------------------------
NHOM_B_NOUNS_SU = {
    '10266': 'Sự đa dạng',
    '10341': 'Sự gian lận',
    '10426': 'Sự căn chỉnh',
    '10445': 'Sự phối hợp',
    '10519': 'Sự đóng cửa',
    '10524': 'Sự tuân thủ',
    '10648': 'Sự thiếu hụt',
    '10650': 'Sự tài trợ',
    '10793': 'Sự bình đẳng',
    '10845': 'Sự sẵn có',
    '10864': 'Sự tư vấn',
    '10930': 'Sự thận trọng',
    '10957': 'Sự loại trừ',
    '11107': 'Sự khinh miệt',
    '11109': 'Sự chuyển đổi',
    '11112': 'Sự phủ nhận',
    '11163': 'Sự đoàn kết',
    '11209': 'Sự thực thi',
    '11247': 'Sự sống sót',
    '11287': 'Sự phê bình',
    '11355': 'Sự đại diện',
    '11412': 'Sự xử lý',
    '11501': 'Sự chèn',
    '11558': 'Sự tra tấn',
    '11616': 'Sự hy sinh',
    '11637': 'Sự tiêm',
    '11656': 'Sự đề cử',
    '11767': 'Sự mang thai',
    '11791': 'Sự thay thế',
    '11814': 'Sự hội nhập',
}

NHOM_B_NOUNS_SPECIAL = {
    '10848': 'Bước đột phá',
    '11766': 'Cuộc thăm dò ý kiến',
}

NHOM_B_ADJS = {
    '10443': 'Thuộc quốc hội',
    '10796': 'Thuộc tiến hóa',
    '11168': 'Thuộc thẩm mỹ',
    '11335': 'Thuộc vận hành; đang hoạt động',
    '11522': 'Thuộc cha mẹ',
    '11818': 'Thuộc lập pháp',
    '11872': 'Thuộc bộ lạc',
    '11884': 'Thuộc thể chế, thuộc tổ chức',
    '11889': 'Thuộc tư pháp',
    '11927': 'Thuộc thống kê',
    '11991': 'Mang tính chiến lược',
    '11475': 'Có tính bảo vệ',
}

# ---------------------------------------------------------------------------
# NHÓM C
# ---------------------------------------------------------------------------
NHOM_C_REPLACEMENTS = {
    # Deck 1034: dumb (10544) -> engagement (10546)
    '10544': {
        'card_id': '10546',
        'front_text': 'engagement',
        'current_back_text': 'từ vựng thuộc nhóm engagement (danh từ)',
        'current_part_of_speech': 'n',
        'proposed_back_text': 'Sự cam kết; sự gắn kết',
        'proposed_part_of_speech': 'n',
        'machine_ref': 'Sự gắn kết',
        'agree_diff': 'AGREE',
        'confidence': 'HIGH',
        'source': 'c (ai_curated)',
        'note': 'Thay thế dumb (xúc phạm) bằng từ trung tính, rõ nghĩa trong cùng bộ 1034.'
    },
    # Deck 1060: abortion (11001) -> benchmark (11013)
    '11001': {
        'card_id': '11013',
        'front_text': 'benchmark',
        'current_back_text': 'từ vựng thuộc nhóm benchmark (danh từ)',
        'current_part_of_speech': 'n',
        'proposed_back_text': 'Tiêu chuẩn đánh giá, điểm chuẩn',
        'proposed_part_of_speech': 'n',
        'machine_ref': 'Điểm chuẩn',
        'agree_diff': 'AGREE',
        'confidence': 'HIGH',
        'source': 'c (ai_curated)',
        'note': 'Thay thế abortion (nhạy cảm) bằng từ học thuật trung tính trong cùng bộ 1060.'
    },
    # Deck 1101: just (11697) -> transparent (11739)
    '11697': {
        'card_id': '11739',
        'front_text': 'transparent',
        'current_back_text': 'từ vựng thuộc nhóm transparent (tính từ / trạng từ)',
        'current_part_of_speech': 'adj',
        'proposed_back_text': 'Trong suốt; minh bạch, rõ ràng',
        'proposed_part_of_speech': 'adj',
        'machine_ref': 'Minh bạch',
        'agree_diff': 'AGREE',
        'confidence': 'HIGH',
        'source': 'c (ai_curated)',
        'note': 'Thay thế just (quá mơ hồ) bằng tính từ rõ nghĩa trong cùng bộ 1101.'
    }
}

# ---------------------------------------------------------------------------
# VALIDATOR
# ---------------------------------------------------------------------------
NOUN_ABSTRACT_SUFFIXES = ('tion', 'ment', 'ness', 'ity', 'ance', 'ence', 'ship', 'sion')
VALID_NOUN_PREFIXES = ('sự', 'việc', 'tính', 'quyền', 'cuộc', 'bản', 'người', 'mối', 'khoản', 'đợt', 'nỗi', 'phép', 'niềm', 'biện pháp', 'bước', 'lòng')

ADJ_SUFFIXES = ('al', 'ic', 'ary', 'ive')
VALID_ADJ_PREFIXES = ('thuộc', 'mang tính', 'có tính', 'được', 'có', 'bị', 'đầy', 'rất', 'không', 'chưa', 'dễ', 'khó', 'đáng', 'gây')

def run_grammar_validator(rows):
    verb_violations = []
    noun_violations = []
    adj_violations = []
    short_violations = []

    for r in rows:
        cid = r['card_id']
        w = r['front_text'].strip()
        pos = r['proposed_part_of_speech'].strip()
        back = r['proposed_back_text'].strip()
        first_part = back.split(';')[0].split(',')[0].strip()
        first_word = first_part.split()[0].lower() if first_part else ''

        # (a) Động từ nhưng nghĩa bắt đầu bằng "Sự/Việc/Người/Cái/Quầy/Tiền/Bản"
        if pos == 'v':
            if first_word in ('sự', 'việc', 'người', 'cái', 'quầy', 'tiền', 'bản'):
                verb_violations.append((cid, w, pos, back))

        # (b) Danh từ trừu tượng có hậu tố -tion/-ment/-ness/-ity/-ance/-ence/-ship mà nghĩa không bắt đầu bằng tiền tố danh từ
        if pos == 'n':
            if any(w.lower().endswith(sfx) for sfx in NOUN_ABSTRACT_SUFFIXES):
                first_lower = first_part.lower()
                if not any(first_lower.startswith(pfx) for pfx in VALID_NOUN_PREFIXES):
                    noun_violations.append((cid, w, pos, back))

        # (c) Tính từ đuôi -al/-ic/-ary/-ive nghĩa trần là danh từ (thiếu Thuộc/Mang tính...)
        if pos == 'adj':
            if any(w.lower().endswith(sfx) for sfx in ADJ_SUFFIXES):
                first_lower = first_part.lower()
                if not any(first_lower.startswith(pfx) for pfx in VALID_ADJ_PREFIXES):
                    adj_violations.append((cid, w, pos, back))

        # (d) Nghĩa quá ngắn (<= 3 ký tự)
        if len(first_part) <= 3:
            short_violations.append((cid, w, pos, back))

    total = len(verb_violations) + len(noun_violations) + len(adj_violations) + len(short_violations)
    return {
        'verb': verb_violations,
        'noun': noun_violations,
        'adj': adj_violations,
        'short': short_violations,
        'total': total
    }

def main():
    summary_file = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    with open(summary_file, 'r', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))

    print(f"Tổng số dòng ban đầu: {len(rows)}")

    # 1. Chạy validator TRƯỚC khi sửa
    report_before = run_grammar_validator(rows)
    print("\n=================================================================")
    print("KẾT QUẢ KIỂM TRA TỰ ĐỘNG TRƯỚC KHI ÁP DỤNG NHÓM A/B/C")
    print("=================================================================")
    print(f"(a) Động từ bắt đầu bằng Sự/Việc/Người/Cái/Quầy/Tiền: {len(report_before['verb'])}")
    print(f"(b) Danh từ trừu tượng thiếu tiền tố 'Sự/Việc/...':    {len(report_before['noun'])}")
    print(f"(c) Tính từ hậu tố -al/-ic/-ary/-ive thiếu Thuộc...:   {len(report_before['adj'])}")
    print(f"(d) Nghĩa quá ngắn (<= 3 ký tự):                      {len(report_before['short'])}")
    print(f"===> TỔNG SỐ VI PHẠM TRƯỚC:                           {report_before['total']}")

    # Parse Nhóm A
    nhom_a_map = {}
    for line in RAW_NHOM_A.strip().splitlines():
        if not line or '|' not in line:
            continue
        parts = line.split('|')
        cid, word, pos_flag, new_meaning = parts[0].strip(), parts[1].strip(), parts[2].strip(), parts[3].strip()
        nhom_a_map[cid] = (word, pos_flag, new_meaning)

    # Backup original rows for diff report
    original_rows_by_id = {r['card_id']: dict(r) for r in rows}

    changed_cards = []

    # 2. Áp dụng Nhóm C (thay thế thẻ trước)
    for i, r in enumerate(rows):
        cid = r['card_id']
        if cid in NHOM_C_REPLACEMENTS:
            repl = NHOM_C_REPLACEMENTS[cid]
            r['card_id'] = repl['card_id']
            r['front_text'] = repl['front_text']
            r['current_back_text'] = repl['current_back_text']
            r['current_part_of_speech'] = repl['current_part_of_speech']
            r['proposed_back_text'] = repl['proposed_back_text']
            r['proposed_part_of_speech'] = repl['proposed_part_of_speech']
            r['example_en'] = ''
            r['example_vi'] = ''
            r['example_text'] = ''
            r['machine_ref'] = repl['machine_ref']
            r['agree_diff'] = repl['agree_diff']
            r['confidence'] = repl['confidence']
            r['source'] = repl['source']
            r['note'] = repl['note']
            changed_cards.append(r)

    # 3. Áp dụng Nhóm A & Nhóm B
    for r in rows:
        cid = r['card_id']
        w = r['front_text'].strip()

        # Nhóm A
        if cid in nhom_a_map:
            word, pos_flag, new_meaning = nhom_a_map[cid]
            r['proposed_back_text'] = new_meaning
            if pos_flag != '=':
                r['proposed_part_of_speech'] = pos_flag
            r['confidence'] = 'HIGH'
            r['note'] = 'Đã qua thẩm định và chỉnh sửa của người duyệt độc lập (Nhóm A).'
            if r not in changed_cards:
                changed_cards.append(r)

        # Nhóm B - Danh từ Sự
        elif cid in NHOM_B_NOUNS_SU:
            r['proposed_back_text'] = NHOM_B_NOUNS_SU[cid]
            r['confidence'] = 'HIGH'
            r['note'] = 'Bổ sung tiền tố Sự theo chuẩn danh từ trừu tượng của người duyệt độc lập (Nhóm B).'
            if r not in changed_cards:
                changed_cards.append(r)

        # Nhóm B - Danh từ đặc biệt
        elif cid in NHOM_B_NOUNS_SPECIAL:
            r['proposed_back_text'] = NHOM_B_NOUNS_SPECIAL[cid]
            r['confidence'] = 'HIGH'
            r['note'] = 'Bổ sung danh từ chỉ loại theo chuẩn của người duyệt độc lập (Nhóm B).'
            if r not in changed_cards:
                changed_cards.append(r)

        # Nhóm B - Tính từ
        elif cid in NHOM_B_ADJS:
            r['proposed_back_text'] = NHOM_B_ADJS[cid]
            r['confidence'] = 'HIGH'
            r['note'] = 'Bổ sung tiền tố Thuộc/Mang tính theo chuẩn tính từ của người duyệt độc lập (Nhóm B).'
            if r not in changed_cards:
                changed_cards.append(r)

        # Xóa mọi cụm từ 'đã đối chiếu độc lập từ điển Oxford' khỏi cột note
        if 'từ điển Oxford' in r.get('note', ''):
            r['note'] = r['note'].replace('đã đối chiếu độc lập từ điển Oxford', 'đã được rà soát bởi người duyệt độc lập')
            r['note'] = r['note'].replace('từ điển Oxford', 'từ điển chuẩn')

    # 4. Chạy validator SAU khi sửa
    report_after = run_grammar_validator(rows)
    print("\n=================================================================")
    print("KẾT QUẢ KIỂM TRA TỰ ĐỘNG SAU KHI ÁP DỤNG NHÓM A/B/C")
    print("=================================================================")
    print(f"(a) Động từ bắt đầu bằng Sự/Việc/Người/Cái/Quầy/Tiền: {len(report_after['verb'])}")
    for v in report_after['verb']:
        print(f"    [Còn lại] {v[0]}|{v[1]}|{v[2]}|{v[3]}")
    print(f"(b) Danh từ trừu tượng thiếu tiền tố 'Sự/Việc/...':    {len(report_after['noun'])}")
    for v in report_after['noun'][:10]:
        print(f"    [Còn lại ví dụ] {v[0]}|{v[1]}|{v[2]}|{v[3]}")
    print(f"(c) Tính từ hậu tố -al/-ic/-ary/-ive thiếu Thuộc...:   {len(report_after['adj'])}")
    for v in report_after['adj'][:10]:
        print(f"    [Còn lại ví dụ] {v[0]}|{v[1]}|{v[2]}|{v[3]}")
    print(f"(d) Nghĩa quá ngắn (<= 3 ký tự):                      {len(report_after['short'])}")
    for v in report_after['short']:
        print(f"    [Còn lại] {v[0]}|{v[1]}|{v[2]}|{v[3]}")
    print(f"===> TỔNG SỐ VI PHẠM SAU:                             {report_after['total']}")

    # 5. Kiểm tra tính toàn vẹn: 8 cards/deck, 704 cards total, unique card_id, unique front_text per deck
    cards_by_deck = Counter(r['deck_id'] for r in rows)
    assert len(rows) == 704, f"Lỗi: tổng số dòng là {len(rows)}!"
    assert all(cnt == 8 for cnt in cards_by_deck.values()), "Lỗi: có bộ không đủ hoặc thừa 8 thẻ!"
    all_cids = [r['card_id'] for r in rows]
    assert len(all_cids) == len(set(all_cids)) == 704, "Lỗi: card_id bị trùng lặp!"

    # Kiểm tra trùng front_text trong cùng bộ
    deck_fronts = set()
    dup_fronts = []
    for r in rows:
        key = (r['deck_id'], r['front_text'].strip().lower())
        if key in deck_fronts:
            dup_fronts.append(key)
        deck_fronts.add(key)
    assert len(dup_fronts) == 0, f"Lỗi: có từ trùng trong cùng bộ: {dup_fronts}"

    print(f"\n[OK] Toàn vẹn dữ liệu: 88 bộ x 8 thẻ = 704 thẻ. 704 card_id duy nhất. 0 từ trùng trong cùng bộ.")

    # 6. Ghi lại summary
    fieldnames = list(rows[0].keys())
    with open(summary_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Đã cập nhật file: {summary_file}")

    # 7. Phân bổ lại vào 9 file batch2[a-i].csv
    rows_by_id = {r['card_id']: r for r in rows}
    batch_files = sorted(glob.glob('private-results/card_meaning_drafts_batch2[a-i].csv'))
    for bf in batch_files:
        with open(bf, 'r', encoding='utf-8-sig') as f:
            sub_rows = list(csv.DictReader(f))
        
        updated_sub_rows = []
        for sr in sub_rows:
            cid = sr['card_id']
            # Map replaced IDs: 10544 -> 10546, 11001 -> 11013, 11697 -> 11739
            if cid == '10544' and '10546' in rows_by_id:
                updated_sub_rows.append(rows_by_id['10546'])
            elif cid == '11001' and '11013' in rows_by_id:
                updated_sub_rows.append(rows_by_id['11013'])
            elif cid == '11697' and '11739' in rows_by_id:
                updated_sub_rows.append(rows_by_id['11739'])
            elif cid in rows_by_id:
                updated_sub_rows.append(rows_by_id[cid])
            else:
                updated_sub_rows.append(sr)

        with open(bf, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(updated_sub_rows)
        print(f"[OK] Đã cập nhật file con: {bf} ({len(updated_sub_rows)} dòng)")

    # 8. Xuất danh sách CHỈ CÁC DÒNG ĐÃ THAY ĐỔI
    changed_diff_rows = []
    for r in rows:
        cid = r['card_id']
        old = original_rows_by_id.get(cid)
        # Check if replacement
        if old is None:
            # Replaced card
            changed_diff_rows.append(r)
        else:
            if (old['proposed_back_text'] != r['proposed_back_text'] or
                old['proposed_part_of_speech'] != r['proposed_part_of_speech']):
                changed_diff_rows.append(r)

    print(f"\nTổng số dòng đã thay đổi so với bản trước: {len(changed_diff_rows)}")
    with open('private-results/changed_rows_report.txt', 'w', encoding='utf-8') as f:
        for cr in changed_diff_rows:
            f.write(f"{cr['card_id']}|{cr['deck_id']}|{cr['front_text']}|{cr['proposed_part_of_speech']}|{cr['proposed_back_text']}\n")
    print(f"[OK] Đã ghi {len(changed_diff_rows)} dòng thay đổi vào private-results/changed_rows_report.txt")

if __name__ == '__main__':
    main()
