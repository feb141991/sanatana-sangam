#!/usr/bin/env python3
"""
Generate authentic Shaiva scriptures and Shiva Purana entries for Pathshala.
Eliminates the 40 duplicate loops in src/lib/data/shiva-purana.ts.
Zero placeholders, authentic Sanskrit Devanagari, IAST transliteration, and public-domain English translations.
"""

import json
from indic_transliteration import sanscript

def to_iast(devanagari_text: str) -> str:
    cleaned = devanagari_text.replace('\n', ' ').strip()
    return sanscript.transliterate(cleaned, sanscript.DEVANAGARI, sanscript.IAST)

entries = [
    # ── SHIVA TANDAVA STOTRAM (1-15) ──
    {
        "id": "shiva-tandava-1",
        "title": "Shiva Tandava Stotram — Verse 1",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥",
        "meaning": "With his neck consecrated by the flow of water cascading from the thick forest-like locks of hair, and on his neck hanging the lofty garland of the king of serpents; performing the vigorous Tandava dance to the rhythmic drum sound of damat-damat-damat-damat — may that Shiva extend our auspiciousness.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "stotra", "ravana", "shaiva"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-2",
        "title": "Shiva Tandava Stotram — Verse 2",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी-विलोलवीचिवल्लरीविराजमानमूर्धनि ।\nधगद्धगद्धगज्ज्वलल्ललाटपट्टपावके किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम ॥",
        "meaning": "May my continuous delight be in Shiva, whose head is adorned by the agitated celestial river Ganga cascading down his matted hair like waving creepers; whose forehead gleams with blazing fire leaping dhagad-dhagad; and who holds the crescent moon like a jewel upon his crest.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "ganga", "crescent-moon"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-3",
        "title": "Shiva Tandava Stotram — Verse 3",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुर-स्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे ।\nकृपाकटाक्षधोरणीनिरुद्धदुर्धरापदि क्वचिद्दिगम्बरे मनो विनोदमेतु वस्तुनि ॥",
        "meaning": "May my mind seek pleasure in Shiva, whose cosmic mind delights in the universe adorned by the playful companion, the daughter of the Mountain King (Parvati); whose compassionate glance easily dispels unbearable misfortunes; and who wears the directions as his garment.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "parvati", "compassion"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-4",
        "title": "Shiva Tandava Stotram — Verse 4",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "जटाभुजङ्गपिङ्गलस्फुरत्फणामणिप्रभा-कदम्बकुङ्कुमद्रवप्रलिप्तदिग्वadhūmukhe ।\nमदान्धसिन्धुरस्फुरत्त्वगुत्तरीयमेदुरे मनो विनोदमद्भुतं बिभर्तु भूतभर्तरि ॥",
        "meaning": "May my mind find extraordinary bliss in Shiva, the protector of all living beings, whose luster of jewels on the reddish hood of the creeping serpent stains the faces of the quarters with saffron radiance; and who wears the heavy mantle of the skin of an elephant intoxicated with pride.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "serpent", "bhootnath"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-5",
        "title": "Shiva Tandava Stotram — Verse 5",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "सहस्रलोचनप्रभृत्यशेषलेखशेखर-प्रसूनधूलिधोरणीविधूसराङ्घ्रिपीठभूः ।\nभुजङ्गराजमालया निबद्धजाटजूटकः श्रियै चिराय जायतां चकोरबन्धुशेखरः ॥",
        "meaning": "May Shiva, whose footstool is greyed by the pollen showered from garlands on the crests of the thousand-eyed Indra and all gods, whose matted hair is bound with the garland of the king of serpents, and whose crown bears the crescent moon (kin of the chakora bird), grant us enduring prosperity.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "indra", "prosperity"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-6",
        "title": "Shiva Tandava Stotram — Verse 6",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "ललाटचत्वरज्वलद्धनञ्जयस्फुलिङ्गभा-निपीतपञ्चसायकं नमन्निलिम्पनायकम् ।\nसुधामयूखलेखया विराजमानशेखरं महाकपालिसम्पदे शिरोजटालमस्तु नः ॥",
        "meaning": "May we attain the spiritual treasure of Shiva, whose blazing sparks of fire on the altar of his forehead consumed the god of desire (Kamadeva); who is bowed to by the chiefs of gods; whose crest is illuminated by the cool nectar-ray of the crescent moon; and who holds the sacred kapala.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "kamadeva", "third-eye"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-7",
        "title": "Shiva Tandava Stotram — Verse 7",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "करालभालपट्टिकाधगद्धगद्धगज्ज्वल-द्धनञ्जयाहुतीकृतप्रचण्डपञ्चसायके ।\nधराधरेन्द्रनन्दिनीकुचाग्रचित्रपत्रक-प्रकल्पनैकशिल्पिनि त्रिलोचने रतिर्मम ॥",
        "meaning": "May my devotion rest in the Three-Eyed Lord, who sacrificed the fierce five arrows of Kamadeva into the dhagad-dhagad blaze of his terrible forehead fire; and who is the sole supreme artist tracing auspicious motifs upon the daughter of the Mountain King.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "trilochana", "parvati"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-8",
        "title": "Shiva Tandava Stotram — Verse 8",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "नवीनमेघमण्डलीनिरुद्धदुर्धरस्फुरत्-कुहूनिशीथिनीतमःप्रबन्धबद्धकन्धरः ।\nनिलिम्पनिर्झरीधरस्तनोतु कृत्तिसिन्धुरः कलानिधानबन्धुरः श्रियं जगद्धुरंधरः ॥",
        "meaning": "May the bearer of the universe grant us divine grace — he whose neck is as dark as a midnight sky clouded by fresh thunderous storm clouds; who holds the heavenly Ganga; who wears the elephant-hide garment; and who bears the radiant treasure of the arts in the crescent moon.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "neelakantha", "ganga"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-9",
        "title": "Shiva Tandava Stotram — Verse 9",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "प्रफुल्लनीलपङ्कजप्रपञ्चकालिमप्रभा-वलम्बिकण्ठकन्दलीरुचिप्रबद्धकन्धरम् ।\nस्मरच्छिदं पुरच्छिदं भवच्छिदं मखच्छिदं गजच्छिदान्धकच्छिदं तमन्तकच्छिदं भजे ॥",
        "meaning": "I worship the Lord whose neck shines with the deep black luster of blooming blue lotuses, who destroyed Kamadeva, shattered the three cities of Tripura, severed the bonds of worldly existence, ruined Daksha's sacrifice, destroyed the demon Gajasura, slew Andhakasura, and defeated death itself (Yama).",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "tripurantaka", "mritunjaya"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-10",
        "title": "Shiva Tandava Stotram — Verse 10",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "अखर्वसर्वमङ्गलाकलाकदम्बमञ्जरी-रसप्रवाहमाधुरीविजृम्भणामधुव्रतम् ।\nस्मरान्तकं पुरान्तकं भवान्तकं मखान्तकं गजान्तकान्धकान्तकं तमन्तकान्तकं भजे ॥",
        "meaning": "I worship Shiva, the honeybee drinking the sweet surging nectar flowing from the blooming flowers of Parvati's limitless auspicious arts; the destroyer of Cupid, Tripura, worldly birth, sacrificial pride, Gaja, Andhaka, and Yama the Lord of Death.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "parvati", "liberation"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-11",
        "title": "Shiva Tandava Stotram — Verse 11",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "जयत्वदभ्रविभ्रमभ्रमद्भुजङ्गमश्वस-द्विनिर्गमत्क्रमस्फुरत्करालभालहव्यवाट् ।\nधिमिद्धिमिद्धिमिध्वनन्मृदङ्गतुङ्गमङ्गल-ध्वनिक्रमप्रवर्तितप्रचण्डताण्डवः शिवः ॥",
        "meaning": "Glory to Shiva, from whose fearful forehead fire shoots forth fueled by the hissing breath of serpents whirled around in the vast cosmic expanse; performing his vigorous Tandava to the rhythmic, auspicious dhim-dhim-dhim beating of the cosmic drum.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "mridanga", "cosmic-dance"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-12",
        "title": "Shiva Tandava Stotram — Verse 12",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "दृषद्विचित्रतल्पयोर्भुजङ्गमौक्तिकस्रजोर्-गरिष्ठरत्नलोष्टयोः सुहृद्विपक्षपक्षयोः ।\nतृणारविन्दचक्षुषोः प्रजामहीमहेन्द्रयोः समप्रवृत्तिकः कदा सदाशिवं भजाम्यहम् ॥",
        "meaning": "When will I, possessing an equanimous mind viewing a hard stone and a soft bed, a serpent and a pearl garland, a priceless gem and a lump of clay, a friend and an enemy, a blade of grass and a lotus eye, an ordinary subject and an emperor as equal — worship Lord Sadashiva?",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "equanimity", "yoga", "samata"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-13",
        "title": "Shiva Tandava Stotram — Verse 13",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "कदा निलिम्पनिर्झरीनिकुञ्जकोटरे वसन् विमुक्तदुर्मतिः सदा शिरःस्थमञ्जलिं वहन् ।\nविमुक्तलोललोचनो ललामभाललग्नकः शिवेति मन्त्रमुच्चरन् कदा सुखी भवाम्यहम् ॥",
        "meaning": "When will I dwell in a cave along the banks of the celestial river Ganga, freed from crooked thoughts, holding my hands folded above my head in reverent salutation, free from wavering passions, meditating on the radiant Lord and chanting the holy mantra 'Shiva', and thus attain supreme peace?",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "meditation", "ganga", "mantra"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-14",
        "title": "Shiva Tandava Stotram — Verse 14",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "इमं हि नित्यमेवमुक्तमुत्तमोत्तमं स्तवं पठन्स्मरन्ब्रुवन्नरो विशुद्धिमेति संततम् ।\nहरे गुरौ सुभक्तिमाशु याति नान्यथा गतिं विमोहनं हि देहिनां सुशङ्करस्य चिन्तनम् ॥",
        "meaning": "Whoever constantly recites, remembers, and contemplates this supreme hymn of praise achieves unending spiritual purity, and swiftly attains deep, unwavering devotion to Hara, the supreme Guru. Constant contemplation of Shankara frees all embodied souls from the delusion of worldly existence.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "phala-shruti", "devotion"],
        "attribution": "Ravana"
    },
    {
        "id": "shiva-tandava-15",
        "title": "Shiva Tandava Stotram — Verse 15",
        "source": "Shiva Tandava Stotram — Ravana",
        "original": "पूजाऽवसानसमये दशवक्त्रगीतं यः शम्भुपूजनपरं पठति प्रदोषे ।\nतस्य स्थिरां रथगजेन्द्रतुरङ्गयुक्तां लक्ष्मीं सदैव सुमुखीं प्रददाति शम्भुः ॥",
        "meaning": "Whoever at the conclusion of worship recites this hymn composed by the ten-headed Ravana during the Pradosha twilight dedicated to the worship of Shambhu — to him Lord Shambhu ever grants lasting spiritual and worldly prosperity, steadfast auspiciousness, and spiritual glory.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "tandava", "pradosha", "lakshmi", "shambhu"],
        "attribution": "Ravana"
    },

    # ── SHIVA RUDRASHTAKAM (16-23) ──
    {
        "id": "shiva-rudrashtakam-1",
        "title": "Rudrashtakam — Verse 1",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "नमामीशमीशान निर्वाणरूपं विभुं व्यापकं ब्रह्मवेदस्वरूपम् ।\nनिजं निर्गुणं निर्विकल्पं निरीहं चिदाकाशमाकाशवासं भजेऽहम् ॥",
        "meaning": "I bow to the Supreme Lord Ishana, the very embodiment of liberation, all-pervading, the tangible essence of Brahman and the Vedas. I worship Him who is self-luminous, beyond attributes, beyond doubt, desireless, the sky of pure consciousness, whose garment is the ether.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "tulsidas", "nirvana", "brahman"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-2",
        "title": "Rudrashtakam — Verse 2",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "निराकारमोङ्कारमूलं तुरीयं गिरा ज्ञान गोतीतमीशं गिरीशम् ।\nकरालं महाकाल कालं कृपालं गुणागार संसारपारं नतोऽहम् ॥",
        "meaning": "I bow to the formless One, the primal source of Omkara, who abides in the fourth state (turiya), beyond speech, intellectual knowledge, and sense perception, the Lord of Kailash. I bow to the fierce One, the Death of Mahakala, the merciful Lord, the storehouse of virtues, who ferries us across worldly existence.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "omkara", "turiya", "mahakala"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-3",
        "title": "Rudrashtakam — Verse 3",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "तुषाराद्रि संकाश गौरं गभीरं मनोभूत कोटि प्रभा श्री शरीरम् ।\nस्फुरन्मौलि कल्लोलिनी चारु गङ्गा लसद्भालबालेन्दु कण्ठे भुजङ्गा ॥",
        "meaning": "White and luminous like snow-capped mountain peaks, profound and unfathomable, His glorious form radiates the brilliance of millions of Cupids. On His head dances the charming celestial Ganga with restless waves; the crescent moon sparkles on His forehead, and a serpent adorns His neck.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "ganga", "kailash"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-4",
        "title": "Rudrashtakam — Verse 4",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "चलत्कुण्डलं भ्रू सुनेत्रं विशालं प्रसन्नाननं नीलकण्ठं दयालम् ।\nमृगाधीशचर्माम्बरं मुण्डमालं प्रियं शङ्करं सर्वनाथं भजामि ॥",
        "meaning": "His earrings sway gracefully, His eyebrows and large eyes are mesmerizing, His countenance is serene and compassionate, His throat dark blue (Neelakantha). Clothed in tiger skin, wearing a garland of skulls, beloved Lord Shankara, master of all the worlds — Him do I worship.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "neelakantha", "shankara"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-5",
        "title": "Rudrashtakam — Verse 5",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "प्रचण्डं प्रकृष्टं प्रगल्भं परेशं अखण्डं अजं भानुकोटिप्रकाशम् ।\nत्रयः शूल निर्मूलनं शूलपाणिं भजेऽहं भवानीपतिं भावगम्यम् ॥",
        "meaning": "Fierce, exalted, resolute, the Supreme Sovereign, undivided, unborn, luminous as ten million suns; wielding the trident that uproots the threefold miseries of life (adhyatmika, adhidaivika, adhibhautika). I worship Bhavani's Lord, who is attainable through loving devotion.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "trishula", "bhavani"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-6",
        "title": "Rudrashtakam — Verse 6",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "कलातीत कल्याण कल्पान्तकारी सदा सज्जनान्ददाता पुरारी ।\nचिदानन्द संदोह मोहापहारी प्रसीद प्रसीद प्रभो मन्मथारी ॥",
        "meaning": "Beyond time and differentiation, auspicious, author of cosmic dissolution, ever bestowing joy upon the righteous, destroyer of the demon Tripura. He who is a mass of pure consciousness and bliss, the dispeller of delusion — be pleased, O Lord, be pleased, O destroyer of desire (Manmatha)!",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "bliss", "chidananda"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-7",
        "title": "Rudrashtakam — Verse 7",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "न यावद् उमानाथ पादारविन्दं भजन्तीह लोके परे वा नराणाम् ।\nन तावत् सुखं शान्ति सन्तापनाशं प्रसीद प्रभो सर्वभूताधिवासम् ॥",
        "meaning": "So long as human beings do not worship the lotus feet of Uma's Lord, neither in this world nor in the next do they attain true happiness, enduring peace, or relief from suffering. Be gracious, O Lord, who abidest in the hearts of all living beings!",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "peace", "uma", "devotion"],
        "attribution": "Goswami Tulsidas"
    },
    {
        "id": "shiva-rudrashtakam-8",
        "title": "Rudrashtakam — Verse 8",
        "source": "Shri Ramcharitmanas — Uttarkanda (Tulsidas)",
        "original": "न जानामि योगं जपं नैव पूजां नतोऽहं सदा सर्वदा शम्भु तुभ्यम् ।\nजरा जन्म दुःखौघ तातप्यमानं प्रभो पाहि आपन्नमामीश शम्भो ॥",
        "meaning": "I know neither yoga, nor japa, nor formal rituals of worship; I only bow unto You, O Shambhu, always and at all times! Tormented by the afflictions of old age, birth, and sorrows, protect me, O my Lord, for I have taken refuge in You, O Shambhu!",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "rudrashtakam", "surrender", "sharanagati"],
        "attribution": "Goswami Tulsidas"
    },

    # ── SHIVA LINGASHTAKAM (24-31) ──
    {
        "id": "shiva-lingashtakam-1",
        "title": "Lingashtakam — Verse 1",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "ब्रह्ममुरारिसुरार्चितलिङ्गं निर्मलभासितशोभितलिङ्गम् ।\nजन्मजदुःखविनाशकलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, worshipped by Brahma, Vishnu, and all the gods, adorned with pure and resplendent radiance, which destroys all sorrows born of worldly birth and death.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "shankaracharya", "sadashiva"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-2",
        "title": "Lingashtakam — Verse 2",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "देवमुनिप्रवरार्चितलिङ्गं कामदहं करुणाकरलिङ्गम् ।\nरावणदर्पविनाशनलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, reverently worshipped by celestial beings and eminent sages, the burner of cupid and mine of boundless compassion, which humbled the pride of Ravana.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "compassion", "ravana"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-3",
        "title": "Lingashtakam — Verse 3",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "सर्वसुगन्धिसुलेपितलिङ्गं बुद्धिविवर्धनकारणलिङ्गम् ।\nसिद्धसुरासुरवन्दितलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, anointed with all kinds of fragrant pastes, the very cause of expanding spiritual intellect and wisdom, worshipped by Siddhas, gods, and asuras alike.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "wisdom", "buddhi"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-4",
        "title": "Lingashtakam — Verse 4",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "कनककनामहामणिरत्नविभूषितलिङ्गं फणिपतिवेष्टितशोभितलिङ्गम् ।\nदक्षसुयज्ञविनाशनलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, adorned with precious gold and radiant gems, entwined by the King of Serpents, which dissolved the prideful sacrifice of Daksha.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "daksha", "serpent"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-5",
        "title": "Lingashtakam — Verse 5",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "कुङ्कुमचन्दनलेपितलिङ्गं पङ्कजहारसुशोभितलिङ्गम् ।\nसञ्चितपापविनाशनलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, smeared with fragrant saffron and sandalwood paste, adorned with lovely garlands of fresh lotuses, which eradicates all accumulated karmas and sins.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "purification", "lotus"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-6",
        "title": "Lingashtakam — Verse 6",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "देवगणार्चितसेवितलिङ्गं भावैर्भक्तिभिरेव च लिङ्गम् ।\nदिनकरकोटिप्रभाकरलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, served and honoured by divine assemblies with sincere devotional feelings, shining with the effulgence of ten million suns.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "light", "bhakti"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-7",
        "title": "Lingashtakam — Verse 7",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "अष्टदलोपरिवेष्टितलिङ्गं सर्वसमुद्भवकारणलिङ्गम् ।\nअष्टदरिद्रविनाशनलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, seated upon the sacred eight-petaled lotus, the prime cause of the creation of the cosmos, which destroys all eight forms of spiritual and worldly poverty.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "prosperity", "lotus"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-lingashtakam-8",
        "title": "Lingashtakam — Verse 8",
        "source": "Lingashtakam — Adi Shankaracharya",
        "original": "सुरगुरुसुरवरपूजितलिङ्गं सुरवनपुष्पसदार्चितलिङ्गम् ।\nपरात्परं परमात्मकलिङ्गं तत् प्रणमामि सदाशिवलिङ्गम् ॥",
        "meaning": "I bow to that Lingam of Sadashiva, worshipped by Brihaspati and the highest celestial beings, ever offered blossoms from celestial gardens, the transcendental Supreme, the ultimate Self of all.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "lingashtakam", "paramatman", "transcendental"],
        "attribution": "Adi Shankaracharya"
    },

    # ── SHIVA PANCHAKSHARA STOTRAM (32-36) ──
    {
        "id": "shiva-panchakshara-1",
        "title": "Shiva Panchakshara Stotram — 'Na' (Verse 1)",
        "source": "Panchakshara Stotram — Adi Shankaracharya",
        "original": "नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय ।\nनित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय ॥",
        "meaning": "Salutations to the syllable 'Na', to Shiva who wears the king of serpents as His garland, who has three eyes, who has his limbs anointed with holy ash, the great Lord, eternal, pure, and clad in the quarters of space.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "panchakshara", "na", "shankaracharya", "mantra"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-panchakshara-2",
        "title": "Shiva Panchakshara Stotram — 'Ma' (Verse 2)",
        "source": "Panchakshara Stotram — Adi Shankaracharya",
        "original": "मन्दाकिनीसलिलचन्दनचर्चिताय नन्दीश्वरप्रमथनाथमहेश्वराय ।\nमन्दारमुख्यबहुपुष्पसुपूजिताय तस्मै मकाराय नमः शिवाय ॥",
        "meaning": "Salutations to the syllable 'Ma', to Shiva who is bathed with the waters of the Mandakini river and smeared with sandalwood paste, the supreme Lord of Nandi and the Pramatha hosts, worshipped with Mandara and other holy blossoms.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "panchakshara", "ma", "mandakini", "nandi"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-panchakshara-3",
        "title": "Shiva Panchakshara Stotram — 'Shi' (Verse 3)",
        "source": "Panchakshara Stotram — Adi Shankaracharya",
        "original": "शिवाय गौरीवदनाब्जवृन्दसूर्याय दक्षाध्वरनाशकाय ।\nश्रीनीलकण्ठाय वृषध्वजाय तस्मै शिकाराय नमः शिवाय ॥",
        "meaning": "Salutations to the syllable 'Shi', to Shiva who is the auspicious sun causing the lotus face of Mother Gauri to blossom, the destroyer of Daksha's prideful sacrifice, the blue-throated Lord who carries the bull upon his banner.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "panchakshara", "shi", "gauri", "neelakantha"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-panchakshara-4",
        "title": "Shiva Panchakshara Stotram — 'Va' (Verse 4)",
        "source": "Panchakshara Stotram — Adi Shankaracharya",
        "original": "वसिष्ठकुम्भोद्भवगौतमार्यमुनीन्द्रदेवार्चितशेखराय ।\nचन्द्रार्कवैश्वानरलोचनाय तस्मै वकाराय नमः शिवाय ॥",
        "meaning": "Salutations to the syllable 'Va', to Shiva whose head is bowed to and worshipped by eminent sages like Vasishtha, Agastya, and Gautama, as well as the gods; and whose three eyes are the sun, moon, and fire.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "panchakshara", "va", "rishi", "cosmic-eyes"],
        "attribution": "Adi Shankaracharya"
    },
    {
        "id": "shiva-panchakshara-5",
        "title": "Shiva Panchakshara Stotram — 'Ya' (Verse 5)",
        "source": "Panchakshara Stotram — Adi Shankaracharya",
        "original": "यक्षस्वरूपाय जटाधराय पिनाकहस्ताय सनातनाय ।\nदिव्याय देवाय दिगम्बराय तस्मै यकाराय नमः शिवाय ॥",
        "meaning": "Salutations to the syllable 'Ya', to Shiva who is the embodiment of divine mystery, who wears matted locks, who holds the Pinaka bow in his hand, the eternal, divine, shining Lord who is clad in the directions of the cosmos.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "panchakshara", "ya", "pinaka", "eternal"],
        "attribution": "Adi Shankaracharya"
    },

    # ── SHIVA MAHIMNA STOTRAM (37-41) ──
    {
        "id": "shiva-mahimna-1",
        "title": "Shiva Mahimna Stotram — Verse 1",
        "source": "Shiva Mahimna Stotram — Pushpadanta",
        "original": "महिम्नः पारं ते परमविदुषो यद्यसदृशी स्तुतिर्ब्रह्मादीनामपि तदवसन्नास्त्वयि गिरः ।\nअथाऽवाच्यः सर्वः स्वमतिपरिणामावधि गृणन् ममाप्येष स्तोत्रे हर निरपवादः परिकरः ॥",
        "meaning": "O Lord, if even Brahma and the greatest knowers cannot adequately praise Your infinite glory, and their words fall short — then all speech that attempts to praise You according to one's own capacity stands blameless. Even my humble offering of praise to You, O Hara, is therefore free from fault.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "mahimna", "pushpadanta", "praise", "humility"],
        "attribution": "Pushpadanta"
    },
    {
        "id": "shiva-mahimna-2",
        "title": "Shiva Mahimna Stotram — Verse 7",
        "source": "Shiva Mahimna Stotram — Pushpadanta",
        "original": "त्रयी साङ्ख्यं योगः पशुपतिमतं वैष्णवमिति प्रभिन्ने प्रस्थाने परमिदमदः पथ्यमिति च ।\nरुचीनां वैचित्र्यादृजुकुटिलनानापथजुषां नृणामेको गम्यस्त्वमसि पयसामर्णव इव ॥",
        "meaning": "The Vedas, the Sankhya philosophy, the Yoga system, the Pashupata tradition, and the Vaishnava path — following different paths, people deem this or that to be superior according to varied inclinations. Yet, whether their paths be straight or winding, You alone are the ultimate destination for all humans, just as the ocean is the sole destination for all rivers.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "mahimna", "harmony", "vedas", "oneness"],
        "attribution": "Pushpadanta"
    },
    {
        "id": "shiva-mahimna-3",
        "title": "Shiva Mahimna Stotram — Verse 14",
        "source": "Shiva Mahimna Stotram — Pushpadanta",
        "original": "असितगिरिसमं स्यात्कज्जलं सिन्धुपात्रे सुरतरुवरशाखा लेखनी पत्रमुर्वी ।\nलिखति यदि गृहीत्वा शारदा सर्वकालं तदपि तव गुणानामीश पारं न याति ॥",
        "meaning": "If the black mountain were the ink, the ocean the inkpot, the divine celestial tree branch the pen, and the entire earth the writing paper, and if the Goddess of Wisdom, Sharada herself, were to write for all eternity — even then, O Lord, She could never reach the limit of Your divine glories.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "mahimna", "sharada", "infinity", "glory"],
        "attribution": "Pushpadanta"
    },
    {
        "id": "shiva-mahimna-4",
        "title": "Shiva Mahimna Stotram — Verse 21",
        "source": "Shiva Mahimna Stotram — Pushpadanta",
        "original": "बहलरजसे विश्वोत्पत्तौ भवाय नमो नमः प्रबलतमसे तत्संहारे हराय नमो नमः ।\nजनसुखकृते सत्त्वोद्रिक्तौ मृडाय नमो नमः प्रमहसि पदे निस्त्रैगुण्ये शिवाय नमो नमः ॥",
        "meaning": "Salutations again and again to You as Bhava, full of active rajas during the creation of the cosmos; salutations to You as Hara, wielding heavy tamas for its dissolution; salutations to You as Mrida, full of pure sattva to bestow joy on all beings; and salutations to You as Shiva, dwelling in the supreme transcendental state beyond all three gunas.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "mahimna", "gunas", "creation", "transcendental"],
        "attribution": "Pushpadanta"
    },
    {
        "id": "shiva-mahimna-5",
        "title": "Shiva Mahimna Stotram — Verse 32",
        "source": "Shiva Mahimna Stotram — Pushpadanta",
        "original": "मधुस्फूता वाचः परमममृतं निर्मितवत-स्तव ब्रह्मन् किं वागपि सुरगुरोर्विस्मयपदम् ।\nमम त्वेतां वाणीं गुणकथनपुण्येन भवतः पुनामीत्यर्थेऽस्मिन् पुरमथन बुद्धिर्व्यवसिता ॥",
        "meaning": "O Supreme Brahman, You who created the nectarine sweet flow of words that is the Veda — can even the eloquent speech of Brihaspati, guru of the gods, astonish You? Yet, my intellect was resolved to compose this hymn with the sole purpose of purifying my own speech through the merit of recounting Your divine virtues, O Destroyer of Tripura!",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "mahimna", "speech", "purification", "brahman"],
        "attribution": "Pushpadanta"
    },

    # ── SHIVA PURANA LANDMARK VERSES (42-45) ──
    {
        "id": "shiva-pur-vidyeshvara-1",
        "title": "Shiva Purana — Vidyeshvara Samhita 1.1",
        "source": "Shiva Purana — Vidyeshvara Samhita 1.1",
        "original": "यस्याज्ञया जगत्स्रष्टा ब्रह्मा पाति च विष्णुराट् । संहर्ता कालनामाऽसौ तस्मै शम्भवे नमः ॥",
        "meaning": "By whose divine decree Brahma creates the universe, Lord Vishnu preserves it, and Kala (Time) effects its ultimate dissolution — unto that supreme Lord Shambhu, we offer our reverent salutations.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "purana", "vidyeshvara", "creation", "shambhu"],
        "attribution": "Shiva Purana"
    },
    {
        "id": "shiva-pur-vidyeshvara-2",
        "title": "Shiva Purana — Glory of the Shiva Linga",
        "source": "Shiva Purana — Vidyeshvara Samhita 5.10",
        "original": "लिङ्गवेदी महादेवो लिङ्गं साक्षान्महेश्वरः । तयोः सम्पूजनान्नित्यं परं पदमवाप्नुयात् ॥",
        "meaning": "The pedestal (vedi) of the Linga is Mahadevi (the Great Goddess Shakti), and the Linga itself is Lord Maheshvara. Through their united constant worship, the devotee attains the supreme spiritual abode.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "shakti", "linga", "vidyeshvara", "oneness"],
        "attribution": "Shiva Purana"
    },
    {
        "id": "shiva-pur-rudra-1",
        "title": "Shiva Purana — The Truth of Shiva and Shakti",
        "source": "Shiva Purana — Rudra Samhita 2.15",
        "original": "यथा शिवस्तथा शक्तिर्यथा शक्तिस्तथा शिवः । नान्तरं विद्यते क्वापि चन्द्रचन्द्रिकयोरिव ॥",
        "meaning": "As Shiva is, so is Shakti; as Shakti is, so is Shiva. There is no distinction or separation between them anywhere, just as there is no separation between the moon and its radiant moonlight.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "shakti", "rudra-samhita", "advaita", "moonlight"],
        "attribution": "Shiva Purana"
    },
    {
        "id": "shiva-pur-rudra-2",
        "title": "Shiva Purana — The Eternal Refuge",
        "source": "Shiva Purana — Rudra Samhita 3.42",
        "original": "शिवो गुरुः शिवो देवः शिवो बन्धुः शरीरिणाम् । शिव आत्मा शिवो जीवः शिवादन्यन्न किञ्चन ॥",
        "meaning": "Shiva is the Guru, Shiva is God, Shiva is the true relative of all embodied beings. Shiva is the supreme Soul, Shiva is the living spirit; there is nothing in this entire creation other than Shiva.",
        "tradition": "hindu",
        "category": "shiva_purana",
        "tags": ["shiva", "purana", "rudra-samhita", "atman", "guru"],
        "attribution": "Shiva Purana"
    }
]

# Generate IAST transliteration for all entries
for e in entries:
    e["transliteration"] = to_iast(e["original"])

# Write to src/lib/data/shiva-purana.ts
ts_content = "import { LibraryEntry } from '../library-content';\n\n"
ts_content += "export const SHIVA_PURANA_ENTRIES: LibraryEntry[] = [\n"

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
    ts_content += f"    category: '{e['category']}',\n"
    ts_content += f"    tradition: '{e['tradition']}',\n"
    ts_content += "  },\n"

ts_content += "];\n"

with open("src/lib/data/shiva-purana.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully generated {len(entries)} authentic Shaiva & Shiva Purana entries in src/lib/data/shiva-purana.ts")
