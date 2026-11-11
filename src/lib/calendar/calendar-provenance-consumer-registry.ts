export const CALENDAR_FINAL_DATE_CONSUMERS = [
  { path: 'src/lib/observance-notification-source.ts', symbol: 'isReviewedCalendarEligibility' },
  { path: 'src/lib/marketing/sources/published-observance.ts', symbol: 'isPublishedCalendarEligibility' },
  { path: 'src/lib/calendar/subscription-feed.ts', symbol: 'isReviewedCalendarEligibility' },
  { path: 'src/lib/calendar/vrat-observable-resolver.ts', symbol: 'isReviewedCalendarEligibility' },
  { path: 'src/lib/observance-scheduler.ts', symbol: 'isReviewedCalendarEligibility' },
  { path: 'src/lib/series-candidate-producer.ts', symbol: 'isFinalCalendarDate' },
] as const;
