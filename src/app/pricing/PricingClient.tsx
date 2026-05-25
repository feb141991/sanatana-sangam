'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RazorpayCheckout from '@/components/RazorpayCheckout';

// Utility component for pill badges
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-[#C5A059]/10 text-[#C5A059] px-3 py-1 rounded-full text-sm font-medium">
      {children}
    </span>
  );
}

// Toggle component for billing period
function BillingToggle({ period, setPeriod }: { period: string; setPeriod: (p: 'monthly' | 'annual') => void }) {
  return (
    <div className="flex items-center space-x-2 mt-4">
      <button
        type="button"
        onClick={() => setPeriod('monthly')}
        className={`px-4 py-2 rounded-md transition ${period === 'monthly'
          ? 'bg-[#C5A059] text-white'
          : 'bg-white text-[#1A140E] border border-[#C5A059]'}
        `}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => setPeriod('annual')}

        className={`px-4 py-2 rounded-md flex items-center transition ${period === 'annual'
          ? 'bg-[#C5A059] text-white'
          : 'bg-white text-[#1A140E] border border-[#C5A059]'}
        `}
      >
        Annual
        {period === 'annual' && (
          <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Save 40%</span>
        )}
      </button>
    </div>
  );
}

// Feature list item component
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center space-x-2 text-sm text-[#6ab87a]">
      <span className="text-base">✓</span>
      <span className="text-[#1A140E]">{children}</span>
    </li>
  );
}

// Card component
function Card({
  label,
  priceMonthly,
  priceAnnual,
  subPrice,
  highlighted,
  bgGradient,
  borderColor,
  ctaText,
  ctaLink,
  checkoutPlan,
  billing,
  features,
}: {
  label: string;
  priceMonthly?: string;
  priceAnnual?: string;
  subPrice?: string;
  highlighted?: boolean;
  bgGradient?: string;
  borderColor?: string;
  ctaText: string;
  ctaLink?: string;
  checkoutPlan?: 'zenith' | 'kul';
  billing?: 'monthly' | 'annual';
  features: string[];
}) {
  const borderCls = borderColor ? `border ${borderColor}` : 'border border-[#EAE2D5]';
  const bgCls = bgGradient ? `bg-gradient-to-br ${bgGradient}` : 'bg-white';
  const textCls = highlighted ? 'text-white' : 'text-[#1A140E]';
  const btnCls = `mt-auto w-full text-center py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition ${
    highlighted
      ? 'bg-[#C5A059] text-white hover:opacity-90'
      : checkoutPlan === 'kul'
      ? 'bg-[#6ab87a]/20 border border-[#6ab87a] text-[#1A140E] hover:bg-[#6ab87a]/30'
      : 'bg-[#C5A059]/10 border border-[#C5A059] text-[#1A140E] hover:bg-[#C5A059]/20'
  }`;

  return (
    <div
      className={`flex flex-col p-6 rounded-2xl ${bgCls} ${borderCls} ${highlighted ? 'shadow-2xl' : 'shadow-sm'} transition`}
      style={highlighted ? { transform: 'scale(1.04)' } : undefined}
    >
      {highlighted && <div className="mb-3 self-start"><Pill>Most popular</Pill></div>}
      <h3 className={`text-xl font-medium mb-2 ${textCls}`} style={{ fontFamily: 'Georgia, serif' }}>{label}</h3>
      <div className={`text-3xl font-bold mb-1 ${textCls}`}>
        {priceMonthly && billing === 'monthly' ? priceMonthly : priceAnnual}
      </div>
      {subPrice && billing === 'annual' && (
        <div className={`text-sm mb-4 ${textCls} opacity-70`}>{subPrice}</div>
      )}
      <ul className="flex-1 space-y-2 mb-6 mt-4">
        {features.map((f, i) => (
          <FeatureItem key={i}>{f}</FeatureItem>
        ))}
      </ul>
      {checkoutPlan && billing ? (
        <RazorpayCheckout
          plan={checkoutPlan}
          billing={billing}
          label={ctaText}
          className={btnCls}
        />
      ) : (
        <a href={ctaLink ?? '#'} className={btnCls}>
          {ctaText}
        </a>
      )}
    </div>
  );
}

// FAQ Accordion item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#EAE2D5] py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full justify-between items-center text-left text-[#1A140E]"
      >
        <span className="font-medium">{question}</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-sm text-[#1A140E]"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingClient() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  const cards = [
    {
      label: 'Seeker',
      priceAnnual: '₹0',
      highlighted: false,
      borderColor: 'border-[#EAE2D5]',
      features: [
        'Full Panchang calendar',
        'Japa counter + streak',
        'Daily shloka & newsletter',
        'Aarti, Stotram & basic Katha',
        'Vrat tracker',
        'Daily Quiz (1 round)',
        'Vichaar Sabha community',
        'Live Darshan & Tirtha map',
        'AI Dharma chat (5/day)',
      ],
      ctaText: 'Get started free',
      ctaLink: '/signup',
      checkoutPlan: undefined as 'zenith' | 'kul' | undefined,
    },
    {
      label: 'Zenith',
      priceMonthly: '₹249/mo',
      priceAnnual: '₹1,799/yr',
      subPrice: '₹150/mo, billed annually',
      highlighted: true,
      bgGradient: 'from-[#1A140E] to-[#2C1F12]',
      borderColor: 'border-[#C5A059]',
      features: [
        'Everything in Seeker',
        'AI Dharma chat — unlimited',
        'All Pathshala learning paths',
        'Nitya Karma: all plans + journey view',
        'Full Bhakti library + audio recitation',
        'Quiz practice mode & analytics',
        'Deep progress insights & export',
        'Mandali Pro circles + Seekers nearby',
        'Zenith profile badge',
      ],
      ctaText: 'Start Zenith',
      checkoutPlan: 'zenith' as const,
    },
    {
      label: 'Kul',
      priceMonthly: '₹599/mo',
      priceAnnual: '₹3,999/yr',
      subPrice: '₹333/mo, billed annually',
      highlighted: false,
      borderColor: 'border-[rgba(106,184,122,0.4)]',
      features: [
        'Everything in Zenith — for the Kul admin',
        'All Zenith features for every Kul member',
        'Vansh family tree (unlimited generations)',
        'All Sanskara milestones + printable certificates',
        'Kul events, tasks & Sabha',
        'Shared family leaderboard',
        'Up to 25 Kul members',
      ],
      ctaText: 'Start Kul Pro',
      checkoutPlan: 'kul' as const,
    },
  ];

  const faq = [
    {
      q: 'Is Shoonaya Free really free forever?',
      a: 'Yes. Panchang, japa tracking, daily shloka, community — these will always be free. We believe dharmic tools should be accessible to all.',
    },
    {
      q: 'How does Kul Pro work for family members?',
      a: 'When the Kul admin subscribes to Kul Pro, all current and future members of that Kul automatically get Zenith-equivalent features — no individual payment needed. One family, one subscription.',
    },
    {
      q: 'Can I switch between monthly and annual?',
      a: "Yes. You can upgrade to annual at any time from your Settings page. We'll prorate any remaining monthly credit.",
    },
    {
      q: 'What happens if the Kul admin cancels?',
      a: 'Members retain access until the end of the current billing period. After that, individual members revert to Free. You\'ll receive a 7-day warning before this happens.',
    },
    {
      q: 'Do you offer student or seva discounts?',
      a: "Yes — write to us at hello@shoonaya.app with your details. We offer 50% off for students and full waiver for registered seva organisations.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* SECTION 1 – Hero */}
      <section className="text-center space-y-6">
        <Pill>Simple, honest pricing</Pill>
        <h1 className="font-serif text-5xl text-[#1A140E]" style={{ fontFamily: 'Georgia' }}>
          One practice. One price.
        </h1>
        <p className="text-base text-[#854F0B] opacity-80 max-w-md mx-auto">
          Everything you need for deep, uninterrupted dharmic practice.
          <br />
          No hidden tiers. No feature drip.
        </p>
        <BillingToggle period={billing} setPeriod={setBilling} />
      </section>

      {/* SECTION 2 – Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            label={card.label}
            priceMonthly={card.priceMonthly}
            priceAnnual={card.priceAnnual}
            subPrice={card.subPrice}
            highlighted={card.highlighted}
            bgGradient={card.bgGradient}
            borderColor={card.borderColor}
            ctaText={card.ctaText}
            ctaLink={'ctaLink' in card ? (card as { ctaLink?: string }).ctaLink : undefined}
            checkoutPlan={card.checkoutPlan}
            billing={billing}
            features={card.features}
          />
        ))}
      </section>

      {/* SECTION 3 – FAQ */}
      <section className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-medium text-center text-[#1A140E]">Frequently asked questions</h2>
        {faq.map((item, i) => (
          <FAQItem key={i} question={item.q} answer={item.a} />
        ))}
      </section>

      {/* Footer note */}
      <footer className="text-center text-sm text-[#1A140E] opacity-70">
        Payments processed securely via Razorpay. Cancel anytime.
        {/* Razorpay logo placeholder */}
        <div className="inline-block ml-2 align-middle">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="24" height="24" fill="#F9F9F9" />
            <path d="M4 12h16" stroke="#1A140E" strokeWidth="2" />
          </svg>
        </div>
      </footer>
    </div>
  );
}
