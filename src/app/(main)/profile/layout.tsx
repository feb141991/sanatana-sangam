import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Profile',
  robots: { index: false, follow: true },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
