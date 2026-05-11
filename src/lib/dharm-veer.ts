/**
 * Shoonaya — Dharm Veer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted stories of forgotten and underappreciated heroes of Dharma.
 * Covers all four traditions — Hindu, Sikh, Buddhist, Jain — with genuine
 * depth: real trials, real sacrifice, real wisdom.
 *
 * A new hero surfaces on the home card every day via getDharmVeerOfTheDay().
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DharmVeer {
  id: string;
  name: string;
  nameLocal?: string; // e.g. in Hindi/Gurmukhi/etc.
  era: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
  region: string;
  emoji: string;
  tagline: string;
  taglineLocal?: string;
  /** 2–3 paragraph account of their life and mission */
  journey: string;
  /** The defining test, sacrifice, or trial they endured */
  trial: string;
  /** Their core teaching in plain language */
  teaching: string;
  /** The moral for a modern seeker */
  moral: string;
  quote?: {
    text: string;
    attribution: string;
  };
}

export const DHARM_VEERS: DharmVeer[] = [

  // ── 1. Adi Shankaracharya ─────────────────────────────────────────────────
  {
    id: 'adi-shankaracharya',
    name: 'Adi Shankaracharya',
    nameLocal: 'आदि शंकराचार्य',
    era: '788–820 CE',
    tradition: 'hindu',
    region: 'Kalady, Kerala',
    emoji: '🕉️',
    tagline: 'He walked the length of India at 16 and rebuilt an entire civilisation of thought.',
    taglineLocal: '१६ वर्ष की आयु में पूरे भारत की पदयात्रा कर उन्होंने भारतीय दर्शन को पुनर्जीवित किया।',
    journey:
      'Shankara was born in a small Kerala village, lost his father at three, and by eight had memorised the four Vedas. His mother refused to let him take sannyasa — renouncing the world — but a crocodile seized his leg while he bathed in the river. He called out to her: let me die a monk or die a householder\'s son. She relented. The crocodile released him.\n\nAt sixteen, Shankara walked barefoot from Kerala to Varanasi, then Badrinath, then Bengal, then Kashmir — the full spine of the subcontinent. Everywhere he went he challenged scholars in public debate. The tradition of Mimamsa, which held that ritual alone was religion, had dominated Indian thought for centuries. Shankara argued instead for Advaita Vedanta: that the deepest identity of every human being is not the body, not the mind, but Brahman itself — pure consciousness, undivided and immortal.\n\nIn thirty-two years of life he wrote 300 texts including commentaries on the Brahmasutras, the principal Upanishads, and the Bhagavad Gita. He founded four mathas — monasteries at the four cardinal points of India — that still stand today as centres of Vedantic learning. He died at thirty-two.',
    trial:
      'His most famous debate was with Mandana Mishra, the greatest Mimamsa scholar of the age. Mishra\'s wife, Ubhaya Bharati, served as judge. After Shankara won, she challenged him to a second debate — this time on the subject of conjugal love, which he as a lifelong celibate could not know. Shankara paused for a month, temporarily entered the body of a deceased king to gain that knowledge, and returned to complete the debate. He won. But the real trial was never the debate — it was the willingness to remain unknown, to die at thirty-two having poured everything into a world that may not listen for centuries.',
    teaching:
      'You are not the body that will die, not the mind that doubts, not the identity that seeks approval. You are Brahman. The one who knows this is liberated — not after death, but right now.',
    moral:
      'The most radical act is to live from your deepest identity rather than your anxious surface self. Shankara did not fight the darkness. He simply kept turning on the light.',
    quote: {
      text: 'Brahma satyam jagan mithya, jivo brahmaiva naparah.',
      attribution: 'Brahman alone is real; the world is appearance; the individual soul is none other than Brahman. — Vivekachudamani',
    },
  },

  // ── 2. Guru Teg Bahadur ───────────────────────────────────────────────────
  {
    id: 'guru-teg-bahadur',
    name: 'Guru Teg Bahadur',
    nameLocal: 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
    era: '1621–1675 CE',
    tradition: 'sikh',
    region: 'Amritsar, Punjab',
    emoji: '☬',
    tagline: 'He laid down his life not for his own faith, but to protect the religious freedom of Hindus.',
    taglineLocal: 'ਉਨ੍ਹਾਂ ਨੇ ਆਪਣੇ ਧਰਮ ਲਈ ਨਹੀਂ, ਸਗੋਂ ਹਿੰਦੂਆਂ ਦੀ ਧਾਰਮਿਕ ਆਜ਼ਾਦੀ ਦੀ ਰੱਖਿਆ ਲਈ ਆਪਣੀ ਜਾਨ ਕੁਰਬਾਨ ਕਰ ਦਿੱਤੀ।',
    journey:
      'Teg Bahadur was the ninth Sikh Guru, a man of deep contemplation who spent years in solitary meditation before accepting the Guruship. He was known as Teg Bahadur — brave of sword — but his courage was first inward. He wrote extraordinary banis filled with the teaching of equanimity: fear nothing, covet nothing, be still in both joy and sorrow.\n\nIn 1675, the Mughal Emperor Aurangzeb launched a systematic campaign to convert Kashmiri Pandits to Islam by force. Thousands of Brahmins sent a delegation to Anandpur Sahib, weeping before the Guru. His son, nine-year-old Gobind Rai — who would become Guru Gobind Singh — saw his father\'s face and asked: who is great enough to stop this? Teg Bahadur replied: only a great person can give this sacrifice. The boy said: then who is greater than you?\n\nTeg Bahadur went to Delhi and presented himself to Aurangzeb. He was arrested, imprisoned for months, and given three choices: perform a miracle, convert to Islam, or die. He refused all three. Before killing him, the Mughals beheaded his companions first, in front of him, trying to break his will. It did not break.',
    trial:
      'Before his execution, Aurangzeb had Bhai Mati Das sawed in half while still alive. Bhai Dyala Das was boiled in a cauldron. Bhai Sati Das was burned alive — all in front of Guru Teg Bahadur, to make him recant. He watched each of his beloved companions die and did not move. He was beheaded in Chandni Chowk, Delhi, on 11 November 1675. He gave his head; he did not give his mind.',
    teaching:
      'The Guru\'s last act was not for Sikhism. It was for the right of every human being to walk their own spiritual path without coercion. He called it Hind di Chadar — the shield of India.',
    moral:
      'Real courage is not the absence of fear. It is remaining human — remaining soft and principled — in conditions designed to make you hard and compliant.',
    quote: {
      text: 'Bhau kahu ko det neh, neh bhau manat aan. Kahu neh jas neh apbas, eh mukti ko jaan.',
      attribution: 'Fear no one and frighten no one. Do not flatter and do not be flattered. This is the mark of liberation. — Guru Teg Bahadur, Sri Guru Granth Sahib',
    },
  },

  // ── 3. Mahavira ───────────────────────────────────────────────────────────
  {
    id: 'mahavira-trials',
    name: 'Mahavira',
    nameLocal: 'भगवान महावीर',
    era: '599–527 BCE',
    tradition: 'jain',
    region: 'Vaishali, Bihar',
    emoji: '🤲',
    tagline: 'A prince who walked naked for 12.5 years, enduring everything without a sound.',
    taglineLocal: 'एक राजकुमार जिन्होंने १२.५ वर्षों तक मौन रहकर कठिन तपस्या की।',
    journey:
      'Vardhamana was born a prince of Vaishali, the son of a Kshatriya chief. He was married with a daughter. At thirty, he asked his parents for permission to become an ascetic. They refused. He waited. When they died, he waited another two years out of respect for his elder brother\'s grief. Then he renounced everything — his silk robes, his palace, his family — and walked out with a single cloth.\n\nAfter thirteen months even that cloth tore off on a thorn bush. He did not seek a replacement. For the next eleven years he wandered naked, fasting for days or weeks, maintaining complete silence, accepting no shelter, walking without rest. He practised ahimsa so rigorous that he strained drinking water through cloth to avoid swallowing insects and swept the ground before each step. In the monsoon season when villagers sought shelter, he stood in the rain.\n\nAfter 12.5 years of this, sitting under a sala tree near the river Rijupalika, he attained Kevala Jnana — omniscience, complete liberation. He spent the next thirty years teaching. His followers, the Jains, became one of the most remarkable communities in human history: disproportionately influential in philosophy, mathematics, commerce, and non-violence advocacy.',
    trial:
      'The most documented trial came in the village of Chammari, where cowherds, frustrated by his silence and his presence near their cattle, poured hot oil in his ears and pushed wooden spikes through them. He did not react, did not speak, did not leave. This is not a comfortable story. It is a story about what absolute commitment to non-retaliation looks like when tested by people with real malice.',
    teaching:
      'Ahimsa is not an attitude. It is a practice, maintained breath by breath, step by step, even when the world is hostile, even when silence looks like defeat, even when the body screams.',
    moral:
      'Mahavira\'s extreme path is not for everyone. But the principle — that every living being has a soul deserving protection, that violence poisons the one who commits it — is something every tradition and every modern mind can sit with.',
    quote: {
      text: 'All living beings desire to live. To them life is dear. Therefore do not take life.',
      attribution: 'Mahavira, Acharanga Sutra',
    },
  },

  // ── 4. Swami Vivekananda ──────────────────────────────────────────────────
  {
    id: 'vivekananda',
    name: 'Swami Vivekananda',
    nameLocal: 'स्वामी विवेकानंद',
    era: '1863–1902 CE',
    tradition: 'hindu',
    region: 'Calcutta (Kolkata), Bengal',
    emoji: '🔥',
    tagline: 'A 30-year-old monk from a colonised country walked into the World\'s Parliament of Religions and changed how the West saw India forever.',
    taglineLocal: 'शिकागो के धर्म संसद में उनके एक भाषण ने पूरी दुनिया का भारत के प्रति नजरिया बदल दिया।',
    journey:
      'Narendra Nath Datta was a brilliant, restless young man in colonial Calcutta who interrogated every swami and scholar he met with the same question: have you seen God? Most laughed. One man said yes. That man was Ramakrishna, a temple priest in Dakshineswar whom the English-educated young Narendra considered a village mystic. He went to test him. Ramakrishna touched him. For the next several minutes Narendra\'s consciousness dissolved entirely. He came back terrified. He went again and again.\n\nAfter Ramakrishna died of cancer, leaving behind eleven young disciples, Vivekananda took the vow of sannyasa at twenty-five. He walked the length of India alone, without money, eating what was offered, sleeping outside, learning the actual condition of his country. He saw the poverty, the caste discrimination, the spiritual genius coexisting with material collapse. He arrived at the southernmost point of India, at Kanyakumari, swam to a rock in the sea, and sat. For three days. When he came back he had his mission.\n\nIn 1893 he sailed to America with almost no money, knowing no one, with a borrowed name card and a letter to a Harvard professor. He arrived at the World\'s Parliament of Religions in Chicago and spoke. His opening — "Sisters and brothers of America" — stopped the auditorium. Two thousand people rose and gave him a two-minute standing ovation before he said another word. He gave a four-year lecture tour of the United States and Britain that introduced Vedanta, yoga, and the idea of religious pluralism to the modern West. He died at thirty-nine, having compressed four hundred years of work into nineteen years of adult life.',
    trial:
      'In the weeks before Chicago, Vivekananda was stranded in an unknown city with no food and no money, sleeping in an empty boxcar in the freight yards of Boston. He had been turned away from several doors. He sat on that train and wondered if the mission was over before it began. He came out of the freight yard and knocked on one more door.',
    teaching:
      'Each soul is potentially divine. The goal is to manifest this divinity within by controlling nature — external and internal. Do this either by work, or worship, or psychic control, or philosophy — by one, or more, or all of these — and be free.',
    moral:
      'A colonised country\'s most powerful export was not cotton or indigo. It was a philosophy of universal human dignity so complete that it walked into the capital of Western Christianity and was given a standing ovation.',
    quote: {
      text: 'Arise, awake, and stop not till the goal is reached.',
      attribution: 'Swami Vivekananda (after Katha Upanishad 1.3.14)',
    },
  },

  // ── 5. Chanakya ───────────────────────────────────────────────────────────
  {
    id: 'chanakya',
    name: 'Chanakya',
    nameLocal: 'आचार्य चाणक्य',
    era: '350–283 BCE',
    tradition: 'hindu',
    region: 'Takshashila (present-day Pakistan)',
    emoji: '🦅',
    tagline: 'He was insulted in Nanda\'s court, left his topknot untied, and did not tie it again until he had destroyed the empire.',
    taglineLocal: 'नंद साम्राज्य के विनाश तक उन्होंने अपनी शिखा नहीं बांधी और एक नए भारत का निर्माण किया।',
    journey:
      'Vishnugupta Chanakya was a professor at the great university of Takshashila — arguably the world\'s first residential university, where students from Persia, Greece, and across India came to study statecraft, medicine, and the Vedas. He was brilliant, physically unremarkable, and without patience for fools.\n\nHe went to the court of Dhanananda, the last Nanda emperor, to present a plan to resist Alexander\'s invasion. Dhanananda mocked his appearance and had him thrown out. Chanakya left, untied his topknot, and swore he would not tie it again until the Nanda dynasty was destroyed. He found an orphaned boy named Chandragupta. He spent twelve years training him — in warfare, statecraft, intelligence, the philosophy of power. He built a coalition from scratch.\n\nIn 322 BCE, Chandragupta\'s forces defeated the Nanda army and Chandragupta took the throne as the first Maurya emperor, the first ruler to unify the Indian subcontinent. Chanakya became his chief minister. He wrote the Arthashastra — a complete treatise on statecraft so sophisticated that German historians in the 20th century called it superior to Machiavelli and compared it to modern political science. Then, when Chandragupta was secure, he walked away.',
    trial:
      'The trial of Chanakya was not the twenty-two years of work. It was the question of power itself. He had access to the most powerful position in the known world and chose instead to leave it. The Arthashastra contains the famous line: the king should never trust even the minister who has made him king. He wrote that about himself. Then he acted on it.',
    teaching:
      'The true statesman works himself out of a job. Power accumulated for its own sake poisons. Power used to establish a condition of flourishing, then relinquished, is the only kind that does not corrupt.',
    moral:
      'There is a kind of person who keeps their topknot untied for twenty-two years, not out of obsession but out of precision — holding the intention while doing the work, releasing it only when the work is done. That quality is rarer than genius.',
    quote: {
      text: 'Before you start some work, always ask yourself three questions: Why am I doing it? What might the results be? Will I be successful? Only when you think deeply and find satisfactory answers to these questions, go ahead.',
      attribution: 'Chanakya, Arthashastra',
    },
  },

  // ── 6. Chaitanya Mahaprabhu ──────────────────────────────────────────────
  {
    id: 'chaitanya-mahaprabhu',
    name: 'Chaitanya Mahaprabhu',
    nameLocal: 'चैतन्य महाप्रभु',
    era: '1486–1534 CE',
    tradition: 'hindu',
    region: 'Nabadwip, Bengal',
    emoji: '💛',
    tagline: 'He danced kirtan in the streets of Bengal and made love the method — not a reward.',
    journey:
      'Vishvambhara Mishra was a brilliant pandita in Nabadwip, a centre of Sanskrit scholarship in Bengal. At twenty-two he went to Gaya for his father\'s shraddha ceremony and met a Vaishnava teacher, Ishvara Puri. Something cracked open. He returned to Nabadwip transformed, weeping continuously, clinging to his students, calling out "Hari!" in the streets. The scholars thought he had lost his mind. His wife Vishnupriya watched her husband become someone else entirely.\n\nHe began the sankirtan movement: walking through the streets with his companions, singing the names of Krishna and dancing. He sent this movement across Bengal and Orissa. When the Muslim magistrate of Nabadwip tried to stop the street processions, Chaitanya organised a crowd of 100,000 people. The magistrate attended and wept.\n\nAt twenty-four he took sannyasa and walked to Puri, then across South India for two years, then to Vrindavan. He spent the last eighteen years of his life in Puri, in a state of ecstatic absorption so intense that his body would sometimes contract to half its size, or he would run into the sea calling Krishna\'s name in the night. The tradition he founded — Gaudiya Vaishnavism — spread through six Vrindavan Goswamis who codified his theology and later through Bhaktivedanta Swami who brought it to the West in the 20th century.',
    trial:
      'Chaitanya\'s trial was renunciation. He loved his mother. He loved Vishnupriya, his young wife. The accounts say Vishnupriya spent the rest of her life after his sannyasa counting the names of Krishna on rice grains, one grain for each recitation, and giving the rice away as prasad each day. Their marriage was not ruined by him; it was consecrated. But the cost was real. The path required the willingness to let even the deepest human love become an offering.',
    teaching:
      'Love is the method and the destination. Not love as sentiment but love as complete surrender of the ego\'s agenda. In the kirtan, the name and the singer merge. That is the state Chaitanya was pointing at.',
    moral:
      'The intellect can understand Brahman as a concept. But a concept will not transform you. Transformation requires love — the kind that makes you cry in the street, that makes you indifferent to what the scholars think, that makes you dance when there is nothing to dance about.',
    quote: {
      text: 'Trinad api sunicena taror api sahishnuna. Amanina manadena kirtaniyah sada harih.',
      attribution: 'Be more humble than a blade of grass, more patient than a tree. Give respect to all, seek it from none. In this state, the Lord\'s name can always be sung. — Siksastaka, Chaitanya Mahaprabhu',
    },
  },

  // ── 7. Mirabai ────────────────────────────────────────────────────────────
  {
    id: 'mirabai',
    name: 'Mirabai',
    nameLocal: 'मीराबाई',
    era: '1498–1547 CE',
    tradition: 'hindu',
    region: 'Merta, Rajasthan',
    emoji: '🌸',
    tagline: 'A Rajput queen who chose Krishna over a kingdom — and survived poison, snakes, and exile.',
    journey:
      'Mira was a child of five when a passing sadhu showed her an image of Krishna as bridegroom. Something locked into place in her. She told her mother: this is the man I will marry. Her mother laughed and died shortly after. Mira grew up in the palace of Merta, was married to a Mewar prince, and dressed in court silks — but her heart was never there. At night she slipped away to the temple and danced before Krishna until dawn.\n\nAfter her husband died, her in-laws viewed her devotion as a disgrace. She sang openly in the streets with wandering sadhus, breaking every rule that bound a Rajput widow. Her brother-in-law, Vikram Singh, tried three times to kill her: first a cup of poison, which she drank and survived. Then a basket of flowers containing a cobra, which became a garland in her hands. Then a bed of nails, which she slept on peacefully.\n\nShe spent her later years in Vrindavan, and finally, according to tradition, walked into the image of Krishna at Dwarka and disappeared. Her bhajans — "Paayo Ji Maine Ram Ratan Dhan Paayo," "Mharo Prabhu Giridhar Nagar" — are still sung every morning across India, five centuries later.',
    trial:
      'Mira\'s trial was not the poison or the snakes. It was the sustained social pressure of an entire court, an entire tradition of Rajput honour, telling her that her love was madness, that her singing was shameful, that she was bringing disgrace on the royal lineage. Most people break under that kind of quiet, relentless pressure. She sang louder.',
    teaching:
      'Love is not a feeling that comes and goes. Love is a direction. When you point yourself entirely at the divine and refuse to be turned back by anything — status, safety, reputation, grief — that is bhakti. That is the path.',
    moral:
      'Mira did not fight the system. She simply loved something more than she feared it. When love is bigger than fear, freedom follows on its own.',
    quote: {
      text: 'Mere to Giridhar Gopal, doosaro na koye.',
      attribution: 'For me there is only Giridhar Gopal — no one else. — Mirabai',
    },
  },

  // ── 8. Ramanuja ──────────────────────────────────────────────────────────
  {
    id: 'ramanuja',
    name: 'Ramanujacharya',
    nameLocal: 'रामानुजाचार्य',
    era: '1017–1137 CE',
    tradition: 'hindu',
    region: 'Sriperumbudur, Tamil Nadu',
    emoji: '🏛️',
    tagline: 'His guru told him: if you share this secret mantra, you go to hell. He climbed the temple tower and shouted it to the crowd.',
    journey:
      'Ramanuja was a Vaishnava philosopher and theologian, successor to Yamunacharyar as head of the Sri Vaishnava tradition. He studied under Yadavaprakasha, but their philosophies diverged sharply: Yadavaprakasha taught that Brahman was featureless and that the individual soul dissolved into it at liberation. Ramanuja\'s heart insisted this was wrong. The individual soul does not dissolve. It is held, like a bee in a flower, in intimate relationship with the divine — permanently, joyfully, personally.\n\nHe developed Vishishtadvaita — qualified non-dualism — one of the most coherent philosophical systems ever constructed. He built a network of 74 teachers across South India to spread it. But the most famous story involves his own teacher giving him a secret mantra: the Ashtakshara, "Om Namo Narayanaya." The teacher said: this mantra will liberate whoever hears it — but if you share it with the unworthy, you will go to hell for the transgression.\n\nRamanuja climbed to the top of the Tirukoshtiyur temple gopuram and shouted the mantra to the crowd gathered below. His teacher, furious, summoned him. Ramanuja said: if my going to hell means all these people are liberated, that seems like the right trade. His teacher embraced him.',
    trial:
      'Ramanuja spent twelve years trying to get the secret mantra from Tirukoshtiyur Nambi, who tested him each time and sent him away. The distance from the Sri Rangam temple to Tirukoshtiyur is 120 kilometres. Eighteen trips. On the eighteenth, the mantra was given. And the first thing he did with it was make it public.',
    teaching:
      'Vishishtadvaita insists on bhakti as personal love, not abstract dissolution. God is personal. The relationship is personal. Salvation is not the erasure of the individual — it is the individual finally arriving, fully themselves, in the presence they always sought.',
    moral:
      'The things we are told to guard most carefully — wisdom, spiritual insight, real understanding — are most powerful when given away. Ramanuja made a calculation. He decided that liberation for many was worth damnation for one. He was right about the damnation too: no hell found him.',
    quote: {
      text: 'If my coming to perdition results in liberation for these assembled souls, so be it.',
      attribution: 'Ramanujacharya, traditional account from Tirukoshtiyur',
    },
  },

  // ── 9. Milarepa ───────────────────────────────────────────────────────────
  {
    id: 'milarepa',
    name: 'Milarepa',
    era: '1052–1135 CE',
    tradition: 'buddhist',
    region: 'Gungthang, Tibet',
    emoji: '🏔️',
    tagline: 'He killed thirty-five people with black magic — and became Tibet\'s greatest saint.',
    journey:
      'Milarepa\'s father died when he was seven, leaving the family\'s estate to a treacherous uncle who enslaved Mila and his mother. His mother, consumed by rage, sent him to study black magic. He learned well: he called down a hailstorm that collapsed his uncle\'s house during a wedding feast, killing thirty-five people including the uncle\'s son and daughter-in-law. He returned home to find his mother celebrating in the street. Then the weight of what he had done fell on him.\n\nHe sought out the great Buddhist teacher Marpa the Translator. But Marpa, who knew through vision what Mila had done and what he could become, spent years breaking him before teaching him. He made him build a stone tower, carry every stone up alone, then tear it down and build it in a different shape. Four times. For seven years. Mila\'s back opened with sores from the stone. He wept alone at night, convinced Marpa would never teach him. Marpa never wavered.\n\nWhen the teaching finally came, Milarepa went into the Himalayan caves alone. For years he ate only nettles until his skin turned green. He sang spontaneous songs of realisation — dohas — that became the foundation of the Kagyu lineage. He is the only known figure in Tibetan history to have achieved full Buddhahood in a single lifetime.',
    trial:
      'Near the end of his life, Milarepa\'s disciples asked him: Teacher, was Marpa cruel? He smiled and said Marpa was the most compassionate being he had ever met. The cruelty was surgery. Every tower he built and tore down burned one more layer of the karmic debt that would have kept him in lower realms for lifetimes. The master saw what the student could not bear to see yet.',
    teaching:
      'Karma is not punishment. It is physics. What you have done, you carry. But what you carry, you can put down — through practice, through honesty, through a teacher who loves you enough to refuse your excuses.',
    moral:
      'No one is beyond transformation. The man who killed thirty-five people became the most beloved teacher of Tibet. The question is never what you have done. The question is what you will do next.',
    quote: {
      text: 'My religion is to live and die without regret.',
      attribution: 'Milarepa',
    },
  },

  // ── 10. Nagarjuna ─────────────────────────────────────────────────────────
  {
    id: 'nagarjuna',
    name: 'Nagarjuna',
    nameLocal: 'नागार्जुन',
    era: '2nd–3rd century CE',
    tradition: 'buddhist',
    region: 'South India (possibly Andhra region)',
    emoji: '☸️',
    tagline: 'He proved that nothing has inherent existence — and in doing so, described the deepest nature of reality.',
    journey:
      'Almost nothing certain is known about Nagarjuna\'s life. Later texts say he was a brahmin, that he learned alchemy, that he found the Prajnaparamita sutras in the realm of the nagas — the serpent guardians — and brought them back to the human world. What is certain is that he wrote the Mulamadhyamakakarika, one of the most rigorous philosophical texts in human history, and that nothing in philosophy — East or West — has quite answered it.\n\nHis central insight was sunyata: emptiness. Not nothingness — not nihilism — but the absence of inherent, independent existence in anything. Things arise in dependence on other things. The self exists in dependence on the body and mind which exist in dependence on food and air and sunlight and parents and language and everything else. Pull any single thread and the whole cloth comes with it. There is no solid, independent floor beneath anything.\n\nThe Western philosophical tradition took 1500 years after Aristotle to seriously engage with what Nagarjuna had said in the 2nd century. His work became the philosophical backbone of Mahayana Buddhism across India, China, Japan, Korea, and Tibet.',
    trial:
      'The trial of Nagarjuna was not physical. It was the trial of holding a thought all the way to its conclusion. Emptiness, followed honestly, initially feels like vertigo — like everything you believed to be solid is dissolving. Many people stop at that feeling and retreat to the familiar solid ground of "I exist, things exist, this is real." Nagarjuna walked through the vertigo to the other side and found it was not nihilism. It was freedom.',
    teaching:
      'Because nothing has inherent existence, nothing is locked. No situation is permanently fixed. No person is permanently a certain way. No problem is without a solution. Emptiness is not the absence of meaning — it is the open space in which everything is possible.',
    moral:
      'The most paralyzing thought is "this is just how things are." Nagarjuna spent his entire life proving that nothing is just how it is. Everything arises in dependence on conditions. Change the conditions, change the outcome.',
    quote: {
      text: 'Whatever is dependently co-arisen, that is explained to be emptiness. That is dependent designation and is itself the middle way.',
      attribution: 'Nagarjuna, Mulamadhyamakakarika 24.18',
    },
  },

  // ── 11. Andal ──────────────────────────────────────────────────────────────
  {
    id: 'andal',
    name: 'Andal (Kothai)',
    era: '8th–9th century CE',
    tradition: 'hindu',
    region: 'Srivilliputhur, Tamil Nadu',
    emoji: '🌺',
    tagline: 'The only woman among the 12 Alvars — she wore garlands meant for Vishnu, and married him.',
    journey:
      'Andal was found as an infant under a tulsi plant by Periyalvar, a Vaishnava saint in Srivilliputhur. From childhood she was entirely absorbed in Krishna — she would weave garlands for the deity of the temple, but first she would put them on herself to see if they suited him. When her father discovered this sacrilege, he went to replace the garlands. But the deity appeared to him in a dream and said: I want only the garlands she has worn.\n\nShe composed two works that are still recited every single day in South Indian homes. The Tiruppavai — 30 verses sung every morning through the Tamil month of Margazhi — describes women waking before dawn, bathing in the river, and seeking Krishna as a bride seeks a groom. The Nacchiyar Tirumoli — 143 verses of devastating love poetry — records her longing, her impatience, her dreams in which Krishna came to marry her.\n\nAccording to tradition, Andal walked into the sanctum sanctorum of the Ranganatha temple at Srirangam and merged with the deity. The image of her remains in the temple. She is the only Alvar worshipped as a goddess, not just honoured as a saint.',
    trial:
      'Andal\'s trial was a form of waiting. Her entire theology was that waiting for the divine is not passive — it is the most active possible state. Her Nacchiyar Tirumoli includes verses where she rages at the delay, dreams wild, intimate dreams, and refuses to let the longing become comfortable. She did not accept a substitute. She did not settle.',
    teaching:
      'The path of bhakti requires refusing all substitutes. Andal would not accept worldly marriage. She would not moderate her longing into something respectable. Total love means refusing to love anything less than the total.',
    moral:
      'Most of us dilute our deepest longing because the full intensity of it frightens us. Andal shows a different way: let the longing be as large as it is. It will carry you where nothing else can.',
    quote: {
      text: 'Ungal puzhakkadai thogutthu vandhom.',
      attribution: 'We have come with your sacred name on our lips — Tiruppavai, Verse 1, Andal',
    },
  },

  // ── 12. Tukaram ───────────────────────────────────────────────────────────
  {
    id: 'tukaram',
    name: 'Tukaram',
    nameLocal: 'संत तुकाराम',
    era: '1598–1650 CE',
    tradition: 'hindu',
    region: 'Dehu, Maharashtra',
    emoji: '🎵',
    tagline: 'A bankrupt shopkeeper who wrote 4,500 abhangas — and the Brahmin establishment threw them in the river.',
    journey:
      'Tukaram was a Shudra — a lower-caste trader from Dehu near Pune. He inherited his father\'s small grocery business, but a famine destroyed it. He lost his first wife and eldest son to starvation. His second wife called him a useless failure. Creditors pursued him. In this complete collapse, he turned to Vitthal — the form of Vishnu worshipped at Pandharpur — and began composing abhangas, devotional verses in Marathi, the everyday language of common people.\n\nHis abhangas were radical. He wrote about God from the position of a broken man, not a scholar. He wrote about the emptiness of caste, the poverty of vanity, the desperate love of the bhakta. Word spread. Thousands came to hear him. The established Brahmin scholars were furious: a Shudra had no right to interpret scripture or lead devotional gatherings. They confiscated his manuscripts and threw them into the Indrayani River. Tukaram fasted on the riverbank for thirteen days. On the fourteenth day, the manuscripts floated to the surface, dry and unharmed.',
    trial:
      'The Brahmin scholar Rameshwarbhat forced Tukaram to face a religious tribunal and accused him of heresy. Tukaram\s response was not to defend himself but to continue singing. He said: if Vitthal wills it, no one can silence me. If He does not, I would silence myself. The tribunal could find no grounds to condemn him. Within years, the great Maratha king Shivaji sent him an invitation to the palace and gifts. Tukaram sent them back.',
    teaching:
      'God does not live in the high scriptures or the upper castes. He lives in honest work, honest devotion, and the heart that has been broken enough to stop pretending.',
    moral:
      'Tukaram lost everything — business, child, reputation, manuscripts. Each loss stripped another layer of ego. By the end there was nothing left except the singing. That was enough.',
    quote: {
      text: 'Aata vishwachi mazhe ghar.',
      attribution: 'Now the whole world is my home. — Tukaram, Abhanga',
    },
  },

  // ── 13. Lal Ded (Lalla Ded) ────────────────────────────────────────────────
  {
    id: 'lal-ded',
    name: 'Lal Ded',
    era: '1320–1392 CE',
    tradition: 'hindu',
    region: 'Pandrethan, Kashmir',
    emoji: '❄️',
    tagline: 'She walked through Kashmir naked in winter, saying she had found the real garment — and Muslims and Hindus both wept at her grave.',
    journey:
      'Lalla was married at twelve into a family in which her mother-in-law despised her. She was given stones to eat under her rice, starved deliberately, humiliated publicly. Her husband was indifferent. She endured it for years and then, when she was around twenty-four, she left. Not for another man. For Shiva.\n\nShe wandered Kashmir as a yogini, composing vakhs — mystic verses in the Kashmiri language so economical and precise that they resemble mathematical proofs. She discarded her clothes, saying the body was not the self, and why dress what you are not? Kashmiris called her Lal Ded — "Grandmother Lalla" — with the tenderness reserved for someone both eccentric and clearly awake. She walked in snow; she laughed in the bazaars; she argued with scholars; she sat for long periods in stillness.\n\nWhen she died, tradition says both the Hindu and Muslim communities of Kashmir fought over who had the right to perform her final rites — because both communities claimed her as their own. Her vakhs are still quoted daily in Kashmir, in both Hindu and Muslim households.',
    trial:
      'Her trial was the ordinary cruelty of a household. Not dramatic persecution, not political danger — just the grinding daily diminishment of a woman with no power and no witness. The scholars argue about her exact path, her exact guru. What is clear is that she transformed the specific suffering of that household into a fire that burned every attachment away.',
    teaching:
      'The divine is not reached by acquiring more. It is reached by dropping everything — every identity, every claim, every garment that makes you look like what you are not.',
    moral:
      'The people who cause our deepest suffering often become, inadvertently, the instrument of our deepest liberation. This is not a reason to thank them. It is a reason to not let them win.',
    quote: {
      text: 'Lal dyed herself with the colour of Her Lord. Whatever she saw she saw as He.',
      attribution: 'Lal Ded, Vakhs',
    },
  },

  // ── 14. Akka Mahadevi ─────────────────────────────────────────────────────
  {
    id: 'akka-mahadevi',
    name: 'Akka Mahadevi',
    era: '12th century CE',
    tradition: 'hindu',
    region: 'Udutadi, Karnataka',
    emoji: '🌙',
    tagline: 'She left a king\'s palace to wander naked — her only garment was her hair and her devotion to Shiva.',
    journey:
      'Mahadevi was a devout Shaivite from childhood, pledging herself to Chennamallikarjuna — Shiva as the lord of jasmine — as her husband. She was so beautiful that the local Jain king Kaushika demanded she marry him. Her parents, frightened, agreed. She set three conditions: he must never interrupt her worship, never touch her against her will, never ask her to behave as a conventional queen. He agreed. He broke all three conditions.\n\nShe left the palace. She removed her silk clothes and covered herself only with her long hair. She walked to Kalyana, the centre of the Lingayat Vachana movement, where the great saints Allama Prabhu, Basavanna, and Siddharama had gathered. She was admitted only after a rigorous examination — Allama Prabhu testing her with questions designed to expose any remaining ego or claim to special status. She answered every question and was accepted.\n\nHer vachanas — prose-poems in Kannada, addressed to Chennamallikarjuna — are among the most intimate, fearless devotional writings in any language. She died young in the Kadali forest near Srisailam, reportedly in union with the deity she had sought her entire life.',
    trial:
      'The examination by Allama Prabhu was the trial. He asked her why she was naked. She said: because there is no one left to cover herself from. He pressed: is there no shame? She said: shame requires a self that can be shamed. Is there such a self? The room went quiet. She had passed.',
    teaching:
      'Conventional piety — fasting, rituals, correct behaviour — maintains the ego\'s management of spirituality. The mystic\'s path is to dissolve the manager. When there is no one left to manage, there is also nothing left to hide.',
    moral:
      'Every person who has ever left a safe, approved situation to follow something they could not explain to others stands in Akka Mahadevi\'s lineage. The discomfort of others with your path is not evidence that the path is wrong.',
    quote: {
      text: 'Would a circling vulture know such love? Would a clumsy crow know the music? Oh Chennamallikarjuna, I am your bride.',
      attribution: 'Akka Mahadevi, Vachana 89',
    },
  },

  // ── 15. Banda Singh Bahadur ────────────────────────────────────────────────
  {
    id: 'banda-singh-bahadur',
    name: 'Banda Singh Bahadur',
    nameLocal: 'ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ',
    era: '1670–1716 CE',
    tradition: 'sikh',
    region: 'Rajouri, Kashmir',
    emoji: '⚔️',
    tagline: 'A hermit turned warrior who abolished feudal slavery in Punjab — in 1710.',
    journey:
      'Madho Das was a wandering Hindu ascetic who had spent years in the jungles practicing Shaivite austerities. In 1708, Guru Gobind Singh arrived at his ashram in Nanded. Madho Das woke from sleep and found the Guru sitting on his bed. He tried every sidhi he possessed to move him. Nothing worked. He walked to the Guru and said: I am your banda — your slave. Guru Gobind Singh made him Banda Singh Bahadur and gave him five arrows from his own quiver.\n\nBanda marched to Punjab with a small force. Within two years he had dismantled the Mughal and Afghan feudal structure of the entire region. At the Battle of Chappar Chiri in 1710, he defeated Wazir Khan — the governor who had ordered the murder of Guru Gobind Singh\'s two younger sons, bricked alive in a wall. More remarkably, he issued orders abolishing the zamindari system: for the first time in Punjab\'s recorded history, the farmers who tilled the land owned it. This was 1710.',
    trial:
      'Banda was captured in 1716 after a prolonged siege. The Mughal emperor Farrukhsiyar had him paraded through Delhi in an iron cage. He was given a choice: convert to Islam and live. He refused. Over the following days, his infant son was placed in his lap and executed with a sword, his heart placed in Banda\'s mouth. Then 700 of his Sikhs were beheaded before him. Then, finally, his own eyes were torn out, his limbs cut off one by one. He did not recant.',
    teaching:
      'Dharma is not just personal liberation. It is justice — for the farmer, for the laborer, for the person who has no power. The Guru\'s arrow points outward as much as inward.',
    moral:
      'A hermit became the first person to abolish serfdom in South Asia because he finally turned his spiritual power into service. Practice that stays private eventually turns inward and stagnates.',
    quote: {
      text: 'I have received the five arrows of the Guru. With them I fear neither man nor devil.',
      attribution: 'Banda Singh Bahadur',
    },
  },

  // ── 16. Mata Bhag Kaur ────────────────────────────────────────────────────
  {
    id: 'mata-bhag-kaur',
    name: 'Mata Bhag Kaur',
    nameLocal: 'ਮਾਤਾ ਭਾਗ ਕੌਰ',
    era: '1670–1740s CE',
    tradition: 'sikh',
    region: 'Jhabal Kalan, Punjab',
    emoji: '🌊',
    tagline: 'When 40 Sikhs deserted the Guru, she shamed them home — and led them into battle herself.',
    journey:
      'In 1704, the Mughal siege of Anandpur was so brutal that forty Sikhs, starving and exhausted, signed a "bedawa" — a letter disowning Guru Gobind Singh, releasing him from any obligation to them and themselves from any obligation to him — and went home to their villages. Bhag Kaur, a woman from Jhabal Kalan, heard them returning. She confronted them in the street: you call yourselves Singhs — lions — and you signed a paper saying your Guru is not your Guru? You think God will accept you in your homes while your Guru fights alone?\n\nShe dressed in the clothes of a Sikh warrior, picked up a sword, and announced she was going back to the Guru. One by one, the forty Sikhs followed her. They caught up with Guru Gobind Singh at Khidrana — a dried lake bed. The Mughals arrived at the same time. The forty Sikhs fought alongside Guru Gobind Singh in what became known as the Battle of Muktsar. All forty were killed. Guru Gobind Singh walked the battlefield after and tore up their bedawa in front of their bodies, calling them the forty muktas — the forty liberated ones.',
    trial:
      'Bhag Kaur survived the battle and lived for decades afterward. She spent her later years in meditation and service. But her moment of trial was not the battle — it was the confrontation in the village, armed with nothing but righteous fury, facing men who had chosen to go home. The courage to tell the truth to people who do not want to hear it is its own form of battle.',
    teaching:
      'Liberation is not earned through safety. It is earned through showing up when it costs something to show up.',
    moral:
      'One woman with moral clarity turned forty deserters into forty martyrs. You do not need an army. You need to be willing to say the true thing out loud.',
    quote: {
      text: 'You have given up the Guru. If you will not go back, then I will go and die in your place.',
      attribution: 'Mata Bhag Kaur, traditional account',
    },
  },

  // ── 17. Bhai Ghanaya ──────────────────────────────────────────────────────
  {
    id: 'bhai-ghanaya',
    name: 'Bhai Ghanaya',
    nameLocal: 'ਭਾਈ ਘਨੱਈਆ',
    era: '1648–1718 CE',
    tradition: 'sikh',
    region: 'Sodhara, Punjab',
    emoji: '💧',
    tagline: 'He gave water to wounded enemy soldiers on the battlefield — and the Guru called it perfect Sikhism.',
    journey:
      'Bhai Ghanaya served in the Sikh armies under Guru Gobind Singh during the battles against the Mughal forces. His role on the battlefield was to carry water to the wounded and dying. This was already an act of courage — battlefields were not safe places for the unarmed. But Bhai Ghanaya went further: he gave water to wounded enemy soldiers as well.\n\nSikh soldiers reported this to Guru Gobind Singh, expecting him to rebuke Ghanaya. The Guru summoned him. Ghanaya came before the Guru and was asked: is it true you give water to our enemies? Yes, said Ghanaya. Why? Because I see no enemy, Guru ji. I see only your face in all faces.\n\nGuru Gobind Singh turned to his soldiers and said: this man has understood the teaching. He not only did not rebuke Ghanaya — he gave him ointment to apply to the wounds of those he was tending, effectively appointing him as a medic. The tradition of the Khalsa langar, the free communal kitchen that serves anyone regardless of faith, has its spirit in this moment.',
    trial:
      'Bhai Ghanaya\'s trial was continuing to do what he believed was right under the direct social pressure of fellow soldiers who saw it as betrayal. The Guru\'s approval vindicated him — but he did not know the Guru would approve when he was on the battlefield choosing whom to serve.',
    teaching:
      'The divine has no enemies. When you are fully in the Guru\'s presence, you cannot see the human divisions — Hindu, Muslim, friend, enemy — that ordinarily organize perception. You see only life, asking for water.',
    moral:
      'The most radical act on a battlefield is mercy. Not weakness. Not betrayal. The recognition that the person dying on the other side is also a person.',
    quote: {
      text: 'I see only the Guru\'s face in all faces. To whom shall I give water and to whom shall I not?',
      attribution: 'Bhai Kanhaiya, traditional account',
    },
  },

  // ── 18. Tirumangai Alvar ──────────────────────────────────────────────────
  {
    id: 'tirumangai-alvar',
    name: 'Tirumangai Alvar',
    era: '7th–8th century CE',
    tradition: 'hindu',
    region: 'Tirukkuraiyalur, Tamil Nadu',
    emoji: '🌅',
    tagline: 'A chieftain and bandit who robbed Vishnu himself — and became one of the twelve Alvars.',
    journey:
      'Nila was a chieftain under the Pallava king, known as "Mankan" — he who rules with a club. He was arrogant, violent, and powerful. He fell in love with a woman named Kumudavalli, who agreed to marry him only if he fed a thousand Brahmins every day for a year. He accepted and began the feasts, but the costs ruined him completely. His own land, his treasury, his soldiers — all gone. Still the feasts continued.\n\nIn desperation he became a highway robber. He and his gang were known throughout the Tamil country. His final act of robbery was his last: a young Brahmin couple were travelling at night, dressed in extraordinary jewellery. He stopped them and demanded the jewels. When he reached to remove them, his hands would not move. He looked into the young man\'s face and knew who he was.\n\nIn that encounter he was broken open. He composed the Mangalasasanam — benedictory verses to all the divyadesams, the 108 Vishnu temples — including detailed architectural and emotional descriptions so precise that they remain the primary source for historians. He also financed the construction of the final gopuram of the Srirangam temple by robbing passing ships on the Kaveri river. He never quite entirely reformed. He simply redirected.',
    trial:
      'Tirumangai\'s trial was the moment of recognition — standing on a dark road, hand outstretched toward what he suddenly understood was the divine, frozen. He could not take the jewels. He could not explain why. The intellect that had spent his whole life calculating angles had no angle for this.',
    teaching:
      'God does not wait for you to be good before approaching. He meets you on the dark road, in your worst moment, dressed as a victim, to see what you will do with the recognition.',
    moral:
      'Tirumangai stole to fund devotion and robbed boats to build temples. His logic was crooked. His love was not. Sometimes what looks like contradiction from the outside is a form of integrity the outside cannot see.',
    quote: {
      text: 'He who stands in my heart — I will go wherever He is kept.',
      attribution: 'Tirumangai Alvar, Periya Tirumozhi',
    },
  },

  // ── 19. Angulimala ────────────────────────────────────────────────────────
  {
    id: 'angulimala',
    name: 'Angulimala',
    nameLocal: 'अंगुलिमाल',
    era: '6th–5th century BCE',
    tradition: 'buddhist',
    region: 'Kosala Kingdom (present-day Uttar Pradesh)',
    emoji: '🙏',
    tagline: 'He had killed 999 people and wore their fingers as a garland. The Buddha walked toward him.',
    journey:
      'Ahimsaka — "the harmless one" — was a brilliant brahmin student, envied by his classmates. His teacher\'s other students, jealous of his skill, told the teacher that Ahimsaka was plotting to kill him. The teacher, frightened, assigned him an impossible task as gurudakshina: bring me the right-hand fingers of a thousand people. Ahimsaka, bound by a student\'s absolute obedience to the teacher, became a killer. He was renamed Angulimala — necklace of fingers.\n\nFor years he terrorised the kingdom of Kosala. Armies could not stop him. Families fled. The king himself prepared a military expedition. The Buddha, who was in Sravasti, looked out at the landscape and walked toward the forest where Angulimala lived. Everyone who saw him leave begged him to turn back. He continued.\n\nAngulimala saw the lone monk from a distance and ran toward him, certain of an easy kill. He ran, and ran, and could not close the distance. The Buddha walked at a steady pace. Angulimala finally called: Stop! The Buddha replied: I have stopped, Angulimala. When will you?',
    trial:
      'After taking refuge with the Buddha and becoming a monk, Angulimala went on alms rounds in Sravasti — the same city he had terrorised. People threw stones and refuse at him. He was struck, bleeding. He returned to the Buddha who said: "Bear it, Brahmin. You are experiencing now what would otherwise have ripened as torment over many lifetimes." Angulimala bore it without retaliation. He attained Arahantship — full liberation — in that same life.',
    teaching:
      'The Buddha did not turn away from the worst person in the kingdom. The tradition says he saw Angulimala\'s potential for liberation the way a skilled doctor sees a diseased patient: not with revulsion, but with clarity about what is needed.',
    moral:
      'No one is defined by the worst thing they have done. The question is always whether they are willing to stop and to bear the consequences of having started.',
    quote: {
      text: 'I have truly stopped. I will harm no being in all the world. You continue to harm — that is why you have not stopped.',
      attribution: 'Angulimala, Theragatha 16.8',
    },
  },

  // ── 20. Sthulibhadra ─────────────────────────────────────────────────────
  {
    id: 'sthulibhadra',
    name: 'Sthulibhadra',
    era: '4th–3rd century BCE',
    tradition: 'jain',
    region: 'Pataliputra (present-day Patna, Bihar)',
    emoji: '🌿',
    tagline: 'He was the most powerful courtier in the Nanda empire — and walked away from it for a courtesan named Kosha.',
    journey:
      'Sthulibhadra was the chief minister\'s son, a scholar and rising power in Pataliputra during the rule of Nanda Nandivardhan, last of the great Nanda dynasty. He fell completely in love with Kosha, a famous courtesan. He spent twelve years in her house, abandoning his career, his family\'s expectations, his position. When his father died and the position of chief minister passed to another family, something shifted.\n\nHe left Kosha\'s house and went to Bhadrabahu, the last great Jain acharya who still knew all twelve Agamas by heart. He became a Jain monk. His commitment was so total that after years of study Bhadrabahu taught him ten of the fourteen Purvas — the most ancient texts — and then stopped. Sthulibhadra asked why. Bhadrabahu said: you will misuse the remaining knowledge. Sthulibhadra went to Kosha\'s house, still a monk, to prove his detachment. He spent four months there, in the form of a lion. He meditated. She could not distract him. He returned to Bhadrabahu. Bhadrabahu confirmed: but you used the knowledge to show off. You transformed to impress her. The remaining four Purvas stayed untaught.\n\nBhadrabahu\'s judgment sealed him. Sthulibhadra accepted it. He became the transmission point for the ten Purvas that did survive — the foundation of Digambara and Svetambara Jain scripture.',
    trial:
      'Sthulibhadra\'s trial was not the renunciation of wealth or the twelve years with Kosha. His real trial was accepting Bhadrabahu\'s judgment that he had subtly failed — that even in perfect outward discipline, there was still ego operating. The ability to accept that kind of precise, loving correction without defending yourself is one of the rarer spiritual capacities.',
    teaching:
      'Non-attachment does not mean non-feeling. It means that the feeling does not command your actions. Sthulibhadra spent twelve years in love and twelve more in complete renunciation of the same person. Both periods were, in different ways, preparation for the same truth.',
    moral:
      'The people who seem most lost — living in excess, outside all conventional lines — sometimes become the most sincere seekers. The distance traveled matters less than the direction of travel.',
    quote: {
      text: 'The soul that has truly renounced does not need to prove it. The soul that needs to prove it has not yet renounced.',
      attribution: 'Jain tradition, attributed to Bhadrabahu on Sthulibhadra',
    },
  },
];

// ── Tradition Metadata ─────────────────────────────────────────────────────

export const TRADITION_META: Record<string, { label: string; emoji: string; color: string }> = {
  hindu:    { label: 'Sanatan Dharma', emoji: '🕉️', color: 'rgba(255, 120, 0, 0.12)' },
  sikh:     { label: 'Sikhi',          emoji: '☬', color: 'rgba(0, 100, 255, 0.12)' },
  buddhist: { label: 'Buddha Dhamma',  emoji: '☸️', color: 'rgba(255, 200, 0, 0.12)' },
  jain:     { label: 'Jain Dharma',    emoji: '🤲', color: 'rgba(0, 200, 50, 0.12)' },
};

// ── Rotation logic ─────────────────────────────────────────────────────────

/**
 * Returns the Dharm Veer for today. Changes every calendar day.
 * Tradition-aware: shuffles same-tradition heroes higher in the rotation.
 */
export function getDharmVeerOfTheDay(userTradition?: string | null): DharmVeer {
  const epoch = new Date('2024-01-01').getTime();
  const now   = new Date();
  // Use spiritual date (midnight IST offset) so it changes consistently
  const ist   = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dayN  = Math.floor((ist.getTime() - epoch) / (1000 * 60 * 60 * 24));
  const slot  = dayN; // one hero per day

  if (!userTradition) {
    return DHARM_VEERS[slot % DHARM_VEERS.length];
  }

  // Build a weighted pool: same-tradition heroes appear twice
  const same  = DHARM_VEERS.filter(h => h.tradition === userTradition);
  const other = DHARM_VEERS.filter(h => h.tradition !== userTradition);
  const pool  = [...same, ...same, ...other];

  return pool[slot % pool.length];
}
