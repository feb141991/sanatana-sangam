import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | Shoonaya Global',
  description: 'Worldwide privacy policy for the Shoonaya spiritual community. Transparency for seekers.',
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy Trust"
      title="Transparent, sacred, and secure."
      intro="Privacy is the foundation of trust. This policy describes how Shoonaya handles your data with the highest integrity, respecting both global standards and your local regional rights."
      asideTitle="Privacy by Design"
      asideBody="Our platform is built to minimize data collection. We only store what is necessary to serve your spiritual growth and maintain community safety."
    >
      <PrivacyClient />
    </PublicPageShell>
  );
}
