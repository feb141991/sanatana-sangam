import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Settings',
  robots: { index: false, follow: true },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
