# Pramana TTS Product Policy

This document standardizes how Text-To-Speech (TTS) is used across the Shoonaya application, aligning voice profiles with tradition correctness, provider capabilities, and cost efficiency.

## 1. Voice Profiles

### A. Pandit (Recitation)
- **Use Case**: Sanskrit verses, Shlokas, Mantras, Stotrams, and Gurmukhi Paath.
- **Tone**: Deep, resonant, meditative, slow-paced.
- **Provider Preference**: Sarvam (Amrit/Aravind) or Google (Neural2-B/Wavenet-B).
- **Cache Behavior**: High priority. Must be cached indefinitely.
- **Precompute Eligibility**: Yes. All core canonical texts (e.g., Gita verses) should be precomputed at build time.

### B. Akash (Narration)
- **Use Case**: Bhakti stories (Katha), lesson explanations, meaning summaries, guided meditations.
- **Tone**: Warm, storytelling, engaging, conversational.
- **Provider Preference**: Sarvam (Aravind/Meera) or Google (Standard/Wavenet).
- **Cache Behavior**: High priority.
- **Precompute Eligibility**: Yes, for static stories and lessons. No, for personalized insights.

### C. Standard (Neutral)
- **Use Case**: General UI feedback, dictionary translations, short factual answers.
- **Tone**: Clear, neutral, brisk.
- **Provider Preference**: Google (Standard) or Sarvam.
- **Cache Behavior**: Medium priority.
- **Precompute Eligibility**: No. Often generated dynamically.

## 2. TTS Exclusion Policy (What Never to Synthesize)

To prevent uncanny valley effects and save compute costs, the following should **NEVER** automatically use AI TTS:
1. **DharmaChat Back-and-Forth**: Reading out every single conversational AI chat bubble is intrusive and expensive. TTS in chat must be strictly opt-in via a "Read Aloud" button.
2. **Notification Payloads**: Short push-notification style text ("Your milestone is reached") should not trigger a TTS generation event on the server.
3. **Panchang Tithi Data**: Purely numerical/astrological data tables should not be synthesized unless explicitly requested in a "Daily Briefing" context.

## 3. Cost & Quality Wins
- **Biggest Quality Win**: Separating the `pandit` policy ensures that sacred Sanskrit texts are not read with a brisk, conversational tone, which breaks immersion and tradition correctness.
- **Biggest Cost Win**: Strictly excluding chat bubbles from automatic TTS prevents runaway Sarvam/Google API spend from heavy chat users.
