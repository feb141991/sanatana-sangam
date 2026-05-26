'use client';

import BrandMark from '@/components/BrandMark';

export default function MainLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0E0E0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="loading-pulse">
        <BrandMark size="lg" />
      </div>
      <p
        style={{
          marginTop: '16px',
          fontSize: '11px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(197,160,89,0.4)',
        }}
      >
        Shoonaya
      </p>
    </div>
  );
}
