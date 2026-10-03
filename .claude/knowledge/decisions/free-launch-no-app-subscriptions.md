# Free launch without app subscriptions

Shoonaya is launching with every currently available app feature free. The
current product has no paid tiers, subscription purchase, lifetime purchase,
or entitlement-based feature gate. Monetization can be reconsidered only as a
separate product and store-compliance decision; new feature work must not
silently restore the old `is_pro` or subscription-status checks.

The backend keeps compatibility boundaries for already-installed clients:
pricing and account-subscription pages redirect, old checkout/activation/
history/cancellation endpoints return `410 Gone`, and the old provider webhook
returns an ignored acknowledgement without changing profile entitlements.
These endpoints must stay inert until a separately approved payments design
replaces them.

This code change does not cancel or refund provider-side transactions and does
not erase historical purchase records or profile entitlement columns. Those
require an explicit provider and legal-retention review. The prepared database
migration only removes automatic early-access Pro grants and the tiered KUL
membership limit; it has not been applied. KUL keeps a uniform six-member
limit. Calendar-feed subscriptions are a separate user-requested calendar-sync
feature and remain available.

Service quotas such as AI rate limits remain abuse and reliability controls,
not paid access gates.
