"""
apply_card_meaning_drafts.py
----------------------------
Đọc CSV draft nghĩa thẻ, chỉ áp dụng dòng approved = Y.
Mặc định: DRY-RUN (chỉ in danh sách thay đổi, không ghi DB).
Chỉ ghi khi có cờ --apply.

Bảo vệ dữ liệu:
- Không đè lên nghĩa đã được người khác sửa (chỉ cập nhật nếu back_text vẫn là placeholder).
- Chạy trong transaction; rollback nếu có lỗi.
- Sao lưu bảng flashcards trước khi ghi (flashcards_backup_YYYYMMDD_HHMMSS).
- Idempotent: chạy lại không cộng thêm lần nữa.

Mật khẩu DB đọc từ biến môi trường DB_PASSWORD.

Usage:
  python scripts/apply_card_meaning_drafts.py private-results/card_meaning_drafts_batch1.csv
  python scripts/apply_card_meaning_drafts.py private-results/card_meaning_drafts_batch1.csv --apply
"""
import argparse, csv, os, sys, unicodedata, datetime, re
import pymysql

# ------------------------------------------------------------------ helpers --
def normalize(text: str) -> str:
    if text is None: text = ''
    return unicodedata.normalize('NFC', text).lower().strip()

def is_still_placeholder(back_text: str) -> bool:
    bk = normalize(back_text)
    return 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk

GARBAGE_SUFFIX = re.compile(r'^.+\s+(ad|adv|adj|n|v)\.?$', re.IGNORECASE)

def is_invalid(front_text: str, back_text: str) -> bool:
    """True nếu thẻ hiện tại vẫn không hợp lệ theo DeckCardFilter."""
    fn, bk = normalize(front_text), normalize(back_text)
    if not fn or not bk or len(fn) <= 1 or len(bk) <= 1: return True
    if 'từ vựng thuộc nhóm' in bk or 'đang cập nhật' in bk: return True
    if GARBAGE_SUFFIX.match(bk) or GARBAGE_SUFFIX.match(fn): return True
    if re.search(r'[<>={}]', bk): return True
    return False

def get_conn():
    db_pwd = os.environ.get('DB_PASSWORD', '123456')
    return pymysql.connect(
        host='127.0.0.1', port=3306,
        user='root', password=db_pwd,
        database='lela_db',
        charset='utf8mb4',
        autocommit=False,
    )

# -------------------------------------------------------------------- main --
def main():
    parser = argparse.ArgumentParser(description='Apply card meaning drafts from CSV.')
    parser.add_argument('csv_file', help='Path to CSV draft file')
    parser.add_argument('--apply', action='store_true', help='Actually write to DB (default: dry-run)')
    args = parser.parse_args()

    if not os.path.exists(args.csv_file):
        print(f'ERROR: File not found: {args.csv_file}', file=sys.stderr)
        sys.exit(1)

    # --- Load CSV ---
    with open(args.csv_file, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    approved = [r for r in rows if r.get('approved', '').strip().upper() == 'Y']
    print(f'CSV: {len(rows)} dòng tổng, {len(approved)} dòng approved=Y')

    if not approved:
        print('Không có dòng nào được duyệt. Thoát.')
        sys.exit(0)

    conn = get_conn()
    cur = conn.cursor(pymysql.cursors.DictCursor)

    # --- Validation nội bộ ---
    errors = []
    for row in approved:
        proposed_back = row.get('proposed_back_text', '').strip()
        front = row.get('front_text', '').strip()
        if not proposed_back:
            errors.append(f'card_id={row["card_id"]}: proposed_back trống!')
        if len(proposed_back) > 80:
            errors.append(f'card_id={row["card_id"]}: proposed_back quá 80 ký tự!')
        if front.lower() in proposed_back.lower():
            errors.append(f'card_id={row["card_id"]}: back chứa chính front_text!')
    if errors:
        print('LỖI VALIDATION, không thực thi:')
        for e in errors: print(' ', e)
        conn.close()
        sys.exit(1)

    # --- Kiểm tra hiện trạng DB ---
    to_update = []
    skipped_already_valid = []
    skipped_not_found = []

    for row in approved:
        card_id = int(row['card_id'])
        cur.execute('SELECT id, front_text, back_text, part_of_speech FROM flashcards WHERE id=%s AND is_active=1 AND deleted_at IS NULL', (card_id,))
        card = cur.fetchone()
        if not card:
            skipped_not_found.append(card_id)
            continue
        if not is_invalid(card['front_text'], card['back_text']):
            skipped_already_valid.append(card_id)
            continue
        to_update.append({
            'card_id': card_id,
            'front_text': card['front_text'],
            'old_back': card['back_text'],
            'old_pos': card['part_of_speech'],
            'new_back': row['proposed_back_text'].strip(),
            'new_pos': row['proposed_part_of_speech'].strip(),
            'deck_id': int(row['deck_id']),
            'deck_name': row['deck_name'],
        })

    print(f'\nSẽ cập nhật:   {len(to_update)} thẻ')
    print(f'Bỏ qua (đã hợp lệ): {len(skipped_already_valid)} — {skipped_already_valid}')
    print(f'Bỏ qua (không tìm thấy): {len(skipped_not_found)} — {skipped_not_found}')

    # --- Check deck completions after apply ---
    from collections import defaultdict
    deck_will_gain = defaultdict(int)
    for u in to_update:
        deck_will_gain[u['deck_id']] += 1

    deck_valid_before = {}
    for did in deck_will_gain:
        cur.execute('SELECT front_text, back_text FROM flashcards WHERE deck_id=%s AND is_active=1 AND deleted_at IS NULL', (did,))
        cards = cur.fetchall()
        deck_valid_before[did] = sum(1 for c in cards if not is_invalid(c['front_text'], c['back_text']))

    print('\nSố bộ sẽ đạt >=8 nếu áp dụng:')
    decks_will_pass = 0
    for did, gain in deck_will_gain.items():
        after = deck_valid_before[did] + gain
        passed = after >= 8
        if passed: decks_will_pass += 1
        cur.execute('SELECT title FROM decks WHERE id=%s', (did,))
        deck_title = (cur.fetchone() or {}).get('title', f'deck_{did}')
        status = '✓ >=8' if passed else f'✗ {after}'
        print(f'  Deck {did} ({deck_title[:45]}): {deck_valid_before[did]} -> {after} {status}')
    print(f'  Tổng: {decks_will_pass}/{len(deck_will_gain)} bộ sẽ đạt >=8 thẻ hợp lệ')

    print('\nDanh sách thay đổi:')
    for u in to_update:
        print(f'  card_id={u["card_id"]:6d} [{u["front_text"]!r:20s}]  back: {u["old_back"][:40]!r:42s} -> {u["new_back"]!r}')
        if u['old_pos'] != u['new_pos']:
            print(f'           pos: {u["old_pos"]!r} -> {u["new_pos"]!r}')

    if not args.apply:
        print('\n[DRY-RUN] Không ghi gì vào DB. Dùng --apply để thực thi.')
        conn.close()
        return

    # ============================================================
    # Thực thi ghi
    # ============================================================
    # 1. Sao lưu bảng flashcards
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_table = f'flashcards_backup_{ts}'
    print(f'\nSao lưu bảng flashcards -> {backup_table} ...')
    cur.execute(f'CREATE TABLE `{backup_table}` SELECT * FROM flashcards')
    conn.commit()
    print(f'Sao lưu hoàn thành: {backup_table}')

    # 2. Cập nhật trong transaction
    log_path = f'private-results/apply_log_{ts}.txt'
    applied = []
    try:
        for u in to_update:
            cur.execute(
                'UPDATE flashcards SET back_text=%s, part_of_speech=%s, updated_at=NOW() WHERE id=%s',
                (u['new_back'], u['new_pos'], u['card_id'])
            )
            applied.append(u)
        conn.commit()
        print(f'\n✓ Đã ghi {len(applied)} thẻ vào DB.')
    except Exception as e:
        conn.rollback()
        print(f'\nLỖI khi ghi: {e}. Đã rollback.', file=sys.stderr)
        conn.close()
        sys.exit(1)

    # 3. Ghi log
    os.makedirs('private-results', exist_ok=True)
    with open(log_path, 'w', encoding='utf-8') as lf:
        lf.write(f'apply_card_meaning_drafts — {ts}\n')
        lf.write(f'CSV: {args.csv_file}\n')
        lf.write(f'Backup table: {backup_table}\n')
        lf.write(f'Applied {len(applied)} updates:\n\n')
        for u in applied:
            lf.write(f'  card_id={u["card_id"]} deck={u["deck_id"]} front={u["front_text"]!r}\n')
            lf.write(f'    back: {u["old_back"]!r} -> {u["new_back"]!r}\n')
            if u['old_pos'] != u['new_pos']:
                lf.write(f'    pos:  {u["old_pos"]!r} -> {u["new_pos"]!r}\n')
    print(f'Log ghi tại: {log_path}')
    conn.close()

if __name__ == '__main__':
    main()
