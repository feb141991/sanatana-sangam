export default function BhaktiPage() {
  return (
    <div className="fade-in space-y-5">
      <section className="glass-panel rounded-[2rem] px-5 py-6 md:px-7 md:py-7 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, color-mix(in srgb, var(--brand-secondary) 22%, white), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 10%, white), transparent 70%)',
          }}
        />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 clay-pill text-xs text-gray-700">
            <span>Bhakti preview</span>
            <span className="text-[color:var(--brand-primary)] font-semibold">Phase 3 shape</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-gray-900">Sahaj Bhakti</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              A quieter devotional space for chant, listening, and remembrance.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
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
      </section>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[1.8rem] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            Coming first
          </p>
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
        </div>

        <div className="glass-panel rounded-[1.8rem] px-5 py-5">
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p>Pathshala for study.</p>
            <p>Panchang for sacred time.</p>
            <p>Kul for family devotion later.</p>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-primary-soft)] bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--brand-primary-strong)]">
            Coming in a deeper devotional release
          </div>
        </div>
      </section>
    </div>
  );
}
