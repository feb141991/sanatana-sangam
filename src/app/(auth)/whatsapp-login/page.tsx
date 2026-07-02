'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { COUNTRY_CODES, formatPhone } from '@/lib/phone';

export default function WhatsAppLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!phoneNumber) return toast.error('Enter phone number');
    setLoading(true);
    try {
      const phone = formatPhone(countryCode, phoneNumber);
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Code sent via WhatsApp');
      setStep(2);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) return toast.error('Enter verification code');
    setLoading(true);
    try {
      const phone = formatPhone(countryCode, phoneNumber);
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      // Magic link is a full URL — navigate there to establish the session
      window.location.href = data.redirect ?? '/home';
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex flex-col items-center justify-center p-4 text-white">
      {step === 1 && (
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold mb-2">Login with WhatsApp</h1>
          <p className="text-sm mb-4">Enter your phone number to receive a WhatsApp verification code.</p>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className="w-1/3 bg-white/10 border border-white/20 rounded-xl p-2 text-white"
            >
              {COUNTRY_CODES.map(cc => (
                <option key={cc.code} value={cc.code}>
                  {cc.flag} {cc.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="9876543210"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl p-2 text-white"
            />
          </div>
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full bg-[#25D366] py-3 rounded-xl font-bold"
          >
            {loading ? 'Sending...' : 'Send WhatsApp Code'}
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold mb-2">Enter Code</h1>
          <p className="text-sm mb-4">Check your WhatsApp for a 6‑digit code.</p>
          <input
            type="text"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full text-3xl text-center bg-white/10 border border-white/20 rounded-xl p-4"
          />
          <button
            onClick={verifyCode}
            disabled={loading}
            className="w-full bg-[#25D366] py-3 rounded-xl font-bold"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </div>
      )}
    </div>
  );
}
