import csv
import random

with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

# Collect LOW cards (33 cards)
low_cards = [r for r in rows if r['confidence'] == 'LOW']
high_cards = [r for r in rows if r['confidence'] == 'HIGH']
med_cards = [r for r in rows if r['confidence'] == 'MEDIUM']

# Sort LOW cards
low_cards.sort(key=lambda x: int(x['card_id']))

# Pick 17 from HIGH and 10 from MEDIUM to make a solid 60-row review pack
random.seed(42)
selected_high = random.sample(high_cards, min(17, len(high_cards)))
selected_med = random.sample(med_cards, min(10, len(med_cards)))

review_pack = low_cards + selected_high + selected_med

review_headers = ['card_id', 'deck_id', 'front_text', 'proposed_part_of_speech', 'proposed_back_text', 'example_en', 'example_vi', 'confidence', 'source', 'note']

with open('private-results/review_pack_v3.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=review_headers)
    writer.writeheader()
    for r in review_pack:
        writer.writerow({
            'card_id': r['card_id'],
            'deck_id': r['deck_id'],
            'front_text': r['front_text'],
            'proposed_part_of_speech': r['proposed_part_of_speech'],
            'proposed_back_text': r['proposed_back_text'],
            'example_en': r.get('example_en', ''),
            'example_vi': r.get('example_vi', ''),
            'confidence': r['confidence'],
            'source': r.get('source', ''),
            'note': r.get('note', '')
        })

print(f"review_pack_v3.csv written with {len(review_pack)} rows ({len(low_cards)} LOW, {len(selected_high)} HIGH, {len(selected_med)} MEDIUM).")
