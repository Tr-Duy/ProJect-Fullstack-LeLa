import json

with open("private-results/cards_22_36_dump.json", "r", encoding="utf-8") as fp:
    cards = json.load(fp)

current_deck = None
for c in cards:
    if c['deck_id'] != current_deck:
        current_deck = c['deck_id']
        print(f"\n=== DECK {current_deck}: {c['deck_title']} ===")
    print(f"[{c['card_id']}] {c['front_text']} ({c['part_of_speech']}): {c['back_text']}")
