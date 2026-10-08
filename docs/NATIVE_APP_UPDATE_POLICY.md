# Native app update policy

`GET /api/native/app-version?platform=ios|android` is a public, read-only
contract used by the Native app. It contains only release metadata and links to
the official stores; it does not expose account data.

Configure these server-side variables before deploying the route:

| Variable | Meaning |
| --- | --- |
| `NATIVE_APP_LATEST_VERSION` | Latest released marketing version, as `major.minor.patch`. |
| `NATIVE_APP_MIN_SUPPORTED_VERSION` | Oldest version allowed to continue. Keep equal to latest unless an actual compatibility/security cutoff is needed. |
| `NATIVE_APP_STORE_URL_IOS` | HTTPS URL on `apps.apple.com` for Shoonaya. |
| `NATIVE_APP_STORE_URL_ANDROID` | HTTPS Play Store details URL for package `com.shoonaya.app`. |
| `NATIVE_APP_FORCE_UPDATE` | Optional literal `true` or `false`; `true` forces every client to update. |
| `NATIVE_APP_RELEASE_NOTES` | Optional release notes, maximum 2,000 characters. |

The route responds with `503 UPDATE_POLICY_UNAVAILABLE` when required policy is
missing or invalid. It intentionally does not invent a version or store URL.
The policy compares marketing VERSIONS only; it carries no build number.
Every store build of a release shares one version and differs only by an
auto-incremented build number, and nothing automatic tells the server which
build is live, so a build-number field needed a manual change after every
release and silently did nothing when forgotten. Routine same-version builds
reach users through Google Play and the App Store's own update notice and
auto-update. This policy is for a deliberate version bump (an optional nudge when
`NATIVE_APP_LATEST_VERSION` is raised) or forcing one. The retired
`NATIVE_APP_LATEST_BUILD_IOS` / `NATIVE_APP_LATEST_BUILD_ANDROID` variables are
ignored if still set; remove them from Vercel at your convenience.

The client owns the prompt and rollout behavior. Keep force-update disabled by
default; use the minimum-version gate for a real compatibility cutoff and the
force flag only for an urgent issue that makes the current binary unsafe or
unusable. OTA updates remain separate from store binaries and must target a
compatible Expo runtime.

Native sets `updates.checkAutomatically` to `ON_ERROR_RECOVERY`. Expo therefore
retains its emergency check after a failed update launch, while the app's
manager owns routine checks after startup readiness and on real
background-to-active resumes. This setting is embedded in native build
configuration, so already-installed binaries keep their previous Expo Updates
startup behavior until a new store binary is installed.
