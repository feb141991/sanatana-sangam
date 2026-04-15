-- ============================================================
-- Migration 010: Sanskar — 16 Lifecycle Ritual Guides
-- Static content (16 sanskaras) + user tracking.
-- SAFE TO RE-RUN — all IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── 1. Sanskars master table (static content) ──

CREATE TABLE IF NOT EXISTS sanskars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  sequence_number INT NOT NULL,   -- 1-16
  name            TEXT NOT NULL,
  name_sanskrit   TEXT,
  name_meaning    TEXT,
  life_stage      TEXT NOT NULL CHECK (life_stage IN (
    'prenatal','birth','infancy','childhood','education','adulthood','marriage','elder','death'
  )),
  typical_age     TEXT,           -- "11th day after birth", "6-8 years", etc.
  significance    TEXT NOT NULL,
  presiding_deity TEXT,
  key_mantras     TEXT[],
  samagri         TEXT[],         -- items needed for the ritual
  vidhi_steps     JSONB NOT NULL, -- [{step: 1, title: "...", description: "..."}]
  duration_hours  FLOAT,          -- typical duration
  priest_required BOOLEAN DEFAULT true,
  can_self_perform BOOLEAN DEFAULT false,
  notes           TEXT
);

-- ── 2. User sanskar records ──

CREATE TABLE IF NOT EXISTS user_sanskars (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanskar_id       UUID NOT NULL REFERENCES sanskars(id),
  -- For whom (self or family member)
  beneficiary_name TEXT,
  beneficiary_dob  DATE,
  -- Status
  status           TEXT DEFAULT 'planned'
                   CHECK (status IN ('planned','in_progress','completed')),
  scheduled_date   DATE,
  completed_date   DATE,
  -- Details
  priest_name      TEXT,
  location         TEXT,
  notes            TEXT,
  family_members   TEXT[],   -- names of attendees
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Indexes ──

CREATE INDEX IF NOT EXISTS idx_sanskars_stage    ON sanskars (life_stage);
CREATE INDEX IF NOT EXISTS idx_sanskars_sequence ON sanskars (sequence_number);

CREATE INDEX IF NOT EXISTS idx_user_sanskars_user ON user_sanskars (user_id);

-- ── 4. RLS ──

ALTER TABLE sanskars      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sanskars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sanskars' AND policyname = 'Sanskars are public'
  ) THEN
    CREATE POLICY "Sanskars are public" ON sanskars FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_sanskars' AND policyname = 'Users manage own sanskars'
  ) THEN
    CREATE POLICY "Users manage own sanskars"
      ON user_sanskars FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. Seed: All 16 Sanskaras ──

INSERT INTO sanskars (slug, sequence_number, name, name_sanskrit, name_meaning, life_stage, typical_age, significance, presiding_deity, key_mantras, samagri, vidhi_steps, duration_hours, priest_required, can_self_perform, notes)
VALUES

(
  'garbhadhana', 1, 'Garbhadhana', 'गर्भाधान', 'Conception',
  'prenatal', 'Before conception',
  'The first sanskara, sanctifying the act of conception. Invokes divine blessings for a virtuous soul to enter the womb.',
  'Vishnu', ARRAY['Om Vishnu Om', 'Purusha Sukta'],
  ARRAY['Ghee','Havan samagri','White flowers','Milk'],
  '[{"step":1,"title":"Sankalpa","description":"The husband takes a vow stating intention to have a virtuous child"},{"step":2,"title":"Havan","description":"Fire ritual invoking Vishnu and Prajapati for blessing"},{"step":3,"title":"Prayers","description":"Recitation of Purusha Sukta and prayers for a noble soul"}]'::jsonb,
  2.0, true, false,
  'Often performed on an auspicious tithi, preferably on a shukla paksha day'
),

(
  'pumsavana', 2, 'Pumsavana', 'पुंसवन', 'Protecting the fetus',
  'prenatal', '2nd or 3rd month of pregnancy',
  'Performed in the 2nd or 3rd month for the healthy development of the fetus, especially for a male child (historically). Modern practice focuses on fetal wellbeing.',
  'Vishnu', ARRAY['Pumsavana mantra','Vishnu Sahasranama'],
  ARRAY['Banyan tree sprouts','Milk','Ghee','Havan samagri'],
  '[{"step":1,"title":"Sankalpa","description":"Statement of purpose — protection of the fetus"},{"step":2,"title":"Nasal drops","description":"Juice of banyan tree sprouts placed in the right nostril of the mother"},{"step":3,"title":"Havan","description":"Fire ritual with specific mantras for fetal protection"},{"step":4,"title":"Prayers","description":"Vishnu Sahasranama recitation"}]'::jsonb,
  2.0, true, false, NULL
),

(
  'simantonnayana', 3, 'Simantonnayana', 'सीमन्तोन्नयन', 'Parting of the hair',
  'prenatal', '4th to 8th month of pregnancy',
  'Hair-parting ceremony for the expectant mother. Believed to protect mother and child, and ease childbirth. A celebration of the coming new life.',
  'Chandra (Moon)', ARRAY['Simantonnayana mantras'],
  ARRAY['Porcupine quill or gold stick','Flowers','Music instruments','New clothes'],
  '[{"step":1,"title":"Preparation","description":"The expecting mother is dressed in new clothes and adorned with flowers"},{"step":2,"title":"Parting","description":"The husband parts the wife''s hair three times upward with a porcupine quill while chanting mantras"},{"step":3,"title":"Music","description":"Auspicious music played — veena traditionally"},{"step":4,"title":"Blessings","description":"Elder women bless the mother and child"}]'::jsonb,
  3.0, true, false, 'Also known as Seemanta. Often combined with a baby shower celebration'
),

(
  'jatakarma', 4, 'Jatakarma', 'जातकर्म', 'Birth rituals',
  'birth', 'At birth, before cutting the cord',
  'Performed immediately at birth before the umbilical cord is cut. The father welcomes the child into the world and initiates their spiritual life.',
  'Brahma', ARRAY['Medhajana mantra','Ayushman bhava mantra'],
  ARRAY['Gold','Honey','Ghee'],
  '[{"step":1,"title":"First touch","description":"Father touches the child''s lips with gold dipped in honey and ghee"},{"step":2,"title":"Breathing mantra","description":"Father whispers Medhajana mantra in the child''s right ear"},{"step":3,"title":"Long life prayer","description":"Recitation of Ayushman bhava mantra"},{"step":4,"title":"Naming","description":"Temporary secret name whispered to the child"}]'::jsonb,
  1.0, false, true, 'Can be performed by the father without a priest in an emergency'
),

(
  'namakarana', 5, 'Namakarana', 'नामकरण', 'Naming ceremony',
  'infancy', '11th or 12th day after birth',
  'The formal naming of the child. The name is chosen based on the birth nakshatra and family tradition. The child is formally introduced to the world.',
  'Saraswati', ARRAY['Namakarana mantra','Saraswati stuti'],
  ARRAY['Havan samagri','New clothes for child','Sweets','Gold ornament'],
  '[{"step":1,"title":"Purification","description":"Mother and child take ritual bath — first outing after birth"},{"step":2,"title":"Havan","description":"Fire ritual invoking blessings for the child''s name"},{"step":3,"title":"Name announcement","description":"Father whispers the chosen name in the child''s right ear three times"},{"step":4,"title":"Public announcement","description":"Name announced to assembled family"},{"step":5,"title":"Blessings","description":"Elders bless the child and offer gifts"}]'::jsonb,
  3.0, true, false, 'Birth nakshatra determines the starting syllable of the name in Vedic tradition'
),

(
  'nishkramana', 6, 'Nishkramana', 'निष्क्रमण', 'First outing',
  'infancy', '4th month after birth',
  'The child''s first formal outing. First shown the sun and moon. Marks the end of the post-natal confinement period.',
  'Surya (Sun)', ARRAY['Surya mantra','Nishkramana mantra'],
  ARRAY['New clothes','Gold ornament','Havan samagri'],
  '[{"step":1,"title":"Preparation","description":"Child dressed in new clothes, tilak applied"},{"step":2,"title":"Sun darshan","description":"Father shows child the sun saying: this is Surya, may you be as radiant"},{"step":3,"title":"Moon darshan","description":"If evening — child shown the moon"},{"step":4,"title":"Temple visit","description":"Family visits the kula devata temple"},{"step":5,"title":"Havan","description":"Fire ritual for protection"}]'::jsonb,
  2.0, true, false, NULL
),

(
  'annaprasana', 7, 'Annaprasana', 'अन्नप्राशन', 'First solid food',
  'infancy', '5th-6th month (odd month for boys, even for girls traditionally)',
  'The child''s first feeding of solid food (traditionally rice). A major milestone celebrating the transition from breast milk.',
  'Annapurna', ARRAY['Annapurna stuti','Annaprasana mantra'],
  ARRAY['Kheer (rice pudding)','Silver spoon','New clothes','Flowers'],
  '[{"step":1,"title":"Havan","description":"Fire ritual invoking Devi Annapurna for nourishment"},{"step":2,"title":"First feeding","description":"Father or grandfather feeds child the first spoon of kheer"},{"step":3,"title":"Blessings","description":"Elders bless the child and feed symbolic portions"},{"step":4,"title":"Celebration","description":"Family feast"}]'::jsonb,
  2.5, true, false, 'Kheer (sweet rice) is the traditional first food. Made with cow''s milk'
),

(
  'chudakarma', 8, 'Chudakarma (Mundan)', 'चूडाकर्म', 'First haircut',
  'infancy', '1st or 3rd year (odd year)',
  'The child''s first tonsure (head shaving). The birth hair, associated with past life karma, is shaved off. A purification ritual.',
  'Shiva', ARRAY['Chudakarma mantra','Rudra mantra'],
  ARRAY['Shaving equipment','Sandalwood paste','New clothes','Darbha grass'],
  '[{"step":1,"title":"Sankalpa","description":"Statement of purpose"},{"step":2,"title":"Havan","description":"Fire ritual before the shaving"},{"step":3,"title":"First cut","description":"Priest makes three ceremonial cuts, then barber shaves the rest"},{"step":4,"title":"Paste application","description":"Turmeric and sandalwood paste applied to the head"},{"step":5,"title":"Hair offering","description":"Hair offered to the river or temple"}]'::jsonb,
  3.0, true, false, 'Often performed at a temple like Tirupati or Kashi. Hair offered to the deity'
),

(
  'karnavedha', 9, 'Karnavedha', 'कर्णवेध', 'Ear piercing',
  'childhood', '3rd to 5th year',
  'Ritual ear piercing. Believed to improve health, ward off evil, and open the ears to sacred sound.',
  'Surya', ARRAY['Karnavedha mantra'],
  ARRAY['Gold needle','Sandalwood paste','Turmeric'],
  '[{"step":1,"title":"Havan","description":"Short fire ritual invoking protection"},{"step":2,"title":"Piercing","description":"Right ear first for boys, left first for girls — by a goldsmith"},{"step":3,"title":"Gold earrings","description":"Small gold earrings inserted"},{"step":4,"title":"Sandalwood paste","description":"Applied to the pierced area for healing"}]'::jsonb,
  1.5, false, false, 'The goldsmith performs the piercing. A priest may or may not be present'
),

(
  'vidyarambha', 10, 'Vidyarambha', 'विद्यारंभ', 'Beginning of education',
  'childhood', '5th year (Vijayadashami auspicious)',
  'Formal initiation into learning. The child writes their first letters and numbers. Vijayadashami is the most auspicious day for this sanskara.',
  'Saraswati', ARRAY['Saraswati vandana','Vidyarambha mantra','Om Aim Saraswatyai Namah'],
  ARRAY['Slate or paper','Writing implement','Saraswati idol','Flowers','Sweets'],
  '[{"step":1,"title":"Saraswati puja","description":"Worship of Goddess Saraswati — goddess of learning"},{"step":2,"title":"First writing","description":"Priest or elder guides child''s hand to write Om, then alphabet"},{"step":3,"title":"Book puja","description":"New books and pens worshipped"},{"step":4,"title":"Blessings","description":"Elders bless with: May you be learned and wise"}]'::jsonb,
  2.0, false, true, 'Vijayadashami (Dussehra) is the most auspicious day. Many schools begin on this day'
),

(
  'upanayana', 11, 'Upanayana', 'उपनयन', 'Sacred thread ceremony',
  'education', '8-12 years (Brahmin: 8, Kshatriya: 11, Vaishya: 12)',
  'The most important sankara for dvija (twice-born) varnas. The boy receives the sacred thread (yajnopavita) and is initiated into Gayatri mantra. He becomes eligible for Vedic study. This is his spiritual second birth.',
  'Savitri/Gayatri', ARRAY['Gayatri mantra','Yajnopavita mantra','Brahmacharya vow mantras'],
  ARRAY['Yajnopavita (sacred thread)','Havan samagri','Mekhala (grass belt)','Danda (staff)','Deer skin','Ochre cloth'],
  '[{"step":1,"title":"Preparations","description":"Boy fasts. Head is shaved. Dressed in ochre dhoti"},{"step":2,"title":"Havan","description":"Elaborate fire ritual. Brahma, Vishnu, Shiva, and Gayatri invoked"},{"step":3,"title":"Sacred thread","description":"Yajnopavita placed over left shoulder by the father or acharya with mantra"},{"step":4,"title":"Gayatri diksha","description":"Father whispers Gayatri mantra in the boy''s right ear — most sacred moment"},{"step":5,"title":"Sun salutation","description":"Boy salutes the sun — first practice"},{"step":6,"title":"Bhiksha","description":"Boy asks for alms from mother — symbolizing brahmacharya life"},{"step":7,"title":"Vows","description":"Celibacy, study, and service vows taken"}]'::jsonb,
  6.0, true, false, 'The boy must chant Gayatri mantra thrice daily after this for life. Thread changed annually on Raksha Bandhan (Shravan Purnima) — Upakarma'
),

(
  'vedarambha', 12, 'Vedarambha', 'वेदारम्भ', 'Beginning of Vedic study',
  'education', 'After Upanayana',
  'Formal beginning of Vedic study under a guru. Follows Upanayana. The student begins learning the Vedas appropriate to their family tradition.',
  'Brahma', ARRAY['Vedic pranava','Guru vandana'],
  ARRAY['Havan samagri','Books','Darbha grass'],
  '[{"step":1,"title":"Guru puja","description":"Worship of the teacher as a form of Brahma"},{"step":2,"title":"Havan","description":"Fire ritual invoking Saraswati and Brahma"},{"step":3,"title":"First recitation","description":"Guru teaches the first verse of the appropriate Veda"},{"step":4,"title":"Dakshina","description":"Student offers dakshina (gift) to the guru"}]'::jsonb,
  2.0, true, false, 'Traditionally immediately follows Upanayana. Now often symbolic'
),

(
  'samavartana', 13, 'Samavartana', 'समावर्तन', 'Completion of studies',
  'education', 'After completing gurukula/education',
  'Graduation from the guru''s house. The student bathes (Snataka), receives gifts, and returns home as a learned adult.',
  'Saraswati', ARRAY['Snataka mantra','Graduation mantras'],
  ARRAY['New clothes','Gifts for guru','Bath items'],
  '[{"step":1,"title":"Ritual bath","description":"Elaborate ritual bath — becoming a Snataka (one who has bathed)"},{"step":2,"title":"New clothes","description":"Student puts on new clothes, ornaments for first time"},{"step":3,"title":"Guru dakshina","description":"Gifts given to the guru — traditionally a cow"},{"step":4,"title":"Return home","description":"Joyful return to the family home"}]'::jsonb,
  3.0, true, false, 'The student shaves, cuts nails, and adorns himself — transformation from student to householder'
),

(
  'vivaha', 14, 'Vivaha', 'विवाह', 'Marriage',
  'marriage', 'Adult — auspicious muhurta',
  'The most elaborate and important grihasta (householder) sanskara. Two souls unite for dharma, artha, kama, and moksha. Marriage is a spiritual partnership, not merely social.',
  'Agni', ARRAY['Saptapadi mantras','Vivaha mantras','Mangalashtaka'],
  ARRAY['Havan kund','Ghee','Samagri','Mangalsutra','Sindoor','Flowers','Kanyadaan items'],
  '[{"step":1,"title":"Ganesh puja","description":"Invocation of Ganesha to remove obstacles"},{"step":2,"title":"Kanyadaan","description":"Father gives the bride to the groom — the most sacred gift"},{"step":3,"title":"Havan","description":"Sacred fire lit. Both bride and groom take vows together"},{"step":4,"title":"Saptapadi","description":"Seven steps around the sacred fire — the heart of the ceremony. Seven vows taken"},{"step":5,"title":"Mangalsutra","description":"Groom ties mangalsutra around bride''s neck"},{"step":6,"title":"Sindoor","description":"Groom applies sindoor in bride''s hair parting"},{"step":7,"title":"Aashirvaad","description":"Blessings from elders and community"}]'::jsonb,
  8.0, true, false, 'The Saptapadi (7 steps) is the legally and spiritually binding moment. After the 7th step, the marriage is complete'
),

(
  'vanaprastha', 15, 'Vanaprastha', 'वानप्रस्थ', 'Forest retirement',
  'elder', 'After grandchildren are born, ~50+ years',
  'Gradual withdrawal from worldly life. The elder begins spending more time in spiritual practice, pilgrimage, and service. Transition from householder to spiritual seeker.',
  'Vishnu', ARRAY['Vanaprastha sankalpa mantra'],
  ARRAY['Ochre cloth','Rudraksha mala','Pilgrim staff'],
  '[{"step":1,"title":"Sankalpa","description":"Formal declaration of entering Vanaprastha ashrama"},{"step":2,"title":"Havan","description":"Fire ritual marking the transition"},{"step":3,"title":"Ochre","description":"Beginning to wear ochre/saffron — symbolizing reduced attachment"},{"step":4,"title":"Pilgrimage","description":"Beginning of yatra to sacred sites"}]'::jsonb,
  3.0, false, true, 'Modern practice: increased time for prayer, pilgrimage, and community service. Semi-retirement'
),

(
  'antyeshti', 16, 'Antyeshti', 'अन्त्येष्टि', 'Last rites',
  'death', 'At death',
  'The final and most important sanskara. Cremation and post-death rituals ensure the peaceful departure of the soul. Includes the 13-day mourning period and Shraddha rites.',
  'Yama and Agni', ARRAY['Antyeshti mantras','Garuda Purana shlokas','Ram naam satya hai'],
  ARRAY['White cloth','Sesame seeds','Ghee','Tulsi','Gangajal','Sandalwood'],
  '[{"step":1,"title":"Preparation","description":"Body washed, wrapped in white cloth. Tulsi and Gangajal placed in mouth"},{"step":2,"title":"Procession","description":"Body carried to cremation ground with Ram naam satya hai chanting"},{"step":3,"title":"Last fire","description":"Eldest son (or closest male relative) lights the funeral pyre"},{"step":4,"title":"Asthi sanchayan","description":"Bone collection on 3rd day, immersed in sacred river"},{"step":5,"title":"13 days","description":"Mourning period. Daily puja and feeding of Brahmins"},{"step":6,"title":"Shraddha","description":"13th day ceremony — pitru tarpan for the departed soul"}]'::jsonb,
  NULL, false, false, 'Cremation is the Vedic method. Immersion of ashes in the Ganges (Haridwar/Kashi) is most auspicious. Annual Shraddha performed on death anniversary'
)

ON CONFLICT (slug) DO NOTHING;
