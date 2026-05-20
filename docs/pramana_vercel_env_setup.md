# Vercel Environment Setup for Sarvam AI

This document outlines the environment configuration required to safely deploy Shoonaya with Sarvam AI integrations across Vercel environments.

## 1. Environment Variables

To enable Sarvam features (Reasoning, Translation, TTS), the following variable must be set:

```env
SARVAM_API_KEY="your-sarvam-subscription-key"
```

To explicitly route conversational reasoning (DharmaChat, Explainers) to Sarvam instead of Gemini, set:

```env
PRAMANA_INFERENCE_PROVIDER="sarvam-hosted"
```
*(If omitted, reasoning defaults to Gemini, but TTS and Translations will still opportunistically use Sarvam if the key is present).*

## 2. Environment-Specific Guidance

### Local Development (`.env.local`)
- **Action**: Add `SARVAM_API_KEY` to your `.env.local`.
- **Inference**: Set `PRAMANA_INFERENCE_PROVIDER="localhost"` to use local Ollama, or `sarvam-hosted` to test Sarvam reasoning.

### Preview / Staging (Vercel Preview Env)
- **Action**: Add `SARVAM_API_KEY` to the Vercel dashboard under the **Preview** environment.
- **Inference**: Set `PRAMANA_INFERENCE_PROVIDER="sarvam-hosted"` to allow QA to validate Sarvam reasoning.
- **Warning**: Ensure Preview deployments are not pointing to production Supabase instances if doing destructive scale testing.

### Production (Vercel Production Env)
- **Action**: Add `SARVAM_API_KEY` to the Vercel dashboard under the **Production** environment.
- **Inference**: **DO NOT** set `PRAMANA_INFERENCE_PROVIDER` in production until Sarvam reasoning passes all Level 3 validation gates. Let it default to Gemini.

## 3. Key Rotation & Replacement Checklist
If the Sarvam key is compromised or rotated:
1. Generate a new key in the Sarvam AI dashboard.
2. Update the `SARVAM_API_KEY` value in the Vercel Project Settings -> Environment Variables.
3. Check the "Redeploy" box or trigger a manual redeployment for Production to inject the new key into the running Edge/Node functions.
4. Verify TTS generation works immediately after deployment.

## 4. Rollback Path
If Sarvam APIs degrade or cause production errors, the rollback path is immediate and requires no code changes:
1. Delete or rename the `SARVAM_API_KEY` variable in Vercel.
2. Trigger a redeploy.
3. **Result**: TTS will gracefully fallback to Google Cloud TTS, translations will fallback to Gemini, and reasoning will default to Gemini.
