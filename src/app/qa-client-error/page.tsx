import { notFound } from 'next/navigation';
import ClientErrorProbe from './ClientErrorProbe';

export default function ClientErrorProbePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main>
      <h1>Client error telemetry QA</h1>
      <ClientErrorProbe />
    </main>
  );
}
