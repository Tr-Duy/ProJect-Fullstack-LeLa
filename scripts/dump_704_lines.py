import csv

with open('private-results/card_meaning_drafts_batch2_summary_review.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

output_lines = []
for r in rows:
    line = f"{r['card_id']}|{r['deck_id']}|{r['front_text']}|{r['proposed_part_of_speech']}|{r['proposed_back_text']}"
    output_lines.append(line)

print(f"Total lines: {len(output_lines)}")

# Save to private-results/batch2_704_lines.txt for verbatim insertion
with open('private-results/batch2_704_lines.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines) + '\n')

print("First 5 lines:")
for l in output_lines[:5]:
    print(l)
print("...")
print("Last 5 lines:")
for l in output_lines[-5:]:
    print(l)
