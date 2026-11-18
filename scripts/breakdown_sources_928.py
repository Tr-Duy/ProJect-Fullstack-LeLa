import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# Let's inspect by migration source
sources = {'V33_toeic': [], 'V38_oxford': [], 'V40_ielts': [], 'V5_basic': [], 'other': []}
for c in cards:
    did = c['deck_id']
    if 19 <= did <= 73:
        sources['V33_toeic'].append(c)
    elif 1001 <= did <= 1100:
        sources['V38_oxford'].append(c)
    elif 2001 <= did <= 2050:
        sources['V40_ielts'].append(c)
    elif did in [1, 2, 3]:
        sources['V5_basic'].append(c)
    else:
        sources['other'].append(c)

print("Source counts:")
for k, v in sources.items():
    print(f"  {k}: {len(v)}")
