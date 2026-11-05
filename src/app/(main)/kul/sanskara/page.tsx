import { redirect } from 'next/navigation';

/**
 * Retired web page. The Sanskara tracker lives in the Shoonaya app (docs/SANSKARA_TRACKER_BACKEND_DESIGN.md); this page used to read and write
 * the legacy `user_sanskaras` table, which migration 20261105090000 drops. The URL stays because it is the link inside Sanskara notifications
 * and the app's universal-link target, so a browser that opens it lands on the Kul hub instead of an error. It reads nothing.
 */
export default function SanskaraPage(): never {
  redirect('/kul');
}
