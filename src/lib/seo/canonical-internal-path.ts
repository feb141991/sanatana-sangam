/** Resolve legacy paths found in persisted public content to direct destinations. */
export function canonicalInternalPath(path: string): string {
  return path.replace(/^\/vichaar-sabha(?=\/|[?#]|$)/, "/mandali");
}
