import type { GeoModel, GeoQA, GeoFact } from './geo-model';
import type { VratData } from '@/lib/vrat-data';
import type { Katha } from '@/lib/katha-library';
import type { Stotram } from '@/lib/stotrams';
// Assuming Pathshala data can be passed as a generic type or any if specific types aren't strictly exported.
// We'll use an intersection for Pathshala to keep it generic enough if the type is complex.

export function extractVratGeo(vrat: VratData): GeoModel {
  const facts: GeoFact[] = [];
  if (vrat.fastingType) facts.push({ label: 'Fasting Type', value: vrat.fastingType });
  if (vrat.breakFastTime) facts.push({ label: 'Parana (Break Fast)', value: vrat.breakFastTime });
  if (vrat.pujaItems && vrat.pujaItems.length > 0) {
    facts.push({ label: 'Puja Items', value: vrat.pujaItems.join(', ') });
  }

  const qa: GeoQA[] = [];
  if (vrat.significance) {
    qa.push({
      question: `What is the significance of ${vrat.name}?`,
      answer: vrat.significance
    });
  }
  if (vrat.practice) {
    qa.push({
      question: `How is ${vrat.name} practiced?`,
      answer: vrat.practice
    });
  }
  if (vrat.dos && vrat.dos.length > 0) {
    qa.push({
      question: `What should be done during ${vrat.name}?`,
      answer: vrat.dos.join(', ')
    });
  }
  if (vrat.donts && vrat.donts.length > 0) {
    qa.push({
      question: `What should be avoided during ${vrat.name}?`,
      answer: vrat.donts.join(', ')
    });
  }

  return {
    title: vrat.name,
    summary: vrat.tagline,
    provenance: 'Hindu Tradition',
    facts,
    qa,
    relatedLinks: [],
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
    qa.push({
      question: `What is the spiritual benefit (Phal) of reading the ${katha.title}?`,
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
