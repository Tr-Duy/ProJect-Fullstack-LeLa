import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# True english words in parentheses or notes
true_en_pattern = re.compile(r'\b(to|of|in|for|with|about|by|on|at|from|sb|sth|someone|something|adj|adv|noun|verb)\b', re.IGNORECASE)

issues = []
for c in cards:
    cid = c['id']
    front = c['front_text'].strip()
    back = c['back_text'].strip()
    pos = (c.get('part_of_speech') or '').strip().lower()

    reasons = []

    # Check for English notes or front_text inside back_text
    if front.lower() in back.lower() and len(front) > 2:
        reasons.append("Lộ từ tiếng Anh trong nghĩa (chứa front_text)")

    if true_en_pattern.search(back):
        reasons.append("Chứa chú thích ngữ pháp/tiếng Anh trong nghĩa")

    # Verb with noun prefix
    if pos in ['v', 'verb'] and re.match(r'^(sự|cuộc|nỗi|niềm|đồ|vật|chỗ|nơi)\s+', back, re.I):
        reasons.append("Lệch loại từ (động từ nhưng nghĩa bắt đầu bằng danh từ)")

    # Noun with adjective/verb prefix
    if pos in ['n', 'noun'] and re.match(r'^(được|bị|mang tính|có tính|thuộc về)\s+', back, re.I):
        reasons.append("Lệch loại từ (danh từ nhưng nghĩa là tính từ/bị động)")

    # Adj with noun prefix
    if pos in ['adj', 'adjective'] and re.match(r'^(sự|cuộc|nỗi|niềm)\s+', back, re.I):
        reasons.append("Lệch loại từ (tính từ nhưng nghĩa là danh từ)")

    # Slash or weird punctuation in back_text
    if '/' in back:
        reasons.append("Dùng dấu gạch chéo '/' thay vì dấu phẩy/chấm phẩy")

    if reasons:
        issues.append((c, "; ".join(reasons)))

print(f"Total cards with apparent issues: {len(issues)}")
for c, r in issues[:30]:
    print(f"{c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']} -> {r}")
