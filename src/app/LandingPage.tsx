'use client';

import Link from 'next/link';
import { Users, MapPin, BookOpen, Heart, Star, ArrowRight, Globe, Flame } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const features = [
  {
    icon:  Users,
    title: 'Mandali',
    desc:  'Find your local Sanatani community. Connect with people in your city who share your dharma.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon:  BookOpen,
    title: 'Vichaar Sabha',
    desc:  'Deep discussions on dharma, shastra, and modern life. Ask questions, share wisdom.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon:  MapPin,
    title: 'Tirtha Map',
    desc:  'Discover mandirs, pandits, and events near you — anywhere in the world.',
    color: 'bg-red-50 text-red-700',
  },
  {
    icon:  Flame,
    title: 'Sahaj Bhakti',
    desc:  'Join thousands in live aarti, bhajan baithaks, and pravachans — together, in real time.',
    color: 'bg-yellow-50 text-yellow-600',
  },
];

const stats = [
  { label: 'Sanatani Worldwide',  value: '1.2B+' },
  { label: 'Diaspora Communities', value: '100+' },
  { label: 'Traditions Welcomed',  value: 'All'  },
  { label: 'Cost to Join',         value: 'Free' },
];

const testimonials = [
  {
    quote: 'Finally — a place where I can find a local satsang group AND debate Advaita Vedanta.',
    name:  'Priya M.',
    city:  'Leicester, UK',
    devata: '🪷',
  },
  {
    quote: "As a second-generation Hindu in Toronto, I'd lost my connection. Sanatana Sangam brought it back.",
    name:  'Arjun S.',
    city:  'Toronto, Canada',
    devata: '🦚',
  },
  {
    quote: 'The Tirtha Map found a mandir 5 minutes from my house I never knew existed.',
    name:  'Meera K.',
    city:  'Sydney, Australia',
    devata: '⚔️',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 px-4 pt-4">
        <div className="glass-panel-strong max-w-6xl mx-auto px-4 h-16 rounded-[1.85rem] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-display font-bold text-lg text-gray-900">
              Sanatana <span className="text-gradient">Sangam</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="glass-button-primary px-4 py-2 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity shadow-sm">
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center fade-in">
        <div className="glass-chip inline-flex items-center gap-2 text-orange-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <Globe size={14} />
          <span>The Global Home for 1.2 Billion Sanatani</span>
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Your dharma deserves{' '}
          <span className="text-gradient">a real home.</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          A living digital sabha — where a student in Leicester finds a satsang group
          three streets away, and a grandmother in Mauritius debates Advaita with a
          scholar in California.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup"
            className="glass-button-primary flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-full hover:opacity-90 transition-opacity text-lg shadow-lg">
            Join Your Mandali
            <ArrowRight size={18} />
          </Link>
          <Link href="/login"
            className="glass-button-secondary flex items-center gap-2 px-8 py-4 text-gray-700 font-semibold rounded-full transition-colors text-lg">
            Sign In
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Free forever. No ads. No politics. Just dharma.
        </p>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-panel rounded-2xl p-5 text-center shadow-card">
              <div className="font-display text-3xl font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Five pillars of your <span className="text-gradient">digital tirtha</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Everything a Sanatani needs — community, knowledge, bhakti, and connection — in one sacred space.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-panel rounded-2xl p-6 shadow-card card-hover">
              <div className={`inline-flex p-3 rounded-xl mb-4 ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-xl text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">From the community</h2>
            <p className="text-gray-500">Real voices from Sanatani worldwide</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-panel rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-5 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg">{t.devata}</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <BrandMark size="lg" className="mx-auto mb-6" />
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-5">Your Mandali is waiting.</h2>
        <p className="text-gray-500 mb-8 text-lg">Join thousands of Sanatani who have already found their community.</p>
        <Link href="/signup"
          className="glass-button-primary inline-flex items-center gap-2 px-10 py-4 text-white font-semibold rounded-full hover:opacity-90 transition-opacity text-lg shadow-lg">
          <Heart size={18} />
          Begin Your Journey
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4">
        <div className="glass-panel max-w-6xl mx-auto px-4 py-5 rounded-[1.85rem] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span>Sanatana Sangam — सनातन संगम</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/about"   className="hover:text-gray-700 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/guidelines" className="hover:text-gray-700 transition-colors">Guidelines</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
          <div>Built with 🙏 for the global Sanatani community</div>
        </div>
      </footer>

    </div>
  );
}
