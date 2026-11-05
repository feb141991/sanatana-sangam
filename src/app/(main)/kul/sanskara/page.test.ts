import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const redirect = vi.hoisted(() => vi.fn(() => { throw new Error('NEXT_REDIRECT'); }));
vi.mock('next/navigation', () => ({ redirect }));

import SanskaraPage from './page';

describe('retired web page /kul/sanskara', () => {
  it('redirects to the Kul hub without touching any data', () => {
    expect(() => SanskaraPage()).toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/kul');
  });

  // Guard for the class: nothing under src may read or write the three legacy tables that migration 20261105090000 drops.
  it('no source file under src reads or writes the retired legacy tables', () => {
    const { execSync } = require('node:child_process') as typeof import('node:child_process');
    const root = join(__dirname, '../../../../..');
    const out = execSync(
      `grep -rnE "from\\\\(['\\"](user_sanskaras|user_sanskars|sanskars)['\\"]\\\\)" src --include=*.ts --include=*.tsx || true`,
      { cwd: root, encoding: 'utf8' },
    ).split('\n').filter((line) => line && !line.includes('types/database') && !line.includes('page.test.ts'));
    expect(out).toEqual([]);
    expect(readFileSync(join(__dirname, 'page.tsx'), 'utf8')).not.toMatch(/supabase/i);
  });
});
