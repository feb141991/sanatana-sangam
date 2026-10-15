'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
type Choice = Pick<WebConsentPreferences, 'analytics' | 'advertising'>;

// One style for every first-layer button, on purpose: refusing must be as easy to see and press as accepting.
const choiceButton = 'min-h-11 rounded-xl border border-current/30 bg-white/60 px-3 font-semibold hover:bg-white dark:bg-white/5 dark:hover:bg-white/10';

export default function WebConsentManager({ gaMeasurementId, adsenseClient }: Props) {
  // `saved` is what the visitor has confirmed. It alone decides whether any vendor script loads.
  // `draft` is what the boxes show while they are still being ticked; nothing reads it except the boxes.
  const [saved, setSaved] = useState<WebConsentPreferences>(defaultWebConsent);
  const [draft, setDraft] = useState<Choice>({ analytics: false, advertising: false });
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  // The staff console has no use for a cookie prompt, and the prompt covers its controls.
  const onAdmin = (usePathname() ?? '').startsWith('/admin');

  useEffect(() => {
    let stored: WebConsentPreferences | null = null;
    try { stored = parseWebConsent(window.localStorage.getItem(WEB_CONSENT_STORAGE_KEY)); } catch { stored = null; }
    if (stored) {
      setSaved(stored);
      setDraft({ analytics: stored.analytics, advertising: stored.advertising });
    } else {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const reopen = () => {
      setDraft({ analytics: saved.analytics, advertising: saved.advertising });
      setCustomizing(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, reopen);
  }, [saved]);

  function save(nextValues: Choice) {
    const next: WebConsentPreferences = { version: WEB_CONSENT_VERSION, ...nextValues, decidedAt: new Date().toISOString() };
    // Compared against what was in force before, so withdrawing a category really removes its cookies.
    clearVendorState(saved, next);
    try { window.localStorage.setItem(WEB_CONSENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* fail closed in memory */ }
    setSaved(next);
    setDraft({ analytics: next.analytics, advertising: next.advertising });
    setOpen(false);
    setCustomizing(false);
  }

  return (
    <>
      {saved.analytics && gaMeasurementId && !onAdmin ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-consented-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}',{send_page_view:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
      {saved.advertising && adsenseClient && !onAdmin ? (
        <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous" strategy="afterInteractive" />
      ) : null}
      {open && !onAdmin ? (
        <div role="dialog" aria-labelledby="privacy-choices-title" aria-describedby="privacy-choices-body" className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-xl rounded-2xl border border-black/10 bg-[#fffaf2] p-5 text-[#3f2a20] shadow-2xl dark:border-white/10 dark:bg-[#17120d] dark:text-[#f7ead8]">
          <h2 id="privacy-choices-title" className="font-display text-xl font-bold">Your privacy choices</h2>
          <p id="privacy-choices-body" className="mt-2 text-sm leading-6 opacity-80">Shoonaya uses necessary storage for sign-in and preferences. Analytics and advertising stay off unless you choose them.</p>
          {customizing ? (
            <div className="mt-4 space-y-3">
              {(['analytics', 'advertising'] as const).map((key) => (
                <label key={key} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-current/10 px-3 py-2 capitalize">
                  {key}
                  <input type="checkbox" checked={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))} />
                </label>
              ))}
              <button className={`${choiceButton} w-full`} onClick={() => save(draft)}>Save choices</button>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button className={choiceButton} onClick={() => save({ analytics: false, advertising: false })}>Keep both off</button>
              <button className={choiceButton} onClick={() => { setDraft({ analytics: saved.analytics, advertising: saved.advertising }); setCustomizing(true); }}>Choose settings</button>
              <button className={choiceButton} onClick={() => save({ analytics: true, advertising: true })}>Allow analytics &amp; ads</button>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
