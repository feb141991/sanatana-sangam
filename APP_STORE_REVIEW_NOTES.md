# App Store & Google Play Review Notes

## Overview
Shoonaya is a spiritual companion app. Below are specific notes regarding the use of sensitive device permissions to facilitate a smooth review process.

## Location Usage
**Why we request it:**
Shoonaya uses location data to:
1. Show users nearby temples and sacred places (Tirtha feature).
2. Connect users with local spiritual groups (Mandali feature).
3. Calculate accurate sacred-times (Panchang) for the user's specific geographic area.

**User Experience:**
- Location is NOT requested on app startup.
- It is only requested when a user explicitly taps "Detect my location" in Onboarding or within the Tirtha Map/Mandali discovery flows.
- A clear pre-prompt explanation is provided ("Used to show nearby temples, connect you with local Mandalis, and calculate accurate sacred-times for your area. Your exact location is never stored.").
- User location data is temporary, not tracked, and not stored permanently on our servers.

## Microphone Usage
**Why we request it:**
Shoonaya includes a feature called "Pathshala Recitation", where users can practice reciting sacred texts. The app uses the microphone to record the user's voice and then uses an AI engine (Shruti Engine) to score their pronunciation.

**User Experience:**
- Microphone access is NOT requested on app startup.
- It is only requested when the user navigates to a recitation lesson and explicitly taps the "Start recording" (microphone) icon.
- Audio is processed for pronunciation scoring and is not stored or shared publicly.

## Notifications
**Why we request it:**
To provide users with reminders for their daily spiritual practices (Sadhana), Brahma Muhurta alerts, and important festival notifications.

**User Experience:**
- Notification permission is NOT requested on app startup.
- It is requested contextually from the notification settings panel when a user actively chooses to enable reminders.

## Camera / Photo Library
**Why we request it:**
To allow users to upload profile avatars, cover photos, or share images within their private Mandali groups.

**User Experience:**
- Accessed solely via standard OS file pickers when the user explicitly chooses to upload an image.

---
*For any questions or a demo account for the reviewer team, please refer to the submission metadata.*
