-- ─── Migration: Traditions Catalogue, Subcategories & Marketing Targeting ───────
-- 1. Create traditions_catalog for master tradition definitions
-- 2. Create tradition_subcategories for sampradayas / schools / paths (including 'none')
-- 3. Add target_tradition and target_sampradaya columns to marketing_campaigns
-- 4. Seed comprehensive data for Hindu, Jain, Sikh, Buddhist, and None / Universal

-- ── 1. Create traditions_catalog table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.traditions_catalog (
  key TEXT PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_hi TEXT NOT NULL,
  emoji TEXT NOT NULL,
  sub_label_en TEXT NOT NULL,
  sub_label_hi TEXT NOT NULL,
  subcategories_label_en TEXT NOT NULL,
  subcategories_label_hi TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Create tradition_subcategories table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tradition_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradition_key TEXT NOT NULL REFERENCES public.traditions_catalog(key) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_hi TEXT NOT NULL,
  description_en TEXT,
  description_hi TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tradition_key, key)
);

CREATE INDEX IF NOT EXISTS idx_tradition_subcategories_tradition ON public.tradition_subcategories(tradition_key, is_active, display_order);

-- ── 3. Add targeting columns to marketing_campaigns ────────────────────────────
ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS target_tradition TEXT,
  ADD COLUMN IF NOT EXISTS target_sampradaya TEXT;

-- ── 4. Enable RLS and public read policies ──────────────────────────────────────
ALTER TABLE public.traditions_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradition_subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'traditions_catalog' AND policyname = 'Allow public read access on traditions_catalog'
  ) THEN
    CREATE POLICY "Allow public read access on traditions_catalog"
      ON public.traditions_catalog FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tradition_subcategories' AND policyname = 'Allow public read access on tradition_subcategories'
  ) THEN
    CREATE POLICY "Allow public read access on tradition_subcategories"
      ON public.tradition_subcategories FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'traditions_catalog' AND policyname = 'Allow admin write access on traditions_catalog'
  ) THEN
    CREATE POLICY "Allow admin write access on traditions_catalog"
      ON public.traditions_catalog FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tradition_subcategories' AND policyname = 'Allow admin write access on tradition_subcategories'
  ) THEN
    CREATE POLICY "Allow admin write access on tradition_subcategories"
      ON public.tradition_subcategories FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── 5. Seed Traditions Catalogue ───────────────────────────────────────────────
INSERT INTO public.traditions_catalog (
  key, label_en, label_hi, emoji, sub_label_en, sub_label_hi,
  subcategories_label_en, subcategories_label_hi, accent_color, display_order
) VALUES
  ('hindu', 'Hindu / Sanatan', 'सनातन / हिंदू', '🕉️', 'Vedic, Puranic & living Sampradayas', 'वैदिक, पौराणिक और संप्रदाय', 'Sampradaya', 'संप्रदाय', '#FF6B35', 10),
  ('jain', 'Jain Dharma', 'जैन धर्म', '🤲', 'Ahimsa, Tirthankara, Anekantavada & Tap', 'अहिंसा, तीर्थंकर, अनेकांतवाद और तप', 'Sect / Panth', 'पंथ / परंपरा', '#2D9E4A', 20),
  ('sikh', 'Sikh Tradition', 'सिख परंपरा', '☬', 'Guru Granth Sahib, Simran, Seva & Nitnem', 'गुरु ग्रंथ साहिब, सिमरण, सेवा और नितनेम', 'Panth / Tradition', 'पंथ / संप्रदाय', '#1B7FD4', 30),
  ('buddhist', 'Buddha Dhamma', 'बौद्ध धर्म', '☸️', 'Noble Eightfold Path, Mindfulness & Zen', 'अष्टांगिक मार्ग, विपश्यना और ध्यान', 'School / Lineage', 'परंपरा / शाखा', '#7C5CBF', 40),
  ('none', 'Universal / Exploring', 'सार्वभौमिक / अन्वेषक', '✨', 'All streams of Dharma, Yoga & Inner Stillness', 'सर्वधर्म समन्वय, योग, आत्मज्ञान व शांति', 'Path / Focus', 'मार्ग / साधना केंद्र', '#8B9E6E', 50)
ON CONFLICT (key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  emoji = EXCLUDED.emoji,
  sub_label_en = EXCLUDED.sub_label_en,
  sub_label_hi = EXCLUDED.sub_label_hi,
  subcategories_label_en = EXCLUDED.subcategories_label_en,
  subcategories_label_hi = EXCLUDED.subcategories_label_hi,
  accent_color = EXCLUDED.accent_color,
  display_order = EXCLUDED.display_order;

-- ── 6. Seed Subcategories ──────────────────────────────────────────────────────

-- 6.1 Hindu Sampradayas
INSERT INTO public.tradition_subcategories (tradition_key, key, label_en, label_hi, description_en, description_hi, display_order) VALUES
  ('hindu', 'vaishnava', 'Vaishnava', 'वैष्णव', 'Devotion to Lord Vishnu, Rama, and Krishna', 'भगवान विष्णु, राम और कृष्ण के प्रति भक्ति', 10),
  ('hindu', 'shaiva', 'Shaiva', 'शैव', 'Devotion to Lord Shiva, inner stillness and yoga', 'भगवान शिव, आंतरिक स्थिरता और योग मार्ग', 20),
  ('hindu', 'shakta', 'Shakta', 'शाक्त', 'Devotion to the Divine Mother (Devi, Durga, Kali, Lakshmi)', 'जगन्माता दुर्गा, काली, लक्ष्मी आदि शक्ति की उपासना', 30),
  ('hindu', 'smarta', 'Smarta', 'स्मार्त', 'Harmonious worship of five deities (Panchayatana) grounded in Advaita', 'अद्वैत वेदांत आधारित पंचायतन उपासना परंपरा', 40),
  ('hindu', 'advaita_vedanta', 'Advaita Vedanta', 'अद्वैत वेदांत', 'Non-dual consciousness per Adi Shankaracharya', 'आदि शंकराचार्य द्वारा प्रतिपादित अद्वैत तत्वज्ञान', 50),
  ('hindu', 'iskcon', 'ISKCON / Gaudiya', 'इस्कॉन / गौड़ीय', 'Chaitanya Mahaprabhu lineage, Harinama Sankirtana & Gita as it is', 'चैतन्य महाप्रभु की परंपरा, संकीर्तन और भगवद्गीता', 60),
  ('hindu', 'swaminarayan', 'Swaminarayan', 'स्वामीनारायण', 'Bhakti, dharma, and Satsang of Bhagwan Swaminarayan', 'भगवान स्वामीनारायण की भक्ति, नियम और सत्संग', 70),
  ('hindu', 'veerashaiva', 'Veerashaiva / Lingayat', 'वीरशैव / लिंगायत', 'Worship of Ishtalinga and teachings of Basaveshwara', 'इष्टलिंग पूजा और बसवेश्वर के वचन दर्शन', 80),
  ('hindu', 'arya_samaj', 'Arya Samaj', 'आर्य समाज', 'Vedic monotheism, Havan, and social righteousness per Swami Dayananda', 'महर्षि दयानंद प्रतिपादित वेदोक्त धर्म व यज्ञ', 90),
  ('hindu', 'other', 'Other / Exploring', 'अन्य / अन्वेषक', 'Exploring and learning all Hindu traditions', 'सभी हिंदू धाराओं का अन्वेषण और अध्ययन', 100)
ON CONFLICT (tradition_key, key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  description_en = EXCLUDED.description_en,
  description_hi = EXCLUDED.description_hi,
  display_order = EXCLUDED.display_order;

-- 6.2 Jain Subcategories
INSERT INTO public.tradition_subcategories (tradition_key, key, label_en, label_hi, description_en, description_hi, display_order) VALUES
  ('jain', 'digambara_bispanthi', 'Digambara (Bispanthi)', 'दिगंबर (बीसपंथी)', 'Traditional Digambara practice with temple worship and aarti', 'मंदिर, पूजा व आरती आधारित पारंपरिक दिगंबर परंपरा', 10),
  ('jain', 'digambara_terapanthi', 'Digambara (Terapanthi)', 'दिगंबर (तेरहपंथी)', 'Digambara tradition emphasizing simple ritual and scriptural study', 'शास्त्र स्वाध्याय व सादगीपूर्ण पूजन आधारित दिगंबर परंपरा', 20),
  ('jain', 'shvetambara_murtipujak', 'Shvetambara (Murtipujak)', 'श्वेतांबर (मूर्तिपूजक / देरावासी)', 'Temple worship of consecrated Tirthankar idols in Derasars', 'देरासरों में प्रतिष्ठित जिनप्रतिमाओं की आराधना', 30),
  ('jain', 'shvetambara_sthanakvasi', 'Shvetambara (Sthanakvasi)', 'श्वेतांबर (स्थानकवासी)', 'Meditative prayers in Sthanaks without idol worship', 'स्थानक में स्वाध्याय, सामायिक और जप केंद्रित साधना', 40),
  ('jain', 'shvetambara_terapanthi', 'Shvetambara (Terapanthi)', 'श्वेतांबर (तेरहपंथी)', 'Disciplined ascetic stream focused on Preksha Dhyana under an Acharya', 'आचार्य के अनुशासन में प्रेक्षाध्यान व अणुव्रत मार्ग', 50),
  ('jain', 'shrimad_rajchandra', 'Shrimad Rajchandra Path', 'श्रीमद् राजचंद्र मार्ग', 'Spiritual self-realization (Atma Siddhi) and inner purification', 'आत्मसिद्धि, सत्संग और अंतर्मुखता केंद्रित आध्यात्मिक मार्ग', 60),
  ('jain', 'other', 'Other / General Jain', 'सामान्य जैन / अन्वेषक', 'General Jain principles of Ahimsa, Aparigraha, and Satya', 'जैन धर्म के सार्वभौमिक सिद्धांतों का अनुसरण', 70)
ON CONFLICT (tradition_key, key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  description_en = EXCLUDED.description_en,
  description_hi = EXCLUDED.description_hi,
  display_order = EXCLUDED.display_order;

-- 6.3 Sikh Subcategories
INSERT INTO public.tradition_subcategories (tradition_key, key, label_en, label_hi, description_en, description_hi, display_order) VALUES
  ('sikh', 'khalsa', 'Khalsa (Amritdhari)', 'खालसा (अमृतधारी)', 'Initiated Sikhs observing the Sikh Rehat Maryada and Panj Kakar', 'सिख रहित मर्यादा व पंच ककारों का पालन करने वाले अमृतधारी', 10),
  ('sikh', 'nanakpanthi', 'Nanakpanthi', 'नानकपंथी', 'Devotees living Guru Nanak’s universal message of Naam, Kirat, and Vand Chhako', 'गुरु नानक देव जी के नाम जपो, कीरत करो, वंड छको का पालन', 20),
  ('sikh', 'sevapanthi_nirmala', 'Seva Panthi / Nirmala', 'सेवापंथी / निर्मला', 'Scholarly stream dedicated to selfless seva and scripture commentary', 'निस्वार्थ सेवा, अध्ययन व गुरबाणी चिंतन में लीन परंपरा', 30),
  ('sikh', 'nihang', 'Nihang Singh', 'निहंग सिंह', 'Sovereign martial guardian tradition rooted in Akali heritage', 'अकाली विरासत, दल पंथ और पारंपरिक सिख मर्यादा', 40),
  ('sikh', 'udasi', 'Udasi', 'उदासी', 'Contemplative and ascetic tradition tracing back to Baba Sri Chand Ji', 'बाबा श्रीचंद जी द्वारा स्थापित विरक्त व ज्ञानमार्गी परंपरा', 50),
  ('sikh', 'sahajdhari', 'Sahajdhari / Exploring', 'सहजधारी / अन्वेषक', 'Devoted readers and listeners of Gurbani walking the path with love', 'गुरबाणी और सिमरन से प्रेम करने वाले सहज साधक', 60)
ON CONFLICT (tradition_key, key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  description_en = EXCLUDED.description_en,
  description_hi = EXCLUDED.description_hi,
  display_order = EXCLUDED.display_order;

-- 6.4 Buddhist Subcategories
INSERT INTO public.tradition_subcategories (tradition_key, key, label_en, label_hi, description_en, description_hi, display_order) VALUES
  ('buddhist', 'theravada', 'Theravada', 'थेरवाद', 'Early teachings of the Buddha, Pali Canon, and Vipassana meditation', 'बुद्ध की मूल शिक्षाएं, पालि तिपिटक और विपश्यना साधना', 10),
  ('buddhist', 'mahayana_zen', 'Mahayana (Zen / Chan)', 'महायान (ज़ेन / चान)', 'Direct insight into Buddha-nature through Zazen meditation and mindfulness', 'ज़ाज़ेन ध्यान और आंतरिक बुद्ध स्वभाव की प्रत्यक्ष अनुभूति', 20),
  ('buddhist', 'vajrayana_tibetan', 'Vajrayana / Tibetan', 'वज्रयान / तिब्बती', 'Esoteric meditation across Nyingma, Kagyu, Sakya, and Gelug lineages', 'मंत्र, मंडल और तिब्बती बौद्ध साधना परंपराएं', 30),
  ('buddhist', 'navayana', 'Navayana / Ambedkarite', 'नवयान / आंबेडकरवादी', 'Socially engaged, ethical Buddhism focused on equality and Dhamma', 'प्रज्ञा, शील, करुणा और सामाजिक समरसता पर आधारित नवयान', 40),
  ('buddhist', 'secular_mindfulness', 'Secular Mindfulness', 'माइंडफुलनेस / व्यावहारिक बुद्ध', 'Practical application of the Four Noble Truths for modern daily peace', 'तनावमुक्ति और आंतरिक शांति हेतु व्यावहारिक धम्म साधना', 50),
  ('buddhist', 'other', 'Other / Exploring', 'अन्य / अन्वेषक', 'Exploring all schools of Buddha Dhamma', 'बौद्ध दर्शन की विभिन्न शाखाओं का अन्वेषण', 60)
ON CONFLICT (tradition_key, key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  description_en = EXCLUDED.description_en,
  description_hi = EXCLUDED.description_hi,
  display_order = EXCLUDED.display_order;

-- 6.5 Universal / None Subcategories
INSERT INTO public.tradition_subcategories (tradition_key, key, label_en, label_hi, description_en, description_hi, display_order) VALUES
  ('none', 'universal_sanatan', 'Universal Sanatan', 'सर्वधर्म सनातन', 'Embraces the interconnected wisdom of all four Dharmic streams', 'हिंदू, जैन, बौद्ध और सिख सभी धर्मधाराओं का आदर व समन्वय', 10),
  ('none', 'advaita_oneness', 'Advaita & Non-Duality', 'अद्वैत व एकात्म भाव', 'Focus on pure consciousness, Upanishadic inquiry (Jnana), and oneness', 'शुद्ध चेतना, उपनिषद ज्ञान और सर्वव्यापक आत्मतत्व', 20),
  ('none', 'yoga_meditation', 'Yoga & Meditation Seeker', 'योग व ध्यान साधक', 'Dedicated to Raja Yoga, Pranayama, Kriya, and silent meditation', 'राजयोग, प्राणायाम, क्रियायोग और मौन ध्यान साधना', 30),
  ('none', 'philosophical_inquirer', 'Philosophical Inquirer', 'दार्शनिक चिंतन', 'Rational inquiry into Truth, metaphysics, ethics, and Dharma without dogma', 'सत्य, नीतिशास्त्र और विवेकपूर्ण धर्म जिज्ञासा', 40),
  ('none', 'secular_cultural', 'Secular & Cultural Dharmic', 'सांस्कृतिक व सामाजिक धर्म', 'Celebrates heritage, festivals, and ethical values without sectarian ritual', 'पारंपरिक उत्सवों, संस्कारों और जीवन मूल्यों का सम्मान', 50),
  ('none', 'sbnr', 'Spiritual but not Religious', 'आध्यात्मिक अंतर्यात्रा', 'Personal inner path focused on mindfulness, kindness, and gratitude', 'करुणा, आत्मशांति और कृतज्ञता पर आधारित वैयक्तिक मार्ग', 60),
  ('none', 'curious_explorer', 'Curious Seeker / Exploring', 'सत्य साधक / अन्वेषक', 'Open-hearted beginner discovering the dharmic ocean from scratch', 'सहज मन से भारतीय आध्यात्मिक ज्ञान का प्रथम अन्वेषण', 70)
ON CONFLICT (tradition_key, key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_hi = EXCLUDED.label_hi,
  description_en = EXCLUDED.description_en,
  description_hi = EXCLUDED.description_hi,
  display_order = EXCLUDED.display_order;
