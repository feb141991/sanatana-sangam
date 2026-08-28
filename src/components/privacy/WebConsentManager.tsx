'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  OPEN_PRIVACY_CHOICES_EVENT,
  WEB_CONSENT_STORAGE_KEY,
  WEB_CONSENT_VERSION,
  clearVendorState,
  defaultWebConsent,
  parseWebConsent,
  type WebConsentPreferences,
} from '@/lib/web-consent';

type Props = { gaMeasurementId?: string; adsenseClient?: string };

export default function WebConsentManager({ gaMeasurementId, adsenseClient }: Props) {
  const [preferences, setPreferences] = useState<WebConsentPreferences>(defaultWebConsent);
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    let stored: WebConsentPreferences | null = null;
    try { stored = parseWebConsent(window.localStorage.getItem(WEB_CONSENT_STORAGE_KEY)); } catch { stored = null; }
    if (stored) setPreferences(stored);
    else setOpen(true);
    const reopen = () => { setCustomizing(true); setOpen(true); };
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, reopen);
  }, []);

  function save(nextValues: Pick<WebConsentPreferences, 'analytics' | 'advertising'>) {
    const next: WebConsentPreferences = { version: WEB_CONSENT_VERSION, ...nextValues, decidedAt: new Date().toISOString() };
    clearVendorState(preferences, next);
    try { window.localStorage.setItem(WEB_CONSENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* fail closed in memory */ }
    setPreferences(next);
    setOpen(false);
    setCustomizing(false);
  }

  return (
    <>
      {preferences.analytics && gaMeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-consented-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}',{send_page_view:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
      {preferences.advertising && adsenseClient ? (
        <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous" strategy="afterInteractive" />
      ) : null}
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Privacy choices" className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-xl rounded-2xl border border-black/10 bg-[#fffaf2] p-5 text-[#3f2a20] shadow-2xl dark:border-white/10 dark:bg-[#17120d] dark:text-[#f7ead8]">
          <h2 className="font-display text-xl font-bold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6 opacity-80">Shoonaya uses necessary storage for sign-in and preferences. Analytics and advertising stay off unless you choose them.</p>
          {customizing ? (
            <div className="mt-4 space-y-3">
              {(['analytics', 'advertising'] as const).map((key) => (
                <label key={key} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-current/10 px-3 py-2 capitalize">
                  {key}
                  <input type="checkbox" checked={preferences[key]} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} />
                </label>
              ))}
              <button className="min-h-11 w-full rounded-xl bg-[#9a641e] px-4 font-semibold text-white" onClick={() => save(preferences)}>Save choices</button>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button className="min-h-11 rounded-xl border border-current/20 px-3 font-semibold" onClick={() => save({ analytics: false, advertising: false })}>Reject optional</button>
              <button className="min-h-11 rounded-xl border border-current/20 px-3 font-semibold" onClick={() => setCustomizing(true)}>Customize</button>
              <button className="min-h-11 rounded-xl bg-[#9a641e] px-3 font-semibold text-white" onClick={() => save({ analytics: true, advertising: true })}>Accept optional</button>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
