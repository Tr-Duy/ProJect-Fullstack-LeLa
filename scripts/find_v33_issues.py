import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

v33_cards = [c for c in cards if 19 <= c['deck_id'] <= 73]
print(f"V33 cards count: {len(v33_cards)}")

v33_issues = []
for c in v33_cards:
    f = c['front_text'].strip()
    b = c['back_text'].strip()
    p = (c.get('part_of_speech') or '').strip().lower()

    reasons = []
    # Front text in back text
    if f.lower() in b.lower() and len(f) > 2:
        reasons.append("Chứa front_text trong nghĩa")

    # POS vs meaning mismatch
    if p in ['v', 'verb'] and re.match(r'^(sự|cuộc|nỗi|niềm|đồ|vật|chỗ|nơi)\s+', b, re.I):
        reasons.append("Động từ nhưng nghĩa bắt đầu bằng danh từ (sự/cuộc...)")
    elif p in ['n', 'noun'] and re.match(r'^(làm cho|gây ra|thuộc về|mang tính)\s+', b, re.I):
        reasons.append("Danh từ nhưng mang hình thái động từ/tính từ")
    elif p in ['adj', 'adjective'] and re.match(r'^(sự|cuộc|nỗi|niềm)\s+', b, re.I):
        reasons.append("Tính từ nhưng nghĩa là danh từ (sự/cuộc...)")

    # Slashes
    if '/' in b:
        reasons.append("Dùng dấu gạch chéo '/'")

    # Check for English words in parentheses e.g. (sb), (sth), (to...)
    if re.search(r'\([a-zA-Z\s,]+\)', b):
        reasons.append("Chứa chú thích tiếng Anh trong ngoặc")

    if reasons:
        v33_issues.append((c, "; ".join(reasons)))

print(f"V33 cards with issues: {len(v33_issues)}")
for c, r in v33_issues[:35]:
    print(f"{c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']} -> {r}")
