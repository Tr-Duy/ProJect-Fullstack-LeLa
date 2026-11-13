"""Paired text-only requests using exported production payloads. No audio, no retry.

python tests/experiments/phase1a_thinking_probe.py --model gemini-flash-lite-latest
This measures inference, NOT click-to-render latency. Never enable a setting solely
from latency: manually review feedback, suggestions and grammar in the private JSON.
"""
import argparse
import copy
import datetime
import json
from voice_probe import BASE, OUT, call, settings


def run(model, retry_failed=False):
    config = settings()
    templates = json.loads((OUT / "phase1a-request-templates.json").read_text(encoding="utf-8"))
    rows = []
    previous = []
    if retry_failed:
        previous = json.loads((OUT / "phase1a-thinking.json").read_text(encoding="utf-8"))["rows"]
    for case in templates:
        for condition in ("default", "budget128"):
            if retry_failed and any(r["case"] == case["case"] and r["condition"] == condition
                                    and r["status"] == 200 for r in previous):
                continue
            payload = copy.deepcopy(case["payload"])
            if condition == "budget128":
                payload["generationConfig"]["thinkingConfig"] = {"thinkingBudget": 128}
            meta, data = call(f"{config.get('GEMINI_BASE_URL', BASE)}/{model}:generateContent",
                              config["GEMINI_API_KEY"], payload)
            parts = [p.get("text", "") for c in data.get("candidates", [])
                     for p in c.get("content", {}).get("parts", []) if not p.get("thought")]
            try:
                result = json.loads("".join(parts))
            except json.JSONDecodeError:
                result = None
            rows.append({"case": case["case"], "condition": condition, "model": model,
                         "model_version": data.get("modelVersion"), "expectedHasError": case["expectedHasError"],
                         "input": case["text"], **meta, "result": result})
            filename = "phase1a-thinking-retries.json" if retry_failed else "phase1a-thinking.json"
            (OUT / filename).write_text(json.dumps({
                "measured_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps({"case": case["case"], "condition": condition, "status": meta["status"],
                              "latency_ms": meta["latency_ms"], "model_version": data.get("modelVersion")}), flush=True)
            if meta["status"] == 429 and "PerDay" in json.dumps(meta.get("error")):
                return


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--retry-failed", action="store_true")
    args = parser.parse_args()
    run(args.model, args.retry_failed)
