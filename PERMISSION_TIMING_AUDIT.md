# Permission Timing Audit

Last updated: 2026-05-19

## Principle

Every sensitive permission must be requested only in the moment of clear user intent. No startup prompt, no generic wall, no speculative permission request.

## Current audit

### Notifications

Current state:
- Prompt is shown from bell/pill UI, not at app boot.
- This is acceptable.

Remaining work:
- unify prompt copy across `TopBar` and `FloatingPill`
- verify denied-state recovery UX on iOS and Android
- verify prompt only appears when reminder preferences are enabled

### Location

Current state:
- Requested in onboarding, Tirtha, and Mandali discovery actions through `navigator.geolocation`.
- This is mostly contextual, but copy is inconsistent.

Remaining work:
- standardize pre-permission explanation
- document exact purpose: nearby temples, mandalis, local sacred-time relevance
- verify no silent re-prompts after denial

### Microphone

Current state:
- Requested during recitation/audio recording flows through `useNativeAudio` and direct `getUserMedia` usage.
- Contextual and acceptable.

Remaining work:
- unify microphone permission handling so recitation routes do not bypass the shared hook
- ensure one clear explanation before first request
- add reviewer note for scripture recitation scoring / TTS loops

### Camera / photos

Current state:
- Avatar and cover uploads use file pickers.
- No separate camera permission flow exists in this web shell.

Remaining work:
- describe usage in privacy/store metadata
- if native app adds camera capture, request only from explicit “take photo” action

### Clipboard / share

Current state:
- Used opportunistically from explicit copy/share taps.
- Acceptable.

Remaining work:
- no blocker, but remove fallback `alert()` patterns

### Local storage / app preferences

Current state:
- Extensively used for UI preferences, caches, recent searches, and temporary continuity.
- No runtime permission is needed.

Remaining work:
- reduce business-critical reliance on local-only state where cross-device truth matters

### Haptics

Current state:
- Used in practice flows.
- No standalone permission needed on current platforms.

Remaining work:
- add reduced-motion/sensory fallback consistency

## Priority fixes

1. Standardize location pre-prompt copy
2. Standardize microphone permission entry point
3. Remove any remaining browser-native `alert()` fallback around share/copy flows
4. Add reviewer-facing permission notes before store submission
