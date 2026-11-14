/**
 * Pure helpers behind components/admin/AdminTabs.tsx, kept free of React so the keyboard
 * and fallback rules can be tested without rendering.
 */

/** Where focus and selection go when `key` is pressed on the tab at `current`. Null = not a tab key. */
export function nextTabIndex(current: number, key: string, length: number): number | null {
  if (!Number.isInteger(current) || length <= 0) return null;
  switch (key) {
    case "ArrowRight":
      return (current + 1) % length;
    case "ArrowLeft":
      return (current - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
}

/**
 * The tab that is shown as selected. A stale or unknown id (an old `?tab=` link, a tab that was
 * removed) falls back to the first tab instead of leaving the rail with nothing selected, which
 * would also leave it with no tab stop for the keyboard.
 */
export function resolveActiveTabId<Id extends string>(
  tabs: ReadonlyArray<{ id: Id }>,
  activeId: string,
): Id | null {
  if (tabs.length === 0) return null;
  const match = tabs.find((tab) => tab.id === activeId);
  return (match ?? tabs[0]).id;
}

/** A tab badge as text: counts above 99 collapse, empty values disappear. */
export function formatTabBadge(badge: string | number | undefined | null): string | null {
  if (badge === undefined || badge === null || badge === "") return null;
  if (typeof badge === "number") {
    if (!Number.isFinite(badge) || badge < 0) return null;
    return badge > 99 ? "99+" : String(Math.trunc(badge));
  }
  return badge;
}
