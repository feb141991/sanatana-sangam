/**
 * Which look an admin route gets inside the shell (components/admin/AdminShell.tsx):
 *   overview  the glass-native overview, drawn directly on the dusk scene
 *   glass     an older page, restyled dark by the `.admin-pages` scope (src/app/admin/admin-pages.css)
 *   sheet     an older page kept on a light cream panel
 *
 * `sheet` is a safety valve: if a page cannot be made to read well on dark, list its route here and it
 * goes back to the light design until it is fixed. It is empty because every page is on glass.
 */
export type AdminSurface = "overview" | "glass" | "sheet";

export const LIGHT_SHEET_ROUTES: ReadonlyArray<string> = [];

export function resolveAdminSurface(pathname: string | null | undefined): AdminSurface {
  if (!pathname) return "glass";
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/admin") return "overview";
  if (LIGHT_SHEET_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))) return "sheet";
  return "glass";
}
