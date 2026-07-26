import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Account',
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
