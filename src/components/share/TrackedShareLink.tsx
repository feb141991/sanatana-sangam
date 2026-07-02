'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';

type TrackedShareLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  awardBlessingShare?: boolean;
};

export default function TrackedShareLink({
  awardBlessingShare = false,
  onClick,
  children,
  ...props
}: TrackedShareLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (!event.defaultPrevented && awardBlessingShare) {
      fetch('/api/karma/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'blessing_shared', amount: 10 }),
      }).catch(() => {});
    }
  }

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
