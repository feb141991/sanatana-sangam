import type { Metadata } from 'next';
import '@/app/globals.css';
import { Inter, Cormorant_Garamond } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-next',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${cormorant.variable} min-h-screen bg-transparent font-sans antialiased`}
      style={{ margin: 0, padding: 0 }}
    >
      {children}
    </div>
  );
}
