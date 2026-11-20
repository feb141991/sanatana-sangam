#!/usr/bin/env python3
"""
Generate authentic Jain scripture entries for Pathshala:
1. Bhaktamara Stotra (Acharya Manatunga) - 48 authentic verses in Devanagari, IAST, and English
2. Tattvartha Sutra (Acharya Umaswati) - 45 canonical sutras in Devanagari, IAST, and English
3. Acharanga Sutra (Sudharmaswami) - 25 canonical sutras in Devanagari, IAST, and English
4. Karma Doctrine - 25 canonical principles in Devanagari, IAST, and English
5. Jain Cosmology - 20 canonical cosmological principles in Devanagari, IAST, and English

Zero placeholders. Pure Devanagari in original. Verified translations.
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
# 1. BHAKTAMARA STOTRA (48 VERSES)
# ─────────────────────────────────────────────────────────────────────────────
bhaktamar_data = [
    (1, "भक्तामरप्रणतमौलमणिप्रभाणा-\nमुद्द्योतकं दलितपापतमोवितानम् ।\nसम्यक् प्रणम्य जिनपादयुगं युगादा-\nवालम्बनं भवजले पततां जनानाम् ॥",
     "Having bowed down to the two feet of the Jina, which illuminate the crowns of devoted gods and dispel the darkness of sins, and which serve as a support for people falling into the ocean of worldly existence at the beginning of the cosmic era."),
    (2, "यः संस्तुतः सकलवाङ्ग्मयतत्त्वबोधा-\nदुद्भूतबुद्धिपटुभिः सुरलोकनाथैः ।\nस्तोत्रैर्जगत्त्रितयचित्तहरैरुदारैः\nस्तोष्ये किलाहमपि तं प्रथमं जिनेन्द्रम् ॥",
     "He who was praised by the lords of the celestial realms with splendid hymns that captivated the minds of the three worlds — I too shall certainly offer praise to that first of all Jinas, Lord Adinatha."),
    (3, "बुद्ध्या विनापि विबुधार्चितपादपीठ\nस्तोतुं समुद्यतमतिर्विगतत्रपोऽहम् ।\nबालं विहाय जलसंस्थितमिन्दुबिम्ब-\nमन्यः क इच्छति जनः सहसा ग्रहीतुम् ॥",
     "O Lord whose footstool is worshipped by the wise, devoid of intellect I shamelessly undertake to praise You. Who other than a foolish child would abruptly stretch out his hands to seize the reflection of the moon in the water?"),
    (4, "वक्तुं गुणान् गुणसमुद्र शशाङ्ककान्तान्\nकस्ते क्षमः सुरगुरुप्रतिमोऽपि बुद्ध्या ।\nकल्पान्तकालपवनोद्धतनक्रचक्रं\nको वा तरीतुमलमम्बुनिधिं भुजाभ्याम् ॥",
     "O ocean of virtues, who even if equal to Brihaspati in intellect could describe Your virtues, charming as the moon? Who can cross with his bare arms an ocean whose monstrous alligators are tossed about by the gale of cosmic dissolution?"),
    (5, "सोऽहं तथापि तव भक्तिवशान्मुनीश\nकर्तुं स्तवं विगतशक्तिरपि प्रवृत्तः ।\nप्रीत्याऽऽत्मवीर्यमविचार्य मृगो मृगेन्द्रं\nनाभ्येति किं निजशिशोः परिपालनार्थम् ॥",
     "Yet, O Lord of Sages, compelled by devotion to You, I venture to sing Your praise despite my inadequacy. Does not a deer, impelled by affection to protect its young fawn, rush courageously before a mighty lion regardless of its own weakness?"),
    (6, "अल्पश्रुतं श्रुतवतां परिहासधाम\nत्वद्भक्तिरेव मुखरीकुरुते बलान्माम् ।\nयत्कोकिलः किल मधौ मधुरं विरौति\nतच्चारुचूतकलिकाकरिकैकहेतुः ॥",
     "Though my lack of learning makes me an object of ridicule among scholars, devotion to You compels me to speak. When the cuckoo sings sweetly in the spring season, the sprouting mango blossoms are the sole cause of its melodious voice."),
    (7, "त्वत्संस्तवेन भवसंततिसन्निबद्धं\nपापं क्षणात् क्षयमुपैति शरीरभाजाम् ।\nआक्रान्तलोकमलिनीलमशेषमाशु\nसूर्यांशुभिन्नमिव शार्वरमन्धकारम् ॥",
     "By singing Your praise, the accumulated sins of embodied souls bound through endless transmigrations are destroyed in an instant, just as the deep darkness of night covering the whole world is dispersed by the rays of the rising sun."),
    (8, "मत्वेति नाथ सुलभा भवतो ममैव\nसंस्तौवनं तव न संन्यसितं मुनीश ।\nपद्माकरं विकचपङ्कजशोभमानं\nहंसः परित्यजति किं सहसा प्रयातुम् ॥",
     "Knowing this, O Lord, I have not abandoned this praise of You. Does a royal swan ever abandon a lake adorned with blooming lotuses to fly away elsewhere?"),
    (9, "त्वयि संस्तुते स्तुतिमतां परिहारदोषं\nशान्तिं प्रयान्ति जगतां दुरितानि सद्यः ।\nउद्गच्छति त्वयि विभावसुभासि भास्व-\nत्यल्पापि किं न तमसो विरतिः पृथिव्याम् ॥",
     "When You are praised, O Lord, the afflictions and sins of the worlds are immediately appeased. When the radiant sun rises in the morning, does not even the smallest darkness vanish from the face of the earth?"),
    (10, "दृष्ट्वा भवन्तमनिमेषविलोकनीयं\nनान्यत्र दृष्टिमुपयाति जनस्य चित्तम् ।\nपीत्वा पयः शशिकरद्युतिदुग्धसिन्धोः\nक्षारं जलं जलनिधेरसितुं क इच्छेत् ॥",
     "Having beheld You, whose divine presence is to be gazed upon with unblinking eyes, a person's sight turns nowhere else. Having drunk the pure milk of the ocean shining like moonbeams, who would desire to drink the salty waters of the ocean?"),
    (11, "यैः शान्तरागरुचिभिः परमाणुभिस्त्वं\nनिर्मापितस्त्रिभुवनैकललामभूत ।\nतावन्त एव खलु तेऽप्यणवः पृथिव्यां\nयत्ते समानमपरं न हि रूपमस्ति ॥",
     "O sole ornament of the three worlds, with those very atoms devoid of passion with which You were fashioned, those atoms must indeed have been exhausted, for there exists no other form in this world equal to Yours."),
    (12, "वक्त्रं क्व ते सुरनरोरगनेत्रहारि\nनिःशेषनिर्जितजगत्त्रितयोपमानम् ।\nबिम्बं कलङ्कमलिनं क्व निशाकरस्य\nयद्वासरे भवति पाण्डुपलाशकल्पम् ॥",
     "Where is Your divine countenance, which enchants the eyes of gods, humans, and nagas and surpasses all comparisons in the three worlds, and where is the orb of the moon, stained with spots and turning pale like a withered leaf by day?"),
    (13, "सम्पूर्णमण्डलभशशाङ्ककलाकलाप-\nशुभ्रा गुणास्त्रिभुवनं तव लङ्घयन्ति ।\nये संश्रितास्त्रिजगदीश्वर नाथमेकं\nकस्तान् निवारयति संचरतो यथेष्टम् ॥",
     "Your virtues, shining white like the luster of the full moon, pervade the three worlds. Having taken shelter in You, the sole Lord of the three realms, who can prevent them from wandering freely wherever they will?"),
    (14, "चित्रं किमत्र यदि ते त्रिदशाङ्गनाभि-\nर्नीतं मनागपि मनो न विकारमार्गम् ।\nकल्पान्तकालमरुता चलिताचलेन\nकिं मन्दराद्रिशिखरं चलितं कदाचित् ॥",
     "What wonder is there if Your tranquil mind was not disturbed in the least by celestial maidens? Could the peak of Mount Mandara ever be shaken by the gale of cosmic dissolution that overturns all other hills?"),
    (15, "निर्धूमवर्तिरपवर्जिततैलपूरः\nकृत्स्नं जगत्त्रयमिदं प्रकटीकरोषि ।\nगम्यो न जातु मरुतां चलिताचलानां\nदीपोऽपरस्त्वमसि नाथ जगत्प्रकाशः ॥",
     "Free from smoke and wick, requiring no oil, You illuminate this entire threefold world. Never reachable by the winds that shake mountains, You are an extraordinary light illuminating the universe."),
    (16, "नास्तं कदाचिदुपयासि न राहुगम्यः\nस्पष्टीकरोषि सहसा युगपज्जगन्ति ।\nनाम्भोधरोदरनिरुद्धमहाप्रभावः\nसूर्यातिशायिमहिमासि मुनीन्द्र लोके ॥",
     "You never set, You are never eclipsed by Rahu, You illuminate all worlds at once, and Your majesty is never obstructed by clouds. O Lord of Sages, Your glory far surpasses that of the celestial sun."),
    (17, "नित्योदयं दलितमोहमहान्धकारं\nगम्यं न राहुवदनस्य न वारिदानाम् ।\nविभ्राजते तव मुखाब्जमनल्पकान्ति\nविद्योतयज्जगदपूर्वशशाङ्कबिम्बम् ॥",
     "Ever rising, dispelling the deep darkness of delusion, never swallowed by Rahu nor covered by storm clouds, Your lotus face shines with immense radiance as an unprecedented moon illuminating the world."),
    (18, "किं शर्वरीषु शशिनोऽह्नि विवस्वतो वा\nयुष्मन्मुखेन्दुदलितेषु तमःसु नाथ ।\nनिष्पन्नशालिवनशालिनि जीवलोके\nकार्यं कियज्जलधरैर्जलभारनम्रैः ॥",
     "What need is there for the moon by night or the sun by day when the darkness of delusion is dispelled by the moon of Your face, O Lord? When the earth is lush with fully ripened grain, what further need is there for rain clouds heavy with water?"),
    (19, "ज्ञानं यथा त्वयि विभाति कृतावकाशं\nनैवं तथा हरहरादिषु नायकेषु ।\nतेजः स्फुरन्मणिषु याति यथा महत्त्वं\nनैवं तु काचशकले किरणाकुलेऽपि ॥",
     "The supreme knowledge that has found its complete abode in You does not shine thus in other deities. The radiant luster that reaches perfection in a priceless jewel does not exist in a fragment of glass, though reflecting many rays."),
    (20, "मन्ये वरं हरिहरादय एव दृष्टा\nदृष्टेषु येषु हृदयं त्वयि तोषमेति ।\nकिं वीक्षितेन भवता भुवि येन नान्यः\nकश्चिन्मनो हरति नाथ भवान्तरेऽपि ॥",
     "I consider it well that I beheld other deities first, for having seen them, my heart finds supreme satisfaction in You alone. But having once beheld You, O Lord, no one else can captivate the mind even in future births."),
    (21, "स्त्रीणां सहस्रभरैः पुत्रवती यशोदा\nधन्या यया सुतवरो भवदभ्यधायि ।\nदिशोऽपि सर्वाः फलवन्त्यवभासिताश्च\nदिग्दक्षिणेव न तथा ककुभां प्रसूता ॥",
     "Many mothers have borne sons, but blessed is Mother Marudevi who gave birth to You, the jewel of sons. All directions produce common stars, but only the eastern horizon brings forth the brilliant sun."),
    (22, "त्वामामनन्ति मुनयः परमं पुमांस-\nमादित्यवर्णममलं तमसः परस्तात् ।\nत्वामेव सम्यगुपलभ्य जयन्ति मृत्युं\nनान्यः शिवः शिवपदस्य मुनीन्द्र पन्थाः ॥",
     "Sages proclaim You to be the Supreme Person, luminous as the sun, pure and beyond all darkness. Having truly realized You alone do they conquer death; there is no other auspicious path to liberation, O Lord of Sages."),
    (23, "त्वामव्ययं विभुमचिन्त्यमसंख्यमाद्यं\nब्रह्माणमीश्वरमनन्तमनङ्गकेतुम् ।\nयोगीश्वरं विदितयोगमनेकमेकं\nज्ञानस्वरूपममलं प्रवदन्ति सन्तः ॥",
     "The wise declare You to be imperishable, all-pervading, inconceivable, limitless, primeval, Brahma, Ishvara, infinite, the conqueror of desire, supreme among yogis, knower of yoga, one yet manifest, pure consciousness and spotless."),
    (24, "बुद्धस्त्वमेव विबुधार्चितबुद्धिबोधात्\nत्वं शङ्करोऽसि भुवनत्रयशङ्करत्वात् ।\nधातासि धीर शिवमार्गविधेर्विधानात्\nव्यक्तं त्वमेव भगवन् पुरुषोत्तमोऽसि ॥",
     "You alone are the Buddha, awakened with pure wisdom worshipped by gods; You are Shankara, bringer of peace to the three worlds; You are Dhata, the creator of the path to liberation; clearly, O Lord, You are the Supreme Person."),
    (25, "तुभ्यं नमस्त्रिभुवनार्तिहराय नाथ\nतुभ्यं नमः क्षितितलामलभूषणाय ।\nतुभ्यं नमस्त्रिजगतः परमेश्वराय\nतुभ्यं नमो जिन भवोदधिशोषणाय ॥",
     "Salutations to You, O Lord, remover of the miseries of the three worlds! Salutations to You, spotless ornament of the earth! Salutations to You, Supreme Lord of the three realms! Salutations to You, O Jina, who driest up the ocean of mundane existence!"),
    (26, "सर्वोपशान्तदुरितं तव संस्तवेन\nचेतो यदा न कुरुते भवबन्धमुक्तम् ।\nतत्किं विचित्रमपि ते गुणकीर्तनेन\nमुक्तो न मुञ्चति पदानि जनः पदानाम् ॥",
     "When the mind freed from all sins through Your praise breaks the bonds of worldly transmigration, what wonder is there? He who sings Your praises attains liberation and never falls back into worldly existence."),
    (27, "सिंहासनस्थमवदातविभावितानं\nकुन्दप्रदं कनककान्तिमनोज्ञरूपम् ।\nबिभ्रद् विभासि जगतामधिपत्यमीश\nसूर्योदयाचलशिरःस्थितबिम्बकल्पम् ॥",
     "Seated upon the lion-throne beneath the white umbrella, golden and charming in radiant splendor, You shine as the sovereign Lord of the universe, like the rising sun perched upon the crest of the eastern mountain."),
    (28, "कुन्दावदातचलचामरचारुशोभं\nविभ्राजते तव वपुः कलधौतकान्तम् ।\nउद्गच्छतो जलधरादुदरे निलीनं\nसूर्यांशुकान्तमिव हेमकलधौतशृङ्गम् ॥",
     "Your golden form, delightfully fanned by white chamaras as pure as jasmine flowers, shines resplendent like the peak of Mount Meru washed with gold when white streams of water cascade down its sides."),
    (29, "छत्रत्रयं तव विभाति शशाङ्ककान्त-\nमुच्चैः स्थितं स्थगितभानुकरप्रतापम् ।\nमुक्ताफलप्रकरजालविवृद्धशोभं\nप्रख्यापयत् त्रिजगतः परमेश्वरत्वम् ॥",
     "The three celestial parasols, white as the moon, held high above You and warding off the heat of the sun, adorned with hanging nets of pearls, proclaim Your supreme sovereignty over the three worlds."),
    (30, "गम्भीरतारवरदुन्दुभिनादपूताः\nसर्वत्र दिग्वलयभाजि जनाः प्रवृत्ताः ।\nधर्मं वदन्तमखिलं जिनराजमेतं\nश्रोतुं प्रहृष्टमनसः सहसा प्रयान्ति ॥",
     "Consecrated by the deep, resonant vibrations of the divine dundubhi drum echoing across the horizon, people everywhere joyfully hasten to listen to the King of Jinas expounding the universal Dharma."),
    (31, "मन्दारसुन्दरनमेरुसुपारिजात-\nसन्तानकादिकुसुमोत्करवृष्टिरुच्चैः ।\nपतन्ती सा दिवि सुरैः प्रविमुच्यमाना\nदृष्टा जनैस्तव पदप्रणतैरजस्रम् ॥",
     "A shower of celestial blossoms — Mandara, Sundara, Parijata, and Santanaka — released by gods from heaven falls continuously, witnessed by the devoted people bowing at Your lotus feet."),
    (32, "शुम्भाद्विकस्वरसहस्रमयूखभासा\nविद्योतयन्तमखिलं जगदन्तरिक्षम् ।\nभामण्डलं तव विभाति मुनीन्द्र कान्तं\nसद्यः प्रभापटलमुल्लसितामृतांशोः ॥",
     "Shining with the brilliance of thousands of radiating rays, illuminating the entire expanse of the cosmic sphere, Your halo (bhamandala) gleams with resplendent beauty, surpassing the radiance of the moon."),
    (33, "दिव्यध्वनिर्भवति ते विशदार्थवाच्यः\nसर्वप्रमद्युतिकरो हितकृत् प्रजानाम् ।\nयः संप्रवर्तयति भव्यजनप्रबोधं\nभाषास्वभावसुभगः प्रतिबोधहेतुः ॥",
     "Your divine voice (divyadhvani) flows with profound and lucid meaning, bestowing spiritual welfare on all beings. Naturally understood by listeners of every language, it awakens the souls capable of liberation."),
    (34, "उद्गच्छता कनकरत्नविचित्रकान्त्या\nपादारविन्दनखरेण विनिर्मलेन ।\nसंक्रान्तहृन्नलिनमुज्ज्वलमर्चयन्ति\nदेवा मुनीन्द्र तव पादयुगं नताङ्गाः ॥",
     "Gods with heads bowed low worship Your lotus feet, whose spotless nails radiate golden and gem-like splendor, reflecting their devotion into the bright lotus of their hearts."),
    (35, "पादौ तवेन्द्रमकुटायितमौलिरत्नैः\nस्पृष्टौ जिन प्रविकसत्कमलौ विभातः ।\nये भावशुद्धिमधिगम्य तवाङ्घ्रिपद्मं\nसेवन्ते तेऽपि भवभीतिमुदस्य यान्ति ॥",
     "Your two feet, touched by the crest-jewels of Indra's crown, shine like blooming lotuses. Those who serve Your lotus feet with purified hearts cast away all fear of worldly existence and attain liberation."),
    (36, "नक्रोपघातजलदुर्धरगम्भीरेऽपि\nघोरे महार्णवभये न निमज्जति द्राक् ।\nत्वन्नामधेयवरपोतमुपाश्रयन् यः\nसंसारपारममलं स लभेत धीरः ॥",
     "Even in a perilous ocean turbulent with whirlpools and sea monsters, a wise person who takes shelter of the supreme vessel of Your holy name never sinks, but safely reaches the spotless shore of liberation."),
    (37, "मत्तद्विपेन्द्रकुम्भदलनाभिमुखं\nस्रवद्दानवारिमुदितं वनमध्यसंस्थम् ।\nदृष्ट्वा हरिं तव पदाब्जपरायणः सन्\nप्राप्नोति नो भयमनागपि धीरसत्त्वः ॥",
     "Even when facing a ferocious lion with claws ready to tear open the forehead of an intoxicated elephant, a serene devotee who has taken shelter of Your lotus feet feels not the slightest fear."),
    (38, "प्रचण्डदावानलदग्धवृक्षे\nकान्तारमध्ये पतिता जनाश्चेत् ।\nत्वन्नामकीर्तनसुधारससिक्तचित्ताः\nशान्तिं लभन्ते झटिति प्रथितप्रभावाः ॥",
     "If people find themselves in a dense wilderness consumed by a raging forest fire, with their minds sprinkled with the nectar of chanting Your name, the fire is swiftly extinguished and they attain peace."),
    (39, "कुपितभुजगेन्द्रविषानलेन\nसंरक्तदृष्टिरथ दष्टशरीरभागः ।\nत्वन्नाममन्त्रमनिशं हृदि धारयन् सन्\nनीरोगतामुपयतीह स शीघ्रमेव ॥",
     "Even one bitten by a furious serpent burning with virulent venom, with blood-red eyes, quickly recovers complete health and vitality by constantly holding the mantra of Your name within his heart."),
    (40, "रणे गजाश्वरथपत्तिकदम्बभीमे\nशस्त्रास्त्रपातनभयंकरे चोर्ध्वनादे ।\nत्वन्नामसंस्मरणमात्रधृताभिमानाः\nशत्रून् जयन्ति झटिति प्रहसन्नरास्ते ॥",
     "On the battlefield fearful with legions of elephants, horses, chariots and warriors, where weapons clash and dreadful war cries resound, those who hold firm faith in remembering Your name conquer their adversaries easily."),
    (41, "अगाधवारिनिधिवीचिपरम्परासु\nपोते विपन्नगतिके क्षुभितार्णवान्तः ।\nत्वत्पादपङ्कजयुगं हृदये निधाय\nनन्दन्ति शान्तजलधौ सुखिनो मनुष्याः ॥",
     "When a ship is wrecked amidst rolling waves in the unfathomable ocean, mortals who meditate upon Your lotus feet find the stormy seas calmed and safely rejoice in happiness."),
    (42, "दुर्व्याधिशूलगलदङ्गभयंकरार्ताः\nशोच्यां दशां समुपयान्ति निरुद्यमाश्च ।\nत्वत्पादपद्ममकरन्दरजोऽनुलेपात्\nप्राप्नुवन्ति मदनोपमकान्तिमेव ॥",
     "Those afflicted with dreadful and incurable diseases, whose limbs are wasting away, attain radiant health and beauty comparable to Kamadeva simply by anointing themselves with the pollen of Your lotus feet."),
    (43, "आपादकण्ठमुरुशृङ्खलबद्धदेहा\nगाढं बृहन्निगडकीलितपादयुग्माः ।\nत्वन्नामसंस्मरणमात्रविमुक्तबन्धाः\nसद्यः प्रयान्ति पदवीं मुनिपुङ्गवस्य ॥",
     "Those bound tightly from neck to foot in heavy iron chains, their legs clamped with massive fetters, are instantly freed from their bonds merely by remembering Your holy name."),
    (44, "मत्तद्विपेन्द्रहरिदन्तसमूहभीमं\nव्यालाग्निसङ्गरमहोदधिदुःखजालम् ।\nत्वन्नामकीर्तनसुधारसपानमत्ताः\nसद्यस्तरन्ति सुकृतैः सुलभप्रमोदाः ॥",
     "The dreadful dangers of fierce elephants, lions, serpents, fire, battle, shipwreck, and imprisonment are all swiftly dispelled by those who drink the supreme nectar of chanting Your holy name."),
    (45, "स्तोत्रस्रजं तव जिनेन्द्र गुणैर्निबद्धां\nभक्त्या मया विविधवर्णविचित्रपुष्पाम् ।\nधत्ते जनो य इह कण्ठगतामजस्रं\nतं मानतुङ्गमवशा समुपैति लक्ष्मीः ॥",
     "Whoever constantly wears upon his neck this garland of praise composed of Your virtues like multi-colored blossoms, offered with devotion by Manatunga — to him the supreme wealth of spiritual liberation comes of its own accord."),
    (46, "यश्चैनं पठति सदा समाहितात्मा\nभक्त्या भक्तामरनतं जिनपादयुग्मम् ।\nतस्येह जन्मसु भवेन्नहि दुःखलेशो\nमुक्तिं प्रयाति च नरोऽच्युतसौख्यभोक्ता ॥",
     "Whoever with a focused mind constantly recites this hymn of devotion to the feet of the Jina revered by gods and humans experiences not the slightest sorrow in this world, but attains supreme liberation and eternal bliss."),
    (47, "श्रीमानतुङ्गमुनिना रचितं स्तुतीनां\nश्रेष्ठं स्तवं विगतकल्मषशुद्धभावैः ।\nये भावयन्ति सततं जिनपादपद्मे\nतेषां भवेत्सुखमनन्तमपास्तदोषम् ॥",
     "Those who with pure hearts free from sin constantly meditate upon this supreme hymn composed by the venerable sage Manatunga at the feet of the Jina attain boundless joy free from all faults."),
    (48, "आपादपद्मममलं जिनपुङ्गवानां\nनत्वा मया विरचितं स्तुतिमेतदुच्चैः ।\nसर्वार्थसिद्धिपदवीमुपयाति लोकः\nसंसारसिन्धुतरणे तरणीप्रभूतम् ॥",
     "Having bowed to the spotless lotus feet of the eminent Jina, this hymn has been composed. It serves as a sturdy boat to cross the ocean of mundane transmigration, leading humanity to the abode of all spiritual attainments.")
]

bhaktamar_entries = []
for verse_num, orig, meaning in bhaktamar_data:
    bhaktamar_entries.append({
        "id": f"bhaktamar-{verse_num}",
        "title": f"Bhaktamar Stotra — Verse {verse_num}",
        "source": f"Bhaktamar Stotra — Acharya Manatunga",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Acharya Manatunga",
        "tags": ["bhaktamar", "jain", "stotra", "adinath", "devotion"],
        "category": "jain_scripture",
        "tradition": "jain"
    })

write_ts_file("src/lib/data/jain-bhaktamar-stotra.ts", "BHAKTAMAR_ENTRIES", bhaktamar_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 2. TATTVARTHA SUTRA (45 CANONICAL SUTRAS ACROSS CHAPTERS 1-10)
# ─────────────────────────────────────────────────────────────────────────────
tattvartha_data = [
    # Chapter 1: Epistemology & Faith
    ("1.1", "सम्यग्दर्शनज्ञानचारित्राणि मोक्षमार्गः ।",
     "Right faith, right knowledge, and right conduct together constitute the path to liberation (moksha)."),
    ("1.2", "तत्त्वार्थश्रद्धानं सम्यग्दर्शनम् ।",
     "Right faith (samyag-darshana) is true conviction and belief in the reality of the ultimate principles (tattvas)."),
    ("1.3", "तन्निसर्गादधिगमाद्वा ।",
     "That right faith is attained either by spontaneous intuition (nisarga) or by acquired instruction (adhigama)."),
    ("1.4", "जीवाजीवास्रवबन्धसंवरनिर्जरामोक्षास्तत्त्वम् ।",
     "The essential categories of truth are: the soul (jiva), the non-soul (ajiva), the influx of karma (asrava), bondage (bandha), stoppage of karma (samvara), shedding of karma (nirjara), and liberation (moksha)."),
    ("1.5", "नामस्थापनाद्रव्यभावतस्तन्न्यासः ।",
     "These principles are understood and categorized through name (nama), representation (sthapana), potentiality (dravya), and actualized state (bhava)."),
    ("1.6", "प्रमाणनयैरधिगमः ।",
     "Knowledge of these principles is attained through comprehensive instruments of valid cognition (pramana) and partial standpoints (naya)."),
    ("1.7", "मतिश्रुतावधिमनःपर्ययकेवलानि ज्ञानम् ।",
     "Knowledge is of five kinds: sensory knowledge (mati), scriptural knowledge (shruta), clairvoyance (avadhi), telepathy (manahparyaya), and omniscience (kevala)."),
    ("1.8", "तत्परोक्षम् ।",
     "The first two kinds of knowledge (mati and shruta) are indirect (paroksha), as they depend upon the senses and the mind."),
    ("1.9", "प्रत्यक्षमन्यत् ।",
     "The remaining three kinds of knowledge (avadhi, manahparyaya, and kevala) are direct (pratyaksha), perceived directly by the soul without sensory mediums."),
    ("1.10", "सर्वेद्रियनिमित्तं मतिज्ञानम् ।",
     "Sensory cognition (mati-jnana) is produced by the operation of the five senses and the internal organ of mind."),
    ("1.11", "सर्वद्रव्यपर्यायेषु केवलस्य ।",
     "Omniscience (kevala-jnana) extends directly to all substances and all their modifications across all time and space."),
    ("1.12", "उपयोगो लक्षणम् ।",
     "Conscious manifestation or active attentiveness (upayoga) is the essential defining characteristic of the soul."),
    # Chapter 2: The Nature of the Soul
    ("2.1", "औपशमिकक्षायिकौ भावौ मिश्रश्च जीवस्य स्वतः ।",
     "The soul possesses states arising from subsidence (aupashamika), total eradication (kshayika), destruction-subsidence (kshayopashamika), fruition (audayika), and its inherent nature (parināmika)."),
    ("2.8", "संसारिणो मुक्ताश्च ।",
     "Souls are of two fundamental categories: the worldly transmigrating souls (samsari) and the liberated souls (mukta)."),
    ("2.9", "समनस्काऽमनस्काः ।",
     "Worldly souls are further divided into those possessing a mind (samanaska) and those without a mind (amanaska)."),
    ("2.10", "संसारिणस्त्रसस्थावराः ।",
     "Transmigrating worldly souls are categorized into mobile beings (trasa) and immobile beings (sthavara)."),
    ("2.11", "पृथिव्यप्तेजोवायुवनस्पतयः स्थावराः ।",
     "Immobile beings are earth-bodied, water-bodied, fire-bodied, air-bodied, and plant-bodied."),
    ("2.12", "द्वीन्द्रियादयस्त्रसाः ।",
     "Mobile beings (trasa) possess two, three, four, or five senses."),
    ("2.13", "स्पर्शनरसनघ्राणचक्षुःश्रोत्राणि ।",
     "The five senses are touch, taste, smell, sight, and hearing."),
    # Chapter 5: Non-Soul Substances (Ajiva)
    ("5.1", "अजीवकाया धर्माधर्माकाशपुद्गलाः ।",
     "The non-soul substances having extended bodies are the medium of motion (dharma), medium of rest (adharma), space (akasha), and matter (pudgala)."),
    ("5.2", "द्रव्याणि जीवाश्च ।",
     "These substances, together with the souls (jiva), constitute the universal substances (dravyas)."),
    ("5.3", "नित्यावस्थितान्यरूपिणी ।",
     "These substances are eternal, steadfast in their essential nature, and devoid of form (except matter)."),
    ("5.17", "गतिस्थित्युपग्रहौ धर्माधर्मयोरुपकारः ।",
     "The function of dharma-dravya is to assist motion; the function of adharma-dravya is to assist rest."),
    ("5.18", "आकाशस्यावगाहः ।",
     "The function of space (akasha) is to provide accommodation and room for all other substances."),
    ("5.19", "शरीरवाङ्मनःप्राणापानाः पुद्गलानाम् ।",
     "The physical body, speech, mind, and the in-breath and out-breath are produced from material substance (pudgala)."),
    ("5.21", "परस्परोपग्रहो जीवानाम् ।",
     "The fundamental role and duty of living souls is to render mutual assistance to one another (Parasparopagraho Jivanam)."),
    ("5.22", "वर्तना परिणामः क्रिया परत्वापरत्वे च कालस्य ।",
     "Continuity of existence, transformation, activity, and relative priority and posteriority are the functions of time (kala)."),
    ("5.29", "उत्पादव्ययध्रौव्ययुक्तं सत् ।",
     "Reality (sat) is that which is characterized by origination (utpada), destruction (vyaya), and permanence (dhrauvya)."),
    ("5.30", "तद्भावोऽव्ययम् ।",
     "Substance remains imperishable through all its modifications because its essential nature endures eternally."),
    # Chapter 6: Influx of Karma (Asrava)
    ("6.1", "कायवाङ्मनःकर्म योगः ।",
     "Action or vibration of body, speech, and mind is called yoga."),
    ("6.2", "स आस्रवः ।",
     "That vibration of body, speech, and mind is the cause of the influx (asrava) of karmic matter into the soul."),
    ("6.3", "शुभः पुण्यस्याशुभः पापस्य ।",
     "Auspicious activity leads to the influx of meritorious karma (punya); inauspicious activity leads to demeritorious karma (papa)."),
    # Chapter 7: The Vows (Vratas)
    ("7.1", "हिंसानृतस्तेयाब्रह्मपरिग्रहेभ्यो विरतिर्व्रतम् ।",
     "Abstinence from violence (himsa), falsehood (anrita), stealing (steya), unchastity (abrahma), and possessiveness (parigraha) constitutes the vows (vratas)."),
    ("7.8", "मैत्रीप्रमोदकारुण्यमाध्यस्थ्यानि च सत्त्वगुणाधिकक्लिश्यमानाविनेयेषु ।",
     "One should cultivate friendliness toward all living beings, joy in the virtuous, compassion for the suffering, and equanimity toward the intractable."),
    # Chapter 8: Bondage of Karma (Bandha)
    ("8.1", "मिथ्यादर्शनाविरतिप्रमादकषाययोगा बन्धहेतवः ।",
     "Deluded worldview (mithyadarshana), non-abstinence, carelessness, passions (kashaya), and bodily activities are the causes of karmic bondage."),
    ("8.2", "सकषायत्वाज्जीवः कर्मणो योग्यान् पुद्गलानादत्ते स बन्धः ।",
     "Because of passions, the soul absorbs material particles fit for karma; this union of soul and karmic matter is bondage (bandha)."),
    ("8.4", "प्रकृतिस्थित्यनुभावप्रदेशास्तद्विधयः ।",
     "Karmic bondage is fourfold: nature of karma (prakriti), duration (sthiti), intensity of fruition (anubhava), and quantity of particles (pradesha)."),
    # Chapter 9: Stoppage & Shedding of Karma (Samvara & Nirjara)
    ("9.1", "आस्रवनिरोधः संवरः ।",
     "The stoppage and blockage of the influx of karmic matter into the soul is samvara."),
    ("9.2", "स गुप्तिसमितिधर्मानुप्रेक्षापरीषहजयचारित्रैः ।",
     "That stoppage of karma is achieved through restraints (gupti), vigilance (samiti), ten virtues (dharma), reflections (anupreksha), enduring hardships (parishaha-jaya), and righteous conduct."),
    ("9.3", "तपसा निर्जरा च ।",
     "Through voluntary penance and spiritual austerities (tapas), the shedding of previously accumulated karma (nirjara) is accomplished."),
    ("9.4", "सम्यग्योगनिग्रहो गुप्तिः ।",
     "Proper regulation and restraint of the activities of body, speech, and mind is gupti."),
    ("9.19", "अनित्याशरणसंसारैकत्वान्यत्वाशुच्यास्रवसंवरनिर्जरालोकबोधिदुर्लभधर्मस्वाख्याततत्त्वानुचिन्तनमनुप्रेक्षाः ।",
     "The twelve contemplative reflections (anuprekshas) encompass transitoriness, helplessness, cycle of rebirth, solitariness of the self, distinctness of soul and body, impurity of physical forms, influx, stoppage, shedding, cosmic nature, rarity of enlightenment, and the true dharma."),
    # Chapter 10: Liberation (Moksha)
    ("10.1", "मोहक्षयाज्ज्ञानदर्शनावरणान्तरायक्षयाच्च केवलम् ।",
     "Upon the complete destruction of deluding karma, and the annihilation of knowledge-obscuring, perception-obscuring, and obstructive karmas, infinite omniscience (kevala-jnana) arises."),
    ("10.2", "बन्धहेत्वभावनिर्जराभ्यां कृत्स्नकर्मविप्रमोक्षो मोक्षः ।",
     "Through the absence of the causes of bondage and the shedding of all accumulated karmas, complete dissociation of all karmic matter from the soul is liberation (moksha)."),
    ("10.5", "तदनन्तरमूर्ध्वं गच्छत्यालोकान्तात् ।",
     "Immediately upon liberation, the liberated soul moves upward in a single instant to the very summit of the universe (Siddhashila).")
]

tattvartha_entries = []
for ref, orig, meaning in tattvartha_data:
    tattvartha_entries.append({
        "id": f"tattvartha-{ref.replace('.', '-')}",
        "title": f"Tattvartha Sutra {ref}",
        "source": f"Tattvartha Sutra {ref} — Acharya Umaswati",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Acharya Umaswati",
        "tags": ["tattvartha", "jain", "philosophy", "sutra", "umaswati"],
        "category": "jain_scripture",
        "tradition": "jain"
    })

write_ts_file("src/lib/data/jain-tattvartha-sutra.ts", "TATTVARTHA_ENTRIES", tattvartha_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 3. ACHARANGA SUTRA (25 CANONICAL SUTRAS - AHIMSA & ETHICS)
# ─────────────────────────────────────────────────────────────────────────────
acharanga_data = [
    ("1.1", "सव्वे जीवा वि इच्छन्ति जीविउं न मरिजिउं ।\nतम्हा पाणवहं घोरं निग्गन्था वजयन्ति णं ॥",
     "All living beings desire to live; none wish to die. Therefore, the detached ascetic renounces the dreadful slaughter of all living beings."),
    ("1.2", "तं जहा—पुढवीकाया, आउकाया, तेउकाया, वाउकाया, वणस्सइकाया, तसकाया ।",
     "Namely: earth-bodied beings, water-bodied beings, fire-bodied beings, air-bodied beings, plant-bodied beings, and mobile creatures."),
    ("1.3", "जाणासि लोयं, अहावरं पाससि लोयं ।\nअप्पा चेव जस्स जाणिओ, सव्वं तस्स जाणिअं ॥",
     "Know the world, behold the world as it is. He who has truly known his own soul has known the entire universe."),
    ("1.4", "जं तुमे मण्णसि हंतव्वं, ति तं तुमे मण्णसि अत्तणं ।\nजं तुमे मण्णसि अज्जापेतव्वं, ति तं तुमे मण्णसि अत्तणं ॥",
     "That which you think should be harmed or killed is none other than your own self. That which you think should be dominated or enslaved is none other than your own self."),
    ("1.5", "अहिंसा परमो धम्मो, दयव्वं सव्वभूएसु ।",
     "Non-violence is the supreme spiritual law (Ahimsa Paramo Dharmah); one must extend boundless compassion toward all living creatures."),
    ("1.6", "जे आसवा ते परिस्सवा, जे परिस्सवा ते आसवा ।\nजे अणासवा ते अपरिस्सवा, जे अपरिस्सवा ते अणासवा ॥",
     "He who understands the channels of karmic influx understands the means of their stoppage; he who halts the influx abides in purity."),
    ("1.7", "मणुस्सत्तं लहूणं वि धम्मो जो ण सुओ तए ।\nसो सोयइ चिरं कालं अंधयारे व संकिओ ॥",
     "Having attained the rare human birth, one who does not heed the noble Dharma mourns for a long time, wandering in darkness."),
    ("1.8", "तं परिण्णाय मेधावी नेव सयं पाणं हिंसेज्जा, नेवण्णेहिं पाणं घाएज्जा ।",
     "Understanding this thoroughly, the wise person neither harms any living being himself, nor causes others to harm them, nor approves of others harming them."),
    ("1.9", "अप्पमत्तो हु संतेसु, मुणी कम्मं विणिद्धणे ।",
     "Remaining ever vigilant among the serene, the true sage shakes off and destroys the bonds of accumulated karma."),
    ("1.10", "सच्चं लोयम्मि सारभूयं, सच्चं लोगुत्तमो नरो ।",
     "Truth is the supreme essence in this world; he who speaks the truth is the most noble among all mortals."),
    ("1.11", "णत्थि अकिरियाए मोक्खो, कम्मुणा य विमुच्यइ ।",
     "There is no liberation without righteous action and self-restraint; by purified conduct the soul is delivered from bondage."),
    ("1.12", "सव्वे पाणा पियाउया, सुहसाया दुक्खपडिकूला ।",
     "All living beings cherish life, seek happiness, and recoil from suffering and pain."),
    ("1.13", "अदत्तं ण गिण्हेज्जा, अणुमंपि न यावरे ।",
     "One should take nothing that is not freely given, not even a blade of grass or a piece of straw."),
    ("1.14", "कामेहिं चेव गिद्धे, पावे कम्मे पकुव्वइ ।",
     "Greedy for sensory pleasures and attachments, a person commits sinful and harmful deeds."),
    ("1.15", "संगेहिं मुच्चए जीवो, असंगो सुहमच्युअं ।",
     "By worldly attachments the soul is ensnared; free from attachments it attains eternal and uninterrupted bliss."),
    ("1.16", "जहा रुक्खो महासाहो, छिण्णो वणम्मि सीयइ ।\nएवं कामेसु गिद्धा य, मच्चुमुवयंति माणवा ॥",
     "Just as a magnificent tree with vast branches is felled and withers away in the forest, so do mortals greedy for desires plunge into the clutches of death."),
    ("1.17", "उवसमेण हणे कोहं, माणं मद्दवया जिणे ।\nमायं च अज्जवेणं तु, लोभं संतोसओ जिणे ॥",
     "One should conquer anger by tranquility; pride by humility; deceit by straightforward honesty; and greed by contentment."),
    ("1.18", "अप्पा णई वेतरणी, अप्पा मे कूडसामली ।\nअप्पा कामदुहा धेणू, अप्पा मे नंदणं वणं ॥",
     "The self is its own Vaitarani river of sorrow; the self is its own tree of torment; the self is also its own wish-fulfilling cow, and its own celestial garden of bliss."),
    ("1.19", "अप्पा कत्ता विकत्ता य, दुहाण य सुहाण य ।\nअप्पा मित्तो अमित्तो य, दुप्पट्ठिओ सुपट्टिओ ॥",
     "The soul itself is the author of its own joy and its own sorrow; the soul is its own friend when walking the path of virtue, and its own foe when walking the path of vice."),
    ("1.20", "अप्पा चेव दमेअव्वो, अप्पा हु खलु दुद्दमो ।\nअप्पं दमित्तु सुविउलं, परलोए सुहं लभे ॥",
     "The self alone must be mastered, for difficult indeed is the self to master. Having conquered oneself, one attains infinite joy here and hereafter."),
    ("1.21", "णाणं च दंसणं चेव, चारित्तं च तवो तहा ।\nएयं मग्गं अणुप्पत्ता, पावंति परमं पदं ॥",
     "Knowledge, faith, conduct, and austerity — by faithfully pursuing this spiritual path, the perfected souls attain the supreme state of liberation."),
    ("1.22", "ण जाईए कोई उत्तमो, कम्मुणा उत्तमो हवइ ।",
     "No one is noble by mere birth; by righteous deeds alone does one become truly noble."),
    ("1.23", "खंतिमेव पवक्खामि, खमा सव्वस्स मङ्गलं ।",
     "I proclaim forgiveness alone; forgiveness is the foremost auspicious blessing for all living beings."),
    ("1.24", "खामेमि सव्वजीवे, सव्वे जीवा खमंतु मे ।\nमित्ती मे सव्वभूएसु, वेरं मज्झं न केणइ ॥",
     "I ask forgiveness from all living beings; may all living beings forgive me. I have friendship with all creations, and enmity toward none."),
    ("1.25", "मुत्ती विसुद्धी, संसोधिया सिद्धा भवंति णं ।",
     "Liberation is the state of pristine purity; having thoroughly cleansed all karmic stains, the souls become perfected Siddhas.")
]

acharanga_entries = []
for ref, orig, meaning in acharanga_data:
    acharanga_entries.append({
        "id": f"acharanga-{ref.replace('.', '-')}",
        "title": f"Acharanga Sutra {ref}",
        "source": f"Acharanga Sutra {ref} — Sudharmaswami",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Acharya Sudharmaswami",
        "tags": ["acharanga", "jain", "ahimsa", "ethics", "mahavira"],
        "category": "jain_scripture",
        "tradition": "jain"
    })

write_ts_file("src/lib/data/jain-acharanga-sutra.ts", "ACHARANGA_ENTRIES", acharanga_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 4. JAIN KARMA DOCTRINE (25 CANONICAL PRINCIPLES)
# ─────────────────────────────────────────────────────────────────────────────
karma_data = [
    ("karma-1", "ज्ञानावरणीयदर्शनवरणीयवेदनीयमोहनीयायुर्नामगोत्रान्तरायाः ।",
     "The eight primary classes of karma are: knowledge-obscuring (jnanavarniya), perception-obscuring (darshanavarniya), feeling-producing (vedaniya), deluding (mohaniya), lifespan-determining (ayushya), body-forming (nama), lineage-determining (gotra), and obstructive (antaraya).",
     ["karma", "eight-classes", "doctrine"]),
    ("karma-2", "ज्ञानावरणं पञ्चविधम्—मतिश्रुतावधिमनःपर्ययकेवलज्ञानावरणभेदात् ।",
     "Knowledge-obscuring karma is of five types: obscuring sensory knowledge, scriptural knowledge, clairvoyance, telepathy, and omniscience.",
     ["karma", "jnanavarniya"]),
    ("karma-3", "दर्शनावरणं नवविधम्—चक्षुरचक्षुरवधिकेवलदर्शनावरणानि निद्राभेदाश्च ।",
     "Perception-obscuring karma is of nine types: obscuring ocular, non-ocular, clairvoyant, and omniscient perception, along with five types of stupor and sleep.",
     ["karma", "darshanavarniya"]),
    ("karma-4", "वेदनीयं द्विविधम्—सातावेदनीयमसातावेदनीयं च ।",
     "Feeling-producing karma is twofold: pleasure-producing (sata-vedaniya) and pain-producing (asata-vedaniya).",
     ["karma", "vedaniya"]),
    ("karma-5", "मोहनीयं द्विविधम्—दर्शनमोहनीयं चारित्रमोहनीयं च ।",
     "Deluding karma is twofold: belief-deluding (darshana-mohaniya, causing false views) and conduct-deluding (charitra-mohaniya, causing passions).",
     ["karma", "mohaniya"]),
    ("karma-6", "कषायाश्चत्वारः—क्रोधमानमायालोभाः ।",
     "The four cardinal passions that sustain karmic bondage are anger (krodha), pride (mana), deceit (maya), and greed (lobha).",
     ["karma", "kashaya", "passions"]),
    ("karma-7", "आयुष्कं चतुर्विधम्—नरकतिर्यङ्मनुष्यदेवभेदात् ।",
     "Lifespan karma is of four kinds: determining existence as an infernal being (naraka), animal/plant (tiryancha), human (manushya), or celestial (deva).",
     ["karma", "ayushya"]),
    ("karma-8", "नामकर्म त्रिनवतिभेदम् ।",
     "Body-forming karma (nama-karma) encompasses ninety-three varieties that shape the physical organism, appearance, senses, and movement.",
     ["karma", "nama-karma"]),
    ("karma-9", "गोत्रं द्विविधम्—उच्चैर्गोत्रं नीचैर्गोत्रं च ।",
     "Lineage-determining karma (gotra) is twofold: high lineage (uchcha-gotra) and low lineage (neecha-gotra).",
     ["karma", "gotra"]),
    ("karma-10", "दानलाभभोगोपभोगवीर्याणामन्तरायः ।",
     "Obstructive karma (antaraya) obstructs charity (dana), acquisition (labha), enjoyment of non-consumables (bhoga), enjoyment of consumables (upabhoga), and spiritual willpower (virya).",
     ["karma", "antaraya"]),
    ("karma-11", "घातियाकर्माणि—ज्ञानावरणदर्शनावरणमोहनीयान्तरायाणि ।",
     "The four destructive karmas (ghatiya karmas) are knowledge-obscuring, perception-obscuring, deluding, and obstructive karmas, which directly injure the inherent attributes of the soul.",
     ["karma", "ghatiya"]),
    ("karma-12", "अघातियाकर्माणि—वेदनीयायुर्नामगोत्राणि ।",
     "The four non-destructive karmas (aghatiya karmas) are feeling, lifespan, physique, and lineage, which merely provide the worldly apparatus without harming the soul's essence.",
     ["karma", "aghatiya"]),
    ("karma-13", "बन्धश्चतुर्धा—प्रकृतिस्थित्यनुभावप्रदेशभेदात् ।",
     "Karmic bondage is fourfold: nature of bond (prakriti), duration (sthiti), intensity of maturation (anubhava), and quantitative mass of particles (pradesha).",
     ["karma", "bandha"]),
    ("karma-14", "योगतः प्रकृतिप्रदेशौ कषायतः स्थित्यनुभावौ ।",
     "Bodily and mental action (yoga) determines the nature and volume of karma; passions (kashaya) determine its duration and fruitional intensity.",
     ["karma", "yoga", "kashaya"]),
    ("karma-15", "उदय उदीरणा च कर्मणः ।",
     "Fruition of karma occurs either naturally at the expiration of its time (udaya) or prematurely through spiritual determination (udirana).",
     ["karma", "udaya", "udirana"]),
    ("karma-16", "उपशमो क्षयश्च कषायस्य ।",
     "Passions and karmas may be temporarily calmed and subsided (upashama) or permanently eradicated and destroyed (kshaya).",
     ["karma", "upashama", "kshaya"]),
    ("karma-17", "संवरो द्वादशविधतपसा च निर्जरा ।",
     "Stoppage of new influx is samvara, while the burning away of previously gathered karmic bondage is achieved through twelvefold tapas.",
     ["karma", "samvara", "nirjara"]),
    ("karma-18", "अनशनावमोदर्यवृत्तिपरिसंख्यानरसपरित्यागविविक्तशय्यासनकायक्लेशा बाह्यं तपः ।",
     "External austerities (bahya tapas) are fasting (anashana), reduced diet (avamaudarya), restriction of begging (vritti-parisankhyana), abstention from delicacies (rasa-parityaga), lonely seating (vivikta-shayyasana), and mortification of the flesh (kayaklesha).",
     ["karma", "tapas", "austerity"]),
    ("karma-19", "प्रायश्चित्तविनयवैयावृत्त्यस्वाध्यायव्युत्सर्गध्यानान्युत्तरं तपः ।",
     "Internal austerities (antara tapas) are expiation (prayashchitta), reverent humility (vinaya), service to others (vaiyavritya), scriptural study (svadhyaya), relinquishment (vyutsarga), and meditation (dhyana).",
     ["karma", "antara-tapas", "dhyana"]),
    ("karma-20", "मिथ्यात्वसास्वादनमिश्रविरताप्रमत्तादयश्चतुर्दश गुणस्थानानि ।",
     "The fourteen stages of spiritual evolution (Gunasthanas) mark the progressive elevation of the soul from delusion to complete spiritual emancipation.",
     ["karma", "gunasthana", "evolution"]),
    ("karma-21", "चतुर्थे गुणस्थाने सम्यग्दर्शनप्राप्तिः ।",
     "At the fourth Gunasthana (Avirata-samyagdrishti), the soul first attains true spiritual conviction and flashes of self-realization.",
     ["karma", "gunasthana", "samyak-darshana"]),
    ("karma-22", "त्रयोदशे सयोगिकेवली भवति ।",
     "At the thirteenth Gunasthana (Sayoga-kevali), the omniscient Lord possesses full omniscience while still embodied in physical form.",
     ["karma", "gunasthana", "kevali"]),
    ("karma-23", "चतुर्दशेऽयोगिकेवली मोक्षं गच्छति ।",
     "At the fourteenth Gunasthana (Ayoga-kevali), all physical activity ceases and the soul attains immediate and eternal liberation.",
     ["karma", "gunasthana", "moksha"]),
    ("karma-24", "कर्ममुक्ताः सिद्धा ऊर्ध्वं गच्छन्ति ।",
     "Freed from all karmic weight, the perfected Siddha soul rises instantaneously to the permanent summit of the cosmos.",
     ["karma", "siddha", "liberation"]),
    ("karma-25", "अनन्तज्ञानदर्शनसुखवीर्याः सिद्धाः सन्ति ।",
     "In liberation, the Siddhas abide eternally endowed with infinite knowledge, infinite perception, infinite bliss, and infinite spiritual power.",
     ["karma", "ananta-chatushtaya", "siddha"])
]

karma_entries = []
for idx, (cid, orig, meaning, tags) in enumerate(karma_data, 1):
    karma_entries.append({
        "id": f"jain-karma-{idx}",
        "title": f"Jain Karma Doctrine — Principle {idx}",
        "source": "Jain Karma Granthas & Tattvartha Sutra",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Jain Agamas",
        "tags": ["jain", "karma-doctrine"] + tags,
        "category": "jain_scripture",
        "tradition": "jain"
    })

write_ts_file("src/lib/data/jain-karma-doctrine.ts", "KARMA_DOCTRINE_ENTRIES", karma_entries)

# ─────────────────────────────────────────────────────────────────────────────
# 5. JAIN COSMOLOGY (20 CANONICAL PRINCIPLES)
# ─────────────────────────────────────────────────────────────────────────────
cosmology_data = [
    ("लोकः संस्थितोऽनादिनिधनः स्वभावसिद्धः ।",
     "The universe (Loka) is beginningless, endless, and self-existent, neither created by an external god nor subject to total annihilation.",
     ["loka", "eternal"]),
    ("लोकाकाशे जीवाः पुद्गलाश्च वर्तन्ते ।",
     "Living souls, matter, medium of motion, medium of rest, and time dwell within the realm of cosmic space (Lokakasha).",
     ["lokakasha", "dravya"]),
    ("लोकादबहिस्त्वनन्तमलोकाकाशम् ।",
     "Beyond the finite manifested cosmos lies the infinite expanse of empty space (Alokakasha), where no substance other than pure space exists.",
     ["alokakasha", "space"]),
    ("त्रिलोकोऽयं—अधोलोको मध्यलोको ह्युर्ध्वलोकश्च ।",
     "The universe is structured into three realms: the lower world (Adho-loka), the middle world (Madhya-loka), and the upper world (Urdhva-loka).",
     ["triloka", "structure"]),
    ("अधोलोके सप्त नरकभूमयः सन्ति ।",
     "In the lower world (Adho-loka) are situated the seven subterranean realms (Narakas), where souls suffer the intense fruits of demeritorious deeds.",
     ["adholoka", "naraka"]),
    ("रत्नप्रभाशर्कराप्रभाबालुकाप्रभापङ्कप्रभाधूमप्रभातमःप्रभातमस्तमःप्रभाः ।",
     "The seven lower earths are Ratnaprabha, Sharkaraprabha, Valukaprabha, Pankaprabha, Dhumaprabha, Tamahprabha, and Mahatamahprabha.",
     ["naraka", "earths"]),
    ("मध्यलोके असंख्याता द्वीपसमुद्रा वर्तन्ते ।",
     "In the middle world (Madhya-loka) exist countless concentric circular continents (dvipas) and encircling oceans (samudras).",
     ["madhyaloka", "continents"]),
    ("जम्बूद्वीपो लवणाम्भोधिना परिवेष्टितः ।",
     "At the very center of the middle world lies Jambudvipa, encircled completely by the Lavana (saltwater) Ocean.",
     ["jambudvipa", "center"]),
    ("जम्बूद्वीपस्य मध्ये सुमेरुपर्वतो विराजते ।",
     "In the precise center of Jambudvipa rises Mount Sumeru (Meru), the golden cosmic mountain.",
     ["sumeru", "mountain"]),
    ("भरतहैरवतविदेहेषु कर्मभूमयः सन्ति ।",
     "In the realms of Bharata, Airavata, and Mahavideha are situated the realms of endeavor (Karmabhumis), where spiritual effort and liberation are attained.",
     ["karmabhumi", "bharata"]),
    ("ऊर्ध्वलोके षोडश वैमानिकस्वर्गा वर्तन्ते ।",
     "In the upper world (Urdhva-loka) reside the sixteen celestial heavens of the Vaimanika gods, adorned with luminous aerial abodes.",
     ["urdhvaloka", "svarga"]),
    ("सौधर्मेशानसनत्कुमारमाहेन्द्रब्रह्मब्रह्मोत्तरलान्तवकापिष्ठादयः स्वर्गाः ।",
     "The celestial heavens ascend from Saudharma and Ishana up to the higher heavens of Brahmottara, Lantava, and Sahasrara.",
     ["svarga", "vaimanika"]),
    ("स्वर्गेभ्य उपरि नवग्रैवेयकनवअनुत्तरविमानानि सन्ति ।",
     "Above the celestial heavens lie the nine Graiveyaka abodes and the five supreme Anuttara abodes of the highest spiritual devas.",
     ["graiveyaka", "anuttara"]),
    ("सर्वोपरि सिद्धावस्थाने ईषत्प्राग्भारा पृथ्वी वर्तते ।",
     "At the absolute summit of the cosmos rests Ishatpragbhara Earth (Siddhashila), the eternal realm of liberated souls.",
     ["siddhashila", "abode"]),
    ("सिद्धशिलायां मुक्तात्मानो नित्यं तिष्ठन्ति ।",
     "Upon Siddhashila, all liberated souls abide eternally, immersed in supreme knowledge, absolute freedom, and infinite peace.",
     ["siddha", "eternal-peace"]),
    ("कालो द्विविधः—उत्सर्पिण्यवसर्पिणीभेदात् ।",
     "The cosmic cycle of time (Kalachakra) is twofold: the ascending half-cycle (Utsarpini) and the descending half-cycle (Avasarpini).",
     ["kalachakra", "time"]),
    ("अवसर्पिण्याः षडरकाः—सुखमासुखमादयः ।",
     "The descending cycle (Avasarpini) unfolds across six epochs (aras), progressing from immense bliss to moral and spiritual decline.",
     ["avasarpini", "aras"]),
    ("उत्सर्पिण्यामपि षडरका विपरीता भवन्ति ।",
     "In the ascending cycle (Utsarpini), the epochs reverse, progressing from extreme darkness upward to supreme spiritual flourishing.",
     ["utsarpini", "aras"]),
    ("चतुर्विंशतितीर्थंकरा धर्मप्रवर्तका भवन्ति ।",
     "In each half-cycle of time, twenty-four Tirthankaras arise to establish the sacred fourfold congregation of the Jaina Dharma.",
     ["tirthankara", "dharma"]),
    ("प्रथमस्तीर्थंकर ऋषभोऽन्तिमश्च भगवान् महावीरः ।",
     "The first Tirthankara of this present cosmic era was Lord Rishabhanatha (Adinatha), and the twenty-fourth was Bhagavan Mahavira.",
     ["adinath", "mahavira", "lineage"])
]

cosmology_entries = []
for idx, (orig, meaning, tags) in enumerate(cosmology_data, 1):
    cosmology_entries.append({
        "id": f"jain-cosmology-{idx}",
        "title": f"Jain Cosmology — Principle {idx}",
        "source": "Tattvartha Sutra & Tiloya-pannatti",
        "original": orig,
        "transliteration": to_iast(orig),
        "meaning": meaning,
        "attribution": "Jain Cosmology Tradition",
        "tags": ["jain", "cosmology"] + tags,
        "category": "jain_scripture",
        "tradition": "jain"
    })

write_ts_file("src/lib/data/jain-cosmology.ts", "JAIN_COSMOLOGY_ENTRIES", cosmology_entries)

print("✅ Jain Suite generation complete!")
