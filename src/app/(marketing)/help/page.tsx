import { Metadata } from 'next';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Devotee Help & Support Desk | Shoonaya',
  description:
    'Grounded answers for astronomical Panchang calculations, Japa Mala counters, spiritual practice, and direct devotee care.',
  alternates: { canonical: 'https://www.shoonaya.com/help' },
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-white font-outfit pt-24 pb-16 px-4 sm:px-6">
      <HelpClient />
    </main>
  );
}
