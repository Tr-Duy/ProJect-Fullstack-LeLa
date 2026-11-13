"""Offline checks for experiment safety; no real credentials or API calls."""
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

import voice_probe


class ProbeSafetyTest(unittest.TestCase):
    def test_missing_audio_stops_before_credentials_or_network(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(voice_probe, "ROOT", Path(directory)), \
                    patch.object(voice_probe, "settings") as settings, \
                    patch.object(voice_probe.urllib.request, "urlopen") as network:
                with self.assertRaisesRegex(SystemExit, "missing 5 learner recordings"):
                    voice_probe.run("audio")
                settings.assert_not_called()
                network.assert_not_called()

    def test_error_echo_key_is_redacted_and_request_uses_header(self):
        key = "fake-secret-for-test"
        response = json.dumps({"error": {"message": key}}).encode()
        error = urllib.error.HTTPError("https://example.test", 429, "quota", {}, io.BytesIO(response))
        with patch.object(voice_probe.urllib.request, "urlopen", side_effect=error) as network:
            meta, result = voice_probe.call("https://example.test/models/test:generateContent", key, {"text": "hello"})
        request = network.call_args.args[0]
        self.assertNotIn(key, request.full_url)
        self.assertEqual(key, request.get_header("X-goog-api-key"))
        self.assertEqual(429, meta["status"])
        self.assertNotIn(key, json.dumps(result))
        self.assertNotIn(key, json.dumps(meta))
        self.assertEqual(len(request.data), meta["request_body_bytes"])


if __name__ == "__main__":
    unittest.main()
