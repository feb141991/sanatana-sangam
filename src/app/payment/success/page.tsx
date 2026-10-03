import { redirect } from 'next/navigation';

/** Retired payment callback URL. */
export default function PaymentSuccessPage(): never {
  redirect('/');
}
