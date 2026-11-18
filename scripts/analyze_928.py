import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Total cards loaded: {len(cards)}")

# Check POS distribution
pos_dist = {}
for c in cards:
    p = c.get('part_of_speech', '')
    pos_dist[p] = pos_dist.get(p, 0) + 1
print("POS distribution in 928 cards:", pos_dist)

# Sample some cards to examine format and patterns
for c in cards[:15]:
    print(f"{c['id']} | {c['front_text']} | {c['part_of_speech']} | {c['back_text']}")
