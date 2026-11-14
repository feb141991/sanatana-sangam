import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readAdminSources } from "../../scripts/admin-dark-sources";
import {
  SCOPE,
  brokenPairs,
  buildAdminDarkCss,
  collectColourClasses,
  contrastRatio,
  darkRuleFor,
  darkSurface,
  parseColourClass,
  resolveLight,
  type ParsedColourClass,
} from "./admin-dark-pages";

const ROOT = process.cwd();

const parse = (token: string): ParsedColourClass => {
  const parsed = parseColourClass(token);
  if (!parsed) throw new Error(`not a colour class: ${token}`);
  return parsed;
};
const rule = (token: string) => darkRuleFor(parse(token));

describe("parseColourClass", () => {
  it("reads property, family, shade, opacity and the supported variants", () => {
    expect(parse("hover:bg-amber-50/50")).toMatchObject({ property: "bg", family: "amber", shade: 50, alpha: 0.5, variants: ["hover"] });
    expect(parse("border-l-rose-500")).toMatchObject({ property: "border", side: "l", family: "rose", shade: 500 });
    expect(parse("bg-white/70")).toMatchObject({ family: "white", shade: null, alpha: 0.7 });
  });

  it("refuses everything that is not a palette colour class, and the dark: variant", () => {
    for (const token of ["dark:bg-slate-800", "bg-[var(--surface-card)]", "text-[10px]", "text-sm", "bg-white-50", "text-gray", "bg-gray-1234", "sm:bg-white"]) {
      expect(parseColourClass(token), token).toBeNull();
    }
  });
});

describe("the dark values", () => {
  it("turns light surfaces into dark glass and leaves strong fills alone", () => {
    expect(rule("bg-white")).toContain("background-color: rgba(24, 21, 26, 0.34)");
    expect(rule("bg-gray-50")).toContain("rgba(255, 255, 255, 0.045)");
    expect(rule("bg-amber-100")).toContain("rgba(245, 158, 11, 0.15)");
    expect(rule("bg-emerald-600")).toBeNull();
    expect(rule("bg-black/60")).toBeNull();
    expect(rule("bg-black/5")).toContain("rgba(255, 255, 255, 0.045)");
  });

  it("scales a fill by the class's own opacity, so bg-white/40 is fainter than bg-white", () => {
    expect(rule("bg-white/40")).toContain("rgba(24, 21, 26, 0.136)");
    expect(rule("bg-white/5")).toContain("rgba(24, 21, 26, 0.017)");
  });

  it("lightens dark text and keeps text that is already light", () => {
    expect(rule("text-gray-900")).toContain("color: #f8f4ee !important");
    expect(rule("text-gray-500")).toContain("color: #bdb5aa !important");
    expect(rule("text-rose-600")).toContain("color: #fda4af !important");
    expect(rule("text-white")).toBeNull();
    expect(rule("text-rose-400")).toBeNull();
  });

  it("writes out the original colour of text the light theme would otherwise force dark (grey, slate, amber, orange)", () => {
    expect(rule("text-gray-200")).toContain("color: #e5e7eb !important");
    expect(rule("text-amber-400")).toContain("color: #fbbf24 !important");
    expect(rule("text-slate-300")).toContain("!important");
  });

  it("maps the same shade differently as a fill and as text", () => {
    expect(rule("bg-emerald-700")).toBeNull();
    expect(rule("text-emerald-700")).toContain("color: #6ee7b7 !important");
  });

  it("maps borders and dividers to light hairlines, and keeps the divide selector", () => {
    expect(rule("border-black/5")).toContain("border-color: rgba(255, 255, 255, 0.08)");
    expect(rule("border-slate-200")).toContain("rgba(255, 255, 255, 0.12)");
    expect(rule("border-l-amber-200")).toContain("border-left-color");
    expect(rule("divide-black/5")).toContain("> :not([hidden]) ~ :not([hidden])");
    expect(rule("border-amber-500")).toBeNull();
  });

  it("scopes hover, focus, group-hover and placeholder variants to the right state", () => {
    expect(rule("hover:bg-gray-50")).toContain(".hover\\:bg-gray-50:hover");
    expect(rule("focus:bg-white")).toContain(":focus");
    expect(rule("group-hover:text-gray-900")).toContain(".group:hover .group-hover\\:text-gray-900");
    expect(rule("placeholder:text-gray-400")).toContain("::placeholder");
  });

  it("builds gradient stops that match Tailwind's own declarations", () => {
    expect(rule("from-amber-50")).toContain("--tw-gradient-from:");
    expect(rule("from-amber-50")).toContain("--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)");
    expect(rule("via-amber-50")).toContain("var(--tw-gradient-via-position)");
    expect(rule("to-amber-50")).toContain("--tw-gradient-to:");
  });

  it("scopes every rule to .admin-pages, tripled so it beats the light-theme overrides", () => {
    const css = buildAdminDarkCss(readAdminSources(ROOT));
    const rules = css.split("\n").filter((line) => line.includes("{"));
    expect(rules.length).toBeGreaterThan(200);
    for (const line of rules) expect(line.startsWith(SCOPE), line).toBe(true);
  });
});

describe("readability on the dark scene", () => {
  const sources = readAdminSources(ROOT);

  it("every text/background pair that was readable as written is still readable (4.5:1), after the generated pair fixes", () => {
    const failures: string[] = [];
    for (const { path, source } of sources) {
      for (const pair of brokenPairs(source)) {
        // The generator restores the original text colour for these; it must then read on the dark surface.
        const original = resolveLight(pair.text);
        const surface = darkSurface(pair.bg);
        const ratio = contrastRatio(original.rgb, surface);
        if (ratio < 4.5) failures.push(`${path}: ${pair.bg.token} + ${pair.text.token} -> ${ratio.toFixed(2)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("the pair rules are in the generated file", () => {
    const css = readFileSync(join(ROOT, "src/app/admin/admin-pages.generated.css"), "utf8");
    for (const { source } of sources) {
      for (const pair of brokenPairs(source)) {
        const needle = `.${pair.bg.token.replace(/([^a-zA-Z0-9_-])/g, "\\$1")}.${pair.text.token.replace(/([^a-zA-Z0-9_-])/g, "\\$1")}`;
        expect(css, needle).toContain(needle);
      }
    }
  });
});

describe("the generated stylesheet", () => {
  it("is up to date: run `npx tsx scripts/generate-admin-dark-pages.ts` after adding or changing a colour class on an admin page", () => {
    const expected = buildAdminDarkCss(readAdminSources(ROOT));
    const actual = readFileSync(join(ROOT, "src/app/admin/admin-pages.generated.css"), "utf8");
    expect(actual).toBe(expected);
  });

  it("covers every palette colour class the admin pages use (mapped, or deliberately kept because it already reads on dark)", () => {
    const used = new Set(readAdminSources(ROOT).flatMap(({ source }) => collectColourClasses(source)));
    expect(used.size).toBeGreaterThan(300);
    for (const token of used) expect(parseColourClass(token), token).not.toBeNull();
  });
});

describe("how the scope is wired", () => {
  it("the admin layout loads both stylesheets and the shell applies .admin-pages", () => {
    const layout = readFileSync(join(ROOT, "src/app/admin/layout.tsx"), "utf8");
    expect(layout).toContain('import "./admin-pages.css"');
    expect(layout).toContain('import "./admin-pages.generated.css"');
    const shell = readFileSync(join(ROOT, "src/components/admin/AdminShell.tsx"), "utf8");
    expect(shell).toContain('<div className="admin-pages">');
    expect(shell).toContain("resolveAdminSurface(pathname)");
  });

  it("the login page is not restyled: it is outside the scan and outside the shell", () => {
    const paths = readAdminSources(ROOT).map((s) => s.path);
    expect(paths.some((p) => p.startsWith("src/app/admin/login/"))).toBe(false);
    expect(paths).not.toContain("src/app/admin/page.tsx");
  });
});
