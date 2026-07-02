export async function synthesizeBhashini(
  text: string,
  style: 'Neutral' | 'Book' = 'Book'
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  // Support optional API key — add BHASHINI_API_KEY to Vercel env when available
  const apiKey = process.env.BHASHINI_API_KEY?.trim();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const response = await fetch('https://tts.bhashini.ai/v1/synthesize', {
      method: 'POST',
      headers,
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
