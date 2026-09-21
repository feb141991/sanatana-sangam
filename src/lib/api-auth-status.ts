export type ApiAuthFailure = {
  status: 401 | 503;
  code: 'AUTH_REQUIRED' | 'AUTH_UNAVAILABLE';
  message: string;
};

/** Preserve auth rejection vs auth-service failure without exposing provider text. */
export function classifyApiAuthFailure(error: unknown): ApiAuthFailure {
  const detail = typeof error === 'object' && error !== null ? error : {};
  const status = 'status' in detail && typeof detail.status === 'number' ? detail.status : undefined;
  const name = 'name' in detail && typeof detail.name === 'string' ? detail.name : undefined;
  const code = 'code' in detail && typeof detail.code === 'string' ? detail.code : undefined;
  const unavailable = code === 'AUTH_UNAVAILABLE' || name === 'AuthRetryableFetchError' ||
    (status !== undefined && (status === 0 || status === 408 || status === 429 || status >= 500));
  // Unknown exceptions are dependency failures, not evidence of bad credentials.
  const rejected = error == null || code === 'AUTH_REQUIRED' || name === 'AuthSessionMissingError' ||
    (status !== undefined && [400, 401, 403, 422].includes(status));
  return unavailable || !rejected
    ? { status: 503, code: 'AUTH_UNAVAILABLE', message: 'Authentication temporarily unavailable' }
    : { status: 401, code: 'AUTH_REQUIRED', message: 'Unauthorized' };
}
