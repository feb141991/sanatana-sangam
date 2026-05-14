import { notFound } from 'next/navigation';
import { getKathaById } from '@/lib/katha-library';
import KathaReaderClient from './KathaReaderClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KathaReaderPage({ params }: Props) {
  const { id } = await params;
  const katha = getKathaById(id);
  if (!katha) notFound();

  return <KathaReaderClient katha={katha} />;
}
