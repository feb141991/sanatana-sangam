import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Shoonaya Pricing | Free Spiritual App & Pro Membership',
  description: 'Compare Shoonaya plans for Panchang, japa, scripture, Pathshala, spiritual progress, and community features.',
  alternates: {
    canonical: 'https://www.shoonaya.com/pricing',
  },
};

export default function PricingPage() {
  return (
    <section className="bg-[#FAF6EF] min-h-screen py-12">
      <PricingClient />
    </section>
  );
}
