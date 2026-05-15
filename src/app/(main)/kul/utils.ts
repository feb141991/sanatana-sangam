import { KulSectionView, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent } from './types';

export function getUnreadSignature(
  view: KulSectionView, 
  data: {
    members: MemberRow[];
    tasks: TaskRow[];
    messages: MessageRow[];
    familyMembers: FamilyMember[];
    kulEvents: KulEvent[];
  }
) {
  switch (view) {
    case 'tasks':
      return data.tasks
        .filter((task) => !task.completed)
        .map((task) => `${task.id}:${task.created_at}`)
        .join('|');
    case 'members':
      return data.members
        .map((member) => `${member.id}:${member.joined_at}`)
        .join('|');
    case 'sabha':
      return data.messages
        .map((message) => `${message.id}:${message.created_at}`)
        .join('|');
    case 'vansh':
      return data.familyMembers
        .map((member) => `${member.id}:${member.display_order ?? 0}:${member.birth_date ?? ''}:${member.death_date ?? ''}`)
        .join('|');
    case 'events':
      return data.kulEvents
        .map((event) => `${event.id}:${event.event_date}`)
        .join('|');
  }
}

export function daysUntilNextOccurrence(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(dateStr);
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) {
    next.setFullYear(today.getFullYear() + 1);
  }
  const diffTime = next.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getKulSectionHref(section: string) {
  return `/kul/${section}`;
}
