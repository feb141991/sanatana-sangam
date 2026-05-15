import type {
  KulData,
  KulEvent,
  KulFamilyMember,
  KulMemberRow,
  KulMessageRow,
  KulSummary,
  KulTaskRow,
  SaveKulEventPayload,
  SaveKulFamilyMemberPayload,
} from '@/lib/api/kul';

type KulState = {
  kul: KulSummary | null;
  members: KulMemberRow[];
  tasks: KulTaskRow[];
  messages: KulMessageRow[];
  familyMembers: KulFamilyMember[];
  kulEvents: KulEvent[];
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const baseKul: KulSummary = {
  id: 'mock-kul-1',
  name: 'Sharma Kul',
  invite_code: 'KUL108',
  avatar_emoji: '🪔',
  cover_url: null,
  created_by: 'mock-user',
  created_at: new Date('2026-01-02T08:00:00.000Z').toISOString(),
};

const baseMembers: KulMemberRow[] = [
  {
    id: 'member-1',
    role: 'guardian',
    joined_at: new Date('2026-01-02T08:00:00.000Z').toISOString(),
    user_id: 'mock-user',
    profiles: {
      id: 'mock-user',
      full_name: 'Prince Sharma',
      username: 'prince',
      avatar_url: null,
      tradition: 'hindu',
      sampradaya: 'vaishnava',
      shloka_streak: 14,
      spiritual_level: 'sadhaka',
      bio: 'Keeping family practice organized.',
      city: 'London',
      country: 'United Kingdom',
      home_town: 'Mathura',
      gotra: 'Bharadwaj',
      kul_devata: 'Radha Krishna',
      is_banned: false,
      ban_reason: null,
    },
  },
  {
    id: 'member-2',
    role: 'sadhak',
    joined_at: new Date('2026-01-03T08:00:00.000Z').toISOString(),
    user_id: 'mock-sister',
    profiles: {
      id: 'mock-sister',
      full_name: 'Anika Sharma',
      username: 'anika',
      avatar_url: null,
      tradition: 'hindu',
      sampradaya: 'vaishnava',
      shloka_streak: 8,
      spiritual_level: 'jigyasu',
      bio: 'Tracking family dates and seva.',
      city: 'Delhi',
      country: 'India',
      home_town: 'Mathura',
      gotra: 'Bharadwaj',
      kul_devata: 'Radha Krishna',
      is_banned: false,
      ban_reason: null,
    },
  },
];

const baseTasks: KulTaskRow[] = [
  {
    id: 'task-1',
    title: 'Prepare family ekadashi reminder',
    description: 'Add the next date and fasting note for everyone.',
    task_type: 'reminder',
    content_ref: null,
    due_date: new Date('2026-04-18').toISOString(),
    completed: false,
    completed_at: null,
    score: 10,
    guardian_note: 'Keep it simple and mobile-readable.',
    assigned_by: 'mock-user',
    assigned_to: 'mock-sister',
    created_at: new Date('2026-04-10T08:00:00.000Z').toISOString(),
    assigned_to_profile: { full_name: 'Anika Sharma', username: 'anika', avatar_url: null },
    assigned_by_profile: { full_name: 'Prince Sharma', username: 'prince' },
  },
];

const baseMessages: KulMessageRow[] = [
  {
    id: 'msg-1',
    content: 'Let us finalize the family satsang date tonight.',
    created_at: new Date('2026-04-11T08:20:00.000Z').toISOString(),
    sender_id: 'mock-sister',
    reaction: '🙏',
    profiles: { full_name: 'Anika Sharma', username: 'anika', avatar_url: null },
  },
];

const baseFamilyMembers: KulFamilyMember[] = [
  {
    id: 'family-1',
    kul_id: baseKul.id,
    name: 'Dada ji',
    role: 'Elder',
    gender: 'male',
    birth_year: 1949,
    birth_date: '1949-08-09',
    birth_place: 'Mathura',
    death_year: null,
    death_date: null,
    marriage_date: '1971-02-05',
    parent_id: null,
    spouse_id: null,
    linked_user_id: null,
    notes: 'Keeps the family temple calendar.',
    photo_url: null,
    is_alive: true,
    generation: 1,
    display_order: 1,
  },
];

const baseEvents: KulEvent[] = [
  {
    id: 'event-1',
    kul_id: baseKul.id,
    title: 'Family satsang',
    event_type: 'satsang',
    event_date: '2026-04-20',
    recurring: false,
    description: 'Monthly family gathering.',
    member_id: null,
    member: null,
  },
];

const store = new Map<string, KulState>();

function ensureState(userId: string) {
  if (!store.has(userId)) {
    store.set(userId, {
      kul: clone(baseKul),
      members: clone(baseMembers),
      tasks: clone(baseTasks),
      messages: clone(baseMessages),
      familyMembers: clone(baseFamilyMembers),
      kulEvents: clone(baseEvents),
    });
  }
  return store.get(userId)!;
}

export async function fetchMockKulData(userId: string): Promise<KulData> {
  const state = ensureState(userId);
  const self = state.members.find((member) => member.user_id === userId) ?? state.members[0];

  return {
    userId,
    userName: self?.profiles?.full_name ?? self?.profiles?.username ?? 'Sanatani',
    userProfile: self?.profiles
      ? {
          full_name: self.profiles.full_name,
          username: self.profiles.username,
          avatar_url: self.profiles.avatar_url,
          kul_id: state.kul?.id ?? null,
          tradition: self.profiles.tradition,
          sampradaya: self.profiles.sampradaya,
          shloka_streak: self.profiles.shloka_streak,
          spiritual_level: self.profiles.spiritual_level,
          is_banned: self.profiles.is_banned,
          ban_reason: self.profiles.ban_reason,
        }
      : null,
    kul: clone(state.kul),
    members: clone(state.members),
    tasks: clone(state.tasks),
    messages: clone(state.messages),
    familyMembers: clone(state.familyMembers),
    kulEvents: clone(state.kulEvents),
    myRole: self?.role ?? 'sadhak',
  };
}

export async function createMockKul(payload: { name: string; emoji: string }) {
  const state = ensureState('mock-user');
  state.kul = {
    id: `mock-kul-${Date.now()}`,
    name: payload.name.trim(),
    invite_code: 'KUL108',
    avatar_emoji: payload.emoji,
    cover_url: null,
    created_by: 'mock-user',
    created_at: new Date().toISOString(),
  };
  return state.kul.id;
}

export async function joinMockKul(inviteCode: string) {
  return { avatar_emoji: '🪔', name: `Joined ${inviteCode.trim().toUpperCase()}` };
}

export async function renameMockKul(userId: string, kulId: string, name: string) {
  const state = ensureState(userId);
  if (state.kul?.id === kulId) state.kul.name = name.trim();
}

export async function promoteMockKulMember(userId: string, memberId: string) {
  const state = ensureState(userId);
  const member = state.members.find((item) => item.id === memberId);
  if (member) member.role = 'guardian';
}

export async function removeMockKulMember(userId: string, memberId: string) {
  const state = ensureState(userId);
  state.members = state.members.filter((item) => item.id !== memberId);
}

export async function assignMockKulTask(userId: string, payload: {
  kulId: string;
  title: string;
  description?: string | null;
  taskType: string;
  assignTo: string;
  dueDate?: string | null;
}) {
  const state = ensureState(userId);
  state.tasks.unshift({
    id: `task-${Date.now()}`,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    task_type: payload.taskType,
    content_ref: null,
    due_date: payload.dueDate || null,
    completed: false,
    completed_at: null,
    score: 10,
    guardian_note: null,
    assigned_by: userId,
    assigned_to: payload.assignTo,
    created_at: new Date().toISOString(),
    assigned_to_profile: { full_name: 'Assigned member', username: null, avatar_url: null },
    assigned_by_profile: { full_name: 'You', username: 'you' },
  });
}

export async function completeMockKulTask(userId: string, taskId: string) {
  const state = ensureState(userId);
  const task = state.tasks.find((item) => item.id === taskId);
  if (task) {
    task.completed = true;
    task.completed_at = new Date().toISOString();
  }
}

export async function sendMockKulMessage(userId: string, kulId: string, content: string) {
  const state = ensureState(userId);
  state.messages.push({
    id: `msg-${Date.now()}`,
    content: content.trim(),
    created_at: new Date().toISOString(),
    sender_id: userId,
    reaction: null,
    profiles: { full_name: 'You', username: 'you', avatar_url: null },
  });
}

export async function reactMockKulMessage(userId: string, messageId: string, emoji: string) {
  const state = ensureState(userId);
  const message = state.messages.find((item) => item.id === messageId);
  if (message) message.reaction = emoji;
}

export async function saveMockKulFamilyMember(userId: string, payload: SaveKulFamilyMemberPayload) {
  const state = ensureState(userId);
  if (payload.memberId) {
    const existing = state.familyMembers.find((item) => item.id === payload.memberId);
    if (existing) {
      Object.assign(existing, {
        name: payload.name.trim(),
        role: payload.role?.trim() || null,
        gender: payload.gender || null,
        birth_year: payload.birth_year ?? null,
        birth_date: payload.birth_date || null,
        death_year: payload.death_year ?? null,
        death_date: payload.death_date || null,
        marriage_date: payload.marriage_date || null,
        birth_place: payload.birth_place || null,
        parent_id: payload.parent_id || null,
        spouse_id: payload.spouse_id || null,
        generation: payload.generation ?? existing.generation,
        notes: payload.notes?.trim() || null,
        is_alive: payload.is_alive,
      });
    }
    return;
  }

  state.familyMembers.push({
    id: `family-${Date.now()}`,
    kul_id: payload.kulId,
    name: payload.name.trim(),
    role: payload.role?.trim() || null,
    gender: payload.gender || null,
    birth_year: payload.birth_year ?? null,
    birth_date: payload.birth_date || null,
    death_year: payload.death_year ?? null,
    death_date: payload.death_date || null,
    marriage_date: payload.marriage_date || null,
    birth_place: payload.birth_place || null,
    parent_id: payload.parent_id || null,
    spouse_id: payload.spouse_id || null,
    linked_user_id: null,
    notes: payload.notes?.trim() || null,
    photo_url: null,
    is_alive: payload.is_alive,
    generation: payload.generation ?? 4,
    display_order: state.familyMembers.length + 1,
  });
}

export async function deleteMockKulFamilyMember(userId: string, memberId: string) {
  const state = ensureState(userId);
  state.familyMembers = state.familyMembers.filter((item) => item.id !== memberId);
}

export async function saveMockKulEvent(userId: string, payload: SaveKulEventPayload) {
  const state = ensureState(userId);
  state.kulEvents.push({
    id: `event-${Date.now()}`,
    kul_id: payload.kulId,
    title: payload.title.trim(),
    event_type: payload.event_type,
    event_date: payload.event_date,
    recurring: payload.recurring,
    description: payload.description?.trim() || null,
    member_id: payload.member_id || null,
    member: null,
  });
}

export async function leaveMockKul(userId: string) {
  const state = ensureState(userId);
  state.kul = null;
  state.members = [];
}
