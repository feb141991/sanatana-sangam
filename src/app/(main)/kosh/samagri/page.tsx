import type { Metadata } from 'next';
import { getAllSacredProducts } from '@/lib/samagri/resolver';
import SamagriPrototypeClient from './SamagriPrototypeClient';

export const metadata: Metadata = {
  title: 'Sacred Provisions & Altar Samagri | Shoonaya Kosh',
  description: 'Pure, authentic sacred provisions: certified Gangotri Ganga Jal, charcoal-free dhoop, unadulterated Bhimseni camphor, and curated pooja boxes.',
};

export default function SamagriPage() {
  const products = getAllSacredProducts();
  return <SamagriPrototypeClient products={products} />;
}
