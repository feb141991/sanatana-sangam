import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Admin',
  robots: { index: false, follow: true },
};

// Admin portal — standalone layout (no main app navigation chrome)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
