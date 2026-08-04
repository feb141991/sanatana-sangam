import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tirtha Map | Find Temples, Gurdwaras & Sacred Places',
  description: 'Discover nearby mandirs, gurdwaras, viharas, Jain temples, and other sacred places with Shoonaya Tirtha Map.',
  alternates: {
    canonical: 'https://www.shoonaya.com/tirtha-map',
  },
};

export default function TirthaMapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
