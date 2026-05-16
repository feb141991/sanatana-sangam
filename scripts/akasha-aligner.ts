import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GOOGLE_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || undefined;
const GOOGLE_KEY   = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || undefined)?.replace(/\\n/g, '\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function getGoogleToken() {
  if (!GOOGLE_EMAIL || !GOOGLE_KEY) {
    throw new Error('❌ Missing GOOGLE_SERVICE_ACCOUNT credentials in environment');
  }
  const auth = new GoogleAuth({
    credentials: { client_email: GOOGLE_EMAIL, private_key: GOOGLE_KEY },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  return res.token;
}

/**
 * Akasha Bulk Aligner
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Google TTS "Timepoints" to perfectly align Dharmic scripts without 
 * complex AI audio-to-text models.
 */
async function runAligner() {
  const isSimulated = process.argv.includes('--simulate');
  const force = process.argv.includes('--force');
  console.log(`🕉️  Akasha Bulk Aligner Starting... ${isSimulated ? '(SIMULATION MODE)' : ''}`);

  try {
    let token: string | undefined;
    if (!isSimulated) {
      token = await getGoogleToken();
      console.log('✅ Google Auth Successful');
    } else {
      console.log('✨ Simulating alignment using meditative pace (no API calls)');
    }

    // 1. Fetch shlokas
    let query = supabase.from('shlokas').select('id, devanagari, name');
    
    // If not forcing, only find shlokas with empty or null metadata
    if (!force) {
      query = query.or('sync_metadata.eq.[],sync_metadata.is.null');
    }

    const { data: shlokas, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!shlokas || shlokas.length === 0) {
      console.log('✨ No shlokas need alignment. All synced!');
      return;
    }

    console.log(`📦 Found ${shlokas.length} shlokas to align.`);

    for (const shloka of shlokas) {
      console.log(`\n🔹 Aligning: ${shloka.name || shloka.id}`);

      // 2. Tokenize into words
      const textSource = shloka.devanagari;
      const words = textSource.split(/[\s।॥,]+/).filter(w => w.trim().length > 0);
      
      // 3. Build SSML with marks
      let ssml = '<speak>';
      words.forEach((word, index) => {
        ssml += `<mark name="w${index}"/> ${word} `;
      });
      ssml += '</speak>';

      // 4. Call Google TTS or Simulate
      let timepoints: { name: string, timeSeconds: number }[] = [];

      if (isSimulated) {
        // Simulate a meditative reading pace: ~450ms per word
        let currentTime = 0.5; // Start after 500ms
        timepoints = words.map((_, i) => {
          const tp = { name: `w${i}`, timeSeconds: currentTime };
          currentTime += 0.45; // 450ms per word
          return tp;
        });
      } else {
        const payload = {
          input: { ssml },
          voice: {
            languageCode: 'hi-IN',
            name: 'hi-IN-Neural2-B', // Pandit Male
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.78, // Meditative pace
            pitch: -4.0,
          },
          enableTimePointing: ['SSML_MARK'],
        };

        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ Google API error for ${shloka.id}:`, errText);
          continue;
        }

        const result = await response.json() as { timepoints: { name: string, timeSeconds: number }[] };
        timepoints = result.timepoints || [];
      }
      
      if (timepoints.length === 0) {
        console.warn(`⚠️ No timepoints available for ${shloka.id}`);
        continue;
      }

      // 5. Map timepoints to word objects
      const sync_metadata = timepoints.map((tp, i) => {
        const wordIndex = parseInt(tp.name.replace('w', ''));
        const nextTp = timepoints[i + 1];
        
        return {
          word: words[wordIndex],
          start: Math.round(tp.timeSeconds * 1000),
          end: nextTp ? Math.round(nextTp.timeSeconds * 1000) : Math.round((tp.timeSeconds + 0.8) * 1000)
        };
      });

      // 6. Update Supabase
      const { error: updateError } = await supabase
        .from('shlokas')
        .update({ sync_metadata })
        .eq('id', shloka.id);

      if (updateError) {
        console.error(`❌ Failed to update ${shloka.id}:`, updateError.message);
      } else {
        console.log(`✅ Synced ${sync_metadata.length} tokens.`);
      }
    }

    console.log('\n🙏 Bulk Alignment Complete.');
  } catch (err: any) {
    console.error('🔥 Aligner Crashed:', err.message);
  }
}

runAligner();
