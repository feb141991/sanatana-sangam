import PricingClient from './PricingClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PricingPage() {
  return (
    <section className="bg-[#FAF6EF] min-h-screen py-12">
      <PricingClient />
    </section>
  );
}
