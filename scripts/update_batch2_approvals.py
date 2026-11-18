import csv
import glob
import os

edits = {
    '11501': ('insertion', 'Sự chèn vào'),
    '11637': ('injection', 'Mũi tiêm; sự tiêm'),
    '11958': ('liberation', 'Sự giải phóng'),
    '11293': ('distress', 'Nỗi đau khổ; sự lo âu'),
    '11454': ('mandate', 'Sự ủy quyền; nhiệm vụ được giao'),
    '11559': ('transparency', 'Sự minh bạch'),
    '11448': ('inequality', 'Sự bất bình đẳng'),
    '10467': ('exert', 'Dùng (sức, ảnh hưởng); nỗ lực'),
    '10425': ('adolescent', 'Thanh thiếu niên'),
    '11906': ('oral', 'Bằng miệng, bằng lời nói'),
    '10388': ('hidden', 'Bị ẩn, bị giấu kín'),
    '10466': ('excess', 'Sự dư thừa, phần vượt quá'),
}

shard_files = sorted(glob.glob('private-results/card_meaning_drafts_batch2[a-i].csv'))
summary_file = 'private-results/card_meaning_drafts_batch2_summary_review.csv'

all_files = shard_files + [summary_file]

print(f"Target files: {len(all_files)}")

edited_count_total = {cid: 0 for cid in edits}

for file_path in all_files:
    with open(file_path, mode='r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    file_edits = 0
    approved_count = 0
    for row in rows:
        cid = row['card_id']
        if cid in edits:
            expected_word, new_meaning = edits[cid]
            assert row['front_text'].lower() == expected_word.lower(), f"Mismatch word for {cid}: {row['front_text']} vs {expected_word}"
            row['proposed_back_text'] = new_meaning
            row['note'] = (row.get('note', '') + '; Đã duyệt sửa nhỏ người duyệt độc lập').strip('; ')
            edited_count_total[cid] += 1
            file_edits += 1
        
        row['approved'] = 'Y'
        if row['approved'] == 'Y':
            approved_count += 1

    with open(file_path, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"File {file_path}: {len(rows)} rows, {file_edits} edited, {approved_count} approved='Y'")

print("\nVerification of 12 edited cards count across shards + summary (each should appear in exactly 1 shard + 1 summary = 2 times):")
for cid, count in edited_count_total.items():
    print(f"Card {cid} ({edits[cid][0]} -> {edits[cid][1]}): appeared {count} times")
    assert count == 2, f"Expected 2 appearances for card {cid}, found {count}"

print("\nStep 1 edits & approval completed successfully!")
