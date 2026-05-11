import { redirect } from 'next/navigation';

export default function ReflectionsPage() {
  // Redirect to the community feed (Mandali)
  redirect('/mandali');
}
