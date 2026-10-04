# Native App Update Policy and Lifecycle

**Date:** 2026-10-04
**Session context:** Reviewing the Native OTA and store-binary update manager
**Category:** architecture

## What we decided
The backend owns the canonical public store-version policy at
`GET /api/native/app-version?platform=ios|android`; it returns validated
marketing/build versions, minimum supported version, force-update state,
release notes and official platform store links. The Native app validates that
response and owns the presentation and user action. EAS OTA updates remain a
separate channel from store binaries.

The Native update manager owns routine OTA checks after startup readiness and
on real background-to-active resumes. Expo keeps its `ON_ERROR_RECOVERY`
fallback for emergency recovery after a failed update launch. A store prompt
takes precedence over an OTA prompt so two update alerts cannot compete.

## Why
The first Native implementation called a backend route that did not exist,
treated JSON as trusted, ignored the declared build number, could run Expo's
normal `ON_LOAD` check alongside its delayed managed check, and launched both
store and OTA prompts concurrently. The route is public release metadata, so
auth and user-specific storage add no value. Server configuration fails closed
rather than making up a release version or store destination.

Expo's update configuration is embedded in the native binary. Changing
`checkAutomatically` therefore requires a new store binary; it cannot be
retroactively changed in already-installed builds. Existing installs may keep
the old launch check until updated.

## Constraints this creates
- Keep the policy endpoint public, read-only, platform-qualified and free of
  account data.
- Set `NATIVE_APP_LATEST_VERSION`, `NATIVE_APP_MIN_SUPPORTED_VERSION`, both
  store URLs, and optional per-platform build numbers in the backend's runtime
  environment before relying on store prompts. Missing or malformed values
  return `503 UPDATE_POLICY_UNAVAILABLE`.
- Keep `NATIVE_APP_FORCE_UPDATE` false unless the installed app is unsafe or
  unusable; prefer a minimum-version cutoff for ordinary compatibility changes.
- Compare build numbers only for the same marketing version and correct
  platform.
- Keep OTA checks single-flight, delayed until app readiness, and limited to
  background-to-active foreground returns. Preserve Expo runtime compatibility
  rules for every OTA release.
- Keep Expo's `ON_ERROR_RECOVERY` emergency check while the manager handles
  routine checks. Do not claim current store rollout is live until backend
  config is deployed and tested, and a new binary carrying the checked
  `ON_ERROR_RECOVERY` setting is built and installed.

## What we explicitly rejected
- Trusting unvalidated JSON or arbitrary URL protocols/hosts from the policy
  response.
- Treating OTA JavaScript updates as a replacement for native store builds.
- Allowing Expo's normal `ON_LOAD` launch check and the app's routine managed
  check to run as duplicate owners in newly built binaries.
- Showing store and OTA update alerts in parallel.

---
