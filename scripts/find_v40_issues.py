import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

v40_cards = [c for c in cards if 2001 <= c['deck_id'] <= 2050]
for c in v40_cards:
    b = c['back_text']
    # Check for English words in back_text
    words = re.findall(r'[a-zA-Z]+', b)
    en_words = [w for w in words if w.lower() not in ['m', 'km', 'kg', 'g', 'usd', 'vnd', 'id']]
    # Filter out common tone-less words:
    en_real = [w for w in en_words if w.lower() in [
        'contract', 'board', 'room', 'email', 'phone', 'call', 'party', 'letter',
        'office', 'team', 'service', 'meeting', 'project', 'plan', 'time', 'work',
        'staff', 'boss', 'job', 'tour', 'bus', 'car', 'ticket', 'flight', 'hotel'
    ]]
    if en_real or '/' in b or (c['part_of_speech'] == 'v' and b.startswith('sự')) or (c['part_of_speech'] == 'n' and b.startswith('bị')):
        print(f"{c['id']} | {c['front_text']} | {c['part_of_speech']} | {c['back_text']}")
