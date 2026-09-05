import { Suspense } from 'react';
import { LogExplorerClient } from './LogExplorerClient';

export const dynamic = 'force-dynamic';

export default function AdminLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400 font-outfit">
          Loading Log Explorer...
        </div>
      }
    >
      <LogExplorerClient />
    </Suspense>
  );
}
