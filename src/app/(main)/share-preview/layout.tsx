import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Preview',
  robots: { index: false, follow: true },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
