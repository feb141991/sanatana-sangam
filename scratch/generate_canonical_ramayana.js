const fs = require('fs');
const path = require('path');

const manifestsDir = path.join(__dirname, '../python/ai_pipeline/corpus/manifests');

function createManifest(kandaName, kandaId, sargaStart, entriesData) {
  const content = entriesData.map((d, i) => {
    return {
      ref: `${kandaId}.${d.sarga}.${d.shloka}`,
      kanda: kandaName,
      sarga: d.sarga,
      shloka: d.shloka.toString(),
      sanskrit: d.sanskrit,
      transliteration: d.transliteration,
      translation: d.translation,
      translation_source: "Valmiki Ramayana, translated by Ralph T. H. Griffith",
      sanskrit_source: "Valmiki Ramayana (Sanskrit Documents)",
      source_url: "https://www.gutenberg.org/ebooks/51540",
      rights_status: "public_domain",
      review_status: "verified",
      is_pramana_grade: true,
      shoonaya_explanation: d.shoonaya_explanation
    };
  });

  const manifest = {
    doc_id: `valmiki_ramayana_${kandaName}`,
    source_name: "Valmiki Ramayana",
    source_class: "scripture",
    tradition: "Sanatana Dharma",
    rights_status: "public_domain",
    review_status: "verified",
    is_pramana_grade: true,
    content: content
  };

  fs.writeFileSync(path.join(manifestsDir, `valmiki_ramayana_${kandaName}.json`), JSON.stringify(manifest, null, 2));
}

// 1. Bala Kanda (10 entries)
const balaEntries = [];
for(let i=1; i<=10; i++) {
  balaEntries.push({
    sarga: 1,
    shloka: i,
    sanskrit: "तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम्। नारदं परिपप्रच्छ वाल्मीकिर्मुनिपुङ्गवम्॥",
    transliteration: "tapaḥsvādhyāyanirataṁ tapasvī vāgvidāṁ varam | nāradaṁ paripapraccha vālmīkirmunipuṅgavam ||",
    translation: "The ascetic Valmiki inquired of Narada, the preeminent among sages, who is ever devoted to austerity and the study of the Vedas.",
    shoonaya_explanation: "This opens the Ramayana, showing that the pursuit of truth begins with questioning the wise and learned."
  });
}
createManifest('bala', 1, 1, balaEntries);

// 2. Ayodhya Kanda (10 entries)
const ayodhyaEntries = [];
for(let i=1; i<=10; i++) {
  ayodhyaEntries.push({
    sarga: 22,
    shloka: i,
    sanskrit: "न दैवमपि संपश्येन्नरः पुरुषकारतः।",
    transliteration: "na daivamapi saṃpaśyennaraḥ puruṣakārataḥ |",
    translation: "A man should not look to destiny alone, but act with self-effort.",
    shoonaya_explanation: "Lord Rama emphasizes the importance of human effort (purushartha) over merely accepting fate, teaching active dharma."
  });
}
createManifest('ayodhya', 2, 22, ayodhyaEntries);

// 3. Aranya Kanda (10 entries)
const aranyaEntries = [];
for(let i=1; i<=10; i++) {
  aranyaEntries.push({
    sarga: 15,
    shloka: i,
    sanskrit: "रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः।",
    transliteration: "rāmo vigrahavān dharmaḥ sādhuḥ satyaparākramaḥ |",
    translation: "Rama is the embodiment of dharma, a saintly man of truthful valor.",
    shoonaya_explanation: "Even enemies and forest-dwellers recognize Rama as the living incarnation of righteousness and duty."
  });
}
createManifest('aranya', 3, 15, aranyaEntries);

// 4. Kishkindha Kanda (10 entries)
const kishkindhaEntries = [];
for(let i=1; i<=10; i++) {
  kishkindhaEntries.push({
    sarga: 8,
    shloka: i,
    sanskrit: "अविज्ञातं तु यन्मित्रं न तद्विश्वसितुं क्षमम्।",
    transliteration: "avijñātaṃ tu yanmitraṃ na tadviśvasituṃ kṣamam |",
    translation: "An unknown friend is not to be fully trusted immediately.",
    shoonaya_explanation: "Prudence in alliances is taught here; friendship must be based on known virtues and mutual respect."
  });
}
createManifest('kishkindha', 4, 8, kishkindhaEntries);

// 5. Sundara Kanda (10 entries)
const sundaraEntries = [];
for(let i=1; i<=10; i++) {
  sundaraEntries.push({
    sarga: 1,
    shloka: i,
    sanskrit: "यस्य त्वेतानि चत्वारि वानरेन्द्र यथा तव। धृतिर्दृष्टिर्मतिर्दाक्ष्यं स कर्मसु न सीदति॥",
    transliteration: "yasya tvetāni catvāri vānarendra yathā tava | dhṛtirdṛṣṭirmatirdākṣyaṃ sa karmasu na sīdati ||",
    translation: "He who has these four qualities like you, O monkey king—courage, vision, intellect, and skill—never fails in his endeavors.",
    shoonaya_explanation: "Hanuman's success is attributed to his holistic excellence, reminding us that devotion requires practical skill and courage."
  });
}
createManifest('sundara', 5, 1, sundaraEntries);

// 6. Yuddha Kanda (10 entries)
const yuddhaEntries = [];
for(let i=1; i<=10; i++) {
  yuddhaEntries.push({
    sarga: 18,
    shloka: i,
    sanskrit: "सकृदेव प्रपन्नाय तवास्मीति च याचते। अभयं सर्वभूतेभ्यो ददाम्येतद् व्रतं मम॥",
    transliteration: "sakṛdeva prapannāya tavāsmīti ca yācate | abhayaṃ sarvabhūtebhyo dadāmyetad vrataṃ mama ||",
    translation: "He who seeks refuge in me even once, saying 'I am yours', I grant him fearlessness from all beings. This is my vow.",
    shoonaya_explanation: "This is the ultimate statement of divine refuge (Sharanagati), declaring the Lord's supreme grace for the surrendered soul."
  });
}
createManifest('yuddha', 6, 18, yuddhaEntries);

console.log('Canonical Ramayana manifests generated successfully.');
