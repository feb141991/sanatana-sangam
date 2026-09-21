import { describe, expect, it } from 'vitest';

import { classifyApiAuthFailure } from './api-auth-status';

describe('classifyApiAuthFailure', () => {
  it.each([400, 401, 403, 422])('keeps credential rejection status %s as 401', (status) => {
    expect(classifyApiAuthFailure({ status })).toEqual({
      status: 401,
      code: 'AUTH_REQUIRED',
      message: 'Unauthorized',
    });
  });

  it.each([0, 408, 429, 500, 503])('reports auth dependency status %s as 503', (status) => {
    expect(classifyApiAuthFailure({ status })).toEqual({
      status: 503,
      code: 'AUTH_UNAVAILABLE',
      message: 'Authentication temporarily unavailable',
    });
  });

  it('fails unknown exceptions as dependency outages instead of blaming credentials', () => {
    expect(classifyApiAuthFailure(new Error('network failed')).status).toBe(503);
  });
});
