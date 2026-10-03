import { redirect } from 'next/navigation';

/** Retired free-launch URL; forward stale links to the home page. */
export default function PricingPage(): never {
  redirect('/');
}
