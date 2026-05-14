export type PrivacyRegion = 'global' | 'india' | 'uk' | 'usa';

export interface PrivacySection {
  title: string;
  summary: string;
  content: string[];
}

export interface PrivacyAppendix {
  region: PrivacyRegion;
  label: string;
  sections: PrivacySection[];
}

export const PRIVACY_DATA: { global: PrivacySection[]; appendices: PrivacyAppendix[] } = {
  global: [
    {
      title: 'Data Collection',
      summary: 'We collect only what we need for your spiritual journey.',
      content: [
        'Shoonaya collects account information (email, name), profile details (tradition, language), and community activity (posts, reflections).',
        'We also store family lineage data and sacred practice history if you choose to use those features.',
      ]
    },
    {
      title: 'Purpose of Processing',
      summary: 'Personalizing your sacred experience.',
      content: [
        'We use your data to personalize the Sacred Library, provide tradition-specific reminders, and facilitate Mandali (community) connections.',
        'Location data is used to find nearby temples and local community circles, but only if you explicitly grant permission.',
      ]
    },
    {
      title: 'Data Sharing',
      summary: 'Your soul is not for sale.',
      content: [
        'Shoonaya does not sell your personal data to third-party advertisers.',
        'We may share data with service providers (like Supabase for database hosting or Vercel for app delivery) solely to operate the platform.',
      ]
    },
    {
      title: 'Security Measures',
      summary: 'Protecting your digital sanctuary.',
      content: [
        'We use industry-standard encryption and security protocols to protect your personal information.',
        'All data is stored in secure, audited cloud environments.',
      ]
    }
  ],
  appendices: [
    {
      region: 'india',
      label: 'India',
      sections: [
        {
          title: 'DPDP Act Compliance',
          summary: 'Your rights under the new Digital Personal Data Protection Act.',
          content: [
            'Shoonaya acts as a Data Fiduciary. You have the right to withdraw consent at any time.',
            'You may appoint a Consent Manager to manage your privacy settings on your behalf.',
            'For any grievances, please contact our Grievance Officer at privacy@shoonaya.app.',
          ]
        }
      ]
    },
    {
      region: 'uk',
      label: 'UK & Europe',
      sections: [
        {
          title: 'GDPR Rights',
          summary: 'Access, Portability, and the "Right to be Forgotten".',
          content: [
            'Under the UK/EU GDPR, you have the right to request a copy of your data, correct inaccuracies, and request the deletion of your personal information.',
            'You also have the right to object to certain types of processing or request that your data be moved to another service.',
          ]
        },
        {
          title: 'Data Protection Officer',
          summary: 'Direct contact for privacy concerns.',
          content: [
            'You can reach our Data Protection Representative for UK/EU at dpo@shoonaya.app.',
          ]
        }
      ]
    },
    {
      region: 'usa',
      label: 'United States',
      sections: [
        {
          title: 'California (CCPA/CPRA)',
          summary: 'Enhanced transparency for California residents.',
          content: [
            'California residents have specific rights regarding the "sale" and "sharing" of data. Shoonaya does not engage in the sale of personal information.',
            'You can request a report of the categories of data we collect and the specific pieces of information we hold.',
          ]
        }
      ]
    }
  ]
};
