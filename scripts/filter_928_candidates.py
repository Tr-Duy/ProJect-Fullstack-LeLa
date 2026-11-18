import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# Let's inspect potential candidates for group A (proposal to edit)
# We can check:
# 1. POS mismatch:
#    - pos is 'v' or 'verb', but back_text starts with 'Sự ', 'Cuộc ', 'Nỗi ', 'Niềm '
#    - pos is 'n' or 'noun', but back_text starts with 'Làm cho', 'Gây ra', 'Mang lại', or lacks noun sense
#    - pos is 'adj' or 'adjective', but back_text is purely a noun or verb
# 2. English words in Vietnamese meaning (like loanwords or parenthetical hints)
# 3. Phrasing issues

candidates_A = []
candidates_B = []

for c in cards:
    cid = c['id']
    f = c['front_text'].strip()
    b = c['back_text'].strip()
    p = (c.get('part_of_speech') or '').strip().lower()

    reasons = []

    # Check for English characters in back_text
    en_words = re.findall(r'[a-zA-Z]{3,}', b)
    # Exclude common Vietnamese words without diacritics if any, or known words
    # but English words in back_text is often a sign of English note like (something)
    if any(w.lower() not in ['vietnam', 'covid', 'internet', 'radio', 'tv', 'laser', 'radar'] for w in en_words):
        # check if it's actually english
        has_en = False
        for w in en_words:
            if re.match(r'^[a-zA-Z]+$', w) and not re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', w, re.I):
                if len(w) >= 3 and w.lower() not in ['con', 'qua', 'hoa', 'cay', 'nha', 'ban', 'cho', 'meo', 'cam', 'nho', 'trai', 'den', 'trang', 'xanh', 'vang', 'mot', 'hai', 'sau', 'bay', 'tam', 'ong', 'cha', 'anh', 'com', 'gao', 'thit', 'nuoc', 'sua', 'banh', 'nam']:
                    has_en = True
                    break
        if has_en:
            reasons.append("Chứa từ/chú thích tiếng Anh trong nghĩa")

    # POS vs meaning mismatch
    if p in ['v', 'verb']:
        if re.match(r'^(sự|cuộc|nỗi|niềm|đồ|người|vật)\s+', b, re.I):
            reasons.append("Lệch loại từ (động từ nhưng nghĩa bắt đầu bằng từ loại danh từ)")
    elif p in ['n', 'noun']:
        if re.match(r'^(được|bị|mang tính|thuộc về)\s+', b, re.I):
            reasons.append("Lệch loại từ (danh từ nhưng mang hình thái tính từ)")
    elif p in ['adj', 'adjective']:
        if re.match(r'^(sự|cuộc|nỗi|niềm)\s+', b, re.I):
            reasons.append("Lệch loại từ (tính từ nhưng nghĩa là danh từ)")

    # Front text in back text
    if f.lower() in b.lower():
        reasons.append("Lộ từ tiếng Anh trong nghĩa (chứa front_text)")

    if reasons:
        candidates_A.append((c, "; ".join(reasons)))
    else:
        candidates_B.append(c)

print(f"Initial heuristic: Candidates A: {len(candidates_A)}, Candidates B: {len(candidates_B)}")
for c, r in candidates_A[:25]:
    print(f"{c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']} -> Lý do: {r}")
