import json

with open(r'C:\Users\doant\.gemini\antigravity\brain\e6522d4d-d3f2-4157-a0f5-4413e6c4b6c8\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        idx = obj.get('step_index')
        if idx in [10291, 10292]:
            print(f"=== STEP {idx} ===")
            print(str(obj.get('tool_calls'))[:2000])
