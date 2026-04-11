# UI Foundation

These primitives are the shared foundation for the app's calmer, elder-friendly surface layer.

- `Button`: primary, secondary, and ghost actions
- `Card`: panel, strong, and soft surface wrappers
- `Badge`: small semantic labels and metadata chips
- `Input`: shared field styling
- `MetricTile`: consistent metric number + label + hint pattern
- `SectionHeading`: consistent section intro pattern
- `SurfaceSection`: shared section wrapper with heading and body copy
- `Skeleton`, `Spinner`, `EmptyState`: common async states

Use them when adding new surfaces so the product keeps one visual rhythm instead of section-by-section styling drift.

## Data foundation

- React Query lives at the app root via `AppProviders`
- `src/lib/api/*` holds Supabase-backed client adapters
- `src/hooks/*` holds app query/mutation hooks keyed by `src/lib/query-keys.ts`

When a client surface needs live user data, prefer:
1. adapter in `src/lib/api`
2. hook in `src/hooks`
3. optimistic cache updates through React Query
