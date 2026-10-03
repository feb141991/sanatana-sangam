import { redirect } from 'next/navigation';

/** Retired free-launch URL; account settings remain available without billing. */
export default function SubscriptionSettingsPage(): never {
  redirect('/settings');
}
