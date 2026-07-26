import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Transaction',
  robots: { index: false, follow: true },
};

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
