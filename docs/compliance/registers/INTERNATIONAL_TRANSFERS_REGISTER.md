# International Transfers Register

DPAs are recorded as executed for all 8 vendors below per founder
confirmation `APPR-20260825-02` (2026-08-25). This closes the "DPA executed"
question but is **not** the same claim as a completed Transfer Risk
Assessment: destination region, specific SCC module/IDTA text, and
supplementary technical measures per vendor have not been independently
verified against the signed documents by engineering, since those documents
live in the private vault, not in this repository. Treat the `Transfer
Mechanism` and `Supplementary Technical Measures` columns below as the
vendor's standard/default terms unless a vault record says otherwise for a
specific vendor.

## Cross-Border Transfer Flows

| Transfer ID | Data Exporter | Data Importer (Vendor) | Destination Country | Data Categories Transferred | Transfer Mechanism | Supplementary Technical Measures | Transfer Risk Assessment (TIA) ID |
|---|---|---|---|---|---|---|---|
| `XFER-01` | Shoonaya (UK/Global) | Supabase Inc. | Provider regions to confirm | Account, Profile, Birth, Sadhana, UGC | DPA executed (standard online DPA) | Application RLS verified; provider controls per vendor DPA | `VAULT-TIA-SUPABASE-01: on file (APPR-20260825-02)` |
| `XFER-02` | Shoonaya (UK/Global) | Vercel Inc. | Provider regions to confirm | Web traffic metadata, telemetry | DPA executed (standard online DPA) | Runtime configuration verified; provider controls per vendor DPA | `VAULT-TIA-VERCEL-01: on file (APPR-20260825-02)` |
| `XFER-03` | Shoonaya (UK/Global) | 650 Industries (Expo) | Provider regions to confirm | Push tokens, build manifests | DPA executed (standard online DPA) | Application token handling verified; provider controls per vendor DPA | `VAULT-TIA-EXPO-01: on file (APPR-20260825-02)` |
| `XFER-04` | Shoonaya (UK/Global) | Google LLC (FCM / OAuth) | Provider regions to confirm | FCM tokens, OAuth identifiers | DPA executed (standard online DPA) | Provider controls per vendor DPA | `VAULT-TIA-GOOGLE-01: on file (APPR-20260825-02)` |
| `XFER-05` | Shoonaya (UK/Global) | Apple Inc. (APNs / Sign-in) | Provider regions to confirm | APNs tokens, Apple Relay IDs | Agreement executed (Apple Developer Program terms) | Provider controls per Apple terms | `VAULT-TIA-APPLE-01: on file (APPR-20260825-02)` |
| `XFER-06` | Shoonaya (UK/Global) | Twilio Inc. | Provider regions to confirm | Phone numbers for OTP auth | DPA executed (standard online DPA) | Retention and provider controls per vendor DPA | `VAULT-TIA-TWILIO-01: on file (APPR-20260825-02)` |
| `XFER-07` | Shoonaya (UK/Global) | Sarvam AI | India / provider regions to confirm | Scripture snippets for TTS synthesis | Agreement executed | Prompt retention and provider controls per vendor agreement | `VAULT-TIA-SARVAM-01: on file (APPR-20260825-02)` |
| `XFER-08` | Shoonaya (UK/Global) | Razorpay Software Pvt. Ltd. | India / provider regions to confirm | Payment transactions, donor billing | Merchant agreement executed | Payment controls per merchant agreement | `VAULT-TIA-RAZORPAY-01: on file (APPR-20260825-02)` |

## Required Legal Actions

1. ~~Formalize and execute standard online DPAs and UK International Data Transfer Addenda (IDTA) with all US-based processors.~~ DPA execution confirmed 2026-08-25 for all 8 vendors (`APPR-20260825-02`).
2. Independently verify destination region, SCC module/IDTA text, and technical measures per vendor against the signed documents in the vault — this register currently reflects "DPA executed" as reported, not an engineering-verified reading of each contract's specific terms.
