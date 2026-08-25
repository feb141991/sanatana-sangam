'use client';

import { OPEN_PRIVACY_CHOICES_EVENT } from '@/lib/web-consent';

export default function PrivacyChoicesButton({ className = '' }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}>Privacy choices</button>;
}
