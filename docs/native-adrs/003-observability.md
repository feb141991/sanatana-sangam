# ADR 003: Observability Architecture

- **Status:** Proposed
- **Context:** D014 dictates that OTA update and crash observability are architectural requirements, not polish. The native app currently lacks an integrated telemetry SDK for crash reporting and error tracking in production builds.
- **Decision:** Adopt Sentry (`@sentry/react-native`) as the primary observability platform for native crash reporting, unhandled exception tracking, and release health metrics.
- **Alternatives considered:**
  - **Firebase Crashlytics:** Excellent native stack traces but splits the observability ecosystem if the web app uses something else, and requires Google Services tightly coupled into the build.
  - **Bugsnag:** Good alternative but Sentry offers better native Expo integration.
- **Security/privacy impact:** Sentry must be configured to scrub PII (Personally Identifiable Information). Passwords, tokens, and specific geographic data must be sanitized before transmission.
- **Store-compliance impact:** App privacy nutrition labels (App Store) and Data Safety forms (Play Store) must declare crash data collection.
- **Implementation tasks:**
  - Install and configure `@sentry/react-native`.
  - Add Sentry Expo plugin to `app.json`.
  - Configure sourcemap uploading during EAS Build.
  - Wrap the root component in `Sentry.wrap()`.
- **Verification plan:** Force a native runtime crash in a staging EAS build and verify the symbolicated stack trace appears in the Sentry dashboard.
- **Open questions:**
  - Do we have the necessary Sentry DSN and organization access provisions for the native project?
