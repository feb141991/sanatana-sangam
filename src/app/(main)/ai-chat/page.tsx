import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AIChatClient from './AIChatClient';

function readSingleParam(value: string | string[] | undefined, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  return value.slice(0, maxLength);
}

export const dynamic = 'force-dynamic';

export default async function AIChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, tradition, sampradaya, city, country, seeking, app_language, meaning_language, transliteration_language')
    .eq('id', user.id)
    .single();

  return (
    <AIChatClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      tradition={profile?.tradition ?? null}
      sampradaya={profile?.sampradaya ?? null}
      city={profile?.city ?? null}
      country={profile?.country ?? null}
      seeking={profile?.seeking ?? []}
      initialPrompt={readSingleParam(resolvedSearchParams.prefill, 600)}
      contextLabel={readSingleParam(resolvedSearchParams.context, 120)}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
    />
  );
}
