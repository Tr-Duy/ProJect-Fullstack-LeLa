"""
Sinh draft CSV cho Lô 1 - các bộ chỉ cần thêm vài thẻ để đủ 8 (4 bộ Oxford TOEIC L2).
Chỉ soạn số lượng thẻ cần thiết, chọn các từ phù hợp nhất với ngữ cảnh TOEIC văn phòng.
Không ghi vào DB.
"""
import pymysql, os, csv, re, unicodedata
from datetime import datetime

DB_PWD = os.environ.get('DB_PASSWORD', '123456')
OUTPUT = 'private-results/card_meaning_drafts_batch1.csv'

def normalize(text):
    if text is None: text = ''
    return unicodedata.normalize('NFC', text).lower().strip()

def is_placeholder(back_text):
    bk = normalize(back_text or '')
    return 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=DB_PWD, database='lela_db')
cur = conn.cursor(pymysql.cursors.DictCursor)

# Load all cards for the 4 target decks
target_decks = {
    1001: 'Oxford 5000 - TOEIC 500-700 - Office & Administration #01',
    1010: 'Oxford 5000 - TOEIC 500-700 - Finance & Accounting #01',
    1016: 'Oxford 5000 - TOEIC 500-700 - Health & Medicine #01',
    1020: 'Oxford 5000 - TOEIC 500-700 - Marketing & Sales #01',
}

# How many valid cards each deck has
deck_valid_count = {}
for did in target_decks:
    cur.execute('SELECT back_text FROM flashcards WHERE deck_id=%s AND is_active=1 AND deleted_at IS NULL', (did,))
    rows = cur.fetchall()
    deck_valid_count[did] = sum(1 for r in rows if not is_placeholder(r['back_text']))

needs = {did: max(0, 8 - deck_valid_count[did]) for did in target_decks}
print('Needs per deck:', needs)

# Load placeholder cards for each deck
deck_placeholders = {}
for did in target_decks:
    cur.execute(
        'SELECT id, deck_id, front_text, back_text, part_of_speech FROM flashcards '
        'WHERE deck_id=%s AND is_active=1 AND deleted_at IS NULL ORDER BY id',
        (did,)
    )
    deck_placeholders[did] = [r for r in cur.fetchall() if is_placeholder(r['back_text'])]

conn.close()

# ============================================================
# Manual meaning drafts (nghĩa tiếng Việt, phong cách TOEIC)
# Quy tắc:
# - Ngắn gọn, 2-3 nghĩa phổ biến nhất trong ngữ cảnh TOEIC
# - Không ghi "(động từ)" trong nghĩa
# - Không sao chép từ điển có bản quyền
# - Nếu không chắc → LOW confidence + ghi note
# ============================================================

# Mỗi mục: (front_text, proposed_back_text, proposed_pos, confidence, note)
# pos: sửa lại từ DB nếu DB sai (ví dụ 'barely' bị ghi là 'v' thay vì 'adv')

deck_drafts = {

    # ---- Deck 1001: Office & Administration #01 (cần 2 thẻ) ----
    # Chọn 2 từ phù hợp nhất với chủ đề văn phòng: consultant, convenience
    1001: [
        {
            'front_text': 'consultant',
            'proposed_back_text': 'Nhà tư vấn, chuyên gia tư vấn',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Từ phổ biến trong TOEIC Part 7 (Business Correspondence); cùng ngữ cảnh với bộ Office & Administration.',
        },
        {
            'front_text': 'convenience',
            'proposed_back_text': 'Sự tiện lợi, thuận tiện',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Xuất hiện thường xuyên trong TOEIC (at your convenience = khi thuận tiện).',
        },
    ],

    # ---- Deck 1010: Finance & Accounting #01 (cần 2 thẻ) ----
    # Chọn: awareness, deposit — phù hợp nhất với Finance
    1010: [
        {
            'front_text': 'awareness',
            'proposed_back_text': 'Nhận thức, sự hiểu biết',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Phổ biến trong TOEIC Finance: brand awareness, risk awareness.',
        },
        {
            'front_text': 'deposit',
            'proposed_back_text': 'Tiền đặt cọc; tiền gửi ngân hàng',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'DB ghi pos=n, nghĩa danh từ trong tài chính. Cũng dùng như động từ nhưng ngữ cảnh bộ Finance dùng danh từ.',
        },
    ],

    # ---- Deck 1016: Health & Medicine #01 (cần 4 thẻ) ----
    # Chọn: considerable, consumption, cope, dealer
    1016: [
        {
            'front_text': 'considerable',
            'proposed_back_text': 'Đáng kể, quan trọng',
            'proposed_part_of_speech': 'adj',
            'confidence': 'HIGH',
            'note': 'Tính từ phổ biến TOEIC: considerable amount, considerable effort.',
        },
        {
            'front_text': 'consumption',
            'proposed_back_text': 'Sự tiêu thụ, lượng tiêu thụ',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Phổ biến trong TOEIC Health & Environment: energy consumption, food consumption.',
        },
        {
            'front_text': 'cope',
            'proposed_back_text': 'Đương đầu, xử lý (tình huống khó)',
            'proposed_part_of_speech': 'v',
            'confidence': 'HIGH',
            'note': 'cope with = đương đầu với — rất phổ biến trong TOEIC.',
        },
        {
            'front_text': 'dependent',
            'proposed_back_text': 'Phụ thuộc, lệ thuộc',
            'proposed_part_of_speech': 'adj',
            'confidence': 'HIGH',
            'note': 'dependent on = phụ thuộc vào. DB pos=adj đúng. Phổ biến trong TOEIC Health.',
        },
    ],

    # ---- Deck 1020: Marketing & Sales #01 (cần 3 thẻ) ----
    # Chọn: convention, donation, evaluation
    1020: [
        {
            'front_text': 'convention',
            'proposed_back_text': 'Hội nghị, đại hội; thông lệ, quy ước',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Hai nghĩa đều phổ biến trong TOEIC Marketing: annual convention (hội nghị hàng năm), convention hall.',
        },
        {
            'front_text': 'donation',
            'proposed_back_text': 'Sự quyên góp, khoản đóng góp',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Phổ biến trong TOEIC Marketing & CSR (Corporate Social Responsibility).',
        },
        {
            'front_text': 'evaluation',
            'proposed_back_text': 'Sự đánh giá, kết quả đánh giá',
            'proposed_part_of_speech': 'n',
            'confidence': 'HIGH',
            'note': 'Rất phổ biến trong TOEIC: performance evaluation, product evaluation.',
        },
    ],
}

# ============================================================
# Validation nội bộ trước khi xuất
# ============================================================
errors = []
for did, drafts in deck_drafts.items():
    proposed_backs = [d['proposed_back_text'].lower().strip() for d in drafts]
    # 1. Không trùng proposed_back với nhau trong cùng bộ
    if len(proposed_backs) != len(set(proposed_backs)):
        errors.append(f'Deck {did}: proposed_back trùng nhau!')
    for d in drafts:
        back = d['proposed_back_text'].strip()
        # 2. Không để trống
        if not back:
            errors.append(f'Deck {did} {d["front_text"]}: proposed_back trống!')
        # 3. Không chứa front_text (không giải nghĩa bằng chính từ)
        if d['front_text'].lower() in back.lower():
            errors.append(f'Deck {did} {d["front_text"]}: back chứa chính front_text!')
        # 4. Không quá 80 ký tự
        if len(back) > 80:
            errors.append(f'Deck {did} {d["front_text"]}: back quá 80 ký tự ({len(back)})')

if errors:
    print('LỖI VALIDATION:')
    for e in errors: print(' ', e)
else:
    print('Validation OK: 0 vi phạm.')

# ============================================================
# Xuất CSV
# ============================================================
# Build rows — map front_text to card_id from DB
card_id_map = {}
for did, placeholders in deck_placeholders.items():
    for card in placeholders:
        card_id_map[(did, card['front_text'].lower().strip())] = (card['id'], card['back_text'], card['part_of_speech'])

rows = []
for did, drafts in deck_drafts.items():
    for d in drafts:
        key = (did, d['front_text'].lower().strip())
        if key not in card_id_map:
            print(f'WARNING: card not found in DB: deck={did}, front={d["front_text"]!r}')
            continue
        card_id, current_back, current_pos = card_id_map[key]
        rows.append({
            'card_id': card_id,
            'deck_id': did,
            'deck_name': target_decks[did],
            'front_text': d['front_text'],
            'current_back_text': current_back,
            'current_part_of_speech': current_pos,
            'proposed_back_text': d['proposed_back_text'],
            'proposed_part_of_speech': d['proposed_part_of_speech'],
            'confidence': d['confidence'],
            'note': d['note'],
            'approved': '',
        })

os.makedirs('private-results', exist_ok=True)
fieldnames = ['card_id','deck_id','deck_name','front_text','current_back_text','current_part_of_speech',
              'proposed_back_text','proposed_part_of_speech','confidence','note','approved']
with open(OUTPUT, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f'\nĐã xuất {len(rows)} dòng vào {OUTPUT}')
print(f'Phân theo confidence:')
for conf in ('HIGH', 'MEDIUM', 'LOW'):
    cnt = sum(1 for r in rows if r['confidence'] == conf)
    if cnt: print(f'  {conf}: {cnt}')

print('\nSố bộ sẽ đạt >=8 nếu duyệt hết:')
for did, drafts in deck_drafts.items():
    new_total = deck_valid_count[did] + len(drafts)
    print(f'  Deck {did}: {deck_valid_count[did]} -> {new_total} valid cards {"✓ >=8" if new_total >= 8 else "✗"}')

print('\n15 dòng mẫu:')
for i, r in enumerate(rows[:15]):
    print(f'  {i+1}. id={r["card_id"]} [{r["deck_id"]}] {r["front_text"]!r} -> {r["proposed_back_text"]!r} ({r["proposed_part_of_speech"]}) [{r["confidence"]}]')
    print(f'     note: {r["note"][:80]}')
