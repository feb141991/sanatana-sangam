import { Suspense } from 'react';
import AdminTicketsClient from './AdminTicketsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Support Tickets & Help Desk | Shoonaya Admin',
  description: 'Manage devotee inquiries, RAG deflection escalations, and issue resolutions.',
};

export default function AdminTicketsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Suspense fallback={<div className="p-12 text-center text-white/60">Loading support queue...</div>}>
        <AdminTicketsClient />
      </Suspense>
    </div>
  );
}
