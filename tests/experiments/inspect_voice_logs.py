"""Read existing runtime log without printing keys, bodies or transcripts."""
import json
from pathlib import Path
import re

from voice_probe import ROOT, settings


def inspect():
    key = settings().get("GEMINI_API_KEY", "")
    path = ROOT / "LeLa_BE/global_error.log"
    if not path.exists():
        return {"status": "missing_runtime_log"}
    text = path.read_text(encoding="utf-8", errors="replace")
    return {
        "file": "LeLa_BE/global_error.log",
        "bytes": path.stat().st_size,
        "current_key_occurrences": text.count(key) if key else "chưa xác minh",
        "key_query_occurrences": len(re.findall(r"[?&]key=", text)),
        "voice_latency_lines": len(re.findall(r"(?im)^.*VoiceAiService.*(?:latency|elapsed|[0-9]+ms).*$", text)),
        "stt_tts_console_lines": len(re.findall(r"(?m)^.*\[(?:STT|TTS)[^\]]*\].*$", text)),
        "current_turn_latency": "chưa xác minh: cần log FE và BE ghép cùng lượt; không dùng test/mock logs",
    }


if __name__ == "__main__":
    print(json.dumps(inspect(), ensure_ascii=True, indent=2))
