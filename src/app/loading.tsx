'use client';

import { useEffect, useState } from 'react';
import BrandMark from '@/components/BrandMark';

export default function Loading() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-[#0E0E0F] transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Pulse animation wrapper */}
      <div className="loading-pulse">
        <BrandMark size="lg" className="text-[#C5A059]" />
      </div>
      <div className="mt-2 text-[13px] uppercase tracking-widest text-[#C5A059]/40">
        Shoonaya
      </div>
    </div>
  );
}
