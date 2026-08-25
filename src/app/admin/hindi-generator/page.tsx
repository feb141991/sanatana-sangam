import { GITA_FULL_DATA } from "@/lib/gita-full-data";
import { ALL_LIBRARY_ENTRIES } from "@/lib/library-content";
import { HindiGeneratorClient } from "./HindiGeneratorClient";

export default function HindiGeneratorPage() {
  const allEntries = [
    // Gita entries
    ...GITA_FULL_DATA.map((e) => ({ id: e.id, meaning: (e as any).meaning as string })),
    // Library entries
    ...ALL_LIBRARY_ENTRIES.map((e) => ({ id: e.id, meaning: e.meaning })),
  ].filter((e) => e.id && e.meaning);

  return <HindiGeneratorClient entries={allEntries} />;
}
