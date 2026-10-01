"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type TraditionItem = {
  key: "hindu" | "sikh" | "buddhist" | "jain";
  tabLabel: string;
  name: string;
  slug: string;
  badge: string;
  color: string;
  glowColor: string;
  bgSoft: string;
  borderSoft: string;
  date: string;
  script: string;
  scriptStyle?: React.CSSProperties;
  translation: string;
  source: string;
  features: string[];
  description: string;
};

const TRADITIONS: TraditionItem[] = [
  {
    key: "hindu",
    tabLabel: "🕉 Hindu",
    name: "Hindu",
    slug: "hindu",
    badge: "Sanatan Dharma · हिन्दू धर्म",
    color: "#D88A1C",
    glowColor: "rgba(216, 138, 28, 0.45)",
    bgSoft: "rgba(216, 138, 28, 0.1)",
    borderSoft: "rgba(200, 146, 74, 0.3)",
    date: "Vaishakha, Shukla Tritiya · Vikrama 2083",
    script:
      "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
    scriptStyle: {
      fontFamily:
        "'Devanagari Sangam MN', 'Noto Serif Devanagari', 'Nirmala UI', Mangal, Georgia, serif",
    },
    translation:
      '"Whenever righteousness declines and unrighteousness rises, I manifest myself anew."',
    source: "Bhagavad Gita · Chapter 4, Verse 7",
    features: [
      "Daily Shloka",
      "Vedic Panchang",
      "18 Puranas",
      "12 Jyotirlingas",
      "Sanskrit Library",
      "Temple Directory",
    ],
    description:
      "From the Vedas to the Upanishads, from daily puja to grand utsavs, Shoonaya gives every Hindu a digital home for their spiritual life, wherever they are in the world.",
  },
  {
    key: "sikh",
    tabLabel: "ੴ Sikh",
    name: "Sikh",
    slug: "sikh",
    badge: "Sikhi · ਸਿੱਖ ਧਰਮ",
    color: "#1B5E8B",
    glowColor: "rgba(27, 94, 139, 0.45)",
    bgSoft: "rgba(27, 94, 139, 0.1)",
    borderSoft: "rgba(91, 164, 212, 0.3)",
    date: "Vaishakha, Shukla Tritiya · Nanakshahi 558",
    script: "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ ॥",
    scriptStyle: {
      fontFamily:
        "'Gurmukhi MN', 'Noto Sans Gurmukhi', 'Nirmala UI', Raavi, sans-serif",
    },
    translation:
      '"O my mind, you are the very form of Divine Light: recognise your own origin."',
    source: "Guru Granth Sahib Ji · Ang 441",
    features: [
      "Nitnem Banis",
      "Gurpurab Calendar",
      "Gurdwara Finder",
      "Kirtan Library",
      "Ardas Reminders",
      "Hukamnama Daily",
    ],
    description:
      "Track daily nitnem, get Gurpurab reminders, find your nearest Gurdwara, and connect with the global Sikh sangat in one shared place, infused with the spirit of Seva.",
  },
  {
    key: "buddhist",
    tabLabel: "☸ Buddhist",
    name: "Buddhist",
    slug: "buddhist",
    badge: "Buddhism · बौद्ध धर्म",
    color: "#8B2D3E",
    glowColor: "rgba(139, 45, 62, 0.45)",
    bgSoft: "rgba(139, 45, 62, 0.1)",
    borderSoft: "rgba(212, 130, 122, 0.3)",
    date: "Vaishakha, Shukla Tritiya · Buddhist Era 2569",
    script: "Manopubbaṅgamā dhammā, manoseṭṭhā manomayā.",
    scriptStyle: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontStyle: "italic",
    },
    translation:
      '"Mind is the forerunner of all actions; all things arise from mind, fashioned by mind."',
    source: "Dhammapada · Verse 1",
    features: [
      "Dhammapada",
      "Meditation Timer",
      "Buddhist Calendar",
      "Pali Canon",
      "Sangha Finder",
      "Buddha Purnima",
    ],
    description:
      "Walk the Eightfold Path with daily reflections from the Dhammapada, guided meditation sessions, and a global Buddhist community united in the pursuit of liberation.",
  },
  {
    key: "jain",
    tabLabel: "☮ Jain",
    name: "Jain",
    slug: "jain",
    badge: "Jainism · जैन धर्म",
    color: "#2A6B4A",
    glowColor: "rgba(42, 107, 74, 0.45)",
    bgSoft: "rgba(42, 107, 74, 0.1)",
    borderSoft: "rgba(106, 185, 154, 0.3)",
    date: "Vaishakha, Shukla Tritiya · Vira Nirvana Samvat 2552",
    script: "परस्परोपग्रहो जीवानाम् ।",
    scriptStyle: {
      fontFamily:
        "'Devanagari Sangam MN', 'Noto Serif Devanagari', 'Nirmala UI', Mangal, Georgia, serif",
    },
    translation: '"The function of souls is to serve one another."',
    source: "Tattvartha Sutra · 5.21 · Umasvati",
    features: [
      "Agama Texts",
      "Paryushana",
      "Tirtha Locations",
      "Pratikraman Guide",
      "Samayasara",
      "Vrat Tracker",
    ],
    description:
      "Explore Jain Agamas, track Paryushana observances, locate sacred Tirthas, and practice Ahimsa daily, guided by the eternal teachings of the 24 Tirthankaras.",
  },
];

export function TraditionsSectionClient() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const intervalTime = 50;
    const duration = 6000;
    const step = (intervalTime / duration) * 100;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((curr) => (curr + 1) % TRADITIONS.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const handleSelectTradition = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const activeTrad = TRADITIONS[activeIndex];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
          Choose Your Tradition
        </p>
        <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl text-[var(--text-cream)]">
          Four paths, one Sangam.
        </h2>
        <p className="text-base leading-8 text-[var(--text-muted-warm)] sm:text-lg">
          Shoonaya honours the full breadth of dharmic wisdom across Hindu, Sikh,
          Buddhist, and Jain. Each tradition has its own dedicated experience
          within one shared community.
        </p>
      </div>

      {/* Tabs Selector Bar with Sliding Indicator and Progress Fill */}
      <div
        className="relative mx-auto mb-12 sm:mb-16 w-fit max-w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          role="tablist"
          aria-label="Choose tradition"
          className="relative flex items-center rounded-full p-1 border border-[rgba(200,160,110,0.28)] bg-[rgba(250,246,239,0.7)] backdrop-blur-xl shadow-[0_8px_32px_rgba(100,60,20,0.08)]"
        >
          {TRADITIONS.map((trad, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={trad.key}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleSelectTradition(idx)}
                className={`relative z-10 rounded-full px-4 sm:px-7 py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  isActive
                    ? "text-white"
                    : "text-[var(--text-muted-warm)] hover:text-[var(--text-cream)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="traditionIndicatorPill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: trad.color,
                      boxShadow: `0 2px 14px ${trad.glowColor}`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
                <span className="relative z-10">{trad.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Progress bar directly underneath */}
        <div className="mx-auto mt-2.5 h-[2px] w-full max-w-[85%] overflow-hidden rounded-full bg-[rgba(200,155,100,0.2)]">
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: activeTrad.color,
            }}
          />
        </div>
      </div>

      {/* Two-Column Open Panel (NO BOX, sitting directly on the canvas) */}
      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-10 md:gap-14 lg:gap-20 items-center min-h-[420px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Column: Ambient Glow & Sacred Symbol */}
        <div className="relative flex items-center justify-center h-56 sm:h-72 lg:h-80">
          <div
            className="absolute h-56 w-56 sm:h-64 sm:w-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
            style={{ backgroundColor: activeTrad.color }}
          />

          <div className="relative z-10 flex items-center justify-center">
            {activeTrad.key === "hindu" && (
              <span
                className="text-[130px] sm:text-[180px] lg:text-[200px] leading-none select-none transition-all duration-300"
                style={{
                  color: activeTrad.color,
                  textShadow: `0 0 48px ${activeTrad.glowColor}`,
                  fontFamily:
                    "'Devanagari Sangam MN', 'Noto Serif Devanagari', Georgia, serif",
                }}
              >
                ॐ
              </span>
            )}

            {activeTrad.key === "sikh" && (
              <span
                className="text-[110px] sm:text-[150px] lg:text-[170px] leading-none select-none transition-all duration-300"
                style={{
                  color: activeTrad.color,
                  textShadow: `0 0 48px ${activeTrad.glowColor}`,
                  fontFamily:
                    "'Gurmukhi MN', 'Noto Sans Gurmukhi', sans-serif",
                }}
              >
                ੴ
              </span>
            )}

            {activeTrad.key === "buddhist" && (
              <svg
                className="h-40 w-40 sm:h-48 sm:w-48 transition-all duration-300"
                viewBox="0 0 200 200"
                fill="none"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  stroke="#D4827A"
                  strokeWidth="7"
                  fill="none"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="18"
                  stroke="#D4827A"
                  strokeWidth="5"
                  fill="none"
                />
                <circle cx="100" cy="100" r="6" fill="#D4827A" />
                <g stroke="#D4827A" strokeWidth="4" strokeLinecap="round">
                  <line x1="100" y1="18" x2="100" y2="82" />
                  <line x1="100" y1="118" x2="100" y2="182" />
                  <line x1="18" y1="100" x2="82" y2="100" />
                  <line x1="118" y1="100" x2="182" y2="100" />
                  <line x1="43" y1="43" x2="86" y2="86" />
                  <line x1="114" y1="114" x2="157" y2="157" />
                  <line x1="157" y1="43" x2="114" y2="86" />
                  <line x1="86" y1="114" x2="43" y2="157" />
                </g>
                <g fill="#D4827A">
                  <circle cx="100" cy="14" r="7" />
                  <circle cx="100" cy="186" r="7" />
                  <circle cx="14" cy="100" r="7" />
                  <circle cx="186" cy="100" r="7" />
                  <circle cx="41" cy="41" r="6" />
                  <circle cx="159" cy="159" r="6" />
                  <circle cx="159" cy="41" r="6" />
                  <circle cx="41" cy="159" r="6" />
                </g>
              </svg>
            )}

            {activeTrad.key === "jain" && (
              <svg
                className="h-40 w-40 sm:h-48 sm:w-48 transition-all duration-300"
                viewBox="0 0 200 200"
                fill="none"
              >
                <path
                  d="M100 178 C72 178 48 155 48 126 L48 82 C48 73 55 67 63 70 C65 60 73 55 82 59 L82 48 C82 38 88 32 97 32 C106 32 112 38 112 48 L112 59 C121 55 129 60 131 70 C139 67 146 73 146 82 L146 126 C146 155 128 178 100 178Z"
                  stroke="#6AB99A"
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinejoin="round"
                />
                <line
                  x1="82"
                  y1="59"
                  x2="82"
                  y2="42"
                  stroke="#6AB99A"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="112"
                  y1="59"
                  x2="112"
                  y2="42"
                  stroke="#6AB99A"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx="97"
                  cy="122"
                  r="24"
                  stroke="#6AB99A"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle cx="97" cy="122" r="7" fill="#6AB99A" />
                <g stroke="#6AB99A" strokeWidth="2" strokeLinecap="round">
                  <line x1="97" y1="98" x2="97" y2="115" />
                  <line x1="97" y1="129" x2="97" y2="146" />
                  <line x1="73" y1="122" x2="90" y2="122" />
                  <line x1="104" y1="122" x2="121" y2="122" />
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Right Column: Tradition Details */}
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4 sm:mb-5"
            style={{ color: activeTrad.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: activeTrad.color }}
            />
            {activeTrad.badge}
          </div>

          {/* Verse block with left accent border */}
          <div
            className="border-l-2 pl-5 sm:pl-6 mb-6 transition-colors duration-300"
            style={{ borderColor: activeTrad.borderSoft }}
          >
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-2">
              {activeTrad.date}
            </div>
            <div
              className="text-lg sm:text-2xl leading-relaxed text-[var(--text-cream)] mb-2"
              style={activeTrad.scriptStyle}
            >
              {activeTrad.script}
            </div>
            <div className="h-px bg-[var(--card-border)] my-3 max-w-md" />
            <div className="font-serif italic text-base sm:text-lg text-[var(--text-muted-warm)] leading-relaxed mb-2">
              {activeTrad.translation}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
              {activeTrad.source}
            </div>
          </div>

          {/* Feature pill chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {activeTrad.features.map((feat) => (
              <span
                key={feat}
                className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: activeTrad.bgSoft,
                  borderColor: activeTrad.borderSoft,
                  color: activeTrad.color,
                }}
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Description text */}
          <p className="text-sm sm:text-base leading-relaxed text-[var(--text-muted-warm)] max-w-xl">
            {activeTrad.description}
          </p>
        </div>
      </div>
    </div>
  );
}
