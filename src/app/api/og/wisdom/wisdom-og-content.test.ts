import { describe, it, expect } from 'vitest';
import { resolveWisdomOgContent } from './wisdom-og-content';

describe('resolveWisdomOgContent', () => {
  // Regression: an unresolved type/id/slug previously fell through to
  // reading raw `title`/`subtitle` query params verbatim -- anyone could
  // hit this officially-branded, official-domain image generator with
  // arbitrary text and get back a convincing, Shoonaya-branded image
  // saying whatever they typed. Proven red against the old behaviour by
  // reinstating that `else` branch locally and re-running this test.
  it('never echoes raw title/subtitle query params for an unrecognized type', () => {
    const params = new URLSearchParams({
      type: 'anything-else',
      title: 'INJECTED TITLE',
      subtitle: 'INJECTED SUBTITLE',
    });
    const content = resolveWisdomOgContent(params);
    expect(content.title).not.toBe('INJECTED TITLE');
    expect(content.subtitle).not.toBe('INJECTED SUBTITLE');
    expect(content.title).toBe('Sacred Wisdom');
  });

  it('never echoes raw title/subtitle query params when type is missing entirely', () => {
    const params = new URLSearchParams({
      title: 'INJECTED TITLE',
      subtitle: 'INJECTED SUBTITLE',
    });
    const content = resolveWisdomOgContent(params);
    expect(content.title).toBe('Sacred Wisdom');
    expect(content.subtitle).not.toContain('INJECTED');
  });

  it('never echoes raw title/subtitle query params for a katha id that does not exist', () => {
    const params = new URLSearchParams({
      type: 'katha',
      id: 'this-katha-does-not-exist',
      title: 'INJECTED TITLE',
      subtitle: 'INJECTED SUBTITLE',
    });
    const content = resolveWisdomOgContent(params);
    expect(content.title).toBe('Sacred Wisdom');
    expect(content.subtitle).not.toContain('INJECTED');
  });

  it('falls back to the generic default when type/id/slug are absent altogether', () => {
    const content = resolveWisdomOgContent(new URLSearchParams());
    expect(content.title).toBe('Sacred Wisdom');
    expect(content.traditionKey).toBe('hindu');
    expect(content.categoryBadge).toBe('Katha');
  });
});
