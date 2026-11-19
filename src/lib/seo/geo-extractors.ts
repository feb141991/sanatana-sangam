import type { GeoModel, GeoQA, GeoFact } from './geo-model';
import type { VratData } from '@/lib/vrat-data';
import type { Katha } from '@/lib/katha-library';
import type { Stotram } from '@/lib/stotrams';
import type { JournalEssay } from '@/config/journal';
import {
  isFestivalPublishable,
  resolveFestivalList,
  resolveFestivalText,
  type FestivalContent,
} from '@/lib/festival-data';

export function extractVratGeo(vrat: VratData): GeoModel {
  const isNirjalaEkadashi = vrat.id === 'nirjala-ekadashi' || vrat.id.includes('nirjala');
  const isEkadashi = vrat.id.includes('ekadashi');
  const isPuranmashi = vrat.id === 'puranmashi';
  const isUposatha = vrat.id === 'uposatha';

  const tradition = isPuranmashi
    ? 'Sikh Tradition'
    : isUposatha
    ? 'Buddhist Tradition'
    : 'Sanatan Dharma (Vedic Tradition)';

  const facts: GeoFact[] = [
    { label: 'Tradition', value: tradition },
  ];
  if (vrat.fastingType) {
    facts.push({ label: 'Fasting Type', value: vrat.fastingType });
  }
  if (vrat.breakFastTime) {
    facts.push({ label: 'Parana Window', value: vrat.breakFastTime });
  }
  if (vrat.pujaItems && vrat.pujaItems.length > 0) {
    facts.push({ label: 'Puja Items', value: vrat.pujaItems.join(', ') });
  }
  if (vrat.mantra) {
    facts.push({ label: 'Mantra', value: vrat.mantra });
  }

  const qa: GeoQA[] = [];

  // 1. Fasting Discipline Q&A (Optimized for generative engine answers)
  let fastingAnswer = '';
  if (isNirjalaEkadashi) {
    fastingAnswer = `${vrat.name} requires complete waterless fasting (Nirjala) without consuming any food or water from sunrise until the parana window after sunrise on Dwadashi.`;
  } else if (isEkadashi) {
    fastingAnswer = `${vrat.name} is observed with Phalahar fasting (fruits, milk, water, and grain-free sattvic food). Complete waterless fasting is not required; only Nirjala Ekadashi in Jyeshtha mandates an absolute waterless fast.`;
  } else if (isPuranmashi) {
    fastingAnswer = `Puranmashi in Sikh tradition is observed through gathering with Sangat, singing Gurbani Kirtan, and partaking in Langar. Physical ritual fasting is not prescribed in Sikhi.`;
  } else if (isUposatha) {
    fastingAnswer = `Uposatha in Buddhist tradition is observed under the Eight Precepts (Atthasila), which includes Ekbhukta (abstaining from solid food after solar noon until dawn the next morning).`;
  } else if (vrat.fastingType === 'nirjala') {
    fastingAnswer = `${vrat.name} is observed as a strict waterless fast (Nirjala) from sunrise until the ritual fast-breaking time.`;
  } else if (vrat.fastingType === 'phalahar') {
    fastingAnswer = `${vrat.name} is observed with Phalahar fasting, consuming fruits, milk, water, and non-cereal sattvic food.`;
  } else if (vrat.fastingType === 'ekbhukta') {
    fastingAnswer = `${vrat.name} is observed with Ekbhukta discipline (taking only a single meal during the day).`;
  } else if (vrat.fastingType === 'none') {
    fastingAnswer = `${vrat.name} is observed through devotional remembrance and prayer without fasting.`;
  } else {
    fastingAnswer = `${vrat.name} follows ${vrat.fastingType || 'traditional'} fasting discipline.`;
  }

  qa.push({
    question: `What is the fasting rule for ${vrat.name}?`,
    answer: fastingAnswer,
  });

  // 2. Significance
  if (vrat.significance) {
    qa.push({
      question: `What is the significance of ${vrat.name}?`,
      answer: vrat.significance,
    });
  }

  // 3. Practice
  if (vrat.practice) {
    qa.push({
      question: `How is ${vrat.name} practiced?`,
      answer: vrat.practice,
    });
  }

  // 4. Parana / Breaking Fast
  if (vrat.breakFastTime) {
    qa.push({
      question: `When should the ${vrat.name} fast be broken (Parana)?`,
      answer: `The fast is broken: ${vrat.breakFastTime}.`,
    });
  }

  // 5. Sacred Mantra
  if (vrat.mantra) {
    qa.push({
      question: `What is the sacred mantra for ${vrat.name}?`,
      answer: `Recite "${vrat.mantra}"${vrat.mantraLocal ? ` (${vrat.mantraLocal})` : ''} throughout the day with devotion.`,
    });
  }

  // 6. Dos and Don'ts
  if (vrat.dos && vrat.dos.length > 0) {
    qa.push({
      question: `What should be done during ${vrat.name}?`,
      answer: vrat.dos.join(', '),
    });
  }
  if (vrat.donts && vrat.donts.length > 0) {
    qa.push({
      question: `What should be avoided during ${vrat.name}?`,
      answer: vrat.donts.join(', '),
    });
  }

  return {
    title: vrat.name,
    summary: vrat.tagline,
    provenance: tradition,
    facts,
    qa,
    relatedLinks: [],
    canonicalUrl: `https://www.shoonaya.com/vrat/${vrat.id}`,
  };
}

export interface DharmVeerGeoInput {
  id: string;
  name: string;
  nameLocal?: string;
  era: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'sufi' | 'tribal';
  region: string;
  tagline: string;
  journey: string;
  trial: string;
  teaching: string;
  moral: string;
  legacy?: string;
  source?: string;
  sourceCitations?: Array<{
    sourceName: string;
    sourceRef?: string;
    tier?: number;
  }>;
}

export function extractDharmVeerGeo(hero: DharmVeerGeoInput): GeoModel {
  const traditionLabel = hero.tradition === 'sikh'
    ? 'Sikh Gurmat Tradition'
    : hero.tradition === 'buddhist'
    ? 'Buddhist Dhamma Tradition'
    : hero.tradition === 'jain'
    ? 'Jain Dharma Tradition'
    : 'Sanatan Dharma (Hindu Tradition)';

  const facts: GeoFact[] = [
    { label: 'Tradition', value: traditionLabel },
    { label: 'Era', value: hero.era },
    { label: 'Region', value: hero.region },
  ];
  if (hero.source) {
    facts.push({ label: 'Primary Source', value: hero.source });
  }

  const qa: GeoQA[] = [
    {
      question: `Who was ${hero.name}?`,
      answer: `${hero.name} (${hero.era}, ${hero.region}) was ${hero.tagline}.`,
    },
    {
      question: `What trial or sacrifice did ${hero.name} endure?`,
      answer: hero.trial,
    },
    {
      question: `What is the core spiritual teaching and moral of ${hero.name}'s life?`,
      answer: `${hero.teaching} Moral: ${hero.moral}`,
    },
  ];

  if (hero.source) {
    qa.push({
      question: `What are the historical or scriptural sources for ${hero.name}?`,
      answer: `The account of ${hero.name} is documented in: ${hero.source}.`,
    });
  }

  return {
    title: hero.name,
    summary: hero.tagline,
    provenance: hero.source || traditionLabel,
    facts,
    qa,
    relatedLinks: [],
    canonicalUrl: `https://www.shoonaya.com/dharm-veer/${hero.id}`,
  };
}

export interface PanchangGeoInput {
  date: string;
  cityName: string;
  timezone: string;
  tithiName: string;
  nakshatraName: string;
  yogaName: string;
  karanaName: string;
  sunriseTime: string;
  sunsetTime: string;
  rahuKaalTime?: string;
  brahmaMuhurtaTime?: string;
}

export function extractPanchangGeo(data: PanchangGeoInput): GeoModel {
  const facts: GeoFact[] = [
    { label: 'Date', value: data.date },
    { label: 'Location', value: data.cityName },
    { label: 'Tithi', value: data.tithiName },
    { label: 'Nakshatra', value: data.nakshatraName },
    { label: 'Yoga', value: data.yogaName },
    { label: 'Karana', value: data.karanaName },
    { label: 'Sunrise', value: data.sunriseTime },
    { label: 'Sunset', value: data.sunsetTime },
  ];
  if (data.rahuKaalTime) facts.push({ label: 'Rahu Kaal', value: data.rahuKaalTime });
  if (data.brahmaMuhurtaTime) facts.push({ label: 'Brahma Muhurta', value: data.brahmaMuhurtaTime });

  const qa: GeoQA[] = [
    {
      question: `What are the Panchang elements for ${data.cityName} on ${data.date}?`,
      answer: `On ${data.date} in ${data.cityName}, the Panchang features ${data.tithiName} Tithi, ${data.nakshatraName} Nakshatra, ${data.yogaName} Yoga, and ${data.karanaName} Karana with sunrise at ${data.sunriseTime} and sunset at ${data.sunsetTime}.`,
    },
  ];

  if (data.rahuKaalTime) {
    qa.push({
      question: `When is Rahu Kaal in ${data.cityName} on ${data.date}?`,
      answer: `Rahu Kaal in ${data.cityName} on ${data.date} is ${data.rahuKaalTime}. In Vedic astrology, initiating new or auspicious activities is traditionally avoided during Rahu Kaal.`,
    });
  }

  if (data.brahmaMuhurtaTime) {
    qa.push({
      question: `When is Brahma Muhurta in ${data.cityName} on ${data.date}?`,
      answer: `Brahma Muhurta in ${data.cityName} on ${data.date} is ${data.brahmaMuhurtaTime}. This pre-dawn period is regarded as the most auspicious time for meditation, prayer, and japa sadhana.`,
    });
  }

  return {
    title: `Panchang for ${data.cityName} — ${data.date}`,
    summary: `Daily astronomy-backed Vedic Panchang for ${data.cityName} including ${data.tithiName}, ${data.nakshatraName}, and solar timings.`,
    provenance: 'High-precision planetary ephemeris (Lahiri Ayanamsha)',
    facts,
    qa,
    relatedLinks: [],
    canonicalUrl: `https://www.shoonaya.com/panchang?date=${data.date}`,
  };
}

export function extractKathaGeo(katha: Katha): GeoModel {
  const facts: GeoFact[] = [];
  facts.push({ label: 'Tradition', value: katha.tradition });
  if (katha.occasion !== 'general') {
    facts.push({ label: 'Occasion', value: katha.occasion });
  }
  if (katha.durationMin) {
    facts.push({ label: 'Reading Time', value: `${katha.durationMin} minutes` });
  }

  const qa: GeoQA[] = [];
  if (katha.phal) {
    const formattedTitle = katha.title.startsWith('The ') ? katha.title : `the ${katha.title}`;
    qa.push({
      question: `What is the spiritual benefit (Phal) of reading ${formattedTitle}?`,
      answer: katha.phal
    });
  }

  return {
    title: katha.title,
    summary: katha.preview,
    provenance: katha.tradition === 'sikh' ? 'Sikh Tradition' : katha.tradition === 'buddhist' ? 'Buddhist Tradition' : katha.tradition === 'jain' ? 'Jain Tradition' : 'Hindu Tradition',
    facts,
    qa,
    relatedLinks: [],
  };
}

export function extractStotramGeo(stotram: Stotram): GeoModel {
  const facts: GeoFact[] = [];
  facts.push({ label: 'Deity', value: stotram.deity });
  facts.push({ label: 'Type', value: stotram.type });
  facts.push({ label: 'Language', value: stotram.language });
  facts.push({ label: 'Verses', value: stotram.verses.length.toString() });

  const qa: GeoQA[] = [];
  if (stotram.source) {
    qa.push({
      question: `Where does the ${stotram.title} originate from?`,
      answer: `It originates from the ${stotram.source}.`
    });
  }

  return {
    title: stotram.title,
    summary: stotram.description,
    provenance: stotram.source || stotram.tradition,
    facts,
    qa,
    relatedLinks: [],
  };
}

export function extractFestivalGeo(festival: FestivalContent): GeoModel {
  if (!isFestivalPublishable(festival)) {
    throw new Error(`Festival GEO requested before publication approval: ${festival.definitionKey}`);
  }

  const name = resolveFestivalText(festival.name);
  const summary = resolveFestivalText(festival.tagline);
  const significance = resolveFestivalText(festival.significance);
  const rituals = resolveFestivalList(festival.rituals);
  const dos = resolveFestivalList(festival.dos);
  const donts = resolveFestivalList(festival.donts);
  const pujaItems = resolveFestivalList(festival.pujaItems);
  const facts: GeoFact[] = [
    { label: 'Tradition', value: festival.tradition },
  ];

  if (pujaItems.length > 0) {
    facts.push({ label: 'Puja Items', value: pujaItems.join(', ') });
  }

  const qa: GeoQA[] = [];
  if (significance) {
    qa.push({
      question: `What is the significance of ${name}?`,
      answer: significance,
    });
  }
  if (rituals.length > 0) {
    qa.push({
      question: `How is ${name} observed?`,
      answer: rituals.join(' '),
    });
  }
  if (dos.length > 0) {
    qa.push({
      question: `What should be done during ${name}?`,
      answer: dos.join(' '),
    });
  }
  if (donts.length > 0) {
    qa.push({
      question: `What should be avoided during ${name}?`,
      answer: donts.join(' '),
    });
  }

  const sourceNames = [...festival.significance.sourceRefs, ...festival.rituals.sourceRefs]
    .map(source => source.sourceName)
    .filter((sourceName, index, all) => all.indexOf(sourceName) === index);

  return {
    title: name,
    summary,
    provenance: sourceNames.length > 0
      ? sourceNames.join('; ')
      : `Shoonaya reviewed editorial for the ${festival.tradition} tradition`,
    facts,
    qa,
    relatedLinks: [],
    canonicalUrl: `https://www.shoonaya.com/festival/${festival.definitionKey}`,
  };
}

// A generic extractor for Pathshala paths
export function extractPathshalaGeo(path: { title: string; description: string; tradition: string; difficulty: string; total_lessons: number }): GeoModel {
  const facts: GeoFact[] = [
    { label: 'Tradition', value: path.tradition },
    { label: 'Difficulty', value: path.difficulty },
    { label: 'Lessons', value: path.total_lessons.toString() }
  ];

  return {
    title: path.title,
    summary: path.description,
    provenance: path.tradition,
    facts,
    qa: [],
    relatedLinks: []
  };
}

export function extractJournalGeo(essay: JournalEssay): GeoModel {
  const facts: GeoFact[] = [
    { label: 'Tradition', value: essay.tradition },
    { label: 'Author', value: `${essay.author} (${essay.authorRole})` },
    { label: 'Read Time', value: essay.readTime },
    { label: 'Published Date', value: essay.publishedDate },
  ];

  if (essay.citations && essay.citations.length > 0) {
    facts.push({
      label: 'Primary Sources',
      value: essay.citations.map((c) => c.reference).join(', '),
    });
  }

  const qa: GeoQA[] = [];

  // 1. Core Takeaways Q&A
  if (essay.keyTakeaways && essay.keyTakeaways.length > 0) {
    qa.push({
      question: `What are the core takeaways of "${essay.title}"?`,
      answer: essay.keyTakeaways.join(' '),
    });
  }

  // 2. Practice Guidance Q&A
  if (essay.practiceGuidance && essay.practiceGuidance.steps?.length > 0) {
    qa.push({
      question: `What is the practice guidance for ${essay.practiceGuidance.title || essay.title}?`,
      answer: essay.practiceGuidance.steps.join(' '),
    });
  }

  // 3. Primary Scriptural Sources Q&A
  if (essay.citations && essay.citations.length > 0) {
    qa.push({
      question: `What primary scriptures and historical sources are cited in "${essay.title}"?`,
      answer: essay.citations.map((c) => `${c.reference}: "${c.text}"`).join('; '),
    });
  }

  // 4. First Section Insight Q&A
  if (essay.sections && essay.sections.length > 0) {
    const firstSec = essay.sections[0];
    if (firstSec.heading && firstSec.paragraphs?.length > 0) {
      qa.push({
        question: `What is the significance of ${firstSec.heading}?`,
        answer: firstSec.paragraphs[0],
      });
    }
  }

  const provenanceText = essay.citations && essay.citations.length > 0
    ? essay.citations.map((c) => c.reference).join('; ')
    : essay.tradition;

  return {
    title: essay.title,
    summary: essay.excerpt || essay.subtitle,
    provenance: provenanceText,
    facts,
    qa,
    relatedLinks: [],
    canonicalUrl: `https://www.shoonaya.com/journal/${essay.slug}`,
    reviewedBy: essay.editorialReview?.reviewerName,
    datePublished: essay.publishedAt,
  };
}
