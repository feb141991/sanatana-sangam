'use client';

import dynamic from 'next/dynamic';
import { OptionalSectionBoundary } from '@/components/monitoring/OptionalSectionBoundary';

const DivineDiyaCanvas = dynamic(() => import('@/components/canvas/DivineDiyaCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-[2.5rem] bg-slate-900/60 border border-amber-500/20 animate-pulse flex items-center justify-center text-xs font-bold text-amber-500/60">
      Loading 3D Flame Sanctuary...
    </div>
  ),
});

export default function Divine3DDiyaSection() {
  return (
    <section className="my-6">
      {/* Purely decorative -- Home is fully usable without it. A defect
          here (see the react-reconciler/scheduler chunk-duplication
          incidents ce_ce629613 and siblings) must never take the whole
          page down, so it gets its own boundary rather than relying only
          on the underlying bundling fix. */}
      <OptionalSectionBoundary name="divine-diya-canvas">
        <DivineDiyaCanvas />
      </OptionalSectionBoundary>
    </section>
  );
}
