import Link from 'next/link';
import { Badge, Card, SectionHeading } from '@/components/ui';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';

export default function BhaktiPage() {
  return (
    <div className="fade-in space-y-5">
      <Card className="rounded-[1.9rem] px-4 py-5 md:rounded-[2rem] md:px-7 md:py-7 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, color-mix(in srgb, var(--brand-secondary) 22%, white), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 10%, white), transparent 70%)',
          }}
        />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-gray-900">Sahaj Bhakti</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              A quieter devotional space for chant, listening, and remembrance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/bhakti/mala" className="rounded-full border border-[color:var(--brand-primary-soft)] bg-white/85 px-4 py-2 text-sm font-semibold text-[color:var(--brand-primary-strong)] transition hover:bg-white">
              Mala
            </Link>
            <Link href="/bhakti/zen" className="rounded-full border border-[color:var(--brand-primary-soft)] bg-white/85 px-4 py-2 text-sm font-semibold text-[color:var(--brand-primary-strong)] transition hover:bg-white">
              Zen
            </Link>
            <span className="rounded-full border border-[color:var(--brand-primary-soft)] bg-white/70 px-4 py-2 text-sm font-medium text-gray-600">
              Chant catalog
            </span>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeading
            eyebrow="Practice now"
            title="Move into one devotional mode"
            description="Keep the surface light, then drop into a focused practice mode."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/bhakti/mala" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-white/80 px-4 py-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-gray-900">Mala mode</p>
              <p className="mt-1 text-sm text-gray-600">Counter-first japa with focus, history, and return loops.</p>
            </Link>
            <Link href="/bhakti/zen" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-white/80 px-4 py-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-gray-900">Zen mode</p>
              <p className="mt-1 text-sm text-gray-600">A full-focus breath and chant space with fewer distractions.</p>
            </Link>
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Return loop" title="Keep Bhakti simple" />
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.2rem] border border-[color:var(--brand-primary-soft)] bg-white/75 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Read, sit, return</p>
              <p className="mt-1 text-sm text-gray-600">Move from Pathshala into Zen or Mala, then come back the next day without friction.</p>
            </div>
            <div className="rounded-[1.2rem] border border-[color:var(--brand-primary-soft)] bg-white/75 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Listen while you sit</p>
              <p className="mt-1 text-sm text-gray-600">Short chants now work here, and bigger devotional listening can grow around them later.</p>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <SectionHeading
          eyebrow="Chants"
          title="Play a chant now"
          description="Keep one chant running while you move into Zen or Mala."
          actions={<Badge tone="accent" className="px-4 py-2 text-sm">Temple feel</Badge>}
        />

        <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <ChantAudioPlayer title="Bhakti chant shelf" />
          <div className="grid gap-3 md:grid-cols-2">
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
              <p className="mt-3 text-xs font-semibold text-[color:var(--brand-primary)]">Open details →</p>
            </a>
          ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
