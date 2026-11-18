import csv

target_words = {
    'plea': 'Lời bào chữa; lời van xin',
    'terror': 'Nỗi kinh hoàng, sự khiếp sợ',
    'spite': 'Sự hằn học, ác ý',
    'accordance': 'Sự phù hợp, sự tuân theo',
    'placement': 'Sự bố trí, sự sắp xếp',
    'specialized': 'Chuyên biệt, chuyên môn hóa',
    'bail': 'Tiền bảo lãnh',
    'swallow': 'Nuốt',
    'mortgage': 'Khoản vay thế chấp'
}

with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

found = {}
for r in rows:
    w = r['front_text'].strip().lower()
    if w in target_words:
        found[w] = r
        print(f"card_id={r['card_id']} | deck_id={r['deck_id']} | word={r['front_text']} | pos={r['proposed_part_of_speech']} | current_proposed='{r['proposed_back_text']}' | REQUIRED='{target_words[w]}'")

print(f"Found {len(found)} / {len(target_words)} target words.")
