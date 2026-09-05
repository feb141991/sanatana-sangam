/**
 * Canonical Admin Route Registry for Shoonaya Operations.
 * Single source of truth for rail groups, breadcrumbs, command palette search,
 * and active navigation state matching.
 */

export type AdminNavGroupId =
  | "overview"
  | "work_queues"
  | "operations"
  | "content_community"
  | "reports_settings";

export interface AdminRouteItem {
  id: string;
  path: string;
  title: string;
  shortTitle: string;
  description: string;
  group: AdminNavGroupId;
  iconName: string;
  badge?: string;
  exact?: boolean;
}

export interface AdminNavGroup {
  id: AdminNavGroupId;
  label: string;
  items: AdminRouteItem[];
}

export const ADMIN_ROUTES: AdminRouteItem[] = [
  {
    id: "overview",
    path: "/admin",
    title: "Command Center Overview",
    shortTitle: "Overview",
    description: "System health vitals, active urgent alerts & operational status",
    group: "overview",
    iconName: "Home",
    exact: true,
  },
  // Work Queues
  {
    id: "moderation",
    path: "/admin/moderation",
    title: "Trust & Moderation Hub",
    shortTitle: "Moderation",
    description: "Devotee content reports, AI chat guardrails & user moderation",
    group: "work_queues",
    iconName: "ShieldAlert",
  },
  {
    id: "calendar-governance",
    path: "/admin/calendar-governance",
    title: "Calendar Governance & Integrity",
    shortTitle: "Calendar Governance",
    description: "Astronomical rule verification, golden fixtures & integrity findings",
    group: "work_queues",
    iconName: "Calendar",
  },
  {
    id: "dharm-veer-review",
    path: "/admin/dharm-veer-review",
    title: "Dharm Veer Review Queue",
    shortTitle: "Dharm Veer Review",
    description: "Auto-sourced biography review & citation verification queue",
    group: "work_queues",
    iconName: "ShieldCheck",
  },
  // Operations
  {
    id: "monitoring",
    path: "/admin/monitoring",
    title: "Operational Monitoring Window",
    shortTitle: "Monitoring",
    description: "Live gateway vitals, client crashes, DB pool & server telemetry",
    group: "operations",
    iconName: "Radio",
  },
  {
    id: "logs",
    path: "/admin/logs",
    title: "Unified Log Explorer",
    shortTitle: "Logs",
    description: "Cross-domain telemetry, correlation identifiers & diagnostic events",
    group: "operations",
    iconName: "Terminal",
  },
  {
    id: "crons",
    path: "/admin/crons",
    title: "Cron Health & Automations",
    shortTitle: "Crons",
    description: "Background routines, schedule timeline & manual test runners",
    group: "operations",
    iconName: "Activity",
  },
  {
    id: "notifications",
    path: "/admin/notifications",
    title: "Notification Studio",
    shortTitle: "Notifications",
    description: "Push notification copy editor, queue inspector & live simulator",
    group: "operations",
    iconName: "Bell",
    badge: "Studio",
  },
  // Content & Community
  {
    id: "observance-content",
    path: "/admin/observance-content",
    title: "Observance Content Studio",
    shortTitle: "Observance Content",
    description: "Sacred stories, deity artwork & festival editorial drafts",
    group: "content_community",
    iconName: "BookOpen",
  },
  {
    id: "users",
    path: "/admin/users",
    title: "Seeker Directory & Dossiers",
    shortTitle: "Users",
    description: "Devotee profiles, activity timelines & lifecycle segments",
    group: "content_community",
    iconName: "Users",
  },
  {
    id: "tirtha",
    path: "/admin/tirtha",
    title: "Mandali & Tirtha Hub",
    shortTitle: "Tirtha & Mandali",
    description: "Pilgrimage nodes, temple directory & community chapters",
    group: "content_community",
    iconName: "MapPin",
  },
  {
    id: "broadcast",
    path: "/admin/broadcast",
    title: "Global Devotee Broadcast",
    shortTitle: "Broadcast",
    description: "Platform-wide emergency alerts, push & SMS broadcasts",
    group: "content_community",
    iconName: "Send",
  },
  {
    id: "hindi-generator",
    path: "/admin/hindi-generator",
    title: "Sacred Hindi Generator",
    shortTitle: "Hindi Generator",
    description: "Scriptural verse translation & linguistic curation",
    group: "content_community",
    iconName: "Languages",
  },
  // Reports & Settings
  {
    id: "reports",
    path: "/admin/reports",
    title: "Executive Reports & Analytics",
    shortTitle: "Reports",
    description: "Retention pulse, sadhana metrics, Japa completions & CSV export",
    group: "reports_settings",
    iconName: "FileText",
  },
  {
    id: "settings",
    path: "/admin/settings",
    title: "Platform Settings",
    shortTitle: "Settings",
    description: "System configuration, engine toggles & admin credentials",
    group: "reports_settings",
    iconName: "Settings",
  },
];

export const GROUP_TITLES: Record<AdminNavGroupId, string> = {
  overview: "Overview",
  work_queues: "Work Queues",
  operations: "Operations",
  content_community: "Content & Community",
  reports_settings: "Reports & Settings",
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    label: GROUP_TITLES.overview,
    items: ADMIN_ROUTES.filter((r) => r.group === "overview"),
  },
  {
    id: "work_queues",
    label: GROUP_TITLES.work_queues,
    items: ADMIN_ROUTES.filter((r) => r.group === "work_queues"),
  },
  {
    id: "operations",
    label: GROUP_TITLES.operations,
    items: ADMIN_ROUTES.filter((r) => r.group === "operations"),
  },
  {
    id: "content_community",
    label: GROUP_TITLES.content_community,
    items: ADMIN_ROUTES.filter((r) => r.group === "content_community"),
  },
  {
    id: "reports_settings",
    label: GROUP_TITLES.reports_settings,
    items: ADMIN_ROUTES.filter((r) => r.group === "reports_settings"),
  },
];

export interface MatchedAdminRoute {
  route: AdminRouteItem;
  groupLabel: string;
  breadcrumb: string[];
}

/**
 * Resolves active route information and breadcrumbs from a pathname.
 */
export function getAdminRouteByPath(pathname: string | null | undefined): MatchedAdminRoute | null {
  if (!pathname || !pathname.startsWith("/admin")) return null;
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/admin";

  if (cleanPath === "/admin") {
    const overviewRoute = ADMIN_ROUTES.find((r) => r.id === "overview")!;
    return {
      route: overviewRoute,
      groupLabel: GROUP_TITLES.overview,
      breadcrumb: ["Admin", "Overview"],
    };
  }

  // Exact or prefix match (excluding /admin)
  const matches = ADMIN_ROUTES.filter((r) => r.path !== "/admin" && (cleanPath === r.path || cleanPath.startsWith(`${r.path}/`)));

  if (matches.length === 0) {
    return null;
  }

  // Pick longest matching prefix
  matches.sort((a, b) => b.path.length - a.path.length);
  const bestMatch = matches[0];
  const groupLabel = GROUP_TITLES[bestMatch.group];

  return {
    route: bestMatch,
    groupLabel,
    breadcrumb: ["Admin", groupLabel, bestMatch.shortTitle],
  };
}

/**
 * Searches route titles, short titles, paths, and descriptions.
 * Exclusively searches route metadata; does not claim to search logs or users.
 */
export function searchAdminRoutes(query: string): AdminRouteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ADMIN_ROUTES;

  const terms = q.split(/\s+/);
  return ADMIN_ROUTES.filter((r) => {
    const haystack = `${r.title} ${r.shortTitle} ${r.description} ${r.path} ${GROUP_TITLES[r.group]}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
