export type DharmVeerSeed = {
  slug: string;
  name: string;
  name_local?: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'sufi' | 'tribal';
  era: 'ancient' | 'medieval' | 'modern' | 'contemporary';
  tags: string[];
};

type Tradition = DharmVeerSeed['tradition'];
type Era = DharmVeerSeed['era'];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function seed(
  tradition: Tradition,
  era: Era,
  name: string,
  tags: string[],
  name_local?: string,
): DharmVeerSeed {
  return {
    slug: slugify(name),
    name,
    name_local,
    tradition,
    era,
    tags,
  };
}

function archetypeSeeds(
  tradition: Tradition,
  era: Era,
  titles: readonly string[],
  places: readonly string[],
  tags: string[],
): DharmVeerSeed[] {
  return titles.flatMap((title) =>
    places.map((place) => seed(tradition, era, `${title} of ${place}`, tags)),
  );
}

const HINDU_REAL = [
  seed('hindu', 'ancient', 'Prahlad', ['bhakti', 'devotion', 'courage', 'vishnu'], 'प्रह्लाद'),
  seed('hindu', 'ancient', 'Dhruv', ['devotion', 'determination', 'child-saint'], 'ध्रुव'),
  seed('hindu', 'ancient', 'Savitri', ['women', 'love', 'death', 'courage'], 'सावित्री'),
  seed('hindu', 'ancient', 'Ashtavakra', ['advaita', 'wisdom', 'disability'], 'अष्टावक्र'),
  seed('hindu', 'medieval', 'Mirabai', ['bhakti', 'krishna', 'women', 'poetry'], 'मीराबाई'),
  seed('hindu', 'medieval', 'Tukaram', ['bhakti', 'vithoba', 'poetry', 'common-people'], 'तुकाराम'),
  seed('hindu', 'medieval', 'Kabir', ['nirgun', 'unity', 'weaver', 'poetry'], 'कबीर'),
  seed('hindu', 'ancient', 'Chanakya', ['strategy', 'dharma', 'governance', 'teaching'], 'चाणक्य'),
  seed('hindu', 'ancient', 'Adi Shankaracharya', ['advaita', 'philosophy', 'revival'], 'आदि शंकराचार्य'),
  seed('hindu', 'medieval', 'Ramanujacharya', ['vishishtadvaita', 'bhakti', 'social-reform'], 'रामानुजाचार्य'),
  seed('hindu', 'modern', 'Swami Vivekananda', ['vedanta', 'youth', 'nation', 'strength'], 'स्वामी विवेकानंद'),
  seed('hindu', 'modern', 'Ramakrishna Paramahamsa', ['devotion', 'kali', 'unity', 'mysticism'], 'रामकृष्ण परमहंस'),
  seed('hindu', 'modern', 'Ramana Maharshi', ['self-inquiry', 'advaita', 'silence'], 'रमण महर्षि'),
  seed('hindu', 'ancient', 'Andal', ['alwar', 'bhakti', 'women', 'vishnu'], 'आंडाल'),
  seed('hindu', 'medieval', 'Akka Mahadevi', ['lingayat', 'shiva', 'women', 'renunciation'], 'अक्का महादेवी'),
  seed('hindu', 'medieval', 'Chhatrapati Shivaji', ['warrior', 'dharma', 'governance', 'courage'], 'छत्रपति शिवाजी'),
  seed('hindu', 'modern', 'Rani Lakshmibai', ['warrior', 'women', 'sacrifice', 'freedom'], 'रानी लक्ष्मीबाई'),
  seed('hindu', 'ancient', 'Hanuman', ['service', 'strength', 'rama', 'devotion'], 'हनुमान'),
  seed('hindu', 'ancient', 'Bhishma', ['vow', 'duty', 'sacrifice'], 'भीष्म'),
  seed('hindu', 'ancient', 'Arjuna', ['focus', 'warrior', 'gita'], 'अर्जुन'),
  seed('hindu', 'ancient', 'Karna', ['charity', 'loyalty', 'honour'], 'कर्ण'),
  seed('hindu', 'ancient', 'Yudhishthira', ['truth', 'dharma', 'kingship'], 'युधिष्ठिर'),
  seed('hindu', 'ancient', 'Bhagiratha', ['tapas', 'ganga', 'perseverance'], 'भगीरथ'),
  seed('hindu', 'ancient', 'Harishchandra', ['truth', 'integrity', 'sacrifice'], 'हरिश्चंद्र'),
  seed('hindu', 'ancient', 'Markandeya', ['shiva', 'deathless-faith'], 'मार्कण्डेय'),
  seed('hindu', 'ancient', 'Nachiketa', ['upanishad', 'death', 'wisdom'], 'नचिकेता'),
  seed('hindu', 'ancient', 'Ekalavya', ['discipline', 'learning', 'archery'], 'एकलव्य'),
  seed('hindu', 'ancient', 'Shabari', ['bhakti', 'rama', 'waiting'], 'शबरी'),
  seed('hindu', 'ancient', 'Vidura', ['wisdom', 'ethics', 'counsel'], 'विदुर'),
  seed('hindu', 'ancient', 'Gargi', ['women', 'philosophy', 'veda'], 'गार्गी'),
  seed('hindu', 'ancient', 'Maitreyi', ['women', 'self-knowledge', 'upanishad'], 'मैत्रेयी'),
  seed('hindu', 'ancient', 'Satyakama Jabala', ['truth', 'studenthood', 'upanishad'], 'सत्यकाम जाबाल'),
  seed('hindu', 'ancient', 'Valmiki', ['transformation', 'poetry', 'rama'], 'वाल्मीकि'),
  seed('hindu', 'ancient', 'Vyasa', ['scripture', 'compiler', 'mahābhārata'], 'व्यास'),
  seed('hindu', 'ancient', 'Nammalvar', ['alwar', 'bhakti', 'vishnu'], 'नम्मालवार'),
  seed('hindu', 'ancient', 'Tiruppan Alvar', ['alwar', 'equality', 'devotion'], 'तिरुप्पाण आळवार'),
  seed('hindu', 'medieval', 'Narsinh Mehta', ['bhakti', 'krishna', 'equality'], 'नरसिंह मेहता'),
  seed('hindu', 'medieval', 'Surdas', ['bhakti', 'poetry', 'krishna'], 'सूरदास'),
  seed('hindu', 'medieval', 'Tulsidas', ['rama', 'poetry', 'scripture'], 'तुलसीदास'),
  seed('hindu', 'medieval', 'Namdev', ['bhakti', 'varkari', 'poetry'], 'नामदेव'),
  seed('hindu', 'medieval', 'Dnyaneshwar', ['jnana', 'varkari', 'commentary'], 'ज्ञानेश्वर'),
  seed('hindu', 'medieval', 'Eknath', ['bhakti', 'service', 'equality'], 'एकनाथ'),
  seed('hindu', 'medieval', 'Samarth Ramdas', ['discipline', 'rama', 'strength'], 'समर्थ रामदास'),
  seed('hindu', 'medieval', 'Basaveshwara', ['lingayat', 'equality', 'work'], 'बसवेश्वर'),
  seed('hindu', 'medieval', 'Kanakadasa', ['bhakti', 'karnataka', 'equality'], 'कनकदास'),
  seed('hindu', 'medieval', 'Purandara Dasa', ['music', 'bhakti', 'haridasa'], 'पुरंदर दास'),
  seed('hindu', 'medieval', 'Tyagaraja', ['music', 'rama', 'bhakti'], 'त्यागराज'),
  seed('hindu', 'medieval', 'Annamacharya', ['music', 'venkatesha', 'bhakti'], 'अन्नमाचार्य'),
  seed('hindu', 'medieval', 'Chaitanya Mahaprabhu', ['kirtan', 'krishna', 'ecstasy'], 'चैतन्य महाप्रभु'),
  seed('hindu', 'medieval', 'Rupa Goswami', ['gaudiya', 'bhakti', 'theology'], 'रूप गोस्वामी'),
  seed('hindu', 'medieval', 'Jiva Goswami', ['gaudiya', 'scholarship', 'bhakti'], 'जीव गोस्वामी'),
  seed('hindu', 'medieval', 'Vallabhacharya', ['pushtimarg', 'krishna', 'grace'], 'वल्लभाचार्य'),
  seed('hindu', 'medieval', 'Nimbarkacharya', ['vedanta', 'radha-krishna'], 'निंबार्काचार्य'),
  seed('hindu', 'medieval', 'Madhvacharya', ['dvaita', 'vedanta', 'vishnu'], 'मध्वाचार्य'),
  seed('hindu', 'medieval', 'Vedanta Desika', ['srivaishnava', 'poetry', 'logic'], 'वेदांत देशिक'),
  seed('hindu', 'medieval', 'Pillai Lokacharya', ['srivaishnava', 'grace', 'teacher'], 'पिल्लै लोकाचार्य'),
  seed('hindu', 'modern', 'Aurobindo', ['yoga', 'nation', 'integral'], 'अरविंद'),
  seed('hindu', 'modern', 'The Mother', ['integral-yoga', 'service', 'ashram'], 'माता'),
  seed('hindu', 'modern', 'Anandamayi Ma', ['women', 'mystic', 'bhakti'], 'आनंदमयी माँ'),
  seed('hindu', 'modern', 'Mata Amritanandamayi', ['compassion', 'service', 'bhakti'], 'माता अमृतानंदमयी'),
  seed('hindu', 'modern', 'Dayananda Saraswati', ['reform', 'veda', 'arya-samaj'], 'दयानंद सरस्वती'),
  seed('hindu', 'modern', 'Trailanga Swami', ['renunciation', 'kashi', 'mystic'], 'त्रैलंग स्वामी'),
  seed('hindu', 'modern', 'Neem Karoli Baba', ['bhakti', 'service', 'hanuman'], 'नीम करौली बाबा'),
  seed('hindu', 'modern', 'Rani Rashmoni', ['women', 'temple', 'service'], 'रानी रश्मोनि'),
  seed('hindu', 'modern', 'Bhaktivedanta Swami Prabhupada', ['gaudiya', 'global', 'krishna'], 'भक्तिवेदांत स्वामी प्रभुपाद'),
  seed('hindu', 'modern', 'Sister Nivedita', ['service', 'education', 'vivekananda'], 'सिस्टर निवेदिता'),
  seed('hindu', 'contemporary', 'Sindhutai Sapkal', ['compassion', 'care', 'women'], 'सिंधुताई सपकाल'),
];

const SIKH_REAL = [
  seed('sikh', 'medieval', 'Guru Nanak Dev Ji', ['founder', 'equality', 'oneness', 'travel'], 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Angad Dev Ji', ['gurmukhi', 'discipline', 'service'], 'ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Amar Das Ji', ['langar', 'equality', 'service'], 'ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Ram Das Ji', ['humility', 'amritsar', 'kirtan'], 'ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Arjan Dev Ji', ['martyrdom', 'adi-granth', 'equanimity'], 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Hargobind Sahib Ji', ['miri-piri', 'saint-soldier'], 'ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Har Rai Ji', ['compassion', 'care', 'nature'], 'ਗੁਰੂ ਹਰਿ ਰਾਇ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Har Krishan Ji', ['service', 'healing', 'child-guru'], 'ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Tegh Bahadur Ji', ['martyrdom', 'freedom', 'hind-di-chadar'], 'ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ'),
  seed('sikh', 'medieval', 'Guru Gobind Singh Ji', ['khalsa', 'sacrifice', 'warrior-saint', 'family'], 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Mata Khivi Ji', ['langar', 'women', 'service'], 'ਮਾਤਾ ਖੀਵੀ ਜੀ'),
  seed('sikh', 'medieval', 'Bibi Nanaki Ji', ['support', 'faith', 'family'], 'ਬੀਬੀ ਨਾਨਕੀ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Mardana Ji', ['music', 'companion', 'travel'], 'ਭਾਈ ਮਰਦਾਨਾ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Lehna Ji', ['discipleship', 'guru-bhakti'], 'ਭਾਈ ਲਹਿਣਾ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Gurdas Ji', ['scribe', 'interpretation', 'wisdom'], 'ਭਾਈ ਗੁਰਦਾਸ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Mani Singh Ji', ['martyrdom', 'scripture', 'seva'], 'ਭਾਈ ਮਨੀ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Taru Singh Ji', ['martyrdom', 'kes', 'steadfastness'], 'ਭਾਈ ਤਾਰੂ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Kanhaiya Ji', ['seva', 'compassion', 'battlefield', 'equality'], 'ਭਾਈ ਕਨ੍ਹੱਈਆ ਜੀ'),
  seed('sikh', 'medieval', 'Mai Bhago', ['warrior', 'women', 'courage', 'forty-muktas'], 'ਮਾਈ ਭਾਗੋ'),
  seed('sikh', 'medieval', 'Baba Deep Singh Ji', ['martyrdom', 'warrior', 'granth'], 'ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Banda Singh Bahadur', ['justice', 'warrior', 'land-reform'], 'ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ'),
  seed('sikh', 'medieval', 'Bhai Jaita Ji', ['service', 'loyalty', 'sacrifice'], 'ਭਾਈ ਜੈਤਾ ਜੀ'),
  seed('sikh', 'medieval', 'Bhai Nand Lal Ji', ['poetry', 'devotion', 'court'], 'ਭਾਈ ਨੰਦ ਲਾਲ ਜੀ'),
  seed('sikh', 'medieval', 'Mata Gujri Ji', ['steadfastness', 'family', 'sacrifice'], 'ਮਾਤਾ ਗੁਜਰੀ ਜੀ'),
  seed('sikh', 'medieval', 'Sahibzada Ajit Singh Ji', ['youth', 'courage', 'martyrdom'], 'ਸਾਹਿਬਜ਼ਾਦਾ ਅਜੀਤ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Sahibzada Jujhar Singh Ji', ['youth', 'battle', 'martyrdom'], 'ਸਾਹਿਬਜ਼ਾਦਾ ਜੁਝਾਰ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Sahibzada Zorawar Singh Ji', ['youth', 'steadfastness', 'martyrdom'], 'ਸਾਹਿਬਜ਼ਾਦਾ ਜੋਰਾਵਰ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'medieval', 'Sahibzada Fateh Singh Ji', ['youth', 'steadfastness', 'martyrdom'], 'ਸਾਹਿਬਜ਼ਾਦਾ ਫਤਿਹ ਸਿੰਘ ਜੀ'),
  seed('sikh', 'modern', 'Kartar Singh Sarabha', ['freedom', 'youth', 'sacrifice'], 'ਕਰਤਾਰ ਸਿੰਘ ਸਰਾਭਾ'),
  seed('sikh', 'modern', 'Bhai Randhir Singh', ['nam-simran', 'discipline', 'prison'], 'ਭਾਈ ਰੰਧੀਰ ਸਿੰਘ'),
  seed('sikh', 'modern', 'Mata Bhag Kaur', ['women', 'seva', 'resilience'], 'ਮਾਤਾ ਭਾਗ ਕੌਰ'),
  seed('sikh', 'modern', 'Sant Attar Singh', ['education', 'seva', 'gurmat'], 'ਸੰਤ ਅੱਤਰ ਸਿੰਘ'),
  seed('sikh', 'modern', 'Sant Jarnail Singh Bhindranwale', ['identity', 'steadfastness', 'gurmat'], 'ਸੰਤ ਜਰਨੈਲ ਸਿੰਘ ਭਿੰਡਰਾਂਵਾਲੇ'),
];

const BUDDHIST_REAL = [
  seed('buddhist', 'ancient', 'Angulimala', ['transformation', 'compassion', 'buddha', 'redemption'], 'अंगुलिमाल'),
  seed('buddhist', 'medieval', 'Milarepa', ['tibet', 'guru', 'transformation', 'renunciation'], 'मिलारेपा'),
  seed('buddhist', 'ancient', 'Nagarjuna', ['madhyamaka', 'philosophy', 'emptiness'], 'नागार्जुन'),
  seed('buddhist', 'ancient', 'Ananda', ['memory', 'service', 'disciple'], 'आनंद'),
  seed('buddhist', 'ancient', 'Mahakashyapa', ['renunciation', 'lineage', 'austerity'], 'महाकाश्यप'),
  seed('buddhist', 'ancient', 'Sariputta', ['wisdom', 'disciple', 'clarity'], 'शारिपुत्र'),
  seed('buddhist', 'ancient', 'Moggallana', ['meditation', 'powers', 'disciple'], 'मौद्गल्यायन'),
  seed('buddhist', 'ancient', 'Mahapajapati Gotami', ['women', 'sangha', 'ordination'], 'महापजापती गौतमी'),
  seed('buddhist', 'ancient', 'Kisa Gotami', ['grief', 'awakening', 'impermanence'], 'किसा गोतमी'),
  seed('buddhist', 'ancient', 'Ashoka', ['dhamma', 'empire', 'transformation'], 'अशोक'),
  seed('buddhist', 'ancient', 'Sanghamitta', ['women', 'mission', 'bodhi-tree'], 'संगमित्त्ता'),
  seed('buddhist', 'ancient', 'Mahinda', ['mission', 'sri-lanka', 'dhamma'], 'महिंद'),
  seed('buddhist', 'ancient', 'Bodhidharma', ['zen', 'discipline', 'directness'], 'बोधिधर्म'),
  seed('buddhist', 'ancient', 'Vimalakirti', ['lay-practice', 'wisdom', 'mahayana'], 'विमलकीर्ति'),
  seed('buddhist', 'ancient', 'Shantideva', ['bodhicitta', 'compassion', 'poetry'], 'शांतिदेव'),
  seed('buddhist', 'ancient', 'Atisha', ['lamrim', 'tibet', 'discipline'], 'अतीश'),
  seed('buddhist', 'medieval', 'Tsongkhapa', ['gelug', 'clarity', 'vinaya'], 'त्सोंगखापा'),
  seed('buddhist', 'medieval', 'Padmasambhava', ['vajrayana', 'tibet', 'transformation'], 'पद्मसम्भव'),
  seed('buddhist', 'medieval', 'Yeshe Tsogyal', ['women', 'vajrayana', 'tibet'], 'येशे त्सोग्याल'),
  seed('buddhist', 'medieval', 'Xuanzang', ['pilgrimage', 'translation', 'scholarship'], 'ह्वेनसांग'),
  seed('buddhist', 'medieval', 'Huineng', ['chan', 'sudden-awakening', 'simplicity'], 'हुइनेंग'),
  seed('buddhist', 'modern', 'Anagarika Dharmapala', ['revival', 'bodh-gaya', 'mission'], 'अनागरिक धर्मपाल'),
  seed('buddhist', 'modern', 'Dr B. R. Ambedkar', ['navayana', 'justice', 'dignity'], 'डॉ. बी. आर. आंबेडकर'),
  seed('buddhist', 'modern', 'Thich Nhat Hanh', ['mindfulness', 'peace', 'engaged-buddhism'], 'थिक न्यात हान्ह'),
  seed('buddhist', 'modern', 'The Fourteenth Dalai Lama', ['compassion', 'exile', 'teaching'], 'दलाई लामा'),
  seed('buddhist', 'modern', 'Pema Chodron', ['courage', 'practice', 'fear'], 'पेमा चोद्रोन'),
  seed('buddhist', 'modern', 'Sayagyi U Ba Khin', ['vipassana', 'lay-teacher', 'discipline'], 'उ बा खिन'),
  seed('buddhist', 'modern', 'S. N. Goenka', ['vipassana', 'global', 'practice'], 'एस. एन. गोयंका'),
  seed('buddhist', 'modern', 'Ajahn Chah', ['forest-tradition', 'simplicity', 'wisdom'], 'अजान चा'),
  seed('buddhist', 'modern', 'Dipa Ma', ['householder', 'meditation', 'women'], 'दीपा मा'),
];

const JAIN_REAL = [
  seed('jain', 'ancient', 'Bahubali', ['renunciation', 'pride', 'meditation', 'victory'], 'बाहुबली'),
  seed('jain', 'ancient', 'Sthulabhadra', ['renunciation', 'temptation', 'brahmacharya'], 'स्थूलभद्र'),
  seed('jain', 'ancient', 'Rishabhanatha', ['tirthankara', 'origins', 'civilization'], 'ऋषभनाथ'),
  seed('jain', 'ancient', 'Ajitanatha', ['tirthankara', 'steadfastness'], 'अजितनाथ'),
  seed('jain', 'ancient', 'Sambhavanatha', ['tirthankara', 'compassion'], 'संभवनाथ'),
  seed('jain', 'ancient', 'Abhinandananatha', ['tirthankara', 'equanimity'], 'अभिनंदननाथ'),
  seed('jain', 'ancient', 'Sumatinatha', ['tirthankara', 'wisdom'], 'सुमतिनाथ'),
  seed('jain', 'ancient', 'Padmaprabha', ['tirthankara', 'purity'], 'पद्मप्रभ'),
  seed('jain', 'ancient', 'Suparshvanatha', ['tirthankara', 'forgiveness'], 'सुपार्श्वनाथ'),
  seed('jain', 'ancient', 'Chandraprabha', ['tirthankara', 'radiance'], 'चन्द्रप्रभ'),
  seed('jain', 'ancient', 'Pushpadanta', ['tirthankara', 'discipline'], 'पुष्पदंत'),
  seed('jain', 'ancient', 'Shitalanatha', ['tirthankara', 'coolness', 'peace'], 'शीतलनाथ'),
  seed('jain', 'ancient', 'Shreyansanatha', ['tirthankara', 'compassion'], 'श्रेयांसनाथ'),
  seed('jain', 'ancient', 'Vasupujya', ['tirthankara', 'generosity'], 'वसुपूज्य'),
  seed('jain', 'ancient', 'Vimalanatha', ['tirthankara', 'purity'], 'विमलनाथ'),
  seed('jain', 'ancient', 'Anantanatha', ['tirthankara', 'infinity'], 'अनंतनाथ'),
  seed('jain', 'ancient', 'Dharmanatha', ['tirthankara', 'dharma'], 'धर्मनाथ'),
  seed('jain', 'ancient', 'Shantinatha', ['tirthankara', 'peace'], 'शांतिनाथ'),
  seed('jain', 'ancient', 'Kunthunatha', ['tirthankara', 'restraint'], 'कुंथुनाथ'),
  seed('jain', 'ancient', 'Aranatha', ['tirthankara', 'detachment'], 'अरनाथ'),
  seed('jain', 'ancient', 'Mallinatha', ['tirthankara', 'women', 'purity'], 'मल्लिनाथ'),
  seed('jain', 'ancient', 'Munisuvratanatha', ['tirthankara', 'vow'], 'मुनिसुव्रतनाथ'),
  seed('jain', 'ancient', 'Naminatha', ['tirthankara', 'humility'], 'नमिनाथ'),
  seed('jain', 'ancient', 'Neminatha', ['tirthankara', 'ahimsa', 'renunciation'], 'नेमिनाथ'),
  seed('jain', 'ancient', 'Parshvanatha', ['tirthankara', 'compassion', 'ahimsa'], 'पार्श्वनाथ'),
  seed('jain', 'ancient', 'Mahavira', ['tirthankara', 'ahimsa', 'freedom'], 'महावीर'),
  seed('jain', 'ancient', 'Chandanbala', ['women', 'compassion', 'charity'], 'चंदनबाला'),
  seed('jain', 'ancient', 'Arya Sudharma', ['ganadhara', 'lineage', 'teaching'], 'आर्य सुधर्मा'),
  seed('jain', 'ancient', 'Kundakunda', ['philosophy', 'self', 'digambara'], 'कुंदकुंद'),
  seed('jain', 'ancient', 'Umasvati', ['tattvartha-sutra', 'philosophy'], 'उमास्वाति'),
  seed('jain', 'medieval', 'Haribhadra Suri', ['scholarship', 'dialogue', 'ethics'], 'हरिभद्र सूरी'),
  seed('jain', 'medieval', 'Hemachandra', ['scholar', 'grammar', 'ethics'], 'हेमचंद्र'),
  seed('jain', 'modern', 'Acharya Tulsi', ['anuvrat', 'reform', 'ethics'], 'आचार्य तुलसी'),
  seed('jain', 'modern', 'Acharya Mahapragya', ['preksha', 'meditation', 'ahimsa'], 'आचार्य महाप्रज्ञ'),
  seed('jain', 'modern', 'Virchand Gandhi', ['dialogue', 'global', 'representation'], 'वीरचंद गांधी'),
];

const SUFI_REAL = [
  seed('sufi', 'medieval', 'Khwaja Moinuddin Chishti', ['compassion', 'service', 'ajmer'], 'ख्वाजा मोइनुद्दीन चिश्ती'),
  seed('sufi', 'medieval', 'Nizamuddin Auliya', ['love', 'service', 'delhi'], 'निज़ामुद्दीन औलिया'),
  seed('sufi', 'medieval', 'Baba Farid', ['poetry', 'asceticism', 'punjab'], 'बाबा फरीद'),
  seed('sufi', 'medieval', 'Bulleh Shah', ['poetry', 'unity', 'love'], 'बुल्ले शाह'),
  seed('sufi', 'medieval', 'Shah Abdul Latif Bhittai', ['poetry', 'sindh', 'love'], 'शाह अब्दुल लतीफ भिट्टाई'),
  seed('sufi', 'medieval', 'Lal Shahbaz Qalandar', ['ecstasy', 'qalandar', 'devotion'], 'लाल शाहबाज़ क़लंदर'),
  seed('sufi', 'medieval', 'Amir Khusrau', ['poetry', 'music', 'devotion'], 'अमीर खुसरो'),
  seed('sufi', 'medieval', 'Shah Madar', ['wandering', 'service', 'faqr'], 'शाह मदार'),
  seed('sufi', 'medieval', 'Gesu Daraz', ['teaching', 'deccan', 'service'], 'गेसू दराज़'),
  seed('sufi', 'medieval', 'Sarmad Kashani', ['fearlessness', 'truth', 'mystic'], 'सरमद काशानी'),
  seed('sufi', 'modern', 'Hazrat Inayat Khan', ['music', 'unity', 'east-west'], 'इनायत ख़ान'),
  seed('sufi', 'modern', 'Bibi Fatima Sam', ['women', 'saint', 'detachment'], 'बीबी फ़ातिमा सम'),
  seed('sufi', 'modern', 'Waris Ali Shah', ['love', 'unity', 'service'], 'वारिस अली शाह'),
  seed('sufi', 'modern', 'Ashraf Ali Thanwi', ['discipline', 'spirituality', 'guidance'], 'अशरफ़ अली थानवी'),
  seed('sufi', 'contemporary', 'Abida Parveen', ['music', 'devotion', 'poetry'], 'आबिदा परवीन'),
];

const TRIBAL_REAL = [
  seed('tribal', 'modern', 'Birsa Munda', ['freedom', 'tribal', 'faith', 'resistance'], 'बिरसा मुंडा'),
  seed('tribal', 'modern', 'Sidho Murmu', ['santhal', 'freedom', 'resistance'], 'सिदो मुर्मू'),
  seed('tribal', 'modern', 'Kanho Murmu', ['santhal', 'freedom', 'resistance'], 'कान्हू मुर्मू'),
  seed('tribal', 'modern', 'Phulo Murmu', ['women', 'santhal', 'courage'], 'फुलो मुर्मू'),
  seed('tribal', 'modern', 'Jhano Murmu', ['women', 'santhal', 'courage'], 'झानो मुर्मू'),
  seed('tribal', 'modern', 'Tilka Manjhi', ['freedom', 'forest', 'resistance'], 'तिलका मांझी'),
  seed('tribal', 'modern', 'Tantya Bhil', ['freedom', 'bhil', 'resistance'], 'टंट्या भील'),
  seed('tribal', 'modern', 'Rani Gaidinliu', ['women', 'freedom', 'naga'], 'रानी गैदिन्लियु'),
  seed('tribal', 'modern', 'Komaram Bheem', ['jal-jangal-zameen', 'gond', 'resistance'], 'कोमाराम भीम'),
  seed('tribal', 'modern', 'Alluri Sitarama Raju', ['forest', 'resistance', 'tribal-solidarity'], 'अल्लूरी सीताराम राजू'),
  seed('tribal', 'modern', 'Telanga Kharia', ['freedom', 'kharia', 'justice'], 'तेलंगा खड़िया'),
  seed('tribal', 'modern', 'Jatra Tana Bhagat', ['nonviolence', 'oraon', 'reform'], 'जतरा टाना भगत'),
  seed('tribal', 'modern', 'Jaipal Singh Munda', ['leadership', 'identity', 'rights'], 'जयपाल सिंह मुंडा'),
  seed('tribal', 'modern', 'Lachit Borphukan', ['defence', 'land', 'honour'], 'लाचित बरफुकन'),
  seed('tribal', 'modern', 'Tirot Sing', ['khasi', 'freedom', 'resistance'], 'तिरोत सिंह'),
];

const HINDU_ARCHETYPES = archetypeSeeds(
  'hindu',
  'medieval',
  ['Temple builder', 'Bhakti singer', 'Pilgrim guide', 'Forest ascetic', 'Village Sanskrit teacher', 'River guardian', 'Dharma queen', 'Kirtan drummer'],
  ['Kashi', 'Ujjain', 'Puri', 'Rameswaram', 'Kanchi', 'Nashik', 'Dwarka', 'Vrindavan', 'Chitrakoot', 'Srirangam'],
  ['dharma', 'service', 'memory'],
);

const SIKH_ARCHETYPES = archetypeSeeds(
  'sikh',
  'modern',
  ['Langar sevadar', 'Gurbani teacher', 'Nagar kirtan volunteer', 'Sarbat da bhala organiser', 'Shaheed memorial caretaker', 'Amritdhari youth mentor'],
  ['Amritsar', 'Anandpur Sahib', 'Kartarpur', 'Patna Sahib', 'Hazur Sahib', 'Muktsar', 'Fatehgarh Sahib', 'Ludhiana', 'Delhi', 'Nanded'],
  ['seva', 'sangat', 'discipline'],
);

const BUDDHIST_ARCHETYPES = archetypeSeeds(
  'buddhist',
  'contemporary',
  ['Forest monk', 'Mindfulness teacher', 'Stupa restorer', 'Translation nun', 'Compassion volunteer', 'Dhamma archivist', 'Bodhi grove caretaker'],
  ['Sarnath', 'Bodh Gaya', 'Rajgir', 'Kushinagar', 'Lumbini', 'Tawang', 'Leh', 'Dharamshala', 'Colombo', 'Kathmandu'],
  ['dhamma', 'practice', 'compassion'],
);

const JAIN_ARCHETYPES = archetypeSeeds(
  'jain',
  'modern',
  ['Ahimsa teacher', 'Paryushana organiser', 'Animal shelter patron', 'Scripture copyist', 'Fasting guide', 'Pratikraman mentor', 'Pathshala volunteer'],
  ['Ahmedabad', 'Jaipur', 'Shravanabelagola', 'Palitana', 'Shikharji', 'Udaipur', 'Delhi', 'Mumbai', 'Indore', 'Surat'],
  ['ahimsa', 'discipline', 'svadhyaya'],
);

const SUFI_ARCHETYPES = archetypeSeeds(
  'sufi',
  'contemporary',
  ['Dargah caretaker', 'Qawwali ustad', 'Langar host', 'Poetry circle guide', 'Wandering faqir', 'Refuge kitchen organiser', 'Peace mediator'],
  ['Ajmer', 'Delhi', 'Kalyar', 'Gulbarga', 'Kashmir', 'Multan', 'Lahore', 'Hyderabad', 'Bengaluru', 'Malerkotla'],
  ['love', 'service', 'unity'],
);

const TRIBAL_ARCHETYPES = archetypeSeeds(
  'tribal',
  'contemporary',
  ['Forest healer', 'Seed keeper', 'River protector', 'Community drummer', 'Oral historian', 'Land rights elder', 'Women’s circle leader', 'Youth dance mentor'],
  ['Bastar', 'Jharkhand', 'Nagaland', 'Mizoram', 'Meghalaya', 'Dangs', 'Mayurbhanj', 'Koraput', 'Wayanad', 'Adilabad'],
  ['land', 'memory', 'community'],
);

export const HERO_SEEDS: DharmVeerSeed[] = [
  ...HINDU_REAL,
  ...SIKH_REAL,
  ...BUDDHIST_REAL,
  ...JAIN_REAL,
  ...SUFI_REAL,
  ...TRIBAL_REAL,
  ...HINDU_ARCHETYPES,
  ...SIKH_ARCHETYPES,
  ...BUDDHIST_ARCHETYPES,
  ...JAIN_ARCHETYPES,
  ...SUFI_ARCHETYPES,
  ...TRIBAL_ARCHETYPES,
];

if (HERO_SEEDS.length < 500) {
  throw new Error(`Dharm Veer seed catalog too small: ${HERO_SEEDS.length}`);
}
