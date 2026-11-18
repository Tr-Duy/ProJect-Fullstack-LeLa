"""
apply_card_meaning_drafts.py
----------------------------
Đọc CSV draft nghĩa thẻ, chỉ áp dụng dòng approved = Y.
Mặc định: DRY-RUN (chỉ in danh sách thay đổi, không ghi DB).
Chỉ ghi khi có cờ --apply.

Hỗ trợ 2 chế độ:
1. UPDATE (card_id là số nguyên): cập nhật back_text và part_of_speech cho thẻ có sẵn.
   - Chỉ cập nhật nếu back_text hiện tại vẫn là placeholder (DeckCardFilter coi là không hợp lệ).
   - Không đè lên thẻ đã hợp lệ.
2. INSERT (card_id bắt đầu bằng NEW_ hoặc không phải số): thêm thẻ mới vào bộ thẻ.
   - Kiểm tra idempotent: nếu bộ thẻ đã có thẻ cùng front_text (không phân biệt hoa thường), bỏ qua.
   - Tự động gán card_order tiếp nối (max(card_order) + 1, + 2, ...).
   - Kế thừa created_by từ các thẻ có sẵn trong cùng bộ (fallback = 2).
   - Điền đầy đủ các trường: phonetic, example_text, is_active=1, version=1, created_at=NOW(), updated_at=NOW().

Bảo vệ dữ liệu:
- Chạy trong transaction; rollback nếu có lỗi bất kỳ.
- Sao lưu bảng flashcards trước khi ghi (flashcards_backup_YYYYMMDD_HHMMSS).
- Idempotent: chạy lại lần 2 không thay đổi gì.

Mật khẩu DB bắt buộc đọc từ biến môi trường DB_PASSWORD (không có giá trị mặc định).

Usage:
  python scripts/apply_card_meaning_drafts.py private-results/card_meaning_drafts_batch1.csv
  python scripts/apply_card_meaning_drafts.py private-results/card_meaning_drafts_batch1.csv --apply
  python scripts/apply_card_meaning_drafts.py private-results/card_meaning_drafts_batch1b.csv --apply --database lela_test_apply_db
"""
import argparse, csv, os, sys, unicodedata, datetime, re
from collections import defaultdict
import pymysql

# ------------------------------------------------------------------ helpers --
def normalize(text: str) -> str:
    if text is None: text = ''
    return unicodedata.normalize('NFC', text).lower().strip()

def normalize_pos(pos: str) -> str:
    if not pos: return 'n'
    p = pos.strip().lower()
    if p.startswith('n'): return 'n'
    if p.startswith('v'): return 'v'
    if p.startswith('adj'): return 'adj'
    if p.startswith('adv'): return 'adv'
    if p.startswith('prep'): return 'prep'
    if p.startswith('phr'): return 'phr'
    return p

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

def get_conn(db_name='lela_db'):
    db_pwd = os.environ.get('DB_PASSWORD')
    if not db_pwd:
        raise RuntimeError("Missing required environment variable DB_PASSWORD")
    return pymysql.connect(
        host='127.0.0.1', port=3306,
        user='root', password=db_pwd,
        database=db_name,
        charset='utf8mb4',
        autocommit=False,
    )

def is_new_card_id(card_id_str: str) -> bool:
    if not card_id_str:
        return True
    s = str(card_id_str).strip()
    if s.upper().startswith('NEW_'):
        return True
    try:
        int(s)
        return False
    except ValueError:
        return True

# -------------------------------------------------------------------- main --
def main():
    parser = argparse.ArgumentParser(description='Apply card meaning drafts from CSV (UPDATE & INSERT).')
    parser.add_argument('csv_file', help='Path to CSV draft file')
    parser.add_argument('--apply', action='store_true', help='Actually write to DB (default: dry-run)')
    parser.add_argument('--database', default=os.environ.get('DB_NAME', 'lela_db'), help='Database name (default: lela_db)')
    parser.add_argument('--table', default='flashcards', help='Flashcards table name (default: flashcards)')
    args = parser.parse_args()

    table = args.table
    db_name = args.database

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
        print('Không có dòng nào được duyệt (approved=Y). Thoát.')
        sys.exit(0)

    conn = get_conn(db_name)
    cur = conn.cursor(pymysql.cursors.DictCursor)

    # --- Validation nội bộ ---
    errors = []
    for row in approved:
        cid = row.get('card_id', '').strip()
        proposed_back = row.get('proposed_back_text', '').strip()
        front = row.get('front_text', '').strip()
        if not proposed_back:
            errors.append(f'card_id={cid}: proposed_back trống!')
        if len(proposed_back) > 80:
            errors.append(f'card_id={cid}: proposed_back quá 80 ký tự!')
        if front and front.strip().lower() in proposed_back.strip().lower():
            errors.append(f'card_id={cid}: back_text chứa front_text ("{front}"), kể cả trong ngoặc!')
        try:
            int(row.get('deck_id', '0'))
        except (ValueError, TypeError):
            errors.append(f'card_id={cid}: deck_id không hợp lệ!')

    if errors:
        print('LỖI VALIDATION, không thực thi:')
        for e in errors: print(' ', e)
        conn.close()
        sys.exit(1)

    # --- Phân loại và Kiểm tra hiện trạng DB ---
    to_update = []
    to_insert = []
    skipped_already_valid = []
    skipped_already_exists = []
    skipped_not_found = []

    # Cache card_order và created_by cho mỗi deck
    deck_max_order = {}
    deck_created_by = {}

    def get_deck_order(did):
        if did not in deck_max_order:
            cur.execute(f'SELECT COALESCE(MAX(card_order), 0) as max_ord FROM `{table}` WHERE deck_id=%s', (did,))
            deck_max_order[did] = cur.fetchone()['max_ord']
        deck_max_order[did] += 1
        return deck_max_order[did]

    def get_deck_creator(did):
        if did not in deck_created_by:
            cur.execute(f'SELECT created_by FROM `{table}` WHERE deck_id=%s AND created_by IS NOT NULL LIMIT 1', (did,))
            r = cur.fetchone()
            deck_created_by[did] = r['created_by'] if r and r['created_by'] else 2
        return deck_created_by[did]

    for row in approved:
        cid_str = row.get('card_id', '').strip()
        deck_id = int(row['deck_id'])
        front = row.get('front_text', '').strip()
        back = row.get('proposed_back_text', '').strip()
        pos = normalize_pos(row.get('proposed_part_of_speech', 'n'))
        phonetic = row.get('phonetic', '').strip() or None
        example = row.get('example_text', '').strip() or None

        if is_new_card_id(cid_str):
            # Chế độ INSERT: Kiểm tra thẻ đã tồn tại trong deck chưa (idempotent)
            cur.execute(
                f'SELECT id, front_text, back_text FROM `{table}` WHERE deck_id=%s AND LOWER(TRIM(front_text)) = LOWER(TRIM(%s)) AND deleted_at IS NULL',
                (deck_id, front)
            )
            existing = cur.fetchone()
            if existing:
                skipped_already_exists.append((cid_str, front, deck_id))
                continue

            order = get_deck_order(deck_id)
            creator = get_deck_creator(deck_id)
            to_insert.append({
                'card_id_code': cid_str,
                'deck_id': deck_id,
                'deck_name': row.get('deck_name', f'Deck {deck_id}'),
                'front_text': front,
                'back_text': back,
                'part_of_speech': pos,
                'phonetic': phonetic,
                'example_text': example,
                'card_order': order,
                'created_by': creator,
            })
        else:
            # Chế độ UPDATE
            card_id = int(cid_str)
            cur.execute(
                f'SELECT id, front_text, back_text, part_of_speech FROM `{table}` WHERE id=%s AND is_active=1 AND deleted_at IS NULL',
                (card_id,)
            )
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
                'new_back': back,
                'new_pos': pos,
                'deck_id': deck_id,
                'deck_name': row.get('deck_name', f'Deck {deck_id}'),
            })

    print(f'\n--- KẾT QUẢ RÀ SOÁT ---')
    print(f'Sẽ CẬP NHẬT (UPDATE): {len(to_update)} thẻ')
    print(f'Sẽ THÊM MỚI (INSERT):  {len(to_insert)} thẻ')
    if skipped_already_valid:
        print(f'Bỏ qua UPDATE (đã hợp lệ): {len(skipped_already_valid)} — {skipped_already_valid}')
    if skipped_already_exists:
        print(f'Bỏ qua INSERT (đã tồn tại): {len(skipped_already_exists)} — {skipped_already_exists}')
    if skipped_not_found:
        print(f'Bỏ qua UPDATE (không tìm thấy): {len(skipped_not_found)} — {skipped_not_found}')

    # --- Check deck completions after apply ---
    deck_will_gain = defaultdict(int)
    for u in to_update:
        deck_will_gain[u['deck_id']] += 1
    for ins in to_insert:
        deck_will_gain[ins['deck_id']] += 1

    deck_valid_before = {}
    for did in deck_will_gain:
        cur.execute(f'SELECT front_text, back_text FROM `{table}` WHERE deck_id=%s AND is_active=1 AND deleted_at IS NULL', (did,))
        cards = cur.fetchall()
        deck_valid_before[did] = sum(1 for c in cards if not is_invalid(c['front_text'], c['back_text']))

    print('\nSố bộ sẽ đạt >=8 nếu áp dụng:')
    decks_will_pass = 0
    for did, gain in deck_will_gain.items():
        after = deck_valid_before[did] + gain
        passed = after >= 8
        if passed: decks_will_pass += 1
        try:
            cur.execute('SELECT title FROM decks WHERE id=%s', (did,))
            deck_title = (cur.fetchone() or {}).get('title', f'deck_{did}')
        except Exception:
            deck_title = f'deck_{did}'
        status = '✓ >=8' if passed else f'✗ {after}'
        print(f'  Deck {did:4d} ({deck_title[:35]:35s}): {deck_valid_before[did]} -> {after} {status}')
    print(f'  Tổng: {decks_will_pass}/{len(deck_will_gain)} bộ sẽ đạt >=8 thẻ hợp lệ')

    if to_update:
        print('\nDanh sách UPDATE:')
        for u in to_update:
            print(f'  card_id={u["card_id"]:6d} [{u["front_text"]!r:20s}] back: {u["old_back"][:35]!r:37s} -> {u["new_back"]!r}')
            if u['old_pos'] != u['new_pos']:
                print(f'           pos: {u["old_pos"]!r} -> {u["new_pos"]!r}')

    if to_insert:
        print('\nDanh sách INSERT:')
        for ins in to_insert:
            print(f'  code={ins["card_id_code"]:10s} deck={ins["deck_id"]:4d} order={ins["card_order"]} [{ins["front_text"]!r:15s}] -> {ins["back_text"]!r} ({ins["part_of_speech"]}) phonetic={ins["phonetic"]!r}')

    if not args.apply:
        print('\n[DRY-RUN] Không ghi gì vào DB. Dùng cờ --apply để thực thi.')
        conn.close()
        return

    if not to_update and not to_insert:
        print('\nKhông có thẻ nào cần cập nhật hay thêm mới. Không cần ghi DB.')
        conn.close()
        return

    # ============================================================
    # Thực thi ghi
    # ============================================================
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:21]
    backup_table = f'{table}_backup_{ts}'
    print(f'\nSao lưu bảng {table} -> {backup_table} ...')
    cur.execute(f'CREATE TABLE `{backup_table}` SELECT * FROM `{table}`')
    conn.commit()
    print(f'Sao lưu hoàn thành: {backup_table}')

    # Transaction
    log_path = f'private-results/apply_log_{ts}.txt'
    applied_updates = []
    applied_inserts = []
    try:
        # 1. Updates
        for u in to_update:
            cur.execute(
                f'UPDATE `{table}` SET back_text=%s, part_of_speech=%s, updated_at=NOW() WHERE id=%s',
                (u['new_back'], u['new_pos'], u['card_id'])
            )
            applied_updates.append(u)

        # 2. Inserts
        for ins in to_insert:
            cur.execute(
                f'''
                INSERT INTO `{table}`
                    (deck_id, front_text, back_text, part_of_speech, phonetic, example_text,
                     card_order, is_active, created_by, version, created_at, updated_at)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, 1, %s, 1, NOW(), NOW())
                ''',
                (
                    ins['deck_id'], ins['front_text'], ins['back_text'], ins['part_of_speech'],
                    ins['phonetic'], ins['example_text'], ins['card_order'], ins['created_by']
                )
            )
            applied_inserts.append(ins)

        conn.commit()
        print(f'\n✓ Đã ghi thành công vào DB: {len(applied_updates)} cập nhật, {len(applied_inserts)} thêm mới.')
    except Exception as e:
        conn.rollback()
        print(f'\nLỖI khi ghi: {e}. Đã rollback toàn bộ transaction.', file=sys.stderr)
        conn.close()
        sys.exit(1)

    # Log file
    os.makedirs('private-results', exist_ok=True)
    with open(log_path, 'w', encoding='utf-8') as lf:
        lf.write(f'apply_card_meaning_drafts — {ts}\n')
        lf.write(f'CSV: {args.csv_file}\n')
        lf.write(f'Backup table: {backup_table}\n')
        lf.write(f'Applied {len(applied_updates)} updates, {len(applied_inserts)} inserts:\n\n')
        if applied_updates:
            lf.write('UPDATES:\n')
            for u in applied_updates:
                lf.write(f'  card_id={u["card_id"]} deck={u["deck_id"]} front={u["front_text"]!r}\n')
                lf.write(f'    back: {u["old_back"]!r} -> {u["new_back"]!r}\n')
        if applied_inserts:
            lf.write('\nINSERTS:\n')
            for ins in applied_inserts:
                lf.write(f'  code={ins["card_id_code"]} deck={ins["deck_id"]} order={ins["card_order"]} front={ins["front_text"]!r} back={ins["back_text"]!r} pos={ins["part_of_speech"]}\n')
    print(f'Log ghi tại: {log_path}')
    conn.close()

if __name__ == '__main__':
    main()
