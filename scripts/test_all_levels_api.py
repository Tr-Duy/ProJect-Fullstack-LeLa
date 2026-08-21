import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

sample_decks = [
    (18, "Level 1: Dưới 500 (Contracts)"),
    (35, "Level 2: 500-700 (Shipping)"),
    (65, "Level 3: 700-850 (Health Insurance)"),
    (1108, "Level 4: 850-990 (Business & Management #01)")
]

print("=== TESTING REST API FOR DECKS ACROSS ALL 4 TOEIC LEVELS ===")
for deck_id, label in sample_decks:
    url = f"http://localhost:8080/api/v1/quizzes/deck/{deck_id}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            quizzes = data.get('data', [])
            print(f"\n--- {label} (Deck #{deck_id}) ---")
            print(f"API Returned Quizzes Count: {len(quizzes)}")
            for q in quizzes:
                print(f"  [ID {q.get('id')}] Code: {q.get('quizCode')}, Title: '{q.get('title')}', Difficulty: {q.get('difficulty')}, Qs: {q.get('totalQuestions')}, PassScore: {q.get('passScore')}%")
    except Exception as e:
        print(f"Error testing Deck #{deck_id}: {e}")
