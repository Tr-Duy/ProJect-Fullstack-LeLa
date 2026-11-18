import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

other_cards = [c for c in cards if not (19 <= c['deck_id'] <= 73) and not (2001 <= c['deck_id'] <= 2050)]
print(f"Other cards count: {len(other_cards)}")

other_issues = []
for c in other_cards:
    f = c['front_text'].strip()
    b = c['back_text'].strip()
    p = (c.get('part_of_speech') or '').strip().lower()

    reasons = []
    if '/' in b:
        reasons.append("Dùng dấu gạch chéo '/'")
    if f.lower() in b.lower() and len(f) > 2:
        reasons.append("Chứa front_text trong nghĩa")
    if p in ['v', 'verb'] and re.match(r'^(sự|cuộc|nỗi|niềm)\s+', b, re.I):
        reasons.append("Động từ nhưng mang nghĩa danh từ")
    if p in ['n', 'noun'] and re.match(r'^(được|bị|thuộc về)\s+', b, re.I):
        reasons.append("Danh từ nhưng mang nghĩa tính từ/bị động")
    if re.search(r'\([a-zA-Z\s,]+\)', b):
        reasons.append("Chứa chú thích tiếng Anh trong ngoặc")

    if reasons:
        other_issues.append((c, "; ".join(reasons)))

print(f"Other cards with issues: {len(other_issues)}")
for c, r in other_issues:
    print(f"{c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']} -> {r}")
