// ============================================================================
// Shoonaya Mandali Community Q&A & Content Grounding Service
// Provides canonical Shastric verification, citation grounding, and
// non-sectarian guidance for community forum discussions.
// ============================================================================

import { classifyDecisionIntent, getDecisionResponse } from '@/lib/ai/decision-intent';
import { retrieveDharmaChatGrounding } from '@/lib/ai/chat-grounding';
import { performSemanticPramanaSearch } from '@/lib/ai/semantic-search';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export interface MandaliGroundingRequest {
  question: string;
  tradition?: string | null;
  language?: string;
  threadContext?: string;
}

export interface MandaliCitation {
  source: string;
  reference?: string;
  excerpt: string;
}

export interface MandaliGroundingResult {
  status: 'grounded' | 'decision_redirect' | 'general_contemplation';
  guidanceText: string;
  citations: MandaliCitation[];
  relatedJournalSlug?: string;
  isVerified: boolean;
  disclaimer: string;
}

/**
 * Grounds a community question from Mandali against canonical scriptures
 * while maintaining strict anti-sectarian and decision-intent safety.
 */
export async function groundMandaliQuestion(
  request: MandaliGroundingRequest
): Promise<MandaliGroundingResult> {
  const question = request.question.trim();
  const tradition = request.tradition || 'all';

  // 1. Rule 14 Compliance: Check for prohibited date/life-decision intent
  if (classifyDecisionIntent(question)) {
    const decisionReply = getDecisionResponse(request.language || 'en');
    return {
      status: 'decision_redirect',
      guidanceText: decisionReply,
      citations: [
        {
          source: 'Shoonaya Epistemological Guidelines',
          reference: 'Canonical Astrological Policy',
          excerpt: 'A life-altering muhurta (such as marriage, home entry, or starting a business) requires personal consultation with a qualified spiritual teacher or Jyotishi, not automated AI computation.',
        },
      ],
      isVerified: true,
      disclaimer: 'Shoonaya does not computationally select dates for solemn life events.',
    };
  }

  // 2. Retrieve Grounding Passages via Dharma Chat Grounding + Semantic Search
  const [chatGrounding, searchResult] = await Promise.all([
    retrieveDharmaChatGrounding({
      message: question,
      tradition: tradition === 'all' ? 'hindu' : tradition,
    }),
    performSemanticPramanaSearch({
      query: question,
      tradition,
      limit: 3,
    }),
  ]);

  const citations: MandaliCitation[] = [];

  // Extract citations from semantic search
  for (const item of searchResult.results) {
    citations.push({
      source: item.source,
      reference: item.citation,
      excerpt: item.content.slice(0, 200),
    });
  }

  // Find related journal essay if any
  const journalResult = searchResult.results.find((r) => r.category === 'journal');
  const relatedJournalSlug = journalResult ? journalResult.id.replace('journal-', '') : undefined;

  // 3. Synthesize Grounded Guidance Note
  const retrievedPassagesText = citations
    .map((c, i) => `[Source ${i + 1}] ${c.source} (${c.reference || 'Passage'}): ${c.excerpt}`)
    .join('\n\n');

  const system = `You are a reverent, knowledgeable, and tradition-neutral moderator for Shoonaya Mandali.
Provide a clear, respectful answer grounded STRICTLY in the provided classical citations.
Avoid sectarian dogmatism, respect all Dharmic schools, and encourage sincere self-inquiry.`;

  const user = `Community Question: "${question}"
User Tradition Preference: ${tradition}

Grounding Passages Retrieved:
${retrievedPassagesText || 'General Shastric tradition on contemplative sadhana and ethical living.'}

Task: Write a concise, 2-to-3 paragraph guidance note answering the question.
1. Direct answer citing the primary text.
2. The philosophical significance and psychological application.
3. Conclude with humble reverence.`;

  try {
    const res = await generateWithProvider(
      { system, user },
      { maxOutputTokens: 1024 }
    );

    return {
      status: 'grounded',
      guidanceText: res.text.trim(),
      citations,
      relatedJournalSlug,
      isVerified: citations.length > 0,
      disclaimer: 'This guidance note is grounded in verified classical texts. For personal initiation or lineage-specific vows, seek guidance from your Acharya or Guru.',
    };
  } catch {
    // Deterministic fallback if model offline
    const defaultText = citations.length > 0
      ? `In the classical tradition of ${citations[0].source}, spiritual practice balances steady inward discipline (Abhyasa) with sincere surrender. As recorded in ${citations[0].reference || 'the Shastras'}: "${citations[0].excerpt.slice(0, 140)}...".`
      : 'Classical Dharmic traditions emphasize steady, daily contemplative remembrance (Nitya Karma) combined with purity of speech and intention in all community interactions.';

    return {
      status: citations.length > 0 ? 'grounded' : 'general_contemplation',
      guidanceText: defaultText,
      citations,
      relatedJournalSlug,
      isVerified: citations.length > 0,
      disclaimer: 'This guidance note is grounded in verified classical texts. For personal initiation or lineage-specific vows, seek guidance from your Acharya or Guru.',
    };
  }
}
