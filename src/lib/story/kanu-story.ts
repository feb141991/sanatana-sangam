import type { CanonicalChapter } from '@/lib/pathshala-canonical';
import {
  GITA_CHAPTERS,
  getCanonicalVerseLinksForChapter,
  getOfficialGitaAudioUrl,
} from '@/lib/pathshala-canonical';
import {
  getGitaStoryEpisodeHref,
  getGitaStoryHref,
  getPathshalaChapterHref,
  getPathshalaEntryHref,
} from '@/lib/pathshala-links';

export type StoryLanguage = 'en' | 'hi';
export type StoryArcId = 'gokul' | 'vrindavan' | 'mathura' | 'dwaraka' | 'kurukshetra';
export type StorySourceType = 'editorial-retelling' | 'canonical-companion';
export type StoryMotionPreset =
  | 'river-drift'
  | 'flute-breeze'
  | 'city-spark'
  | 'ocean-lantern'
  | 'battle-breeze'
  | 'cosmic-pulse'
  | 'lotus-rise';

export interface StoryCopy {
  en: string;
  hi: string;
}

export interface StoryGlossaryItem {
  term: string;
  definition: StoryCopy;
}

export interface StoryVerseAnchor {
  chapterNumber: number;
  verseNumber: number;
  label: StoryCopy;
  href: string;
  officialAudioUrl: string;
  officialTextUrl: string;
}

export interface StoryCharacterAgeState {
  id: string;
  characterId: 'kanu' | 'krishna' | 'arjuna';
  displayName: string;
  arc: StoryArcId;
  ageStage: string;
  posePack: string[];
  costumePalette: string[];
  expressionSet: string[];
  descriptor: StoryCopy;
}

export interface StorySceneCard {
  id: string;
  eyebrow: StoryCopy;
  title: StoryCopy;
  caption: StoryCopy;
  narration: StoryCopy;
  deeperMeaning: StoryCopy;
  reflectionPrompt: StoryCopy;
  artworkKey: string;
  motionPreset: StoryMotionPreset;
  ambientAudio: string;
  verseAnchors: StoryVerseAnchor[];
  glossary: StoryGlossaryItem[];
  focusCharacterStateIds: string[];
}

export interface StoryEpisode {
  id: string;
  arc: StoryArcId;
  order: number;
  chapterNumber?: number;
  ageBand: string;
  durationMinutes: number;
  sourceType: StorySourceType;
  title: StoryCopy;
  subtitle: StoryCopy;
  summary: StoryCopy;
  sourceLabel: StoryCopy;
  artworkKey: string;
  motionPreset: StoryMotionPreset;
  focusCharacterStateIds: string[];
  scenes: StorySceneCard[];
}

export interface StoryArc {
  id: StoryArcId;
  order: number;
  title: StoryCopy;
  summary: StoryCopy;
  ageBand: StoryCopy;
  atmosphere: string;
  featuredEpisodeId: string;
}

function copy(en: string, hi: string): StoryCopy {
  return { en, hi };
}

function verseLabel(en: string, hi: string, chapterNumber: number, verseNumber: number): StoryVerseAnchor {
  const canonicalLink = getCanonicalVerseLinksForChapter(chapterNumber).find(
    (item) => item.verseNumber === verseNumber,
  );

  return {
    chapterNumber,
    verseNumber,
    label: copy(en, hi),
    href: canonicalLink?.localEntry
      ? getPathshalaEntryHref('hindu', 'gita', canonicalLink.localEntry.id)
      : getPathshalaChapterHref('hindu', 'gita', `chapter-${chapterNumber}`),
    officialAudioUrl: canonicalLink?.officialAudioUrl ?? getOfficialGitaAudioUrl(chapterNumber, verseNumber),
    officialTextUrl: canonicalLink?.officialUrl ?? getPathshalaChapterHref('hindu', 'gita', `chapter-${chapterNumber}`),
  };
}

export const KANU_STORY_PLEDGE = {
  title: copy('Kanu Story Mode', 'कानु स्टोरी मोड'),
  description: copy(
    'A reverent story companion for children, parents, and elders. Story scenes are editorial retellings; verses remain grounded in the canonical Bhagavad Gita layer.',
    'बच्चों, माता-पिता और बड़ों के लिए एक स्नेहपूर्ण कथा-संगी। कहानी वाले दृश्य संपादकीय पुनर्कथन हैं; श्लोक हमेशा प्रमाणित भगवद्गीता परत से जुड़े रहते हैं।',
  ),
};

export const KANU_STORY_ARCS: StoryArc[] = [
  {
    id: 'gokul',
    order: 1,
    title: copy('Gokul: Light on the River', 'गोकुल: नदी पर उतरी रोशनी'),
    summary: copy(
      'Tender beginnings, protection, and the first hint that joy can carry courage.',
      'कोमल शुरुआत, संरक्षण, और यह पहला संकेत कि आनंद भी साहस को जन्म देता है।',
    ),
    ageBand: copy('Infancy and wonder', 'शैशव और विस्मय'),
    atmosphere: 'Moonlit river, lamps, soft bells',
    featuredEpisodeId: 'gokul-moonlit-promise',
  },
  {
    id: 'vrindavan',
    order: 2,
    title: copy('Vrindavan: Play Becomes Presence', 'वृंदावन: खेल से उपजी उपस्थिति'),
    summary: copy(
      'Friendship, music, laughter, and the kind of love that makes the world feel close to the divine.',
      'मित्रता, संगीत, हँसी, और वह प्रेम जो संसार को ईश्वर के बहुत निकट महसूस कराता है।',
    ),
    ageBand: copy('Childhood in bloom', 'खिलता बालपन'),
    atmosphere: 'Forest breeze, flute, peacock light',
    featuredEpisodeId: 'vrindavan-flute-circle',
  },
  {
    id: 'mathura',
    order: 3,
    title: copy('Mathura: Courage Enters the City', 'मथुरा: साहस नगर में प्रवेश करता है'),
    summary: copy(
      'The playful child grows into a youth who knows that love must also face injustice.',
      'चंचल बालक अब ऐसे युवक में बदलता है जो जानता है कि प्रेम को अन्याय का सामना भी करना पड़ता है।',
    ),
    ageBand: copy('Youth and resolve', 'यौवन और संकल्प'),
    atmosphere: 'Torches, drums, turning fate',
    featuredEpisodeId: 'mathura-gate-of-courage',
  },
  {
    id: 'dwaraka',
    order: 4,
    title: copy('Dwaraka: Wisdom Learns Governance', 'द्वारका: बुद्धि ने राज्यकला सीखी'),
    summary: copy(
      'Presence ripens into stewardship, diplomacy, and the calm strength needed to hold a kingdom together.',
      'उपस्थिति अब संरक्षण, कूटनीति और राज्य को संभालने वाली शांत शक्ति में परिपक्व होती है।',
    ),
    ageBand: copy('Young ruler, steady heart', 'युवा शासक, स्थिर हृदय'),
    atmosphere: 'Sea glow, gold courts, listening halls',
    featuredEpisodeId: 'dwaraka-council-of-wisdom',
  },
  {
    id: 'kurukshetra',
    order: 5,
    title: copy('Kurukshetra: The Chariot Before Dawn', 'कुरुक्षेत्र: प्रभात से पहले का रथ'),
    summary: copy(
      'The journey matures into counsel, courage, surrender, and the full unfolding of the Bhagavad Gita.',
      'यात्रा अब उपदेश, साहस, समर्पण और भगवद्गीता के पूर्ण प्रस्फुटन में परिपक्व होती है।',
    ),
    ageBand: copy('Guide, friend, and revealer', 'मार्गदर्शक, सखा और उद्घाटक'),
    atmosphere: 'Conches, dust, dawn fire',
    featuredEpisodeId: 'kurukshetra-dawn-of-counsel',
  },
];

export const KANU_CHARACTER_STATES: StoryCharacterAgeState[] = [
  {
    id: 'kanu-gokul-spark',
    characterId: 'kanu',
    displayName: 'Kanu',
    arc: 'gokul',
    ageStage: 'Little wonder',
    posePack: ['curled smile', 'reaching hand', 'moonlit glance'],
    costumePalette: ['#2b4a93', '#f0a73d', '#93d7ff'],
    expressionSet: ['playful', 'curious', 'comforting'],
    descriptor: copy(
      'A moonlit child-guide with soft laughter, small shoulders, and eyes that seem to know joy before words.',
      'चाँदनी-सा बाल मार्गदर्शक, कोमल हँसी, छोटे कंधे और ऐसी आँखें जिनमें शब्दों से पहले ही आनंद चमकता है।',
    ),
  },
  {
    id: 'kanu-vrindavan-lilt',
    characterId: 'kanu',
    displayName: 'Kanu',
    arc: 'vrindavan',
    ageStage: 'Flute-hearted child',
    posePack: ['dancing step', 'flute lift', 'open-armed welcome'],
    costumePalette: ['#224d97', '#f6b43c', '#0f8a9d'],
    expressionSet: ['mischievous', 'radiant', 'friendly'],
    descriptor: copy(
      'Kanu grows taller, more playful, and more musical; the body moves like laughter and the face invites everyone in.',
      'कानु अब थोड़ा लंबा, अधिक चंचल और अधिक संगीत-मय है; देह में हँसी का लय है और चेहरा सबको अपने पास बुलाता है।',
    ),
  },
  {
    id: 'kanu-mathura-resolve',
    characterId: 'kanu',
    displayName: 'Kanu',
    arc: 'mathura',
    ageStage: 'Youth of courage',
    posePack: ['forward stride', 'steady chin', 'protective reach'],
    costumePalette: ['#203d89', '#da8b2f', '#8d4de8'],
    expressionSet: ['fearless', 'gentle', 'awake'],
    descriptor: copy(
      'The childlike sparkle remains, but the jaw is steadier and the stance now carries responsibility.',
      'बाल सुलभ चमक बनी रहती है, पर अब जबड़ा अधिक स्थिर है और चाल में उत्तरदायित्व का भार भी है।',
    ),
  },
  {
    id: 'kanu-dwaraka-statecraft',
    characterId: 'kanu',
    displayName: 'Kanu',
    arc: 'dwaraka',
    ageStage: 'Sea-calm strategist',
    posePack: ['listening posture', 'open palm', 'council seat'],
    costumePalette: ['#203169', '#f0b45b', '#34b0bf'],
    expressionSet: ['composed', 'warm', 'wise'],
    descriptor: copy(
      'Kanu now feels regal without becoming distant; the warmth stays, but it is held inside disciplined grace.',
      'कानु अब राजसी लगता है, पर दूर नहीं होता; गर्माहट बनी रहती है, किंतु अब वह अनुशासित गरिमा में ठहरी है।',
    ),
  },
  {
    id: 'kanu-kurukshetra-radiance',
    characterId: 'kanu',
    displayName: 'Kanu',
    arc: 'kurukshetra',
    ageStage: 'Radiant guide',
    posePack: ['charioteer calm', 'teaching hand', 'fear-dissolving gaze'],
    costumePalette: ['#1c2c62', '#efb84b', '#ffffff'],
    expressionSet: ['compassionate', 'luminous', 'unshaken'],
    descriptor: copy(
      'The lively guide matures into a steady, luminous presence who can speak to a child with softness and to an elder with depth.',
      'यह चंचल मार्गदर्शक अब ऐसी स्थिर, प्रकाशमय उपस्थिति में परिपक्व हो गया है जो बच्चे से कोमलता और बुज़ुर्ग से गहराई के साथ बात करती है।',
    ),
  },
  {
    id: 'krishna-vrindavan-beloved',
    characterId: 'krishna',
    displayName: 'Krishna',
    arc: 'vrindavan',
    ageStage: 'Beloved of Vrindavan',
    posePack: ['flute repose', 'dancing heel', 'protective lift'],
    costumePalette: ['#243d8c', '#f0b13d', '#2ab7b0'],
    expressionSet: ['playful', 'adoring', 'fearless'],
    descriptor: copy(
      'The devotional Krishna of Vrindavan: intimate, musical, and full of affectionate power.',
      'वृंदावन के कृष्ण: निकट, संगीत-मय और स्नेहमय शक्ति से पूर्ण।',
    ),
  },
  {
    id: 'krishna-kurukshetra-charioteer',
    characterId: 'krishna',
    displayName: 'Krishna',
    arc: 'kurukshetra',
    ageStage: 'Charioteer and revealer',
    posePack: ['reins in hand', 'teaching turn', 'cosmic stillness'],
    costumePalette: ['#1d2f6f', '#f5c463', '#ffefe0'],
    expressionSet: ['serene', 'vast', 'tender'],
    descriptor: copy(
      'The Krishna of the Gita: calm under pressure, intimate with Arjuna, and vast enough to hold the whole battlefield.',
      'गीता के कृष्ण: दबाव में शांत, अर्जुन के अत्यंत निकट, और इतने विराट कि समूचे रणक्षेत्र को अपने भीतर समेट लें।',
    ),
  },
  {
    id: 'arjuna-young-prince',
    characterId: 'arjuna',
    displayName: 'Arjuna',
    arc: 'dwaraka',
    ageStage: 'Gifted prince',
    posePack: ['archer focus', 'warrior bow', 'friendship ease'],
    costumePalette: ['#7f3f1e', '#d8b270', '#455a7a'],
    expressionSet: ['confident', 'earnest', 'loyal'],
    descriptor: copy(
      'A brilliant prince whose discipline is already visible, even before the great crisis tests his heart.',
      'ऐसा तेजस्वी राजकुमार जिसकी साधना और अनुशासन महान संकट आने से पहले ही स्पष्ट दिखते हैं।',
    ),
  },
  {
    id: 'arjuna-listener',
    characterId: 'arjuna',
    displayName: 'Arjuna',
    arc: 'kurukshetra',
    ageStage: 'Warrior who learns',
    posePack: ['lowered bow', 'questioning gaze', 'resolved stance'],
    costumePalette: ['#783b1d', '#d2ae79', '#8296b7'],
    expressionSet: ['torn', 'honest', 're-centered'],
    descriptor: copy(
      'Arjuna grows through the Gita by allowing grief, doubt, reason, devotion, and courage to meet in the same heart.',
      'अर्जुन गीता में इसलिए बढ़ता है क्योंकि वह अपने हृदय में शोक, संदेह, विवेक, भक्ति और साहस सबको एक साथ स्थान देता है।',
    ),
  },
];

const SOURCE_EDITORIAL = copy(
  'Story retelling inspired by Krishna traditions and devotional narrative context. This layer is editorial and is not presented as canonical Gita verse.',
  'यह कथा-कथन कृष्ण-परंपराओं और भक्तिपरक संदर्भों से प्रेरित संपादकीय पुनर्कथन है। इसे प्रमाणित गीता-श्लोक के रूप में प्रस्तुत नहीं किया गया है।',
);

const SOURCE_CANONICAL = copy(
  'Canonical companion episode grounded in the in-app Bhagavad Gita corpus. Story beats help orientation, but the linked verses remain the source of authority.',
  'यह सहायक अध्याय-एपिसोड ऐप में उपलब्ध भगवद्गीता के प्रमाणित पाठ पर आधारित है। कहानी वाले अंश मार्गदर्शन देते हैं, पर अंतिम प्रमाण जुड़े हुए श्लोक ही हैं।',
);

const MANUAL_EPISODES: StoryEpisode[] = [
  {
    id: 'gokul-moonlit-promise',
    arc: 'gokul',
    order: 1,
    ageBand: 'Infancy and wonder',
    durationMinutes: 6,
    sourceType: 'editorial-retelling',
    title: copy('When the River Carried a Promise', 'जब नदी एक वचन लेकर चली'),
    subtitle: copy(
      'A moonlit beginning that teaches protection before power.',
      'चाँदनी-सी शुरुआत, जो शक्ति से पहले संरक्षण सिखाती है।',
    ),
    summary: copy(
      'Kanu introduces the first tender chapter of Krishna’s story: danger on one side, tenderness on the other, and a child whose presence changes the mood of the whole night.',
      'कानु कृष्ण-कथा का पहला कोमल अध्याय खोलता है: एक ओर संकट, दूसरी ओर ममता, और एक ऐसा बालक जिसकी उपस्थिति पूरी रात का भाव बदल देती है।',
    ),
    sourceLabel: SOURCE_EDITORIAL,
    artworkKey: 'moon-river',
    motionPreset: 'river-drift',
    focusCharacterStateIds: ['kanu-gokul-spark'],
    scenes: [
      {
        id: 'gokul-river',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Night Walks with a Hidden Light', 'रात एक छिपी हुई रोशनी के साथ चलती है'),
        caption: copy(
          'A frightened night can still become a sacred crossing.',
          'डरी हुई रात भी पवित्र पारावार बन सकती है।',
        ),
        narration: copy(
          'Kanu begins in a whisper: sometimes the world trembles before it changes. A child is carried across dark water, and the river itself seems to soften around that small, shining life.',
          'कानु फुसफुसाकर शुरू करता है: कभी-कभी संसार बदलने से पहले काँपता है। एक बालक को अँधेरे जल के पार ले जाया जा रहा है, और नदी स्वयं उस छोटे उजाले के चारों ओर मानो कोमल हो उठती है।',
        ),
        deeperMeaning: copy(
          'This opening arc teaches that divine stories do not begin outside danger. They begin by bringing tenderness into danger, so fear is not the only force in the room.',
          'यह आरंभिक प्रसंग सिखाता है कि दिव्य कथाएँ संकट से बाहर नहीं शुरू होतीं। वे संकट के भीतर कोमलता लाती हैं, ताकि भय ही एकमात्र शक्ति न रह जाए।',
        ),
        reflectionPrompt: copy(
          'Who around you needs protection before they need advice?',
          'आपके आसपास किसे सलाह से पहले संरक्षण की ज़रूरत है?',
        ),
        artworkKey: 'moon-river',
        motionPreset: 'river-drift',
        ambientAudio: 'Soft water, ankle bells, distant thunder',
        verseAnchors: [
          verseLabel('When dharma declines', 'जब धर्म क्षीण होता है', 4, 7),
          verseLabel('I manifest for restoration', 'मैं पुनर्स्थापना के लिए आता हूँ', 4, 8),
        ],
        glossary: [
          {
            term: 'Dharma',
            definition: copy(
              'The rightness that holds life together: duty, truth, harmony, and moral order.',
              'वह सत्य-संतुलन जो जीवन को संभाले रखता है: कर्तव्य, सदाचार, समन्वय और नैतिक व्यवस्था।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-gokul-spark'],
      },
      {
        id: 'gokul-home',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('A Home Built by Care', 'ममता से बना एक घर'),
        caption: copy(
          'Great stories also need warm arms, food, sleep, and song.',
          'महान कथाओं को भी गर्म बाँहें, भोजन, नींद और गीत चाहिए।',
        ),
        narration: copy(
          'In Gokul, the story becomes intimate. Kanu smiles as he tells it: divine purpose may be vast, but it still rests in ordinary hands that rock, feed, and protect.',
          'गोकुल में कथा अत्यंत निकट हो जाती है। कानु मुस्कराकर कहता है: दिव्य उद्देश्य कितना भी विशाल हो, वह अंततः उन्हीं साधारण हाथों में टिका होता है जो थामते, खिलाते और बचाते हैं।',
        ),
        deeperMeaning: copy(
          'The first sign of holiness is often not spectacle. It is reliable care. That is why this arc feels safe for children and profound for elders at the same time.',
          'पवित्रता का पहला संकेत अक्सर चमत्कार नहीं होता। वह भरोसेमंद देखभाल होती है। इसी कारण यह प्रसंग बच्चों को सुरक्षित और बड़ों को गहरा दोनों लगता है।',
        ),
        reflectionPrompt: copy(
          'What kind of home helps wisdom grow?',
          'कैसा घर है जिसमें बुद्धि सचमुच बढ़ती है?',
        ),
        artworkKey: 'gokul-courtyard',
        motionPreset: 'lotus-rise',
        ambientAudio: 'Lullaby hum, lamps, quiet courtyard breeze',
        verseAnchors: [
          verseLabel('The Divine is in every heart', 'ईश्वर प्रत्येक हृदय में स्थित है', 10, 20),
        ],
        glossary: [
          {
            term: 'Seva',
            definition: copy(
              'Self-giving care offered with love, not with ego or display.',
              'प्रेमपूर्वक किया गया निस्वार्थ सेवा-भाव, अहंकार या प्रदर्शन के बिना।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-gokul-spark'],
      },
      {
        id: 'gokul-promise',
        eyebrow: copy('Deeper meaning', 'गहरा अर्थ'),
        title: copy('Joy is Also a Form of Courage', 'आनंद भी साहस का एक रूप है'),
        caption: copy(
          'The story does not deny danger; it refuses to let danger define the whole world.',
          'कथा संकट से इनकार नहीं करती; वह केवल इतना करती है कि संकट संसार की अंतिम परिभाषा न बन जाए।',
        ),
        narration: copy(
          'Kanu ends the first arc with a soft lesson: sometimes the holiest strength is the kind that protects innocence long enough for wisdom to grow.',
          'कानु पहले प्रसंग को एक कोमल सीख के साथ समाप्त करता है: कभी-कभी सबसे पवित्र शक्ति वही होती है जो निष्कलुषता को इतना समय देती है कि ज्ञान उसमें विकसित हो सके।',
        ),
        deeperMeaning: copy(
          'This is the emotional seed of the whole story world. Later chapters become larger, louder, and more philosophical, but they keep returning to this truth: fear does not get the final word.',
          'यही पूरे कथा-जगत का भावनात्मक बीज है। आगे अध्याय अधिक विशाल, ऊँचे और दार्शनिक हो जाते हैं, पर वे बार-बार इसी सत्य पर लौटते हैं: अंतिम वचन भय का नहीं होगा।',
        ),
        reflectionPrompt: copy(
          'Where can you protect one small light this week?',
          'इस सप्ताह आप किस एक छोटे प्रकाश की रक्षा कर सकते हैं?',
        ),
        artworkKey: 'moon-promise',
        motionPreset: 'river-drift',
        ambientAudio: 'Water settles into dawn birdsong',
        verseAnchors: [
          verseLabel('A devotee is never lost', 'मेरा भक्त कभी नष्ट नहीं होता', 9, 31),
        ],
        glossary: [
          {
            term: 'Bhakti',
            definition: copy(
              'Devotion that is affectionate, relational, and full of trust.',
              'ऐसी भक्ति जो स्नेहपूर्ण, संबंधमय और विश्वास से भरी हो।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-gokul-spark'],
      },
    ],
  },
  {
    id: 'vrindavan-flute-circle',
    arc: 'vrindavan',
    order: 2,
    ageBand: 'Childhood in bloom',
    durationMinutes: 7,
    sourceType: 'editorial-retelling',
    title: copy('The Flute That Gathered Hearts', 'वह बाँसुरी जिसने सबके हृदय बुला लिए'),
    subtitle: copy(
      'Play, affection, and divine closeness in the forests of Vrindavan.',
      'वृंदावन के उपवनों में खेल, स्नेह और ईश्वर की निकटता।',
    ),
    summary: copy(
      'Kanu leads the audience into the playful world of cows, friends, flute-calls, and a kind of joy that makes devotion feel intimate rather than distant.',
      'कानु श्रोताओं को गायों, सखाओं, बाँसुरी की पुकार और ऐसे आनंद के संसार में ले जाता है जिसमें भक्ति दूर नहीं, बहुत निकट महसूस होती है।',
    ),
    sourceLabel: SOURCE_EDITORIAL,
    artworkKey: 'forest-flute',
    motionPreset: 'flute-breeze',
    focusCharacterStateIds: ['kanu-vrindavan-lilt', 'krishna-vrindavan-beloved'],
    scenes: [
      {
        id: 'vrindavan-call',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Play Becomes Prayer', 'खेल प्रार्थना बन जाता है'),
        caption: copy(
          'The ordinary world becomes bright when it is held with affection.',
          'जब साधारण संसार को स्नेह से थामा जाता है, वह उज्ज्वल हो उठता है।',
        ),
        narration: copy(
          'Kanu laughs here. Butter, teasing, dancing, and flute notes fill the air. Yet the deeper feeling is not mischief alone; it is belonging, the sense that the divine can be beloved and near.',
          'यहाँ कानु हँसता है। माखन, शरारत, नृत्य और बाँसुरी के सुर हवा में तैरते हैं। पर भीतर की अनुभूति केवल शरारत नहीं; वह अपनापन है, यह अनुभव कि ईश्वर प्रिय भी हो सकता है और बहुत निकट भी।',
        ),
        deeperMeaning: copy(
          'Vrindavan teaches intimacy with the sacred. For children, this feels like warmth and play. For elders, it becomes the theology of loving remembrance.',
          'वृंदावन पवित्र के साथ निकटता सिखाता है। बच्चों के लिए यह गर्माहट और खेल है; बड़ों के लिए यह प्रेममय स्मरण की आध्यात्मिकता बन जाता है।',
        ),
        reflectionPrompt: copy(
          'What makes your heart feel close rather than merely correct?',
          'क्या चीज़ आपके हृदय को केवल सही नहीं, बल्कि निकट महसूस कराती है?',
        ),
        artworkKey: 'forest-flute',
        motionPreset: 'flute-breeze',
        ambientAudio: 'Flute notes, leaves, calf bells',
        verseAnchors: [
          verseLabel('I care for those who remember me', 'जो मुझे याद करते हैं, उनकी मैं रक्षा करता हूँ', 9, 22),
          verseLabel('Whatever is beautiful carries my spark', 'जो भी सुंदर है, उसमें मेरी झलक है', 10, 41),
        ],
        glossary: [
          {
            term: 'Lila',
            definition: copy(
              'Divine play: joy-filled action that reveals intimacy, freedom, and wonder.',
              'दिव्य लीला: आनंद से भरी क्रिया जो निकटता, स्वतंत्रता और विस्मय को प्रकट करती है।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-vrindavan-lilt', 'krishna-vrindavan-beloved'],
      },
      {
        id: 'vrindavan-protection',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Love Also Protects', 'प्रेम संरक्षण भी करता है'),
        caption: copy(
          'The sweetest stories are not weak; they are fierce when care is needed.',
          'सबसे मधुर कथाएँ दुर्बल नहीं होतीं; आवश्यकता पड़ने पर वे प्रखर भी हो जाती हैं।',
        ),
        narration: copy(
          'Kanu shifts the mood gently. The same Krishna who delights friends also shields them. Playfulness does not cancel strength; it teaches strength how to stay loving.',
          'कानु धीरे से भाव बदलता है। वही कृष्ण जो मित्रों को आनंद देता है, उनकी रक्षा भी करता है। चंचलता शक्ति को कम नहीं करती; वह शक्ति को प्रेमपूर्ण रहना सिखाती है।',
        ),
        deeperMeaning: copy(
          'This is why the age-progression matters. The affectionate child-world of Vrindavan becomes one of the foundations for the steadier courage seen later in Mathura, Dwaraka, and the Gita.',
          'इसीलिए आयु-प्रगति महत्त्वपूर्ण है। वृंदावन का स्नेहमय बाल-जगत आगे चलकर मथुरा, द्वारका और गीता में दिखने वाले स्थिर साहस की नींव बनता है।',
        ),
        reflectionPrompt: copy(
          'Can gentleness make you stronger instead of softer?',
          'क्या कोमलता आपको कमज़ोर नहीं, बल्कि और अधिक मजबूत बना सकती है?',
        ),
        artworkKey: 'govardhan-glow',
        motionPreset: 'lotus-rise',
        ambientAudio: 'Rain easing into flute and laughter',
        verseAnchors: [
          verseLabel('The dear devotee is compassionate', 'प्रिय भक्त करुणामय होता है', 12, 13),
        ],
        glossary: [
          {
            term: 'Karuna',
            definition: copy(
              'Compassion that does not remain abstract; it moves toward protection and relief.',
              'ऐसी करुणा जो केवल विचार नहीं रहती; वह रक्षा और राहत की ओर बढ़ती है।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-vrindavan-lilt', 'krishna-vrindavan-beloved'],
      },
      {
        id: 'vrindavan-memory',
        eyebrow: copy('Deeper meaning', 'गहरा अर्थ'),
        title: copy('Remembrance Can Be Sweet', 'स्मरण मधुर भी हो सकता है'),
        caption: copy(
          'Not all discipline begins in severity. Some of it begins in delighted remembrance.',
          'हर अनुशासन कठोरता से नहीं शुरू होता। कुछ अनुशासन आनंदमय स्मरण से भी जन्म लेते हैं।',
        ),
        narration: copy(
          'Kanu closes this arc by showing why elders return to these stories again and again. They remember that devotion does not have to begin in fear. It can begin in beauty.',
          'कानु इस प्रसंग को इस तरह समाप्त करता है कि समझ आ जाए, बड़े लोग इन कथाओं में बार-बार क्यों लौटते हैं। उन्हें स्मरण रहता है कि भक्ति को भय से शुरू होना आवश्यक नहीं। वह सौंदर्य से भी शुरू हो सकती है।',
        ),
        deeperMeaning: copy(
          'This sweetness later gives emotional balance to the battlefield teachings of the Gita. Without love, duty becomes dry. Without wisdom, love becomes unsteady. Vrindavan prepares the heart for both.',
          'यही मधुरता आगे गीता के रण-उपदेशों को भावनात्मक संतुलन देती है। प्रेम के बिना कर्तव्य सूखा हो जाता है। ज्ञान के बिना प्रेम अस्थिर हो जाता है। वृंदावन दोनों के लिए हृदय तैयार करता है।',
        ),
        reflectionPrompt: copy(
          'Which memory helps you return to goodness quickly?',
          'कौन-सी स्मृति आपको जल्दी से फिर भलाई की ओर लौटा लाती है?',
        ),
        artworkKey: 'peacock-evening',
        motionPreset: 'flute-breeze',
        ambientAudio: 'Evening flute, parrots, soft footsteps',
        verseAnchors: [
          verseLabel('Offer me your mind and heart', 'अपना मन और हृदय मुझे अर्पित करो', 12, 8),
        ],
        glossary: [
          {
            term: 'Smarana',
            definition: copy(
              'Remembering the divine with affection and steadiness.',
              'स्नेह और स्थिरता के साथ दिव्य का स्मरण करना।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-vrindavan-lilt', 'krishna-vrindavan-beloved'],
      },
    ],
  },
  {
    id: 'mathura-gate-of-courage',
    arc: 'mathura',
    order: 3,
    ageBand: 'Youth and resolve',
    durationMinutes: 6,
    sourceType: 'editorial-retelling',
    title: copy('At the Gate of Mathura', 'मथुरा के द्वार पर'),
    subtitle: copy(
      'The playful world turns toward responsibility and action.',
      'चंचल संसार अब उत्तरदायित्व और कर्म की ओर मुड़ता है।',
    ),
    summary: copy(
      'Kanu shows how the sweetness of childhood does not disappear; it ripens into courage that can walk into a city and face disorder without losing tenderness.',
      'कानु दिखाता है कि बाल्यकाल की मधुरता मिटती नहीं; वही परिपक्व होकर ऐसा साहस बनती है जो नगर में प्रवेश कर अव्यवस्था का सामना कर सके, बिना कोमलता खोए।',
    ),
    sourceLabel: SOURCE_EDITORIAL,
    artworkKey: 'mathura-gates',
    motionPreset: 'city-spark',
    focusCharacterStateIds: ['kanu-mathura-resolve'],
    scenes: [
      {
        id: 'mathura-arrival',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Leaving the Protected Circle', 'सुरक्षित घेरे से बाहर निकलना'),
        caption: copy(
          'Growth begins when love is asked to face the wider world.',
          'विकास तब शुरू होता है जब प्रेम को व्यापक संसार का सामना करना पड़ता है।',
        ),
        narration: copy(
          'Kanu’s tone deepens here. The forest-friend becomes a youth who must walk into public tension. The body is taller now, but what matters most is the heart becoming braver without becoming hard.',
          'यहाँ कानु का स्वर थोड़ा गहरा हो जाता है। वन का सखा अब ऐसे युवक में बदल रहा है जिसे सार्वजनिक तनाव के बीच चलना है। देह अब लंबी हो गई है, पर सबसे महत्वपूर्ण यह है कि हृदय अधिक साहसी हो रहा है, कठोर नहीं।',
        ),
        deeperMeaning: copy(
          'Mathura stands for the moment when sheltered goodness must become active goodness. It is the bridge from sweetness into responsibility.',
          'मथुरा उस क्षण का प्रतीक है जब संरक्षित सद्गुण को सक्रिय सद्गुण बनना पड़ता है। यह मधुरता से उत्तरदायित्व तक का सेतु है।',
        ),
        reflectionPrompt: copy(
          'What responsibility is inviting you to grow up without losing warmth?',
          'कौन-सा उत्तरदायित्व आपको गर्माहट बचाए रखते हुए परिपक्व होने के लिए बुला रहा है?',
        ),
        artworkKey: 'mathura-gates',
        motionPreset: 'city-spark',
        ambientAudio: 'Drums, footsteps, banners in wind',
        verseAnchors: [
          verseLabel('You have a right to action', 'तुम्हारा अधिकार कर्म पर है', 2, 47),
          verseLabel('Yoga is skill in action', 'योग कर्म की कुशलता है', 2, 50),
        ],
        glossary: [
          {
            term: 'Karma Yoga',
            definition: copy(
              'Acting well without being chained by ego, anxiety, or the demand to control results.',
              'ऐसा उत्तम कर्म जिसमें अहंकार, चिंता या फल को नियंत्रित करने की जकड़न न हो।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-mathura-resolve'],
      },
      {
        id: 'mathura-strength',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Strength Learns Direction', 'शक्ति को दिशा मिलती है'),
        caption: copy(
          'Power becomes trustworthy when it knows what it is protecting.',
          'शक्ति तब विश्वसनीय बनती है जब उसे पता हो कि वह किसकी रक्षा कर रही है।',
        ),
        narration: copy(
          'The city tests motive. Kanu makes this clear: action alone is not enough. One must know what kind of order, justice, and tenderness the action is trying to serve.',
          'नगर प्रेरणा की परीक्षा लेता है। कानु स्पष्ट करता है: केवल कार्रवाई पर्याप्त नहीं। यह भी जानना होता है कि वह किस प्रकार की व्यवस्था, न्याय और कोमलता की सेवा कर रही है।',
        ),
        deeperMeaning: copy(
          'This is one of the emotional roots of the Gita. Action without inner clarity exhausts. Action with alignment becomes service.',
          'यही गीता की एक भावनात्मक जड़ है। आंतरिक स्पष्टता के बिना कर्म थका देता है। सम्यक् संरेखण के साथ वही कर्म सेवा बन जाता है।',
        ),
        reflectionPrompt: copy(
          'What are you protecting when you work hard?',
          'जब आप परिश्रम करते हैं, तो वस्तुतः किसकी रक्षा कर रहे होते हैं?',
        ),
        artworkKey: 'city-skyline',
        motionPreset: 'city-spark',
        ambientAudio: 'Metal gates, echoing corridors, settling drumbeat',
        verseAnchors: [
          verseLabel('Act for the welfare of the world', 'लोकसंग्रह के लिए कर्म करो', 3, 20),
        ],
        glossary: [
          {
            term: 'Lokasangraha',
            definition: copy(
              'Holding society together through responsible action for the common good.',
              'सामूहिक हित के लिए उत्तरदायी कर्म के माध्यम से समाज को संतुलित रखना।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-mathura-resolve'],
      },
      {
        id: 'mathura-bridge',
        eyebrow: copy('Deeper meaning', 'गहरा अर्थ'),
        title: copy('The Child Has Not Vanished', 'बालक खोया नहीं है'),
        caption: copy(
          'Maturity is not the death of delight. It is delight made dependable.',
          'परिपक्वता आनंद की मृत्यु नहीं। वह आनंद को विश्वसनीय बना देना है।',
        ),
        narration: copy(
          'Kanu keeps the smile even while speaking of harder choices. That is the point. A lively spirit does not have to disappear in order to become trustworthy.',
          'कठिन विकल्पों की बात करते हुए भी कानु मुस्कान बनाए रखता है। यही तो बात है। विश्वसनीय बनने के लिए जीवंतता को मिटाना आवश्यक नहीं।',
        ),
        deeperMeaning: copy(
          'This episode makes the age-progression feel human. Growth is not a costume change alone. It is the disciplined keeping of one’s deepest sweetness.',
          'यही प्रसंग आयु-प्रगति को मानवीय बनाता है। बढ़ना केवल वेशभूषा बदलना नहीं है। यह अपनी सबसे गहरी मधुरता को अनुशासित ढंग से बचाए रखना भी है।',
        ),
        reflectionPrompt: copy(
          'How can your joy become more dependable this year?',
          'इस वर्ष आपका आनंद किस प्रकार और अधिक विश्वसनीय बन सकता है?',
        ),
        artworkKey: 'city-lantern',
        motionPreset: 'lotus-rise',
        ambientAudio: 'Lantern hum, distant city chant',
        verseAnchors: [
          verseLabel('The wise are steady in success and failure', 'बुद्धिमान सफलता-असफलता में सम रहते हैं', 2, 48),
        ],
        glossary: [
          {
            term: 'Samatva',
            definition: copy(
              'Inner balance that remains steady without becoming cold or indifferent.',
              'आंतरिक संतुलन जो स्थिर रहता है, पर ठंडा या उदासीन नहीं होता।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-mathura-resolve'],
      },
    ],
  },
  {
    id: 'dwaraka-council-of-wisdom',
    arc: 'dwaraka',
    order: 4,
    ageBand: 'Young ruler, steady heart',
    durationMinutes: 7,
    sourceType: 'editorial-retelling',
    title: copy('The Sea-City That Learned to Listen', 'समुद्र-नगर जिसने सुनना सीखा'),
    subtitle: copy(
      'Leadership, diplomacy, and responsibility without losing warmth.',
      'नेतृत्व, कूटनीति और जिम्मेदारी, बिना स्नेह खोए।',
    ),
    summary: copy(
      'Kanu now steps into the mood of Dwaraka, where Krishna’s story becomes less about childhood brilliance and more about how wisdom organizes public life.',
      'कानु अब द्वारका के भाव में प्रवेश करता है, जहाँ कृष्ण-कथा बाल-चमत्कार से आगे बढ़कर इस प्रश्न पर केंद्रित हो जाती है कि बुद्धि सार्वजनिक जीवन को कैसे व्यवस्थित करती है।',
    ),
    sourceLabel: SOURCE_EDITORIAL,
    artworkKey: 'sea-city',
    motionPreset: 'ocean-lantern',
    focusCharacterStateIds: ['kanu-dwaraka-statecraft', 'arjuna-young-prince'],
    scenes: [
      {
        id: 'dwaraka-calm',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('A Palace with Open Windows', 'खिड़कियाँ खुली रखने वाला राजमहल'),
        caption: copy(
          'Wisdom in public life begins with listening before command.',
          'सार्वजनिक जीवन में बुद्धि आदेश से पहले सुनने से शुरू होती है।',
        ),
        narration: copy(
          'Kanu describes Dwaraka with sea light instead of battlefield dust. The mood is composed, spacious, and attentive. Here Krishna’s maturity looks like listening, timing, counsel, and restraint.',
          'कानु द्वारका को रणधूलि नहीं, समुद्री प्रकाश के साथ चित्रित करता है। यहाँ का भाव संयत, विस्तृत और सजग है। इस चरण में कृष्ण की परिपक्वता सुनने, समय पहचानने, परामर्श देने और संयम रखने में दिखाई देती है।',
        ),
        deeperMeaning: copy(
          'Many people imagine wisdom as only private meditation. Dwaraka reminds us that wisdom must also learn scheduling, relationships, politics, and protection.',
          'बहुत लोग बुद्धि को केवल निजी ध्यान मानते हैं। द्वारका याद दिलाती है कि बुद्धि को समय-प्रबंधन, संबंध, राजनीति और संरक्षण भी सीखना पड़ता है।',
        ),
        reflectionPrompt: copy(
          'Where would better listening make your leadership kinder?',
          'बेहतर सुनना आपके नेतृत्व को कहाँ अधिक दयालु बना सकता है?',
        ),
        artworkKey: 'sea-city',
        motionPreset: 'ocean-lantern',
        ambientAudio: 'Sea wind, conch, soft court footsteps',
        verseAnchors: [
          verseLabel('What the great do, others follow', 'श्रेष्ठ पुरुष जैसा करता है, लोग वैसा ही करते हैं', 3, 21),
        ],
        glossary: [
          {
            term: 'Niti',
            definition: copy(
              'Practical ethical intelligence in public and relational life.',
              'सार्वजनिक और संबंधात्मक जीवन में व्यावहारिक नैतिक बुद्धि।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-dwaraka-statecraft', 'arjuna-young-prince'],
      },
      {
        id: 'dwaraka-duty',
        eyebrow: copy('Story retelling', 'कथा पुनर्कथन'),
        title: copy('Warmth with Boundaries', 'सीमाओं के साथ स्नेह'),
        caption: copy(
          'Not every loving choice feels soft in the moment.',
          'हर प्रेमपूर्ण निर्णय उस क्षण कोमल महसूस नहीं होता।',
        ),
        narration: copy(
          'Kanu makes room for the hard part of leadership. To protect a people, one must sometimes say no, delay reaction, or hold position through pressure. Wisdom is not weakness with better language.',
          'कानु नेतृत्व के कठिन पक्ष के लिए भी स्थान बनाता है। लोगों की रक्षा के लिए कभी-कभी ना कहना पड़ता है, प्रतिक्रिया टालनी पड़ती है, या दबाव के बीच अपनी स्थिति बनाए रखनी पड़ती है। बुद्धि केवल नरमी नहीं; वह परिष्कृत दृढ़ता भी है।',
        ),
        deeperMeaning: copy(
          'This prepares the emotional ground for the Gita. By the time the chariot stops at Kurukshetra, Krishna is not only affectionate and divine. He is also deeply practiced in responsibility.',
          'यही भाव आगे गीता की तैयारी करता है। जब तक रथ कुरुक्षेत्र में रुकता है, तब तक कृष्ण केवल स्नेहमय और दिव्य ही नहीं, बल्कि उत्तरदायित्व में गहराई से प्रशिक्षित भी हैं।',
        ),
        reflectionPrompt: copy(
          'Which boundary in your life is actually an act of care?',
          'आपके जीवन की कौन-सी सीमा वास्तव में एक देखभाल है?',
        ),
        artworkKey: 'council-lights',
        motionPreset: 'ocean-lantern',
        ambientAudio: 'Sea wall hush, council murmurs',
        verseAnchors: [
          verseLabel('Do your own duty well', 'अपने स्वधर्म को अच्छे से निभाओ', 18, 45),
        ],
        glossary: [
          {
            term: 'Svadharma',
            definition: copy(
              'The responsibility that belongs to you because of your nature, position, and calling.',
              'आपकी प्रकृति, स्थिति और आह्वान के कारण आप पर जो उत्तरदायित्व आता है।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-dwaraka-statecraft', 'arjuna-young-prince'],
      },
      {
        id: 'dwaraka-ripening',
        eyebrow: copy('Deeper meaning', 'गहरा अर्थ'),
        title: copy('Wisdom Ripens in Public', 'बुद्धि सार्वजनिक जीवन में भी पकती है'),
        caption: copy(
          'A dharmic life must know how to love a family, a city, and a truth at the same time.',
          'धार्मिक जीवन को परिवार, नगर और सत्य तीनों से एक साथ प्रेम करना सीखना पड़ता है।',
        ),
        narration: copy(
          'Kanu now feels visibly older. The face stays bright, but the posture is calmer and more rooted. That is how the story signals growth before the Gita begins.',
          'अब कानु स्पष्ट रूप से अधिक बड़ा लगता है। चेहरा उजला है, पर देह-भंगिमा अधिक शांत और स्थिर है। कथा गीता शुरू होने से पहले इसी प्रकार विकास का संकेत देती है।',
        ),
        deeperMeaning: copy(
          'Dwaraka matters because it prevents the Gita from feeling detached from life. The teacher of the battlefield has already been the keeper of relationships, timing, power, and consequence.',
          'द्वारका इसलिए महत्वपूर्ण है क्योंकि वह गीता को जीवन से कटा हुआ नहीं लगने देती। रणभूमि का शिक्षक पहले ही संबंध, समय, शक्ति और परिणाम का संरक्षक रह चुका है।',
        ),
        reflectionPrompt: copy(
          'Where is your wisdom still private when it needs to become practical?',
          'आपकी कौन-सी बुद्धि अभी निजी है, जबकि उसे व्यवहारिक बनना चाहिए?',
        ),
        artworkKey: 'harbor-stars',
        motionPreset: 'lotus-rise',
        ambientAudio: 'Harbor wind, lamps, measured silence',
        verseAnchors: [
          verseLabel('Offer every action to the Highest', 'हर कर्म को परम को अर्पित करो', 3, 30),
        ],
        glossary: [
          {
            term: 'Tyaga',
            definition: copy(
              'Renouncing ego-ownership while still showing up fully in action.',
              'अहंकारी स्वामित्व का त्याग करते हुए भी कर्म में पूरी तरह उपस्थित रहना।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-dwaraka-statecraft', 'arjuna-young-prince'],
      },
    ],
  },
  {
    id: 'kurukshetra-dawn-of-counsel',
    arc: 'kurukshetra',
    order: 5,
    ageBand: 'Guide, friend, and revealer',
    durationMinutes: 8,
    sourceType: 'editorial-retelling',
    title: copy('Before the First Teaching', 'पहले उपदेश से ठीक पहले'),
    subtitle: copy(
      'The chariot stops, the heart shakes, and the Gita is about to begin.',
      'रथ रुकता है, हृदय काँपता है, और गीता शुरू होने ही वाली है।',
    ),
    summary: copy(
      'Kanu brings all previous arcs into one charged morning. The playful child, the courageous youth, and the wise statesman now stand inside the same compassionate guide.',
      'कानु अब पूर्व के सभी प्रसंगों को एक तीव्र प्रभात में समेट देता है। चंचल बालक, साहसी युवक और बुद्धिमान शासक अब एक ही करुणामय मार्गदर्शक के भीतर एकत्र खड़े हैं।',
    ),
    sourceLabel: SOURCE_EDITORIAL,
    artworkKey: 'battlefield-dawn',
    motionPreset: 'battle-breeze',
    focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'krishna-kurukshetra-charioteer', 'arjuna-listener'],
    scenes: [
      {
        id: 'kurukshetra-pause',
        eyebrow: copy('Story bridge', 'कथा से गीता की सेतु'),
        title: copy('The Most Important Pause', 'सबसे महत्वपूर्ण विराम'),
        caption: copy(
          'The Gita begins because someone is allowed to stop before acting.',
          'गीता इसलिए शुरू होती है क्योंकि किसी को कर्म से पहले रुकने की अनुमति मिलती है।',
        ),
        narration: copy(
          'Kanu lowers his voice. Dust rises. Conches fade into inner noise. Arjuna is not weak here; he is honest enough to admit that duty has become emotionally unbearable.',
          'कानु अपनी आवाज़ धीमी कर देता है। धूल उठती है। शंखों की ध्वनि भीतर के शोर में बदल जाती है। यहाँ अर्जुन दुर्बल नहीं है; वह इतना ईमानदार है कि स्वीकार कर सके कि कर्तव्य भावनात्मक रूप से असहनीय हो गया है।',
        ),
        deeperMeaning: copy(
          'This is why the Gita still feels modern. It does not begin with a perfect student. It begins with overwhelm, grief, and moral exhaustion.',
          'इसीलिए गीता आज भी आधुनिक लगती है। वह एक परिपूर्ण शिष्य से शुरू नहीं होती। वह अभिभूतता, शोक और नैतिक थकान से शुरू होती है।',
        ),
        reflectionPrompt: copy(
          'When you freeze, do you shame yourself or become honest enough to seek guidance?',
          'जब आप ठिठकते हैं, तो स्वयं को दोष देते हैं या मार्गदर्शन लेने जितने ईमानदार बनते हैं?',
        ),
        artworkKey: 'battlefield-dawn',
        motionPreset: 'battle-breeze',
        ambientAudio: 'Conches, reins, still air before instruction',
        verseAnchors: [
          verseLabel('Arjuna’s grief rises', 'अर्जुन का शोक उठता है', 1, 28),
          verseLabel('Krishna begins to answer', 'कृष्ण उत्तर देना शुरू करते हैं', 2, 11),
        ],
        glossary: [
          {
            term: 'Vishada',
            definition: copy(
              'A collapse of confidence brought on by grief, confusion, and moral strain.',
              'शोक, भ्रम और नैतिक तनाव से उत्पन्न आत्मबल का ध्वंस।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'arjuna-listener'],
      },
      {
        id: 'kurukshetra-friend',
        eyebrow: copy('Story bridge', 'कथा से गीता की सेतु'),
        title: copy('Why Arjuna Can Listen', 'अर्जुन क्यों सुन पाता है'),
        caption: copy(
          'The teacher on the chariot is trustworthy because the relationship already carries love, courage, and history.',
          'रथ पर बैठा शिक्षक इसलिए विश्वसनीय है क्योंकि संबंध पहले से ही प्रेम, साहस और साझा इतिहास से भरा है।',
        ),
        narration: copy(
          'Kanu reminds us that Krishna does not appear on this battlefield as a stranger. Everything before this morning has prepared the intimacy that makes instruction possible.',
          'कानु याद दिलाता है कि कृष्ण रणभूमि पर किसी अजनबी की तरह नहीं आते। इस प्रभात से पहले का समूचा जीवन उस निकटता की तैयारी है जो उपदेश को संभव बनाती है।',
        ),
        deeperMeaning: copy(
          'The story arcs are not decoration. They are emotional preparation. When Krishna speaks, Arjuna hears not only philosophy, but the voice of a proven friend and guide.',
          'ये कथा-प्रसंग सजावट नहीं हैं। ये भावनात्मक तैयारी हैं। जब कृष्ण बोलते हैं, अर्जुन केवल दर्शन नहीं सुनता; वह एक सिद्ध मित्र और मार्गदर्शक की आवाज़ सुनता है।',
        ),
        reflectionPrompt: copy(
          'Whose voice can reach you because trust already exists?',
          'किसकी आवाज़ आप तक पहुँच सकती है क्योंकि भरोसा पहले से मौजूद है?',
        ),
        artworkKey: 'chariot-close',
        motionPreset: 'battle-breeze',
        ambientAudio: 'Chariot wood, horse breath, quiet resolve',
        verseAnchors: [
          verseLabel('Take refuge in me', 'मुझमें शरण लो', 18, 66),
          verseLabel('Arjuna regains clarity', 'अर्जुन को स्पष्टता लौटती है', 18, 73),
        ],
        glossary: [
          {
            term: 'Shraddha',
            definition: copy(
              'Trusting attentiveness that allows wisdom to enter deeply.',
              'ऐसी विश्वासी सजगता जो ज्ञान को भीतर तक उतरने देती है।',
            ),
          },
        ],
        focusCharacterStateIds: ['krishna-kurukshetra-charioteer', 'arjuna-listener'],
      },
      {
        id: 'kurukshetra-door',
        eyebrow: copy('Canonical handoff', 'प्रमाणित पाठ की ओर प्रवेश'),
        title: copy('The Door Opens into 18 Chapters', 'द्वार अठारह अध्यायों में खुलता है'),
        caption: copy(
          'Story mode now hands you to the canonical Gita journey chapter by chapter.',
          'अब स्टोरी मोड आपको प्रमाणित गीता-यात्रा में अध्याय-दर-अध्याय सौंपता है।',
        ),
        narration: copy(
          'Kanu smiles once more and steps slightly aside. The story has carried us here. Now the verses themselves take the lead.',
          'कानु एक बार फिर मुस्कराता है और थोड़ा-सा एक तरफ हो जाता है। कथा हमें यहाँ तक लाई है। अब श्लोक स्वयं आगे बढ़ेंगे।',
        ),
        deeperMeaning: copy(
          'This handoff is part of the trust design. Kanu can warm the heart and frame the journey, but the Bhagavad Gita remains the authoritative center.',
          'यही हस्तांतरण भरोसे की रचना का भाग है। कानु हृदय को गर्म कर सकता है और यात्रा का प्रसंग दे सकता है, पर अंतिम प्रमाणित केंद्र भगवद्गीता ही रहेगी।',
        ),
        reflectionPrompt: copy(
          'Which chapter feels like the right place for you to begin today?',
          'आज आपके लिए कौन-सा अध्याय आरंभ करने का सही स्थान लगता है?',
        ),
        artworkKey: 'dawn-threshold',
        motionPreset: 'lotus-rise',
        ambientAudio: 'Conch fades into quiet chapter-turning',
        verseAnchors: [
          verseLabel('The teaching starts', 'उपदेश प्रारम्भ होता है', 2, 11),
          verseLabel('The student is ready', 'शिष्य तैयार है', 18, 73),
        ],
        glossary: [
          {
            term: 'Upadesha',
            definition: copy(
              'Guidance that is offered in relationship and meant to transform how one lives.',
              'ऐसा उपदेश जो संबंध में दिया जाता है और जिसका उद्देश्य जीवन-प्रवृत्ति को बदलना होता है।',
            ),
          },
        ],
        focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'krishna-kurukshetra-charioteer', 'arjuna-listener'],
      },
    ],
  },
];

const CHAPTER_NOTES: Record<number, {
  summary: StoryCopy;
  storyBeat: StoryCopy;
  teachingBeat: StoryCopy;
  livingBeat: StoryCopy;
  verses: [number, number, number];
  artworkKey: string;
  motionPreset: StoryMotionPreset;
  glossary: StoryGlossaryItem[];
}> = {
  1: {
    summary: copy(
      'The Gita opens with moral grief. Arjuna sees beloved teachers, relatives, and friends on both sides and his courage breaks under the emotional weight.',
      'गीता नैतिक शोक से शुरू होती है। अर्जुन अपने गुरुओं, संबंधियों और मित्रों को दोनों ओर देखकर भावनात्मक भार के नीचे टूटने लगता है।',
    ),
    storyBeat: copy(
      'The battlefield suddenly becomes personal. Arjuna is not looking at enemies in the abstract anymore; he is looking at faces tied to memory and affection.',
      'रणभूमि अचानक निजी हो जाती है। अर्जुन अब किसी अमूर्त शत्रु को नहीं, बल्कि स्मृति और स्नेह से जुड़े चेहरों को देख रहा है।',
    ),
    teachingBeat: copy(
      'Chapter one does not solve the crisis. It dignifies it. The honesty of the collapse becomes the doorway into the rest of the Gita.',
      'पहला अध्याय संकट का समाधान नहीं करता; वह उसे गरिमा देता है। यही ईमानदार टूटन आगे की गीता का द्वार बनती है।',
    ),
    livingBeat: copy(
      'For modern life, this chapter says: if your heart is shaking, begin there honestly rather than pretending clarity you do not have.',
      'आधुनिक जीवन के लिए यह अध्याय कहता है: यदि आपका हृदय काँप रहा है, तो वहीं से ईमानदारी से शुरू कीजिए, झूठी स्पष्टता का अभिनय मत कीजिए।',
    ),
    verses: [1, 28, 47],
    artworkKey: 'battlefield-dawn',
    motionPreset: 'battle-breeze',
    glossary: [
      {
        term: 'Arjuna Vishada',
        definition: copy(
          'Arjuna’s despondency: the collapse that comes when love, duty, and fear collide.',
          'अर्जुन विषाद: जब प्रेम, कर्तव्य और भय टकराते हैं तो जो विघटन उत्पन्न होता है।',
        ),
      },
    ],
  },
  2: {
    summary: copy(
      'Krishna begins the teaching with the immortality of the Self, the call to steadiness, and the foundations of action without attachment.',
      'कृष्ण आत्मा की अमरता, समत्व और आसक्ति-रहित कर्म की नींव से उपदेश प्रारम्भ करते हैं।',
    ),
    storyBeat: copy(
      'The voice on the chariot becomes clear and steady. Krishna does not scold Arjuna into numbness; he lifts him toward a wider vision of life and death.',
      'रथ पर बैठी आवाज़ अब स्पष्ट और स्थिर हो जाती है। कृष्ण अर्जुन को कठोर बनाकर नहीं, बल्कि जीवन और मृत्यु की व्यापक दृष्टि दिखाकर उठाते हैं।',
    ),
    teachingBeat: copy(
      'This chapter establishes the great themes: the Self is deeper than the body, wisdom stays steady, and action must not be ruled by feverish attachment.',
      'यह अध्याय गीता के महान विषय स्थापित करता है: आत्मा शरीर से गहरी है, बुद्धि स्थिर रहती है, और कर्म उन्मत्त आसक्ति से संचालित नहीं होना चाहिए।',
    ),
    livingBeat: copy(
      'When life becomes noisy, this chapter teaches you to remember both your depth and your duty.',
      'जब जीवन बहुत शोरभरा हो जाए, यह अध्याय आपको अपनी गहराई और अपने कर्तव्य दोनों का स्मरण कराता है।',
    ),
    verses: [11, 47, 72],
    artworkKey: 'lotus-mind',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Sthitaprajna',
        definition: copy(
          'One whose wisdom is steady and whose mind is not thrown around by every gain or loss.',
          'वह जिसकी बुद्धि स्थिर है और जिसका मन हर लाभ-हानि से इधर-उधर नहीं फेंका जाता।',
        ),
      },
    ],
  },
  3: {
    summary: copy(
      'Krishna deepens karma yoga: action is unavoidable, so it must be purified and aligned to dharma rather than desire alone.',
      'कृष्ण कर्मयोग को गहरा करते हैं: कर्म से बचा नहीं जा सकता, इसलिए उसे शुद्ध कर धर्म के अनुरूप करना होगा, मात्र इच्छा के अनुसार नहीं।',
    ),
    storyBeat: copy(
      'Arjuna wants a cleaner escape, but Krishna keeps turning him back toward responsible participation in the world.',
      'अर्जुन कोई सरल पलायन चाहता है, पर कृष्ण बार-बार उसे संसार में उत्तरदायी भागीदारी की ओर लौटाते हैं।',
    ),
    teachingBeat: copy(
      'Selfless action is not passivity. It is disciplined contribution without ego-possession of the result.',
      'निष्काम कर्म निष्क्रियता नहीं है। यह परिणाम पर अहंकारी स्वामित्व के बिना अनुशासित योगदान है।',
    ),
    livingBeat: copy(
      'When you cannot avoid action, purify motive, offer the work, and do it well.',
      'जब कर्म से बचना संभव न हो, तो प्रेरणा को शुद्ध कीजिए, कर्म अर्पित कीजिए, और उसे श्रेष्ठ ढंग से कीजिए।',
    ),
    verses: [5, 21, 30],
    artworkKey: 'council-lights',
    motionPreset: 'city-spark',
    glossary: [
      {
        term: 'Yajna',
        definition: copy(
          'Sacrificial offering: a way of acting that is larger than self-centered consumption.',
          'यज्ञ: ऐसा कर्म-भाव जो स्वकेंद्रित उपभोग से बड़ा हो और अर्पण में बदल जाए।',
        ),
      },
    ],
  },
  4: {
    summary: copy(
      'Krishna reveals the sacred lineage of the teaching, the meaning of divine descent, and the role of wisdom in transforming action.',
      'कृष्ण उपदेश की परंपरा, अवतार के अर्थ और ज्ञान द्वारा कर्म को रूपांतरित करने की प्रक्रिया बताते हैं।',
    ),
    storyBeat: copy(
      'The chapter widens the frame. Krishna is no longer only advising a friend; he is revealing why wisdom returns whenever the world loses balance.',
      'यह अध्याय दृष्टि का विस्तार करता है। कृष्ण केवल एक मित्र को सलाह नहीं दे रहे; वे बता रहे हैं कि जब संसार संतुलन खो देता है, तब ज्ञान फिर-फिर क्यों लौटता है।',
    ),
    teachingBeat: copy(
      'Divine descent is not spectacle for its own sake. It is restorative compassion entering history.',
      'अवतार केवल चमत्कार के लिए नहीं होता। वह इतिहास में प्रवेश करती हुई पुनर्स्थापित करने वाली करुणा है।',
    ),
    livingBeat: copy(
      'Learn from worthy lineages, but do not stop at information. Let insight reshape how you act.',
      'योग्य परंपराओं से सीखिए, पर केवल सूचना पर मत रुकिए। अंतर्दृष्टि को अपने कर्म को बदलने दीजिए।',
    ),
    verses: [7, 8, 34],
    artworkKey: 'sun-lineage',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Avatar',
        definition: copy(
          'A divine descent: the sacred entering the world to restore alignment and protect dharma.',
          'अवतार: धर्म की रक्षा और संतुलन की पुनर्स्थापना के लिए दिव्य का संसार में अवतरण।',
        ),
      },
    ],
  },
  5: {
    summary: copy(
      'Renunciation and action are reconciled. True renunciation is inward freedom, not merely outer withdrawal.',
      'संन्यास और कर्म का मेल कराया जाता है। सच्चा संन्यास बाहरी पलायन नहीं, भीतर की स्वतंत्रता है।',
    ),
    storyBeat: copy(
      'Arjuna keeps searching for the cleaner path, but Krishna shows that inner freedom matters more than outward labels.',
      'अर्जुन बार-बार सरल लगने वाला मार्ग खोजता है, पर कृष्ण दिखाते हैं कि बाहरी नामों से अधिक महत्व भीतरी स्वतंत्रता का है।',
    ),
    teachingBeat: copy(
      'The liberated person acts without sticky possessiveness. Life continues, but the mind is not caught in every consequence.',
      'मुक्त व्यक्ति कर्म करता है पर चिपकने वाले स्वामित्व के बिना। जीवन चलता रहता है, पर मन हर परिणाम में फँसता नहीं।',
    ),
    livingBeat: copy(
      'Peace comes less from running away and more from loosening the ego that clings to every action.',
      'शांति भागने से कम, और हर कर्म से चिपकते हुए अहंकार को ढीला करने से अधिक आती है।',
    ),
    verses: [3, 10, 29],
    artworkKey: 'quiet-lotus',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Sannyasa',
        definition: copy(
          'Renunciation: inward release from grasping, whether one is outwardly active or not.',
          'संन्यास: चाह-चिपकन से भीतर की मुक्ति, चाहे व्यक्ति बाह्य रूप से सक्रिय हो या नहीं।',
        ),
      },
    ],
  },
  6: {
    summary: copy(
      'The Gita turns to meditation, discipline of mind, and the effort required to become inwardly steady.',
      'गीता अब ध्यान, मन-संयम और भीतर से स्थिर होने के लिए आवश्यक अनुशासन की ओर मुड़ती है।',
    ),
    storyBeat: copy(
      'The battlefield teaching pauses long enough to address the wildness of the mind itself.',
      'रणभूमि का उपदेश थोड़ी देर रुककर स्वयं मन की चंचलता को संबोधित करता है।',
    ),
    teachingBeat: copy(
      'Meditation is not an escape hatch. It is training the inner instrument so insight can remain available when life is demanding.',
      'ध्यान कोई भागने का रास्ता नहीं। यह भीतर के साधन को प्रशिक्षित करना है ताकि कठिन जीवन में भी अंतर्दृष्टि उपलब्ध रहे।',
    ),
    livingBeat: copy(
      'The mind may wander again and again; the practice is to return again and again without self-contempt.',
      'मन बार-बार भटकेगा; साधना यह है कि आप बार-बार लौटें, बिना स्वयं से घृणा किए।',
    ),
    verses: [5, 26, 47],
    artworkKey: 'meditation-horizon',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Abhyasa',
        definition: copy(
          'Repeated practice that gently trains the mind back toward steadiness.',
          'बार-बार की जाने वाली साधना जो मन को धीरे-धीरे स्थिरता की ओर प्रशिक्षित करती है।',
        ),
      },
    ],
  },
  7: {
    summary: copy(
      'Krishna reveals himself as the source and ground of all manifested and unmanifest reality.',
      'कृष्ण स्वयं को समस्त व्यक्त और अव्यक्त जगत का मूल और आधार प्रकट करते हैं।',
    ),
    storyBeat: copy(
      'The teacher becomes more openly theological. Krishna now speaks of himself as the deep reality behind the world Arjuna sees.',
      'शिक्षक यहाँ अधिक खुले रूप से दार्शनिक-धार्मिक हो जाता है। कृष्ण अब स्वयं को उस जगत के पीछे की गहरी वास्तविकता के रूप में व्यक्त करते हैं जिसे अर्जुन देख रहा है।',
    ),
    teachingBeat: copy(
      'Wisdom is not only about ethics or calm. It is also about recognizing the divine source that permeates existence.',
      'ज्ञान केवल नैतिकता या शांति तक सीमित नहीं। वह उस दिव्य आधार को पहचानना भी है जो समस्त अस्तित्व में व्याप्त है।',
    ),
    livingBeat: copy(
      'When the world feels fragmented, this chapter helps you perceive a deeper unity beneath the fragments.',
      'जब संसार बिखरा हुआ लगे, यह अध्याय आपको उन टुकड़ों के नीचे छिपी गहरी एकता का अनुभव कराता है।',
    ),
    verses: [7, 14, 30],
    artworkKey: 'cosmic-ocean',
    motionPreset: 'ocean-lantern',
    glossary: [
      {
        term: 'Maya',
        definition: copy(
          'The binding power of appearance and confusion that makes the deeper truth hard to see.',
          'रूप-भ्रम की वह शक्ति जो गहरे सत्य को देखना कठिन बना देती है।',
        ),
      },
    ],
  },
  8: {
    summary: copy(
      'Arjuna asks about death, remembrance, and the imperishable. Krishna teaches how consciousness at life’s end relates to one’s deepest orientation.',
      'अर्जुन मृत्यु, स्मरण और अक्षर के बारे में पूछता है। कृष्ण बताते हैं कि जीवनांत की चेतना का संबंध मनुष्य की गहनतम अभिमुखता से है।',
    ),
    storyBeat: copy(
      'The battlefield opens into questions people often hide until late in life: what endures, what matters, and how should one remember at the final threshold?',
      'रणभूमि अब उन प्रश्नों की ओर खुलती है जिन्हें लोग अक्सर जीवन के अंत तक टालते रहते हैं: क्या टिकता है, क्या महत्त्वपूर्ण है, और अंतिम दहलीज़ पर स्मरण कैसा हो?',
    ),
    teachingBeat: copy(
      'This chapter treats remembrance not as panic at the last second, but as the direction one has cultivated through life.',
      'यह अध्याय स्मरण को अंतिम क्षण की घबराहट नहीं मानता; वह इसे जीवन भर गढ़ी हुई दिशा बताता है।',
    ),
    livingBeat: copy(
      'Live in such a way that your deepest habit of heart becomes trustworthy, not accidental.',
      'ऐसे जिएँ कि आपके हृदय की सबसे गहरी आदत विश्वसनीय बने, आकस्मिक नहीं।',
    ),
    verses: [5, 7, 28],
    artworkKey: 'threshold-stars',
    motionPreset: 'cosmic-pulse',
    glossary: [
      {
        term: 'Akshara',
        definition: copy(
          'The imperishable reality that does not decay with changing forms.',
          'वह अक्षर सत्य जो बदलते रूपों के साथ नष्ट नहीं होता।',
        ),
      },
    ],
  },
  9: {
    summary: copy(
      'One of the most beloved chapters, it reveals the royal secret of devotion: the divine is both vast and intimately present.',
      'यह अत्यंत प्रिय अध्याय राजविद्या और राजगुह्य को प्रकट करता है: दिव्य एक साथ विराट भी है और अत्यंत निकट भी।',
    ),
    storyBeat: copy(
      'The tone turns tender again. Krishna speaks with unusual intimacy, drawing Arjuna into a vision of devotion that is generous and accessible.',
      'स्वर फिर से अत्यंत स्नेहमय हो जाता है। कृष्ण असाधारण निकटता के साथ बोलते हैं और अर्जुन को ऐसी भक्ति-दृष्टि में आमंत्रित करते हैं जो उदार और सुलभ है।',
    ),
    teachingBeat: copy(
      'The divine pervades all, receives even the simplest sincere offering, and holds devotees with personal care.',
      'दिव्य सबमें व्याप्त है, सबसे सरल सच्चे अर्पण को भी स्वीकार करता है, और भक्तों को व्यक्तिगत रूप से सँभालता है।',
    ),
    livingBeat: copy(
      'Do not wait for perfection before offering your heart. Sincerity is already a doorway.',
      'पूर्णता का इंतज़ार मत कीजिए; अपना हृदय अभी अर्पित कीजिए। निष्कपटता स्वयं एक द्वार है।',
    ),
    verses: [22, 26, 34],
    artworkKey: 'devotion-amber',
    motionPreset: 'flute-breeze',
    glossary: [
      {
        term: 'Bhava',
        definition: copy(
          'Inner devotional feeling; the heart-tone with which one approaches the divine.',
          'आंतरिक भक्ति-भाव; वह हृदय-स्वर जिससे मनुष्य दिव्य के निकट जाता है।',
        ),
      },
    ],
  },
  10: {
    summary: copy(
      'Krishna names his vibhutis, the special manifestations by which one may recognize the divine in the excellence of the world.',
      'कृष्ण अपनी विभूतियों का वर्णन करते हैं, जिनके द्वारा संसार की उत्कृष्टताओं में दिव्य को पहचाना जा सकता है।',
    ),
    storyBeat: copy(
      'The chapter feels like a sacred tour of reality. Krishna points to brilliance, beauty, strength, wisdom, and wonder as signs that the world is not spiritually empty.',
      'यह अध्याय मानो पवित्र यात्रा बन जाता है। कृष्ण तेज, सौंदर्य, शक्ति, बुद्धि और विस्मय को इस संकेत के रूप में दिखाते हैं कि संसार आध्यात्मिक रूप से रिक्त नहीं है।',
    ),
    teachingBeat: copy(
      'The point is not to worship power by itself, but to train perception so excellence becomes a reminder of the highest.',
      'उद्देश्य शक्ति को अपने आप में पूजना नहीं, बल्कि दृष्टि को प्रशिक्षित करना है ताकि उत्कृष्टता परम की याद दिलाए।',
    ),
    livingBeat: copy(
      'Look for the sacred spark in what is most alive, most luminous, and most ennobling around you.',
      'अपने आसपास जो सबसे अधिक जीवंत, उज्ज्वल और उदात्त है, उसमें दिव्य चिनगारी को पहचानने का अभ्यास कीजिए।',
    ),
    verses: [20, 41, 42],
    artworkKey: 'constellation-map',
    motionPreset: 'cosmic-pulse',
    glossary: [
      {
        term: 'Vibhuti',
        definition: copy(
          'A divine glory or excellence through which the sacred becomes easier to recognize.',
          'दिव्य विभूति या उत्कृष्टता, जिसके माध्यम से पवित्र को पहचानना सरल हो जाता है।',
        ),
      },
    ],
  },
  11: {
    summary: copy(
      'Arjuna beholds Krishna’s cosmic form: beautiful, terrifying, all-containing, and impossible to reduce to a private comfort.',
      'अर्जुन कृष्ण का विश्वरूप देखता है: सुंदर, भयावह, सर्वसमावेशी और किसी निजी सांत्वना तक सीमित न रहने वाला।',
    ),
    storyBeat: copy(
      'The intimacy of friendship bursts open into vastness. The guide becomes immeasurable, and Arjuna sees time, destiny, and power converging in one vision.',
      'मित्रता की निकटता अचानक विराटता में फट पड़ती है। मार्गदर्शक असीम हो उठता है, और अर्जुन समय, नियति और शक्ति को एक ही रूप में एकत्र देखता है।',
    ),
    teachingBeat: copy(
      'The cosmic form protects devotion from becoming sentimental. The divine is tender, but not tame.',
      'विश्वरूप भक्ति को केवल भावुक होने से बचाता है। दिव्य स्नेहमय है, पर वश में आने वाला नहीं।',
    ),
    livingBeat: copy(
      'Let awe enlarge your humility. Some truths are meant to be revered before they are analyzed.',
      'विस्मय को अपनी विनम्रता का विस्तार बनने दीजिए। कुछ सत्य विश्लेषण से पहले वंदना माँगते हैं।',
    ),
    verses: [8, 32, 50],
    artworkKey: 'cosmic-vision',
    motionPreset: 'cosmic-pulse',
    glossary: [
      {
        term: 'Vishvarupa',
        definition: copy(
          'The universal form: the all-containing manifestation of the divine.',
          'विश्वरूप: दिव्य का सर्वसमावेशी, सार्वभौमिक प्रकट रूप।',
        ),
      },
    ],
  },
  12: {
    summary: copy(
      'A concise and beloved chapter on devotion, focusing on the qualities of the dear devotee and the accessibility of loving practice.',
      'भक्ति पर यह संक्षिप्त और अत्यंत प्रिय अध्याय प्रिय भक्त के गुणों और प्रेममय साधना की सुगमता पर केंद्रित है।',
    ),
    storyBeat: copy(
      'After the overwhelming vision, Krishna returns to intimacy and speaks of the person whose life itself becomes devotion.',
      'विश्वरूप के बाद कृष्ण पुनः निकटता में लौटते हैं और ऐसे व्यक्ति की चर्चा करते हैं जिसका जीवन ही भक्ति बन जाता है।',
    ),
    teachingBeat: copy(
      'The dear devotee is not defined by display. Gentleness, non-hatred, steadiness, and trust are the marks that matter.',
      'प्रिय भक्त का माप प्रदर्शन से नहीं होता। कोमलता, अद्वेष, स्थिरता और विश्वास ही उसके वास्तविक चिन्ह हैं।',
    ),
    livingBeat: copy(
      'If devotion feels abstract, begin with character: become safer, kinder, and steadier for the people around you.',
      'यदि भक्ति अभी अमूर्त लगती हो, तो चरित्र से शुरू कीजिए: अपने आसपास के लोगों के लिए अधिक सुरक्षित, दयालु और स्थिर बनिए।',
    ),
    verses: [8, 13, 20],
    artworkKey: 'lotus-devotion',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Bhakta',
        definition: copy(
          'A devotee whose heart, habits, and character turn toward the divine.',
          'भक्त: जिसका हृदय, आचरण और चरित्र दिव्य की ओर उन्मुख हो जाए।',
        ),
      },
    ],
  },
  13: {
    summary: copy(
      'Krishna distinguishes the field and the knower of the field, clarifying body, mind, nature, and awareness.',
      'कृष्ण क्षेत्र और क्षेत्रज्ञ का भेद बताते हैं, और शरीर, मन, प्रकृति तथा चेतना के संबंध को स्पष्ट करते हैं।',
    ),
    storyBeat: copy(
      'The Gita turns inwardly philosophical. It asks Arjuna to notice the difference between what is experienced and the awareness that knows the experience.',
      'गीता अब अधिक अंतर्मुख दार्शनिक हो जाती है। वह अर्जुन से पूछती है कि अनुभूत वस्तु और उसे जानने वाली चेतना में भेद पहचाने।',
    ),
    teachingBeat: copy(
      'Without this distinction, life becomes total identification with body, mood, and circumstance. With it, freedom begins to breathe.',
      'इस भेद के बिना जीवन शरीर, मनोदशा और परिस्थिति के साथ पूर्ण पहचान बन जाता है। इस भेद के साथ स्वतंत्रता साँस लेने लगती है।',
    ),
    livingBeat: copy(
      'Notice what is happening inside you, and also notice that you are more than the passing contents of that inner weather.',
      'अपने भीतर क्या हो रहा है, इसे देखिए; और यह भी देखिए कि आप उस बदलते हुए भीतरी मौसम से अधिक हैं।',
    ),
    verses: [1, 2, 35],
    artworkKey: 'field-and-seer',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Kshetra / Kshetrajna',
        definition: copy(
          'The field and the knower of the field: experience and the awareness that knows it.',
          'क्षेत्र और क्षेत्रज्ञ: अनुभव का क्षेत्र और उसे जानने वाली चेतना।',
        ),
      },
    ],
  },
  14: {
    summary: copy(
      'The three gunas explain the shifting textures of human life and behavior: clarity, restlessness, and inertia.',
      'तीन गुण मानव जीवन और व्यवहार के बदलते रंगों को समझाते हैं: स्पष्टता, चंचलता और जड़ता।',
    ),
    storyBeat: copy(
      'Krishna gives Arjuna a map for inner weather. Different moods are not random; they are shaped by forces with recognizable tendencies.',
      'कृष्ण अर्जुन को भीतरी मौसम का एक मानचित्र देते हैं। अलग-अलग मनःस्थितियाँ आकस्मिक नहीं; वे पहचाने जा सकने वाले गुणों से आकार लेती हैं।',
    ),
    teachingBeat: copy(
      'Sattva illuminates, rajas agitates, and tamas obscures. The goal is not vanity about sattva but freedom beyond the whole cycle.',
      'सत्त्व प्रकाश देता है, रजस चंचल करता है, और तमस ढँक देता है। लक्ष्य केवल सत्त्व पर गर्व करना नहीं, बल्कि पूरे चक्र से ऊपर उठना है।',
    ),
    livingBeat: copy(
      'Learning your patterns is not self-judgment. It is the start of wiser self-guidance.',
      'अपने पैटर्न समझना आत्म-निंदा नहीं; यह अधिक बुद्धिमान आत्म-मार्गदर्शन की शुरुआत है।',
    ),
    verses: [6, 17, 27],
    artworkKey: 'three-gunas',
    motionPreset: 'cosmic-pulse',
    glossary: [
      {
        term: 'Guna',
        definition: copy(
          'A fundamental quality of nature shaping mood, habit, and perception.',
          'प्रकृति की मूल प्रवृत्ति जो मनोभाव, आदत और दृष्टि को आकार देती है।',
        ),
      },
    ],
  },
  15: {
    summary: copy(
      'The world is pictured as an upside-down tree, and Krishna teaches the supreme purusha beyond decay and entanglement.',
      'संसार को उल्टे वृक्ष के रूप में चित्रित किया गया है, और कृष्ण क्षय और बंधन से परे पुरुषोत्तम का उपदेश देते हैं।',
    ),
    storyBeat: copy(
      'The chapter becomes symbolic and luminous. Krishna invites Arjuna to see the world as rooted beyond what the senses first report.',
      'यह अध्याय प्रतीकात्मक और प्रकाशमय हो उठता है। कृष्ण अर्जुन को संसार को इंद्रियों से दिखने वाली सतह से परे जड़ित रूप में देखने के लिए बुलाते हैं।',
    ),
    teachingBeat: copy(
      'Life in the world is real, but it is not self-grounding. The highest source stands beyond the shifting branches.',
      'संसार का जीवन वास्तविक है, पर अपने आप में अंतिम आधार नहीं। सर्वोच्च स्रोत इन बदलती शाखाओं से परे स्थित है।',
    ),
    livingBeat: copy(
      'Keep engaging life, but do not confuse the branches with the root.',
      'जीवन में सक्रिय रहिए, पर शाखाओं को जड़ समझ बैठिए मत।',
    ),
    verses: [1, 7, 20],
    artworkKey: 'world-tree',
    motionPreset: 'ocean-lantern',
    glossary: [
      {
        term: 'Purushottama',
        definition: copy(
          'The Supreme Person beyond the perishable and the imperishable conditioned orders.',
          'वह परम पुरुष जो क्षर और अक्षर दोनों सीमित व्यवस्थाओं से परे है।',
        ),
      },
    ],
  },
  16: {
    summary: copy(
      'A moral psychology of divine and demoniac qualities: character shapes destiny as much as belief does.',
      'दैवी और आसुरी संपदाओं का नैतिक मनोविज्ञान: चरित्र भी नियति को उतना ही आकार देता है जितना विश्वास।',
    ),
    storyBeat: copy(
      'The Gita now becomes uncomfortably practical. It asks not what you admire in theory, but what qualities you are actually feeding in your daily life.',
      'गीता अब असुविधाजनक रूप से व्यवहारिक हो जाती है। वह यह नहीं पूछती कि आप सिद्धांत में क्या सराहते हैं, बल्कि यह पूछती है कि रोज़मर्रा के जीवन में आप किन गुणों को पोषित कर रहे हैं।',
    ),
    teachingBeat: copy(
      'Fearlessness, honesty, restraint, compassion, and humility liberate. Arrogance, cruelty, and intoxicated ego bind and harm.',
      'निर्भयता, सत्यनिष्ठा, संयम, करुणा और विनम्रता मुक्त करते हैं। अहंकार, कठोरता और मदांध स्वभाव बाँधते और हानि पहुँचाते हैं।',
    ),
    livingBeat: copy(
      'Ask not only what you believe, but what your habits are rehearsing into your character.',
      'यह भी पूछिए कि आप क्या मानते हैं, और यह भी कि आपकी आदतें आपके चरित्र में क्या दोहराती जा रही हैं।',
    ),
    verses: [1, 21, 24],
    artworkKey: 'ethics-flame',
    motionPreset: 'city-spark',
    glossary: [
      {
        term: 'Daivi Sampad',
        definition: copy(
          'Divine qualities that support liberation and trustworthiness.',
          'दैवी गुण जो मुक्ति और विश्वसनीयता को सहारा देते हैं।',
        ),
      },
    ],
  },
  17: {
    summary: copy(
      'Faith, food, speech, austerity, and worship are interpreted through the lens of the three gunas.',
      'श्रद्धा, आहार, वाणी, तप और उपासना को तीन गुणों के आलोक में समझाया गया है।',
    ),
    storyBeat: copy(
      'Krishna shows that spirituality is not only in grand declarations. It hides in patterns of speech, taste, discipline, and devotion.',
      'कृष्ण दिखाते हैं कि आध्यात्मिकता केवल बड़े कथनों में नहीं होती। वह वाणी, स्वाद, अनुशासन और उपासना के पैटर्न में भी छिपी रहती है।',
    ),
    teachingBeat: copy(
      'What and how we consume, say, and practice slowly shapes the quality of our inner life.',
      'हम क्या ग्रहण करते हैं, कैसे बोलते हैं और कैसी साधना करते हैं, इससे धीरे-धीरे हमारे भीतरी जीवन की गुणवत्ता बनती है।',
    ),
    livingBeat: copy(
      'Tiny disciplines are not trivial. They quietly build the direction of the heart.',
      'छोटी अनुशासनाएँ तुच्छ नहीं होतीं। वे चुपचाप हृदय की दिशा निर्मित करती हैं।',
    ),
    verses: [3, 15, 28],
    artworkKey: 'discipline-lamp',
    motionPreset: 'lotus-rise',
    glossary: [
      {
        term: 'Shraddha',
        definition: copy(
          'Faith as inward orientation and trust, not mere opinion.',
          'श्रद्धा केवल मत नहीं, बल्कि भीतर की दिशा और विश्वास है।',
        ),
      },
    ],
  },
  18: {
    summary: copy(
      'The grand synthesis of the Gita: action, knowledge, devotion, discernment, duty, and surrender are woven together into a final call to clarity.',
      'गीता का महान समन्वय: कर्म, ज्ञान, भक्ति, विवेक, स्वधर्म और समर्पण एक अंतिम स्पष्ट आह्वान में गुँथ जाते हैं।',
    ),
    storyBeat: copy(
      'Everything returns here. The conversation gathers all previous strands and offers Arjuna not a single trick, but a fully integrated way of living.',
      'सब कुछ यहाँ लौट आता है। संवाद पूर्व के सभी सूत्रों को समेटकर अर्जुन को कोई एक उपाय नहीं, बल्कि जीवन का समन्वित मार्ग देता है।',
    ),
    teachingBeat: copy(
      'The Gita ends by honoring responsibility and freedom together. Krishna instructs deeply, then returns agency to Arjuna.',
      'गीता जिम्मेदारी और स्वतंत्रता दोनों को साथ रखकर समाप्त होती है। कृष्ण गहन उपदेश देते हैं, फिर निर्णय की शक्ति अर्जुन को लौटा देते हैं।',
    ),
    livingBeat: copy(
      'Receive guidance fully, then choose with awakened clarity. That is the dignity of the mature spiritual life.',
      'मार्गदर्शन को पूर्ण रूप से ग्रहण कीजिए, फिर जागी हुई स्पष्टता के साथ चुनाव कीजिए। यही परिपक्व आध्यात्मिक जीवन की गरिमा है।',
    ),
    verses: [63, 66, 73],
    artworkKey: 'liberation-dawn',
    motionPreset: 'battle-breeze',
    glossary: [
      {
        term: 'Sharanagati',
        definition: copy(
          'Surrender as trusting alignment with the highest, not passive collapse.',
          'शरणागति: परम के साथ विश्वासपूर्ण संरेखण, न कि निष्क्रिय पराजय।',
        ),
      },
    ],
  },
};

function buildChapterEpisode(chapter: CanonicalChapter): StoryEpisode {
  const notes = CHAPTER_NOTES[chapter.chapterNumber];
  const episodeId = `gita-chapter-${chapter.chapterNumber}`;
  const verseAnchors = notes.verses.map((verseNumber, index) =>
    verseLabel(
      index === 0 ? 'Opening verse' : index === 1 ? 'Teaching verse' : 'Closing verse',
      index === 0 ? 'आरंभिक श्लोक' : index === 1 ? 'मुख्य उपदेश श्लोक' : 'समापन श्लोक',
      chapter.chapterNumber,
      verseNumber,
    ),
  );

  return {
    id: episodeId,
    arc: 'kurukshetra',
    order: 100 + chapter.chapterNumber,
    chapterNumber: chapter.chapterNumber,
    ageBand: 'Guide, friend, and revealer',
    durationMinutes: 5,
    sourceType: 'canonical-companion',
    title: copy(
      `Chapter ${chapter.chapterNumber}: ${chapter.englishTitle}`,
      `अध्याय ${chapter.chapterNumber}: ${chapter.sanskritTitle}`,
    ),
    subtitle: copy(chapter.summary, notes.summary.hi),
    summary: notes.summary,
    sourceLabel: SOURCE_CANONICAL,
    artworkKey: notes.artworkKey,
    motionPreset: notes.motionPreset,
    focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'krishna-kurukshetra-charioteer', 'arjuna-listener'],
    scenes: [
      {
        id: `${episodeId}-scene-1`,
        eyebrow: copy(`Chapter ${chapter.chapterNumber}`, `अध्याय ${chapter.chapterNumber}`),
        title: copy('The chapter opens', 'अध्याय खुलता है'),
        caption: copy(
          'A story bridge into the chapter’s emotional landscape.',
          'अध्याय की भावभूमि में प्रवेश कराने वाला कथा-सेतु।',
        ),
        narration: notes.storyBeat,
        deeperMeaning: notes.summary,
        reflectionPrompt: copy(
          'What emotion is this chapter asking you to face honestly?',
          'यह अध्याय आपसे किस भाव को ईमानदारी से देखने के लिए कह रहा है?',
        ),
        artworkKey: notes.artworkKey,
        motionPreset: notes.motionPreset,
        ambientAudio: 'Story narration with chapter atmosphere',
        verseAnchors: [verseAnchors[0]],
        glossary: notes.glossary,
        focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'arjuna-listener'],
      },
      {
        id: `${episodeId}-scene-2`,
        eyebrow: copy('Core teaching', 'मुख्य शिक्षा'),
        title: copy('What Krishna is clarifying', 'कृष्ण क्या स्पष्ट कर रहे हैं'),
        caption: copy(
          'This layer summarizes the chapter before you return to the verses themselves.',
          'यह परत अध्याय का सार देती है, फिर आपको श्लोकों की ओर वापस भेजती है।',
        ),
        narration: notes.teachingBeat,
        deeperMeaning: copy(
          `${notes.summary.en} ${notes.teachingBeat.en}`,
          `${notes.summary.hi} ${notes.teachingBeat.hi}`,
        ),
        reflectionPrompt: copy(
          'Which idea in this chapter feels most necessary for your current season of life?',
          'इस अध्याय की कौन-सी बात आपके वर्तमान जीवन-काल के लिए सबसे आवश्यक लगती है?',
        ),
        artworkKey: notes.artworkKey,
        motionPreset: notes.motionPreset,
        ambientAudio: 'Soft narration with contemplative pulse',
        verseAnchors: [verseAnchors[1]],
        glossary: notes.glossary,
        focusCharacterStateIds: ['krishna-kurukshetra-charioteer', 'arjuna-listener'],
      },
      {
        id: `${episodeId}-scene-3`,
        eyebrow: copy('Carry it home', 'इसे जीवन में ले जाइए'),
        title: copy('Why it still matters', 'यह आज भी क्यों महत्त्वपूर्ण है'),
        caption: copy(
          'A child can hear a story here. An elder can hear a life practice.',
          'यहाँ बच्चा कहानी सुन सकता है, और बुज़ुर्ग जीवन-साधना की आवाज़।',
        ),
        narration: notes.livingBeat,
        deeperMeaning: copy(
          `${notes.livingBeat.en} Open the linked verses for the exact textual layer.`,
          `${notes.livingBeat.hi} प्रमाणित पाठ के लिए जुड़े हुए श्लोक अवश्य खोलिए।`,
        ),
        reflectionPrompt: copy(
          'What is one small practice this chapter invites today?',
          'आज यह अध्याय आपको कौन-सी एक छोटी साधना के लिए बुला रहा है?',
        ),
        artworkKey: notes.artworkKey,
        motionPreset: notes.motionPreset,
        ambientAudio: 'Closing narration with dawn wind',
        verseAnchors: [verseAnchors[2]],
        glossary: notes.glossary,
        focusCharacterStateIds: ['kanu-kurukshetra-radiance', 'krishna-kurukshetra-charioteer'],
      },
    ],
  };
}

const CHAPTER_EPISODES = GITA_CHAPTERS.map((chapter) => buildChapterEpisode(chapter));

export const KANU_STORY_EPISODES: StoryEpisode[] = [...MANUAL_EPISODES, ...CHAPTER_EPISODES].sort(
  (left, right) => left.order - right.order,
);

export function getKanuStoryEpisode(episodeId: string) {
  return KANU_STORY_EPISODES.find((episode) => episode.id === episodeId);
}

export function getKanuStoryEpisodesByArc(arcId: StoryArcId) {
  return KANU_STORY_EPISODES.filter((episode) => episode.arc === arcId);
}

export function getKanuStoryArc(arcId: StoryArcId) {
  return KANU_STORY_ARCS.find((arc) => arc.id === arcId);
}

export function getKanuStoryNeighbors(episodeId: string) {
  const index = KANU_STORY_EPISODES.findIndex((episode) => episode.id === episodeId);
  if (index === -1) {
    return { previous: undefined, next: undefined };
  }

  return {
    previous: index > 0 ? KANU_STORY_EPISODES[index - 1] : undefined,
    next: index < KANU_STORY_EPISODES.length - 1 ? KANU_STORY_EPISODES[index + 1] : undefined,
  };
}

export function getKanuStoryCharacterStates(ids: string[]) {
  return ids
    .map((id) => KANU_CHARACTER_STATES.find((state) => state.id === id))
    .filter((state): state is StoryCharacterAgeState => !!state);
}

export function getKanuStoryFeaturedEpisodes() {
  return KANU_STORY_ARCS.map((arc) => getKanuStoryEpisode(arc.featuredEpisodeId)).filter(
    (episode): episode is StoryEpisode => !!episode,
  );
}

export function getKanuStoryChapterEpisodes() {
  return KANU_STORY_EPISODES.filter((episode) => typeof episode.chapterNumber === 'number');
}

export function getKanuStoryHref(standalone = false) {
  return getGitaStoryHref(standalone);
}

export function getKanuStoryEpisodeRuntimeHref(episodeId: string, standalone = false) {
  return getGitaStoryEpisodeHref(episodeId, standalone);
}
