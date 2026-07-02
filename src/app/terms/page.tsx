import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Shoonaya Global',
  description: 'Worldwide terms of use for Shoonaya spiritual community and sacred library.',
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Global Governance"
      title="Sacred laws for a digital sanctuary."
      intro="Shoonaya is a worldwide platform. These terms establish the foundation for our global community, ensuring a safe, respectful, and legally compliant environment for all seekers."
      asideTitle="Global Integrity"
      asideBody="By launching globally, we commit to the highest standards of user safety and data integrity, respecting the unique legal landscapes of every region we serve."
    >
      <TermsClient />
    </PublicPageShell>
  );
}
