# ADR 002: Notification Architecture

- **Status:** Proposed
- **Context:** The web application successfully uses OneSignal for push notifications with strict preference gating and legacy Web Push removed. The native app has `onesignal-expo-plugin`, `react-native-onesignal`, and `expo-notifications` installed. D006 states OneSignal native is the accepted push direction.
- **Decision:** 
  1. Adopt the OneSignal React Native SDK (`react-native-onesignal`) as the primary push delivery mechanism.
  2. Maintain `expo-notifications` exclusively for local, on-device scheduled reminders (if offline guarantees are strictly required, such as a daily offline alarm), but rely on OneSignal for all server-driven payloads.
  3. Ensure the push permission flow is strictly contextual and user-initiated, mirroring the web's contextual push onboarding.
- **Alternatives considered:**
  - **Firebase Cloud Messaging (FCM) + APNs direct:** Requires maintaining dual push infrastructures and manual token rotation logic, which OneSignal already abstracts away across both web and native.
- **Security/privacy impact:** Notification permissions must only be requested contextually (e.g., when enabling a reminder). User Player IDs map to Supabase safely.
- **Store-compliance impact:** Both Apple and Google mandate that push permissions are not requested coercively on app startup. We must provide manual fallback functionality.
- **Implementation tasks:**
  - Configure OneSignal initialization in the native `_layout.tsx` or a custom provider.
  - Map the OneSignal `external_id` securely to the Supabase authenticated `user_id`.
- **Verification plan:** Trigger a test push from the web admin panel to a registered native device.
- **Open questions:**
  - Do we need a custom notification service extension in iOS to handle rich media or badge incrementing via OneSignal? (Already defined in `app.json` EAS config).
