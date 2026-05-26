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
}

export default function SubscriptionClient({
  status,
  planId,
  subscriptionId,
  expiresAt,
  entitlementSource,
  tradition
}: SubscriptionClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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
      default: return { label: 'Free', color: 'text-[#F0EDE6]/60', bg: 'bg-white/5' };
    }
  };
  const statusDetails = getStatusDetails();

  const isMonthly = planId?.toLowerCase().includes('monthly');
  const billingCycle = planId ? (isMonthly ? 'Monthly' : 'Annual') : '—';
  
  const renewalDate = expiresAt ? format(new Date(expiresAt), 'dd MMM yyyy') : '—';
  const isAppStore = entitlementSource === 'app_store' || entitlementSource === 'play_store';

  const handleManageBilling = async () => {
    if (!window.confirm(`Cancel your subscription? You'll keep access until ${renewalDate}.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payment/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Subscription will cancel at end of billing period`);
        setIsCancelling(true);
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

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F0EDE6] pb-24 font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 bg-[#0E0E0F]/80 backdrop-blur-xl border-b border-white/10 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} color="#C5A059" />
        </button>
        <h1 className="text-xl font-bold font-serif text-[#F0EDE6]">Subscription</h1>
      </div>

      <div className="max-w-md mx-auto px-6 pt-8 space-y-8">
        
        {/* Current Plan Card */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">Current Plan</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white mb-1">{planName}</h3>
                <p className="text-sm text-white/50">{tradition ? `${tradition} Tradition` : 'Shoonaya Journey'}</p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusDetails.bg} ${statusDetails.color}`}>
                {statusDetails.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Billing Cycle</p>
                <p className="font-medium text-sm text-white/90">{billingCycle}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Renewal Date</p>
                <p className="font-medium text-sm text-white/90">{renewalDate}</p>
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
                ) : (
                  <button 
                    onClick={handleManageBilling}
                    className="w-full py-3.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
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
              <div className="relative bg-gradient-to-br from-[#241A0C] to-[#1C150A] border border-[#C5A059]/40 rounded-2xl p-6 shadow-[0_8px_32px_rgba(197,160,89,0.1)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C5A059] text-[#0E0E0F] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Best Value
                </div>
                
                <div className="flex justify-between items-center mb-5 mt-1">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Zenith Annual</h3>
                    <p className="text-xs text-[#C5A059]">₹166/month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#C5A059]">₹1999</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">per year</p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {['Ad-free experience', 'Premium Pathshala Content', 'Advanced Analytics'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80">
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
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Zenith Monthly</h3>
                    <p className="text-xs text-white/60">Flexible</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">₹199</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">per month</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Subscribe Monthly
                </button>
              </div>

            </div>
          </section>
        )}

        {/* Billing History */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-4">Billing History</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {historyLoading ? (
              <div className="p-4 space-y-3">
                <div className="rounded-xl h-12 bg-white/5 animate-pulse" />
                <div className="rounded-xl h-12 bg-white/5 animate-pulse" />
                <div className="rounded-xl h-12 bg-white/5 animate-pulse" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center text-white/50 text-sm">
                No billing history yet
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {history.map((invoice) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/90">{format(new Date(invoice.date), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-white/50 uppercase tracking-wider">{invoice.currency} {invoice.amount}</p>
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
