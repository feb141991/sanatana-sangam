import { describe, it, expect, vi } from 'vitest';
import {
  performSupportDeflection,
  synthesizeSupportTicket,
  generateTicketNumber,
} from './support-rag';

// Mock generateWithProvider to test deterministic logic without live network calls
vi.mock('@/lib/ai/providers/inference', () => ({
  generateWithProvider: vi.fn().mockImplementation(async ({ user }) => {
    return {
      text: `Mocked AI guidance for: ${typeof user === 'string' ? user.slice(0, 30) : 'user prompt'}`,
      tokensUsed: 42,
    };
  }),
}));

describe('Support RAG & Ticket Escalation Engine', () => {
  it('generates a valid human-readable ticket number in format TKT-YYYYMM-XXXX', () => {
    const tkt = generateTicketNumber();
    expect(tkt).toMatch(/^TKT-\d{6}-[A-Z0-9]{4}$/);
  });

  it('deflects astronomical Panchang timing inquiries with high confidence', async () => {
    const res = await performSupportDeflection({
      query: 'Why is Ekadashi on different dates in London compared to Delhi?',
    });

    expect(res.confidence).toBeGreaterThanOrEqual(0.5);
    expect(res.deflected).toBe(true);
    expect(res.suggestedCategory).toBe('calendar_panchang');
    expect(res.bulletPoints.length).toBeGreaterThan(0);
    expect(res.suggestedLinks.some(l => l.href.includes('panchang') || l.href.includes('settings'))).toBe(true);
  });

  it('deflects Japa Mala counter sync questions', async () => {
    const res = await performSupportDeflection({
      query: 'Does the Japa Mala counter sync my bead repetitions when I am offline?',
    });

    expect(res.confidence).toBeGreaterThanOrEqual(0.5);
    expect(res.suggestedCategory).toBe('sadhana_japa');
    expect(res.suggestedLinks.some(l => l.href.includes('japa'))).toBe(true);
  });

  it('flags crash and severe errors for urgent human escalation', async () => {
    const res = await performSupportDeflection({
      query: 'The app crashes immediately when I open my birth chart Kundali',
    });

    expect(res.requiresHumanEscalation).toBe(true);
    expect(res.suggestedPriority).toBe('urgent');
    expect(res.suggestedCategory).toBe('app_bug');
    expect(res.deflected).toBe(false);
  });

  it('flags login blocks for high priority escalation', async () => {
    const res = await performSupportDeflection({
      query: 'I cannot login to my account after switching phones',
    });

    expect(res.requiresHumanEscalation).toBe(true);
    expect(res.suggestedPriority).toBe('high');
    expect(res.suggestedCategory).toBe('account_auth');
  });

  it('synthesizes a structured ticket draft with ticket number and client metadata', async () => {
    const ticket = await synthesizeSupportTicket({
      query: 'The sunrise notifications are 15 minutes late in Chicago',
      seekerName: 'Arjun Das',
      seekerEmail: 'arjun@example.com',
      ragResponse: 'Previous RAG answer attempted',
      clientMetadata: {
        platform: 'android',
        city: 'Chicago',
        timezone: 'America/Chicago',
      },
      ragFeedback: 'unresolved',
    });

    expect(ticket.ticketNumber).toMatch(/^TKT-\d{6}-[A-Z0-9]{4}$/);
    expect(ticket.subject.length).toBeGreaterThan(5);
    expect(ticket.description).toContain('Chicago');
    expect(ticket.ragDeflectionAttempted).toBe(true);
    expect(ticket.ragDeflectionFeedback).toBe('unresolved');
    expect(ticket.clientMetadata.platform).toBe('android');
    expect(ticket.clientMetadata.city).toBe('Chicago');
  });
});
