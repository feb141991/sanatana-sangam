export interface KanuStoryShowcaseCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  alt: string;
}

export const KANU_STORY_SHOWCASE: KanuStoryShowcaseCard[] = [
  {
    id: 'face-anchor',
    title: 'Face Anchor',
    subtitle: 'Prompt 2 winner',
    description:
      'This is the strongest face direction so far: bright eyes, cheek softness, and enough presence to feel like Bal Krishna instead of a generic mascot.',
    imageSrc: '/kanu/bal-krishna-portrait-anchor.png',
    alt: 'Bal Krishna portrait concept with warm curls, peacock feather, and gentle smile',
  },
  {
    id: 'softness-pass',
    title: 'Softness Pass',
    subtitle: 'Prompt 1 support',
    description:
      'This image carries the emotional safety we want for children. It helps define the softness and warmth that should stay in the final face.',
    imageSrc: '/kanu/bal-krishna-portrait-softness.png',
    alt: 'Bal Krishna portrait concept with especially soft cheeks and childlike innocence',
  },
  {
    id: 'flute-hero',
    title: 'Flute Hero',
    subtitle: 'Prompt 5 body rhythm',
    description:
      'This is the best current full-body rhythm. The pose, cloth flow, and forest setting move closer to premium Bal Krishna hero art.',
    imageSrc: '/kanu/bal-krishna-flute-hero.png',
    alt: 'Bal Krishna full-body flute concept in a forest clearing',
  },
];

export const KANU_STORY_REVIEW_NOTES = [
  'Keep the face language from the portrait anchor and the emotional softness from the gentler portrait.',
  'Reduce crown and jewelry dominance so the face remains the first thing people remember.',
  'Move the body away from figurine or toy energy and toward graceful cinematic child movement.',
  'Use this surface to compare concept progress before we commit to 3D or animation work.',
];

export function getGitaStoryHref() {
  return '/gita-story';
}

export function getPathshalaGitaStoryHref() {
  return '/library/hindu/gita/story';
}
