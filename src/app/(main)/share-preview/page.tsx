import { notFound } from 'next/navigation';
import SharePreviewClient from './SharePreviewClient';

export default function SharePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <SharePreviewClient />;
}
