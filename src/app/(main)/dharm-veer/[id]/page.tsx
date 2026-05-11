import { DHARM_VEERS } from '@/lib/dharm-veer';
import DharmVeerClient from './DharmVeerClient';
import { notFound } from 'next/navigation';

export default async function DharmVeerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hero = DHARM_VEERS.find(h => h.id === id);
  if (!hero) notFound();

  return <DharmVeerClient hero={hero} />;
}
