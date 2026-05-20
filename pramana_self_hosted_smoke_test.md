# 🛣️ Pramana Self-Hosted Route Smoke Test Report

**Generated**: `2026-05-20T10:28:53+00:00` (UTC)
**Runtime**: Ollama
**Model**: `qwen2.5:0.5b`
**Endpoint**: `http://localhost:11434/v1/chat/completions`
**Timeout**: 20s per route

**Overall**: ✅ PASS

---

## 📊 Route Results

| Route | HTTP | Latency | Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `/api/ai/chat  [runDharmaChat]` | 200 | 1.67s | ✅ | Provider reached, output valid |
| `/api/pathshala/explain  [runPathshalaExplain]` | 200 | 7.79s | ✅ | Provider reached, output valid |
| `/api/i18n/meaning  [runMeaningGenerate]` | 200 | 1.30s | ✅ | Provider reached, output valid |

---

## 🔍 Response Snippets

### `/api/ai/chat  [runDharmaChat]`
- **Payload**: tradition=sanatana_dharma, message='What is Dharma?'
- **Status**: ✅ PASSED
- **Response snippet**:
  ```
  Dharma is the fundamental principle of life that guides individuals towards ethical conduct, moral integrity, and spiritual well-being. It encompasses various aspects such as action, thought, speech, 
  ```

### `/api/pathshala/explain  [runPathshalaExplain]`
- **Payload**: corpus=pathshala_gita, chunk=2.47, lang=en
- **Status**: ✅ PASSED
- **Response snippet**:
  ```
  {
  "word_by_word": {
    "karmaṇy evādhikāras te mā phaleṣu kadācana": "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action",
    "you have a right to perform your prescribed duty": "You have a right to do what is prescribed by the law or custom",
    
  ```

### `/api/i18n/meaning  [runMeaningGenerate]`
- **Payload**: word='Ahimsa', targetLanguage=en
- **Status**: ✅ PASSED
- **Response snippet**:
  ```
  {
  "word": "Ahimsa",
  "transliteration": "ahimasa",
  "meaning": "Non-violence",
  "usage_example": "The principle of non-violence, or ahimsa, is a fundamental ethical and moral principle that empha
  ```

---

## 🧾 Verdict

✅ **ALL ROUTES PASSED**

The self-hosted provider is correctly reachable from all Pramana route entry points.
Provider switching (`PRAMANA_INFERENCE_PROVIDER=self-hosted`) is verified end-to-end.