import { notFound } from 'next/navigation';
import VratClient from './VratClient';
import { getVratData } from '@/lib/vrat-data';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VratPage({ params }: Props) {
  const p = await params;
  const decodedId = decodeURIComponent(p.id);
  const vratData = getVratData(decodedId);

  if (!vratData) {
    notFound();
  }

  return <VratClient vrat={vratData} originalSlug={decodedId} />;
}
