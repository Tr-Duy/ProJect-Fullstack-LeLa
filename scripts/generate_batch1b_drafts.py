"""
Batch 1b: 3 bộ thẻ Other (NUMBERS, FAMILY, FOOD) — cần TẠO MỚI thẻ, không sửa placeholder.
CSV format khác batch1: không có card_id (thẻ mới), có trường action=CREATE.
"""
import csv, os

OUTPUT = 'private-results/card_meaning_drafts_batch1b.csv'
fieldnames = ['card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
              'proposed_back_text','proposed_part_of_speech','confidence','note','approved']

# Các thẻ hiện có (để không trùng nghĩa)
existing = {
    8: ['Số một', 'Số hai', 'Số ba', 'Số bốn', 'Số năm'],
    9: ['Bố / Cha', 'Mẹ', 'Anh/em trai', 'Chị/em gái', 'Em bé'],
    10: ['Bánh mì', 'Cơm / Gạo', 'Thịt', 'Nước', 'Sữa'],
}

drafts = [
    # --- DECK-NUMBERS (deck_id=8): cần 3 thẻ ---
    {
        'card_id': 'NEW_8_1',
        'deck_id': 8, 'deck_name': 'Số đếm (Numbers)',
        'front_text': 'Six',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Số sáu',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Số đếm cơ bản, cùng phong cách One=Số một.',
        'approved': '',
    },
    {
        'card_id': 'NEW_8_2',
        'deck_id': 8, 'deck_name': 'Số đếm (Numbers)',
        'front_text': 'Seven',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Số bảy',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Số đếm cơ bản.',
        'approved': '',
    },
    {
        'card_id': 'NEW_8_3',
        'deck_id': 8, 'deck_name': 'Số đếm (Numbers)',
        'front_text': 'Eight',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Số tám',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Số đếm cơ bản.',
        'approved': '',
    },
    # --- DECK-FAMILY (deck_id=9): cần 3 thẻ ---
    {
        'card_id': 'NEW_9_1',
        'deck_id': 9, 'deck_name': 'Gia đình (Family)',
        'front_text': 'Grandfather',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Ông nội / Ông ngoại',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Từ gia đình cơ bản; phong cách tương tự Father=Bố/Cha.',
        'approved': '',
    },
    {
        'card_id': 'NEW_9_2',
        'deck_id': 9, 'deck_name': 'Gia đình (Family)',
        'front_text': 'Grandmother',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Bà nội / Bà ngoại',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Từ gia đình cơ bản.',
        'approved': '',
    },
    {
        'card_id': 'NEW_9_3',
        'deck_id': 9, 'deck_name': 'Gia đình (Family)',
        'front_text': 'Child',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Con, đứa trẻ',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Phổ biến trong tiếng Anh gia đình; khác Baby (Em bé) đã có.',
        'approved': '',
    },
    # --- DECK-FOOD (deck_id=10): cần 3 thẻ ---
    {
        'card_id': 'NEW_10_1',
        'deck_id': 10, 'deck_name': 'Đồ ăn (Food)',
        'front_text': 'Egg',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Trứng',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Thực phẩm cơ bản, phong cách nhất quán với Bread=Bánh mì.',
        'approved': '',
    },
    {
        'card_id': 'NEW_10_2',
        'deck_id': 10, 'deck_name': 'Đồ ăn (Food)',
        'front_text': 'Fish',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Cá',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Thực phẩm phổ biến.',
        'approved': '',
    },
    {
        'card_id': 'NEW_10_3',
        'deck_id': 10, 'deck_name': 'Đồ ăn (Food)',
        'front_text': 'Vegetable',
        'current_back_text': '(thẻ mới - chưa có trong DB)',
        'current_part_of_speech': '',
        'proposed_back_text': 'Rau củ',
        'proposed_part_of_speech': 'n',
        'confidence': 'HIGH',
        'note': 'Thực phẩm phổ biến; khác Meat=Thịt đã có.',
        'approved': '',
    },
]

# Validation
errors = []
from collections import defaultdict
deck_backs = defaultdict(set)
for d in drafts:
    b = d['proposed_back_text'].strip()
    f = d['front_text'].strip()
    did = d['deck_id']
    if not b: errors.append(f"{d['front_text']}: back trống")
    if len(b) > 80: errors.append(f"{d['front_text']}: back quá 80 ký ({len(b)})")
    if f.lower() in b.lower(): errors.append(f"{d['front_text']}: back chứa front!")
    if b.lower() in [x.lower() for x in existing.get(did, [])]:
        errors.append(f"{d['front_text']}: back trùng với thẻ hiện có!")
    if b in deck_backs[did]:
        errors.append(f"{d['front_text']}: back trùng trong cùng bộ!")
    deck_backs[did].add(b)

if errors:
    print('LỖI:', errors)
else:
    print('Validation OK: 0 vi phạm.')

os.makedirs('private-results', exist_ok=True)
with open(OUTPUT, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(drafts)

print(f'\nĐã xuất {len(drafts)} dòng vào {OUTPUT}')
print('\n15 dòng mẫu:')
for i, d in enumerate(drafts):
    print(f'  {i+1}. [{d["deck_id"]}] {d["front_text"]!r} -> {d["proposed_back_text"]!r} ({d["proposed_part_of_speech"]}) [{d["confidence"]}]')
    print(f'     note: {d["note"]}')
print('\nGHI CHÚ QUAN TRỌNG:')
print('  batch1b chứa 9 thẻ MỚI CẦN TẠO (action=CREATE), KHÔNG phải sửa placeholder.')
print('  Script apply_card_meaning_drafts.py hiện tại chỉ UPDATE existing cards.')
print('  Cần script riêng để INSERT các thẻ mới (sẽ làm sau khi người dùng duyệt).')
