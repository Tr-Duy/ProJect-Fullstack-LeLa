import os
import pymysql
import json
import urllib.request
import urllib.error

db_pwd = os.environ.get('DB_PASSWORD', '123456')
conn = pymysql.connect(
    host='127.0.0.1', port=3306,
    user='root', password=db_pwd,
    database='lela_db', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

cur.execute("SELECT id, username FROM users WHERE username='learner1'")
u = cur.fetchone()
assert u, "learner1 not found"
user_id = u['id']
print(f"Target user: {u['username']} (id={user_id})")

target_decks = [
    (1002, "Lô 2: Deck 1002 - Oxford 5000 Office & Admin #02"),
    (1001, "Lô 1: Deck 1001 - Oxford 5000 Office & Admin #01"),
    (22,   "Nhóm (a.): Deck 22 - TOEIC Conferences"),
]

for did, label in target_decks:
    # Enroll
    cur.execute("SELECT id FROM deck_enrollments WHERE user_id=%s AND deck_id=%s", (user_id, did))
    en = cur.fetchone()
    if not en:
        cur.execute("""
            INSERT INTO deck_enrollments (user_id, deck_id, status, enrolled_at, created_at, updated_at)
            VALUES (%s, %s, 'ACTIVE', NOW(), NOW(), NOW())
        """, (user_id, did))
        print(f"Enrolled learner1 into deck {did}")

    # Set all valid cards to REVIEWING state
    cur.execute("SELECT id FROM flashcards WHERE deck_id=%s AND is_active=1 AND deleted_at IS NULL", (did,))
    fc_list = cur.fetchall()
    for fc in fc_list:
        cid = fc['id']
        cur.execute("SELECT id FROM card_progress WHERE user_id=%s AND card_id=%s", (user_id, cid))
        cp = cur.fetchone()
        if cp:
            cur.execute("""
                UPDATE card_progress 
                SET state='REVIEW', repetitions=3, updated_at=NOW()
                WHERE id=%s
            """, (cp['id'],))
        else:
            cur.execute("""
                INSERT INTO card_progress 
                (user_id, card_id, state, repetitions, created_at, updated_at)
                VALUES (%s, %s, 'REVIEW', 3, NOW(), NOW())
            """, (user_id, cid))
    print(f"Prepared 100% learned progress for {len(fc_list)} cards in deck {did}")

conn.commit()
conn.close()

# Helper for HTTP requests
def http_post(url, data_dict, headers=None):
    if headers is None: headers = {}
    data = json.dumps(data_dict).encode('utf-8')
    headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_get(url, headers=None):
    if headers is None: headers = {}
    req = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 2. Login via API
login_res = http_post("http://localhost:8080/api/v1/auth/login", {
    "usernameOrEmail": "learner1",
    "password": "123456"
})

token = login_res['data']['accessToken']
headers = {
    "Authorization": f"Bearer {token}"
}
print("Login successful! Acquired JWT Bearer token.")

print("\n" + "=" * 90)
print("TIẾN HÀNH GỌI API SINH ĐỀ THI THẬT CHO 3 BỘ ĐẠI DIỆN")
print("=" * 90)

for did, label in target_decks:
    print(f"\n>>> [BỘ THẺ: {label} (Deck ID: {did})]")
    
    # Check status
    status_url = f"http://localhost:8080/api/v1/deck-tests/{did}/status"
    status_res = http_get(status_url, headers=headers)
    status_data = status_res['data']
    print("status_data raw:", status_data)
    assert status_data.get('eligible') == True, f"Deck {did} is not eligible!"

    # Start test
    start_url = f"http://localhost:8080/api/v1/deck-tests/{did}/start"
    start_res = http_post(start_url, {}, headers=headers)
    view = start_res['data']
    
    print(f"BÀI THI ĐÃ ĐƯỢC TẠO THÀNH CÔNG QUA REST API!")
    print(json.dumps(view, indent=2, ensure_ascii=False))

print("\n" + "=" * 90)
print("HOÀN TẤT SINH ĐỀ THI THẬT QUA REST API CHO CẢ 3 BỘ!")
print("=" * 90)
