import sys

content = open('src/lib/dharm-veer.ts', 'r').read()

# Define the full Adi Shankaracharya block
shankaracharya_block = """  {
    id: 'adi-shankaracharya',
    name: 'Adi Shankaracharya',
    nameLocal: 'आदि शंकराचार्य',
    era: '788–820 CE',
    eraLocal: '७८८–८२० ईस्वी',
    tradition: 'hindu',
    region: 'Kalady, Kerala',
    regionLocal: 'कालड़ी, केरल',
    emoji: '🕉️',
    tagline: 'He walked the length of India at 16 and rebuilt an entire civilisation of thought.',
    taglineLocal: '१६ वर्ष की आयु में पूरे भारत की पदयात्रा कर उन्होंने भारतीय दर्शन को पुनर्जीवित किया।',
    journey:
      'Shankara was born in a small Kerala village, lost his father at three, and by eight had memorised the four Vedas. His mother refused to let him take sannyasa — renouncing the world — but a crocodile seized his leg while he bathed in the river. He called out to her: let me die a monk or die a householder\\'s son. She relented. The crocodile released him.\\n\\nAt sixteen, Shankara walked barefoot from Kerala to Varanasi, then Badrinath, then Bengal, then Kashmir — the full spine of the subcontinent. Everywhere he went he challenged scholars in public debate. The tradition of Mimamsa, which held that ritual alone was religion, had dominated Indian thought for centuries. Shankara argued instead for Advaita Vedanta: that the deepest identity of every human being is not the body, not the mind, but Brahman itself — pure consciousness, undivided and immortal.\\n\\nIn thirty-two years of life he wrote 300 texts including commentaries on the Brahmasutras, the principal Upanishads, and the Bhagavad Gita. He founded four mathas — monasteries at the four cardinal points of India — that still stand today as centres of Vedantic learning. He died at thirty-two.',
    journeyLocal:
      'शंकर का जन्म केरल के एक छोटे से गाँव में हुआ था। आठ वर्ष की आयु तक उन्होंने चारों वेदों को कंठस्थ कर लिया था। सोलह वर्ष की आयु में, शंकर केरल से वाराणसी, फिर बद्रीनाथ, बंगाल और कश्मीर तक — पूरे उपमहाद्वीप की नंगे पैर यात्रा की। उन्होंने अद्वैत वेदांत का प्रचार किया: कि हर मनुष्य की गहरी पहचान शरीर या मन नहीं, बल्कि ब्रह्म (शुद्ध चेतना) है। बत्तीस वर्ष के अल्पायु में उन्होंने भारत के चार कोनों में चार मठों की स्थापना की।',
    trial:
      'His most famous debate was with Mandana Mishra, the greatest Mimamsa scholar of the age. Mishra\\'s wife, Ubhaya Bharati, served as judge. After Shankara won, she challenged him to a second debate — this time on the subject of conjugal love, which he as a lifelong celibate could not know. Shankara paused for a month, temporarily entered the body of a deceased king to gain that knowledge, and returned to complete the debate. He won. But the real trial was never the debate — it was the willingness to remain unknown, to die at thirty-two having poured everything into a world that may not listen for centuries.',
    trialLocal:
      'उनका सबसे प्रसिद्ध शास्त्रार्थ उस समय के महान विद्वान मंडन मिश्र के साथ हुआ था। लेकिन असली परीक्षा केवल शास्त्रार्थ नहीं थी — बल्कि बत्तीस वर्ष की आयु में अपना सब कुछ उस दुनिया के लिए न्यौछावर कर देना था जो शायद सदियों तक उनकी बात न सुने।',
    teaching:
      'You are not the body that will die, not the mind that doubts, not the identity that seeks approval. You are Brahman. The one who knows this is liberated — not after death, but right now.',
    teachingLocal: 'आप वह शरीर नहीं हैं जो मर जाएगा, वह मन नहीं हैं जो संदेह करता है। आप ब्रह्म हैं। जो इसे जानता है वह अभी मुक्त है।',
    moral:
      'The most radical act is to live from your deepest identity rather than your anxious surface self. Shankara did not fight the darkness. He simply kept turning on the light.',
    moralLocal: 'सबसे क्रांतिकारी कार्य अपनी गहरी पहचान से जीना है। शंकराचार्य ने अंधेरे से लड़ाई नहीं की, उन्होंने बस प्रकाश जलाए रखा।',
    quote: {
      text: 'Brahma satyam jagan mithya, jivo brahmaiva naparah.',
      attribution: 'Brahman alone is real; the world is appearance; the individual soul is none other than Brahman. — Vivekachudamani',
    },
    quoteLocal: {
      text: 'ब्रह्म सत्यं जगन्मिथ्या, जीवो ब्रह्मैव नापरः।',
      attribution: 'आदि शंकराचार्य',
    },
  },"""

# Define the full Vivekananda block
vivekananda_block = """  {
    id: 'vivekananda',
    name: 'Swami Vivekananda',
    nameLocal: 'स्वामी विवेकानंद',
    era: '1863–1902 CE',
    eraLocal: '१८६३–१९०२ ईस्वी',
    tradition: 'hindu',
    region: 'Calcutta (Kolkata), Bengal',
    regionLocal: 'कोलकाता, बंगाल',
    emoji: '🔥',
    tagline: 'A 30-year-old monk from a colonised country walked into the World\\'s Parliament of Religions and changed how the West saw India forever.',
    taglineLocal: 'शिकागो के धर्म संसद में उनके एक भाषण ने पूरी दुनिया का भारत के प्रति नजरिया बदल दिया।',
    journey:
      'Narendra Nath Datta was a brilliant, restless young man in colonial Calcutta who interrogated every swami and scholar he met with the same question: have you seen God? Most laughed. One man said yes. That man was Ramakrishna, a temple priest in Dakshineswar whom the English-educated young Narendra considered a village mystic. He went to test him. Ramakrishna touched him. For the next several minutes Narendra\\'s consciousness dissolved entirely. He came back terrified. He went again and again.\\n\\nAfter Ramakrishna died of cancer, leaving behind eleven young disciples, Vivekananda took the vow of sannyasa at twenty-five. He walked the length of India alone, without money, eating what was offered, sleeping outside, learning the actual condition of his country. He saw the poverty, the caste discrimination, the spiritual genius coexisting with material collapse. He arrived at the southernmost point of India, at Kanyakumari, swam to a rock in the sea, and sat. For three days. When he came back he had his mission.\\n\\nIn 1893 he sailed to America with almost no money, knowing no one, with a borrowed name card and a letter to a Harvard professor. He arrived at the World\\'s Parliament of Religions in Chicago and spoke. His opening — "Sisters and brothers of America" — stopped the auditorium. Two thousand people rose and gave him a two-minute standing ovation before he said another word. He gave a four-year lecture tour of the United States and Britain that introduced Vedanta, yoga, and the idea of religious pluralism to the modern West. He died at thirty-nine, having compressed four hundred years of work into nineteen years of adult life.',
    journeyLocal:
      'नरेंद्र नाथ दत्त कोलकाता के एक प्रतिभाशाली युवक थे। उन्होंने अकेले पूरे भारत की यात्रा की और देश की वास्तविक स्थिति को समझा। १८९३ में वे शिकागो गए और धर्म संसद में भाषण दिया। उनके संबोधन "अमेरिका के भाइयों और बहनों" ने सबका दिल जीत लिया। उन्होंने केवल ३९ वर्ष के जीवन में ४०० वर्षों का कार्य किया।',
    trial:
      'In the weeks before Chicago, Vivekananda was stranded in an unknown city with no food and no money, sleeping in an empty boxcar in the freight yards of Boston. He had been turned away from several doors. He sat on that train and wondered if the mission was over before it began. He came out of the freight yard and knocked on one more door.',
    trialLocal:
      'शिकागो जाने से पहले, विवेकानंद बोस्टन के माल गोदामों में एक खाली डिब्बे में सोए थे। उनके पास न खाना था, न पैसे। उन्हें कई दरवाजों से लौटा दिया गया था। लेकिन उन्होंने हार नहीं मानी।',
    teaching:
      'Each soul is potentially divine. The goal is to manifest this divinity within by controlling nature — external and internal. Do this either by work, or worship, or psychic control, or philosophy — by one, or more, or all of these — and be free.',
    teachingLocal: 'प्रत्येक आत्मा संभावित रूप से दिव्य है। लक्ष्य आंतरिक और बाहरी प्रकृति को नियंत्रित करके इस दिव्यता को प्रकट करना है।',
    moral:
      'A colonised country\\'s most powerful export was not cotton or indigo. It was a philosophy of universal human dignity so complete that it walked into the capital of Western Christianity and was given a standing ovation.',
    moralLocal: 'एक गुलाम देश का सबसे शक्तिशाली निर्यात कपास नहीं, बल्कि मानवीय गरिमा का दर्शन था।',
    quote: {
      text: 'Arise, awake, and stop not till the goal is reached.',
      attribution: 'Swami Vivekananda (after Katha Upanishad 1.3.14)',
    },
    quoteLocal: {
      text: 'उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।',
      attribution: 'स्वामी विवेकानंद',
    },
  },"""

# Define the full Chanakya block
chanakya_block = """  {
    id: 'chanakya',
    name: 'Chanakya',
    nameLocal: 'आचार्य चाणक्य',
    era: '350–283 BCE',
    eraLocal: '३५०–२८३ ईसा पूर्व',
    tradition: 'hindu',
    region: 'Takshashila (present-day Pakistan)',
    regionLocal: 'तक्षशिला',
    emoji: '🦅',
    tagline: 'He was insulted in Nanda\\'s court, left his topknot untied, and did not tie it again until he had destroyed the empire.',
    taglineLocal: 'नंद साम्राज्य के विनाश तक उन्होंने अपनी शिखा नहीं बांधी और एक नए भारत का निर्माण किया।',
    journey:
      'Vishnugupta Chanakya was a professor at the great university of Takshashila — arguably the world\\'s first residential university, where students from Persia, Greece, and across India came to study statecraft, medicine, and the Vedas. He was brilliant, physically unremarkable, and without patience for fools.\\n\\nHe went to the court of Dhanananda, the last Nanda emperor, to present a plan to resist Alexander\\'s invasion. Dhanananda mocked his appearance and had him thrown out. Chanakya left, untied his topknot, and swore he would not tie it again until the Nanda dynasty was destroyed. He find an orphaned boy named Chandragupta. He spent twelve years training him — in warfare, statecraft, intelligence, the philosophy of power. He built a coalition from scratch.\\n\\nIn 322 BCE, Chandragupta\\'s forces defeated the Nanda army and Chandragupta took the throne as the first Maurya emperor, the first ruler to unify the Indian subcontinent. Chanakya became his chief minister. He wrote the Arthashastra — a complete treatise on statecraft so sophisticated that German historians in the 20th century called it superior to Machiavelli and compared it to modern political science. Then, when Chandragupta was secure, he walked away.',
    journeyLocal:
      'विष्णुगुप्त चाणक्य तक्षशिला के महान आचार्य थे। राजा धनानंद द्वारा अपमानित होने पर उन्होंने अपनी शिखा खोल दी और कसम खाई कि जब तक वे नंद वंश का नाश नहीं कर देते, इसे नहीं बांधेंगे। उन्होंने चंद्रगुप्त मौर्य को प्रशिक्षित किया और पहले अखंड भारतीय साम्राज्य की नींव रखी। उन्होंने अर्थशास्त्र जैसा महान ग्रंथ लिखा।',
    trial:
      'The trial of Chanakya was not the twenty-two years of work. It was the question of power itself. He had access to the most powerful position in the known world and chose instead to leave it. The Arthashastra contains the famous line: the king should never trust even the minister who has made him king. He wrote that about himself. Then he acted on it.',
    trialLocal:
      'चाणक्य की असली परीक्षा सत्ता का मोह छोड़ना था। उनके पास दुनिया की सबसे बड़ी शक्ति तक पहुँच थी, लेकिन उन्होंने उसे छोड़ना चुना। उनका मानना था कि सत्ता व्यक्ति को भ्रष्ट कर सकती है, इसलिए काम पूरा होते ही वे वापस लौट गए।',
    teaching:
      'The true statesman works himself out of a job. Power accumulated for its own sake poisons. Power used to establish a condition of flourishing, then relinquished, is the only kind that does not corrupt.',
    teachingLocal: 'एक सच्चा राजनेता खुद को काम से बाहर कर देता है। सत्ता का उपयोग जनकल्याण के लिए होना चाहिए, न कि निजी लाभ के लिए।',
    moral:
      'There is a kind of person who keeps their topknot untied for twenty-two years, not out of obsession but out of precision — holding the intention while doing the work, releasing it only when the work is done. That quality is rarer than genius.',
    moralLocal: 'बिना संकल्प के काम करना समय की बर्बादी है। चाणक्य ने २२ साल तक अपना संकल्प याद रखा।',
    quote: {
      text: 'Before you start some work, always ask yourself three questions: Why am I doing it? What might the results be? Will I be successful? Only when you think deeply and find satisfactory answers to these questions, go ahead.',
      attribution: 'Chanakya, Arthashastra',
    },
    quoteLocal: {
      text: 'किसी भी कार्य को शुरू करने से पहले स्वयं से तीन प्रश्न पूछें: मैं यह क्यों कर रहा हूँ? इसके परिणाम क्या हो सकते हैं? क्या मैं सफल होऊंगा?',
      attribution: 'आचार्य चाणक्य',
    },
  },"""

# Helper to replace blocks
import re

def replace_entry(content, entry_id, new_block):
    pattern = r'  {\s+id: \'' + entry_id + r'\',.*?  },'
    return re.sub(pattern, new_block + ',', content, flags=re.DOTALL)

# Update interface too
interface_old = """export interface DharmVeer {
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
}"""

interface_new = """export interface DharmVeer {
  id: string;
  name: string;
  nameLocal?: string; // e.g. in Hindi/Gurmukhi/etc.
  era: string;
  eraLocal?: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
  region: string;
  regionLocal?: string;
  emoji: string;
  tagline: string;
  taglineLocal?: string;
  /** 2–3 paragraph account of their life and mission */
  journey: string;
  journeyLocal?: string;
  /** The defining test, sacrifice, or trial they endured */
  trial: string;
  trialLocal?: string;
  /** Their core teaching in plain language */
  teaching: string;
  teachingLocal?: string;
  /** The moral for a modern seeker */
  moral: string;
  moralLocal?: string;
  quote?: {
    text: string;
    attribution: string;
  };
  quoteLocal?: {
    text: string;
    attribution: string;
  };
}"""

content = content.replace(interface_old, interface_new)
content = replace_entry(content, 'adi-shankaracharya', shankaracharya_block)
content = replace_entry(content, 'vivekananda', vivekananda_block)
content = replace_entry(content, 'chanakya', chanakya_block)

# Mahavira block
mahavira_block = """  {
    id: 'mahavira-trials',
    name: 'Mahavira',
    nameLocal: 'भगवान महावीर',
    era: '599–527 BCE',
    eraLocal: '५९੯–੫੨੭ ईसा पूर्व',
    tradition: 'jain',
    region: 'Vaishali, Bihar',
    regionLocal: 'वैशाली, बिहार',
    emoji: '🤲',
    tagline: 'A prince who walked naked for 12.5 years, enduring everything without a sound.',
    taglineLocal: 'एक राजकुमार जिन्होंने १२.५ वर्षों तक मौन रहकर कठिन तपस्या की।',
    journey:
      'Vardhamana was born a prince of Vaishali, the son of a Kshatriya chief. He was married with a daughter. At thirty, he asked his parents for permission to become an ascetic. They refused. He waited. When they died, he waited another two years out of respect for his elder brother\\'s grief. Then he renounced everything — his silk robes, his palace, his family — and walked out with a single cloth.\\n\\nAfter thirteen months even that cloth tore off on a thorn bush. He did not seek a replacement. For the next eleven years he wandered naked, fasting for days or weeks, maintaining complete silence, accepting no shelter, walking without rest. He practised ahimsa so rigorous that he strained drinking water through cloth to avoid swallowing insects and swept the ground before each step. In the monsoon season when villagers sought shelter, he stood in the rain.\\n\\nAfter 12.5 years of this, sitting under a sala tree near the river Rijupalika, he attained Kevala Jnana — omniscience, complete liberation. He spent the next thirty years teaching. His followers, the Jains, became one of the most remarkable communities in human history: disproportionately influential in philosophy, mathematics, commerce, and non-violence advocacy.',
    journeyLocal:
      'वर्धमान वैशाली के एक राजकुमार थे। ३० वर्ष की आयु में उन्होंने सब कुछ त्याग दिया। अगले साढ़े बारह वर्षों तक वे नग्न अवस्था में रहे, मौन धारण किया और बिना किसी आश्रय के यात्रा की। उन्होंने अहिंसा का इतना कठोर पालन किया कि हवा में उड़ने वाले सूक्ष्म जीवों को भी हानि न पहुँचूँ। ऋजुपालिका नदी के तट पर उन्हें केवल ज्ञान प्राप्त हुआ।',
    trial:
      'The most documented trial came in the village of Chammari, where cowherds, frustrated by his silence and his presence near their cattle, poured hot oil in his ears and pushed wooden spikes through them. He did not react, did not speak, did not leave. This is not a comfortable story. It is a story about what absolute commitment to non-retaliation looks like when tested by people with real malice.',
    trialLocal:
      'उनकी सबसे बड़ी परीक्षा चामरी गाँव में हुई, जहाँ लोगों ने उनके कानों में गरम तेल डाला और खूँटियाँ ठोंक दीं। लेकिन महावीर मौन रहे, उन्होंने कोई प्रतिक्रिया नहीं दी। यह कहानी प्रतिशोध न लेने के अटूट संकल्प की है।',
    teaching:
      'Ahimsa is not an attitude. It is a practice, maintained breath by breath, step by step, even when the world is hostile, even when silence looks like defeat, even when the body screams.',
    teachingLocal: 'अहिंसा केवल एक दृष्टिकोण नहीं है, यह एक अभ्यास है। यह तब भी बनाए रखा जाता है जब दुनिया शत्रुतापूर्ण हो।',
    moral:
      'Mahavira\\'s extreme path is not for everyone. But the principle — that every living being has a soul deserving protection, that violence poisons the one who commits it — is something every tradition and every modern mind can sit with.',
    moralLocal: 'अहिंसा का सिद्धांत—कि हर जीवित प्राणी की आत्मा सुरक्षा की पात्र है—आधुनिक समय के लिए अत्यंत महत्वपूर्ण है।',
    quote: {
      text: 'All living beings desire to live. To them life is dear. Therefore do not take life.',
      attribution: 'Mahavira, Acharanga Sutra',
    },
    quoteLocal: {
      text: 'सभी जीवित प्राणी जीना चाहते हैं। उन्हें जीवन प्रिय है। इसलिए प्राण मत लो।',
      attribution: 'भगवान महावीर',
    },
  }"""
content = replace_entry(content, 'mahavira-trials', mahavira_block)

with open('src/lib/dharm-veer.ts', 'w') as f:
    f.write(content)
