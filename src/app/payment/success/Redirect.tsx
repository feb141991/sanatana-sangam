'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessRedirect({ sub }: { sub: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
