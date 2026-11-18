import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Total cards loaded: {len(cards)}")

# Let's see some samples across different decks
by_deck = {}
for c in cards:
    by_deck.setdefault(c['deck_id'], []).append(c)

print(f"Number of decks: {len(by_deck)}")
for did in sorted(by_deck.keys())[:10]:
    dc = by_deck[did]
    print(f"Deck {did} ({len(dc)} cards): {[c['front_text'] for c in dc[:5]]}")
