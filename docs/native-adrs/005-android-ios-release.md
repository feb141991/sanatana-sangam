# ADR 005: Android/iOS Release Architecture

- **Status:** Proposed
- **Context:** Preparation for App Store and Play Store distribution. `app.json` specifies bundle IDs (`com.shoonaya.app`) and explicit permission descriptions. D019 identifies Android release signing as a P0 gate, and D011 mandates Apple Sign-In if Google/social login is present.
- **Decision:** 
  1. **Builds:** Exclusively use EAS Build (`eas build --platform all`) to generate `.aab` (Android) and `.ipa` (iOS) binaries to maintain CI/CD reproducible builds.
  2. **Signing:** Use EAS Managed Credentials. EAS will securely manage the Android Keystore and iOS Distribution Certificates/Provisioning Profiles.
  3. **Continuous Native Generation:** Keep the `android/` and `ios/` folders out of version control and rely entirely on Expo Prebuild (Continuous Native Generation) to dynamically generate native code during the EAS build phase.
  4. **Auth Compliance:** Ensure `expo-apple-authentication` is wired up and visibly equivalent to other social logins on iOS devices.
- **Alternatives considered:**
  - **Local Builds:** Running Xcode/Android Studio locally. Rejected because it fragments the build environment and increases developer onboarding friction.
  - **Local Keystore Tracking:** Committing an encrypted keystore to the repo. EAS Managed Credentials provide better security boundaries and team access control.
- **Security/privacy impact:** Keystores and Apple Developer keys remain entirely in the EAS secure vault, never touching developer machines directly.
- **Store-compliance impact:** The app declares clear, purposeful strings in `app.json` for Location, Microphone, and Camera.
- **Implementation tasks:**
  - Run `eas credentials` to instantiate Android keystore and iOS profiles.
  - Configure `eas.json` for production profiles (`submit` definitions for automated store deployments).
  - Setup Apple Developer account and Google Play Console app entries.
- **Verification plan:** Successfully compile a standalone `production` profile build on EAS and upload the artifacts to TestFlight / Google Play Internal Testing.
- **Open questions:**
  - Who holds the primary administrative access to the Google Play Console and Apple Developer accounts to link to EAS?
