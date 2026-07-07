import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import {
  NATIVE_NITYA_STEP_ORDER,
  countCompletedNativeNityaSteps,
  isNativeNityaStepId,
  type NativeNityaStepId,
} from '@/lib/native-nitya-karma';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getTraditionMeta } from '@/lib/tradition-config';

// GET/POST /api/native/nitya-karma
//
// Minimal native Nitya Karma contract — the morning Dinacharya sequence only.
// This matches web's own default experience: midday/evening/night sections
// in src/app/(main)/nitya-karma/NityaKarmaClient.tsx are gated behind
// `nitya_rhythm_mode` / `nitya_sections_enabled` and OFF by default
// (`DEFAULT_NITYA_SECTIONS = { morning: true, midday: false, evening: false,
// night: false }`) — so a fixed 7-step morning sequence is what most users
// see there too, not a native-only simplification.
//
// Step content (id/label/icon/description) below is ported from
// NityaKarmaClient.tsx's `FALLBACK_STEPS` + `STEP_LABELS`. This is not
// invented content: it is the exact static fallback the web client itself
// renders whenever its `@sangam/sadhana-engine` call fails or hasn't
// resolved yet, so it is already a proven-correct baseline. The engine's
// dynamic/personalised sequence, full step customisation (renaming, extra
// Pro-only steps, alert-time scheduling), and the 30-day heatmap/analytics
// are intentionally NOT ported — out of scope for a minimal native screen,
// and each would require either vendoring `@sangam/sadhana-engine` (unproven
// portable to native, unlike `@sangam/panchang-engine`) or rebuilding a large
// amount of web-only UI, both of which the task explicitly warns against.
//
// Auth: getApiUser (Bearer or cookie) — required since native never sends
// cookies. Every read/write below is RLS-scoped via the resolved client,
// `.eq('user_id', user.id)` — same tables (`nitya_karma_log`,
// `nitya_karma_streaks`), same pattern already proven for
// `daily_sadhana`/`mala_sessions`/`sankalpas` elsewhere in this native
// contract (see /api/native/home-summary, /api/vrat/observe). No
// service-role admin client anywhere in this route. The write mirrors
// NityaKarmaClient.tsx's own `markStep()` persistence exactly: a plain
// `.insert()` into `nitya_karma_log`, tolerating a 23505 (unique-violation —
// step already logged today) as a success rather than an error. Web's
// `engine.nityaKarma.markStep()` call is a secondary, try/catch-silenced
// "engine sync" on top of that same insert (see NityaKarmaClient.tsx
// `markStep()`), not the source of truth — it is intentionally not called
// here to avoid depending on an unproven-portable engine package.

export const runtime = 'nodejs';

type StepId = NativeNityaStepId;

type StepContent = { label: string; icon: string; description: string; minutes: number };

// Base (Hindu / unrecognised-tradition) content — ported verbatim from
// NityaKarmaClient.tsx's FALLBACK_STEPS. `icon` values are native Feather
// glyph names (verified against the installed glyphmap), matching the same
// convention `/api/native/home-summary`'s `practices[]` already uses —
// web's own icon set (`SacredIconName`) has no native equivalent.
const BASE_STEPS: Record<StepId, StepContent> = {
  woke_brahma_muhurta: { label: 'Brahma Muhurta', icon: 'sunrise',    description: 'Wake in the pre-dawn hour — the veil between the human and the divine is thinnest here', minutes: 0 },
  snana_done:          { label: 'Snana',          icon: 'droplet',    description: 'Sacred bath — water purifies body, prana, and subtle body before you enter the worship space', minutes: 10 },
  tilak_done:          { label: 'Tilak',          icon: 'crosshair',  description: "Apply the sacred mark and set your sankalpa — the threshold gesture that opens the day's worship", minutes: 2 },
  japa_done:            { label: 'Japa',           icon: 'disc',       description: 'Mantra japa — one mala (108 repetitions) while the mind is fresh and unscattered', minutes: 30 },
  sandhya_done:        { label: 'Vandana',        icon: 'sun',        description: 'Morning salutation — offer arghya to Surya, recite Gayatri, and greet the dawn', minutes: 15 },
  aarti_done:          { label: 'Puja / Aarti',   icon: 'zap',        description: 'Bring your purified, mantra-saturated mind to the deity — conclude with the circling of the lamp', minutes: 20 },
  shloka_done:         { label: 'Shloka Paath',   icon: 'book-open',  description: "Svadhyaya — read or recite a passage from your tradition's scripture", minutes: 10 },
};

// Tradition-aware label/description overrides — ported from
// NityaKarmaClient.tsx's STEP_LABELS map. Only label/description are
// tradition-specific there; icon and minutes are shared.
const TRADITION_OVERRIDES: Partial<Record<string, Partial<Record<StepId, { label: string; description: string }>>>> = {
  sikh: {
    woke_brahma_muhurta: { label: 'Amrit Vela',     description: 'Rise before dawn — the ambrosial hour for naam simran, before the mind is touched by the world' },
    snana_done:          { label: 'Ishnan',         description: 'Bathe and purify body and mind — Sikhi teaches that inner cleanliness begins with outer' },
    tilak_done:          { label: 'Naam Simran',    description: 'Begin Waheguru naam simran — the Gurmantar settles the mind before the banis begin' },
    japa_done:            { label: 'Jaap + Chaupai', description: 'Recite Jaap Sahib and Chaupai Sahib — the banis of power, protection, and divine praise' },
    sandhya_done:        { label: 'Japji Sahib',    description: 'Recite Japji Sahib — the morning bani of Guru Nanak Dev Ji, foundation of all Nitnem' },
    aarti_done:          { label: 'Ardas',          description: 'Offer Ardas — the Sikh prayer of supplication for the sangat, the panth, and all of creation' },
    shloka_done:         { label: 'Hukamnama',      description: "Receive today's Hukamnama — the divine order from Guru Granth Sahib Ji" },
  },
  buddhist: {
    woke_brahma_muhurta: { label: 'Early Rising',      description: 'Rise before the world stirs — a fresh, uncontaminated mind is the best ground for meditation' },
    snana_done:          { label: 'Purification',      description: 'Wash body and rinse mouth — outer cleanliness reflects the inner intention of purity (sila)' },
    tilak_done:          { label: 'Precept Renewal',   description: "Silently renew the Five Precepts — the threshold gesture before approaching the shrine" },
    japa_done:            { label: 'Sitting Practice',  description: 'Silent breath or mantra meditation — cultivate samatha and vipassana' },
    sandhya_done:        { label: 'Metta Bhavana',     description: 'Loving-kindness practice — radiate goodwill outward to self, loved ones, all beings' },
    aarti_done:          { label: 'Puja / Offerings',  description: 'Offer flowers, incense, and light before the Buddha image — the three gems are honoured' },
    shloka_done:         { label: 'Dhamma Reading',    description: "Study a passage from the Dhammapada or a teacher's commentary" },
  },
  jain: {
    woke_brahma_muhurta: { label: 'Brahma Muhurta', description: 'Rise before dawn — the auspicious hour for pratikraman and setting the mind in ahimsa' },
    snana_done:          { label: 'Shaucha',        description: 'Physical purification — cleanse body completely before entering the worship space' },
    tilak_done:          { label: 'Sthapana',       description: 'Set up the Jina image or symbol and offer flowers, rice, or saffron' },
    japa_done:            { label: 'Navkar Mantra',  description: 'Recite Navkar Mantra 108 times — salutation to the five supreme beings' },
    sandhya_done:        { label: 'Samayika',       description: '48-minute vow of equanimity — the supreme Jain sadhana' },
    aarti_done:          { label: 'Puja / Aarti',   description: 'Ashtaprakari Puja before the Tirthankar; conclude with diya Aarti' },
    shloka_done:         { label: 'Agam Path',      description: 'Study from the Agam — the canonical Jain texts' },
  },
};

type NityaStep = {
  id: StepId;
  label: string;
  icon: string;
  description: string;
  minutes: number;
  done: boolean;
};

function resolveSteps(tradition: string | null, doneIds: ReadonlySet<string>): NityaStep[] {
  const overrides = TRADITION_OVERRIDES[tradition ?? ''] ?? {};
  return NATIVE_NITYA_STEP_ORDER.map((id) => {
    const base = BASE_STEPS[id];
    const override = overrides[id];
    return {
      id,
      label: override?.label ?? base.label,
      icon: base.icon,
      description: override?.description ?? base.description,
      minutes: base.minutes,
      done: doneIds.has(id),
    };
  });
}

type NityaLogRow = { step_id: string };
type NityaStreakRow = { current_streak: number | null; longest_streak: number | null };

function isPresentString(value: string | null): value is string {
  return Boolean(value);
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, tradition')
      .eq('id', user.id)
      .maybeSingle();

    const tradition = profile?.tradition ?? null;
    const timezone = profile?.timezone ?? 'UTC';
    const today = localSpiritualDate(timezone, 4);
    const meta = getTraditionMeta(tradition ?? 'other');

    const [logResult, streakResult] = await Promise.allSettled([
      supabase.from('nitya_karma_log').select('step_id').eq('user_id', user.id).eq('log_date', today),
      supabase.from('nitya_karma_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
    ]);

    const logRows = (logResult.status === 'fulfilled' ? logResult.value.data : []) as NityaLogRow[] | null;
    const doneIds = new Set<string>((logRows ?? []).map((row) => row.step_id));

    const steps = resolveSteps(tradition, doneIds);
    const completedCount = countCompletedNativeNityaSteps(doneIds);
    const allDone = completedCount === NATIVE_NITYA_STEP_ORDER.length;

    const streakRow = (streakResult.status === 'fulfilled' ? streakResult.value.data : null) as NityaStreakRow | null;

    return NextResponse.json({
      greeting: meta.morningGreeting,
      allDoneMessage: meta.morningAllDoneMsg,
      steps,
      completedCount,
      total: steps.length,
      allDone,
      streak: {
        current: streakRow?.current_streak ?? 0,
        longest: streakRow?.longest_streak ?? 0,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/native/nitya-karma] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { step_id?: unknown } | null;
    const stepId = body?.step_id;

    if (typeof stepId !== 'string' || !isNativeNityaStepId(stepId)) {
      return NextResponse.json({ error: 'Invalid step_id' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const today = localSpiritualDate(profile?.timezone ?? 'UTC', 4);

    // Same insert-and-tolerate-conflict pattern as NityaKarmaClient.tsx's
    // own markStep() — no DB unique constraint required, a 23505 just means
    // the step was already logged today (e.g. a retry), which is success.
    const { error } = await supabase.from('nitya_karma_log').insert({
      user_id: user.id,
      log_date: today,
      step_id: stepId,
    });

    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: logRows, error: logError } = await supabase
      .from('nitya_karma_log')
      .select('step_id')
      .eq('user_id', user.id)
      .eq('log_date', today);

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    const doneIds = new Set<string>(
      (logRows ?? [])
        .map((row: { step_id: string | null }) => row.step_id)
        .filter(isPresentString),
    );
    doneIds.add(stepId);
    const completedCount = countCompletedNativeNityaSteps(doneIds);
    const allDone = completedCount === NATIVE_NITYA_STEP_ORDER.length;

    if (allDone) {
      const { error: sadhanaError } = await supabase.from('daily_sadhana').upsert(
        {
          user_id: user.id,
          date: today,
          nitya_done: true,
        },
        { onConflict: 'user_id,date' },
      );
      if (sadhanaError) {
        console.warn('[POST /api/native/nitya-karma] daily_sadhana sync failed:', sadhanaError.message);
      }
    }

    return NextResponse.json({ success: true, completedCount, total: NATIVE_NITYA_STEP_ORDER.length, allDone });
  } catch (err: unknown) {
    console.error('[POST /api/native/nitya-karma] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
