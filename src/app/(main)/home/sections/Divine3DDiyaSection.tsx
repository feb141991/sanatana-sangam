'use client';

import dynamic from 'next/dynamic';

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
      <DivineDiyaCanvas />
    </section>
  );
}
