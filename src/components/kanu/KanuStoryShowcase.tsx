import Link from 'next/link';
import Image from 'next/image';
import {
  KANU_STORY_REVIEW_NOTES,
  KANU_STORY_SHOWCASE,
  getPathshalaGitaStoryHref,
} from '@/lib/kanu-story';
import { getPathshalaSectionHref } from '@/lib/pathshala-links';

interface KanuStoryShowcaseProps {
  embedded?: boolean;
}

export default function KanuStoryShowcase({ embedded = false }: KanuStoryShowcaseProps) {
  return (
    <div className={`space-y-5 ${embedded ? '' : 'pb-8'}`}>
      <section className="kanu-hero-shell rounded-[2rem] p-5 md:p-7">
        <div className="kanu-hero-grid">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Bal Krishna reboot
              </p>
              <h1 className="kanu-display text-3xl md:text-5xl text-white">
                We are now designing Kanu from real Bal Krishna concept art, not placeholder avatar shapes.
              </h1>
              <p className="max-w-2xl text-sm md:text-base leading-relaxed text-white/82">
                This surface turns the strongest concept images into a live review board inside Pathshala.
                The goal is simple: lock the face, soften the child energy, and build toward a premium sacred
                character who belongs in the app.
              </p>
            </div>

            <div className="kanu-chip-row">
              <span className="kanu-chip">Face first</span>
              <span className="kanu-chip">Sacred child</span>
              <span className="kanu-chip">Premium, not toy-like</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {!embedded && (
                <Link href={getPathshalaGitaStoryHref()} className="kanu-primary-cta">
                  Open inside Pathshala
                </Link>
              )}
              <Link href={getPathshalaSectionHref('hindu', 'gita')} className="kanu-secondary-cta">
                Back to Bhagavad Gita
              </Link>
            </div>
          </div>

          <div className="kanu-hero-art-frame">
            <Image
              src="/kanu/bal-krishna-flute-hero.png"
              alt="Bal Krishna concept hero standing with a flute in a forest"
              className="kanu-hero-art"
              fill
              priority
              sizes="(max-width: 960px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="clay-card rounded-[1.8rem] px-5 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
              Current winners
            </p>
            <h2 className="kanu-heading text-2xl text-gray-900 mt-2">
              The first concept batch gave us a believable face direction
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              These are not final assets yet, but they are strong enough to guide the reboot. The portrait anchor
              is the strongest face. The flute hero is the best body rhythm. The softness pass carries the emotional
              safety we want to preserve.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {KANU_STORY_SHOWCASE.map((item) => (
              <article key={item.id} className="kanu-card">
                <div className="kanu-card-image-wrap">
                  <Image src={item.imageSrc} alt={item.alt} className="kanu-card-image" fill sizes="(max-width: 1200px) 50vw, 26vw" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
                    {item.subtitle}
                  </p>
                  <h3 className="kanu-heading text-lg text-gray-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="glass-panel rounded-[1.8rem] px-5 py-5 border border-white/65">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
              Reboot notes
            </p>
            <div className="mt-4 space-y-3">
              {KANU_STORY_REVIEW_NOTES.map((note) => (
                <div key={note} className="kanu-note">
                  <span className="kanu-note-dot" />
                  <p className="text-sm leading-relaxed text-gray-700">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[1.8rem] px-5 py-5 border border-white/65">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
              Expression continuity
            </p>
            <div className="kanu-expression-sheet mt-4">
              <Image
                src="/kanu/bal-krishna-expression-sheet.png"
                alt="Bal Krishna expression sheet showing wonder, mischief, reassurance, compassion, quiet joy, divine calm, listening, and delight"
                className="kanu-expression-image"
                fill
                sizes="(max-width: 960px) 100vw, 30vw"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              The expression sheet is helpful for consistency checks, but the face still needs one more refinement
              pass before we can lock it as the final hero.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
