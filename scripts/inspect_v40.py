import json

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

v40_cards = [c for c in cards if 2001 <= c['deck_id'] <= 2050]
print(f"V40 cards count: {len(v40_cards)}")
for c in v40_cards[:30]:
    print(f"{c['id']} | {c['front_text']} | {c['part_of_speech']} | {c['back_text']}")
