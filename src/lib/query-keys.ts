export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  panchang: (lat: number | null, lon: number | null, dateKey: string) =>
    ['panchang', lat, lon, dateKey] as const,
  mandali: {
    byUser: (userId: string) => ['mandali', 'user', userId] as const,
    detail: (mandaliId: string) => ['mandali', mandaliId] as const,
    posts: (mandaliId: string) => ['mandali', mandaliId, 'posts'] as const,
    events: (mandaliId: string) => ['mandali', mandaliId, 'events'] as const,
  },
  kul: {
    byUser: (userId: string) => ['kul', 'user', userId] as const,
    detail: (kulId: string) => ['kul', kulId] as const,
    members: (kulId: string) => ['kul', kulId, 'members'] as const,
    tasks: (kulId: string) => ['kul', kulId, 'tasks'] as const,
    messages: (kulId: string) => ['kul', kulId, 'messages'] as const,
    family: (kulId: string) => ['kul', kulId, 'family'] as const,
    events: (kulId: string) => ['kul', kulId, 'events'] as const,
  },
  pathshala: {
    continue: (userId: string) => ['pathshala', userId, 'continue'] as const,
    bookmarks: (userId: string) => ['pathshala', userId, 'bookmarks'] as const,
  },
} as const;
