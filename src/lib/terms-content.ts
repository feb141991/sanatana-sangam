import { AGE_GUIDANCE_POLICY } from '@/lib/compliance/age-guidance';

/**
 * Single source of truth for the Terms version, in sync with the displayed
 * "Last Updated" date. Bump this (and the date text in TermsClient.tsx)
 * whenever the Terms content materially changes -- this is what gets
 * recorded on every acceptance receipt (src/lib/legal-acceptance.ts).
 */
export const TERMS_VERSION = '2026-07-20';

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
      title: 'Age and Parental Guidance',
      summary: 'Younger seekers should explore with a parent or guardian involved.',
      content: [...AGE_GUIDANCE_POLICY.terms],
    },
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
      title: 'Paid Services and Previous Purchases',
      summary: 'Shoonaya currently has no app subscription plans.',
      content: [
        'All features currently available in Shoonaya are free to use. Shoonaya does not currently offer paid feature tiers or app subscriptions.',
        'Any purchase or subscription made before this policy revision remains subject to the terms presented at the time of purchase and applicable law. App stores and payment providers may handle billing, cancellation, refunds, taxes, and renewals for those prior transactions.',
        'If Shoonaya introduces a paid product in the future, its price and terms will be shown before you choose to purchase it.',
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
            'Email: info@shoonaya.com',
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
          summary: 'Applicable consumer protections continue to apply.',
          content: [
            'We honor applicable statutory cancellation, refund, and consumer-protection rights for purchases, including any purchases made before Shoonaya stopped offering app subscriptions.',
            'For a prior app-store or payment-provider purchase, use the purchase channel and terms shown at checkout for billing management; contact Shoonaya if you need help finding the appropriate support route.',
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
          title: "Children's Privacy",
          summary: 'Shoonaya is not directed to children under 13.',
          content: [
            'Shoonaya is not directed at children under the age of 13. If we learn that a child under 13 has provided personal data, we will review and remove it as appropriate.',
          ]
        }
      ]
    }
  ]
};
