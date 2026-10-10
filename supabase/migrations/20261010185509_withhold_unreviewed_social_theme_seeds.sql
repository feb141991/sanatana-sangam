-- The preceding seed migration was already applied before its textual
-- citations and translations received the required pramana review. Keep the
-- history immutable and fail closed: these rows remain available for an
-- editor to correct, but cannot be selected by the automation pipeline.
--
-- Rollback guidance: reactivate individual rows only after replacing their
-- grounding_material with reviewed source metadata and recording that review.

update public.social_general_themes
set
  is_active = false,
  updated_at = now()
where title in (
  'Japa & Sacred Mantras',
  'Brahma Muhurta & Morning Rhythm',
  'Bhagavad Gita & Philosophy',
  'Panchang & Sacred Time',
  'Dhyana & Inner Peace',
  'Ayurveda & Dinacharya',
  'Dharmic Values & Living Truth',
  'Tirtha & Sacred Bharat'
);
