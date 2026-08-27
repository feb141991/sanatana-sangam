import { describe, expect, it, vi } from 'vitest';
import {
  isSafeInternalPath,
  navigateAfterAuthentication,
} from '@/lib/auth-client-destination';

describe('post-authentication navigation', () => {
  it('accepts only same-origin internal paths', () => {
    expect(isSafeInternalPath('/home')).toBe(true);
    expect(isSafeInternalPath('/onboarding?step=1')).toBe(true);
    expect(isSafeInternalPath('//attacker.example')).toBe(false);
    expect(isSafeInternalPath('https://attacker.example')).toBe(false);
  });

  it('uses a hard document navigation for a valid destination', () => {
    const assign = vi.fn();

    const destination = navigateAfterAuthentication('/home', '/onboarding', { assign });

    expect(destination).toBe('/home');
    expect(assign).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith('/home');
  });

  it('falls back safely when the destination is external or malformed', () => {
    const assign = vi.fn();

    const destination = navigateAfterAuthentication('//attacker.example', '/home', { assign });

    expect(destination).toBe('/home');
    expect(assign).toHaveBeenCalledWith('/home');
  });
});
