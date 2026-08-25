import { PATHSHALA_SECTION_DETAILS } from '@/lib/library-content-summary';

export type PublicSourceDisclosure = {
  sectionId: string;
  scope: string;
  sources: string[];
  rightsLabel: 'Public-domain edition';
};

export function getPublicSourceDisclosures(): PublicSourceDisclosure[] {
  return PATHSHALA_SECTION_DETAILS.flatMap((section) => {
    const explicitlyPublicDomain = section.liveScope.toLowerCase().includes('public-domain')
      || section.sourceTargets.some((source) => source.toLowerCase().includes('public-domain'));
    if (section.corpusState !== 'Complete local text live' || !explicitlyPublicDomain) return [];
    return [{
      sectionId: section.sectionId,
      scope: section.liveScope,
      sources: section.sourceTargets.filter((source) => !/future|rights-cleared/i.test(source)),
      rightsLabel: 'Public-domain edition' as const,
    }];
  });
}

