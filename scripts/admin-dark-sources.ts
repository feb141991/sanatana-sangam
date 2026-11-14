import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Which source files the dark-pages generator reads (and the test checks).
 *
 * Everything under src/app/admin except the overview (the glass-native page and its layout), plus the
 * shared record inspector, which renders inside those pages. The shell, sidebar, top bar, drawer,
 * command palette and overview view are written in glass already and are left out.
 */
const EXTRA_FILES = ["src/components/admin/AdminRecordInspector.tsx"];
const EXCLUDED = new Set(["src/app/admin/page.tsx", "src/app/admin/layout.tsx"]);
// The login page is light on purpose and renders outside the shell.
const EXCLUDED_PREFIXES = ["src/app/admin/login/"];

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx") && !full.endsWith(".test.tsx")) out.push(full);
  }
}

export function readAdminSources(root: string): Array<{ path: string; source: string }> {
  const files: string[] = [];
  walk(join(root, "src/app/admin"), files);
  for (const extra of EXTRA_FILES) files.push(join(root, extra));
  return files
    .map((file) => relative(root, file).split(sep).join("/"))
    .filter((path) => !EXCLUDED.has(path) && !EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix)))
    .sort()
    .map((path) => ({ path, source: readFileSync(join(root, path), "utf8") }));
}
