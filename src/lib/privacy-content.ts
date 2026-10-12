import { AGE_GUIDANCE_POLICY } from '@/lib/compliance/age-guidance';

/**
 * Single source of truth for the Privacy Policy version, in sync with the
 * displayed "Last Updated" date. Bump this (and the date text in
 * PrivacyClient.tsx) whenever the policy content materially changes -- this
 * is what gets recorded on every acceptance receipt (src/lib/legal-acceptance.ts).
 */
export const PRIVACY_VERSION = '2026-10-12';

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
        'Diagnostics and optional product measurement help us keep Shoonaya reliable and understand overall use. Both are described in "Diagnostics and Product Measurement" below.',
      ]
    },
    {
      title: 'Diagnostics and Product Measurement',
      summary: 'What the app measures, when, and how long it is kept.',
      content: [
        'App performance diagnostics: to keep the app fast and working, the Shoonaya app sends a summary roughly once an hour of how long screens take to load, whether saved data was reused, and whether requests failed or were retried. Screens are identified by internal names (for example "home" or "mandali"). The summary includes your app version and platform, and is linked to your account when you are signed in; guest summaries carry no identifier. It contains no content you read or write, no mood, location, or profile details. We use it on the basis of our legitimate interest in running a reliable service, and keep it for 30 days.',
        'Optional product measurement in the app: off unless you turn on "Share product usage data" in Settings. When on, we record at most one entry per day for each of a small, fixed set of events, such as opening the app or completing a practice, together with your app version and platform, linked to your account. We do not record screen names, spiritual content, mood, location, or profile details. Practice events (for example completing a japa session) are recorded only if you have also turned on "Tradition-aware personalization", because they can reveal religious practice. Entries are kept for 90 days.',
        'Turning product measurement off stops collection and deletes your stored entries straight away. Turning off "Tradition-aware personalization" deletes stored practice events. Deleting your account deletes both kinds of data.',
        'Our internal reports on product measurement show only daily totals, and hide any total from fewer than 20 accounts. A small number of authorised staff can access the underlying records to operate and secure the service.',
        'Website analytics: on shoonaya.com, Google Analytics and Vercel Analytics run only if you accept analytics cookies in the cookie banner. They are not used inside the app.',
      ]
    },
    {
      title: 'Google Sign-In Data',
      summary: 'Basic identity information is used only for your Shoonaya account.',
      content: [
        'If you choose Continue with Google, Shoonaya receives your Google account name, email address, profile image, and a provider authentication identifier. We use this information only to create and secure your Shoonaya account, sign you in, identify your profile, and personalize account-facing features.',
        'Shoonaya does not request access to your Gmail, Google Drive, Google Contacts, Google Calendar, or other private Google product data. We do not sell Google user data or use it for advertising.',
        'Google authentication is processed through our authentication provider, Supabase. Your use of Google sign-in is optional; email sign-up is also available.',
      ]
    },
    {
      title: 'Data Sharing',
      summary: 'We do not sell your personal data.',
      content: [
        'Shoonaya does not sell your personal data to third-party advertisers.',
        'We may share data with service providers solely to operate the platform, including hosting, database, authentication, storage, analytics, diagnostics, notifications, email delivery, maps or geocoding, media links, and AI processing providers.',
        'Current service providers may include Supabase, Vercel, Expo, Firebase Cloud Messaging (Android push delivery), Google Analytics and Vercel Analytics (website only, with cookie consent), Google or Apple authentication services, YouTube for external live-darshan links, and AI infrastructure used by Shoonaya features.',
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
        'You can download an export of your account data from Settings, including your stored product-measurement entries and app performance diagnostics. You can also request deletion of specific data types by contacting support.',
        'Full account deletion uses a 30-day cancellable cool-off period. During that window, your account is marked for deletion and you may cancel the request. After the period ends, Shoonaya may permanently delete the account and associated data according to the deletion workflow.',
        'Some records may be retained where required for security, legal compliance, fraud prevention, abuse reporting, audit logs, or backup integrity, and then removed or anonymized when no longer needed.',
      ]
    },
    {
      title: 'Children and Sensitive Data',
      summary: 'Younger seekers should use Shoonaya with a parent or guardian involved.',
      content: [
        ...AGE_GUIDANCE_POLICY.privacy,
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
            'For any grievances, please contact our Grievance Officer at info@shoonaya.com.',
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
            'You can reach our Data Protection Representative for UK/EU at info@shoonaya.com.',
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
