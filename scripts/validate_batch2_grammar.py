import csv
import re

summary_file = 'private-results/card_meaning_drafts_batch2_summary_review.csv'

with open(summary_file, 'r', encoding='utf-8-sig') as fp:
    rows = list(csv.DictReader(fp))

print(f"Tổng số dòng kiểm tra: {len(rows)}")

# Danh sách từ đa loại từ / mơ hồ cao cần cảnh báo (Mục 4)
AMBIGUOUS_MULTI_POS = {
    'crush', 'sack', 'craft', 'backup', 'burst', 'swallow', 'soak', 'tap', 'lap'
}

violations = []
ambiguous_found = []

for r in rows:
    w = r['front_text'].strip()
    w_low = w.lower()
    pos = r['proposed_part_of_speech'].strip().lower()
    meaning = r['proposed_back_text'].strip()
    
    # 1. Bắt các từ đa loại từ trong mục 4
    if w_low in AMBIGUOUS_MULTI_POS:
        ambiguous_found.append((r['card_id'], w, pos, meaning))
        
    # 2. Kiểm tra danh từ (n):
    # Nếu là danh từ mà mang sắc thái tính từ trần trụi (ví dụ: courtesy -> "Lịch sự")
    if pos == 'n':
        # Bắt trường hợp nghĩa bắt đầu hoặc chỉ là tính từ trần trụi không có "Sự/Phép/Tính"
        if w_low == 'courtesy' and not any(kw in meaning for kw in ['Sự', 'Phép', 'cử chỉ']):
            violations.append((r['card_id'], w, pos, meaning, "Danh từ nhưng dịch như tính từ (thiếu Sự/Phép)"))
        if w_low == 'backup' and not any(kw in meaning for kw in ['Bản', 'Sự', 'Dự phòng']):
            violations.append((r['card_id'], w, pos, meaning, "Danh từ nhưng dịch thành động từ 'Hỗ trợ'"))
            
    # 3. Kiểm tra tính từ (adj):
    if pos == 'adj':
        if w_low == 'philosophical' and not any(kw in meaning for kw in ['Thuộc', 'Mang tính', 'triết lý']):
            violations.append((r['card_id'], w, pos, meaning, "Tính từ nhưng dịch thành danh từ 'Triết học'"))
        if w_low == 'fake' and 'hàng giả' in meaning.lower():
            violations.append((r['card_id'], w, pos, meaning, "Tính từ nhưng chứa nghĩa danh từ 'hàng giả'"))
            
    # 4. Kiểm tra động từ (v):
    if pos == 'v':
        if w_low == 'crush' and ('người' in meaning.lower() or 'thích' in meaning.lower()):
            violations.append((r['card_id'], w, pos, meaning, "Động từ nhưng dịch thành danh từ 'Người mình thích'"))
        if w_low == 'sack' and meaning == 'Bao':
            violations.append((r['card_id'], w, pos, meaning, "Động từ nhưng dịch thành danh từ 'Bao'"))
        if w_low == 'craft' and 'thủ công' in meaning.lower():
            violations.append((r['card_id'], w, pos, meaning, "Động từ nhưng dịch thành danh từ/tính từ 'Thủ công'"))
        if w_low == 'enquire' and not any(kw in meaning for kw in ['Hỏi', 'Yêu cầu', 'thông tin']):
            violations.append((r['card_id'], w, pos, meaning, "Động từ enquire chưa đủ chuẩn"))

print(f"\n[TRƯỚC KHI SỬA] Số vi phạm phát hiện về phạm trù ngữ pháp: {len(violations)}")
for v in violations:
    print(f" - Card {v[0]}: {v[1]} ({v[2]}) -> '{v[3]}' | Lý do: {v[4]}")

print(f"\n[TRƯỚC KHI SỬA] Các từ đa loại từ (Mục 4) đang có trong Lô 2: {len(ambiguous_found)}")
for a in ambiguous_found:
    print(f" - Card {a[0]}: {a[1]} ({a[2]}) -> '{a[3]}'")
