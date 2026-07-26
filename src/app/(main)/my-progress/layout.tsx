import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Progress',
  robots: { index: false, follow: true },
};

export default function MyProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
