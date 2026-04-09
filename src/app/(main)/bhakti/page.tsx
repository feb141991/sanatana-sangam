import Link from 'next/link';
import { Badge, Card, SectionHeading } from '@/components/ui';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';

export default function BhaktiPage() {
  return (
    <div className="fade-in space-y-5">
      <Card className="rounded-[1.7rem] px-4 py-5 md:rounded-[2rem] md:px-7 md:py-7 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, color-mix(in srgb, var(--brand-secondary) 22%, white), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 10%, white), transparent 70%)',
          }}
        />
        <div className="relative space-y-4">
          <div className="hidden sm:inline-flex items-center gap-2 clay-pill text-xs text-gray-700">
            <span>Bhakti preview</span>
            <span className="text-[color:var(--brand-primary)] font-semibold">Phase 3 shape</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-gray-900">Sahaj Bhakti</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              A quieter devotional space for chant, listening, and remembrance.
            </p>
          </div>
          <div className="hidden md:grid gap-3 md:grid-cols-3">
            <div className="clay-card rounded-[1.5rem] px-4 py-4 text-left">
              <p className="text-sm font-semibold text-gray-900">Daily remembrance</p>
              <p className="text-xs leading-relaxed text-gray-600 mt-2">
                Short chant starts and calm devotional moments.
              </p>
            </div>
            <div className="clay-card rounded-[1.5rem] px-4 py-4 text-left">
              <p className="text-sm font-semibold text-gray-900">Live and shared later</p>
              <p className="text-xs leading-relaxed text-gray-600 mt-2">
                Bhajan baithaks and aarti can come here once audio is ready.
              </p>
            </div>
            <div className="clay-card rounded-[1.5rem] px-4 py-4 text-left">
              <p className="text-sm font-semibold text-gray-900">Built for calm</p>
              <p className="text-xs leading-relaxed text-gray-600 mt-2">
                Kept simple, gentle, and elder-friendly.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeading
            eyebrow="Coming first"
            title="The devotional shape we are building"
            description="These are the first Bhakti promises we can make well before turning this into a larger streaming or live-room surface."
          />
          <div className="mt-4 space-y-3">
            {[
              'A simple devotional home with chant, read, and return paths',
              'Rights-safe mantra and chant starter pack before any larger bhajan library',
              'Mala mode and Zen mode as calmer practice entry points',
              'Later, live bhakti rooms only after audio trust, moderation, and rights are in place',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--brand-primary)]" />
                <p className="text-sm leading-relaxed text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Practice now" title="Enter a calmer practice mode" />
          <div className="mt-4 space-y-3">
            <Link href="/bhakti/zen" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-white/80 px-4 py-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-gray-900">Zen mode</p>
              <p className="mt-1 text-sm text-gray-600">A calmer reading, breath, and chant surface.</p>
            </Link>
            <Link href="/bhakti/mala" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-white/80 px-4 py-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-gray-900">Mala mode</p>
              <p className="mt-1 text-sm text-gray-600">Count, save, filter, and revisit your japa sessions.</p>
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.2rem] border border-[color:var(--brand-primary-soft)] bg-white/75 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Return loop</p>
              <p className="mt-1 text-sm text-gray-600">Read in Pathshala, sit in Zen, count in Mala, and come back gently tomorrow.</p>
            </div>
            <div className="rounded-[1.2rem] border border-[color:var(--brand-primary-soft)] bg-white/75 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Audio direction</p>
              <p className="mt-1 text-sm text-gray-600">Rights-safe chant support comes first here, while authoritative Gita audio remains a separate trust-first lane.</p>
            </div>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-primary-soft)] bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--brand-primary-strong)]">
            Coming in a deeper devotional release
          </div>
        </Card>
      </section>

      <Card>
        <SectionHeading
          eyebrow="Audio starter pack"
          title="Rights-safe chant catalog"
          description="We are starting with clearly sourced devotional audio references first. In-app playback comes after the shared audio layer and attribution flow are ready."
          actions={<Badge tone="accent" className="px-4 py-2 text-sm">Source-first audio</Badge>}
        />

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {DEVOTIONAL_STARTER_TRACKS.map((track) => (
            <a
              key={track.id}
              href={track.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-white/80 px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{track.title}</p>
                <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-primary-strong)]">
                  {track.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{track.note}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 text-[11px] font-medium text-gray-600">
                  {track.sourceName}
                </span>
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 text-[11px] font-medium text-gray-600">
                  {track.licenseLabel}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-[color:var(--brand-primary)]">Open source page →</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
