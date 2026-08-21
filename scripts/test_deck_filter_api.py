import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== TESTING BACKEND FILTER APIS FOR DECKS ===")

base_url = "http://localhost:8080/api/v1/decks"

def test_deck_api(params_str, label):
    url = f"{base_url}?{params_str}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                total = data.get('totalElements', 0)
                content = data.get('content', [])
                print(f"[{label}] -> URL: {params_str} => Total: {total}, Returned: {len(content)}")
                for d in content[:3]:
                    tags_str = ", ".join([t.get('name', '') for t in d.get('tags', [])]) if d.get('tags') else "No tags"
                    print(f"   - Deck #{d.get('id')}: [{d.get('deckCode')}] {d.get('title')} | Level: {d.get('levelName')} | Difficulty: {d.get('difficulty')} | Status: {d.get('status')} | Tags: {tags_str}")
            else:
                print(f"[{label}] FAILED with status {res.status}")
    except Exception as e:
        print(f"[{label}] ERROR: {e}")

test_deck_api("page=0&size=5", "All Decks default")
test_deck_api("search=Hotel&page=0&size=5", "Search 'Hotel'")
test_deck_api("levelId=1&page=0&size=5", "Filter Level 1")
test_deck_api("levelId=2&page=0&size=5", "Filter Level 2")
test_deck_api("difficulty=BEGINNER&page=0&size=5", "Filter Difficulty BEGINNER")
test_deck_api("status=PUBLISHED&page=0&size=5", "Filter Status PUBLISHED")
test_deck_api("search=Hotel&levelId=1&status=PUBLISHED&page=0&size=5", "Combined Search+Level+Status")
