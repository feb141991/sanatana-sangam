import { describe, expect, it } from 'vitest';

import { getPinnedProjectJwksOptions } from './api-auth-jwks-config';

const PROJECT_URL = 'https://mnbwodcswxoojndytngu.supabase.co';

describe('pinned production JWKS configuration', () => {
  it('uses the verified public key only for the exact HTTPS project host', () => {
    const options = getPinnedProjectJwksOptions(PROJECT_URL, 'pinned');
    expect(options?.jwks.keys.map(({ kid }) => kid)).toEqual([
      'e26cc168-f537-4df4-9f93-36a04a17c7dc',
    ]);

    expect(getPinnedProjectJwksOptions('https://mnbwodcswxoojndytngu.supabase.co.attacker.test', 'pinned'))
      .toBeUndefined();
    expect(getPinnedProjectJwksOptions('http://mnbwodcswxoojndytngu.supabase.co', 'pinned'))
      .toBeUndefined();
    expect(getPinnedProjectJwksOptions('https://other-project.supabase.co', 'pinned'))
      .toBeUndefined();
  });

  it('allows an operator to bypass pinned keys and use Supabase dynamic JWKS', () => {
    expect(getPinnedProjectJwksOptions(PROJECT_URL, 'remote')).toBeUndefined();
    expect(getPinnedProjectJwksOptions(PROJECT_URL, 'unexpected-value')).toBeUndefined();
    expect(getPinnedProjectJwksOptions(PROJECT_URL, undefined)?.jwks.keys).toHaveLength(1);
  });
});
