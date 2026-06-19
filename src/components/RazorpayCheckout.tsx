'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  plan: 'zenith' | 'kul';
  billing: 'monthly' | 'annual';
  label: string;
  className?: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image: string;
  theme: { color: string };
  handler: (response: { razorpay_subscription_id: string }) => void;
}

interface RazorpayInstance {
  open: () => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-sdk')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout({ plan, billing, label, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Create subscription on our server
      const res = await fetch(`/api/payment/checkout?plan=${plan}&billing=${billing}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Could not start checkout. Please try again.');
        return;
      }
      const { subscriptionId, key } = await res.json();

      // 2. Load Razorpay SDK dynamically
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Could not load payment gateway. Please check your connection.');
        return;
      }

      // 3. Open Razorpay modal
      const rzp = new window.Razorpay({
        key,
        subscription_id: subscriptionId,
        name: 'Shoonaya',
        description: plan === 'zenith' ? 'Shoonaya Zenith' : 'Shoonaya Kul Pro',
        image: '/icons/icon-192x192.png',
        theme: { color: '#C5A059' },
        handler: (response: { razorpay_subscription_id: string }) => {
          window.location.href = `/payment/success?sub=${response.razorpay_subscription_id}&plan=${plan}`;
        },
      });
      rzp.open();
    } catch (err) {
      console.error('[RazorpayCheckout]', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
      {loading ? 'Loading…' : label}
    </button>
  );
}
