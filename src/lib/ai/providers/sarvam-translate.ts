/**
 * Sarvam Translation API Adapter
 * 
 * Provides a dedicated path for translating terms using Sarvam's translation endpoint.
 */

export interface SarvamTranslateRequest {
  input: string;
  source_language_code: string;
  target_language_code: string;
  speaker_gender?: string;
  mode?: string;
  model?: string;
}

export interface SarvamTranslateResponse {
  translated_text: string;
}

export async function generateSarvamTranslation(
  apiKey: string,
  request: SarvamTranslateRequest
): Promise<string> {
  const url = 'https://api.sarvam.ai/translate';

  const payload = {
    input: request.input,
    source_language_code: request.source_language_code,
    target_language_code: request.target_language_code,
    speaker_gender: request.speaker_gender ?? 'Male',
    mode: request.mode ?? 'formal',
    model: request.model ?? 'sarvam-1',
    enable_preprocessing: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Sarvam Translate API failed with status ${response.status}: ${errorBody}`);
  }

  const data = await response.json() as SarvamTranslateResponse;
  
  if (!data || typeof data.translated_text !== 'string') {
    throw new Error('Malformed response from Sarvam Translate API.');
  }

  return data.translated_text;
}
