import { getPublishableFestivalContent, resolveFestivalList, resolveFestivalText } from '@/lib/festival-data';
import { getCanonicalVratData, type VratData } from '@/lib/vrat-data';

const BASE_URL = 'https://www.shoonaya.com';

function listSection(label: string, values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return [`### ${label}`, ...values.map(value => `- ${value}`), ''];
}

function vratSection(vrat: VratData): string {
  return [
    `## ${vrat.name}`,
    '',
    `Canonical URL: ${BASE_URL}/vrat/${vrat.id}`,
    '',
    vrat.tagline,
    '',
    '### Significance',
    vrat.significance,
    '',
    '### Practice',
    vrat.practice,
    '',
    ...(vrat.fastingType ? [`- Fasting type: ${vrat.fastingType}`] : []),
    ...(vrat.breakFastTime ? [`- Parana guidance: ${vrat.breakFastTime}`] : []),
    ...(vrat.mantra ? [`- Mantra: ${vrat.mantra}`] : []),
    '',
    ...listSection('Recommended observances', vrat.dos),
    ...listSection('Things to avoid', vrat.donts),
    ...listSection('Puja items', vrat.pujaItems),
  ].join('\n').trim();
}

function festivalSections(): string[] {
  return getPublishableFestivalContent().map(festival => {
    const name = resolveFestivalText(festival.name);
    const rituals = resolveFestivalList(festival.rituals);
    const dos = resolveFestivalList(festival.dos);
    const donts = resolveFestivalList(festival.donts);
    const pujaItems = resolveFestivalList(festival.pujaItems);

    return [
      `## ${name}`,
      '',
      `Canonical URL: ${BASE_URL}/festival/${festival.definitionKey}`,
      '',
      resolveFestivalText(festival.tagline),
      '',
      '### Significance',
      resolveFestivalText(festival.significance),
      '',
      ...listSection('Rituals', rituals),
      ...listSection('Recommended observances', dos),
      ...listSection('Things to avoid', donts),
      ...listSection('Puja items', pujaItems),
    ].join('\n').trim();
  });
}

export function buildLlmsFull(indexContent: string): string {
  const vrats = getCanonicalVratData()
    .filter((vrat, index, all) => all.findIndex(candidate => candidate.id === vrat.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(vratSection);
  const festivals = festivalSections();

  return [
    indexContent.trim(),
    '',
    '# Expanded public guides',
    '',
    '> This generated file contains only content already exposed on public Shoonaya pages. Festival narratives that have not cleared Shoonaya\'s editorial publication gate are excluded.',
    '',
    '# Vrat and observance guides',
    '',
    ...vrats.flatMap(section => [section, '']),
    ...(festivals.length > 0 ? ['# Published festival guides', '', ...festivals.flatMap(section => [section, ''])] : []),
  ].join('\n').trimEnd() + '\n';
}
