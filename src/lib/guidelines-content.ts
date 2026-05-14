export interface GuidelineSection {
  title: string;
  summary: string;
  content: string[];
}

export const GUIDELINES_DATA: GuidelineSection[] = [
  {
    title: 'Lead With Respect',
    summary: 'The foundation of any sacred gathering.',
    content: [
      'Speak to others with dignity, even in disagreement. Critique ideas without attacking people or their respective traditions.',
      'Acknowledge that every seeker is at a different stage of their journey. Patience is a virtue.',
    ]
  },
  {
    title: 'No Harassment Or Hate',
    summary: 'Zero tolerance for toxicity.',
    content: [
      'Harassment, bullying, hate speech, and targeted abuse are strictly prohibited.',
      'Demeaning comparisons between different spiritual traditions or lineages (Kuls) are not permitted. Shoonaya is a space for synthesis and respect.',
    ]
  },
  {
    title: 'Sacred Privacy',
    summary: 'Protecting the sanctity of family and self.',
    content: [
      'Do not upload or expose private family information, especially about living relatives, without explicit care and consent.',
      'Respect the privacy of your Kul and Mandali groups. What is shared in a sacred circle should stay within that circle.',
    ]
  },
  {
    title: 'Truth & Authenticity',
    summary: 'Against the spread of misinformation.',
    content: [
      'Do not present unverified medical, legal, or financial advice as authoritative truth.',
      'Spiritual guidance provided through the platform (or its AI components) is intended for reflection and study, not as a replacement for professional clinical or legal help.',
    ]
  },
  {
    title: 'Honor The Sanctuary',
    summary: 'Maintaining the purpose of the space.',
    content: [
      'Shoonaya is for spiritual learning, family continuity, and community belonging. Spam, commercial solicitation, and bad-faith disruption will be moderated swiftly.',
    ]
  }
];
