'use client';
import dynamic from 'next/dynamic';

const AIChatFAB = dynamic(() => import('./AIChatFAB'), { ssr: false });

export default function AIChatFABWrapper(props: {
  userId: string;
  tradition: string;
  userName: string;
  isGuest: boolean;
}) {
  return <AIChatFAB {...props} />;
}
