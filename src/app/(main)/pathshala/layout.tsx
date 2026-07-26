import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Pathshala',
  robots: { index: false, follow: true },
};

export default function PathshalaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
