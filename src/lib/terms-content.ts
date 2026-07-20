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
        'You may not post unlawful, abusive, misleading, exploitative, sexually explicit, violent, hateful, or privacy-violating content. You may not impersonate others, spam the community, scrape the service, or attempt to bypass safety controls.',
        'Users are encouraged to share reflections and community insights that build up the collective wisdom of the platform.',
        'Shoonaya may remove content, limit visibility, suspend accounts, or restrict features when needed to protect users, comply with law, or preserve community safety.',
      ]
    },
    {
      title: 'Your Content & Wisdom',
      summary: 'You own what you post, but give us permission to show it.',
      content: [
        'You retain ownership of any text, images, or media you upload to Shoonaya.',
        'By posting, uploading, saving, or sharing content through Shoonaya, you grant Shoonaya a non-exclusive, worldwide, royalty-free license to host, store, process, reproduce, display, transmit, moderate, and distribute that content only as needed to operate and improve the service.',
        'Your content may appear to other users according to the feature and privacy setting used, including Mandali posts, comments, public profiles, share cards, invite pages, reports, and community interactions.',
        'You are responsible for ensuring that you have the rights and permissions needed for anything you upload or share.',
      ]
    },
    {
      title: 'AI & Spiritual Insights',
      summary: 'AI features are companions, not final authorities.',
      content: [
        'Shoonaya uses AI-supported features to help explain sacred texts, suggest reflections, generate name-story content, summarize practice insights, and guide discovery. AI-generated content may be incomplete, outdated, or incorrect.',
        'AI insights are educational and devotional aids only. They are not professional, medical, mental-health, financial, legal, astrological, or final spiritual advice.',
        'Always cross-reference important religious, philosophical, or personal decisions with trusted traditional sources, qualified teachers, family elders, medical professionals, legal advisers, or other appropriate experts.',
        'Do not submit information to AI features that you do not want processed for that feature.',
      ]
    },
    {
      title: 'Account Security',
      summary: 'Keep your sanctuary safe.',
      content: [
        'You are responsible for maintaining the confidentiality of your login credentials.',
        'Shoonaya reserves the right to suspend accounts that show signs of unauthorized access or malicious activity.',
      ]
    },
    {
      title: 'Practice, Calendar, and Jyotish Content',
      summary: 'Sacred tools require personal discernment.',
      content: [
        'Shoonaya provides Panchang, vrat, festival, Rashiphala, Kundali, mantra, scripture, practice, and community features for education, devotion, and personal spiritual routine.',
        'Calendar, Panchang, Jyotish, and observance information may vary by region, sampradaya, family custom, temple tradition, timezone, and source. Shoonaya works to review important dates, but you should confirm locally when a date or ritual matters.',
        'Shoonaya does not guarantee spiritual outcomes, religious merit, health results, relationship outcomes, career outcomes, predictions, or astrological results.',
      ]
    },
    {
      title: 'Subscriptions, Payments, and App Stores',
      summary: 'Paid features follow the store and checkout terms used.',
      content: [
        'Core Shoonaya features may be free, while premium or supporter features may require payment where offered.',
        'If you purchase through an app store or payment provider, their payment, cancellation, refund, tax, and renewal terms may also apply.',
        'We may change, add, remove, or limit features over time. Where a paid feature is materially affected, we will handle the change in accordance with applicable law and platform rules.',
      ]
    },
    {
      title: 'Account Deletion and Data Rights',
      summary: 'Deletion is available through a verified account flow.',
      content: [
        'You may request an export of your account data and may start a full account deletion request from Settings.',
        'Full account deletion uses a 30-day cancellable cool-off period. During that period your account is marked for deletion and you may cancel the request. After the period ends, Shoonaya may permanently delete the account and associated data according to the deletion workflow.',
        'Some data may be retained where required for security, legal compliance, abuse prevention, audit logs, backup integrity, or dispute resolution.',
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
            'Shoonaya is not directed to children under 13. We may limit, remove, or moderate content and accounts where necessary to protect younger users and meet applicable online-safety duties.',
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
