import Link from 'next/link';
import MvpHero from '@/components/layout/MvpHero';
import { Card, SectionHeading } from '@/components/ui';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { APPROVED_DEVOTIONAL_TRACKS } from '@/lib/devotional-audio';

export default function BhaktiPage() {
  return (
    <div className="fade-in space-y-5">
      <MvpHero
        theme="bhakti"
        title="Sahaj Bhakti"
        description="A quieter devotional shell for chant, listening, remembrance, and full-focus practice."
        chips={['Mala', 'Zen', 'Chant shelf']}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/bhakti/mala" className="rounded-full border border-black/5 bg-white/92 px-4 py-2 text-sm font-semibold text-[color:var(--brand-primary-strong)] transition hover:bg-white">
              Mala
            </Link>
            <Link href="/bhakti/zen" className="rounded-full border border-black/5 bg-white/92 px-4 py-2 text-sm font-semibold text-[color:var(--brand-primary-strong)] transition hover:bg-white">
              Zen
            </Link>
          </div>
        }
      />

      <section className="grid gap-4">
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
                  {track.creator}
                </span>
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 text-[11px] font-medium text-gray-600">
                  {track.durationLabel}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-[color:var(--brand-primary)]">Open source</p>
            </a>
          ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
