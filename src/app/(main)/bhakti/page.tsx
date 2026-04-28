import BhaktiClient from './BhaktiClient';
import { getTodayShloka } from '@/lib/shlokas';

export default function BhaktiPage() {
  const shloka = getTodayShloka();
  return <BhaktiClient shloka={shloka} />;
}
