# Children and Age-Appropriate Design Assessment

**Assessment Reference:** `REC-DPIA-AGE`  
**Evaluation Target:** Shoonaya Web PWA & Native Mobile Applications  
**Jurisdictional Benchmarks:** UK Age-Appropriate Design Code (AADC), US COPPA, India DPDP Act 2023 (Section 9)

## 1. Product Context & Target Audience

Shoonaya is a spiritual and cultural companion designed for general adult audiences interested in Sanatan Dharma, Vedic astronomy, meditation, and philosophy. It is **not directed to children under 13**, but recognizes that teenagers and families may explore festivals, stories, and cultural learning.

## 2. Implemented Age Guidance Architecture

On **2026-08-25**, the Founder approved a versioned, non-blocking age guidance policy implemented in `src/lib/compliance/age-guidance.ts`:

- **Policy Statement**: Shoonaya is not directed to children under 13. Users aged 13–17 are guided to explore the platform with the involvement of a parent or guardian.
- **Non-Blocking Access**: Account creation and exploration are not hard-blocked by an intrusive age verification wall, avoiding the disproportionate collection of government IDs from adult users.
- **Entry Point Guidance**: The `AgeGuidanceNotice` component is embedded directly at all active Date of Birth (DOB) and family data input surfaces:
  - Onboarding Date of Birth step (`src/app/(main)/onboarding/OnboardingClient.tsx`)
  - Profile Edit Date of Birth picker (`src/app/(main)/profile/ProfileClient.tsx`)
  - Kundali Astrological Chart Generator (`src/app/(main)/kundali/KundaliClient.tsx`)
  - Kul Vansh Family Member Entry form (`src/app/(main)/kul/components/KulVanshForm.tsx`)
- **Terms & Privacy Transparency**: Standard clauses are prominently embedded in `src/lib/terms-content.ts` and `src/lib/privacy-content.ts`.

## 3. High-Risk Children's Data Safeguards

| Feature / Data Area | Inherent Risk | Technical Control | Status |
|---|---|---|---|
| **Astrological Chart Calculation** | Minor's DOB, birth time, and birth city entered for horoscope generation. | Data is used solely for mathematical planetary ephemeris calculation (`astronomy-engine`). It is never sold, used for behavioral profiling, or shared with advertising networks. | **SECURED** |
| **Mandali Community UGC** | Minors participating in public forum discussions. | Content reporting, keyword filtering, authenticated write routes, blocking/muting, and zero direct private messaging (DMs). | **SECURED** |
| **Geolocation** | Tracking minor's location. | Foreground-only location access; zero background geofencing; coordinates used solely for local civil sunrise computation. | **SECURED** |
| **Parental Consent Distinction** | Conflating soft guidance with statutory verified parental consent (VPC). | System explicitly flags `verifiedParentalConsentImplemented: false` to prevent false compliance claims. | **FACT_VERIFIED** |

## 4. Open Legal Actions
- Obtain counsel review for target-market statutory requirements prior to country-specific marketing campaigns.
