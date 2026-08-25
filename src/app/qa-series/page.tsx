import VratCarousel from '@/components/home/VratCarousel';
import type { ObservanceSeries } from '../../../contracts/observance-series-contract';

const reviewedName = (en: string, hi: string, pa: string) => ({
  value: { en, hi, pa },
  status: 'council_reviewed_editorial' as const,
  sourceRefs: [],
  reviewRef: 'qa:localized-series-name',
  applicability: { universal: true },
});

const upcomingNavratri: ObservanceSeries = {
  seriesKey: 'qa-navratri-upcoming',
  definitionKey: 'sharad-navratri',
  mode: 'daily_journey',
  name: 'Sharad Navratri',
  editorial: { name: reviewedName('Sharad Navratri', 'शरद नवरात्रि', 'ਸ਼ਰਦ ਨਵਰਾਤਰੀ') },
  tradition: 'hindu',
  profile: { calendar: 'legacy-ujjain', tradition: 'standard' },
  location: { label: 'QA', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  status: 'upcoming',
  startDate: '2026-10-11',
  endDate: '2026-10-20',
  currentCivilDate: null,
  activeChildOccurrenceIds: [],
  currentDay: null,
  totalDays: 10,
  children: [
    {
      occurrenceId: 'qa-navratri-1', slug: 'navratri-day-1-shailaputri', civilDate: '2026-10-11', sequence: 1,
      title: 'Navratri Day 1', routeKind: 'vrat', routeSlug: 'navratri-day-1-shailaputri',
      status: 'resolved', diagnostics: [], sourceRefs: [],
      editorial: { canonicalTitle: reviewedName('Maa Shailaputri', 'माँ शैलपुत्री', 'ਮਾਂ ਸ਼ੈਲਪੁਤਰੀ') },
    },
  ],
  diagnostics: [], sourceRefs: [], versions: { contract: 'qa' },
};

const activeNavratri: ObservanceSeries = {
  ...upcomingNavratri,
  seriesKey: 'qa-navratri-active',
  status: 'active',
  currentCivilDate: '2026-10-15',
  activeChildOccurrenceIds: ['qa-navratri-5'],
  currentDay: 5,
  children: [
    {
      occurrenceId: 'qa-navratri-5', slug: 'navratri-day-5-skandamata', civilDate: '2026-10-15', sequence: 5,
      title: 'Navratri Day 5', routeKind: 'vrat', routeSlug: 'navratri-day-5-skandamata',
      status: 'resolved', diagnostics: [], sourceRefs: [],
      editorial: { canonicalTitle: reviewedName('Maa Skandamata', 'माँ स्कंदमाता', 'ਮਾਂ ਸਕੰਦਮਾਤਾ') },
    },
  ],
};

const concludingNavratri: ObservanceSeries = {
  ...upcomingNavratri,
  seriesKey: 'qa-navratri-concluding',
  status: 'concluding',
  currentCivilDate: '2026-10-20',
  activeChildOccurrenceIds: ['qa-navratri-10'],
  currentDay: 10,
  children: [
    {
      occurrenceId: 'qa-navratri-10', slug: 'dussehra', civilDate: '2026-10-20', sequence: 10,
      title: 'Vijayadashami', routeKind: 'vrat', routeSlug: 'dussehra',
      status: 'resolved', diagnostics: [], sourceRefs: [],
      editorial: { canonicalTitle: reviewedName('Vijayadashami', 'विजयादशमी', 'ਵਿਜਯਾਦਸ਼ਮੀ') },
    },
  ],
};

const diwaliCluster: ObservanceSeries = {
  seriesKey: 'qa-diwali',
  definitionKey: 'diwali-five-days',
  mode: 'festival_cluster',
  name: 'Diwali',
  editorial: { name: reviewedName('Diwali', 'दीपावली', 'ਦੀਵਾਲੀ') },
  tradition: 'hindu',
  profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
  location: { label: 'QA', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  status: 'active',
  startDate: '2026-11-06',
  endDate: '2026-11-10',
  currentCivilDate: '2026-11-08',
  activeChildOccurrenceIds: ['qa-naraka', 'qa-diwali'],
  currentDay: 2,
  totalDays: 5,
  children: [
    {
      occurrenceId: 'qa-naraka', slug: 'naraka-chaturdashi', civilDate: '2026-11-08', sequence: 2,
      title: 'Naraka Chaturdashi', routeKind: 'vrat', routeSlug: 'naraka-chaturdashi',
      status: 'resolved', diagnostics: [], sourceRefs: [],
      editorial: { canonicalTitle: reviewedName('Naraka Chaturdashi', 'नरक चतुर्दशी', 'ਨਰਕ ਚਤੁਰਦਸ਼ੀ') },
    },
    {
      occurrenceId: 'qa-diwali', slug: 'diwali', civilDate: '2026-11-08', sequence: 3,
      title: 'Diwali (Lakshmi Puja)', routeKind: 'vrat', routeSlug: 'diwali',
      status: 'resolved', diagnostics: [], sourceRefs: [],
      editorial: { canonicalTitle: reviewedName('Diwali (Lakshmi Puja)', 'दीपावली (लक्ष्मी पूजा)', 'ਦੀਵਾਲੀ (ਲਕਸ਼ਮੀ ਪੂਜਾ)') },
    },
  ],
  diagnostics: ['multiple_series_children_today'], sourceRefs: [], versions: { contract: 'qa' },
};

const underReviewSeries: ObservanceSeries = {
  ...upcomingNavratri,
  seriesKey: 'qa-navratri-under-review',
  status: 'under_review',
  children: [
    { ...upcomingNavratri.children[0], status: 'missing', occurrenceId: null, civilDate: null },
  ],
  diagnostics: ['missing_required_series_child:navratri-day-2-brahmacharini'],
};

export default function SeriesQaPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '48px 0', background: 'var(--divine-bg)' }}>
      <section style={{ maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <h2 style={{ padding: '0 16px' }}>Upcoming (Navratri)</h2>
          <VratCarousel festivals={[]} series={[upcomingNavratri]} effectiveAppLanguage="en" spiritualDate="2026-10-09" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Active (Day 5 of 9)</h2>
          <VratCarousel festivals={[]} series={[activeNavratri]} effectiveAppLanguage="en" spiritualDate="2026-10-15" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Concluding (Vijayadashami)</h2>
          <VratCarousel festivals={[]} series={[concludingNavratri]} effectiveAppLanguage="en" spiritualDate="2026-10-20" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Diwali cluster (same-date siblings) — English</h2>
          <VratCarousel festivals={[]} series={[diwaliCluster]} effectiveAppLanguage="en" spiritualDate="2026-11-08" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Diwali cluster (same-date siblings) — Hindi</h2>
          <VratCarousel festivals={[]} series={[diwaliCluster]} effectiveAppLanguage="hi" spiritualDate="2026-11-08" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Diwali cluster (same-date siblings) — Punjabi</h2>
          <VratCarousel festivals={[]} series={[diwaliCluster]} effectiveAppLanguage="pa" spiritualDate="2026-11-08" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Under review / incomplete, upcoming (fail-closed)</h2>
          <VratCarousel festivals={[]} series={[underReviewSeries]} effectiveAppLanguage="en" spiritualDate="2026-10-09" />
        </div>
        <div>
          <h2 style={{ padding: '0 16px' }}>Under review / incomplete, already active (edge case)</h2>
          <VratCarousel festivals={[]} series={[underReviewSeries]} effectiveAppLanguage="en" spiritualDate="2026-10-12" />
        </div>
      </section>
    </main>
  );
}
