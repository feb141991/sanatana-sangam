# -*- coding: utf-8 -*-
"""
Dharm Veer 365 — Sikh Tradition Generator (60 Heroes)
Generates 60 unique Sikh heroes, leaders, martyrs, Bhagats, and scholars.
When added to the existing 15 Sikh heroes, this brings the total Sikh heroes to 75.
"""
import json
import os

SIKH_HEROES = [
    {
        "id": "guru-angad-dev",
        "name": "Guru Angad Dev Ji",
        "nameLocal": "गुरु अंगद देव जी",
        "namePa": "ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ",
        "era": "1504–1552 CE",
        "eraLocal": "१५०४–१५५२ ईस्वी",
        "eraPa": "੧੫੦੪–੧੫੫੨ ਈਸਵੀ",
        "tradition": "sikh",
        "region": "Khadur Sahib, Punjab",
        "regionLocal": "खड़ूर साहिब, पंजाब",
        "regionPa": "ਖਡੂਰ ਸਾਹਿਬ, ਪੰਜਾਬ",
        "emoji": "☬",
        "tagline": "The second Sikh Guru who standardized the Gurmukhi script, established community wrestling arenas (Akhadas) for physical discipline, and exemplified absolute surrender to the Guru's command.",
        "taglineLocal": "सिखों के द्वितीय गुरु जिन्होंने गुरुमुखी लिपि को व्यवस्थित किया, मल्ल अखाड़ों की स्थापना की और सेवा व आज्ञापालन का सर्वोच्च आदर्श प्रस्तुत किया।",
        "taglinePa": "ਸਿੱਖਾਂ ਦੇ ਦੂਜੇ ਪਾਤਸ਼ਾਹ ਜਿਨ੍ਹਾਂ ਨੇ ਗੁਰਮੁਖੀ ਲਿਪੀ ਨੂੰ ਪ੍ਰਮਾਣਿਤ ਕੀਤਾ, ਮੱਲ ਅਖਾੜੇ ਕਾਇਮ ਕੀਤੇ ਅਤੇ ਗੁਰੂ ਪ੍ਰਤੀ ਸਮਰਪਣ ਦੀ ਮਿਸਾਲ ਕਾਇਮ ਕੀਤੀ।",
        "journey": "Born as Bhai Lehna in Matte di Sarai, his life was completely transformed when he heard the divine hymns of Guru Nanak Dev Ji chanted by Bhai Jodha. Drawn by an overwhelming spiritual thirst, he travelled to Kartarpur Sahib. From the moment he met Guru Nanak, he surrendered his ego, mind, and worldly possessions. While others saw Guru Nanak's eccentric-looking tests as impossible or humiliating, Bhai Lehna saw only divine commands to be obeyed without hesitation. In 1539 CE, acknowledging his flawless humility, physical stamina, and spiritual illumination, Guru Nanak embraced him, renamed him 'Angad' (a limb of my own body), and placed the coconut and five paise before him, bequeathing the Guruship. At Khadur Sahib, Guru Angad standardized the Gurmukhi alphabet, making spiritual wisdom directly accessible to the common masses rather than remaining locked in priestly languages. He also established physical training grounds (Akhadas) where youth built strength alongside devotion, and with his wife Mata Khivi, vastly expanded the egalitarian institution of Guru ka Langar.",
        "journeyLocal": "भाई लहणा जी का जन्म मत्ते दी सरां में हुआ था। जब उन्होंने भाई जोधा से गुरु नानक देव जी की वाणी सुनी, तो उनके भीतर आध्यात्मिक प्यास जाग उठी। वे करतारपुर साहिब पहुंचे और गुरु चरणों में लीन हो गए। जहां अन्य शिष्य सांसारिक मर्यादाओं और अहंकार में उलझे रहे, वहीं भाई लहणा जी ने गुरु नानक देव जी की हर कठिन परीक्षा को पूर्ण विनम्रता और श्रद्धा से उत्तीर्ण किया। सन् १५३९ में गुरु नानक देव जी ने उन्हें अपने हृदय से लगाकर 'अंगद' (अपने ही शरीर का अंग) नाम दिया और गुरुगद्दी सौंपी। खड़ूर साहिब में गुरु अंगद देव जी ने गुरुमुखी लिपि को मानक रूप दिया, मल्ल अखाड़ों के माध्यम से युवाओं को शारीरिक रूप से सबल बनाया और माता खीवी जी के साथ मिलकर लंगर की प्रथा को सुदृढ़ किया।",
        "journeyPa": "ਮੱਤੇ ਦੀ ਸਰਾਂ ਵਿਖੇ ਜਨਮੇ ਭਾਈ ਲਹਿਣਾ ਜੀ ਦਾ ਜੀਵਨ ਉਦੋਂ ਬਦਲ ਗਿਆ ਜਦੋਂ ਉਹਨਾਂ ਨੇ ਭਾਈ ਜੋਧਾ ਜੀ ਤੋਂ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦੀ ਪਵਿੱਤਰ ਬਾਣੀ ਸੁਣੀ। ਆਪ ਕਰਤਾਰਪੁਰ ਸਾਹਿਬ ਪੁੱਜੇ ਅਤੇ ਗੁਰੂ ਚਰਨਾਂ ਵਿੱਚ ਪੂਰਨ ਆਪਾ ਵਾਰ ਦਿੱਤਾ। ਗੁਰੂ ਸਾਹਿਬ ਦੀਆਂ ਕਠਿਨ ਪ੍ਰੀਖਿਆਵਾਂ ਵਿੱਚੋਂ ਸਫਲ ਹੋਣ ਮਗਰੋਂ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਨੇ ਉਹਨਾਂ ਨੂੰ ਆਪਣਾ 'ਅੰਗ' ਜਾਣ ਕੇ 'ਗੁਰੂ ਅੰਗਦ' ਦਾ ਨਾਂ ਦਿੱਤਾ ਅਤੇ ਗੁਰਗੱਦੀ ਸੌਂਪੀ। ਆਪ ਜੀ ਨੇ ਗੁਰਮੁਖੀ ਲਿਪੀ ਨੂੰ ਪ੍ਰਚਲਿਤ ਕੀਤਾ, ਸਰੀਰਕ ਅਰੋਗਤਾ ਲਈ ਮੱਲ ਅਖਾੜੇ ਬਣਾਏ ਅਤੇ ਮਾਤਾ ਖੀਵੀ ਜੀ ਦੀ ਦੇਖ-ਰੇਖ ਹੇਠ ਲੰਗਰ ਦੀ ਪ੍ਰਥਾ ਨੂੰ ਵਿਸ਼ਾਲ ਕੀਤਾ।",
        "trial": "Guru Nanak subjected Bhai Lehna to numerous rigorous trials: fetching a brass jug from deep muddy water in the dead of cold night, carrying wet sludgy grass that ruined his fine silken clothes, and finally commanding him to eat from a corpse beneath a shroud. While others fled in horror or whispered that the Guru had lost his reason, Bhai Lehna bowed reverently and asked, 'Master, from which side shall I begin?' When the sheet was lifted, sacred Karah Parshad lay beneath.",
        "trialLocal": "गुरु नानक देव जी ने भाई लहणा जी की अनेक कठिन परीक्षाएं लीं—भीषण शीत में गहरे कीचड़ से लोटा निकालना, कीचड़ से भरी घास की गठरी उठाकर रेशमी वस्त्र सानना, और अंत में कफ़न से ढके शव को खाने की आज्ञा देना। जब सब पीछे हट गए, भाई लहणा जी ने हाथ जोड़कर पूछा, 'महाराज, किस ओर से खाना आरंभ करूं?' कफ़न हटा तो वहां अमृत तुल्य कड़ाह प्रसाद था।",
        "trialPa": "ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਨੇ ਭਾਈ ਲਹਿਣਾ ਜੀ ਦੀਆਂ ਕਈ ਪ੍ਰੀਖਿਆਵਾਂ ਲਈਆਂ—ਕੜਾਕੇ ਦੀ ਠੰਢ ਵਿੱਚ ਚਿੱਕੜ ਵਿੱਚੋਂ ਲੋਟਾ ਕੱਢਣਾ, ਚਿੱਕੜ ਭਰੀ ਘਾਹ ਦੀ ਪੰਡ ਚੁੱਕਣੀ ਅਤੇ ਕਫ਼ਨ ਹੇਠ ਮੁਰਦਾ ਖਾਣ ਦਾ ਹੁਕਮ। ਜਦੋਂ ਸਾਰੇ ਪਿੱਛੇ ਹਟ ਗਏ ਤਾਂ ਭਾਈ ਲਹਿਣਾ ਜੀ ਨੇ ਪੁੱਛਿਆ, 'ਸੱਚੇ ਪਾਤਸ਼ਾਹ! ਕਿਹੜੇ ਪਾਸਿਓਂ ਸ਼ੁਰੂ ਕਰਾਂ?' ਕੱਪੜਾ ਚੁੱਕਣ 'ਤੇ ਉੱਥੇ ਕੜਾਹ ਪ੍ਰਸ਼ਾਦ ਸੁਸ਼ੋਭਿਤ ਸੀ।",
        "teaching": "Ego is a chronic ailment, but within it lies the cure through selfless service and surrendering to the True Guru. Physical fitness and spiritual purity must walk hand in hand.",
        "teachingLocal": "अहंकार एक दीर्घ रोग है, परंतु गुरु की शरण में निष्काम सेवा द्वारा इसका निदान संभव है। भक्ति के साथ शरीर को स्वस्थ और सबल रखना भी आवश्यक कर्तव्य है।",
        "teachingPa": "ਹਉਮੈ ਦੀਰਘ ਰੋਗੁ ਹੈ ਦਾਰੂ ਭੀ ਇਸੁ ਮਾਹਿ। ਗੁਰੂ ਦੀ ਰਜ਼ਾ ਵਿੱਚ ਰਹਿ ਕੇ ਨਿਸ਼ਕਾਮ ਸੇਵਾ ਕਰਨੀ ਅਤੇ ਸਰੀਰਕ ਤੌਰ 'ਤੇ ਨਰੋਏ ਰਹਿਣਾ ਹੀ ਸਿੱਖ ਦਾ ਧਰਮ ਹੈ।",
        "moral": "True discipleship does not calculate personal comfort or loss; it transforms obedience into spiritual mastery.",
        "moralLocal": "सच्चा शिष्य अपने लाभ-हानि का विचार नहीं करता; गुरु-आज्ञा का निस्वार्थ पालन ही उसे आत्म-साक्षात्कार की ओर ले जाता है।",
        "moralPa": "ਸੱਚਾ ਸਿੱਖ ਨਿੱਜੀ ਸੁੱਖ-ਦੁੱਖ ਦਾ ਹਿਸਾਬ ਨਹੀਂ ਲਾਉਂਦਾ, ਸਗੋਂ ਹੁਕਮ ਦੀ ਪਾਲਣਾ ਕਰਕੇ ਆਤਮਿਕ ਉੱਚਾਈਆਂ ਨੂੰ ਛੂੰਹਦਾ ਹੈ।",
        "legacy": "Created the Gurmukhi script that recorded the sacred utterances of the Gurus, founded educational centres for children, and established the tradition of seva and physical training.",
        "legacyLocal": "गुरुमुखी लिपि को मानक रूप देकर गुरबाणी को जन-जन तक पहुंचाया और सेवा तथा शारीरिक व्यायाम के संयोजन से सिख समाज को सशक्त किया।",
        "legacyPa": "ਗੁਰਮੁਖੀ ਲਿਪੀ ਰਾਹੀਂ ਗੁਰਬਾਣੀ ਦੇ ਸੰਭਾਲ ਦਾ ਮਾਰਗ ਪੱਧਰਾ ਕੀਤਾ ਅਤੇ ਵਿੱਦਿਆ ਤੇ ਸਰੀਰਕ ਸਿਖਲਾਈ ਦਾ ਨੀਂਹ ਪੱਥਰ ਰੱਖਿਆ।",
        "source": "Sri Guru Granth Sahib (Salok Mahalla 2, Ang 146), Bhai Gurdas Ji (Varan, Var 1), Mahima Prakash",
        "sourceLocal": "श्री गुरु ग्रंथ साहिब (सलोक महला २, अंग १४६), भाई गुरदास जी (वार १), महिमा प्रकाश",
        "sourcePa": "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ (ਸਲੋਕ ਮਹਲਾ ੨, ਅੰਗ ੧੪੬), ਭਾਈ ਗੁਰਦਾਸ ਜੀ (ਵਾਰ ੧), ਮਹਿਮਾ ਪ੍ਰਕਾਸ਼",
        "sourceCitations": [
            {"sourceName": "Sri Guru Granth Sahib", "sourceRef": "Salok Mahalla 2, Angs 146, 463, 474", "tier": 1},
            {"sourceName": "Bhai Gurdas Ji", "sourceRef": "Varan, Var 1, Pauri 45; Var 24, Pauri 5", "tier": 1},
            {"sourceName": "Mahima Prakash", "sourceRef": "Sakhi Guru Angad Dev Ji", "tier": 1}
        ],
        "quote": {
            "text": "Nanak tinhe basant hai jin ghar vasya kantu, jin kai kant disapuri se ahnis phireh jalantu.",
            "attribution": "O Nanak, it is eternal spring for those whose Beloved Lord dwells within their heart; but those whose Lord is far away burn in distress day and night. — Guru Angad Dev Ji, Sri Guru Granth Sahib (Ang 791)"
        },
        "quoteLocal": {
            "text": "नानक तिन्है बसंतु है जिन घरि वसिआ कंतु। जिन कै कंतु दिसापुरी से अहिनिसि फिरहि जलंतु॥",
            "attribution": "गुरु अंगद देव जी (श्री गुरु ग्रंथ साहिब, अंग ७९१)"
        },
        "quotePa": {
            "text": "ਨਾਨਕ ਤਿਨ੍ਹ੍ਹੈ ਬਸੰਤੁ ਹੈ ਜਿਨ੍ਹ੍ਹ ਘਰਿ ਵਸਿਆ ਕੰਤੁ ॥ ਜਿਨ ਕੇ ਕੰਤ ਦਿਸਾਪੁਰੀ ਸੇ ਅਹਿਨਿਸਿ ਫਿਰਹਿ ਜਲੰਤ ॥",
            "attribution": "ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ (ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ, ਅੰਗ ੭੯੧)"
        },
        "illustrationPrompt": "Classical Indian Sacred Realism oil painting in the style of Raja Ravi Varma depicting Guru Angad Dev Ji teaching young children the newly standardized Gurmukhi script on wooden patti tablets in the serene courtyard of Khadur Sahib, morning golden light filtering through neem leaves, peaceful spiritual atmosphere."
    },
    {
        "id": "guru-amar-das",
        "name": "Guru Amar Das Ji",
        "nameLocal": "गुरु अमर दास जी",
        "namePa": "ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ",
        "era": "1479–1574 CE",
        "eraLocal": "१४७९–१५७४ ईस्वी",
        "eraPa": "੧੪੭੯–੧੫੭੪ ਈਸਵੀ",
        "tradition": "sikh",
        "region": "Goindval Sahib, Punjab",
        "regionLocal": "गोइन्दवाल साहिब, पंजाब",
        "regionPa": "ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ, ਪੰਜਾਬ",
        "emoji": "☬",
        "tagline": "The third Sikh Guru who assumed Guruship at the age of 73, instituted the egalitarian principle of 'Pehle Pangat, Pache Sangat', abolished Sati and Purdah, and constructed the sacred Baoli at Goindval.",
        "taglineLocal": "सिखों के तृतीय गुरु जिन्होंने ७३ वर्ष की आयु में गुरुपद संभाला, 'पहले पंगत फिर संगत' का नियम लागू किया, सती व पर्दा प्रथा का अंत किया और गोइन्दवाल में बाओली का निर्माण कराया।",
        "taglinePa": "ਸਿੱਖਾਂ ਦੇ ਤੀਜੇ ਪਾਤਸ਼ਾਹ ਜਿਨ੍ਹਾਂ ਨੇ ੭੩ ਸਾਲ ਦੀ ਉਮਰ ਵਿੱਚ ਗੁਰਗੱਦੀ ਸੰਭਾਲੀ, 'ਪਹਿਲੇ ਪੰਗਤ ਪਾਛੇ ਸੰਗਤ' ਦਾ ਅਸੂਲ ਦ੍ਰਿੜ੍ਹ ਕਰਵਾਇਆ, ਸਤੀ ਪ੍ਰਥਾ ਦਾ ਵਿਰੋਧ ਕੀਤਾ ਅਤੇ ਗੋਇੰਦਵਾਲ ਵਿਖੇ ਬਾਉਲੀ ਸਾਹਿਬ ਦੀ ਰਚਨਾ ਕੀਤੀ।",
        "journey": "For over sixty years of his life, Amar Das was a devout Vaishnava pilgrim who walked every year to Haridwar. Yet his heart remained unfulfilled until he heard Bibi Amro, daughter of Guru Angad Dev Ji, singing the nectar-sweet hymns of Guru Nanak. Pierced to the soul, he begged to be taken to Khadur Sahib. Though elderly, he dedicated twelve years to carrying fresh river water every dawn from the Beas River to Khadur Sahib for Guru Angad's morning bath, walking backwards so his back would never face his master. At the age of 73, Guru Angad anointed him as the third Guru. Guru Amar Das established Goindval Sahib as the spiritual headquarters. He made the revolutionary declaration that no one—not even Emperor Akbar—could enter his presence without first sitting on the floor and eating in the communal Langar alongside ordinary people of every caste ('Pehle Pangat, Pache Sangat'). He abolished the cruel rites of Sati and Purdah, championed women's rights, authored the immortal Anand Sahib (Song of Bliss), and established 22 Manjis (administrative and missionary dioceses) to spread the Guru's message far and wide.",
        "journeyLocal": "अमर दास जी जीवन के साठ वर्षों तक प्रतिवर्ष हरिद्वार की तीर्थयात्रा करते रहे, परंतु आत्मिक शांति नहीं मिली। जब उन्होंने गुरु अंगद देव जी की सुपुत्री बीबी अमरो के मुख से गुरबाणी सुनी, तो वे व्याकुल होकर खड़ूर साहिब पहुंचे। वृद्धावस्था में भी उन्होंने लगातार बारह वर्षों तक प्रतिदिन व्यास नदी से जल लाकर गुरु अंगद देव जी के स्नान की सेवा की। सन् १५५२ में ७३ वर्ष की आयु में उन्हें गुरुपद मिला। उन्होंने गोइन्दवाल साहिब की स्थापना की और नियम बनाया कि जब तक कोई व्यक्ति पंक्ति में बैठकर लंगर नहीं छकेगा, वह गुरु से नहीं मिल सकता। जब सम्राट अकबर उनसे मिलने आए, तो उन्हें भी साधारण जनता के साथ पंगत में बैठकर भोजन करना पड़ा। उन्होंने सती प्रथा तथा पर्दा प्रथा को निषिद्ध किया और 'आनंद साहिब' की अमर वाणी रची।",
        "journeyPa": "ਆਪ ਜੀ ਨੇ ਲਗਭਗ ਸੱਠ ਸਾਲ ਤੱਕ ਤੀਰਥ ਯਾਤਰਾਵਾਂ ਕੀਤੀਆਂ ਪਰ ਮਨ ਨੂੰ ਸ਼ਾਂਤੀ ਨਾ ਮਿਲੀ। ਜਦੋਂ ਬੀਬੀ ਅਮਰੋ ਜੀ ਪਾਸੋਂ ਗੁਰਬਾਣੀ ਸੁਣੀ ਤਾਂ ਖਡੂਰ ਸਾਹਿਬ ਪੁੱਜੇ ਅਤੇ ਲਗਾਤਾਰ ਬਾਰਾਂ ਸਾਲ ਬਿਆਸ ਦਰਿਆ ਤੋਂ ਜਲ ਦੀ ਗਾਗਰ ਲਿਆ ਕੇ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ ਦੇ ਇਸ਼ਨਾਨ ਦੀ ਸੇਵਾ ਕੀਤੀ। ੭੩ ਸਾਲ ਦੀ ਉਮਰ ਵਿੱਚ ਗੁਰਗੱਦੀ ਮਿਲੀ। ਆਪ ਜੀ ਨੇ ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ ਵਸਾਇਆ ਅਤੇ 'ਪਹਿਲੇ ਪੰਗਤ ਪਾਛੇ ਸੰਗਤ' ਦਾ ਨਿਯਮ ਬਣਾਇਆ, ਜਿਸ ਤਹਿਤ ਬਾਦਸ਼ਾਹ ਅਕਬਰ ਨੇ ਵੀ ਪੰਗਤ ਵਿੱਚ ਬੈਠ ਕੇ ਲੰਗਰ ਛਕਿਆ। ਆਪ ਜੀ ਨੇ ਸਤੀ ਅਤੇ ਪਰਦਾ ਪ੍ਰਥਾ ਦਾ ਖੰਡਨ ਕੀਤਾ ਅਤੇ ਅਮਰ ਬਾਣੀ 'ਅਨੰਦੁ ਸਾਹਿਬ' ਦੀ ਰਚਨਾ ਕੀਤੀ।",
        "trial": "Guru Amar Das faced intense jealousy from Datu, Guru Angad's son, who felt entitled to the Guruship. Datu stormed into Goindval and kicked the elderly Guru off his seat. Instead of reacting with anger, Guru Amar Das gently held Datu's foot, caressing it and apologizing, 'Forgive me, my old and hard bones must have hurt your tender feet.' The Guru then quietly retired into seclusion at Basarke to avoid conflict, demonstrating ultimate humility.",
        "trialLocal": "गुरु अंगद देव जी के पुत्र दातू ने ईर्ष्यावश गोइन्दवाल आकर वयोवृद्ध गुरु अमर दास जी के सीने पर लात मार दी, जिससे वे गद्दी से गिर पड़े। गुरु जी ने क्रोधित होने के स्थान पर दातू के पैर पकड़कर कहा, 'मुझे क्षमा करें, मेरी बूढ़ी और कठोर हड्डियों से आपके कोमल चरणों को चोट लगी होगी।' इसके बाद वे मौन भाव से बसड़के गांव में एकांतवास में चले गए।",
        "trialPa": "ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ ਦੇ ਸਪੁੱਤਰ ਦਾਤੂ ਨੇ ਈਰਖਾ ਵੱਸ ਹੋ ਕੇ ਗੋਇੰਦਵਾਲ ਵਿਖੇ ਬਿਰਧ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ ਨੂੰ ਲੱਤ ਮਾਰੀ। ਗੁਰੂ ਸਾਹਿਬ ਨੇ ਗੁੱਸਾ ਕਰਨ ਦੀ ਥਾਂ ਦਾਤੂ ਦੇ ਪੈਰ ਘੁੱਟਦਿਆਂ ਕਿਹਾ, 'ਮੇਰੀਆਂ ਸਖ਼ਤ ਹੱਡੀਆਂ ਨਾਲ ਤੁਹਾਡੇ ਕੋਮਲ ਚਰਨਾਂ ਨੂੰ ਚੋਟ ਤਾਂ ਨਹੀਂ ਲੱਗੀ?' ਅਤੇ ਆਪ ਬਿਨਾਂ ਕਿਸੇ ਵੈਰ ਦੇ ਬਾਸਰਕੇ ਪਿੰਡ ਇਕਾਂਤ ਵਿੱਚ ਚਲੇ ਗਏ।",
        "teaching": "True bliss (Anand) is attained only when the mind surrenders its restless wandering and abides in the presence of the Divine through the Guru's Word.",
        "teachingLocal": "सच्चा आनंद तभी प्राप्त होता है जब मन अपने भटकाव को त्यागकर गुरु के शब्द द्वारा परमात्मा की उपस्थिति में स्थिर हो जाए।",
        "teachingPa": "ਮਨਮੁਖੀ ਭਟਕਣਾ ਛੱਡ ਕੇ ਗੁਰੂ ਦੇ ਸ਼ਬਦ ਵਿੱਚ ਲੀਨ ਹੋਣਾ ਹੀ ਸੱਚੇ ਅਨੰਦ ਦੀ ਪ੍ਰਾਪਤੀ ਹੈ। ਸਭ ਜੀਵਾਂ ਨੂੰ ਬਿਨਾਂ ਭੇਦਭਾਵ ਦੇ ਪ੍ਰੇਮ ਕਰਨਾ ਹੀ ਅਸਲ ਭਗਤੀ ਹੈ।",
        "moral": "Age is no barrier to spiritual greatness or social revolution; divine humility disarms even the fiercest hostility.",
        "moralLocal": "आयु आध्यात्मिक प्रगति या समाज सुधार में बाधक नहीं है; सच्ची विनम्रता बड़े से बड़े अहंकार को पराजित कर देती है।",
        "moralPa": "ਉਮਰ ਆਤਮਿਕ ਤਰੱਕੀ ਵਿੱਚ ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ ਬਣਦੀ; ਨਿਮਰਤਾ ਅਤੇ ਸਹਿਣਸ਼ੀਲਤਾ ਵੱਡੇ ਤੋਂ ਵੱਡੇ ਵੈਰ ਨੂੰ ਵੀ ਜਿੱਤ ਲੈਂਦੀ ਹੈ।",
        "legacy": "Instituted equal standing for women by ending Sati and Purdah, composed Anand Sahib, built the 84-step sacred Baoli at Goindval Sahib, and organized the 22 Manji system.",
        "legacyLocal": "सती और पर्दा प्रथा समाप्त कर महिलाओं को समानता दी, आनंद साहिब की रचना की, गोइन्दवाल में ८४ पौड़ियों वाली पावन बाओली बनवाई और २२ मंजियों की व्यवस्था स्थापित की।",
        "legacyPa": "ਇਸਤਰੀਆਂ ਨੂੰ ਬਰਾਬਰ ਦਾ ਦਰਜਾ ਦਿਵਾਇਆ, 'ਅਨੰਦੁ ਸਾਹਿਬ' ਦੀ ਰਚਨਾ ਕੀਤੀ, ਗੋਇੰਦਵਾਲ ਵਿਖੇ ੮੪ ਪਉੜੀਆਂ ਵਾਲੀ ਬਾਉਲੀ ਸਾਹਿਬ ਕਾਇਮ ਕੀਤੀ ਅਤੇ ੨੨ ਮੰਜੀਆਂ ਰਾਹੀਂ ਪ੍ਰਚਾਰ ਪ੍ਰਣਾਲੀ ਕਾਇਮ ਕੀਤੀ।",
        "source": "Sri Guru Granth Sahib (Anand Sahib, Ramkali Mahalla 3, Angs 917–922), Mahima Prakash, Bansavalinama",
        "sourceLocal": "श्री गुरु ग्रंथ साहिब (आनंद साहिब, राग रामकली महला ३, अंग ९१७–९२२), महिमा प्रकाश, बंसावलीनामा",
        "sourcePa": "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ (ਅਨੰਦੁ ਸਾਹਿਬ, ਰਾਮਕਲੀ ਮਹਲਾ ੩, ਅੰਗ ੯੧੭–੯੨੨), ਮਹਿਮਾ ਪ੍ਰਕਾਸ਼, ਬੰਸਾਵਲੀਨਾਮਾ",
        "sourceCitations": [
            {"sourceName": "Sri Guru Granth Sahib", "sourceRef": "Anand Sahib (Ramkali M. 3, Angs 917–922)", "tier": 1},
            {"sourceName": "Bhai Gurdas Ji", "sourceRef": "Varan, Var 1, Pauri 46; Var 24, Pauri 7", "tier": 1},
            {"sourceName": "Mahima Prakash", "sourceRef": "Sakhi Guru Amar Das Ji", "tier": 1}
        ],
        "quote": {
            "text": "Anandu bhaya meri maaye satguru mai paaya, satguru ta paaya sahaj seti man vajiya vadhaaiya.",
            "attribution": "I am in ecstasy, O my mother, for I have found my True Guru; I have found the True Guru with effortless intuitive ease, and celestial melodies ring in my mind. — Guru Amar Das Ji, Sri Guru Granth Sahib (Ang 917)"
        },
        "quoteLocal": {
            "text": "अनंदु भइआ मेरी माए सतिगुरु मै पाइआ। सतिगुरु त पाइआ सहज सेती मनि वजीआ वाधाईआ॥",
            "attribution": "गुरु अमर दास जी (श्री गुरु ग्रंथ साहिब, अंग ९१७)"
        },
        "quotePa": {
            "text": "ਅਨੰਦੁ ਭਇਆ ਮੇਰੀ ਮਾਏ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ ॥ ਸਤਿਗੁਰੁ ਤ ਪਾਇਆ ਸਹਜ ਸੇਤੀ ਮਨਿ ਵਜੀਆ ਵਾਧਾਈਆ ॥",
            "attribution": "ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ (ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ, ਅੰਗ ੯੧੭)"
        },
        "illustrationPrompt": "Raja Ravi Varma style oil painting depicting Mughal Emperor Akbar sitting cross-legged on a simple woven rug in the communal open-air Langar at Goindval Sahib, sharing a simple meal of dal and roti with humble villagers, while Guru Amar Das watches with profound serene compassion."
    }
]

print(f"Loaded initial Sikh heroes: {len(SIKH_HEROES)}")
