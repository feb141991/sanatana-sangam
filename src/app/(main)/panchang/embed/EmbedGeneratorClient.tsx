'use client';

import { useState } from 'react';
import { EMBED_POPULAR_CITIES } from '@/lib/embed/cities';
import { Copy, Check, Code, ExternalLink, Globe, Sparkles, Smartphone, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmbedGeneratorClient() {
  const [selectedCity, setSelectedCity] = useState('new-york');
  const [theme, setTheme] = useState<'light' | 'dark' | 'gold'>('light');
  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);

  const cityList = Object.values(EMBED_POPULAR_CITIES);
  const activeCity = EMBED_POPULAR_CITIES[selectedCity] || EMBED_POPULAR_CITIES['new-york'];

  const embedUrl = `https://www.shoonaya.com/embed/panchang?city=${selectedCity}&theme=${theme}${
    compact ? '&compact=true' : ''
  }`;

  const iframeHeight = compact ? '290' : '390';

  const embedSnippet = `<!-- Shoonaya Panchang Widget for ${activeCity.name} -->
<iframe
  src="${embedUrl}"
  width="100%"
  height="${iframeHeight}"
  frameborder="0"
  style="border:none;max-width:420px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.06);margin:0 auto;display:block;"
  title="Daily Vedic Panchang for ${activeCity.name} - Powered by Shoonaya"
></iframe>
<div style="font-size:12px;text-align:center;margin-top:6px;font-family:sans-serif;">
  <a href="https://www.shoonaya.com/panchang" target="_blank" rel="noopener" style="color:#C5A059;text-decoration:none;font-weight:500;">
    🕉️ Powered by Shoonaya Sacred Calendar
  </a>
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Controls & Configuration */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-600" />
            Configure Your Widget
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Customize the astronomical Vedic Panchang widget for your temple, community website, or cultural blog.
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {/* 1. City Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                1. Select City / Diaspora Hub
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <optgroup label="United States">
                  {cityList
                    .filter((c) => c.country === 'USA')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="United Kingdom">
                  {cityList
                    .filter((c) => c.country === 'United Kingdom')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Canada">
                  {cityList
                    .filter((c) => c.country === 'Canada')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Australia & New Zealand">
                  {cityList
                    .filter((c) => c.country === 'Australia' || c.country === 'New Zealand')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Singapore & Gulf">
                  {cityList
                    .filter((c) => c.country === 'Singapore' || c.country === 'United Arab Emirates' || c.country === 'Malaysia')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="India (Bharat)">
                  {cityList
                    .filter((c) => c.country === 'India')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                Astronomical calculations adjust automatically for local sunrise, sunset & timezone.
              </p>
            </div>

            {/* 2. Theme Picker */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                2. Visual Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', desc: 'Clean White' },
                  { id: 'dark', label: 'Dark', desc: 'Midnight Slate' },
                  { id: 'gold', label: 'Golden', desc: 'Sanctuary Amber' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      theme === t.id
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{t.label}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Compact Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60">
              <div>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block">
                  Compact Mode
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Hides the astronomical grid for tight sidebar columns or mobile footers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 1-Click Code Snippet Box */}
        <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Copy & Paste Code Snippet
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Snippet'}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 text-[11px] leading-relaxed font-mono overflow-x-auto text-amber-200/90 whitespace-pre-wrap select-all">
            {embedSnippet}
          </pre>

          <p className="text-[11px] text-stone-400 mt-3 leading-normal">
            Paste this snippet anywhere inside your HTML, WordPress, Squarespace, or Wix page. The widget updates every morning automatically.
          </p>
        </div>
      </div>

      {/* Right Column: Live Interactive Preview */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-amber-600" />
            Live Widget Preview
          </span>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-amber-600 hover:underline inline-flex items-center gap-1"
          >
            Open Standalone <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* The Actual Rendered Iframe */}
        <div className="w-full bg-stone-100 dark:bg-stone-950/60 p-4 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            <iframe
              src={embedUrl}
              width="100%"
              height={iframeHeight}
              style={{
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
              title="Shoonaya Daily Panchang Preview"
            />
          </div>
        </div>

        {/* Value Proposition for Webmasters */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex flex-col gap-2">
          <p className="font-semibold text-amber-950 dark:text-amber-100 text-sm">
            Why add the Shoonaya Panchang widget to your website?
          </p>
          <ul className="list-disc pl-4 space-y-1 text-stone-700 dark:text-stone-300">
            <li><strong>Zero Maintenance:</strong> Recalculates every midnight according to high-precision astronomical ephemeris.</li>
            <li><strong>True Local Precision:</strong> Displays exact Udaya Tithi and Rahu Kaal for your city—never a generic Indian timezone copy.</li>
            <li><strong>Completely Free & Ad-Free:</strong> No commercial ads, trackers, or popup banners for your temple congregation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
