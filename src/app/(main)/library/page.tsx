import { redirect } from 'next/navigation';

/**
 * Library has been absorbed into Pathshala as a tradition-gated scripture tab.
 * Any old /library links are gracefully redirected.
 */
export default function LibraryPage() {
  redirect('/pathshala');
}
