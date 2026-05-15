export type KulSummary = { 
  id: string; 
  name: string; 
  invite_code: string; 
  avatar_emoji: string; 
  cover_url?: string | null;
  created_by: string; 
  created_at: string 
};

export type MemberRow = { 
  id: string; 
  role: 'guardian' | 'sadhak'; 
  joined_at: string; 
  user_id: string; 
  profiles: { 
    id: string; 
    full_name: string | null; 
    username: string | null; 
    avatar_url: string | null; 
    tradition: string | null; 
    sampradaya: string | null; 
    shloka_streak: number | null; 
    spiritual_level: string | null; 
    bio?: string | null; 
    city?: string | null; 
    country?: string | null; 
    home_town?: string | null; 
    gotra?: string | null; 
    kul_devata?: string | null 
  } | null 
};

export type TaskRow = { 
  id: string; 
  title: string; 
  description: string | null; 
  task_type: string; 
  content_ref: string | null; 
  due_date: string | null; 
  completed: boolean; 
  completed_at: string | null; 
  score: number | null; 
  guardian_note: string | null; 
  assigned_by: string; 
  assigned_to: string; 
  created_at: string; 
  assigned_to_profile: { 
    full_name: string | null; 
    username: string | null; 
    avatar_url: string | null 
  } | null; 
  assigned_by_profile: { 
    full_name: string | null; 
    username: string | null 
  } | null 
};

export type MessageRow = { 
  id: string; 
  content: string; 
  created_at: string; 
  sender_id: string; 
  reaction: string | null; 
  profiles: { 
    full_name: string | null; 
    username: string | null; 
    avatar_url: string | null 
  } 
};

export type FamilyMember = {
  id: string; 
  kul_id: string; 
  name: string; 
  role: string | null; 
  gender: string | null;
  birth_year: number | null; 
  birth_date: string | null;
  death_year: number | null; 
  death_date: string | null;
  marriage_date: string | null;
  parent_id: string | null; 
  spouse_id: string | null;
  linked_user_id: string | null;
  notes: string | null; 
  photo_url: string | null;
  is_alive: boolean; 
  generation: number | null; 
  display_order: number | null;
};

export type KulEvent = {
  id: string; 
  kul_id: string; 
  title: string; 
  event_type: string;
  event_date: string; 
  recurring: boolean; 
  description: string | null;
  member_id: string | null;
  member: { name: string; role: string | null } | null;
};

export type KulView = 'hub' | 'tasks' | 'members' | 'sabha' | 'vansh' | 'events' | 'sanskara';
export type KulSectionView = 'tasks' | 'members' | 'sabha' | 'vansh' | 'events';
