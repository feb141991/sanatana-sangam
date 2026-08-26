# Religious and Special Category Data Assessment

**Assessment Reference:** `REC-DPIA-REL`  
**Statutory Basis:** UK GDPR / EU GDPR Article 9(1) & 9(2)(a), India DPDP Act 2023

## 1. Nature of Data Collected

Shoonaya processes categories of personal data that directly reveal or imply religious and philosophical beliefs:
- `tradition` (e.g. Vaishnava, Shaiva, Shakta, Smartha, Buddhist, Sikh, Jain)
- `sampradaya` (specific lineage / philosophical sub-tradition)
- `gotra` (ancestral lineage)
- `devata` / `deity_preference` (chosen deity / ishta devata)
- `rashi` & `nakshatra` (Vedic astrological markers)
- `vrat_observations` (fasting and holy day observance logs)
- `japa_sessions` (sacred mantra chanting counts)

## 2. Lawful Basis & Article 9 Condition

- **Article 6 Basis**: `Art. 6(1)(b) Contract Performance` (providing the personalized spiritual companion service requested by the user).
- **Article 9 Condition**: `Art. 9(2)(a) Explicit Consent` (`PROPOSED_COUNSEL_REVIEW`).

### Key Controls & Remediations
1. **No Silent Defaults**: The legacy `consent_religious_data: true` default has been permanently removed from `app/settings.tsx`.
2. **Decoupled Settings**: Users can toggle off religious personalization at any time without terminating their basic account.
3. **Field Clearing**: Users can edit their profile and set sensitive fields to `null` to immediately halt tradition-specific filtering.
4. **Zero Anonymous Access**: Following migration `20260824162430_lock_down_profiles_reads.sql`, unauthenticated public callers cannot query or enumerate user traditions.
