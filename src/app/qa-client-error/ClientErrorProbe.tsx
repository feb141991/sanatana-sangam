'use client';

import { useState } from 'react';

export default function ClientErrorProbe() {
  const [shouldThrow, setShouldThrow] = useState(false);
  if (shouldThrow) throw new Error('Shoonaya client telemetry QA probe');

  return (
    <button type="button" onClick={() => setShouldThrow(true)}>
      Trigger client error probe
    </button>
  );
}
