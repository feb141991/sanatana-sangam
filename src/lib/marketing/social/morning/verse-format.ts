/**
 * Where a verse is broken into lines. If the corpus already has line breaks they are kept. Gurbani is stored as
 * one run ("... ॥ ... ॥"), so it is broken after each verse-ending mark, which keeps the mark on the line it ends.
 * This only chooses where lines break: no character is added, removed or changed.
 */
export function formatVerseLines(original: string): string {
  const text = original.trim();
  if (text.includes("\n")) return text;
  return text.replace(/([॥।])\s+(?=\S)/g, "$1\n");
}
