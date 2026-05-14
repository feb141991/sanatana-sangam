export type TermsRegion = 'global' | 'india' | 'uk' | 'usa';

export interface TermsSection {
  title: string;
  summary: string;
  content: string[];
}

export interface RegionalAppendix {
  region: TermsRegion;
  label: string;
  sections: TermsSection[];
}

export const TERMS_DATA: { global: TermsSection[]; appendices: RegionalAppendix[] } = {
  global: [
    {
      title: 'Community & Respect',
      summary: 'Shoonaya is a sacred space. Treat it as such.',
      content: [
        'By using Shoonaya, you agree to engage with others respectfully. Harassment, hate speech, and intentional harm are strictly prohibited.',
        'Users are encouraged to share reflections and community insights that build up the collective wisdom of the platform.',
      ]
    },
    {
      title: 'Your Content & Wisdom',
      summary: 'You own what you post, but give us permission to show it.',
      content: [
        'You retain ownership of any text, images, or media you upload to Shoonaya.',
        'By posting, you grant Shoonaya a non-exclusive, worldwide license to host and display your content to other users in accordance with your privacy settings.',
      ]
    },
    {
      title: 'AI & Spiritual Insights',
      summary: 'Our AI (Dharm Veer) is a companion, not a final authority.',
      content: [
        'Shoonaya utilizes AI to help interpret and explore sacred texts. While we strive for accuracy, AI-generated content may contain errors.',
        'AI insights should not be taken as professional, medical, or final spiritual advice. Always cross-reference with traditional sources and gurus.',
        'All AI-generated content is clearly labeled as such to ensure transparency.',
      ]
    },
    {
      title: 'Account Security',
      summary: 'Keep your sanctuary safe.',
      content: [
        'You are responsible for maintaining the confidentiality of your login credentials.',
        'Shoonaya reserves the right to suspend accounts that show signs of unauthorized access or malicious activity.',
      ]
    }
  ],
  appendices: [
    {
      region: 'india',
      label: 'India',
      sections: [
        {
          title: 'Grievance Redressal',
          summary: 'Mandatory contact point for Indian users.',
          content: [
            'In accordance with the Information Technology Rules, we have appointed a Grievance Officer.',
            'Name: Nitya Sharma',
            'Email: grievance@shoonaya.app',
            'Timeline: We acknowledge complaints within 24 hours and resolve them within 15 days (or 36 hours for urgent content takedown requests).',
          ]
        },
        {
          title: 'IT Rules Compliance',
          summary: 'Adherence to local digital laws.',
          content: [
            'Shoonaya complies with the IT (Intermediary Guidelines) Rules. We perform 3-hour takedowns upon valid government orders for prohibited content.',
          ]
        }
      ]
    },
    {
      region: 'uk',
      label: 'UK & Europe',
      sections: [
        {
          title: 'Consumer Rights',
          summary: '14-day cooling-off period.',
          content: [
            'For digital subscriptions, UK and EU residents have a 14-day "cooling-off" period to cancel and receive a full refund, provided the service has not been fully utilized.',
            'Cancellations are simplified: you can cancel your subscription as easily as you joined, with a single click in your settings.',
          ]
        },
        {
          title: 'Online Safety',
          summary: 'Protection for younger seekers.',
          content: [
            'Shoonaya implements age assurance measures to protect children from age-inappropriate content as required by the UK Online Safety Act.',
          ]
        }
      ]
    },
    {
      region: 'usa',
      label: 'United States',
      sections: [
        {
          title: 'Privacy Rights (CCPA/CPRA)',
          summary: 'Control over your data.',
          content: [
            'California residents have the right to request access to, deletion of, and the "opting-out" of the sale of their personal information.',
            'Shoonaya does not sell your personal data to third parties.',
          ]
        },
        {
          title: 'COPPA Compliance',
          summary: 'Children under 13.',
          content: [
            'Shoonaya is not directed at children under the age of 13. We do not knowingly collect information from children in the USA without parental consent.',
          ]
        }
      ]
    }
  ]
};
