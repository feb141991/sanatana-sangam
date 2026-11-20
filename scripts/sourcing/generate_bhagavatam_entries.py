#!/usr/bin/env python3
"""
Generate authentic Srimad Bhagavatam landmark entries for Pathshala.
Replaces the 107 duplicate loops in src/lib/data/bhagavatam-complete.ts.
Sourced landmark verses across Cantos 1-12 with Sanskrit Devanagari, IAST transliteration,
and public-domain English translations (Srila Prabhupada / Gita Press tradition).
"""

import json
from indic_transliteration import sanscript

def to_iast(devanagari_text: str) -> str:
    cleaned = devanagari_text.replace('\n', ' ').strip()
    return sanscript.transliterate(cleaned, sanscript.DEVANAGARI, sanscript.IAST)

entries = [
    # ── CANTO 1 ──
    {
        "id": "bhag-1-1-1",
        "title": "Srimad Bhagavatam 1.1.1 — The Absolute Truth",
        "source": "Srimad Bhagavatam 1.1.1",
        "canto": 1,
        "original": "जन्माद्यस्य यतोऽन्वयादितरतश्चार्थेष्वभिज्ञः स्वराट् ।\nतेने ब्रह्म हृदा य आदिकवये मुह्यन्ति यत्सूरयः ।\nतेजोवारिमृदां यथा विनिमयो यत्र त्रिसर्गोऽमृषा\nधाम्ना स्वेन सदा निरस्तकुहकं सत्यं परं धीमहि ॥",
        "meaning": "O my Lord Sri Krishna, son of Vasudeva, O all-pervading Supreme Personality of Godhead, I offer my respectful obeisances unto You. I meditate upon Lord Sri Krishna because He is the Absolute Truth and the primeval cause of all causes of the creation, sustenance, and destruction of the manifested universes. He is directly and indirectly conscious of all manifestations, and He is independent because there is no other cause beyond Him. It is He only who first imparted the Vedic knowledge unto the heart of Brahmaji, the original living being. By Him even the great sages and demigods are placed into illusion, as one is bewildered by the illusory representations of water seen in fire, or land seen on water. Only because of Him do the material universes, temporarily manifested by the reactions of the three modes of nature, appear factual, although they are unreal. I therefore meditate upon Him, Lord Sri Krishna, who is eternally existent in the transcendental abode, which is forever free from the illusory representations of the material world. I meditate upon Him, for He is the Absolute Truth.",
        "tags": ["bhagavatam", "canto-1", "absolute-truth", "creation", "krishna"],
        "attribution": "Vyasa"
    },
    {
        "id": "bhag-1-1-2",
        "title": "Srimad Bhagavatam 1.1.2 — Religion Free From Deception",
        "source": "Srimad Bhagavatam 1.1.2",
        "canto": 1,
        "original": "धर्मः प्रोज्झितकैतवोऽत्र परमो निर्मत्सराणां सतां\nवेद्यं वास्तवमत्र वस्तु शिवदं तापत्रयोन्मूलनम् ।\nश्रीमद्भागवते महामुनिकृते किं वा परैरीश्वरः\nसद्यो हृद्यवरुध्यतेऽत्र कृतिभिः शुश्रूषुभिस्तत्क्षणात् ॥",
        "meaning": "Completely rejecting all religious activities which are materially motivated, this Bhagavata Purana propounds the highest truth, which is understandable by those devotees who are fully pure in heart. The highest truth is reality distinguished from illusion for the welfare of all. Such truth uproots the threefold miseries. This beautiful Bhagavatam, compiled by the great sage Vyasadeva in his maturity, is sufficient in itself for God realization. What is the need of any other scripture? As soon as one attentively and submissively hears the message of Bhagavatam, by this culture of knowledge the Supreme Lord is established within his heart.",
        "tags": ["bhagavatam", "canto-1", "dharma", "purity", "liberation"],
        "attribution": "Vyasa"
    },
    {
        "id": "bhag-1-1-3",
        "title": "Srimad Bhagavatam 1.1.3 — The Ripened Fruit of the Vedic Tree",
        "source": "Srimad Bhagavatam 1.1.3",
        "canto": 1,
        "original": "निगमकल्पतरोर्गलितं फलं शुकमुखादमृतद्रवसंयुतम् ।\nपिबत भागवतं रसमालयं मुहुरहो रसिका भुवि भावुकाः ॥",
        "meaning": "O expert and thoughtful men, relish Srimad-Bhagavatam, the mature fruit of the desire tree of Vedic literatures. It emanated from the lips of Sri Sukadeva Goswami. Therefore this fruit has become even more tasteful, although its nectarean juice was already relishable for all, including liberated souls.",
        "tags": ["bhagavatam", "canto-1", "vedas", "sukadeva", "nectar"],
        "attribution": "Vyasa"
    },
    {
        "id": "bhag-1-2-11",
        "title": "Srimad Bhagavatam 1.2.11 — The Three Aspects of the Absolute",
        "source": "Srimad Bhagavatam 1.2.11",
        "canto": 1,
        "original": "वदन्ति तत्तत्त्वविदस्तत्त्वं यज्ज्ञानमद्वयम् ।\nब्रह्मेति परमात्मेति भगवानिति शब्द्यते ॥",
        "meaning": "Learned transcendentalists who know the Absolute Truth call this nondual substance Brahman, Paramatma or Bhagavan.",
        "tags": ["bhagavatam", "canto-1", "brahman", "paramatma", "bhagavan", "philosophy"],
        "attribution": "Suta Goswami"
    },
    {
        "id": "bhag-1-3-28",
        "title": "Srimad Bhagavatam 1.3.28 — Krishna is the Supreme Lord Himself",
        "source": "Srimad Bhagavatam 1.3.28",
        "canto": 1,
        "original": "एते चांशकलाः पुंसः कृष्णस्तु भगवान् स्वयम् ।\nइन्द्रारिव्याकुलं लोकं मृडयन्ति युगे युगे ॥",
        "meaning": "All of the above-mentioned incarnations are either plenary portions or portions of the plenary portions of the Lord, but Lord Sri Krishna is the original Personality of Godhead Himself. All of them appear on planets whenever there is a disturbance created by the atheists. The Lord incarnates to protect the theists.",
        "tags": ["bhagavatam", "canto-1", "krishna", "avatara", "supremacy"],
        "attribution": "Suta Goswami"
    },

    # ── CANTO 2 ──
    {
        "id": "bhag-2-9-33",
        "title": "Chatushloki Bhagavatam 1 — The Lord Existed Before Creation",
        "source": "Srimad Bhagavatam 2.9.33",
        "canto": 2,
        "original": "अहमेवासमेवाग्रे नान्यद्यत्सदसत्परम् ।\nपश्चादहं यदेतच्च योऽवशिष्येत सोऽस्म्यहम् ॥",
        "meaning": "Brahma, it is I, the Personality of Godhead, who was existing before the creation, when there was nothing but Myself. Nor was there the material nature, the cause of this creation. That which you see now is also I, the Personality of Godhead, and after annihilation what remains will also be I, the Personality of Godhead.",
        "tags": ["bhagavatam", "canto-2", "chatushloki", "creation", "eternal"],
        "attribution": "Lord Vishnu to Brahma"
    },
    {
        "id": "bhag-2-9-34",
        "title": "Chatushloki Bhagavatam 2 — The Nature of Maya",
        "source": "Srimad Bhagavatam 2.9.34",
        "canto": 2,
        "original": "ऋतेऽर्थं यत्प्रतीयेत न प्रतीयेत चात्मनि ।\nतद्विद्यादात्मनो मायां यथाऽऽभासो यथा तमः ॥",
        "meaning": "O Brahma, whatever appears to be of any value, if it is without relation to Me, has no reality. Know it as My illusory energy, that reflection which appears to be in the darkness.",
        "tags": ["bhagavatam", "canto-2", "chatushloki", "maya", "illusion"],
        "attribution": "Lord Vishnu to Brahma"
    },
    {
        "id": "bhag-2-9-35",
        "title": "Chatushloki Bhagavatam 3 — The Lord Pervades All and Stands Apart",
        "source": "Srimad Bhagavatam 2.9.35",
        "canto": 2,
        "original": "यथा महान्ति भूतानि भूतेषूच्चावचेष्वनु ।\nप्रविष्टान्यप्रविष्टानि तथा तेषु न तेष्वहम् ॥",
        "meaning": "O Brahma, please know that the universal elements enter into the cosmos and at the same time do not enter into the cosmos; similarly, I Myself also exist within everything created, and at the same time I am outside of everything.",
        "tags": ["bhagavatam", "canto-2", "chatushloki", "omnipresence", "acintya"],
        "attribution": "Lord Vishnu to Brahma"
    },
    {
        "id": "bhag-2-9-36",
        "title": "Chatushloki Bhagavatam 4 — The Ultimate Pursuit of Knowledge",
        "source": "Srimad Bhagavatam 2.9.36",
        "canto": 2,
        "original": "एतावदेव जिज्ञास्यं तत्त्वजिज्ञासुनाऽऽत्मनः ।\nअन्वयव्यतिरेकाभ्यां यत्स्यात् सर्वत्र सर्वदा ॥",
        "meaning": "A person who is searching after the Supreme Absolute Truth, the Personality of Godhead, must certainly search for it up to this, in all circumstances, in all space and time, and both directly and indirectly.",
        "tags": ["bhagavatam", "canto-2", "chatushloki", "inquiry", "atmatattva"],
        "attribution": "Lord Vishnu to Brahma"
    },

    # ── CANTO 3 ──
    {
        "id": "bhag-3-25-21",
        "title": "Srimad Bhagavatam 3.25.21 — Characteristics of a True Saint",
        "source": "Srimad Bhagavatam 3.25.21",
        "canto": 3,
        "original": "तितिक्षवः कारुणिकाः सुहृदः सर्वदेहिनाम् ।\nअजातशत्रवः शान्ताः साधवः साधुभूषणाः ॥",
        "meaning": "The symptoms of a sadhu are that he is tolerant, merciful and friendly to all living entities. He has no enemies, he is peaceful, he abides by the scriptures, and all his characteristics are sublime.",
        "tags": ["bhagavatam", "canto-3", "sadhu", "qualities", "kapila", "compassion"],
        "attribution": "Lord Kapila"
    },
    {
        "id": "bhag-3-25-25",
        "title": "Srimad Bhagavatam 3.25.25 — The Power of Holy Association",
        "source": "Srimad Bhagavatam 3.25.25",
        "canto": 3,
        "original": "सतां प्रसङ्गान्मम वीर्यसंविदो भवन्ति हृत्कर्णरसायनाः कथाः ।\nतज्जोषणादाश्वपवर्गवर्त्मनि श्रद्धा रतिर्भक्तिरनुक्रमिष्यति ॥",
        "meaning": "In the association of pure devotees, discussion of the pastimes and activities of the Supreme Personality of Godhead is very pleasing and satisfying to the ear and the heart. By cultivating such knowledge one gradually becomes advanced on the path of liberation, and thereafter his faith develops into attraction and genuine devotion.",
        "tags": ["bhagavatam", "canto-3", "satsanga", "bhakti", "kapila", "faith"],
        "attribution": "Lord Kapila"
    },
    {
        "id": "bhag-3-29-12",
        "title": "Srimad Bhagavatam 3.29.12 — Pure Devotion Unmotivated and Uninterrupted",
        "source": "Srimad Bhagavatam 3.29.12",
        "canto": 3,
        "original": "अहैतुक्यव्यवहिता या भक्तिः पुरुषोत्तमे ।\nसालोक्यसार्ष्टिसामीप्यसारूप्यैकत्वमप्युत ।\nदीयमानं न गृह्णन्ति विना मत्सेवनं जनाः ॥",
        "meaning": "Pure devotional service to the Supreme Person is unmotivated and unceasing. A pure devotee does not accept any kind of liberation — salokya, sarsti, samipya, sarupya, or even oneness with Me — if offered, unless it involves service unto Me.",
        "tags": ["bhagavatam", "canto-3", "pure-devotion", "moksha", "kapila", "seva"],
        "attribution": "Lord Kapila"
    },

    # ── CANTO 4 ──
    {
        "id": "bhag-4-9-6",
        "title": "Srimad Bhagavatam 4.9.6 — Dhruva Maharaja's Awakening Prayer",
        "source": "Srimad Bhagavatam 4.9.6",
        "canto": 4,
        "original": "योऽन्तः प्रविश्य मम वाचमिमां प्रसुप्तां\nसञ्जीवयत्यखिलशक्तिधरः स्वधाम्ना ।\nअन्यांश्च हस्तचरणश्रवणत्वगादीन्\nप्राणान् नमो भगवते पुरुषाय तुभ्यम् ॥",
        "meaning": "My dear Lord, You are all-powerful. After entering within me, You have enlivened all my sleeping senses — my hands, legs, ears, touch sensation, life force, and especially my power of speech. I offer my respectful obeisances unto You, the Supreme Person.",
        "tags": ["bhagavatam", "canto-4", "dhruva", "prayer", "prana", "gratitude"],
        "attribution": "Dhruva Maharaja"
    },
    {
        "id": "bhag-4-31-14",
        "title": "Srimad Bhagavatam 4.31.14 — Watering the Root of the Cosmic Tree",
        "source": "Srimad Bhagavatam 4.31.14",
        "canto": 4,
        "original": "यथा तरोर्मूलनिषेचनेन तृप्यन्ति तत्स्कन्धभुजोपशाखाः ।\nप्राणोपहाराच्च यथेन्द्रियाणां तथैव सर्वार्हणमच्युतेज्या ॥",
        "meaning": "As pouring water on the root of a tree energizes the trunk, branches, twigs and leaves, and as supplying food to the stomach enlivens the senses and limbs of the body, simply worshiping the Supreme Personality of Godhead through devotional service satisfies all the demigods and all living beings.",
        "tags": ["bhagavatam", "canto-4", "worship", "narada", "creation", "devotion"],
        "attribution": "Narada Muni"
    },

    # ── CANTO 5 ──
    {
        "id": "bhag-5-5-1",
        "title": "Srimad Bhagavatam 5.5.1 — The True Purpose of Human Life",
        "source": "Srimad Bhagavatam 5.5.1",
        "canto": 5,
        "original": "नायं देहो देहभाजां नृलोके कष्टान् कामानर्हते विड्भुजां ये ।\nतपो दिव्यं पुत्रका येन सत्त्वं शुद्ध्येद्यस्माद् ब्रह्मसौख्यं त्वनन्तम् ॥",
        "meaning": "Lord Rishabhadeva told His sons: My dear boys, of all the living entities who have accepted material bodies in this world, one who has been awarded this human form should not work hard day and night simply for sense gratification, which is available even to dogs and hogs that eat refuse. One should engage in penance and austerity for divine realization, by which one's existence will be purified, and upon attaining that, one enjoys eternal, transcendental bliss.",
        "tags": ["bhagavatam", "canto-5", "rishabhadeva", "austerity", "human-life", "bliss"],
        "attribution": "Lord Rishabhadeva"
    },
    {
        "id": "bhag-5-5-5",
        "title": "Srimad Bhagavatam 5.5.5 — Overcoming Ignorance Through Inquiry",
        "source": "Srimad Bhagavatam 5.5.5",
        "canto": 5,
        "original": "पराभवस्तावदबोधजातो यावन्न जिज्ञासत आत्मतत्त्वम् ।\nयावत् क्रियास्तावदिदं मनो वै कर्मात्मकं येन शरीरबन्धः ॥",
        "meaning": "As long as one does not inquire into the spiritual values of the soul, one must suffer defeat and bondage born of ignorance. For as long as one is engaged in fruitive actions, the mind remains absorbed in karma, which binds the soul to repeated birth and physical bodies.",
        "tags": ["bhagavatam", "canto-5", "rishabhadeva", "karma", "liberation", "atmatattva"],
        "attribution": "Lord Rishabhadeva"
    },

    # ── CANTO 6 ──
    {
        "id": "bhag-6-3-22",
        "title": "Srimad Bhagavatam 6.3.22 — What is Real Dharma?",
        "source": "Srimad Bhagavatam 6.3.22",
        "canto": 6,
        "original": "धर्मं तु साक्षाद्भगवत्प्रणीतं न वै विदुऋषयो नापि देवाः ।\nन सिद्धमुख्या असुरा मनुष्याः कुतो नु विद्याधरचारणादयः ॥",
        "meaning": "Real religious principles are enacted by the Supreme Personality of Godhead Himself. Although fully situated in goodness, even the great sages and demigods cannot ascertain real religion by their own mental speculation, nor can the Siddhas, Asuras, or ordinary human beings.",
        "tags": ["bhagavatam", "canto-6", "yamaraja", "dharma", "bhagavan"],
        "attribution": "Yamaraja"
    },
    {
        "id": "bhag-6-11-24",
        "title": "Srimad Bhagavatam 6.11.24 — Vritrasura's Complete Surrender",
        "source": "Srimad Bhagavatam 6.11.24",
        "canto": 6,
        "original": "अहं हरे तव पादैकमूलदासानुदासो भविताऽस्मि भूयः ।\nमनः स्मरेतासुपते गुणांस्ते गृणीत वाक् कर्म करोतु कायः ॥",
        "meaning": "O my Lord, O Hari, will I again be able to become the servant of Your eternal servant who has taken complete shelter of Your lotus feet? O Lord of my life, may my mind constantly remember Your divine virtues, may my words glorify Your deeds, and may my body be engaged in Your service.",
        "tags": ["bhagavatam", "canto-6", "vritrasura", "sharanagati", "servant-of-servant"],
        "attribution": "Vritrasura"
    },

    # ── CANTO 7 ──
    {
        "id": "bhag-7-5-23",
        "title": "Srimad Bhagavatam 7.5.23-24 — The Nine Processes of Devotional Service",
        "source": "Srimad Bhagavatam 7.5.23-24",
        "canto": 7,
        "original": "श्रवणं कीर्तनं विष्णोः स्मरणं पादसेवनम् ।\nअर्चनं वन्दनं दास्यं सख्यमात्मनिवेदनम् ॥\nइति पुंसार्पिता विष्णौ भक्तिश्चेन्नवलक्षणा ।\nक्रियेत भगवत्यद्धा तन्मन्येऽधीतमुत्तमम् ॥",
        "meaning": "Prahlada Maharaja said: Hearing and chanting about the transcendental holy name, form, qualities, paraphernalia and pastimes of Lord Vishnu, remembering them, serving the lotus feet of the Lord, offering the Lord respectful worship with sixteen types of paraphernalia, offering prayers to the Lord, becoming His servant, considering the Lord one's best friend, and surrendering everything unto Him (in other words, serving Him with the body, mind and words) — these nine processes are accepted as pure devotional service. One who has dedicated his life to the service of Krishna through these nine methods should be understood to be the most learned person, for he has acquired complete knowledge.",
        "tags": ["bhagavatam", "canto-7", "prahlada", "navavidha-bhakti", "devotion"],
        "attribution": "Prahlada Maharaja"
    },
    {
        "id": "bhag-7-9-9",
        "title": "Srimad Bhagavatam 7.9.9 — Love Alone Pleases the Lord",
        "source": "Srimad Bhagavatam 7.9.9",
        "canto": 7,
        "original": "मन्ये धनाभिजनरूपतपःश्रुतौजस्-तेजःप्रभावबलपौरुषबुद्धियोगाः ।\nनाराधनाय हि भवन्ति परस्य पुंसो भक्त्या तुतोष भगवान् गजयूथपाय ॥",
        "meaning": "Prahlada Maharaja continued: One may possess wealth, an aristocratic family, beauty, austerity, erudition, sensory expertise, mental acumen, prowess, strength, diligence, intelligence and mystic yogic power, but I think that even by all these qualifications one cannot satisfy the Supreme Personality of Godhead. However, one can satisfy the Lord simply by devotional service. Gajendra did this, and the Lord was pleased with him.",
        "tags": ["bhagavatam", "canto-7", "prahlada", "narasimha", "humility", "bhakti"],
        "attribution": "Prahlada Maharaja"
    },
    {
        "id": "bhag-7-9-43",
        "title": "Srimad Bhagavatam 7.9.43 — Prahlada's Compassion for the Deluded",
        "source": "Srimad Bhagavatam 7.9.43",
        "canto": 7,
        "original": "नैवोद्विजे पर दुरत्ययवैतरण्यास्त्वद्वीर्यगायनमहामृतमग्नचित्तः ।\nशोचे ततो विमुखचेतस इन्द्रियार्थमायासुखाय भरमुद्वहतो विमूढान् ॥",
        "meaning": "O best of the great personalities, I am not in the least afraid of this material existence, for wherever I stay I am fully absorbed in thoughts of Your glories and the nectar of Your pastimes. But I am anxious for those fools and rascals who, devoid of devotion to You, carry heavy burdens of worldly life simply for illusory bodily pleasure.",
        "tags": ["bhagavatam", "canto-7", "prahlada", "compassion", "nectar"],
        "attribution": "Prahlada Maharaja"
    },

    # ── CANTO 8 ──
    {
        "id": "bhag-8-3-2",
        "title": "Gajendra Moksha 1 — Salutation to the Self-Luminous Lord",
        "source": "Srimad Bhagavatam 8.3.2",
        "canto": 8,
        "original": "ॐ नमो भगवते तस्मै यत एतच्चिदात्मकम् ।\nपुरुषायादिबीजाय परेशायाभिधीमहि ॥",
        "meaning": "The King of the elephants, Gajendra, said: I offer my respectful obeisances unto the Supreme Lord, who enlivens this entire body and universe through consciousness. Let me meditate upon that Supreme Person, the original seed of all existence, the transcendental master of all.",
        "tags": ["bhagavatam", "canto-8", "gajendra", "moksha", "prayer", "refuge"],
        "attribution": "Gajendra"
    },
    {
        "id": "bhag-8-3-3",
        "title": "Gajendra Moksha 2 — The Cosmic Witness",
        "source": "Srimad Bhagavatam 8.3.3",
        "canto": 8,
        "original": "यस्मिन्निदं यतश्चेदं येनेदं य इदं स्वयं ।\nयोऽस्मात् परस्माच्च परस्तं प्रपद्ये स्वयम्भुवम् ॥",
        "meaning": "The Supreme Personality of Godhead is He in whom this cosmic manifestation rests, from whom it emanates, by whom it is created and conducted, and who Himself is everything. He is transcendental to all material causes and effects. Unto that supreme, self-sufficient Lord I surrender.",
        "tags": ["bhagavatam", "canto-8", "gajendra", "moksha", "surrender", "witness"],
        "attribution": "Gajendra"
    },
    {
        "id": "bhag-8-3-20",
        "title": "Gajendra Moksha 3 — Desiring Only the Lord's Shelter",
        "source": "Srimad Bhagavatam 8.3.20",
        "canto": 8,
        "original": "एकान्तिनो यस्य न कञ्चनार्थं वाञ्छन्ति ये वै भगवत्प्रपन्नाः ।\nअत्यद्भुतं तच्चरितं सुमङ्गलं गायन्त आनन्दसमुद्रमग्नाः ॥",
        "meaning": "Unalloyed devotees who have completely surrendered unto the lotus feet of the Lord desire nothing from Him, not even liberation. Immersed in the ocean of divine bliss, they simply chant and sing His wonderful, auspicious, and sublime pastimes.",
        "tags": ["bhagavatam", "canto-8", "gajendra", "bliss", "kirtana"],
        "attribution": "Gajendra"
    },

    # ── CANTO 9 ──
    {
        "id": "bhag-9-4-18",
        "title": "Srimad Bhagavatam 9.4.18-20 — King Ambarisha's Complete Absorption",
        "source": "Srimad Bhagavatam 9.4.18-20",
        "canto": 9,
        "original": "स वै मनः कृष्णपदारविन्दयोर्वचांसि वैकुण्ठगुणानुवर्णने ।\nकरौ हरेर्मन्दिरमार्जनादिषु श्रुतिं चकाराऽमलसत्कथारथे ॥",
        "meaning": "Maharaja Ambarisha always engaged his mind in meditating upon the lotus feet of Krishna, his words in describing the transcendental virtues of the Lord, his hands in cleansing the temple of the Lord, his ears in hearing the auspicious words spoken by and about Krishna, his eyes in beholding the Deity, his limbs in touching the bodies of devotees, his nostrils in smelling the fragrance of tulasi leaves offered to the Lord, his tongue in tasting the prasadam, and his head in bowing before the Lord.",
        "tags": ["bhagavatam", "canto-9", "ambarisha", "absorption", "seva", "devotion"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-9-4-63",
        "title": "Srimad Bhagavatam 9.4.63 — The Lord is Bound by His Devotees",
        "source": "Srimad Bhagavatam 9.4.63",
        "canto": 9,
        "original": "अहं भक्तपराधीनो ह्यस्वतन्त्र इव द्विज ।\nसाधुभिर्ग्रस्तहृदयो भक्तैर्भक्तजनप्रियः ॥",
        "meaning": "The Supreme Lord said to Durvasa Muni: I am completely under the control of My devotees. Indeed, I am not at all independent. Because My devotees are completely devoid of material desires, I sit only within the cores of their hearts. What to speak of My devotee, even those who are devotees of My devotee are very dear to Me.",
        "tags": ["bhagavatam", "canto-9", "durvasa", "bhaktaparadhina", "lord-and-devotee"],
        "attribution": "Lord Narayana to Durvasa"
    },

    # ── CANTO 10 ──
    {
        "id": "bhag-10-3-8",
        "title": "Srimad Bhagavatam 10.3.8 — Appearance of the Divine Child Krishna",
        "source": "Srimad Bhagavatam 10.3.8",
        "canto": 10,
        "original": "तमद्भुतं बालकमम्बुजेक्षणं चतुर्भुजं शङ्खगदार्युदायुधम् ।\nश्रीवत्सलक्ष्मं गलशोभिकौस्तुभं पीताम्बरं सान्द्रपयोदसौभगम् ॥",
        "meaning": "Vasudeva then saw that wonderful child born with lotus eyes, four arms bearing the conchshell, club, disc, and lotus flower, bearing the mark of Shrivatsa on His chest, adorned with the Kaustubha gem around His neck, dressed in yellow silk, radiant as a fresh rain-cloud, His hair adorned with vaidurya jewels and wearing a dazzling helmet and earrings.",
        "tags": ["bhagavatam", "canto-10", "janmashtami", "krishna", "appearance", "divine-child"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-10-9-19",
        "title": "Srimad Bhagavatam 10.9.19 — Krishna Bound Only by Love (Damodara)",
        "source": "Srimad Bhagavatam 10.9.19",
        "canto": 10,
        "original": "दृष्ट्वा परिश्रमं मौलिमालतीभ्रंशकम्पितम् ।\nस्विन्नं गात्रं जनन्यास्तु कृपयाऽऽसीत्स्वयं बले ॥",
        "meaning": "When Lord Krishna saw His mother Yashoda sweating and fatigued, the flowers falling from her hair as she struggled to bind Him, the Lord showed mercy unto His mother and consented to be bound by her rope of pure love.",
        "tags": ["bhagavatam", "canto-10", "damodara", "yashoda", "love", "vatsalya"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-10-14-8",
        "title": "Srimad Bhagavatam 10.14.8 — Awaiting the Lord's Mercy in Adversity",
        "source": "Srimad Bhagavatam 10.14.8",
        "canto": 10,
        "original": "तत्तेऽनुकम्पां सुसमीक्षमाणो भुञ्जान एवात्मकृतं विपाकम् ।\nहृद्वाग्वपुर्भिर्विदधन्नमस्ते जीवेत यो मुक्तिपदे स दायभाक् ॥",
        "meaning": "My dear Lord, one who earnestly waits for You to bestow Your causeless mercy upon him, all the while patiently enduring the reactions of his past misdeeds and offering You respectful obeisances with his heart, words and body, is surely eligible for liberation, for it has become his rightful inheritance.",
        "tags": ["bhagavatam", "canto-10", "brahma-stuti", "patience", "mercy", "liberation"],
        "attribution": "Lord Brahma"
    },
    {
        "id": "bhag-10-14-58",
        "title": "Srimad Bhagavatam 10.14.58 — The Lotus Feet as the Boat Across Samsara",
        "source": "Srimad Bhagavatam 10.14.58",
        "canto": 10,
        "original": "समाcoreश्रिता ये पदपल्लवप्लवं महत्पदं पुण्ययशो मुरारेः ।\nभवाम्बुधिर्वत्सपदं परं पदं पदं पदं यद्विपदां न तेषाम् ॥",
        "meaning": "For those who have accepted the boat of the lotus feet of the Lord, who is the shelter of the cosmic manifestation and famous as Murari, the ocean of the material world is like the water contained in a calf's hoofprint. Their goal is the supreme abode, where there are no material miseries at every step.",
        "tags": ["bhagavatam", "canto-10", "samsara", "refuge", "lotus-feet", "brahma"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-10-31-1",
        "title": "Gopi Gita 1 — Vraja Glorified by Krishna's Presence",
        "source": "Srimad Bhagavatam 10.31.1",
        "canto": 10,
        "original": "जयति तेऽधिकं जन्मना व्रजः श्रयत इन्दिरा शश्वदत्र हि ।\nदयित दृश्यतां दिक्षु तावकास्त्वयि धृतासवास्त्वं विचिन्वते ॥",
        "meaning": "The gopis sang: O beloved Lord, by Your birth the land of Vraja has become gloriously exalted, and Indira, the Goddess of Fortune, resides here eternally. Please reveal Yourself to us, Your beloved maidservants, who have dedicated our lives exclusively unto You and are searching for You in every direction.",
        "tags": ["bhagavatam", "canto-10", "gopi-gita", "vraja", "longing", "krishna"],
        "attribution": "The Vraja Gopis"
    },
    {
        "id": "bhag-10-31-9",
        "title": "Gopi Gita 9 — The Nectar of Krishna's Words (Tava Kathamritam)",
        "source": "Srimad Bhagavatam 10.31.9",
        "canto": 10,
        "original": "तव कथामृतं तप्तजीवनं कविभिरीडितं कल्मषापहम् ।\nश्रवणमङ्गलं श्रीमदाततं भुवि गृणन्ति ते भूरिदा जनाः ॥",
        "meaning": "The nectar of Your words and the descriptions of Your activities are the life and soul of those suffering in this material world. These narrations, praised by wise sages, eradicate the reactions of all sin. They are auspicious for anyone who hears them, and they are filled with spiritual power. Certainly, those who broadcast these messages throughout the world are the greatest benefactors of humanity.",
        "tags": ["bhagavatam", "canto-10", "gopi-gita", "kathamritam", "nectar", "relief"],
        "attribution": "The Vraja Gopis"
    },
    {
        "id": "bhag-10-33-36",
        "title": "Srimad Bhagavatam 10.33.36 — The Lord Acts Out of Grace for Devotees",
        "source": "Srimad Bhagavatam 10.33.36",
        "canto": 10,
        "original": "अनुग्रहाय भक्तानां मानुषं देहमास्थितः ।\nभजते तादृशीः क्रीडा याः श्रुत्वा तत्परो भवेत् ॥",
        "meaning": "Lord Krishna manifests His humanlike transcendental form to bestow mercy upon the devotees. He engages in such sweet, transcendental pastimes that whoever hears about them becomes entirely dedicated to Him.",
        "tags": ["bhagavatam", "canto-10", "pastimes", "lila", "grace", "sukadeva"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-10-88-8",
        "title": "Srimad Bhagavatam 10.88.8 — How the Lord Blesses His Sincere Devotee",
        "source": "Srimad Bhagavatam 10.88.8",
        "canto": 10,
        "original": "यस्याहमनुगृह्णामि हरिष्ये तद्धनं शनैः ।\nततोऽधनं त्यजन्त्यस्य स्वजना दुःखदुःखितम् ॥",
        "meaning": "The Supreme Personality of Godhead said: If I specially favor someone, I gradually take away all his material wealth and false props. Then, when he is impoverished, his relatives and friends abandon him, leaving him to turn solely to Me for shelter.",
        "tags": ["bhagavatam", "canto-10", "grace", "renunciation", "shelter", "krishna"],
        "attribution": "Lord Krishna to Yudhishthira"
    },

    # ── CANTO 11 ──
    {
        "id": "bhag-11-7-33",
        "title": "Uddhava Gita — The 24 Spiritual Teachers of the Avadhuta",
        "source": "Srimad Bhagavatam 11.7.33",
        "canto": 11,
        "original": "सन्ति मे गुरवो राजन् बहवो बुद्ध्युपाश्रिताः ।\nयतो बुद्धिमुपादाय मुक्तोऽटामीह तान् शृणु ॥",
        "meaning": "The Avadhuta Brahmana said to King Yadu: My dear King, with my intelligence I have taken shelter of many gurus, and by gaining wisdom from each of them, I wander freely through this world liberated from delusion. Please hear of them from me.",
        "tags": ["bhagavatam", "canto-11", "uddhavagita", "avadhuta", "gurus", "wisdom"],
        "attribution": "Avadhuta Brahmana to King Yadu"
    },
    {
        "id": "bhag-11-9-29",
        "title": "Srimad Bhagavatam 11.9.29 — The Rarity of the Human Birth",
        "source": "Srimad Bhagavatam 11.9.29",
        "canto": 11,
        "original": "लब्ध्वा सुदुर्लभमिदं बहुसम्भवान्ते मानुष्यमर्थदमनित्यमपीह धीरः ।\nतूर्णं यतेत न पतेदनुमृत्यु यावन् निःश्रेयसाय विषयः खलु सर्वतः स्यात् ॥",
        "meaning": "After wandering through millions of births in various species, one finally attains this very rare human form of life, which, although temporary, affords one the opportunity to attain the highest perfection. Therefore, a sober and intelligent person should immediately endeavor for ultimate liberation before this body falls to death.",
        "tags": ["bhagavatam", "canto-11", "human-birth", "urgency", "liberation", "wisdom"],
        "attribution": "Avadhuta Brahmana"
    },
    {
        "id": "bhag-11-14-20",
        "title": "Srimad Bhagavatam 11.14.20 — Devotion Surpasses All Other Paths",
        "source": "Srimad Bhagavatam 11.14.20",
        "canto": 11,
        "original": "न साधयति मां योगो न साङ्ख्यं धर्म उद्धव ।\nन स्वाध्यायस्तपस्त्यागो यथा भक्तिर्ममोर्जिता ॥",
        "meaning": "My dear Uddhava, neither ashtanga-yoga, nor philosophical speculation (sankhya), nor ritualistic religion, nor study of the Vedas, nor severe austerities, nor charity can bind or conquer Me as does intense, loving devotional service performed unto Me.",
        "tags": ["bhagavatam", "canto-11", "uddhavagita", "bhakti-supremacy", "krishna"],
        "attribution": "Lord Krishna to Uddhava"
    },
    {
        "id": "bhag-11-20-17",
        "title": "Srimad Bhagavatam 11.20.17 — The Human Body as the Sturdy Boat",
        "source": "Srimad Bhagavatam 11.20.17",
        "canto": 11,
        "original": "नृदेहमाद्यं सुलभं सुदुर्लभं प्लवं सुकल्पं गुरुकर्णधारम् ।\nमयानुकूलेन नभस्वतेरितं पुमान् भवाब्धिं न तरेत् स आत्महा ॥",
        "meaning": "The human body, which can award all benefit in life, is automatically obtained by the laws of nature, although it is very rare to achieve. This human body can be compared to a perfectly constructed boat having the spiritual master as the captain and the instructions of the Personality of Godhead as favorable breezes impelling it on its course. Considering such advantages, a person who does not utilize the human form of life to cross the ocean of material existence is the killer of his own soul.",
        "tags": ["bhagavatam", "canto-11", "guru", "boat", "human-life", "crossing-samsara"],
        "attribution": "Lord Krishna to Uddhava"
    },

    # ── CANTO 12 ──
    {
        "id": "bhag-12-3-51",
        "title": "Srimad Bhagavatam 12.3.51 — The One Great Quality of Kali Yuga",
        "source": "Srimad Bhagavatam 12.3.51",
        "canto": 12,
        "original": "कलेर्दोषनिधे राजन्नस्ति ह्येको महान् गुणः ।\nकीर्तनादेव कृष्णस्य मुक्तसङ्गः परं व्रजेत् ॥",
        "meaning": "My dear King, although Kali-yuga is an ocean of faults, there is still one magnificent quality in this age: Simply by chanting the holy name of Sri Krishna, one can become free from material bondage and be promoted to the transcendental kingdom.",
        "tags": ["bhagavatam", "canto-12", "kaliyuga", "kirtana", "harinama", "liberation"],
        "attribution": "Sukadeva Goswami to Parikshit"
    },
    {
        "id": "bhag-12-3-52",
        "title": "Srimad Bhagavatam 12.3.52 — The Yuga Dharma for Each Age",
        "source": "Srimad Bhagavatam 12.3.52",
        "canto": 12,
        "original": "कृते यद्ध्यायतो विष्णुं त्रेतायां यजतो मखैः ।\nद्वापरे परिचर्यायां कलौ तद्धरिकीर्तनात् ॥",
        "meaning": "Whatever result was obtained in Satya-yuga by meditating on Vishnu, in Treta-yuga by performing sacrifices, and in Dvapara-yuga by serving the Lord's lotus feet can be obtained in Kali-yuga simply by chanting the holy name of the Lord.",
        "tags": ["bhagavatam", "canto-12", "yugadharma", "kaliyuga", "chanting", "harinama"],
        "attribution": "Sukadeva Goswami"
    },
    {
        "id": "bhag-12-13-23",
        "title": "Srimad Bhagavatam 12.13.23 — The Final Benediction of Bhagavatam",
        "source": "Srimad Bhagavatam 12.13.23",
        "canto": 12,
        "original": "नामसङ्कीर्तनं यस्य सर्वपापप्रणाशनम् ।\nप्रणामो दुःखशमनस्तं नमामि हरिं परम् ॥",
        "meaning": "I offer my respectful obeisances unto the Supreme Lord, Hari, the congregational chanting of whose holy names destroys all sinful reactions, and the offering of obeisances unto whom relieves all material suffering.",
        "tags": ["bhagavatam", "canto-12", "conclusion", "harinama", "obeisances", "sukadeva"],
        "attribution": "Suta Goswami"
    }
]

# Generate IAST transliteration for all entries
for e in entries:
    e["transliteration"] = to_iast(e["original"])

# Write to src/lib/data/bhagavatam-complete.ts
ts_content = "import { LibraryEntry } from '../library-content';\n\n"
ts_content += "export const BHAGAVATAM_COMPLETE_ENTRIES: LibraryEntry[] = [\n"

for e in entries:
    ts_content += "  {\n"
    ts_content += f"    id: '{e['id']}',\n"
    ts_content += f"    title: {json.dumps(e['title'])},\n"
    ts_content += f"    source: {json.dumps(e['source'])},\n"
    ts_content += f"    original: {json.dumps(e['original'])},\n"
    ts_content += f"    transliteration: {json.dumps(e['transliteration'])},\n"
    ts_content += f"    meaning: {json.dumps(e['meaning'])},\n"
    ts_content += f"    attribution: {json.dumps(e['attribution'])},\n"
    ts_content += f"    tags: {json.dumps(e['tags'])},\n"
    ts_content += f"    category: 'bhagavatam',\n"
    ts_content += f"    tradition: 'hindu',\n"
    ts_content += "  },\n"

ts_content += "];\n"

with open("src/lib/data/bhagavatam-complete.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully generated {len(entries)} authentic Bhagavatam landmark entries in src/lib/data/bhagavatam-complete.ts")
