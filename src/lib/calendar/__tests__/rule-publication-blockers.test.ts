import { describe, it, expect } from 'vitest';
import { findKnownRulePublicationBlockers } from '../rule-publication-blockers';
import type { ObservanceRule } from '../rules';

function rule(overrides: Partial<ObservanceRule> = {}): ObservanceRule {
  return {
    slug: 'test-festival',
    display_name: 'Test Festival',
    emoji: '🪔',
    description: 'synthetic',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    launch_status: 'included',
    citation: 'Citation presence only; this fixture does not validate its contents.',
    ...overrides,
  };
}

describe('findKnownRulePublicationBlockers', () => {
  it('returns no known metadata blockers without claiming the rule is approved', () => {
    expect(findKnownRulePublicationBlockers(rule(), 2026)).toEqual([]);
  });

  it('fails closed when the exact rule is missing', () => {
    expect(findKnownRulePublicationBlockers(null, 2026)).toContain('no exact rule found for this slug/variant');
  });

  it('blocks a deferred rule', () => {
    expect(findKnownRulePublicationBlockers(rule({ launch_status: 'deferred' }), 2026)[0]).toContain('launch_status');
  });

  it('blocks only the disputed target year', () => {
    expect(findKnownRulePublicationBlockers(rule({ disputed_years: [2026] }), 2026)[0]).toContain('disputed_years');
    expect(findKnownRulePublicationBlockers(rule({ disputed_years: [2027] }), 2026)).toEqual([]);
  });

  it('blocks a missing citation field without validating citation truth or quality', () => {
    expect(findKnownRulePublicationBlockers(rule({ citation: undefined }), 2026)).toContain('rule has no citation');
  });

  it('blocks explicitly non-computable derivability while preserving the engine implicit default', () => {
    expect(findKnownRulePublicationBlockers(rule({ derivability: 'externally_curated' }), 2026)[0]).toContain('derivability');
    expect(findKnownRulePublicationBlockers(rule({ derivability: undefined }), 2026)).toEqual([]);
  });

  it('reports all detected blockers together', () => {
    const reasons = findKnownRulePublicationBlockers(
      rule({ launch_status: 'deferred', citation: undefined, disputed_years: [2026] }),
      2026,
    );
    expect(reasons).toHaveLength(3);
  });
});
