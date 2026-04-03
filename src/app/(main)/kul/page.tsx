import KulClient from './KulClient';
import { getKulPageData } from './kul-data';

export default async function KulPage() {
  const data = await getKulPageData();
  return (
    <KulClient {...data} view="hub" />
  );
}
