'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, CreditCard, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
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
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl flex items-center gap-4" style={{ background: 'var(--divine-bg)', borderBottom: '1px solid var(--card-border)' }}>
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
              
              {/* Annual Plan (Highlighted) */}
              <div className="relative border border-[#C5A059]/40 rounded-2xl p-6 shadow-[0_8px_32px_rgba(197,160,89,0.1)]" style={{ background: 'linear-gradient(145deg, rgba(197,160,89,0.08), rgba(197,160,89,0.02))' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C5A059] text-[#0E0E0F] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Best Value
                </div>
                
                <div className="flex justify-between items-center mb-5 mt-1">
                  <div>
                    <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--brand-ink)' }}>Zenith · Annual</h3>
                    <p className="text-xs text-[#C5A059]">{pricing.monthly}/month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#C5A059]">{pricing.annual}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>per year</p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {['Ad-free experience', 'Premium Pathshala Content', 'Advanced Analytics'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-ink)' }}>
                      <CheckCircle2 size={16} className="text-[#C5A059]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleSubscribe('annual')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#C5A059] text-[#0E0E0F] font-bold hover:bg-[#d6b471] transition-colors disabled:opacity-50"
                >
                  Subscribe Now
                </button>
              </div>

              {/* Monthly Plan */}
              <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--brand-ink)' }}>Zenith · Monthly</h3>
                    <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>Flexible</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--brand-ink)' }}>{pricing.monthly}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-muted)' }}>per month</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 hover:opacity-80"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--brand-ink)' }}
                >
                  Subscribe Monthly
                </button>
              </div>

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
