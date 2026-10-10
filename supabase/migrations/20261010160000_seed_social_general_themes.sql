-- Seed canonical cornerstone subcategories into social_general_themes for non-festival days
-- Upholds Spiritual Content Integrity: every theme provides verified grounding material.

insert into public.social_general_themes (
  title,
  prompt_seed,
  grounding_material,
  is_active,
  display_order
)
values
  (
    'Japa & Sacred Mantras',
    'Focus on the meditative power of continuous mantra repetition and how daily japa anchors the restless mind.',
    'Scriptural grounding: Bhagavad Gita 10.25 ("Yajnanam japa-yajno ''smi" — "Of sacrifices I am the sacrifice of silent repetition"). Patanjali Yoga Sutras 1.28 ("Taj-japas tad-artha-bhavanam" — "Repeat the sacred mantra and contemplate its meaning"). Tradition highlights using tulsi or rudraksha mala, steady breath, and sincere devotional focus without haste.',
    true,
    1
  ),
  (
    'Brahma Muhurta & Morning Rhythm',
    'Explore the spiritual significance of rising during Brahma Muhurta to begin the day in peace, clarity, and communion.',
    'Scriptural grounding: Ashtanga Hridaya (Sutrasthana 2.1: "Brahme muhurte uttisthet svastho raksartham ayusah" — "To preserve health and life, one should awaken during Brahma Muhurta"). Brahma Muhurta occurs 2 ghatikas (approx. 48-96 minutes) before sunrise when sattva guna is naturally predominant in nature, offering maximum mental clarity for contemplation and prayer.',
    true,
    2
  ),
  (
    'Bhagavad Gita & Philosophy',
    'Reflect on timeless teachings from the Gita for navigating modern challenges, work stress, and personal duties.',
    'Scriptural grounding: Bhagavad Gita 2.47 ("Karmany evadhikaras te ma phalesu kadacana" — "You have a right to your prescribed duty, but never to the fruits of action") and 2.48 ("Samatvam yoga ucyate" — "Equanimity of mind is called yoga"). The teaching of Nishkama Karma encourages performing all actions with utmost dedication and integrity while surrendering attachment to outcomes.',
    true,
    3
  ),
  (
    'Panchang & Sacred Time',
    'Explain how ancient Indian timekeeping connects human daily rhythm with cosmic celestial movements.',
    'Scriptural grounding: Surya Siddhanta and Vedanga Jyotisha. A Panchang comprises five sacred limbs: Tithi (lunar day/relationship of Sun and Moon), Vara (solar weekday), Nakshatra (lunar mansion), Yoga (soli-lunar angular relationship), and Karana (half of a tithi). Observing these limbs harmonizes personal sadhana with subtle natural cycles.',
    true,
    4
  ),
  (
    'Dhyana & Inner Peace',
    'Offer an uplifting reflection on cultivating quiet stillness, prayerful silence, and enduring peace amidst a noisy world.',
    'Scriptural grounding: Taittiriya Upanishad and traditional Shanti Mantras ("Om Shanti Shanti Shanti" — invocation of peace across spiritual, subtle/environmental, and physical dimensions). Yoga Sutras 1.2 ("Yogas citta-vritti-nirodhah" — "Yoga is the stilling of the fluctuations of the mind").',
    true,
    5
  ),
  (
    'Ayurveda & Dinacharya',
    'Share practical wisdom on ancient daily wellness, sacred habits, seasonal mindfulness, and sattvic living.',
    'Scriptural grounding: Charaka Samhita (Sutrasthana Chapter 5 on Matrashiteeya / Dinacharya). Daily rhythm includes mindful cleansing, respectful gratitude upon awakening, wholesome seasonal diet, purposeful activity, and restful contemplation before sleep to maintain tridosha equilibrium.',
    true,
    6
  ),
  (
    'Dharmic Values & Living Truth',
    'Highlight timeless ethical values — truthfulness, compassion, seva, and courage — as found in our epics and parables.',
    'Scriptural grounding: Mahabharata, Shanti Parva ("Dharmo rakshati rakshitah" — "Dharma protects those who uphold it"). Panchatantra morals and Ramayana exemplars: Satya (truthfulness), Ahimsa (non-injury), Daya (compassion), and Dama (self-control) as the four foundational pillars of righteous living.',
    true,
    7
  ),
  (
    'Tirtha & Sacred Bharat',
    'Reflect on the transformative experience of pilgrimage and revering sacred rivers, mountains, and holy temples.',
    'Scriptural grounding: Rigveda (Nadi Sukta revering the sacred rivers: Ganga, Yamuna, Saraswati) and Skanda Purana on Tirtha Yatra. Pilgrimage is not mere travel, but an internal journey of purification, seeking proximity to centuries of consecrated devotion, austerity, and grace.',
    true,
    8
  )
on conflict do nothing;
