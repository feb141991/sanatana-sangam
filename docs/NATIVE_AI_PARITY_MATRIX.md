# Native AI Parity Matrix

This matrix tracks PWA AI-assisted surfaces against the native app. Native should reuse the same web API contracts rather than adding client-only AI logic.

| PWA surface | Web API | Native status |
| --- | --- | --- |
| Dharma Mitra chat | `/api/ai/chat` | Wired in `app/ai-chat.tsx`. |
| Japa completion insight | `/api/japa/completion-insight` | Wired in `app/japa.tsx`. |
| Japa share card | PWA canvas share-card renderer | Native now renders a 9:16 React Native card and captures PNG via `react-native-view-shot`. |
| Dharm Veer Ask AI | `/api/ai/chat` with `mode: dharam_veer_reflection` | Wired in `app/dharm-veer/[id].tsx`. |
| Dharm Veer sharing | PWA text/share reflection flow | Native now captures an image card; SVG data-URI poster path removed. |
| Name Story | `/api/name-story/generate` | Wired in native onboarding; route updated to support Bearer auth via `getApiUser(req)`. |
| Mood recommendations | `/api/mood/recommendations`, `/api/mood/reflection-summary` | Wired in `app/mood.tsx` and `app/my-progress/mood.tsx`. `/api/mood/recommendations` is deterministic ranking, not RAG or generation. `/api/discover/mood` adds generated insights on top of this and remains unwired natively. |
| Jyotish chart | `/api/jyotish/chart` | Wired in `app/kundali.tsx`. |
| TTS generation | `/api/tts/generate` | Wired in Japa and Pathshala lesson reader. |
| Pathshala AI explain links | `/api/ai/chat` through web deep links | Wired in `app/pathshala/[pathId]/[lessonId].tsx` linking to `app/ai-chat.tsx` with initial verse prompts. |
| Pathshala reflection bridge | `/api/pathshala/bridge` | Wired in `app/pathshala/[pathId]/[lessonId].tsx`; fetched on lesson completion and rendered in `PathshalaCompletionModal`. Route now Bearer-and-cookie authenticated via `getApiUser(req)`. Not RAG — model call on lesson/path metadata only, with the modal's static reflection as the failure fallback. |
| Pathshala path recommendation | `/api/pathshala/recommend` | Route made Bearer-and-cookie authenticated via `getApiUser(req)`, but no native caller exists yet — deferred pending a decision on whether a deterministic `SEED_PATHS` selection plus one AI-written sentence justifies a native model call. |
| Sadhana Journal AI reflection | `/api/journal/reflect` | Deferred with Sadhana Journal native route; no native journal screen exists yet. Cookie-authenticated only — will need native Bearer auth work when that screen is built. Generation, not RAG: sends journal/profile fields to the model and asks for a scripture quotation, with no retrieval step. |
| Kul Sanskara AI nudge | `/api/sanskar/suggest` | Deferred with Kul native route; no native Kul/Sanskara screen exists yet. |
| Quiz AI generation/practice | `/api/quiz/daily`, `/api/quiz/practice` | Daily quiz is wired; AI practice route is not yet a native screen. |

## Current rule

If the native screen exists, AI affordances should be wired to the same PWA route. If the native screen does not exist, the AI surface remains deferred with that screen migration and must not be replaced by static local logic.
