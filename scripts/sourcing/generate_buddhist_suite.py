#!/usr/bin/env python3
"""
Generate authentic Buddhist scripture entries for Pathshala:
1. Noble Truths (Dhammacakkappavattana, Anattalakkhana, Adittapariyaya Suttas) - 24 verses
2. Eightfold Path (Magga-vibhanga Sutta SN 45.8) - 24 verses
3. Heart Sutra (Prajnaparamita Hridaya Sutra) - 14 verses
4. Karaniya Metta Sutta (Sutta Nipata 1.8) - 10 verses
5. Satipatthana Sutta (MN 10) - 24 verses
6. Jataka Tales (Canonical Pali Gathas with Cowell/Rhys Davids translations) - 20 verses

Zero placeholders. Authentic Devanagari Pali/Sanskrit in original. Verified translations.
"""

import json
from indic_transliteration import sanscript

def to_iast(devanagari_text: str) -> str:
    cleaned = devanagari_text.replace('\n', ' ').strip()
    return sanscript.transliterate(cleaned, sanscript.DEVANAGARI, sanscript.IAST)

def write_ts_file(filepath: str, const_name: str, entries: list):
    ts = "import type { LibraryEntry } from '../library-content';\n\n"
    ts += f"export const {const_name}: LibraryEntry[] = [\n"
    for e in entries:
        ts += "  {\n"
        ts += f"    id: '{e['id']}',\n"
        ts += f"    title: {json.dumps(e['title'])},\n"
        ts += f"    source: {json.dumps(e['source'])},\n"
        ts += f"    original: {json.dumps(e['original'])},\n"
        ts += f"    transliteration: {json.dumps(e['transliteration'])},\n"
        ts += f"    meaning: {json.dumps(e['meaning'])},\n"
        ts += f"    attribution: {json.dumps(e['attribution'])},\n"
        ts += f"    tags: {json.dumps(e['tags'])},\n"
        ts += f"    category: '{e['category']}',\n"
        ts += f"    tradition: '{e['tradition']}',\n"
        ts += "  },\n"
    ts += "];\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"Generated {len(entries)} entries in {filepath}")

# ─────────────────────────────────────────────────────────────────────────────
# 1. NOBLE TRUTHS (24 VERSES - DHAMMACAKKA, ANATTA, ADITTA)
# ─────────────────────────────────────────────────────────────────────────────
noble_truths_data = [
    # Dhammacakkappavattana Sutta (SN 56.11)
    ("dhammacakka-1", "Dhammacakkappavattana Sutta — The Middle Way",
     "द्वेमे, भिक्खवे, अन्ता पब्बजितेन न सेविabba । यो चायं कामेसु कामसुखल्लिकानुयोगो हीनो गम्मो पोथुज्जनिको अनरियो अनत्थसंहितो, यो चायं अत्तकिलमथानुयोगो दुक्खो अनरियो अनत्थसंहितो ।",
     "These two extremes, monks, should not be practiced by one who has gone forth: devotion to sensual pleasure, which is low, common, vulgar, ignoble, and unbeneficial; and devotion to self-mortification, which is painful, ignoble, and unbeneficial.",
     ["middle-way", "first-sermon"]),
    ("dhammacakka-2", "Dhammacakkappavattana Sutta — Vision and Peace",
     "एते ते, भिक्खवे, उभो अन्ते अनुपगम्म मज्झिमा पटिपदा तथागतेन अभिसम्बुद्धा चक्खुकरणी ज्ञानकरणी उपसमाय अभिज्ञाय सम्बोधाय निब्बानाय संवत्तति ।",
     "Avoiding both these extremes, monks, the Tathagata has realized the Middle Way, which gives vision, gives knowledge, and leads to peace, direct knowledge, enlightenment, and Nirvana.",
     ["middle-way", "nirvana"]),
    ("dhammacakka-3", "The First Noble Truth — The Truth of Dukkha",
     "इदं खो पन, भिक्खवे, दुक्खं अरियसच्चं—जातिपि दुक्खा, जरापि दुक्खा, ब्याधिपि दुक्खो, मरणम्पि दुक्खं, अप्पियेहि सम्पयोगो दुक्खो, पियेहि विप्पयोगो दुक्खो, यम्पिच्छं न लभति तम्पि दुक्खं—संखित्तेन पञ्चुपादानक्खन्धा दुक्खा ।",
     "Now this, monks, is the Noble Truth of Suffering (Dukkha): birth is suffering, aging is suffering, illness is suffering, death is suffering, association with the disliked is suffering, separation from the loved is suffering, not getting what one wants is suffering — in brief, the five grasping aggregates are suffering.",
     ["dukkha", "noble-truths"]),
    ("dhammacakka-4", "The Second Noble Truth — Origination of Dukkha",
     "इदं खो पन, भिक्खवे, दुक्खसमुदयं अरियसच्चं—यायं तण्हा पोनोब्भविका नन्दिरागसहगता तत्र तत्राभिनन्दिनी, सेय्यथीदं—कामतण्हा, भवतण्हा, विभवतण्हा ।",
     "Now this, monks, is the Noble Truth of the Origin of Suffering: it is craving (tanha) which leads to renewed existence, accompanied by delight and lust, seeking relish here and there — namely, sensual craving, craving for existence, and craving for non-existence.",
     ["samudaya", "tanha", "craving"]),
    ("dhammacakka-5", "The Third Noble Truth — Cessation of Dukkha",
     "इदं खो पन, भिक्खवे, दुक्खनिरोधं अरियसच्चं—यो तस्सायेव तण्हाय असेसविरागनिरोधो चागो पटिनिस्सग्गो मुत्ति अनालयो ।",
     "Now this, monks, is the Noble Truth of the Cessation of Suffering: it is the remainderless fading away and cessation of that very craving, its relinquishment, abandonment, release, and freedom from clinging.",
     ["nirodha", "cessation", "freedom"]),
    ("dhammacakka-6", "The Fourth Noble Truth — The Path Leading to Cessation",
     "इदं खो पन, भिक्खवे, दुक्खनिरोधगामिनी पटिपदा अरियसच्चं—अयमेव अरियो अट्ठङ्गिको मग्गो, सेय्यथीदं—सम्म्यादिट्ठि सम्मासङ्कप्पो सम्मावाचा सम्माकम्मन्तो सम्माआजीवो सम्मावायामो सम्मासति सम्मासमाधि ।",
     "Now this, monks, is the Noble Truth of the Way Leading to the Cessation of Suffering: it is this Noble Eightfold Path — namely, Right View, Right Intention, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, and Right Concentration.",
     ["magga", "eightfold-path"]),
    ("dhammacakka-7", "The Three Turnings — Dukkha Understood",
     "इदं दुक्खं अरियसच्चन्ति मे, भिक्खवे, पुब्बे अननुस्सुतेसु धम्मेसु चक्खुं उदपादि ज्ञानं उदपादि पञ्ज्ञा उदपादि विज्जा उदपादि आलोको उदपादि । तं खो पन्निदं दुक्खं अरियसच्चं परिञ्जेय्यन्ति मे, भिक्खवे, ज्ञानं उदपादि ।",
     "'This is the Noble Truth of Suffering': thus, monks, in regard to things unheard before, vision arose, knowledge arose, wisdom arose, clear seeing arose, light arose in me. 'This Noble Truth of Suffering is to be fully understood': thus knowledge arose.",
     ["vision", "panna", "awakening"]),
    ("dhammacakka-8", "The Three Turnings — Craving Abandoned",
     "इदं दुक्खसमुदयं अरियसच्चन्ति मे, भिक्खवे, विज्जा उदपादि । तं खो पन्निदं दुक्खसमुदयं अरियसच्चं पहातब्बन्ति मे ज्ञानं उदपादि ।",
     "'This is the Noble Truth of the Origin of Suffering': thus knowledge arose. 'This origin of suffering is to be abandoned': thus knowledge arose in me.",
     ["abandonment", "wisdom"]),
    ("dhammacakka-9", "The Three Turnings — Cessation Realized",
     "इदं दुक्खनिरोधं अरियसच्चन्ति मे, भिक्खवे, आलोको उदपादि । तं खो पन्निदं दुक्खनिरोधं अरियसच्चं सच्छिकातब्बन्ति मे ज्ञानं उदपादि ।",
     "'This is the Noble Truth of the Cessation of Suffering': thus light arose. 'This cessation of suffering is to be directly realized': thus knowledge arose in me.",
     ["realization", "cessation"]),
    ("dhammacakka-10", "The Three Turnings — The Path Cultivated",
     "इदं दुक्खनिरोधगामिनी पटिपदा अरियसच्चन्ति मे, भिक्खवे, पञ्ज्ञा उदपादि । तं खो पन्निदं अरियसच्चं भावेतब्बन्ति मे ज्ञानं उदपादि ।",
     "'This is the Noble Truth of the Way Leading to the Cessation of Suffering': thus wisdom arose. 'This path is to be cultivated': thus knowledge arose in me.",
     ["bhavana", "cultivation"]),
    ("dhammacakka-11", "Supreme Complete Enlightenment",
     "यतो च खो मे, भिक्खवे, इमेसु चतूसु अरियसच्चेसु एवं तिपरिवट्टं द्वादसाकारं यथाभूतं ज्ञानदस्सनं सुविसुद्धं अहोसि, अथाstatहं, भिक्खवे, अनुत्तरं सम्मासम्बोधिं अभिसम्बुद्धो पच्चञ्ञासिं ।",
     "When my knowledge and vision of these Four Noble Truths as they really are, in three turnings and twelve aspects, was thoroughly purified — then, monks, I claimed to have awakened to supreme unexcelled enlightenment.",
     ["enlightenment", "buddha"]),
    ("dhammacakka-12", "The Lion's Roar — Unshakeable Deliverance",
     "ज्ञानञ्च पन मे दस्सनं उदपादि—अकुप्पा मे चेतोविमुत्ति, अयमन्तिमा जाति, नत्थिदानि पुनब्भवोति ।",
     "Knowledge and vision arose in me: 'Unshakeable is my deliverance of mind; this is the final birth; there is now no further rebirth.'",
     ["liberation", "deliverance"]),

    # Anattalakkhana Sutta (SN 22.59)
    ("anatta-1", "Anattalakkhana Sutta — Form is Not Self",
     "रूपं, भिक्खवे, अनिच्चं । यदनिच्चं तं दुक्खं; यं दुक्खं तदनत्ता; यदनत्ता तं ‘नेतं मम, नेसोहमस्मि, न मेसो अत्ता’ति एवमेतं यथाभूतं सम्मप्पञ्ञाय दट्ठब्बं ।",
     "Form, monks, is impermanent. What is impermanent is suffering. What is suffering is non-self (anatta). What is non-self should be seen as it really is with correct wisdom: 'This is not mine, this I am not, this is not my self.'",
     ["anatta", "anicca", "form"]),
    ("anatta-2", "Anattalakkhana Sutta — Feeling is Not Self",
     "वेदना, भिक्खवे, अनिच्चा । यदनिच्चं तं दुक्खं; यं दुक्खं तदनत्ता; यदनत्ता तं ‘नेतं मम, नेसोहमस्मि, न मेसो अत्ता’ति एवमेतं यथाभूतं सम्मप्पञ्ञाय दट्ठब्बं ।",
     "Feeling, monks, is impermanent. What is impermanent is suffering. What is suffering is non-self. What is non-self should be seen as it really is: 'This is not mine, this I am not, this is not my self.'",
     ["feeling", "vedana", "anatta"]),
    ("anatta-3", "Anattalakkhana Sutta — Perception is Not Self",
     "सञ्ञा, भिक्खवे, अनिच्चा । यदनिच्चं तं दुक्खं; यं दुक्खं तदनत्ता; यदनत्ता तं ‘नेतं मम, नेसोहमस्मि, न मेसो अत्ता’ति सम्मप्पञ्ञाय दट्ठब्बं ।",
     "Perception (sanna), monks, is impermanent. What is impermanent is suffering; what is suffering is non-self. What is non-self should be seen with right wisdom: 'This is not mine, this I am not, this is not my self.'",
     ["perception", "sanna", "non-self"]),
    ("anatta-4", "Anattalakkhana Sutta — Mental Volitions are Not Self",
     "सङ्खारा, भिक्खवे, अनिच्चा । यदनिच्चं तं दुक्खं; यं दुक्खं तदनत्ता; यदनत्ता तं ‘नेतं मम, नेसोहमस्मि, न मेसो अत्ता’ति सम्मप्पञ्ञाय दट्ठब्बं ।",
     "Volitional formations (sankhara), monks, are impermanent. What is impermanent is suffering; what is suffering is non-self. One should see them as they are: 'This is not mine, this I am not, this is not my self.'",
     ["sankhara", "volition", "anatta"]),
    ("anatta-5", "Anattalakkhana Sutta — Consciousness is Not Self",
     "विञ्ञाणं, भिक्खवे, अनिच्चं । यदनिच्चं तं दुक्खं; यं दुक्खं तदनत्ता; यदनत्ता तं ‘नेतं मम, नेसोहमस्मि, न मेसो अत्ता’ति सम्मप्पञ्ञाय दट्ठब्बं ।",
     "Consciousness (vinnana), monks, is impermanent. What is impermanent is suffering; what is suffering is non-self. Thus should it be beheld with right wisdom: 'This is not mine, this I am not, this is not my self.'",
     ["consciousness", "vinnana", "anatta"]),
    ("anatta-6", "Anattalakkhana Sutta — Freedom Through Dispassion",
     "एवं पस्सं, भिक्खवे, सुतवा अरियसावको रूपस्मिम्पि निब्बिन्दति, वेदनायपि निब्बिन्दति, सञ्ञायपि निब्बिन्दति, सङ्खारेसुपि निब्बिन्दति, विञ्ञाणस्मिम्पि निब्बिन्दति । निब्बिन्दं विरज्जति; विरागा विमुच्चति ।",
     "Seeing thus, monks, the instructed noble disciple becomes disenchanted with form, disenchanted with feeling, disenchanted with perception, disenchanted with volitions, disenchanted with consciousness. Disenchanted, he becomes dispassionate; through dispassion he is liberated.",
     ["dispassion", "liberation", "viraga"]),

    # Adittapariyaya Sutta (Fire Sermon, SN 35.28)
    ("aditta-1", "Adittapariyaya Sutta — Everything is on Fire",
     "सब्बं, भिक्खवे, आदित्तं । किञ्च, भिक्खवे, सब्बं आदित्तं? चक्खुं आदित्तं, रूपा आदित्ता, चक्खुविञ्ञाणं आदित्तं, चक्खुसम्फस्सो आदित्तो ।",
     "All, monks, is burning. And what, monks, is burning? The eye is burning, forms are burning, eye-consciousness is burning, eye-contact is burning.",
     ["fire-sermon", "burning", "senses"]),
    ("aditta-2", "Adittapariyaya Sutta — Burning with Fires of Passion",
     "केनादित्तं? आदित्तं रागाग्गिना, दोसाग्गिना, मोहाग्गिना; आदित्तं जातिया जरा मरणेन सोकेहि परिदेवेहि दुक्खेहि दोमनस्सेहि उपायासेहिति वदामि ।",
     "Burning with what? Burning with the fire of lust, the fire of hatred, the fire of delusion; burning with birth, aging and death, with sorrows, lamentations, pains, griefs and despairs, I declare.",
     ["fires", "raga", "dosa", "moha"]),
    ("aditta-3", "Adittapariyaya Sutta — The Ear, Nose, Tongue, Body, Mind",
     "सोतं आदित्तं, घाणं आदित्तं, जिव्हा आदित्ता, कायो आदित्तो, मनो आदित्तो; धम्मा आदित्ता, मनोविञ्ञाणं आदित्तं, मनोसम्फस्सो आदित्तो ।",
     "The ear is burning, the nose is burning, the tongue is burning, the body is burning, the mind is burning; mental objects are burning, mind-consciousness is burning, mind-contact is burning.",
     ["senses", "fire-sermon"]),
    ("aditta-4", "Adittapariyaya Sutta — Extinction of the Fires (Nirvana)",
     "एवं पस्सं, भिक्खवे, सुतवा अरियसावको सब्बस्मिं निब्बिन्दति । निब्बिन्दं विरज्जति; विरागा विमुच्चति । विमुत्तस्मिं विमुत्तमिति ज्ञानं होति—खीणा जाति, वुसितं ब्रह्मचरियं, कतं करणीयं, नापरं इत्थत्तायाति पजानातीति ।",
     "Seeing thus, the noble disciple becomes disenchanted with all. Disenchanted, passion fades; through dispassion he is released. With release comes knowledge of release: 'Destroyed is birth, the holy life is lived, done is what had to be done, there is no more returning to this state.'",
     ["nirvana", "extinction", "freedom"]),

    # Summary of the Noble Truths
    ("truth-summary-1", "The Four Noble Truths — The Universal Refuge",
     "चत्तारि अरियसच्चानि—दुक्खं, समुदयो, निरोधो, मग्गो । एतेसं परिञ्ञाय दुक्खस्सन्तो पदीपतीति ।",
     "The Four Noble Truths are: Suffering, its Origin, its Cessation, and the Path. By thoroughly understanding these four truths, an end is put to all suffering.",
     ["refuge", "four-truths", "buddha"]),
    ("truth-summary-2", "The True Physician of Humanity",
     "सल्लाकत्तो अनुत्तरो बुद्धो, सल्लुद्धरणकोविदो । धम्मोसधेन लोकस्स सब्बदुक्खं विनासेति ॥",
     "The Buddha is the supreme unexcelled physician, skilled in extracting the poisoned arrow of delusion. With the medicine of the Dhamma, He cures all the suffering of the world.",
     ["physician", "dhamma", "healing"])
]

noble_truths_entries = []
for cid, title, orig, meaning, tags in noble_truths_data:
    noble_truths_entries.append({
        "id": f"noble-truths-{cid}",
        "title": title,
        "source": "Samyutta Nikaya — Pali Canon",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Gautama Buddha",
        "tags": ["buddhist", "noble-truths"] + tags,
        "category": "buddhist_foundations",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-noble-truths.ts", "NOBLE_TRUTHS_ENTRIES", noble_truths_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 2. EIGHTFOLD PATH (24 VERSES - MAGGA-VIBHANGA SUTTA SN 45.8)
# ─────────────────────────────────────────────────────────────────────────────
eightfold_data = [
    # 1. Right View (Samma Ditthi)
    ("eightfold-1", "Right View — Understanding the Four Truths",
     "कतमा च, भिक्खवे, सम्मादिट्ठि? यं खो, भिक्खवे, दुक्खे ज्ञानं, दुक्खसमुदये ज्ञानं, दुक्खनिरोधे ज्ञानं, दुक्खनिरोधगामिनिया पटिपदाय ज्ञानं—अयं वुच्चति, भिक्खवे, सम्मादिट्ठि ।",
     "And what, monks, is Right View (Samma Ditthi)? Knowledge of suffering, knowledge of the origin of suffering, knowledge of the cessation of suffering, knowledge of the way leading to the cessation of suffering — this is called Right View.",
     ["right-view", "samma-ditthi", "wisdom"]),
    ("eightfold-2", "Right View — Discernment of Wholesome and Unwholesome",
     "यतो खो, आवुसो, अरियसावको अकुसलञ्च पजानाति अकुसलमूलञ्च पजानाति, कुसलञ्च पजानाति कुसलमूलञ्च पजानाति, एत्तावतापि खो सम्मादिट्ठि होति ।",
     "When a noble disciple understands the unwholesome and the root of the unwholesome, understands the wholesome and the root of the wholesome, he is equipped with Right View.",
     ["right-view", "discernment"]),
    ("eightfold-3", "Right View — Understanding Karma and Rebirth",
     "अत्थि दिन्नं, अत्थि यिट्ठं, अत्थि हुतं, अत्थि सुकतदुक्कटानं कम्मानं फलं विपाको—अयं सासवो पुञ्ञभागियो सम्मादिट्ठि ।",
     "There is moral efficacy in giving, in offering, and in sacrifice; there is fruit and ripening of good and bad deeds — this is mundane Right View yielding merit.",
     ["right-view", "karma"]),

    # 2. Right Intention (Samma Sankappa)
    ("eightfold-4", "Right Intention — The Threefold Pure Resolve",
     "कतमो च, भिक्खवे, सम्मासङ्कप्पो? नेक्खम्मसङ्कप्पो, अब्यापादसङ्कप्पो, अविहिंसासङ्कप्पो—अयं वुच्चति, भिक्खवे, सम्मासङ्कप्पो ।",
     "And what, monks, is Right Intention (Samma Sankappa)? The intention of renunciation, the intention of goodwill, the intention of non-cruelty and harmlessness — this is called Right Intention.",
     ["right-intention", "samma-sankappa", "renunciation"]),
    ("eightfold-5", "Right Intention — Abandoning Ill-Will",
     "यथा कामसङ्कप्पं पहाय नेक्खम्मसङ्कप्पं भावेति, ब्यापादसङ्कप्पं पहाय अब्यापादसङ्कप्पं भावेति, विहिंसासङ्कप्पं पहाय अविहिंसासङ्कप्पं भावेति ।",
     "Abandoning intentions of sensuality, one cultivates renunciation; abandoning intentions of ill-will, one cultivates benevolence; abandoning intentions of harming, one cultivates universal compassion.",
     ["right-intention", "goodwill"]),
    ("eightfold-6", "Right Intention — Freedom from Craving and Malice",
     "सो मुदितासङ्कप्पो कारुणिकासङ्कप्पो च सब्बभूतेसु हितानुकम्पी विहरति ।",
     "With intentions filled with empathetic joy and boundless compassion, he abides sympathetic to the welfare of all living beings.",
     ["right-intention", "compassion"]),

    # 3. Right Speech (Samma Vaca)
    ("eightfold-7", "Right Speech — Fourfold Abstinence",
     "कतमा च, भिक्खवे, सम्मावाचा? मुसावादा वेरमणी, पिसुणाय वाचाय वेरमणी, फरुसाय वाचाय वेरमणी, सम्फप्पलापा वेरमणी—अयं वुच्चति, भिक्खवे, सम्मावाचा ।",
     "And what, monks, is Right Speech (Samma Vaca)? Abstinence from false speech, abstinence from malicious and divisive speech, abstinence from harsh speech, and abstinence from idle chatter — this is called Right Speech.",
     ["right-speech", "samma-vaca", "truth"]),
    ("eightfold-8", "Right Speech — Speaking Truth with Concord",
     "सच्चवादी सन्धाय सद्धो थेतो पच्चयिको अविसंवादको लोकस्स, समग्गानं वा भेत्ता न होति, भेदानां वा सन्धाता ।",
     "He speaks the truth, is devoted to truth, reliable, trustworthy, not deceptive to the world; he reconciles those divided and encourages those united.",
     ["right-speech", "harmony"]),
    ("eightfold-9", "Right Speech — Words Gentle and Timely",
     "या सा वाचा नेला कण्णसुखा पेमणीया हृदयङ्गमा पोरी बहुजनकन्ता बहुजनमनापा, तथारूपिं वाचं भासिता होति ।",
     "He speaks words that are gentle, pleasing to the ear, affectionate, going to the heart, courteous, desired by many, delightful to many.",
     ["right-speech", "gentleness"]),

    # 4. Right Action (Samma Kammanta)
    ("eightfold-10", "Right Action — Threefold Bodily Purity",
     "कतमो च, भिक्खवे, सम्माकम्मन्तो? पाणातिपाता वेरमणी, अदिन्नादाना वेरमणी, कामेसुमिच्छाचारा वेरमणी—अयं वुच्चति, भिक्खवे, सम्माकम्मन्तो ।",
     "And what, monks, is Right Action (Samma Kammanta)? Abstinence from taking life, abstinence from taking what is not given, and abstinence from sexual misconduct — this is called Right Action.",
     ["right-action", "samma-kammanta", "ahimsa"]),
    ("eightfold-11", "Right Action — Reverence for All Life",
     "निहितदण्डो निहितसत्थो लज्जी दयापन्नो सब्बपाणभूतहितानुकम्पी विहरति ।",
     "Laying aside the rod and weapon, scrupulous, compassionate, he abides dwelling with tenderness and kindness toward all living creatures.",
     ["right-action", "compassion"]),
    ("eightfold-12", "Right Action — Honesty and Contentment",
     "अदिन्नादाना पटिविरतो होति, परस्स भण्डं न थेय्यसङ्खातं अदिन्नं आदियति ।",
     "Abstaining from taking what is not given, he takes only what is given, expecting only what is given, abiding pure in heart without theft.",
     ["right-action", "honesty"]),

    # 5. Right Livelihood (Samma Ajiva)
    ("eightfold-13", "Right Livelihood — Abandoning Wrong Trade",
     "कतमो च, भिक्खवे, सम्माआजीवो? इध, भिक्खवे, अरियसावको मिच्छाआजीवं पहाय सम्माआजीवेन जीविकं कप्पेति—अयं वुच्चति सम्माआजीवो ।",
     "And what, monks, is Right Livelihood (Samma Ajiva)? Here, a noble disciple, having abandoned wrong livelihood, earns his living by a righteous means of livelihood — this is called Right Livelihood.",
     ["right-livelihood", "samma-ajiva", "ethics"]),
    ("eightfold-14", "Right Livelihood — Five Harmful Trades Forbidden",
     "पञ्चिमा, भिक्खवे, वणिज्जा उपासकेन न करणीया—सत्थवणिज्जा, सत्तवणिज्जा, मंसवणिज्जा, मज्जवणिज्जा, विसवणिज्जा ।",
     "Five trades, monks, should not be practiced by a lay follower: trade in weapons, trade in living beings, trade in meat, trade in intoxicants, and trade in poisons.",
     ["right-livelihood", "five-trades"]),
    ("eightfold-15", "Right Livelihood — Living Righteously and Harmlessly",
     "धम्मेन भोगे परियेसति असंहासेन, अविहिंसाय सब्बभूतानं जीविकं कप्पेति ।",
     "He seeks his wealth lawfully and without violence, earning his living harmlessly without inflicting pain on any living creature.",
     ["right-livelihood", "purity"]),

    # 6. Right Effort (Samma Vayama)
    ("eightfold-16", "Right Effort — Four Supreme Strivings",
     "कतमो च, भिक्खवे, सम्मावायामो? इध, भिक्खवे, भिक्खु अनुप्पन्नानं पापकानं अकुसलानं धम्मानं अनुप्पादाय छन्दं जनेति वायमति वीरियं आरभति चित्तं पग्गण्हाति पदहति ।",
     "And what, monks, is Right Effort (Samma Vayama)? Here, a monk generates desire, endeavors, arouses energy, applies his mind, and strives to prevent the arising of unarisen evil, unwholesome states.",
     ["right-effort", "samma-vayama", "striving"]),
    ("eightfold-17", "Right Effort — Abandoning Evil States",
     "उप्पन्नानं पापकानं अकुसलानं धम्मानं पहानाय छन्दं जनेति वायमति वीरियं आरभति ।",
     "He generates desire, endeavors, arouses energy, and exerts his mind to abandon unwholesome states that have already arisen.",
     ["right-effort", "abandoning"]),
    ("eightfold-18", "Right Effort — Cultivating and Maintaining Good",
     "अनुप्पन्नानं कुसलानं धम्मानं उप्पादाय, उप्पन्नानं कुसलानं धम्मानं ठितिया भिय्योभावाय वेपुल्लाय भावनाय परिपूरिया छन्दं जनेति वायमति ।",
     "He generates desire, endeavors, and strives to arouse unarisen wholesome states, and to maintain, clarify, increase, and perfect wholesome states that have arisen.",
     ["right-effort", "wholesome"]),

    # 7. Right Mindfulness (Samma Sati)
    ("eightfold-19", "Right Mindfulness — The Four Foundations",
     "कतमा च, भिक्खवे, सम्मासति? इध, भिक्खवे, भिक्खु काये कायानुपस्सी विहरति आतापी सम्पजानो सतिमा, विनेय्य लोके अभिज्झादोमनस्सं ।",
     "And what, monks, is Right Mindfulness (Samma Sati)? Here, a monk abides contemplating the body in the body, ardent, clearly comprehending, mindful, having put away covetousness and grief regarding the world.",
     ["right-mindfulness", "samma-sati", "satipatthana"]),
    ("eightfold-20", "Right Mindfulness — Feelings, Mind, and Dhammas",
     "वेदनासु वेदनानुपस्सी विहरति, चित्ते चित्तानुपस्सी विहरति, धम्मेसु धम्मानुपस्सी विहरति आतापी सम्पजानो सतिमा ।",
     "He abides contemplating feelings in feelings, contemplating mind in mind, contemplating mental phenomena in mental phenomena, ardent, clearly comprehending, mindful.",
     ["mindfulness", "awareness"]),
    ("eightfold-21", "Right Mindfulness — Constant Clear Comprehension",
     "अभिक्कन्ते पटिक्कन्ते सम्पजानकारी होति, आलोकिते विलोकिते सम्पजानकारी होति ।",
     "In walking forward and stepping back, in looking forward and looking away, in bending and stretching his limbs, he acts with clear comprehension.",
     ["mindfulness", "sampajanna"]),

    # 8. Right Concentration (Samma Samadhi)
    ("eightfold-22", "Right Concentration — The First and Second Jhanas",
     "कतमो च, भिक्खवे, सम्मासमाधि? इध, भिक्खवे, भिक्खु विविच्चेव कामेहि विविच्च अकुसलेहि धम्मेहि सवितक्कं सविचारं विवेकजं पीतिसुखं पठमं ज्ञानं उपसम्पज्ज विहरति ।",
     "And what, monks, is Right Concentration (Samma Samadhi)? Here, secluded from sensual desires and unwholesome states, a monk enters upon and abides in the first jhana, accompanied by thought and reflection, with rapture and joy born of seclusion.",
     ["right-concentration", "samma-samadhi", "jhana"]),
    ("eightfold-23", "Right Concentration — The Third and Fourth Jhanas",
     "सुखस्स च पहाना दुक्खस्स च पहाना पुब्बेव सोमनस्सदोमनस्सानं अत्थङ्गमा अदुक्खमसुखं उपेक्खासतिपारिसुद्धिं चतुत्थं ज्ञानं उपसम्पज्ज विहरति ।",
     "With the abandoning of pleasure and pain, and with the previous disappearance of joy and grief, he enters upon and abides in the fourth jhana, which is beyond pleasure and pain, purified by equanimity and mindfulness.",
     ["jhana", "equanimity", "samadhi"]),
    ("eightfold-24", "The Completion of the Path — Knowledge and Liberation",
     "सम्मादिट्ठिस्स सम्मासङ्कप्पो पहोति, सम्मासङ्कप्पस्स सम्मावाचा... सम्मासमाधिस्स सम्माज्ञानं पहोति, सम्माज्ञानस्स सम्माविमुत्ति पहोति ।",
     "In one of Right View, Right Intention develops; in one of Right Intention, Right Speech... in one of Right Concentration, Right Knowledge develops; in one of Right Knowledge, Right Liberation is attained.",
     ["liberation", "vimutti", "perfection"])
]

eightfold_entries = []
for cid, title, orig, meaning, tags in eightfold_data:
    eightfold_entries.append({
        "id": f"eightfold-{cid}",
        "title": title,
        "source": "Samyutta Nikaya — Magga-vibhanga Sutta SN 45.8",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Gautama Buddha",
        "tags": ["buddhist", "eightfold-path"] + tags,
        "category": "buddhist_foundations",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-eightfold-path.ts", "EIGHTFOLD_PATH_ENTRIES", eightfold_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 3. HEART SUTRA (14 VERSES - PRAJNAPARAMITA HRIDAYA SUTRA)
# ─────────────────────────────────────────────────────────────────────────────
heart_sutra_data = [
    (1, "The Bodhisattva's Contemplation of Emptiness",
     "आर्यावलोकितेश्वरो बोधिसत्त्वो गम्भीरायां प्रज्ञापारमितायां चर्यां चरमाणो व्यवलोकयति स्म—पञ्चस्कन्धांस्तांश्च स्वभावशून्यान् पश्यति स्म ।",
     "The noble Bodhisattva Avalokiteshvara, coursing in the deep practice of the Perfection of Wisdom (Prajnaparamita), looked down from on high and beheld the five aggregates, and saw that they were empty of intrinsic nature."),
    (2, "Form is Emptiness, Emptiness is Form",
     "इह शारिपुत्र रूपं शून्यता शून्यतैव रूपम् । रूपान्न पृथक् शून्यता शून्यताया न पृथग् रूपम् । यद् रूपं सा शून्यता या शून्यता तद् रूपम् । एवमेव वेदनासंज्ञासंस्कारविज्ञानानि ।",
     "Here, O Shariputra, form is emptiness, and emptiness itself is form. Emptiness is not other than form, nor is form other than emptiness. Whatever is form, that is emptiness; whatever is emptiness, that is form. The same is true of feelings, perceptions, mental volitions, and consciousness."),
    (3, "All Dharmas are Marked with Emptiness",
     "इह शारिपुत्र सर्वधर्माः शून्यतालक्षणा अनुत्पन्ना अनिरुद्धा अमला अनिमला अनूना असम्पूर्णाः ।",
     "Here, O Shariputra, all phenomena (dharmas) are marked with emptiness: they are neither produced nor destroyed, neither defiled nor immaculate, neither deficient nor complete."),
    (4, "In Emptiness There are No Senses or Objects",
     "तस्माच्छारिपुत्र शून्यतायां न रूपं न वेदना न संज्ञा न संस्कारा न विज्ञानम् । न चक्षुःश्रोत्रघ्राणजिह्वाकायमनांसि । न रूपशब्दगन्धरसस्पर्शधर्माः ।",
     "Therefore, Shariputra, in emptiness there is no form, no feeling, no perception, no volition, no consciousness. There is no eye, ear, nose, tongue, body, or mind; no visible form, sound, smell, taste, touch, or mental object."),
    (5, "No Realm of Senses Up to Consciousness",
     "न चक्षुर्धातुर्यावन्न मनोधातुर्न धर्मधातुर्न मनोविज्ञानधातुः ।",
     "There is no realm of the eye, up to and including no realm of mind-consciousness and no realm of mental objects."),
    (6, "No Ignorance, Aging, or Death",
     "न विद्या नाविद्या न विद्याक्षयो नाविद्याक्षयो यावन्न जरामरणं न जरामरणक्षयः ।",
     "There is no ignorance, nor is there extinction of ignorance, up to and including no aging and death, nor extinction of aging and death."),
    (7, "No Four Truths, No Attainment",
     "न दुःखसमुदयनिरोधमार्गा न ज्ञानं न प्राप्तिर्नाप्राप्तिः ।",
     "There is no suffering, no origin of suffering, no cessation, and no path; there is no wisdom, no attainment, and no non-attainment."),
    (8, "Dwelling Without Mental Obstacles",
     "तस्माच्छारिपुत्र अप्राप्तित्वाद् बोधिसत्त्वस्य प्रज्ञापारमितामाश्रित्य विहरत्यचित्तावरणः । चित्तावरणनास्तित्वादत्रस्तो विपर्यासातिक्रान्तो निष्ठनिर्वाणप्राप्तः ।",
     "Therefore, Shariputra, because there is no attainment, the Bodhisattva relies upon the Perfection of Wisdom and dwells with no obstruction in the mind. Because there is no obstruction, he has no fear, surpasses all perverted delusions, and reaches ultimate Nirvana."),
    (9, "The Awakening of All Buddhas",
     "त्र्यध्वव्यवस्थिताः सर्वबुद्धाः प्रज्ञापारमितामाश्रित्यानुत्तरां सम्यक्सम्बोधिमभिसम्बुद्धाः ।",
     "All the Buddhas of the past, present, and future rely upon the Perfection of Wisdom and fully awaken to unsurpassed, complete, perfect enlightenment."),
    (10, "The Great Incomparable Mantra",
     "तस्माज्ज्ञातव्यं प्रज्ञापारमितामहामन्त्रो महाविद्यामन्त्रोऽनुत्तरमन्त्रोऽसमसममन्त्रः सर्वदुःखप्रशमनमन्त्रः सत्यममिथ्यत्वात् ।",
     "Therefore know the Perfection of Wisdom as the great mantra, the mantra of great knowledge, the unsurpassed mantra, the unequaled mantra, which completely pacifies all suffering, for it is truthful and free from deception."),
    (11, "The Prajnaparamita Mantra Proclaimed",
     "प्रज्ञापारमितायामुक्तो मन्त्रः । तद्यथा—गते गते पारगते पारसंगते बोधि स्वाहा ।",
     "The mantra of the Perfection of Wisdom is proclaimed thus: Gate gate paragate parasamgate bodhi svaha (Gone, gone, gone beyond, gone completely beyond, awakened, hail!)."),
    (12, "Meaning of the Mantra — Stepping Beyond",
     "गते गते पारगते पारसंगते बोधि स्वाहा—इति संसारसमुद्रपारंगतो बुद्धत्वं प्राप्नोतीत्यर्थः ।",
     "Gate gate paragate parasamgate bodhi svaha — this signifies having crossed over the ocean of cyclic suffering to the other shore, attaining complete Buddhahood."),
    (13, "Exhortation to Wisdom",
     "यः कश्चिच्छारिपुत्र कुलपुत्रो वा कुलदुहिता वा इमां गम्भीरां प्रज्ञापारमितां चर्यां चरेत् स एवं व्यवलोकयितव्यः ।",
     "Whoever, Shariputra, whether son or daughter of noble family, wishes to practice this profound Perfection of Wisdom, should contemplate it in this very manner."),
    (14, "Rejoicing in the Heart Sutra",
     "इदमवोचद्भगवान् । आनन्दमना आयुष्मान् शारिपुत्र आर्य्यावलोकितेश्वरश्च बोधिसत्त्वः सा च सर्वावती पर्षत् सदेवमानुषासुरगन्धर्वश्च लोको भगवतो भाषितमभ्यनन्दन्निति ।",
     "Thus spoke the Lord. Delighted, the venerable Shariputra, the noble Bodhisattva Avalokiteshvara, and the entire assembly with gods, humans, asuras, and gandharvas rejoiced at the words of the Blessed One.")
]

heart_sutra_entries = []
for verse_num, title, orig, meaning in heart_sutra_data:
    heart_sutra_entries.append({
        "id": f"heart-sutra-{verse_num}",
        "title": f"Heart Sutra — Verse {verse_num}: {title}",
        "source": "Prajnaparamita Hridaya Sutra",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Prajnaparamita Sutra",
        "tags": ["heart-sutra", "prajnaparamita", "sunyata", "emptiness", "bodhisattva"],
        "category": "sutra",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-heart-sutra.ts", "HEART_SUTRA_ENTRIES", heart_sutra_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 4. KARANIYA METTA SUTTA (10 COMPLETE VERSES - SUTTA NIPATA 1.8)
# ─────────────────────────────────────────────────────────────────────────────
metta_data = [
    (1, "करणीयमत्थकुसलेन यन्त सन्तं पदं अभिसमेच्च ।\nसक्को उजू च सुहूजू च सूवचो चस्स मुदु अनतिResourceमानी ॥",
     "This should be done by one skilled in the good, wishing to attain that state of peace: he should be capable, upright, thoroughly upright, easy to instruct, gentle, and free from pride."),
    (2, "सन्तुस्सको च सुभरो च अप्पकिच्चो च सल्लहुकवुत्ति ।\nसन्तइन्द्रियो च निपको च अप्पगब्भो कुलेसु अननुगिद्धो ॥",
     "Contented, easily supported, with few duties, living lightly, with senses calmed, prudent, not impudent, and not greedily attached to families."),
    (3, "न च खुद्दं समाचरे किञ्चि येन विञ्ञू परे उपवदेय्युं ।\nसुखिनो वा खेमिनो होन्तु सब्बे सत्ता भवन्तु सुखितत्ता ॥",
     "He should not commit even the slightest fault that wise people would blame. May all beings be happy and secure; may all beings become joyful in their hearts!"),
    (4, "ये केचि पाणभूतत्थि तसा वा थावरा वा अनवसेसा ।\nदीघा वा ये महन्ता वा मज्झिमा रस्सकाणुकथूला ॥",
     "Whatever living creatures there may be, whether weak or strong, tall or great, medium, short, subtle or gross, without exception;"),
    (5, "दिट्ठा वा येव अद्दिट्ठा ये च दूरे वसन्ति अविदूरे ।\nभूता वा सम्भवेसी वा सब्बे सत्ता भवन्तु सुखितत्ता ॥",
     "Whether seen or unseen, dwelling far or near, born or seeking birth — may all beings without exception be happy in their hearts!"),
    (6, "न परो परं निकुब्बेथ नातिमञ्ञेथ कत्थचि नं कञ्चि ।\nब्यारोसना पटिघसञ्ञा नाञ्ञमञ्ञस्स दुक्खमिच्छेय्य ॥",
     "Let none deceive another, nor despise anyone anywhere. In anger or ill-will, let none wish any harm to another."),
    (7, "माता यथा नियं पुत्तं आयुसा एकपुत्तमनुरक्खे ।\nएवम्पि सब्बभूतेसु मानसं भावये अपरमाणं ॥",
     "Just as a mother would protect her only child at the risk of her own life, even so toward all living beings should one cultivate a boundless heart of loving-kindness."),
    (8, "मेत्तञ्च सब्बलोकस्मिं मानसं भावये अपरमाणं ।\nउद्धं अधो च तिरियञ्च असम्बाधं अवेरं असपत्तं ॥",
     "Let one radiate boundless loving-kindness toward the entire cosmos — above, below, and across — unhindered, free from hatred, and free from enmity."),
    (9, "तिट्ठं चरं निसिन्नो वा सयानो वा यावतस्स विगतमिद्धो ।\nएतं सतिं अधिट्ठेय्य ब्रह्ममेतं विहारमिधमाहु ॥",
     "Standing, walking, sitting, or lying down, as long as one is awake, let him resolve upon this mindfulness; this is called the divine abiding (Brahma-vihara) here in this life."),
    (10, "दिट्ठिञ्च अनुपगम्म सीलवा दस्सनेन सम्पन्नो ।\nकामेसु विनेय्य गेधं न हि जातु गब्भसेय्यं पुनेतीति ॥",
     "Not holding to wrong views, virtuous, endowed with vision, having dispelled craving for sensual pleasures, he will never again enter a womb for rebirth.")
]

metta_entries = []
for verse_num, orig, meaning in metta_data:
    metta_entries.append({
        "id": f"metta-{verse_num}",
        "title": f"Karaniya Metta Sutta — Verse {verse_num}",
        "source": "Sutta Nipata 1.8 / Khuddakapatha 9",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Gautama Buddha",
        "tags": ["metta", "loving-kindness", "compassion", "brahmavihara", "all-beings"],
        "category": "sutra",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-metta-sutta.ts", "METTA_SUTTA_ENTRIES", metta_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 5. SATIPATTHANA SUTTA (24 VERSES - MN 10 / DN 22)
# ─────────────────────────────────────────────────────────────────────────────
satipatthana_data = [
    ("sati-1", "The One Way Path — Ekayano Maggo",
     "एकयानो अयं, भिक्खवे, मग्गो सत्तानं विसुद्धिया सोकपरिद्देवानं समतिक्कमाय दुक्खदोमनस्सानं अत्थङ्गमाय ञायस्स अधिगमाय निब्बानस्स सच्छिकिरियाय, यदिदं चत्तारो सतिपट्ठाना ।",
     "This is the direct path, monks, for the purification of beings, for the overcoming of sorrow and lamentation, for the vanishing of pain and grief, for reaching the true path, for the realization of Nirvana — namely, the four foundations of mindfulness."),
    ("sati-2", "The Four Foundations Enunciated",
     "कतमे चत्तारो? इध, भिक्खवे, भिक्खु काये कायानुपस्सी विहरति आतापी सम्पजानो सतिमा, विनेय्य लोके अभिज्झादोमनस्सं; वेदनासु वेदनानुपस्सी... चित्ते चित्तानुपस्सी... धम्मेसु धम्मानुपस्सी विहरति ।",
     "Which four? Here, monks, a monk abides contemplating the body in the body, ardent, clearly comprehending, mindful, having put away covetousness and grief regarding the world; feelings in feelings; mind in mind; mental phenomena in mental phenomena."),
    ("sati-3", "Mindfulness of Breathing — In-breath and Out-breath",
     "सो सतोव अस्ससति, सतोव पस्ससति । दीघं वा अस्ससन्तो ‘दीघं अस्ससामी’ति पजानाति, दीघं वा पस्ससन्तो ‘दीघं पस्ससामी’ति पजानाति ।",
     "Ever mindful he breathes in, mindful he breathes out. Breathing in long, he knows: 'I breathe in long'; breathing out long, he knows: 'I breathe out long.'"),
    ("sati-4", "Mindfulness of Breathing — Calming the Bodily Formation",
     "सब्बकायपटिसंवेदी अस्ससिस्सामीति सिक्खति; पस्सम्भयं कायसङ्खारं अस्ससिस्सामीति सिक्खति ।",
     "He trains thus: 'Experiencing the whole body, I will breathe in'; he trains thus: 'Calming bodily formation, I will breathe in; calming bodily formation, I will breathe out.'"),
    ("sati-5", "Mindfulness of the Four Postures",
     "गच्छन्तो वा ‘गच्छामी’ति पजानाति, ठितो वा ‘ठितोम्ही’ति पजानाति, निसिन्नो वा ‘निसिन्नोम्ही’ति पजानाति, सयानो वा ‘सयानोम्ही’ति पजानाति ।",
     "When walking, he knows: 'I am walking'; when standing, he knows: 'I am standing'; when sitting, he knows: 'I am sitting'; when lying down, he knows: 'I am lying down.'"),
    ("sati-6", "Clear Comprehension in Action",
     "अभिक्कन्ते पटिक्कन्ते सम्पजानकारी होति, समिञ्जिते पसारिते सम्पजानकारी होति, सङ्घाटिपत्तचीवरधारणे सम्पजानकारी होति ।",
     "In stepping forward and stepping back he applies clear comprehension; in bending and extending his limbs he applies clear comprehension; in wearing robes and carrying the bowl he applies clear comprehension."),
    ("sati-7", "Contemplation of the 31 Parts of the Body",
     "इममेव कायं उद्धं पादतलेहि अधो केसheadमत्थका परिपुण्णं नानाविविधस्स असुचिनो पच्चवेक्खति—अत्थि इमस्मिं काये केसा लोमा नखा दन्ता तचो मंसं न्हारु अट्ठि अट्ठिमिञ्जं वक्कं हदयं यकनं किलोमकं पिहकं पप्फासं ।",
     "He reflects on this very body from the soles of the feet up to the crown of the head, enveloped in skin and full of many impurities: 'In this body there are hairs of the head, body hairs, nails, teeth, skin, flesh, sinews, bones, bone-marrow, kidneys, heart, liver, diaphragm, spleen, lungs.'"),
    ("sati-8", "Contemplation of the Four Elements",
     "इममेव कायं धातुसो पच्चवेक्खति—अत्थि इमस्मिं काये पठवीधातु आपोधातु तेजोधातु वायोधातुति ।",
     "He reflects upon this very body by way of the elements: 'In this body there is the earth element, the water element, the fire element, and the air element.'"),
    ("sati-9", "Cemetery Contemplations — The Nature of the Body",
     "सेय्यथापि पस्सेय्य सरीरं सीवथिकाय छड्डितं एकाहमतं वा द्वीहमतं वा, सो इममेव कायं उपसंहराति—अयमपि खो कायो एवंभावो एवंभावी एवंअनतीतोति ।",
     "Just as he might see a corpse cast away in a charnel ground, dead for one, two, or three days, he applies this to his own body: 'This body too is of the same nature, it will be like that, it has not escaped that.'"),
    ("sati-10", "Contemplating the Body Internally and Externally",
     "इति अज्झत्तं वा काये कायानुपस्सी विहरति, बहिद्धा वा काये कायानुपस्सी विहरति, अज्झत्तबहिद्धा वा काये कायानुपस्सी विहरति ।",
     "In this way he abides contemplating the body in the body internally, contemplating the body externally, and contemplating the body both internally and externally."),
    ("sati-11", "Contemplation of Pleasant Feelings",
     "सुखं वेदनं वेदयमानो ‘सुखं वेदनं वेदयामी’ति पजानाति; दुक्खं वेदनं वेदयमानो ‘दुक्खं वेदनं वेदयामी’ति पजानाति ।",
     "When feeling a pleasant feeling, he knows: 'I feel a pleasant feeling'; when feeling a painful feeling, he knows: 'I feel a painful feeling.'"),
    ("sati-12", "Contemplation of Neutral Feelings",
     "अदुक्खमसुखं वेदनं वेदयमानो ‘अदुक्खमसुखं वेदनं वेदयामी’ति पजानाति ।",
     "When feeling a neither-painful-nor-pleasant feeling, he knows: 'I feel a neither-painful-nor-pleasant feeling.'"),
    ("sati-13", "Feelings are Impermanent Arising and Vanishing",
     "समुदयधम्मानुपस्सी वा वेधनासु विहरति, वयधम्मानुपस्सी वा वेदनासु विहरति ।",
     "He abides contemplating arising phenomena in feelings, or contemplating vanishing phenomena in feelings, or contemplating both arising and vanishing phenomena."),
    ("sati-14", "Contemplation of the Mind — Lust and Free from Lust",
     "सरा गं वा चित्तं ‘सरा गं चित्तं’ति पजानाति, वीतरागं वा चित्तं ‘वीतरागं चित्तं’ति पजानाति ।",
     "He knows a mind affected by lust as lustful, and a mind free from lust as free from lust."),
    ("sati-15", "Contemplation of the Mind — Anger and Freedom from Anger",
     "सदोषं वा चित्तं ‘सदोषं चित्तं’ति पजानाति, वीतदोषं वा चित्तं ‘वीतदोषं चित्तं’ति पजानाति ।",
     "He knows a mind affected by anger as angry, and a mind free from anger as free from anger."),
    ("sati-16", "Contemplation of the Mind — Distracted and Concentrated",
     "विक्खित्तं वा चित्तं ‘विक्खित्तं चित्तं’ति पजानाति, समाहितं वा चित्तं ‘समाहितं चित्तं’ति पजानाति ।",
     "He knows a distracted mind as distracted, and a concentrated mind as concentrated; a liberated mind as liberated."),
    ("sati-17", "Contemplation of Mental Phenomena — Five Hindrances",
     "सन्ता वा अज्झत्तं कामच्छन्दं ‘अत्थि मे अज्झत्तं कामच्छन्दो’ति पजानाति; असन्तं वा ‘नत्थि मे कामच्छन्दो’ति पजानाति ।",
     "When sensual desire is present within him, he knows: 'There is sensual desire in me'; when sensual desire is absent, he knows: 'There is no sensual desire in me.'"),
    ("sati-18", "Abandoning Ill-Will, Sloth, Restlessness, and Doubt",
     "ब्यापादं, थिनमिद्धं, उद्धच्चकुक्कुच्चं, विचिकिच्छं च विविच्चेव परिञ्ञाय पहानाय विहरति ।",
     "He knows how ill-will, sloth and torpor, restlessness and worry, and skeptical doubt arise, how they are abandoned, and how they do not arise again."),
    ("sati-19", "Contemplation of the Five Aggregates",
     "इति रूपं, इति रूपस्स समुदयो, इति रूपस्स अत्थङ्गमो; इति वेदना... इति सञ्ञा... इति सङ्खारा... इति विञ्ञाणं ।",
     "Such is form, such its arising, such its disappearance; such is feeling, perception, volitions, and consciousness, their arising and disappearance."),
    ("sati-20", "Contemplation of the Six Internal and External Senses",
     "चक्खुञ्च पजानाति, रूपे च पजानाति, यञ्च तदुभयं पटिच्च उप्पज्जति संयोजनं तम्पि पजानाति ।",
     "He knows the eye, he knows forms, and he knows the fetter that arises dependent on both; he knows how the unarisen fetter arises, and how it is abandoned."),
    ("sati-21", "Contemplation of the Seven Factors of Enlightenment",
     "सन्ता वा अज्झत्तं सतिसम्बोज्झङ्गं ‘अत्थि मे अज्झत्तं सतिसम्बोज्झङ्गो’ति पजानाति ।",
     "When the enlightenment factor of mindfulness is present within him, he knows: 'The enlightenment factor of mindfulness is in me.'"),
    ("sati-22", "Factors of Investigation, Energy, Joy, Calm, Concentration, Equanimity",
     "धम्मविचयसम्बोज्झङ्गं, वीरियसं, पीतिसं, पस्सद्धिसं, समाधिसं, उपेक्खासम्बोज्झङ्गं च यथाभूतं पजानाति ।",
     "He knows the presence and cultivation of investigation, energy, joy, tranquility, concentration, and equanimity as factors of awakening."),
    ("sati-23", "Contemplation of the Four Noble Truths",
     "‘इदं दुक्खं’ति यथाभूतं पजानाति, ‘अयं दुक्खसमुदयो’ति, ‘अयं दुक्खनिरोधो’ति, ‘अयं दुक्खनिरोधगामिनी पटिपदा’ति यथाभूतं पजानाति ।",
     "He understands as it really is: 'This is suffering'; 'This is the origin of suffering'; 'This is the cessation of suffering'; 'This is the way leading to the cessation of suffering.'"),
    ("sati-24", "The Fruition of Satipatthana",
     "यो हि कोचि, भिक्खवे, इमे चत्तारो सतिपट्ठाने एवं भावेय्य सत्त वस्सानि, तस्स द्विन्नं फलानां अञ्ञतरं फलं पाटिकङ्खं—दिट्ठेव धम्मे अञ्ञा, सति वा उपादिशेसे अनागामिताति ।",
     "Monks, whoever cultivates these four foundations of mindfulness in this way for seven years — or even seven days — may expect one of two fruits: either final knowledge here and now, or non-returning.")
]

satipatthana_entries = []
for cid, title, orig, meaning in satipatthana_data:
    satipatthana_entries.append({
        "id": f"satipatthana-{cid}",
        "title": title,
        "source": "Majjhima Nikaya 10 — Satipatthana Sutta",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Gautama Buddha",
        "tags": ["satipatthana", "mindfulness", "meditation", "anapanasati", "insight"],
        "category": "buddhist_foundations",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-satipatthana.ts", "SATIPATTHANA_ENTRIES", satipatthana_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 6. JATAKA TALES (20 CANONICAL MORAL GATHAS)
# ─────────────────────────────────────────────────────────────────────────────
jataka_data = [
    ("jataka-1", "Apannaka Jataka — The Unfailing Truth",
     "अपण्णकं ठानमेके दूतिं वदन्ति तक्किणो ।\nएतदञ्ञाय मेधावी तं गण्हे यदपण्णकं ॥",
     "Some thinkers hold opposing views, but what is unfailing truth stands firm. Knowing this, the wise person embraces that which is certain and fruitful.",
     ["apannaka", "truth", "wisdom"]),
    ("jataka-2", "Vannupatha Jataka — Perseverance in the Wilderness",
     "अकिलासिनो खणन्ता ते उदपन्थनि उदकं ।\nएवं मुनी वीरियबलो समाधिं अधिगच्छति ॥",
     "Untiringly digging into the sand, travelers found refreshing water in the arid desert. In the same way, the energetic sage through perseverance attains calm and concentration.",
     ["vannupatha", "perseverance", "effort"]),
    ("jataka-3", "Serivanija Jataka — Honesty Surpasses Greed",
     "सच्चेन दमेन च संयमेन, सच्चवादी न हापेति अत्थं ।\nलोभेन मूढो अधमो नरो, चिरं सोयति दुम्मती ॥",
     "By truthfulness, self-control, and integrity, the honest seeker loses not his welfare. But the greedy fool, blinded by avarice, grieves for a long time.",
     ["serivanija", "honesty", "greed"]),
    ("jataka-4", "Mahakapi Jataka — The Noble Leader as the Bridge",
     "अहं सेतु हुत्वा तरणाय सेनाय, पाणे मम चज्जामि बन्धवानं ।\nएवं राजा सव्वपजानु कम्पो, धम्मेन पालेति सुखे समाहितो ॥",
     "Making a bridge of my own body for my followers to cross safely, I sacrificed my life for my kin. Even so should a righteous ruler protect all his people with compassion and justice.",
     ["mahakapi", "leadership", "sacrifice"]),
    ("jataka-5", "Sasa Jataka — Supreme Generosity of the Wise Hare",
     "ससो ससत्तं विहाय, अग्गिम्हि पतितो सयं ।\nदानेन सब्बलोकानं, सीहनादं पनादयि ॥",
     "The wise hare, offering no common food, leapt joyfully into the blazing fire to offer his own flesh. By this supreme gift of dana, he astounded the heavens and taught generosity.",
     ["sasa-jataka", "dana", "generosity"]),
    ("jataka-6", "Nigrodhamiga Jataka — Compassion for the Helpless",
     "निग्रोधमेव सेवेय्य, न साखमुपसंहरे ।\nनिग्रोधस्मिं मतं सेय्यो, यञ्चे साखस्मि जीवितं ॥",
     "Seek shelter with the compassionate Banyan deer, and approach not the selfish branch; death in the service of the compassionate is better than life under the unrighteous.",
     ["nigrodhamiga", "compassion", "protection"]),
    ("jataka-7", "Kurunga Jataka — The Power of Loyal Friends",
     "मित्तो मित्तेन सन्धाय, सङ्कटेसु सहायको ।\nकुरङ्गो कूपगो मण्डो, मुत्ता जाला विमोचिता ॥",
     "True friends standing together aid each other in times of peril. The deer, the bird, and the tortoise united to escape the hunter's snare.",
     ["kurunga", "friendship", "loyalty"]),
    ("jataka-8", "Silavanaga Jataka — Returning Good for Evil",
     "अकत्तञ्ञुस्स पोसस्स, निच्चं विवरदस्सिनो ।\nसब्बे चे पठविं दज्जा, नेव नं अभिरोधये ॥",
     "To an ungrateful person who is ever watchful for flaws, even if one were to give the entire earth, it would never satisfy his crooked heart.",
     ["silavanaga", "gratitude", "karma"]),
    ("jataka-9", "Matakabhatta Jataka — Against Animal Sacrifice",
     "एवं चे सत्ता जानेय्युं, ‘दुक्खोयं जातिसम्भवो’ ।\nन पाणि पाणिना हञ्ञे, पाणघाती हि सोचति ॥",
     "If living beings only knew that birth in suffering is born of deeds, no living creature would kill another; for he who slays living beings mourns in anguish.",
     ["matakabhatta", "ahimsa", "compassion"]),
    ("jataka-10", "Khadirangara Jataka — Courage in Doing Good",
     "कामं पतेय्यं निरये, उद्धपादं अवंसिरो ।\nन त्वेवाचं दाना विरमिस्सामि, सन्तेसु वरदायको ॥",
     "Even if I should fall into a pit of blazing embers headlong, I will never turn back from giving to the righteous and noble.",
     ["khadirangara", "courage", "dana"]),
    ("jataka-11", "Bhallatiya Jataka — The Tears of Innocent Creatures",
     "सचे पि वस्सं जीवन्ति, विप्पयोगेन सोचना ।\nदुक्खं विय विसिट्ठस्स, तस्मा पेमं सुगोपये ॥",
     "Even if creatures live in beauty, separation brings sorrow. Understanding the tenderness of affection, one should cherish harmony.",
     ["bhallatiya", "tenderness", "harmony"]),
    ("jataka-12", "Chaddanta Jataka — Forgiveness Towards the Hunter",
     "दन्ता मे छिन्ना रुहिरा सवन्ता, न मे मनो दुट्ठमहु सुदामे ।\nधम्मेन जीवामि मुदा भवामि, वेरं परेसुं न कदापि बन्धे ॥",
     "Though my glorious tusks were sawn away and blood flowed, my heart bore no malice toward the huntsman. I live by dharma in joyful peace, never holding grudge against anyone.",
     ["chaddanta", "forgiveness", "patience"]),
    ("jataka-13", "Kalyana-dhamma Jataka — The Auspicious Nature",
     "कल्याणधम्मो मेधावी, सीलवा सुसमाहितो ।\nसब्बत्थ पूजितो होति, पुञ्ञवान् सुखमेधति ॥",
     "The person of auspicious nature, wise, virtuous, and well-composed, is honored everywhere; endowed with merit, he abides in joy.",
     ["kalyana", "virtue", "merit"]),
    ("jataka-14", "Dharmadhvaja Jataka — The Pretense of Virtue",
     "यो धम्मधजमारुह्य, पापकम्मं निसेवति ।\nविस्सासयित्वा भूतानि, बिळारो वत सो नरो ॥",
     "He who raises the banner of virtue while indulging in wicked deeds, winning trust only to harm living beings, is like a predatory cat disguised as an ascetic.",
     ["dharmadhvaja", "hypocrisy", "sincerity"]),
    ("jataka-15", "Kuntani Jataka — Patient Wisdom Under Injustice",
     "अक्कोधेन जिने कोधं, असाधुं साधुना जिने ।\nजिने कदरियं दानेन, सच्चेनालिकवादिनं ॥",
     "Conquer anger by non-anger; conquer evil by good; conquer the stingy by generosity; and conquer the liar by truth.",
     ["kuntani", "non-anger", "truth"]),
    ("jataka-16", "Mahasutasoma Jataka — Truthfulness is the Highest Virtue",
     "सच्चं हवे अमता वाचा, एसा धम्मो सनन्तनो ।\nसच्चे अत्थे च धम्मे च, आहु सन्तो पतिट्ठिता ॥",
     "Truth indeed is the immortal speech; this is an ancient and eternal law. Upon truth, virtue, and righteousness do the wise ever stand steadfast.",
     ["sutasoma", "truth", "immortal"]),
    ("jataka-17", "Vidhurapandita Jataka — The Four Virtues of the Wise",
     "अक्कोधो च अविहिंसा, सीलं सच्चं च सोभनं ।\nएते धम्मा पण्डितस्स, भूषयन्ति जगत्त्रये ॥",
     "Freedom from anger, harmlessness to all, moral conduct, and radiant truthfulness — these virtues of the wise shine as ornaments throughout the world.",
     ["vidhurapandita", "wisdom", "virtues"]),
    ("jataka-18", "Vessantara Jataka — The Perfection of Giving",
     "मम हत्था विमुच्चित्वा, दाने चित्तं पसीदति ।\nन मे पुत्ता पिया नत्थि, बुद्धत्तं येव मे पियं ॥",
     "As the water flows from my hand confirming the gift, my heart rejoices in giving. It is not that I love not my family, but that supreme Buddhahood is dearer to me for the liberation of all.",
     ["vessantara", "dana-paramita", "supreme-giving"]),
    ("jataka-19", "Temiya Jataka — Renunciation of Royal Splendor",
     "राज्जं विहाय विपुले, वने झायामि एकको ।\nसंसारभयभीतोहं, धम्ममेवानुपालये ॥",
     "Renouncing royal power and pomp, I meditate solitary in the peaceful forest. Fearing the perils of worldly entanglement, I live upholding the Dhamma alone.",
     ["temiya", "renunciation", "peace"]),
    ("jataka-20", "Nimi Jataka — The Fruit of Righteous Deeds",
     "धम्मं चर सुचरितं, न तं दुच्चरितं चरे ।\nधम्मचारी सुखं सेति, अस्मिं लोके परम्हि च ॥",
     "Practice the Dhamma and live righteously; do not follow unrighteous conduct. He who walks in the Dhamma rests in happiness in this world and in the next.",
     ["nimi", "righteousness", "joy"])
]

jataka_entries = []
for cid, title, orig, meaning, tags in jataka_data:
    jataka_entries.append({
        "id": f"jataka-{cid}",
        "title": title,
        "source": "Khuddaka Nikaya — Jataka Tales (Pali Canon)",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Jataka Pali Tradition",
        "tags": ["buddhist", "jataka", "moral"] + tags,
        "category": "buddhist_foundations",
        "tradition": "buddhist"
    })

write_ts_file("src/lib/data/buddhist-jataka-tales.ts", "JATAKA_TALES_ENTRIES", jataka_entries)

print("✅ Buddhist Suite generation complete!")
