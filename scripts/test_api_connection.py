import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "http://localhost:8080/api/v1/quizzes/deck/18"
success = False

for attempt in range(15):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                print("BACKEND CONNECTED! Returned quizzes count for Deck #18:", len(data.get('data', [])))
                for q in data.get('data', []):
                    print(f"  Quiz #{q.get('id')}: code={q.get('quizCode')}, title='{q.get('title')}', difficulty={q.get('difficulty')}, totalQuestions={q.get('totalQuestions')}, passScore={q.get('passScore')}")
                success = True
                break
    except Exception as e:
        print(f"Waiting for backend startup... (attempt {attempt+1}/15): {e}")
        time.sleep(2)

if not success:
    print("Backend failed to respond in 30 seconds.")
