// ============================================================
// Edge Function: ai-kul-task
// Guardian-facing AI: suggests a spiritually appropriate task
// for a kul member based on their practice profile, then
// optionally creates it directly in kul_tasks.
//
// POST body:
//   guardian_id   string   — the user assigning the task (must be kul admin/guardian)
//   member_id     string   — the kul member to assign task to
//   kul_id        string   — which kul
//   create?       boolean  — if true, insert into kul_tasks (default false = suggest only)
//   override?     object   — optional manual overrides: { task_type, content_ref, due_days }
//
// Returns:
//   suggestion:   { title, description, task_type, content_ref, due_date, score, guardian_note }
//   created:      boolean (true if inserted into kul_tasks)
//   task_id?:     uuid (if created)
//
// Deploy:
//   supabase functions deploy ai-kul-task
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const { guardian_id, member_id, kul_id, create = false, override = {} } = body;

    if (!guardian_id || !member_id || !kul_id) {
      return errorResponse('guardian_id, member_id, and kul_id are required', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 1. Verify guardian is an admin/guardian in this kul ──
    const { data: guardianMembership } = await supabase
      .from('kul_members')
      .select('role')
      .eq('kul_id', kul_id)
      .eq('user_id', guardian_id)
      .single();

    if (!guardianMembership) {
      return errorResponse('Guardian is not a member of this kul', 403);
    }
    // Allow any member to suggest — but note the role in the response
    const guardianRole = guardianMembership.role;

    // ── 2. Fetch member profile from the combined view ──
    const { data: memberProfile } = await supabase
      .from('kul_member_profiles')
      .select('*')
      .eq('kul_id', kul_id)
      .eq('user_id', member_id)
      .single();

    if (!memberProfile) {
      return errorResponse('Member not found in this kul', 404);
    }

    // ── 3. Fetch member's recently completed tasks (avoid repeating) ──
    const { data: recentTasks } = await supabase
      .from('kul_tasks')
      .select('title, task_type, content_ref, completed_at')
      .eq('kul_id', kul_id)
      .eq('assigned_to', member_id)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(5);

    // ── 4. Fetch active pending tasks (avoid duplicating) ──
    const { data: activeTasks } = await supabase
      .from('kul_pending_tasks')
      .select('title, task_type')
      .eq('kul_id', kul_id)
      .eq('assigned_to', member_id)
      .limit(3);

    // ── 5. Generate task suggestion via Gemini ──
    const suggestion = await generateTaskSuggestion({
      memberProfile,
      recentTasks:   recentTasks ?? [],
      activeTasks:   activeTasks ?? [],
      override,
    });

    // ── 6. Optionally create the task in kul_tasks ──
    let created = false;
    let task_id: string | undefined;

    if (create) {
      const dueDays = override.due_days ?? suggestion.due_days ?? 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      const { data: newTask, error: taskError } = await supabase
        .from('kul_tasks')
        .insert({
          kul_id,
          assigned_by:   guardian_id,
          assigned_to:   member_id,
          title:         suggestion.title,
          description:   suggestion.description,
          task_type:     suggestion.task_type,
          content_ref:   suggestion.content_ref ?? null,
          due_date:      dueDate.toISOString().split('T')[0],
          completed:     false,
          score:         suggestion.score ?? 10,
          guardian_note: suggestion.guardian_note,
        })
        .select('id')
        .single();

      if (taskError) {
        console.error('kul_tasks insert error:', taskError);
      } else {
        created  = true;
        task_id = newTask?.id;

        // Notify the member in-app
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('notifications').insert({
          user_id:          member_id,
          title:            'New practice task assigned 📿',
          body:             suggestion.title,
          emoji:            getTaskEmoji(suggestion.task_type),
          type:             'kul_task',
          read:             false,
          action_url:       `/kul/${kul_id}/tasks`,
          notification_key: `kul-task-${task_id}`,
          local_date:       today,
          sent_timezone:    'UTC',
        });
      }
    }

    return new Response(
      JSON.stringify({
        suggestion,
        guardian_role:   guardianRole,
        created,
        task_id,
        member_snapshot: {
          tradition:       memberProfile.tradition,
          path:            memberProfile.primary_path,
          depth:           memberProfile.content_depth,
          streak:          memberProfile.current_streak,
          consistency:     memberProfile.consistency_score,
          sessions_7d:     memberProfile.sessions_last_7d,
          last_mantra:     memberProfile.last_mantra,
        },
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ai-kul-task error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Generate task suggestion ──

interface MemberProfile {
  tradition: string | null;
  preferred_deity: string | null;
  primary_path: string | null;
  content_depth: string | null;
  current_streak: number | null;
  consistency_score: number | null;
  preferred_time: string | null;
  avg_session_duration_s: number | null;
  favorite_texts: string[] | null;
  sessions_last_7d: number;
  japa_last_7d: number;
  last_mantra: string | null;
}

interface TaskSuggestion {
  title: string;
  description: string;
  task_type: string;       // 'japa' | 'shloka' | 'vrata' | 'seva' | 'custom'
  content_ref: string | null; // e.g. 'gayatri_mantra', 'gita.2.47', 'ekadashi'
  due_days: number;        // how many days to complete
  score: number;           // points for gamification
  guardian_note: string;   // personal note from guardian to member
}

async function generateTaskSuggestion(opts: {
  memberProfile: MemberProfile;
  recentTasks: Array<{ title: string; task_type: string; content_ref: string | null }>;
  activeTasks: Array<{ title: string; task_type: string }>;
  override: Record<string, unknown>;
}): Promise<TaskSuggestion> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const { memberProfile: p, recentTasks, activeTasks, override } = opts;

  const consistencyPct = Math.round((p.consistency_score ?? 0) * 100);
  const avgMinutes     = Math.round((p.avg_session_duration_s ?? 0) / 60);

  // Fallback suggestion
  if (!geminiKey) {
    return buildFallbackTask(p);
  }

  const recentStr = recentTasks.length
    ? recentTasks.map(t => `${t.task_type}: ${t.title}`).join(', ')
    : 'none yet';

  const activeStr = activeTasks.length
    ? activeTasks.map(t => t.title).join(', ')
    : 'none';

  const overrideStr = Object.keys(override).length
    ? `Guardian has requested: ${JSON.stringify(override)}`
    : '';

  const prompt = `You are a spiritual guide (guru) within the Sanatana Sangam app, assigning a practice task to a kul member.

MEMBER PROFILE:
- Tradition: ${p.tradition ?? 'general'}, Path: ${p.primary_path ?? 'bhakti'}, Depth: ${p.content_depth ?? 'beginner'}
- Deity: ${p.preferred_deity ?? 'general'}
- Current streak: ${p.current_streak ?? 0} days, Consistency: ${consistencyPct}%
- Avg session: ${avgMinutes} minutes, Sessions this week: ${p.sessions_last_7d}
- Last mantra: ${p.last_mantra ?? 'not recorded'}
- Favorite texts: ${p.favorite_texts?.join(', ') || 'none recorded'}
- Preferred practice time: ${p.preferred_time ?? 'irregular'}

RECENT COMPLETED TASKS: ${recentStr}
CURRENTLY ACTIVE TASKS: ${activeStr}
${overrideStr}

Assign one meaningful spiritual task that:
1. Matches the member's depth and tradition
2. Is a natural next step (slightly stretching, not overwhelming)
3. Doesn't duplicate active tasks or repeat recent ones
4. Is concrete and measurable

Return JSON only:
{
  "title": "Short task title (max 60 chars). Specific, not generic.",
  "description": "2-3 sentences explaining the task and why it suits this member right now.",
  "task_type": "japa" or "shloka" or "vrata" or "seva" or "custom",
  "content_ref": "If japa: mantra id (e.g. 'gayatri_mantra'). If shloka: 'gita.2.47'. If vrata: vrata name. Otherwise null.",
  "due_days": 7,
  "score": 10,
  "guardian_note": "A warm, personal 1-sentence note from the guardian to this member. Like a guru encouraging a student."
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.6, responseMimeType: 'application/json' },
    }),
  });

  if (!resp.ok) return buildFallbackTask(p);

  const json = await resp.json();
  try {
    const parsed = JSON.parse(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
    return {
      title:         parsed.title         ?? 'Daily japa practice',
      description:   parsed.description   ?? 'Practice your mantra daily with focus and devotion.',
      task_type:     parsed.task_type     ?? 'japa',
      content_ref:   parsed.content_ref   ?? null,
      due_days:      parsed.due_days      ?? 7,
      score:         parsed.score         ?? 10,
      guardian_note: parsed.guardian_note ?? 'With blessings for your practice.',
    };
  } catch {
    return buildFallbackTask(p);
  }
}

function buildFallbackTask(p: MemberProfile): TaskSuggestion {
  const isJnana   = p.primary_path === 'jnana';
  const isVrata   = p.consistency_score && p.consistency_score > 0.7;
  const isBeginner = p.content_depth === 'beginner';

  if (isJnana) {
    return {
      title:         'Read Gita Chapter 2 — Sankhya Yoga',
      description:   'Study the philosophical foundation of the Gita. Read one verse daily with contemplation.',
      task_type:     'shloka',
      content_ref:   'gita.2',
      due_days:      14,
      score:         15,
      guardian_note: 'The Sankhya chapter will give you the intellectual foundation for your jnana path.',
    };
  }

  if (isVrata) {
    return {
      title:         'Observe the next Ekadashi',
      description:   'Fast on the next Ekadashi day. Begin with water-only or fruit fast based on your strength.',
      task_type:     'vrata',
      content_ref:   'ekadashi',
      due_days:      15,
      score:         20,
      guardian_note: 'Your consistent practice makes you ready for this next step in sadhana.',
    };
  }

  return {
    title:         isBeginner ? 'Complete 4 rounds of Gayatri Mantra daily for 7 days' : 'Complete 11 rounds of your ishta mantra daily for 21 days',
    description:   'Establish or deepen your daily japa practice. Consistency is more important than quantity.',
    task_type:     'japa',
    content_ref:   isBeginner ? 'gayatri_mantra' : (p.last_mantra ?? null),
    due_days:      isBeginner ? 7 : 21,
    score:         isBeginner ? 10 : 25,
    guardian_note: 'Regular japa is the foundation of all sadhana. Even a few minutes daily builds tremendous shakti.',
  };
}

function getTaskEmoji(taskType: string): string {
  const map: Record<string, string> = {
    japa: '📿', shloka: '📖', vrata: '🌕', seva: '🤲', custom: '✨',
  };
  return map[taskType] ?? '🙏';
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
