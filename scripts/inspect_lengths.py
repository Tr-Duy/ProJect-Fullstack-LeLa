import json

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# Let's inspect cards where back_text is very short (1 word) or very long (> 40 chars)
short_cards = [c for c in cards if len(c['back_text'].strip()) <= 4]
long_cards = [c for c in cards if len(c['back_text'].strip()) >= 40]

print(f"Short back_text cards ({len(short_cards)}):")
for c in short_cards:
    print(f"  {c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']}")

print(f"\nLong back_text cards ({len(long_cards)}):")
for c in long_cards[:15]:
    print(f"  {c['id']} | {c['front_text']} ({c['part_of_speech']}) | {c['back_text']}")
