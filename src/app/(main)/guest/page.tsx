import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Bell, Heart, MapPin, MessageSquare, Users } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const guestPaths = [
  {
    href: '/vichaar-sabha',
    title: 'Browse Vichaar Sabha',
    description: 'Read real questions, practical answers, and community conversations before you join.',
    icon: MessageSquare,
    badge: 'Read-only',
  },
  {
    href: '/tirtha-map',
    title: 'Open Tirtha Map',
    description: 'Find mandirs, gurudwaras, viharas, and Jain temples near you or in any city you search.',
    icon: MapPin,
    badge: 'Open access',
  },
];

const memberBenefits = [
  {
    title: 'Post and reply',
    description: 'Ask your own questions, upvote good answers, and join conversations instead of only reading them.',
    icon: MessageSquare,
  },
  {
    title: 'Find your Mandali',
    description: 'Meet nearby people on a similar path and keep up with local activity and seva.',
    icon: Users,
  },
  {
    title: 'Keep your family space',
    description: 'Build your Kul and Vansh space with family context that guests cannot create.',
    icon: Heart,
  },
  {
    title: 'Receive reminders',
    description: 'Turn on daily shloka and festival reminders once you are signed in on your own device.',
    icon: Bell,
  },
];

export default async function GuestPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  return (
    <div className="space-y-4 fade-in">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-7 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#7B1A1A] border border-white/70">
          <span>👁️</span>
          <span>Guest mode</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Explore Sanatana Sangam before you join
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl">
            Start with the two strongest guest experiences: community wisdom in Vichaar Sabha and nearby sacred places in Tirtha Map.
            Join free whenever you want to post, reply, build your Kul, or receive reminders.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            'Read real questions before making an account.',
            'Find mandirs and sacred places right away.',
            'Join only when you want family space, reminders, and participation.',
          ].map((item) => (
            <div key={item} className="rounded-full bg-white/70 px-4 py-2 text-sm text-gray-700 border border-white/70">
              {item}
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              eyebrow: 'Browse',
              title: 'Read before committing',
              description: 'Guest mode lets you absorb the tone and quality of the app before giving anything back.',
            },
            {
              eyebrow: 'Discover',
              title: 'Find sacred places nearby',
              description: 'Tirtha discovery stays open so the app can help immediately, even before signup.',
            },
            {
              eyebrow: 'Join later',
              title: 'Keep the next step simple',
              description: 'When you’re ready, join to post, reply, build your Kul, and turn on reminders.',
            },
          ].map((item) => (
            <div key={item.title} className="clay-card rounded-[1.4rem] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{item.eyebrow}</p>
              <p className="font-semibold text-gray-900 mt-2">{item.title}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {guestPaths.map(({ href, title, description, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="glass-panel group rounded-[1.5rem] p-4 sm:p-5 flex items-start gap-4 hover:-translate-y-0.5 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-sacred text-white flex items-center justify-center shadow-sacred flex-shrink-0">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="font-semibold text-gray-900">{title}</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/70 border border-white/70 text-gray-600">
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
              <ArrowRight size={18} className="text-[#7B1A1A] mt-1 group-hover:translate-x-0.5 transition" />
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="glass-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
          >
            Join free
          </Link>
          <Link
            href="/login"
            className="glass-button-secondary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[#7B1A1A] font-semibold"
          >
            Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Guest mode stays intentionally calm: read and discover first, then join when you want to participate.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {memberBenefits.map(({ title, description, icon: Icon }) => (
          <div key={title} className="glass-panel rounded-[1.5rem] p-4 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white/80 border border-white/70 text-[#7B1A1A] flex items-center justify-center">
              <Icon size={18} />
            </div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
