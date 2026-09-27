import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name === 'route.ts' ? [path] : [];
  });
}

/**
 * Guard all direct getApiUser rejection branches, not a hand-maintained list
 * of five routes. Guest eligibility / post-auth ownership checks are different
 * policies, as are routes using other auth resolvers; this guard does not
 * claim to prove those flows or their transport behavior.
 */
function hardcodedAuthFailures(source: string): number[] {
  const ast = ts.createSourceFile('route.ts', source, ts.ScriptTarget.Latest, true);
  const failures: number[] = [];
  if (!source.includes('getApiUser')) return failures;
  function walk(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'NextResponse.json') {
      const options = node.arguments[1];
      const status = options && ts.isObjectLiteralExpression(options) && options.properties.find((property) =>
        ts.isPropertyAssignment(property) && property.name.getText(ast) === 'status' && property.initializer.getText(ast) === '401');
      if (status) {
        let parent: ts.Node | undefined = node.parent;
        while (parent && !ts.isFunctionLike(parent)) {
          if (ts.isIfStatement(parent) && /!\s*(?:user\b|\w+\.user\b)/.test(parent.expression.getText(ast))) {
            failures.push(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1);
            break;
          }
          parent = parent.parent;
        }
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  return failures;
}

describe('protected route auth failure contract', () => {
  it('all direct getApiUser guards preserve shared 401/503 classification', () => {
    const paths = routeFiles(join(process.cwd(), 'src/app/api'));
    const protectedPaths = paths.filter((path) => /await getApiUser\(/.test(readFileSync(path, 'utf8')));
    expect(protectedPaths.length).toBeGreaterThan(80);
    const violations = protectedPaths.flatMap((path) => hardcodedAuthFailures(readFileSync(path, 'utf8')).map((line) =>
      `${relative(process.cwd(), path)}:${line}`));
    expect(violations).toEqual([]);
  });

  it('detects a reintroduced raw 401 but allows real authorization/guest eligibility decisions', () => {
    const regression = `async function GET(req) { const { user } = await getApiUser(req);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }`;
    expect(hardcodedAuthFailures(regression)).toHaveLength(1);
    expect(hardcodedAuthFailures(regression.replace('!user', 'error || !user'))).toHaveLength(1);
    expect(hardcodedAuthFailures(regression.replace('!user', '!auth.user'))).toHaveLength(1);
    expect(hardcodedAuthFailures(regression.replace("NextResponse.json({ error: 'Unauthorized' }, { status: 401 })", 'getApiAuthFailureResponse(error)'))).toEqual([]);
    expect(hardcodedAuthFailures(regression.replace('!user', 'data.userId !== user.id'))).toEqual([]);
  });
});
