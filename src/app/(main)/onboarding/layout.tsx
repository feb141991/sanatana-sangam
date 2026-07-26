import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shoonaya Onboarding',
  robots: { index: false, follow: true },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
