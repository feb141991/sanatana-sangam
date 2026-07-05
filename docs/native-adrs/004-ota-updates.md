# ADR 004: OTA Updates Architecture

- **Status:** Proposed
- **Context:** Native releases require agility to fix critical bugs or deliver dynamic content without waiting for App Store / Play Store review cycles. D014 classifies OTA updates as an architecture requirement. `app.json` has `eas` project ID configured.
- **Decision:** Use Expo Application Services (EAS) Update as the Over-The-Air update mechanism. We will utilize distinct release channels (e.g., `preview` for internal testing, `production` for live apps).
- **Alternatives considered:**
  - **CodePush (AppCenter):** Microsoft is retiring AppCenter. EAS Update is the modern, officially supported native solution for Expo.
- **Security/privacy impact:** Code updates bypass App Store review but must comply with guidelines (cannot alter the fundamental purpose of the app or execute arbitrary external scripts). 
- **Store-compliance impact:** Fully compliant with Apple (Guideline 2.5.2) and Google policies, provided updates only include JS/assets and do not significantly deviate from the reviewed app purpose.
- **Implementation tasks:**
  - Install `expo-updates`.
  - Configure `eas.json` with appropriate `preview` and `production` channels.
  - Add update initialization logic in the native root layout to dictate whether updates download automatically on start or via manual prompt.
- **Verification plan:** Publish a visible UI change via `eas update --branch preview` to a device running a preview build and verify the patch applies upon app restart.
- **Open questions:**
  - Should OTA updates be forced (blocking app load) for critical security patches, or always downloaded in the background for the next session?
