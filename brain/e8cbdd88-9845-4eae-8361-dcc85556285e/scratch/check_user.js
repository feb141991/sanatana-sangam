const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  const username = 'prince';
  console.log(`Checking user: ${username}`);
  
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('id, full_name, username, kul_id')
    .eq('username', username)
    .single();

  if (pErr) {
    console.error('Profile Error:', pErr);
    return;
  }

  console.log('Profile:', profile);

  const { data: members, error: mErr } = await admin
    .from('kul_members')
    .select('*')
    .eq('user_id', profile.id);

  if (mErr) {
    console.error('Members Error:', mErr);
  } else {
    console.log('Memberships:', members);
  }

  if (members && members.length > 0) {
    for (const m of members) {
        const { data: kul } = await admin.from('kuls').select('id, name').eq('id', m.kul_id).single();
        console.log(`Linked Kul [${m.kul_id}]:`, kul);
    }
  }
}

checkUser();
