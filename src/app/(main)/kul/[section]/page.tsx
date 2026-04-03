import { notFound } from 'next/navigation';
import KulClient from '../KulClient';
import { getKulPageData } from '../kul-data';
import { isKulSectionView } from '../sections';

export default async function KulSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isKulSectionView(section)) {
    notFound();
  }

  const data = await getKulPageData();

  return <KulClient {...data} view={section} />;
}
