'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, CreditCard, Sparkles, AlertTriangle, ExternalLink, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl: string | null;
}

interface SubscriptionClientProps {
  status: 'free' | 'pro' | 'grace' | 'expired';
  planId: string | null;
  subscriptionId: string | null;
  expiresAt: string | null;
  entitlementSource: string | null;
  tradition: string | null;
  country: string;
}

export default function SubscriptionClient({
  status,
  planId,
  subscriptionId,
  expiresAt,
  entitlementSource,
  tradition,
  country
}: SubscriptionClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [history, setHistory] = useState<Invoice[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'seeker' | 'zenith' | 'kul'>('zenith');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/payment/subscription/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        // silently ignore
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Derive Plan Name
  let planName = 'Seeker (Free)';
  if (status === 'pro' || status === 'grace') {
    planName = entitlementSource === 'kul' ? 'Kul Pro' : 'Zenith';
  } else if (status === 'expired') {
    planName = 'Zenith (Expired)';
  }

  // Derive Status details
  const getStatusDetails = () => {
    if (isCancelling) return { label: 'Cancelling', color: 'text-amber-400', bg: 'bg-amber-400/10' };
    switch (status) {
      case 'pro': return { label: 'Active', color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'grace': return { label: 'Grace Period', color: 'text-amber-400', bg: 'bg-amber-400/10' };
      case 'expired': return { label: 'Expired', color: 'text-red-400', bg: 'bg-red-400/10' };
      default: return { label: 'Free', color: 'text-[#8a7a5a]', bg: 'bg-[#C5A059]/10' };
    }
  };
  const statusDetails = getStatusDetails();

  const isMonthly = planId?.toLowerCase().includes('monthly');
  const billingCycle = planId ? (isMonthly ? 'Monthly' : 'Annual') : '—';
  
  const renewalDate = expiresAt ? format(new Date(expiresAt), 'dd MMM yyyy') : '—';
  const isAppStore = entitlementSource === 'app_store' || entitlementSource === 'play_store';

  const getPricing = () => {
    switch (country) {
      case 'IN': return { monthly: '₹199', annual: '₹1999' };
      case 'GB': return { monthly: '£2.99', annual: '£29.99' };
      case 'US':
      default: return { monthly: '$3.99', annual: '$39.99' };
    }
  };
  const pricing = getPricing();

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Subscription will cancel at end of billing period`);
        setIsCancelling(true);
        setConfirmCancel(false);
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    router.push('/pricing');
  };

  const planMotion = {
    whileTap: { scale: 0.98 },
    whileHover: { y: -4 },
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  } as const;

  const handleRestore = async () => {
    toast('If you have an active subscription, it will be restored. Contact support if not.', { icon: '🔄' });
    try {
      await fetch('/api/premium/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'restore' })
      });
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="pb-24 font-sans selection:bg-[#C5A059]/30" style={{ minHeight: '100vh', background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 pt-safe-top pb-4 backdrop-blur-xl flex items-center gap-4" style={{ background: 'var(--divine-bg)', borderBottom: '1px solid var(--card-border)' }}>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <ChevronLeft size={20} color="#C5A059" />
        </button>
        <h1 className="text-xl font-bold font-serif" style={{ color: 'var(--brand-ink)' }}>Subscription</h1>
      </div>

      <div className="max-w-md mx-auto px-6 pt-8 space-y-8">
        
        {/* Current Plan Card */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">Current Plan</h2>
          <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1" style={{ color: 'var(--brand-ink)' }}>{planName}</h3>
                <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>{tradition ? `${tradition} Tradition` : 'Shoonaya Journey'}</p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusDetails.bg} ${statusDetails.color}`}>
                {statusDetails.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-muted)' }}>Billing Cycle</p>
                <p className="font-medium text-sm" style={{ color: 'var(--brand-ink)' }}>{billingCycle}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-muted)' }}>Renewal Date</p>
                <p className="font-medium text-sm" style={{ color: 'var(--brand-ink)' }}>{renewalDate}</p>
              </div>
            </div>

            {isAppStore && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500/90 leading-relaxed">
                  Manage your subscription through your device&apos;s app store settings.
                </p>
              </div>
            )}

            {!isAppStore && (
              <div>
                {status === 'free' || status === 'expired' ? (
                  <button 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    className="w-full py-3.5 rounded-xl bg-[#C5A059] text-[#0E0E0F] font-bold shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:bg-[#d6b471] transition-colors flex justify-center items-center gap-2"
                  >
                    <Sparkles size={16} />
                    Upgrade to Pro
                  </button>
                ) : status === 'grace' ? (
                  <button 
                    onClick={handleManageBilling}
                    className="w-full py-3.5 rounded-xl bg-amber-500 text-[#0E0E0F] font-bold hover:bg-amber-400 transition-colors flex justify-center items-center gap-2"
                  >
                    <CreditCard size={16} />
                    Update Payment Method
                  </button>
                ) : confirmCancel ? (
                  <div className="p-4 rounded-xl mt-2 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <p className="text-sm mb-4" style={{ color: 'var(--brand-ink)' }}>
                      Cancel subscription? You&apos;ll keep access until {renewalDate}.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 py-2.5 rounded-lg font-bold transition-colors"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--brand-ink)' }}
                      >
                        Keep Plan
                      </button>
                      <button 
                        onClick={handleManageBilling}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-lg bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-3.5 rounded-xl font-bold hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--brand-ink)' }}
                  >
                    Manage Billing
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Available Plans */}
        {(status === 'free' || status === 'expired') && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">Available Plans</h2>
            <div className="space-y-4">
              <div
                className="relative flex rounded-full p-1"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                {(['monthly', 'annual'] as const).map((period) => {
                  const active = billingPeriod === period;
                  return (
                    <button
                      key={period}
                      onClick={() => setBillingPeriod(period)}
                      className="relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      style={{ color: active ? '#0E0E0F' : 'var(--brand-muted)' }}
                    >
                      {active && (
                        <motion.span
                          layoutId="billing-pill"
                          className="absolute inset-0 rounded-full"
                          style={{ background: '#C5A059' }}
                          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                        />
                      )}
                      <span className="relative z-10">{period === 'monthly' ? 'Monthly' : 'Annual'}</span>
                    </button>
                  );
                })}
              </div>

              {[
                {
                  key: 'seeker' as const,
                  title: 'Seeker',
                  subtitle: 'Free forever',
                  price: '₹0',
                  cadence: 'start here',
                  features: [
                    'Daily japa mala tracker',
                    'Nitya Karma morning routine',
                    'Festival & panchang calendar',
                    '5 Dharma Mitra messages/day',
                    'Mandali community (read)',
                  ],
                  cta: 'Continue with Seeker',
                  onClick: () => setSelectedPlan('seeker'),
                  action: () => setSelectedPlan('seeker'),
                },
                {
                  key: 'zenith' as const,
                  title: 'Zenith',
                  subtitle: 'Most popular',
                  price: billingPeriod === 'annual' ? pricing.annual : pricing.monthly,
                  cadence: billingPeriod === 'annual' ? 'per year' : 'per month',
                  eyebrow: billingPeriod === 'annual' ? `${pricing.monthly}/month` : 'Flexible billing',
                  features: [
                    'Everything in Seeker',
                    'Unlimited Dharma Mitra AI',
                    'Advanced analytics & reports',
                    'Full Pathshala scripture library',
                    'Ad-free, distraction-free',
                    '3× Streak Freeze tokens/month',
                  ],
                  cta: billingPeriod === 'annual' ? 'Subscribe Annual' : 'Subscribe Monthly',
                  onClick: () => setSelectedPlan('zenith'),
                  action: () => handleSubscribe(billingPeriod),
                  highlighted: true,
                },
                {
                  key: 'kul' as const,
                  title: 'Kul',
                  subtitle: 'Family plan',
                  price: billingPeriod === 'annual' ? 'Shared' : 'Shared',
                  cadence: 'household access',
                  features: [
                    'Up to 6 family members',
                    'Shared mandali calendar',
                    'Family karma board',
                    'Designed for home practice',
                  ],
                  cta: 'Explore Kul',
                  onClick: () => setSelectedPlan('kul'),
                  action: () => router.push('/pricing'),
                },
              ].map((plan) => {
                const selected = selectedPlan === plan.key;
                const isZenith = plan.key === 'zenith';
                return (
                  <motion.div
                    key={plan.key}
                    onClick={plan.onClick}
                    className="relative rounded-2xl p-6 cursor-pointer overflow-hidden"
                    style={{
                      background: isZenith
                        ? 'linear-gradient(145deg, #1C1608 0%, #2A1F0A 50%, #1a1208 100%)'
                        : 'var(--card-bg)',
                      border: selected
                        ? '2px solid rgba(197,160,89,0.9)'
                        : isZenith
                          ? '1.5px solid rgba(197, 160, 89, 0.55)'
                          : '1px solid var(--card-border)',
                      boxShadow: selected
                        ? '0 0 0 4px rgba(197,160,89,0.12)'
                        : isZenith
                          ? '0 0 40px rgba(197, 160, 89, 0.12), 0 20px 60px rgba(0,0,0,0.45)'
                          : undefined,
                    }}
                    {...planMotion}
                  >
                    {isZenith && (
                      <div
                        className="absolute left-6 top-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(197,160,89,0.18)', color: '#C5A059', boxShadow: '0 0 18px rgba(197,160,89,0.18)' }}
                      >
                        Most popular
                      </div>
                    )}

                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: 'rgba(197,160,89,0.18)', border: '1px solid rgba(197,160,89,0.45)' }}
                      >
                        <CheckCircle2 size={16} color="#C5A059" />
                      </motion.div>
                    )}

                    <div className={`flex justify-between items-start ${isZenith ? 'mt-8' : ''} mb-5`}>
                      <div>
                        <h3 className="text-lg font-serif font-bold" style={{ color: isZenith ? 'rgba(255,248,233,0.94)' : 'var(--brand-ink)' }}>{plan.title}</h3>
                        <p className="text-xs" style={{ color: isZenith ? '#C5A059' : 'var(--brand-muted)' }}>{plan.subtitle}</p>
                        {'eyebrow' in plan && plan.eyebrow ? (
                          <p className="mt-1 text-[11px]" style={{ color: isZenith ? 'rgba(197,160,89,0.88)' : 'var(--brand-muted)' }}>{plan.eyebrow}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={`${plan.key}-${billingPeriod}-price`}
                            initial={{ opacity: 0, x: 10, y: 4 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, x: -10, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className={`font-bold ${plan.key === 'seeker' ? 'text-xl' : 'text-2xl'}`}
                            style={{ color: isZenith ? '#C5A059' : 'var(--brand-ink)' }}
                          >
                            {plan.price}
                          </motion.p>
                        </AnimatePresence>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: isZenith ? 'rgba(255,248,233,0.5)' : 'var(--brand-muted)' }}>{plan.cadence}</p>
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: isZenith ? 'rgba(255,248,233,0.9)' : 'var(--brand-ink)' }}>
                          <CheckCircle2 size={16} className="text-[#C5A059]" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        plan.action();
                      }}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                      style={{
                        background: plan.key === 'zenith' ? '#C5A059' : 'var(--card-bg)',
                        border: plan.key === 'zenith' ? 'none' : '1px solid var(--card-border)',
                        color: plan.key === 'zenith' ? '#0E0E0F' : 'var(--brand-ink)',
                      }}
                    >
                      {plan.cta}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Feature Comparison Table ── */}
        {(status === 'free' || status === 'expired') && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">What You Get</h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-3 px-4 py-3 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--brand-muted)' }}
              >
                <span>Feature</span>
                <span className="text-center">Seeker</span>
                <span className="text-center" style={{ color: '#C5A059' }}>Zenith</span>
              </div>

              {([
                { label: 'Japa Mala tracker',             seeker: true,    zenith: true },
                { label: 'Nitya Karma routine',           seeker: true,    zenith: true },
                { label: 'Festival & panchang',           seeker: true,    zenith: true },
                { label: 'Dharm Veer challenges',         seeker: true,    zenith: true },
                { label: 'Dharma Mitra AI',               seeker: '5/day', zenith: '200/day' },
                { label: 'Advanced analytics',            seeker: false,   zenith: true },
                { label: 'Monthly sadhana report',        seeker: false,   zenith: true },
                { label: 'AI spiritual interpretation',   seeker: false,   zenith: true },
                { label: 'Full Pathshala library',        seeker: false,   zenith: true },
                { label: 'Streak Freeze tokens',          seeker: '1/mo',  zenith: '3/mo' },
                { label: 'Ad-free experience',            seeker: false,   zenith: true },
                { label: 'Early feature access',          seeker: false,   zenith: true },
              ] as { label: string; seeker: boolean | string; zenith: boolean | string }[]).map((row, i) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 items-center px-4 py-3"
                  style={{
                    borderTop: i === 0 ? undefined : '1px solid var(--card-border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(197,160,89,0.02)',
                  }}
                >
                  <span className="text-xs leading-snug" style={{ color: 'var(--brand-ink)' }}>{row.label}</span>
                  <div className="flex justify-center">
                    {row.seeker === true ? (
                      <CheckCircle2 size={15} style={{ color: '#C5A059', opacity: 0.6 }} />
                    ) : row.seeker === false ? (
                      <X size={14} style={{ color: 'var(--brand-muted)', opacity: 0.4 }} />
                    ) : (
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--brand-muted)' }}>{row.seeker}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.zenith === true ? (
                      <CheckCircle2 size={15} style={{ color: '#C5A059' }} />
                    ) : row.zenith === false ? (
                      <X size={14} style={{ color: 'var(--brand-muted)', opacity: 0.4 }} />
                    ) : (
                      <span className="text-[10px] font-bold" style={{ color: '#C5A059' }}>{row.zenith}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Emotional hook for free users ── */}
        {(status === 'free' || status === 'expired') && (
          <section>
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'linear-gradient(145deg, #1C1608 0%, #2A1F0A 100%)',
                border: '1px solid rgba(197,160,89,0.28)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.22)' }}
              >
                <Zap size={22} style={{ color: '#C5A059' }} />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2" style={{ color: 'rgba(255,248,233,0.94)' }}>
                Your practice deserves the full path
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,248,233,0.55)' }}>
                Most seekers who upgrade to Zenith maintain 3× longer streaks and develop a deeper,
                daily relationship with their tradition — because the tools are there every time they open the app.
              </p>
              <button
                onClick={() => handleSubscribe(billingPeriod)}
                className="w-full py-3.5 rounded-xl font-bold transition-all hover:brightness-110"
                style={{ background: '#C5A059', color: '#0E0E0F' }}
              >
                <Sparkles size={15} className="inline mr-2 -mt-0.5" />
                Start Zenith — {billingPeriod === 'annual' ? pricing.annual + '/year' : pricing.monthly + '/month'}
              </button>
            </div>
          </section>
        )}

        {/* Restore Purchase */}
        <section>
          <button
            onClick={handleRestore}
            className="w-full py-3.5 rounded-xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--brand-muted)' }}
          >
            Restore Purchase
          </button>
        </section>

        {/* Billing History */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">Billing History</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            {historyLoading ? (
              <div className="p-4 space-y-3">
                <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--card-border)' }} />
                <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--card-border)' }} />
                <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--card-border)' }} />
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--brand-muted)' }}>
                No billing history yet
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border)]">
                {history.map((invoice) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--brand-ink)' }}>{format(new Date(invoice.date), 'dd MMM yyyy')}</p>
                      <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>{invoice.currency} {invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-400/10 text-green-400' : 
                        invoice.status === 'failed' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.invoiceUrl && (
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-[#C5A059] hover:text-[#d6b471] transition-colors p-1">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
