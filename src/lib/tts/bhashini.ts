export async function synthesizeBhashini(
  text: string,
  style: 'Neutral' | 'Book' = 'Book'
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch('https://tts.bhashini.ai/v1/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: 'Sanskrit',
        voiceName: 'sa-m1',
        voiceStyle: style,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => response.statusText);
      throw new Error(`Bhashini ${response.status}: ${msg}`);
    }

    const audioBytes = await response.arrayBuffer();
    return Buffer.from(audioBytes).toString('base64');
  } finally {
    clearTimeout(timeout);
  }
}
