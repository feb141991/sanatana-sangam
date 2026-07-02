'use client';

import { useState } from 'react';

type CopyShareButtonProps = {
  url: string;
  className?: string;
  awardBlessingShare?: boolean;
};

export default function CopyShareButton({
  url,
  className,
  awardBlessingShare = false,
}: CopyShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }

    if (awardBlessingShare) {
      fetch('/api/karma/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'blessing_shared', amount: 10 }),
      }).catch(() => {});
    }
  }

  return (
    <button type="button" className={className} onClick={copyLink}>
      {copied ? '✓ Copied!' : '🔗 Copy Link'}
    </button>
  );
}
