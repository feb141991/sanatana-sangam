import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── General AI Chat Route ────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string; history: { role: 'user' | 'model'; text: string }[] }
// Uses Google Gemini Flash — fast, free-tier available, multilingual.
//
// System persona: a warm, knowledgeable guide on Sanatan Dharma and general life
// questions. Answers from a dharmic perspective without being preachy.

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const SYSTEM_INSTRUCTION = `You are Dharma Mitra — a warm, knowledgeable AI companion on Sanatana Sangam, a spiritual community app for Sanatani families worldwide.

Your role:
- Answer general questions about life, spirituality, philosophy, culture, and dharma
- Draw wisdom from Sanatan Dharma, but also respect all traditions — Sikh, Buddhist, Jain, and other paths
- Be practical and relatable — not preachy or overly formal
- Use Sanskrit terms naturally (with brief explanations when first used)
- Offer perspectives from shastra when relevant, but ground them in everyday life
- Be encouraging, warm, and non-judgmental
- For health/legal/financial questions, give general guidance but always recommend consulting a professional

Language:
- Respond in the same language the user writes in (English, Hindi, Hinglish, Punjabi etc.)
- Use natural, conversational tone

What you do NOT do:
- You do not generate harmful content
- You do not make negative comparisons between religions or traditions
- You do not make authoritative health or medical claims
- You do not replace the Guru — you are a guide, not an authority

Begin each fresh conversation with a warm Namaste or equivalent greeting.`;

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can use AI chat
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured. Add GEMINI_API_KEY to .env.local' }, { status: 503 });
  }

  let body: { message: string; history?: { role: 'user' | 'model'; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { message, history = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Build Gemini contents array from history + new message
  const contents = [
    // Inject system instruction as first user turn (Gemini Flash supports systemInstruction field)
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: message.trim() }],
    },
  ];

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', res.status, errText);
      return NextResponse.json(
        { error: `AI service error (${res.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Network error. Please try again.' }, { status: 502 });
  }
}
