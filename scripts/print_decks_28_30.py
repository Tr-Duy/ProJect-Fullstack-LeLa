import json

with open("private-results/cards_22_36_dump.json", "r", encoding="utf-8") as fp:
    cards = json.load(fp)

for c in cards:
    if c['deck_id'] in (28, 29, 30):
        print(f"Deck {c['deck_id']} [{c['card_id']}] {c['front_text']} ({c['part_of_speech']}): {c['back_text']}")
