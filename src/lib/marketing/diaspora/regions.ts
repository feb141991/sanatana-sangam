/**
 * Where the audience lives. Only what changes how copy should be written: the English it is written in and who
 * to picture. Each note is guidance on tone ("Write for ...") and never a statement of fact about a place: no
 * population figures, no claims about worship facilities, and no claim that the product has temples or users in
 * a place (the directory's coverage is still growing; see claims.ts).
 */

export type RegionId = "uk" | "usa" | "canada" | "australia_nz" | "gulf" | "singapore_malaysia" | "europe" | "east_africa";

export interface Region {
  id: RegionId;
  label: string;
  /** The spelling to write in. */
  spelling: "British" | "American" | "Canadian" | "Australian";
  /** Who to picture while writing. */
  writeFor: string;
}

export const REGIONS: readonly Region[] = [
  { id: "uk", label: "United Kingdom", spelling: "British", writeFor: "people balancing work and school routines with festivals that often fall on an ordinary weekday" },
  { id: "usa", label: "United States", spelling: "American", writeFor: "households spread across time zones and far from extended family" },
  { id: "canada", label: "Canada", spelling: "Canadian", writeFor: "families who gather across long distances" },
  { id: "australia_nz", label: "Australia and New Zealand", spelling: "Australian", writeFor: "people whose festival day begins well before it does for family in other countries" },
  { id: "gulf", label: "Gulf states", spelling: "British", writeFor: "people living away from family; keep the tone private and home-based" },
  { id: "singapore_malaysia", label: "Singapore and Malaysia", spelling: "British", writeFor: "communities where several traditions live side by side; never blur them" },
  { id: "europe", label: "Europe", spelling: "British", writeFor: "smaller, scattered communities where practice often happens at home" },
  { id: "east_africa", label: "East Africa", spelling: "British", writeFor: "families who may be several generations from the original move" }
];

export function regionById(id: string): Region | undefined {
  return REGIONS.find((region) => region.id === id);
}
