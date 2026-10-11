const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
const META_REQUEST_TIMEOUT_MS = 10_000;

export interface MetaPageConnection {
  id: string;
  name: string;
  accessToken: string;
  instagramBusinessAccountId: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseMetaPagesPayload(payload: unknown): MetaPageConnection[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return null;

  const pages: MetaPageConnection[] = [];
  for (const value of payload.data) {
    if (!isRecord(value)) return null;
    const id = requiredString(value.id);
    const name = requiredString(value.name);
    const accessToken = requiredString(value.access_token);
    if (!id || !name || !accessToken) return null;

    const instagram = value.instagram_business_account;
    const instagramBusinessAccountId = isRecord(instagram)
      ? requiredString(instagram.id)
      : null;

    pages.push({ id, name, accessToken, instagramBusinessAccountId });
  }
  return pages;
}

async function graphGet(path: string, token: string, fields: string): Promise<Response> {
  const url = new URL(`${GRAPH_API_BASE}/${path}`);
  url.searchParams.set("fields", fields);
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(META_REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
}

export async function fetchMetaPages(token: string): Promise<MetaPageConnection[] | null> {
  const response = await graphGet("me/accounts", token, "id,name,access_token,instagram_business_account");
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  return parseMetaPagesPayload(payload);
}

export async function fetchInstagramUsername(id: string, token: string): Promise<string | null> {
  const response = await graphGet(encodeURIComponent(id), token, "username");
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) ? requiredString(payload.username) : null;
}
