"""Phase 0.2 only. No production imports, no retries, no secret/response logging.

python tests/experiments/voice_probe.py tts
python tests/experiments/voice_probe.py audio --model MODEL_ID
Private output may contain transcripts; never commit private-results.
"""
import argparse
import base64
import datetime
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / "private-results"
BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def settings():
    values = {}
    path = ROOT / "LeLa_BE" / ".env"
    if path.exists():
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            name, sep, value = line.strip().partition("=")
            if sep and not name.startswith("#"):
                values[name] = value.strip().strip('\"').strip("'")
    values.update(os.environ)
    return values


def call(url, key, payload=None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode()
    request = urllib.request.Request(url, data=body, headers={
        "x-goog-api-key": key, "Content-Type": "application/json"})
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    except (OSError, TimeoutError):
        return {"status": "network_error", "latency_ms": round((time.perf_counter()-start)*1000),
                "request_body_bytes": len(body or b"")}, {}
    elapsed = round((time.perf_counter()-start)*1000)
    data = json.loads(raw.decode().replace(key, "[REDACTED]"))
    meta = {"status": status, "latency_ms": elapsed, "request_body_bytes": len(body or b""),
            "response_bytes": len(raw), "usage": data.get("usageMetadata"),
            "error": data.get("error")}
    return meta, data


def run(mode, model=None):
    # Preflight audio BEFORE loading credentials or performing any network call.
    samples = None
    if mode == "audio":
        manifest = ROOT / "tests/audio/manifest.json"
        if not manifest.exists():
            raise SystemExit("STOP: missing 5 learner recordings and tests/audio/manifest.json")
        samples = json.loads(manifest.read_text(encoding="utf-8"))
        if len(samples) != 5:
            raise SystemExit("STOP: exactly 5 samples required")
        for sample in samples:
            path = (manifest.parent / sample["file"]).resolve()
            if path.parent != manifest.parent.resolve() or not path.is_file():
                raise SystemExit("STOP: sample missing or outside tests/audio")
    config = settings()
    key = config.get("GEMINI_API_KEY")
    if not key or key.startswith("YOUR_"):
        raise SystemExit("STOP: no configured API key")
    OUT.mkdir(exist_ok=True)
    rows = []
    if mode == "tts":
        meta, listing = call(BASE, key)
        rows.append({"probe": "model_list", **meta})
        available = [m["name"].split("/")[-1] for m in listing.get("models", [])
                     if "tts" in m["name"].lower() and "generateContent" in m.get("supportedGenerationMethods", [])]
        models = [model] if model else available[:2]
        if not models:
            rows.append({"probe": "tts", "status": "no_tts_models_listed"})
        for selected in models:
            for repeat in range(1, 4):
                payload = {"contents": [{"parts": [{"text": "Say clearly: Hello! What would you like to drink today?"}]}],
                           "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {
                               "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Kore"}}}}}
                meta, data = call(f"{BASE}/{selected}:generateContent", key, payload)
                parts = [p for c in data.get("candidates", []) for p in c.get("content", {}).get("parts", [])]
                audio = next((p.get("inlineData") for p in parts if p.get("inlineData")), None)
                row = {"probe": "tts", "model": selected, "repeat": repeat, **meta,
                       "quality": "chưa xác minh (cần nghe và đánh giá người thật)"}
                if audio:
                    raw = base64.b64decode(audio["data"])
                    row.update(audio_bytes=len(raw), mime_type=audio.get("mimeType"))
                    # Gemini PCM output: preserve original bytes, do not assume format.
                    (OUT / f"tts-{selected}-{repeat}.pcm").write_bytes(raw)
                rows.append(row)
                # Avoid hammering a project whose quota is already exhausted.
                if meta["status"] == 429:
                    break
        # Cloud TTS is a separate API; verify current key access independently.
        payload = {"input": {"text": "Hello! What would you like to drink today?"},
                   "voice": {"languageCode": "en-US"}, "audioConfig": {"audioEncoding": "MP3"}}
        meta, data = call("https://texttospeech.googleapis.com/v1/text:synthesize", key, payload)
        if data.get("audioContent"):
            raw = base64.b64decode(data["audioContent"])
            (OUT / "google-tts.mp3").write_bytes(raw)
            meta["audio_bytes"] = len(raw)
        rows.append({"probe": "google_cloud_tts", **meta})
    else:
        selected = model or config.get("GEMINI_PRIMARY_MODEL", "gemini-3.5-flash")
        for sample in samples:
            path = ROOT / "tests/audio" / sample["file"]
            mime = {".wav": "audio/wav", ".webm": "audio/webm", ".mp3": "audio/mp3",
                    ".m4a": "audio/mp4", ".ogg": "audio/ogg"}.get(path.suffix.lower())
            if mime is None or path.stat().st_size > 10_000_000:
                raise SystemExit("STOP: unsupported format or sample exceeds 10 MB")
            prompt = ('Transcribe exactly, preserving learner grammar. Return JSON with transcript, grammarErrors, '
                      'pronunciationObservations (audible evidence and uncertainty; no invented phoneme scores).')
            payload = {"contents": [{"parts": [{"text": prompt}, {"inlineData": {
                "mimeType": mime, "data": base64.b64encode(path.read_bytes()).decode()}}]}],
                "generationConfig": {"responseMimeType": "application/json"}}
            for repeat in range(1, 4):
                meta, data = call(f"{BASE}/{selected}:generateContent", key, payload)
                rows.append({"sample": sample["file"], "repeat": repeat, "model": selected, **meta,
                             "reference": sample.get("reference"),
                             "web_speech": sample.get("webSpeechTranscript", "chưa xác minh"),
                             "candidates": data.get("candidates")})
    result = {"measured_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "rows": rows}
    destination = OUT / f"{mode}.json"
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    # Only safe metadata on stdout; full errors/transcripts stay in ignored output.
    for row in rows:
        print(json.dumps({k: row[k] for k in ("probe", "sample", "model", "repeat", "status", "latency_ms",
                                              "request_body_bytes", "audio_bytes") if k in row}))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["audio", "tts"])
    parser.add_argument("--model")
    args = parser.parse_args()
    run(args.mode, args.model)
