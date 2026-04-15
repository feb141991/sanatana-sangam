// Japa Mala has been unified with the Japa Counter at /japa.
// This redirect ensures any existing links still work.
import { redirect } from 'next/navigation';

export default function MalaRedirectPage() {
  redirect('/japa');
}
