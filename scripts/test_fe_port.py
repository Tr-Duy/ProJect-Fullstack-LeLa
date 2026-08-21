import urllib.request
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING VITE DEV SERVER (http://localhost:5173) ===")
url = "http://localhost:5173"
success = False

for attempt in range(10):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as res:
            if res.status == 200:
                print(f"Vite dev server is UP and running on http://localhost:5173!")
                success = True
                break
    except Exception as e:
        print(f"Waiting for Vite dev server... (attempt {attempt+1}/10): {e}")
        time.sleep(2)

if not success:
    print("Vite dev server failed to respond.")
