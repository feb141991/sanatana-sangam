# Pramana TTS Object Storage Readiness Plan

This document prepares the Shoonaya text-to-speech (TTS) system for migration from inline, on-the-fly audio generation toward a fully cached, object-storage-backed asset pipeline.

## 1. Current Storage Landscape
- **Environment**: Next.js (Vercel) + Supabase (Postgres Database).
- **Existing Storage**: The repository already relies on Supabase for database operations (`@supabase/supabase-js`, `createServerSupabaseClient`).
- **Conclusion**: Supabase Storage is the cleanest, lowest-friction object storage vendor to use. No new vendor integration is required.

## 2. Object Storage Strategy

### Target Bucket
- **Bucket Name**: `shoonaya-tts-cache` (Public bucket)
- **Permissions**: Public read (no auth required to fetch MP3s), authenticated service-role write.

### Object Key Naming
Cache keys must be deterministic to ensure identical requests resolve to the same file.

**Algorithm**:
```typescript
const hashInput = `${text}|${provider}|${voice}|${quality}|${rate}`;
const key = crypto.createHash('sha256').update(hashInput).digest('hex');
const objectPath = `audio/${key}.mp3`;
```

### Invalidation & Versioning
- **Versioning**: Audio files are treated as immutable content-addressed assets.
- **Invalidation**: If a text changes (even a single punctuation mark), a new hash is generated. The old file remains until a bucket cleanup script runs (e.g., deleting unreferenced files older than 90 days), meaning no manual CDN or bucket invalidation is ever required.

## 3. API Route Resolution Flow

When `/api/tts` receives a request, the flow should be:
1. Generate the deterministic hash key.
2. Check local/memory cache for the URL (interim fast path).
3. Check the Supabase `shoonaya-tts-cache` bucket.
   - **Hit**: Return the public URL to the client immediately.
   - **Miss**: 
     a. Call the TTS provider (Sarvam/Google).
     b. Upload the returned base64 audio buffer to Supabase Storage.
     c. Return the new public URL to the client.

## 4. Immediate Next Steps (Prerequisites for Go-Live)
To fully switch to this model in production:
1. Create the `shoonaya-tts-cache` bucket in the Supabase project dashboard.
2. Ensure the Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) is available to the API route for uploading.
3. Update `src/lib/tts/cache.ts` (currently designed as an interim memory cache) to read/write from Supabase Storage instead.

Until these steps are completed, the system will use the interim short-lived memory cache strategy defined in `src/lib/tts/cache.ts`.
