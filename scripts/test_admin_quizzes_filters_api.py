import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== TESTING ADMIN QUIZZES API WITH LEVEL & DIFFICULTY FILTERS ===")

levels = [
    (1, "Level 1: Cơ bản (Dưới 500)"),
    (2, "Level 2: Trung bình - Khá (500 - 700)"),
    (3, "Level 3: Khá - Giỏi (700 - 850)"),
    (4, "Level 4: Xuất sắc (850 - 990)")
]

for level_id, name in levels:
    url = f"http://localhost:8080/api/v1/quizzes?levelId={level_id}&size=200"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            page_data = data.get('data', {})
            total_elements = page_data.get('totalElements', 0)
            items = page_data.get('content', [])
            easy_cnt = sum(1 for q in items if q.get('difficulty') == 'EASY')
            med_cnt = sum(1 for q in items if q.get('difficulty') == 'MEDIUM')
            hard_cnt = sum(1 for q in items if q.get('difficulty') == 'HARD')
            print(f"[{name}] Total Quizzes: {total_elements} (Fetched: {len(items)}, EASY: {easy_cnt}, MEDIUM: {med_cnt}, HARD: {hard_cnt})")
    except Exception as e:
        print(f"Error testing Level {level_id}: {e}")

print("\n=== TESTING DIFFICULTY FILTERS ACROSS ALL LEVELS ===")
for diff in ["EASY", "MEDIUM", "HARD"]:
    url = f"http://localhost:8080/api/v1/quizzes?difficulty={diff}&size=10"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            page_data = data.get('data', {})
            print(f"[Difficulty = {diff}] Total Elements in System: {page_data.get('totalElements')}")
    except Exception as e:
        print(f"Error testing Difficulty {diff}: {e}")
