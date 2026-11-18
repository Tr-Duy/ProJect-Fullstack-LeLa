import csv
import re

with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

print(f"Tổng số dòng: {len(rows)}")

NOUN_ABSTRACT_SUFFIXES = ('tion', 'ment', 'ness', 'ity', 'ance', 'ence', 'ship', 'sion')
VALID_NOUN_PREFIXES = ('sự', 'việc', 'tính', 'quyền', 'cuộc', 'bản', 'người', 'mối', 'khoản', 'đợt', 'nỗi', 'phép', 'niềm', 'biện pháp', 'bước', 'lòng')

ADJ_SUFFIXES = ('al', 'ic', 'ary', 'ive')
VALID_ADJ_PREFIXES = ('thuộc', 'mang tính', 'có tính', 'được', 'có', 'bị', 'đầy', 'rất', 'không', 'chưa', 'dễ', 'khó', 'đáng', 'gây')

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
            # Check if starts with any valid noun prefix
            first_lower = first_part.lower()
            if not any(first_lower.startswith(pfx) for pfx in VALID_NOUN_PREFIXES):
                noun_violations.append((cid, w, pos, back))

    # (c) Tính từ đuôi -al/-ic/-ary/-ive nghĩa trần là danh từ (không bắt đầu bằng tính từ bổ nghĩa)
    if pos == 'adj':
        if any(w.lower().endswith(sfx) for sfx in ADJ_SUFFIXES):
            first_lower = first_part.lower()
            # If it's a bare noun meaning like "Quốc hội", "Thẩm mỹ", "Tiến hóa", "Vận hành", "Cha mẹ", "Lập pháp", "Bộ lạc", "Thể chế", "Tư pháp", "Thống kê", "Chiến lược", "Bảo vệ"
            if not any(first_lower.startswith(pfx) for pfx in VALID_ADJ_PREFIXES):
                # Also filter obvious pure adjectives like "rõ ràng", "chính xác", "phức tạp", "lớn", "nhỏ"
                # But flag those identified in Nhóm B
                adj_violations.append((cid, w, pos, back))

    # (d) Nghĩa quá ngắn (<= 3 ký tự) hoặc chỉ 1 từ đơn không rõ nghĩa
    # Meaning <= 3 chars (e.g. "Ao", "Đá", "Ra", "Hai", "Vá", "Câm", "Gói", "Chỗ")
    if len(first_part) <= 3:
        short_violations.append((cid, w, pos, back))

print(f"\n--- VI PHẠM TRƯỚC KHI SỬA ---")
print(f"(a) Động từ có nghĩa bắt đầu bằng Sự/Việc/Người/Cái/Quầy/Tiền: {len(verb_violations)}")
for v in verb_violations:
    print(f"    {v[0]}|{v[1]}|{v[2]}|{v[3]}")

print(f"\n(b) Danh từ trừu tượng hậu tố -tion/-ment/-ness/-ity/-ance/-ence/-ship thiếu tiền tố 'Sự/Việc/...': {len(noun_violations)}")
for v in noun_violations:
    print(f"    {v[0]}|{v[1]}|{v[2]}|{v[3]}")

print(f"\n(c) Tính từ hậu tố -al/-ic/-ary/-ive nghĩa trần danh từ (thiếu Thuộc/Mang tính...): {len(adj_violations)}")
for v in adj_violations:
    print(f"    {v[0]}|{v[1]}|{v[2]}|{v[3]}")

print(f"\n(d) Nghĩa quá ngắn (<= 3 ký tự): {len(short_violations)}")
for v in short_violations:
    print(f"    {v[0]}|{v[1]}|{v[2]}|{v[3]}")

total_violations = len(verb_violations) + len(noun_violations) + len(adj_violations) + len(short_violations)
print(f"\n===> TỔNG SỐ VI PHẠM TRƯỚC KHI SỬA: {total_violations}")
