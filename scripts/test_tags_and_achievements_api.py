import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== TESTING BACKEND REST APIS FOR TAGS & ACHIEVEMENTS ===")

tags_url = "http://localhost:8080/api/v1/tags"
success = False

for attempt in range(15):
    try:
        req = urllib.request.Request(tags_url)
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                page_data = data.get('data', {})
                items = page_data.get('content', [])
                print(f"TAGS API CONNECTED! Total elements: {page_data.get('totalElements')}, Fetched count: {len(items)}")
                for t in items[:5]:
                    print(f"  Tag #{t.get('id')}: name='{t.get('name')}', slug='{t.get('slug')}', decks={t.get('deckCount')}, cards={t.get('cardCount')}")
                success = True
                break
    except Exception as e:
        print(f"Waiting for backend... (attempt {attempt+1}/15): {e}")
        time.sleep(2)

if not success:
    print("Backend failed to start in 30 seconds.")
