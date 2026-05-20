#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import os
import sys

def run_test(name, url, payload, headers):
    print(f"\n--- Running {name} ---")
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        response = urllib.request.urlopen(req, timeout=15)
        status = response.getcode()
        body = response.read().decode('utf-8')
        print(f"Status: {status} OK")
        print(f"Response Snippet: {body[:300]}...")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"Status: {e.code} Error")
        print(f"Response: {body}")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def main():
    sarvam_key = os.environ.get('SARVAM_API_KEY')
    if not sarvam_key:
        print("ERROR: SARVAM_API_KEY is not set in environment.")
        sys.exit(1)

    print("🔑 SARVAM_API_KEY is present. Starting tests...")

    # We test the local Next.js API endpoints assuming the server is running on port 3000
    # or we can test the Sarvam APIs directly. The instructions asked to verify:
    # 1. sarvam-hosted reasoning provider (hits api.sarvam.ai/chat/completions directly via provider or local route)
    # 2. /api/i18n/meaning (local route)
    # 3. /api/tts (local route)
    # Since this is a smoke test, hitting the local Next.js server on 3000 is standard.
    
    BASE_URL = "http://localhost:3000"
    headers = {'Content-Type': 'application/json'}

    # 1. Test TTS Route (Sarvam Bulbul integration)
    tts_payload = {
        "text": "धर्मो रक्षति रक्षितः।",
        "quality": "pandit"
    }
    tts_success = run_test("TTS Route (Sarvam Integration)", f"{BASE_URL}/api/tts", tts_payload, headers)

    # 2. Test Meaning Route (Sarvam Translate integration)
    meaning_payload = {
        "entryId": "test_dharm",
        "sourceMeaning": "Dharma",
        "targetLanguage": "hi"
    }
    meaning_success = run_test("Meaning Route (Sarvam Translate)", f"{BASE_URL}/api/i18n/meaning", meaning_payload, headers)

    # 3. Test Reasoning Provider via a Chat Route
    chat_payload = {
        "tradition": "sanatana_dharma",
        "message": "Explain Karma in one sentence."
    }
    chat_success = run_test("Chat Route (Sarvam Reasoning)", f"{BASE_URL}/api/ai/chat", chat_payload, headers)

    print("\n=================================")
    if tts_success and meaning_success and chat_success:
        print("✅ ALL TESTS PASSED.")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
