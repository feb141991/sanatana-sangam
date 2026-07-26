import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Home',
  robots: { index: false, follow: true },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
