import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const authFailureRoutes = [
  ['notifications/register-token', 'error'],
  ['native/festival-quiz-seasons', 'error'],
  ['ai/chat/usage', 'authError'],
  ['native/home-live', 'error'],
  ['dharm-veer/submit', 'authError'],
] as const;

describe('protected route auth failure contract', () => {
  it.each(authFailureRoutes)('%s preserves the shared 401/503 classification', (route, errorName) => {
    const source = readFileSync(join(process.cwd(), 'src/app/api', route, 'route.ts'), 'utf8');

    expect(source).toMatch(/import\s*\{[\s\S]*?getApiAuthFailureResponse[\s\S]*?\}\s*from\s*['"]@\/lib\/api-auth['"]/);
    expect(source).toContain(`getApiAuthFailureResponse(${errorName})`);
    expect(source).not.toMatch(/return\s+NextResponse\.json\(\{[\s\S]*?Unauthorized[\s\S]*?\},\s*\{\s*status:\s*401/);
  });
});
