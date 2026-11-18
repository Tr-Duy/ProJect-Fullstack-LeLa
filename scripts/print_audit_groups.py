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

cur.execute("""
    SELECT f.id, f.deck_id, d.title as deck_title, f.front_text, f.back_text, f.part_of_speech, f.is_active, f.deleted_at
    FROM flashcards f
    JOIN decks d ON f.deck_id = d.id
    WHERE d.is_active = 1 AND d.deleted_at IS NULL
    ORDER BY f.deck_id, f.id
""")
all_cards = cur.fetchall()

cards_by_deck = {}
for c in all_cards:
    cards_by_deck.setdefault(c['deck_id'], []).append(c)

valid_cards_map = {}
for did, dcards in cards_by_deck.items():
    seen_fronts = set()
    valid_list = []
    for c in dcards:
        if c['is_active'] == 1 and c['deleted_at'] is None:
            fn = c['front_text'].lower().strip() if c['front_text'] else ''
            bk = c['back_text'].strip() if c['back_text'] else ''
            if fn and bk and len(fn) > 1 and len(bk) > 1 and 'từ vựng thuộc nhóm' not in bk and 'đang cập nhật' not in bk:
                if not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', bk, re.I) and not re.match(r'.*\s+(?:ad|adv|adj|n|v)\.?$', fn, re.I):
                    if not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', bk, re.I) and not re.match(r'.*\s*\((?:a|adj|adv|n|v|prep|conj|pron)\.?\)\s*$', fn, re.I):
                        if not re.match(r'.*[<>={}].*', bk):
                            if fn not in seen_fronts:
                                seen_fronts.add(fn)
                                valid_list.append(c)
    if len(valid_list) >= 8:
        valid_cards_map[did] = valid_list

pos_tokens = {'adj', 'adj.', 'adv', 'adv.', 'gerund', 'v.', 'v', 'n.', 'n'}
standard_pos = {'n', 'v', 'adj', 'adv', 'phr', 'prep', 'conj', 'pron', 'interj'}

group_i = []
group_ii = []
group_iii = []
group_iv = []
group_v = []
group_vi = []

for did in sorted(valid_cards_map.keys()):
    dcards = valid_cards_map[did]
    for c in dcards:
        front = c['front_text'].strip() if c['front_text'] else ''
        back = c['back_text'].strip() if c['back_text'] else ''
        pos = (c['part_of_speech'] or '').strip().lower()
        words = front.split()
        
        # (i)
        is_abnormal = False
        reasons = []
        if len(front) > 40: is_abnormal = True; reasons.append(f"len={len(front)}>40")
        if len(words) > 4: is_abnormal = True; reasons.append(f"words={len(words)}>4")
        if len(words) > 1:
            for w in words[1:]:
                wc = re.sub(r'[\(\)\[\],;]', '', w.lower())
                if wc in pos_tokens:
                    is_abnormal = True; reasons.append(f"token='{w}'")
                    break
        if is_abnormal:
            group_i.append((c['id'], did, front, pos, back, reasons))
            
        # (ii)
        if back.startswith("Sự ") or back.startswith("sự "):
            if pos in ['adj', 'adjective', 'v', 'verb', 'adv', 'adverb']:
                group_ii.append((c['id'], did, front, pos, back))
                
        # (iii)
        if pos in ['v', 'verb']:
            if back.startswith("Sự ") or back.startswith("sự ") or back.startswith("Người ") or back.startswith("người "):
                group_iii.append((c['id'], did, front, pos, back))
                
        # (iv)
        if len(back) < 3 or len(back) > 60:
            group_iv.append((c['id'], did, front, pos, back, len(back)))
            
        # (vi)
        if pos not in standard_pos:
            group_vi.append((c['id'], did, front, pos, back))

    # (v)
    for i in range(len(dcards)):
        s_i = extract_senses(dcards[i]['back_text'])
        for j in range(i + 1, len(dcards)):
            s_j = extract_senses(dcards[j]['back_text'])
            common = s_i.intersection(s_j)
            if common:
                group_v.append((did, dcards[i]['id'], dcards[i]['front_text'], dcards[j]['id'], dcards[j]['front_text'], list(common)))

print("=== GROUP (i) ===")
for r in group_i: print(r)

print("\n=== GROUP (ii) ===")
for r in group_ii: print(r)

print("\n=== GROUP (iii) ===")
for r in group_iii: print(r)

print("\n=== GROUP (iv) ===")
for r in group_iv: print(r)

print("\n=== GROUP (v) ===")
for r in group_v: print(r)

print(f"\n=== GROUP (vi) total {len(group_vi)} ===")
for r in group_vi[:15]: print(r)
