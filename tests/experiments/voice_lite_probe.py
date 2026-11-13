"""One call per fixed transcript, full exported production prompt, no retries.

Export and normalize with VOICE_LITE_EXPERIMENT=1 VoiceLiteProbeExportTest.
Private results contain model responses; never commit them.
"""
import datetime
import json
import time
from voice_probe import BASE, OUT, call, settings


def main():
    config = settings()
    requests = json.loads((OUT / "voice-lite-fixed-requests.json").read_text(encoding="utf-8"))
    assert len(requests) == 10
    rows = []
    for item in requests:
        prompt = item["payload"]["contents"][0]["parts"][0]["text"]
        assert "do NOT offer more items" in prompt and "simple correct examples" in prompt
        meta, data = call(f"{config.get('GEMINI_BASE_URL', BASE).rstrip('/')}/gemini-flash-lite-latest:generateContent",
                          config["GEMINI_API_KEY"], item["payload"])
        rows.append({"case": item["case"], "input": item["input"], "status": meta["status"],
                     "latencyMs": meta["latency_ms"], "data": data})
        (OUT / "voice-lite-fixed-raw.json").write_text(json.dumps({
            "measuredAtUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "protocol": "10 fixed inputs, one call each, no retry/fallback, 4.5s pause",
            "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"case": item["case"], "status": meta["status"], "latencyMs": meta["latency_ms"],
                          "modelVersion": data.get("modelVersion")}), flush=True)
        if item["case"] < 10:
            time.sleep(4.5)


if __name__ == "__main__":
    main()
