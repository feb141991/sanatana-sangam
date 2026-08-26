# AI & Automated Guidance Impact Assessment (Ask Pramana)

**Assessment Reference:** `REC-DPIA-AI`  
**Platform Area:** Pramana AI Platform, Theological QA, and Indic Text-to-Speech (TTS)

## 1. System Overview

Ask Pramana is a scripture-grounded spiritual question-answering assistant. It utilizes Retrieval-Augmented Generation (RAG) over curated public-domain and licensed Hindu scriptural texts (Bhagavad Gita, Upanishads, Valmiki Ramayana, Vedic hymns).

## 2. Privacy & Safety Safeguards

1. **Zero Persistent User Prompt Logging**: User queries submitted to `/api/pramana/query` are processed in-memory for vector retrieval and streaming response generation. Prompts are not permanently written to the application database.
2. **Grounding & Hallucination Prevention**: Pramana strictly enforces scriptural citations. If an answer cannot be grounded in retrieved pramana (scriptural evidence), the system fails closed with an explicit disclaimer.
3. **Zero Model Training on User Data**: Third-party inference agreements (Sarvam AI) prohibit training on user prompt payloads.
4. **Speech Synthesis Data Minimization**: TTS requests (`/api/pramana/tts`) stream generated audio directly to the client player; audio buffers are not retained on server storage.
