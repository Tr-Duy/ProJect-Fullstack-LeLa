import os
import re
import sys
import json
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"C:\Users\doant\.gemini\antigravity-ide\brain\d4a7301f-5beb-46f3-b3e8-4ce98dc27b3d\.user_uploaded\media_1787166440979.pdf"
output_sql_path = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V38__seed_oxford_5000_vocabulary.sql"

print(f"Reading Oxford 5000 PDF from: {pdf_path}")
reader = pypdf.PdfReader(pdf_path)

current_cefr = "B2"
entries = []

pos_pattern = re.compile(r'^(.*?)\s+(n\.|v\.|adj\.|adv\.|prep\.|pron\.|conj\.|num\.|number|adj\./adv\.|v\., n\.|n\., v\.|n\., adj\.|adj\., n\.|prep\., adv\.|adv\., adj\.|n\., adj\., adv\.|v\., n\., adj\.)$', re.IGNORECASE)

for page_idx, page in enumerate(reader.pages):
    lines = page.extract_text().split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if 'Oxford University Press' in line or 'The Oxford 5000' in line:
            continue
        if line == 'B2':
            current_cefr = 'B2'
            continue
        if line == 'C1':
            current_cefr = 'C1'
            continue

        parts = re.findall(r'([A-Za-z0-9\-\'\s\(\)]+?\s+(?:n\.|v\.|adj\.|adv\.|prep\.|pron\.|conj\.|num\.|number|adj\./adv\.|v\.,\s*n\.|n\.,\s*v\.|n\.,\s*adj\.|adj\.,\s*n\.|prep\.,\s*adv\.|adv\.,\s*adj\.|n\.,\s*adj\.,\s*adv\.|v\.,\s*n\.,\s*adj\.))', line)
        if not parts:
            m = pos_pattern.match(line)
            if m:
                parts = [line]

        for p in parts:
            p = p.strip()
            pos_match = re.search(r'\s+(n\.|v\.|adj\.|adv\.|prep\.|pron\.|conj\.|num\.|number|adj\./adv\.|v\.,\s*n\.|n\.,\s*v\.|n\.,\s*adj\.|adj\.,\s*n\.|prep\.,\s*adv\.|adv\.,\s*adj\.|n\.,\s*adj\.,\s*adv\.|v\.,\s*n\.,\s*adj\.)$', p, re.IGNORECASE)
            if pos_match:
                word = p[:pos_match.start()].strip()
                pos = pos_match.group(0).strip()
                entries.append({
                    'word': word,
                    'pos': pos,
                    'cefr': current_cefr,
                    'page': page_idx + 1
                })

print(f"Extracted {len(entries)} entries from Oxford PDF.")
b2_entries = [e for e in entries if e['cefr'] == 'B2']
c1_entries = [e for e in entries if e['cefr'] == 'C1']
print(f"B2 count: {len(b2_entries)}, C1 count: {len(c1_entries)}")

# Save extracted entries to JSON scratch file for batch translation & processing
json_scratch = r"C:\Users\doant\.gemini\antigravity-ide\brain\d4a7301f-5beb-46f3-b3e8-4ce98dc27b3d\scratch\oxford_extracted_entries.json"
with open(json_scratch, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)

print("Extracted entries saved to scratch JSON.")
