import Link from 'next/link';
import { Card, SectionHeading } from '@/components/ui';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { APPROVED_DEVOTIONAL_TRACKS } from '@/lib/devotional-audio';

export default function BhaktiPage() {
  return (
    <div className="fade-in space-y-5">
      <Card className="rounded-[1.9rem] px-4 py-5 md:rounded-[2rem] md:px-7 md:py-7 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, rgba(212, 166, 70, 0.14), transparent 55%), linear-gradient(180deg, rgba(212, 166, 70, 0.08), transparent 70%)',
          }}
        />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <h1 className="type-screen-title">Sahaj Bhakti</h1>
            <p className="type-body max-w-2xl">
              A quieter devotional space for chant, listening, and remembrance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/bhakti/mala" className="rounded-full border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-2 type-chip text-[color:var(--brand-primary-strong)] transition hover:bg-[color:var(--surface-soft)]">
              Mala
            </Link>
            <Link href="/bhakti/zen" className="rounded-full border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-2 type-chip text-[color:var(--brand-primary-strong)] transition hover:bg-[color:var(--surface-soft)]">
              Zen
            </Link>
            <span className="rounded-full border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-2 type-chip text-[color:var(--brand-muted)]">
              Chant catalog
            </span>
          </div>
        </div>
      </Card>

      <section className="grid gap-4">
        <Card>
          <SectionHeading
            eyebrow="Practice now"
            title="Move into one devotional mode"
            description="Keep the surface light, then drop into a focused practice mode."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/bhakti/mala" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-4 transition hover:bg-[color:var(--surface-soft)]">
              <p className="type-card-heading">Mala mode</p>
              <p className="type-body mt-1">Counter-first japa with focus, history, and return loops.</p>
            </Link>
            <Link href="/bhakti/zen" className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-4 transition hover:bg-[color:var(--surface-soft)]">
              <p className="type-card-heading">Zen mode</p>
              <p className="type-body mt-1">A full-focus breath and chant space with fewer distractions.</p>
            </Link>
          </div>
        </Card>

      </section>

      <Card>
        <SectionHeading
          eyebrow="Chants"
          title="Play a chant now"
          description="Keep one chant running while you move into Zen or Mala."
        />

        <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <ChantAudioPlayer title="Bhakti chant shelf" />
          <div className="grid gap-3 md:grid-cols-2">
          {APPROVED_DEVOTIONAL_TRACKS.map((track) => (
            <a
              key={track.id}
              href={track.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[1.4rem] border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-accent)] px-4 py-4 transition hover:bg-[color:var(--surface-soft)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="type-card-heading">{track.title}</p>
                <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 type-chip text-[color:var(--brand-primary-strong)]">
                  {track.type}
                </span>
              </div>
              <p className="type-body mt-2">{track.note}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 type-chip text-[color:var(--brand-muted)]">
                  {track.creator}
                </span>
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 type-chip text-[color:var(--brand-muted)]">
                  {track.durationLabel}
                </span>
              </div>
              <p className="type-micro mt-3 text-[color:var(--brand-primary)]">Open source</p>
            </a>
          ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
