# Lock-screen discretion

**Status (2026-11-12):** The preference column is present in production. The backend and Native implementation are prepared on their existing `notif-discreet-mode` branches. Verify the sender and profile endpoint in the deployed revision before offering the switch.

## 1. What it is

A setting, off by default: **"Hide notification details"**. When a person switches it on, every push we send them says only
**"Shoonaya — You have a new notification."** The real title and body appear when they open the app, where the inbox is unchanged.

Why: a phone is often seen by other people, and a notification can name a practice, a festival, a family remembrance, a Sanskāra
milestone, a Mandali comment or a mood prompt. Some people will not want that on a locked screen, a shared tablet or a watch. No study of
this was found for religious apps (`NOTIFICATION_EVIDENCE_REVIEW.md`, section 5), so this is a design judgement; the founder-run
conversations (study plan question 4) should refine it.

## 2. How it works

- `profiles.notification_discreet_mode boolean NOT NULL DEFAULT false`. The migration adds a column and changes no row.
- `push-server.ts` is the only code that talks to Expo. For each recipient with a token it looks up who switched the setting on and, for
  those people, replaces `title` and `body` (nothing else). `data` is left alone: the tap destination (`data.url`) and the notification
  type are not displayed, and a tap must still open the right screen.
- **Replaced at the server, not left to the phone.** iOS's own "Show Previews" and Android's lock-screen visibility are the person's
  device settings and vary by phone; the app cannot force them. Replacing the text works the same on both and cannot be defeated by an
  OS setting being on.
- **Security notices are never replaced** (`DISCREET_EXEMPT_TYPES`): they must say what happened and name nothing from the app.
- **Fails closed.** The sender reads each Expo batch immediately before sending it. Only a confirmed `false` allows full text. A missing profile, missing column or failed lookup gives regular notifications the neutral line.
- Native enables the switch only after authenticated `GET /api/native/notification-discretion` returns a boolean. This route ships with the sender implementation. A standalone database column does not signal readiness.
- The authenticated profile PATCH accepts a strict boolean. Native shows the new value only when the response acknowledges that exact value. A failed or uncertain save requires a fresh read.

## 3. Limits to say plainly

- A notification already sent or in flight can still show its original text. The new preference is read before the next Expo batch.
- It hides the wording, not the fact that Shoonaya sent something, and not when.
- In-app notification rows (the bell, the inbox) are unchanged: they are behind the app.
- The neutral line is English only. A Hindi version would be an unreviewed draft (reviewers are deferred by the founder), so none ships.
- A tap still routes correctly and is still counted for tap tracking (the key travels in `data`).
- Not verified on a device: how the neutral line looks on a locked iPhone or Android screen, or on a watch.

## 4. Defaults and open decisions for the founder

- **Default off.** Nothing changes for anyone until they switch it on. A default-on setting, or an onboarding question, is a product
  decision (onboarding already asks about every reminder one by one; adding a question there is easy but not assumed).
- **Wording** of the switch includes a Hindi label and an English privacy explanation.
- Whether any other type should be exempt (only `security` is).

## 5. Rollout and risk (ROC, AGENTS section 4)

The existing migration adds the boolean column. This rollout adds no migration or RPC. Deploy the backend first, then verify an authenticated read and acknowledged save. With an authorized test account, verify the next regular push on locked iOS and Android and confirm that tapping it still opens the intended destination. Then release Native.

If reverting the Settings UI or API, keep redaction in the sender. Reverting to a sender that ignores the preference can expose details for people who enabled it.

## 6. Not built: per-category Android channels (the other half of item 4)

Findings recorded now so the next session does not rediscover them (Expo SDK 57 docs, read 2026-11-10):
- **A push that names an Android channel the device has not created is NOT DISPLAYED AT ALL.** The sender today names `default`, which
  every install has. Sending any new channel id to an app that has not created it would silently drop those pushes. A safe rollout needs a
  handshake: the app reports the channel set it has created when it registers its token, and the backend uses a new id only for tokens that
  report it, falling back to `default` otherwise.
- A channel's importance, sound and lock-screen visibility **cannot be changed after it is created** (only its name and description),
  so ids and importance levels must be chosen once, carefully; a change means a new id.
- Android 13 asks for notification permission only once at least one channel exists.
- 22 of the 24 push tokens at the 2026-11-07 audit were Android, so this half has the larger audience.
