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
        'Shoonaya collects account information such as your email address, authentication identifier, display name, username, profile photo, and language preferences.',
        'Your profile may include sensitive spiritual or personal context you choose to provide, including tradition, sampradaya or path preferences, date of birth, gender context, life stage, rashi, nakshatra, onboarding goals, notification preferences, city, country, and timezone.',
        'We store practice and progress data needed to run the product, such as japa sessions, mala counts, shloka reads, quiz responses, nitya karma steps, vrat or panchang observations, sankalpa progress, Pathshala lessons, Dharm Veer responses, mood check-ins, karma, seva, streaks, relics, and saved verses.',
        'Community features may store posts, comments, replies, reactions, RSVPs, reports, blocks, Mandali membership, invite links, and public profile visibility settings.',
        'If you grant permission, Shoonaya may use foreground location to find nearby temples, local Mandali circles, Panchang context, Tirtha check-ins, and nearby seekers. We do not request background location access.',
        'If you enable notifications, we store notification preferences and device push tokens so reminders can be delivered. If you upload a profile picture or share a generated card, the image or generated file is processed only to provide that feature.',
      ]
    },
    {
      title: 'Purpose of Processing',
      summary: 'Personalizing your sacred experience.',
      content: [
        'We use your data to personalize the Sacred Library, provide tradition-specific reminders, and facilitate Mandali (community) connections.',
        'We use practice history to calculate progress, streaks, seva, karma, completion cards, insights, and recommendations inside Shoonaya.',
        'Location data is used to find nearby temples, local community circles, observance timing, and check-ins, but only if you explicitly grant permission or enter a location yourself.',
        'Mood and reflection data is used to save your check-ins, show personal insights, and recommend relevant practices.',
        'AI-supported features may process the prompts, messages, names, or reflection text you submit so we can generate responses, explanations, recommendations, or name-story content. Please avoid entering information you do not want processed for these features.',
        'Analytics and diagnostics are used to understand aggregate usage, improve reliability, measure performance, and fix errors. We design analytics events to avoid names, emails, precise locations, and other directly identifying content.',
      ]
    },
    {
      title: 'Data Sharing',
      summary: 'We do not sell your personal data.',
      content: [
        'Shoonaya does not sell your personal data to third-party advertisers.',
        'We may share data with service providers solely to operate the platform, including hosting, database, authentication, storage, analytics, diagnostics, notifications, email delivery, maps or geocoding, media links, and AI processing providers.',
        'Current service providers may include Supabase, Vercel, Expo, Firebase or Google Analytics, Google or Apple authentication services, YouTube for external live-darshan links, and AI infrastructure used by Shoonaya features.',
        'Community content you choose to post may be visible to other users according to the feature and privacy setting used. Profile photos, names, usernames, Mandali posts, comments, and public share links may be shown to others when you choose those surfaces.',
      ]
    },
    {
      title: 'Security Measures',
      summary: 'Protecting your digital sanctuary.',
      content: [
        'We use industry-standard encryption and security protocols to protect your personal information.',
        'All data is stored in secure, audited cloud environments.',
      ]
    },
    {
      title: 'Your Choices and Controls',
      summary: 'You can access, export, update, or delete your data.',
      content: [
        'You can update profile details, notification preferences, language preferences, theme settings, and profile photo choices from within the app.',
        'You can download an export of your account data from Settings. You can also request deletion of specific data types by contacting support.',
        'Full account deletion uses a 30-day cancellable cool-off period. During that window, your account is marked for deletion and you may cancel the request. After the period ends, Shoonaya may permanently delete the account and associated data according to the deletion workflow.',
        'Some records may be retained where required for security, legal compliance, fraud prevention, abuse reporting, audit logs, or backup integrity, and then removed or anonymized when no longer needed.',
      ]
    },
    {
      title: 'Children and Sensitive Data',
      summary: 'Shoonaya is intended for mature spiritual use.',
      content: [
        'Shoonaya is not directed to children under 13. If you believe a child has provided personal data without appropriate consent, contact us so we can review and remove it.',
        'Religious, spiritual, astrological, and mood-related data can be sensitive. You control whether to provide optional profile details such as date of birth, rashi, nakshatra, goals, and reflections. Some core personalization requires tradition and language settings.',
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
