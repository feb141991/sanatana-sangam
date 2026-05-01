import Link from 'next/link';

export default function SevaPage() {
  return (
    <main className="divine-home-shell pb-28">
      <section className="divine-darshan-card">
        <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
        <span className="divine-chip">Coming soon</span>
        <h1 className="divine-darshan-title">Donate / Seva</h1>
        <p className="divine-card-copy">
          This will become the verified seva hub for temples, cow seva, annadaan and community causes.
        </p>
        <Link href="/home" className="divine-seva-cta self-start">
          Back home
        </Link>
      </section>
    </main>
  );
}
