-- 1. Create discover_content table
CREATE TABLE IF NOT EXISTS public.discover_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  subtitle         TEXT NOT NULL,
  tradition        TEXT NOT NULL CHECK (tradition IN ('hindu', 'sikh', 'buddhist', 'jain', 'all')),
  category         TEXT NOT NULL CHECK (category IN ('festival', 'practice', 'scripture', 'symbol', 'story')),
  hook_question    TEXT NOT NULL,
  body_short       VARCHAR(300) NOT NULL,
  body_full        TEXT NOT NULL,
  scripture_line   TEXT NULL,
  scripture_source TEXT NULL,
  app_deep_link    TEXT NOT NULL,
  og_image_url     TEXT NULL,
  published        BOOLEAN DEFAULT FALSE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.discover_content ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read for published discover content" ON public.discover_content;
CREATE POLICY "Allow public read for published discover content"
  ON public.discover_content
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Allow service role write access to discover content" ON public.discover_content;
CREATE POLICY "Allow service role write access to discover content"
  ON public.discover_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_discover_content_slug ON public.discover_content(slug);
CREATE INDEX IF NOT EXISTS idx_discover_content_tradition ON public.discover_content(tradition);

-- 5. Seed 12 pieces across Hindu, Sikh, Buddhist, and Jain traditions
INSERT INTO public.discover_content (
  slug, title, subtitle, tradition, category, hook_question, body_short, body_full, scripture_line, scripture_source, app_deep_link, og_image_url, published
) VALUES
-- HINDU 1: Diyas
(
  'why-do-we-light-diyas',
  'The Inner Light of Clay',
  'Understanding the symbolism of Diyas',
  'hindu',
  'festival',
  'Why do we light diyas on Diwali?',
  'It is not just to decorate. The clay diya represents the human body, the oil is our desires, and the cotton wick is our ego. Lighting it means burning away ego and passions to reveal the steady, pure inner soul. You aren''t just lighting a lamp; you are renewing your own inner light.',
  '## The Deeper Meaning of the Clay Lamp\n\nMany of us grow up lighting clay lamps (diyas) during Diwali and other auspicious occasions, treating it as a beautiful tradition or simple decoration. But the ritual carries a profound psychological and spiritual science meant to remind you of your own inner potential.\n\n### The Metaphor of the Diya:\n1. **The Clay Pot (Mitti)**: Represents the physical body, made of earth and temporary.\n2. **The Oil or Ghee**: Represents our desires, passions, and mental attachments (Vasanas) that feed our daily actions.\n3. **The Cotton Wick**: Represents the ego (Ahamkara) which absorbs these desires.\n\nWhen we light the wick with the flame of spiritual knowledge (Jnana), the oil is consumed, and the wick burns away. This symbolizes the melting of ego and the exhaustion of self-centered desires, leading to the revelation of the steady, pure inner soul (Atman).\n\n### Moving Beyond Guilt\nIf you feel disconnected because you haven''t lit a physical diya in years, remember that the true practice is internal. Every time you quiet your mind and check in with your soul, you are performing the real Murti Puja of lighting the inner lamp.',
  'असतो मा सद्गमय । तमसो मा ज्योतिर्गमय ।',
  'Brihadaranyaka Upanishad 1.3.28',
  '/panchang',
  'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800',
  true
),
-- HINDU 2: Murti Puja
(
  'do-hindus-worship-idols',
  'The Focal Point of the Infinite',
  'The purpose behind Murti Puja',
  'hindu',
  'practice',
  'Do Hindus actually worship idols?',
  'No. A murti is not a god; it is a focal point. Just as a child uses a wooden alphabet to learn to read, or we look at a photograph of a loved one to feel close to them, a murti is a physical manifestation to help a finite mind connect with the infinite, formless divine.',
  '## The Science of Murti Puja\n\nIn modern times, the word "idol worship" carries a negative connotation of blind superstition. Seekers often feel embarrassed or apologetic about physical statues in temples. But Hindu philosophy explains that Murti Puja is a deliberate and sophisticated psychological tool.\n\n### The Sanskrit Word: Murti\nThe word *Murti* does not mean "idol"; it means "manifestation" or "embodiment." The Divine is formless (*Nirguna*), infinite, and beyond intellectual comprehension. For a human mind to focus on the formless is extremely difficult. A Murti serves as *Saguna*—a form that possesses attributes we can relate to, like compassion, strength, or wisdom.\n\n### How it Works:\n* **A Bridge**: Like a photo of a parent helps you feel love, the Murti helps focus your devotion.\n* **Mind Training**: It gives the restless mind a concrete anchor to practice concentration (Dharana) and meditation (Dhyana).\n* **Radical Acceptance**: By seeing divinity in stone, we train ourselves to eventually see divinity in all things—animals, plants, and other human beings.',
  'क्लेशोऽधिकतरस्तेषामव्यक्तासक्तचेतसाम् । अव्यक्ता हि गतिर्दुःखं देहवद्भिरवाप्यते ॥',
  'Bhagavad Gita 12.5',
  '/bhakti',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
  true
),
-- HINDU 3: Karma
(
  'is-karma-punishment',
  'The Ledger of Self-Empowerment',
  'Debunking the myth of karmic punishment',
  'hindu',
  'scripture',
  'Is Karma a system of cosmic punishment?',
  'Karma is not a cosmic judge punishing you. The word simply means "action." It is the law of cause and effect. It means you are the author of your destiny. Every action creates an impression in your mind, shaping your future desires and choices. It''s about self-empowerment, not guilt.',
  '## Understanding Karma as Self-Authorship\n\nWhen things go wrong, we often sigh and blame "bad karma," feeling like victims of a cosmic court system. This view breeds fatalism and guilt. However, original dharmic texts describe Karma in a completely different light.\n\n### The Law of Action\nThe word *Karma* translates directly to "action" or "deed." It represents a natural law of cause and effect, much like Newton''s third law of motion. Every choice you make creates a mental impression (*Samskara*). These impressions group together to form your habits, tendencies, and desires (*Vasanas*), which ultimately dictate your future decisions.\n\n### The Freedom to Choose\nRather than punishing you, the law of karma states that you are in control. If your current state is the result of past choices, it logically follows that your future state will be the result of your present choices. You are not a helpless victim; you are the author of your destiny.',
  'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
  'Bhagavad Gita 2.47',
  '/progress',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
  true
),

-- SIKH 1: Kesh
(
  'why-sikhs-keep-uncut-hair',
  'Living in the Divine Will',
  'The spiritual meaning of Kesh',
  'sikh',
  'practice',
  'Why do Sikhs keep uncut hair?',
  'Keeping Kesh is not a dogmatic rule, but an acceptance of nature. Uncut hair (Kesh) is a commitment to living in harmony with the Divine Will (Hukam). It represents the rejection of vanity and the cultivation of inner contentment, recognizing the body as a gift exactly as it was created.',
  '## Kesh: The Acceptance of the Natural Self\n\nFor many young or modern Sikhs, keeping uncut hair (*Kesh*) can feel like a heavy social burden or an outdated rule. But in the Sikh tradition, Kesh is a beautiful and radical statement of self-acceptance.\n\n### Hukam and Acceptance:\nSikhism teaches that the highest spiritual path is to live in alignment with *Hukam*—the Divine Order or Nature''s flow. Cutting one''s hair is seen as an attempt to alter what has been naturally gifted to us, fueled by societal pressure and ego-driven vanity.\n\n### The Symbolism:\n* **Humility**: Letting go of the endless effort to trim, color, and alter our appearance to fit fleeting trends.\n* **Identity**: Carrying the signature of the Guru openly, fostering a sense of courage and accountability.\n* **Contentment**: Cultivating satisfaction (*Sabr*) with who we are at our core.',
  'ਨਾਪਾਕੁ ਪਾਕੁ ਕਰਿ ਹਦੂਰਿ ਹਦੀਸਾ ॥',
  'Guru Granth Sahib 1084',
  '/pathshala?tradition=sikh',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
  true
),
-- SIKH 2: Langar
(
  'meaning-behind-langar',
  'The Pangat of Equality',
  'Langar as a social and spiritual revolution',
  'sikh',
  'story',
  'Why does Langar require everyone to sit on the floor?',
  'Langar is a radical statement of absolute equality. In medieval India, caste rules dictated who could sit with whom. By seating kings and sweepers side-by-side on the floor (Pangat), Guru Nanak shattered social hierarchy. It is a reminder that we all share the same divine light.',
  '## Langar: Shattering Barriers Through Food\n\nEating together at the Gurdwara (*Langar*) is a joyful experience, but the spiritual revolution behind it is often overlooked. Guru Nanak Dev Ji established this practice to actively dismantle discrimination.\n\n### The Principle of Pangat\nWhen you sit on the floor (*Pangat*) in a Gurdwara, you sit on the same level as everyone else. No one is elevated. In a society divided by rigid caste systems, gender roles, and economic classes, this was a revolutionary act. Emperor Akbar had to sit on the floor alongside common peasants to partake in Langar before meeting Guru Amar Das Ji.\n\n### Selfless Service (Seva)\nLangar is entirely volunteer-driven. Washing dishes, rolling rotis, and serving meals are acts of *Seva* that cleanse the mind of pride and cultivate love for humanity.',
  'ਨਾ ਕੋ ਬੈਰੀ ਨਹੀ ਬਿਗਾਨਾ ਸਗਲ ਸੰਗਿ ਹਮ ਕਉ ਬਨਿ ਆਈ ॥',
  'Guru Granth Sahib 1299',
  '/mandali',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
  true
),
-- SIKH 3: Karah Prashad
(
  'meaning-of-karah-prashad',
  'The Sweetness of Grace',
  'Understanding Karah Prashad',
  'sikh',
  'symbol',
  'What is the meaning behind Karah Prashad?',
  'Karah Prashad is made from equal parts wheat flour, ghee, and sugar. This recipe represents equality: no ingredient is superior. Receiving it in cupped hands signifies humility and openness to receive divine grace. It is sweet, reminding us that all of God''s blessings are sweet.',
  '## Karah Prashad: The Recipe of Oneness\n\nWhen we receive the sweet pudding (*Karah Prashad*) at the end of a Sikh service, it is easy to view it simply as a delicious treat. But its ingredients and preparation hold deep lessons about life and humility.\n\n### The Rule of Equal Portions:\nKarah Prashad is prepared with equal parts wheat flour, clarified butter (ghee), and sugar, representing complete equality. There is no hierarchy among the ingredients, just as there is no division in the eyes of the Creator.\n\n### The Act of Receiving:\n* We receive it sitting down, with cupped hands raised in a gesture of humility.\n* It is distributed equally to all, without favor or discrimination.\n* Its sweetness reminds us of the sweetness of the Guru''s words and the ultimate goodness of the divine plan, even when life feels challenging.',
  'ਮੀਠ ਬੋਲੜਾ ਜੀ ਹਰਿ ਸਜਣੁ ਸੁਆਮੀ ਮੋਰਾ ॥',
  'Guru Granth Sahib 784',
  '/bhakti?tradition=sikh',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
  true
),

-- BUDDHIST 1: Desire
(
  'does-buddhism-ban-all-desire',
  'Craving vs. Aspiration',
  'Unpacking Buddhist teachings on desire',
  'buddhist',
  'scripture',
  'Does Buddhism say all desire is bad?',
  'No, Buddhism does not expect you to reject all desires. The term Taṇhā refers to craving or clinging—desiring things to stay permanent when they are naturally temporary. Healthy desire (Chanda), like the desire to practice, help others, or learn, is encouraged and is the fuel for the path.',
  '## Clearing the Confusion Around Desire\n\nOne of the most common myths is that Buddhism teaches you to become a emotionless stone by killing all desires. Young practitioners often feel guilty about having career aspirations, wanting nice things, or feeling passion. But the Buddha made a vital distinction.\n\n### Craving (Taṇhā) vs. Wholesome Desire (Chanda):\n* **Taṇhā (Clinging)**: The compulsive, anxious craving that expects temporary things to provide permanent satisfaction. This leads to suffering (*Dukkha*) because everything is subject to change (*Anicca*).\n* **Chanda (Aspiration)**: The healthy, conscious desire to achieve something beneficial, such as learning a skill, supporting your family, or attaining peace. \n\nWithout wholesome desire, you could never begin the spiritual path! The goal is to act out of love and wisdom rather than anxiety and possession.',
  'ਮਨੋਪੁਬ੍ਬਙ੍ਗਮਾ ਧਮ੍ਮਾ ਮਨੋਸੇਟ੍ਠਾ ਮਨੋਮਯਾ ।',
  'Dhammapada 1',
  '/bhakti/mala',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800',
  true
),
-- BUDDHIST 2: Mindfulness
(
  'what-is-true-mindfulness',
  'Waking Up from Autopilot',
  'The real meaning of mindfulness',
  'buddhist',
  'practice',
  'Is mindfulness just a focus exercise?',
  'Mindfulness (Sati) is not about clearing your mind or forcing absolute focus. It is the simple act of remembering to observe your thoughts and feelings without judgment. It is about waking up from automatic reactions to see reality clearly, leading to natural peace.',
  '## Mindfulness: Beyond Stress Relief\n\nMindfulness has become a modern buzzword, often packaged as a simple productivity hack or relaxation exercise. But its spiritual purpose is much deeper: it is the vehicle of liberation.\n\n### The Meaning of Sati\nThe original Pali word is *Sati*, which literally translates to "remembering." It does not mean forcing your mind to be empty of thoughts. Rather, it means *remembering* to observe what is happening in the present moment without judging it as good or bad.\n\nBy observing your anger, worry, or joy without reacting, you break the cycle of automatic habits. You begin to see that thoughts and feelings come and go like clouds, while your core awareness remains calm and untouched.',
  'ਏਕਾਯਨੋ ਅਯਂ ਭਿਕ੍ਖਵੇ ਮਗ੍ਗੋ ਸਤ੍ਤਾਨਂ ਵਿਸੁਦ੍ਧਿਯਾ...',
  'Satipatthana Sutta',
  '/discover/mood',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  true
),
-- BUDDHIST 3: Lotus Symbol
(
  'symbolism-of-the-lotus',
  'Rising Above the Mud',
  'Why the lotus flower is sacred',
  'buddhist',
  'symbol',
  'Why is the lotus flower so sacred in Buddhism?',
  'The lotus grows in muddy water but rises above it to bloom, completely unstained by the mud. It represents our mind: no matter how messy, confusing, or painful your current life circumstances are, your inner nature remains pure and has the potential to awaken beautifully.',
  '## The Lotus: Your Unstained Potential\n\nMany of us feel that we aren''t spiritual enough or that our lives are too chaotic, messy, and complicated for practice. This feeling of unworthiness is exactly what the lotus flower is meant to heal.\n\n### Out of the Mud\nThe lotus flower begins its life deep in the mud at the bottom of a pond. It must push its way through the dark, murky water to reach the surface. Yet, when it blooms in the sunlight, not a speck of mud clings to its petals.\n\nYour mind is the same. The "mud" of daily stress, family conflicts, and personal struggles is not an obstacle to your growth—it is the very soil from which you awaken. Your true nature is already pure and untouched by the dirt of the world.',
  'ਵਾਰਿਜਂਵ ਯਥਾ ਕੋਕਨਦਂ ਸੁਗਨ੍ਧਂ...',
  'Samyutta Nikaya',
  '/progress',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
  true
),

-- JAIN 1: Ahimsa
(
  'is-ahimsa-just-diet',
  'The Compassionate Mind',
  'Ahimsa as a mental practice',
  'jain',
  'practice',
  'Is Jain Ahimsa just about not eating meat?',
  'Ahimsa (non-violence) starts in the mind. Physical actions are just expressions of our thoughts. Jainism teaches that harboring anger, greed, or pride causes violence to our own soul first. Ahimsa is the practice of kindness, empathy, and mental peace toward ourselves and others.',
  '## Ahimsa: The Protection of the Self and Others\n\nJain non-violence (*Ahimsa*) is globally famous for its strict physical practices. But looking only at the physical actions makes it feel dogmatic and restrictive. Jain texts clarify that Ahimsa is primarily an emotional and mental training.\n\n### Violence of the Mind (Bhav-Himsa):\nEvery time you feel hatred, jealousy, or anger toward someone, you commit *Bhav-Himsa*—mental violence. This negative energy harms your own soul (*Jiva*) first. Ahimsa is the practice of consciously replacing these toxic thoughts with forgiveness and empathy (*Maitri*). It is an act of deep self-care and healing.',
  'ਅਹਿੰਸਾ ਸੱਚਮਿਵ ਧਰ੍ਮੋ...',
  'Uttaradhyayana Sutra',
  '/pathshala?tradition=jain',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  true
),
-- JAIN 2: Anekantavada
(
  'what-is-anekantavada',
  'The Elephant and the Blind Men',
  'Anekantavada as intellectual humility',
  'jain',
  'scripture',
  'What is Anekantavada (Many-sidedness)?',
  'Anekantavada is the teaching of intellectual humility. It says truth is multifaceted and no single person possesses the absolute truth. Just like the famous story of the blind men and the elephant, everyone holds a piece of the truth. It teaches us to respect and listen to other perspectives.',
  '## Anekantavada: Letting Go of the Need to Be Right\n\nIn our highly polarized world, we often cling to our opinions and feel anger when others disagree. Jainism offers a beautiful antidote to this conflict: *Anekantavada*, the philosophy of non-one-sidedness.\n\n### The Metaphor of the Elephant\nJain texts tell the story of six blind men touching different parts of an elephant. One touches the leg and says the elephant is a pillar; another touches the tail and says it is a rope. Each is correct from his limited perspective, but wrong in claiming the absolute truth. \n\nAccepting Anekantavada frees us from the arrogance of absolute certainty. It allows us to hold our beliefs with humility while honoring the truth in others'' perspectives.',
  'ਏਕਂ ਸਦ੍ਵਿਪ੍ਰਾ ਬਹੁਧਾ ਵਦਨ੍ਤਿ...',
  'Tattvartha Sutra',
  '/vichaar-sabha',
  'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800',
  true
),
-- JAIN 3: Pratikraman
(
  'why-do-jains-perform-pratikraman',
  'The Path of Returning Home',
  'Pratikraman as self-compassion',
  'jain',
  'festival',
  'Why do Jains perform Pratikraman?',
  'Pratikraman means "returning." It is not about self-flagellation or wallowing in guilt for past mistakes. Instead, it is a gentle, structured review of your actions to let go of anger, resolve conflicts, ask for forgiveness, and return to your peaceful, pure inner self.',
  '## Pratikraman: Dusting the Mirror of the Soul\n\nWe all make mistakes, speak harshly, or act out of selfishness. Carrying the guilt of these actions dims our inner joy. Jainism offers a regular ritual called *Pratikraman* to help you clean your mental slate.\n\n### The Meaning of Returning\n*Pratikraman* literally means "turning back" or "returning." It is the process of reflecting on your actions, acknowledging where you fell short, and seeking forgiveness from anyone you may have hurt—and crucially, forgiving yourself. \n\nIt is not about shame or guilt. It is like washing your hands when they are dirty. You clean the dirt so you can walk forward with a light, free, and loving heart.',
  'ਮਿਚ੍ਛਾਮਿ ਦੁਕ੍ਕਡਮ੍ ॥',
  'Jain Pratikraman Sutra',
  '/vrat',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
  true
);
