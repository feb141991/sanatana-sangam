// ============================================================================
// Shoonaya Support RAG & Autonomous Ticket Escalation Engine
// Handles first-tier grounded deflection using the Shoonaya Knowledge Base
// and autonomous ticket synthesis when human assistance is needed.
// ============================================================================

import { SHOONAYA_SUPPORT_CORPUS, type SupportFaqItem } from '@/lib/support/support-knowledge';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { generateTicketNumber } from '@/lib/support/ticket-access';

export type TicketCategory =
  | 'calendar_panchang'
  | 'sadhana_japa'
  | 'account_auth'
  | 'app_bug'
  | 'spiritual_content'
  | 'billing_donation'
  | 'general';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_seeker' | 'resolved' | 'closed';

export interface ClientMetadata {
  platform?: 'web' | 'android' | 'ios' | 'unknown';
  userAgent?: string;
  appVersion?: string;
  city?: string;
  tradition?: string;
  timezone?: string;
  language?: string;
}

export interface SupportDeflectionRequest {
  query: string;
  category?: TicketCategory;
  clientMetadata?: ClientMetadata;
}

export interface SupportDeflectionResponse {
  deflected: boolean;
  confidence: number;
  answer: string;
  bulletPoints: string[];
  suggestedLinks: Array<{ label: string; href: string }>;
  suggestedCategory: TicketCategory;
  suggestedPriority: TicketPriority;
  requiresHumanEscalation: boolean;
}

export interface SynthesizedTicketDraft {
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  ragDeflectionAttempted: boolean;
  ragSolutionOffered: string;
  ragDeflectionFeedback?: 'helpful' | 'unresolved' | 'skipped';
  clientMetadata: ClientMetadata;
}

/**
 * Searches the support knowledge corpus for matching articles.
 */
function searchSupportCorpus(query: string, preferredCategory?: TicketCategory): Array<{ item: SupportFaqItem; score: number }> {
  const normalized = query.toLowerCase();
  const tokens = normalized.split(/\W+/).filter(t => t.length > 2);

  const scored = SHOONAYA_SUPPORT_CORPUS.map((item) => {
    let score = 0;

    // Check title match
    const titleLower = item.title.toLowerCase();
    for (const token of tokens) {
      if (titleLower.includes(token)) score += 3.0;
    }

    // Check keywords
    for (const kw of item.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 2.5;
      }
      for (const token of tokens) {
        if (kw.toLowerCase().includes(token)) score += 1.5;
      }
    }

    // Check summary match
    const summaryLower = item.summary.toLowerCase();
    for (const token of tokens) {
      if (summaryLower.includes(token)) score += 0.8;
    }

    // Category boost
    if (preferredCategory && item.category === preferredCategory) {
      score += 2.0;
    }

    return { item, score };
  });

  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
}

/**
 * Determines whether a query inherently requires human intervention
 * (e.g. data deletion, bug report, payment issue, explicit human request).
 */
function checkCriticalEscalationIntent(query: string): { requiresEscalation: boolean; priority: TicketPriority; category: TicketCategory } {
  const q = query.toLowerCase();

  // Urgent: Crash, severe data loss, security exploit
  if (q.includes('crash') || q.includes('crashes') || q.includes('data loss') || q.includes('security') || q.includes('exploit') || q.includes('hacked')) {
    return { requiresEscalation: true, priority: 'urgent', category: 'app_bug' };
  }

  // High: Login blocked, account recovery, refund/billing, date mismatch claim
  if (q.includes('cannot login') || q.includes("can't log in") || q.includes('locked out') || q.includes('account deleted') || q.includes('wrong date')) {
    return {
      requiresEscalation: true,
      priority: 'high',
      category: q.includes('wrong date') ? 'calendar_panchang' : 'account_auth',
    };
  }

  // Medium: Direct human agent request
  if (q.includes('human') || q.includes('speak to agent') || q.includes('support team') || q.includes('talk to someone') || q.includes('raise ticket')) {
    return { requiresEscalation: true, priority: 'medium', category: 'general' };
  }

  return { requiresEscalation: false, priority: 'medium', category: 'general' };
}

/**
 * Primary RAG First-Tier Deflection Service
 * Attempts to answer the user query with high accuracy and compassion.
 */
export async function performSupportDeflection(
  request: SupportDeflectionRequest
): Promise<SupportDeflectionResponse> {
  const query = request.query.trim();
  const escalationCheck = checkCriticalEscalationIntent(query);
  const searchResults = searchSupportCorpus(query, request.category);

  // If top match exists
  const topMatch = searchResults[0]?.item;
  const matchScore = searchResults[0]?.score ?? 0;

  // Confidence calculation
  const confidence = Math.min(1.0, Math.max(0.2, matchScore / 10));
  const suggestedCategory: TicketCategory =
    request.category ||
    (escalationCheck.requiresEscalation
      ? escalationCheck.category
      : topMatch?.category || 'general');
  const suggestedPriority: TicketPriority = escalationCheck.priority;

  // Build context from top matching knowledge items
  const contextSnippets = searchResults
    .slice(0, 3)
    .map(s => `Title: ${s.item.title}\nCategory: ${s.item.category}\nSummary: ${s.item.summary}\nSteps: ${s.item.steps?.join('; ') ?? 'N/A'}`)
    .join('\n\n');

  // Attempt Sarvam AI generation for a polished, compassionate answer
  let aiAnswer = '';
  let bulletPoints: string[] = topMatch?.steps || [];
  let suggestedLinks = topMatch?.actionLinks || [{ label: 'Shoonaya Home', href: '/' }];

  if (contextSnippets && !escalationCheck.requiresEscalation) {
    try {
      const system = `You are the Shoonaya Devotee Care Assistant.
Your duty is to assist seekers respectfully, clearly, and concisely.
Ground your response exclusively in the provided context from Shoonaya's knowledge base.
Never invent capabilities or external services.
Tone: Calm, respectful, compassionate, and precise.
Provide a clear 2-3 sentence explanation followed by actionable steps if applicable.`;

      const user = `Devotee Inquiry: "${query}"

Shoonaya Knowledge Base Context:
${contextSnippets}

Answer the inquiry directly, reassuring the devotee.`;

      const res = await generateWithProvider({ system, user }, { maxOutputTokens: 512 });
      if (res.text && res.text.trim().length > 20) {
        aiAnswer = res.text.trim();
      }
    } catch {
      // Deterministic fallback if AI provider is unavailable
      aiAnswer = topMatch ? topMatch.summary : 'Shoonaya provides dedicated support for your spiritual practice, astronomical timings, and account management.';
    }
  } else if (topMatch) {
    aiAnswer = topMatch.summary;
  } else {
    aiAnswer = 'We want to ensure your spiritual practice and app experience are smooth. Please share more details or raise a ticket so our care team can assist you directly.';
    bulletPoints = [
      'Describe the exact step or screen where you encountered an issue.',
      'Mention your city or timezone if related to Panchang or Muhurta timings.',
    ];
    suggestedLinks = [{ label: 'Help & Knowledge Center', href: '/help' }];
  }

  return {
    deflected: confidence >= 0.5 && !escalationCheck.requiresEscalation,
    confidence,
    answer: aiAnswer,
    bulletPoints,
    suggestedLinks,
    suggestedCategory,
    suggestedPriority,
    requiresHumanEscalation: escalationCheck.requiresEscalation,
  };
}

/**
 * Autonomous Ticket Synthesizer
 * Formats a clean, structured support ticket when RAG deflection does not resolve the issue.
 */
export async function synthesizeSupportTicket(params: {
  query: string;
  seekerName: string;
  seekerEmail: string;
  ragResponse?: string;
  category?: TicketCategory;
  clientMetadata?: ClientMetadata;
  ragFeedback?: 'helpful' | 'unresolved' | 'skipped';
}): Promise<SynthesizedTicketDraft> {
  const ticketNumber = generateTicketNumber();
  const escalation = checkCriticalEscalationIntent(params.query);
  const category: TicketCategory = params.category || escalation.category || 'general';
  const priority: TicketPriority = escalation.priority;

  // Generate a clean subject line
  let subject = params.query.slice(0, 75).trim();
  if (params.query.length > 75) {
    subject = `${subject}...`;
  }

  // Attempt smart AI subject summarization if query is long
  if (params.query.length > 50) {
    try {
      const system = 'You are an IT & Devotee Support triage assistant. Generate a concise, clear ticket title (maximum 8 words) summarizing the user inquiry. Return only the title without quotes or punctuation.';
      const res = await generateWithProvider({ system, user: params.query }, { maxOutputTokens: 30 });
      if (res.text && res.text.trim().length > 5) {
        subject = res.text.trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      // Fallback to truncated text
    }
  }

  return {
    ticketNumber,
    subject,
    description: params.query,
    category,
    priority,
    ragDeflectionAttempted: Boolean(params.ragResponse),
    ragSolutionOffered: params.ragResponse || '',
    ragDeflectionFeedback: params.ragFeedback || 'unresolved',
    clientMetadata: params.clientMetadata || {},
  };
}
