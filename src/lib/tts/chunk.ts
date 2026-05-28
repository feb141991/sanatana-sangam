export function chunkText(text: string, maxLen = 500): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxLen) {
    const slice = remaining.slice(0, maxLen);

    const BREAKS = ['॥', '।', '\n', '. ', '? ', '! ', '; ', ', '];
    let breakIdx = -1;

    for (const bp of BREAKS) {
      const idx = slice.lastIndexOf(bp);
      if (idx > 10) {
        breakIdx = idx + bp.length;
        break;
      }
    }

    if (breakIdx === -1) breakIdx = maxLen;

    chunks.push(remaining.slice(0, breakIdx).trim());
    remaining = remaining.slice(breakIdx).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks.filter((c) => c.length > 0);
}

export function mergeAudioChunks(base64Chunks: string[]): string {
  if (base64Chunks.length === 1) return base64Chunks[0];
  const buffers = base64Chunks.map((b) => Buffer.from(b, 'base64'));
  return Buffer.concat(buffers).toString('base64');
}
