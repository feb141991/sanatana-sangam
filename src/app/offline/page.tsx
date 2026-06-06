// Served by the service worker when the user is offline and no cached page exists.
export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0c0a06', color: '#faf6ef', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 320 }}>
          {/* Sacred flame icon */}
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 24 }}>🪔</div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600, color: '#C5A059', margin: '0 0 12px' }}>
            You&apos;re offline
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(250,246,239,0.60)', margin: '0 0 32px' }}>
            The dharmic path continues even without a connection. Pages you&apos;ve visited recently are still available.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(197,160,89,0.15)',
              border: '1px solid rgba(197,160,89,0.35)',
              borderRadius: 100,
              color: '#C5A059',
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 28px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Try again
          </button>

          <p style={{ marginTop: 48, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(197,160,89,0.35)' }}>
            Shoonaya
          </p>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-reload when connection returns
              window.addEventListener('online', () => window.location.reload());
            `,
          }}
        />
      </body>
    </html>
  );
}
