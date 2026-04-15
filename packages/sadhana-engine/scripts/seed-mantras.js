#!/usr/bin/env node
/**
 * Seed mantras table in Supabase from mantra-library.json
 *
 * Usage:
 *   node seed-mantras.js --key YOUR_SERVICE_ROLE_KEY
 *   OR
 *   SUPABASE_SERVICE_ROLE_KEY=... node seed-mantras.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';

const args = process.argv.slice(2);
const keyIdx = args.indexOf('--key');
const key = keyIdx !== -1 ? args[keyIdx + 1] : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('Error: Provide key via --key flag or SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const dataPath = path.join(__dirname, '..', 'supabase', 'seed', 'mantra-library.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const mantras = data.mantras;

console.log(`Seeding ${mantras.length} mantras to Supabase...`);

const supabase = createClient(SUPABASE_URL, key);

supabase
  .from('mantras')
  .upsert(mantras, { onConflict: 'id' })
  .then(({ error }) => {
    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
    console.log(`✓ Seeded ${mantras.length} mantras successfully.`);
  });
