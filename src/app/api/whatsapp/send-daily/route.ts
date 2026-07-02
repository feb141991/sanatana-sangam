import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// ─── Tradition-aware Scripture Verses ──────────────────────────────────────────
const VERSES: Record<string, { script: string; translit?: string; translation: string; source: string; title: string; symbol: string }[]> = {
  hindu: [
    {
      title: 'Bhagavad Gita',
      symbol: '🕉️',
      script: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nतदात्मानं सृजाम्यहम्॥',
      translit: 'Yadā yadā hi dharmasya glānirbhavati bhārata\nTadātmānaṃ sṛjāmyaham',
      translation: 'Whenever righteousness wanes and unrighteousness increases, I manifest myself on earth.',
      source: 'Bhagavad Gita 4.7',
    },
    {
      title: 'Rigveda',
      symbol: '🕉️',
      script: 'एकं सत् विप्राः बहुधा वदन्ति',
      translit: 'Ekaṃ sat viprāḥ bahudhā vadanti',
      translation: 'Truth is one; the wise call it by many names.',
      source: 'Rigveda 1.164.46',
    },
    {
      title: 'Upanishad',
      symbol: '🕉️',
      script: 'असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्माऽमृतं गमय॥',
      translit: 'Asato mā sadgamaya, tamaso mā jyotirgamaya, mṛtyormā\'mṛtaṃ gamaya',
      translation: 'Lead me from the unreal to the real. Lead me from darkness to light. Lead me from death to immortality.',
      source: 'Brihadaranyaka Upanishad 1.3.28',
    }
  ],
  sikh: [
    {
      title: 'Sri Guru Granth Sahib',
      symbol: '☬',
      script: 'ਸੁੰਨ ਸਮਾਧਿ ਆਪਿ ਪ੍ਰਭੁ ਤਾੜੀ ॥ ਆਪੇ ਤਾਣਾ ਆਪੇ ਪੇਟੀ ॥',
      translit: 'Sunn samadh aap Prabh taari. Aape taana aape peti.',
      translation: 'God himself abides in the stillness of the void; He is the warp and the woof.',
      source: 'Guru Nanak Dev Ji · Ang 1037',
    },
    {
      title: 'Sri Guru Granth Sahib',
      symbol: '☬',
      script: 'ਮਨੁ ਜੀਤੈ ਜਗੁ ਜੀਤੁ ॥',
      translit: 'Man jeetai jag jeet.',
      translation: 'Conquering the mind, you conquer the world.',
      source: 'Guru Nanak Dev Ji · Japji Sahib · Ang 6',
    },
    {
      title: 'Sri Guru Granth Sahib',
      symbol: '☬',
      script: 'ਨਾਨਕ ਨਾਮੁ ਚੜ੍ਹਦੀ ਕਲਾ ॥ ਤੇਰੇ ਭਾਣੇ ਸਰਬੱਤ ਦਾ ਭਲਾ ॥',
      translit: 'Nanak Naam Chardhi Kala. Tere Bhaane Sarbatt Da Bhala.',
      translation: 'Nanak, in the Name, in ascending grace; and by Your will, may all be blessed.',
      source: 'Ardas',
    }
  ],
  buddhist: [
    {
      title: 'Heart Sutra',
      symbol: '☸️',
      script: 'रूपं शून्यता शून्यतैव रूपम्।',
      translit: 'Rūpaṃ śūnyatā śūnyataiva rūpam.',
      translation: 'Form is emptiness, emptiness itself is form.',
      source: 'Prajñāpāramitā Hṛdaya',
    },
    {
      title: 'Dhammapada',
      symbol: '☸️',
      script: 'मनोपुब्बङ्गमा धम्मा मनोसेट्ठा मनोमया।',
      translit: 'Manopubbaṅgamā dhammā manoseṭṭhā manomayā.',
      translation: 'Mind is the forerunner of all actions; all things arise from mind, fashioned by mind.',
      source: 'Dhammapada 1',
    },
    {
      title: 'Metta Sutta',
      symbol: '☸️',
      script: 'Sabbe sattā sukhitā hontu.',
      translation: 'May all beings be happy. May all beings be free from suffering.',
      source: 'Metta Sutta · Sutta Nipata 1.8',
    }
  ],
  jain: [
    {
      title: 'Tattvartha Sutra',
      symbol: '☮️',
      script: 'परस्परोपग्रहो जीवानाम्।',
      translit: 'Parasparopagraho jīvānām.',
      translation: 'Souls render service to one another (mutual support).',
      source: 'Tattvartha Sutra 5.21',
    },
    {
      title: 'Acharanga Sutra',
      symbol: '☮️',
      script: 'अहिंसा परमो धर्मः।',
      translit: 'Ahinsā paramo dharmaḥ.',
      translation: 'Non-violence is the highest dharma.',
      source: 'Acharanga Sutra',
    },
    {
      title: 'Navkar Mantra',
      symbol: '☮️',
      script: 'णमो अरिहंताणं। णमो सिद्धाणं।',
      translit: 'Namo Arihantānam. Namo Siddhānam.',
      translation: 'I bow to the Arihants (destroyers of inner enemies). I bow to the Siddhas (liberated souls).',
      source: 'Navkar Mantra',
    }
  ]
};

export async function GET(request: Request) {
  // 1. Auth check (Vercel Cron verification)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase cron environment is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 2. Fetch users opted-in to WhatsApp reminders
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, whatsapp_number, whatsapp_opt_in')
      .eq('whatsapp_opt_in', true)
      .not('whatsapp_number', 'is', null);

    if (usersError) {
      console.error('WhatsApp cron users query failed:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users opted-in to WhatsApp reminders', sent: 0 });
    }

    // 3. Twilio Configuration Check
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default

    let isMock = false;
    if (!accountSid || !authToken) {
      console.warn('[whatsapp-send-daily] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing — running in STUB/MOCK mode');
      isMock = true;
    }

    const client = !isMock && accountSid && authToken ? twilio(accountSid, authToken) : null;

    // Calculate day of the year to cycle through verses deterministically
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    let successCount = 0;
    let failureCount = 0;
    const sentNumbers: string[] = [];

    // 4. Dispatch messages
    for (const user of users) {
      const tradition = user.tradition || 'hindu';
      const verseList = VERSES[tradition] || VERSES.hindu;
      const v = verseList[dayOfYear % verseList.length];

      // Format WhatsApp Message
      const messageText = `${v.symbol} *Daily Scripture Inspiration*\n` +
        `From the ${v.title}:\n\n` +
        `*${v.script}*\n` +
        (v.translit ? `_${v.translit}_\n\n` : '\n') +
        `"${v.translation}"\n` +
        `— ${v.source}\n\n` +
        `Shared via Shoonaya · shoonaya.com`;

      try {
        if (!isMock && client) {
          // REAL DISPATCH (TODO: input real Twilio accountSid and authToken in environment variables)
          await client.messages.create({
            from: whatsappFrom,
            to: `whatsapp:${user.whatsapp_number}`,
            body: messageText,
          });
        } else {
          // STUB DISPATCH (Log to server console)
          console.log(`[STUB WhatsApp send] To: ${user.whatsapp_number} | Body:\n${messageText}`);
        }
        successCount++;
        sentNumbers.push(user.whatsapp_number);
      } catch (err) {
        console.error(`Failed to send WhatsApp message to ${user.whatsapp_number}:`, err);
        failureCount++;
      }
    }

    return NextResponse.json({
      message: 'Daily WhatsApp bot process completed',
      total_attempted: users.length,
      successes: successCount,
      failures: failureCount,
      sent_recipients: sentNumbers,
      is_mock: isMock,
    });
  } catch (error) {
    console.error('WhatsApp daily bot cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'WhatsApp daily bot cron crashed' },
      { status: 500 }
    );
  }
}
