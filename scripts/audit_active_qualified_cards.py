import os, pymysql, re, json

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password=os.environ.get('DB_PASSWORD', ''), database='lela_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

def extract_senses(back):
    if not back: return set()
    parts = re.split(r'[,;]', back)
    senses = set()
    for p in parts:
        clean = re.sub(r'[\(\)\[\]\.!?"\'~/|`]', ' ', p.lower()).strip()
        clean = re.sub(r'\s+', ' ', clean)
        if clean: senses.add(clean)
    return senses

# 1. Identify 166 qualified decks
cur.execute("""
    SELECT f.id, f.deck_id, f.front_text, f.back_text, f.part_of_speech, f.is_active, f.deleted_at
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE d.is_active = 1 AND d.deleted_at IS NULL
    ORDER BY f.deck_id, f.id
""")
all_cards = cur.fetchall()

cards_by_deck = {}
for c in all_cards:
    cards_by_deck.setdefault(c['deck_id'], []).append(c)

qualified_deck_ids = set()
valid_cards_map = {}

for did, dcards in cards_by_deck.items():
    seen_fronts = set()
    valid_list = []
    for c in dcards:
        if c['is_active'] == 1 and c['deleted_at'] is None:
            fn = c['front_text'].lower().strip() if c['front_text'] else ''
            bk = c['back_text'].strip() if c['back_text'] else ''
            if fn and bk and len(fn) > 1 and len(bk) > 1 and 'từ vựng thuộc nhóm' not in bk and 'đang cập nhật' not in bk:
                # check POS annotations and garbage suffixes
                if not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', bk, re.I) and not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', fn, re.I):
                    if not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', bk, re.I) and not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', fn, re.I):
                        if not re.match(r'.*[<>={}].*', bk):
                            if fn not in seen_fronts:
                                seen_fronts.add(fn)
                                valid_list.append(c)
    if len(valid_list) >= 8:
        qualified_deck_ids.add(did)
        valid_cards_map[did] = valid_list

print(f"Qualified decks count: {len(qualified_deck_ids)}")
total_valid_cards = sum(len(v) for v in valid_cards_map.values())
print(f"Total valid cards in qualified decks: {total_valid_cards}")

# Now run the 6 audit checks on all valid cards of qualified decks
group_i = []
pos_tokens = {'adj', 'adj.', 'adv', 'adv.', 'gerund', 'v.', 'v', 'n.', 'n'}

group_ii = []
group_iii = []
group_iv = []
group_v = []
group_vi = []

for did in sorted(qualified_deck_ids):
    dcards = valid_cards_map[did]
    for c in dcards:
        front = c['front_text'].strip() if c['front_text'] else ''
        back = c['back_text'].strip() if c['back_text'] else ''
        pos = (c['part_of_speech'] or '').strip().lower()
        words = front.split()
        
        # (i) front_text bất thường
        is_abnormal = False
        reasons = []
        if len(front) > 40:
            is_abnormal = True; reasons.append("len > 40")
        if len(words) > 4:
            is_abnormal = True; reasons.append("words > 4")
        if len(words) > 1:
            for w in words[1:]:
                wc = re.sub(r'[\(\)\[\],;]', '', w.lower())
                if wc in pos_tokens:
                    is_abnormal = True; reasons.append(f"token '{w}'")
                    break
        if is_abnormal:
            group_i.append((c['id'], did, front, pos, back, reasons))
            
        # (ii) back bắt đầu bằng "Sự" nhưng pos là adj/v/adv
        if back.startswith("Sự ") or back.startswith("sự "):
            if pos in ['adj', 'adjective', 'v', 'verb', 'adv', 'adverb']:
                group_ii.append((c['id'], did, front, pos, back))
                
        # (iii) pos là v nhưng back bắt đầu bằng "Sự"/"Người"
        if pos in ['v', 'verb']:
            if back.startswith("Sự ") or back.startswith("sự ") or back.startswith("Người ") or back.startswith("người "):
                group_iii.append((c['id'], did, front, pos, back))
                
        # (iv) back < 3 ký tự hoặc > 60 ký tự
        if len(back) < 3 or len(back) > 60:
            group_iv.append((c['id'], did, front, pos, back, len(back)))
            
        # (vi) pos không chuẩn
        standard_pos = {'n', 'v', 'adj', 'adv', 'phr', 'prep', 'conj', 'pron', 'interj'}
        if pos not in standard_pos:
            group_vi.append((c['id'], did, front, pos, back))

    # (v) trùng phân đoạn nghĩa trong cùng bộ
    for i in range(len(dcards)):
        s_i = extract_senses(dcards[i]['back_text'])
        for j in range(i + 1, len(dcards)):
            s_j = extract_senses(dcards[j]['back_text'])
            common = s_i.intersection(s_j)
            if common:
                group_v.append((did, dcards[i]['id'], dcards[i]['front_text'], dcards[j]['id'], dcards[j]['front_text'], list(common)))

print(f"Group (i) count: {len(group_i)}")
print(f"Group (ii) count: {len(group_ii)}")
print(f"Group (iii) count: {len(group_iii)}")
print(f"Group (iv) count: {len(group_iv)}")
print(f"Group (v) count: {len(group_v)}")
print(f"Group (vi) count: {len(group_vi)}")
