'use client';

import { useState } from 'react';
import type { PublicPanchatantraStory } from '@/lib/panchatantra-public';
import { Copy, Check, Code, ExternalLink, BookOpen, Sparkles, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  stories: PublicPanchatantraStory[];
}

export default function PanchatantraEmbedClient({ stories }: Props) {
  const [selectedSlug, setSelectedSlug] = useState('daily');
  const [theme, setTheme] = useState<'light' | 'dark' | 'gold'>('light');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [copied, setCopied] = useState(false);

  const embedUrl = `https://www.shoonaya.com/embed/panchatantra?theme=${theme}&lang=${lang}${
    selectedSlug !== 'daily' ? `&slug=${selectedSlug}` : ''
  }`;

  const embedSnippet = `<!-- Shoonaya Panchatantra Story Widget -->
<iframe
  src="${embedUrl}"
  width="100%"
  height="520"
  frameborder="0"
  style="border:none;max-width:440px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.08);margin:0 auto;display:block;"
  title="Panchatantra Story of the Day - Powered by Shoonaya"
></iframe>
<div style="font-size:12px;text-align:center;margin-top:6px;font-family:sans-serif;">
  <a href="https://www.shoonaya.com/stories/panchatantra" target="_blank" rel="noopener" style="color:#C5A059;text-decoration:none;font-weight:500;">
    🕉️ Powered by Shoonaya Panchatantra Library
  </a>
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    toast.success('Panchatantra embed snippet copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Customization Controls */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-600" />
            Configure Story Widget
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Embed handcrafted 3D claymation Panchatantra fables into your school, homeschooling blog, or cultural portal.
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {/* Story Picker */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                1. Story Selection
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="daily">✨ Daily Rotating Story (Story of the Day)</option>
                <optgroup label="Specific Stories">
                  {stories.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title} ({s.titleHi})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Language Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                2. Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'en', label: 'English', desc: 'Original Retelling' },
                  { id: 'hi', label: 'हिन्दी (Hindi)', desc: 'देवनागरी पुनर्कथन' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLang(l.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      lang === l.id
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{l.label}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                3. Visual Theme
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
            Works across WordPress, Substack, Medium, Ghost, Squarespace, and custom HTML pages.
          </p>
        </div>
      </div>

      {/* Right Column: Live Interactive Preview */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-amber-600" />
            Live Preview
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
          <div className="w-full max-w-[440px]">
            <iframe
              src={embedUrl}
              width="100%"
              height="530"
              style={{
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
              title="Shoonaya Panchatantra Widget Preview"
            />
          </div>
        </div>

        {/* Benefits for Schools & Educators */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex flex-col gap-2">
          <p className="font-semibold text-amber-950 dark:text-amber-100 text-sm">
            For Teachers, Homeschoolers & Culture Portals:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-stone-700 dark:text-stone-300">
            <li><strong>Daily Moral Lesson:</strong> Automatically delivers a fresh, timeless fable every 24 hours.</li>
            <li><strong>Claymation Artwork:</strong> High-definition visual storytelling that captures children&apos;s imagination.</li>
            <li><strong>Bilingual Support:</strong> Seamlessly switch between English and Devanagari Hindi.</li>
            <li><strong>Safe & Ad-Free:</strong> Zero commercial advertisements, third-party trackers, or sponsored content.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
