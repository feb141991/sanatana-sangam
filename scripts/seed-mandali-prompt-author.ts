/**
 * One-time setup: creates the "Shoonaya" system account that authors Mandali
 * conversation-starter prompts (see supabase/migrations/*_create_mandali_prompts.sql
 * and src/lib/mandali-data-server.ts). Idempotent -- safe to re-run; it looks
 * up the account by its fixed email before creating anything.
 *
 * profiles.id REFERENCES auth.users(id) ON DELETE CASCADE (supabase/schema.sql),
 * so this needs a real Auth user, not a bare profiles row or a sentinel UUID.
 * No password is ever set or surfaced -- this account never signs in anywhere.
 *
 * Run once: npx tsx scripts/seed-mandali-prompt-author.ts
 * Then copy the printed UUID into MANDALI_PROMPT_AUTHOR_ID in both repos' env.
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const SYSTEM_ACCOUNT_EMAIL = 'system+mandali-prompts@shoonaya.internal';
const SYSTEM_ACCOUNT_FULL_NAME = 'Shoonaya';
const SYSTEM_ACCOUNT_USERNAME = 'shoonaya';
const SYSTEM_ACCOUNT_AVATAR_URL = 'https://www.shoonaya.com/icons/icon-512.png';

async function main() {
  const admin = createClient(supabaseUrl!, serviceRoleKey!);

  // Idempotency: find by email across pages rather than assuming page 1 is
  // enough -- this project has enough real users that a fixed-size single
  // page could miss an existing row on a re-run.
  let existingUserId: string | null = null;
  for (let page = 1; existingUserId === null; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((u) => u.email === SYSTEM_ACCOUNT_EMAIL);
    if (match) {
      existingUserId = match.id;
      break;
    }
    if (data.users.length < 1000) break; // last page
  }

  let userId: string;
  if (existingUserId) {
    userId = existingUserId;
    console.log(`Found existing system account: ${userId}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: SYSTEM_ACCOUNT_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: SYSTEM_ACCOUNT_FULL_NAME, is_system_account: true },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created system account: ${userId}`);
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: SYSTEM_ACCOUNT_FULL_NAME,
      username: SYSTEM_ACCOUNT_USERNAME,
      avatar_url: SYSTEM_ACCOUNT_AVATAR_URL,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  console.log('\nDone. Add this to both repos\' env config:');
  console.log(`MANDALI_PROMPT_AUTHOR_ID=${userId}`);
}

main().catch((err) => {
  console.error('seed-mandali-prompt-author failed:', err);
  process.exit(1);
});
