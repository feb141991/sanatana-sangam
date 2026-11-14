import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildAdminDarkCss } from "../src/lib/admin-dark-pages";
import { readAdminSources } from "./admin-dark-sources";

/** Writes src/app/admin/admin-pages.generated.css. Run: npx tsx scripts/generate-admin-dark-pages.ts */
export const GENERATED_CSS_PATH = "src/app/admin/admin-pages.generated.css";

const root = process.cwd();
const css = buildAdminDarkCss(readAdminSources(root));
writeFileSync(join(root, GENERATED_CSS_PATH), css);
console.log(`wrote ${GENERATED_CSS_PATH}: ${css.split("\n").filter((line) => line.includes("{")).length} rules`);
