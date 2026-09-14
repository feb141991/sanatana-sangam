import { describe, it, expect } from 'vitest';
import {
  extractMeaningfulTokens,
  matchDharmVeerFigure,
  isFestivalRuleQuery,
  hasDharmicIntent,
  retrieveDharmaChatGrounding,
} from './chat-grounding';

describe('chat-grounding', () => {
  describe('extractMeaningfulTokens', () => {
    it('filters out common English function stopwords', () => {
      const tokens = extractMeaningfulTokens('What does Krishna say about the mind?');
      expect(tokens).toEqual(['krishna', 'mind']);
    });

    it('returns empty array if only stopwords exist', () => {
      const tokens = extractMeaningfulTokens('What why how when where who');
      expect(tokens).toEqual([]);
    });

    it('keeps Om as a complete devotional token without matching it inside other words', () => {
      expect(extractMeaningfulTokens('What is Om?')).toContain('om');
      expect(extractMeaningfulTokens('How do I use my computer?')).toEqual(['use', 'computer']);
    });
  });

  describe('matchDharmVeerFigure', () => {
    it('matches multi-word hero names and aliases', () => {
      expect(matchDharmVeerFigure('Tell me about Rani Lakshmibai of Jhansi')).toBe('rani-lakshmibai');
      expect(matchDharmVeerFigure('Bravery of Chhatrapati Shivaji Maharaj')).toBe('chhatrapati-shivaji');
      expect(matchDharmVeerFigure('Teachings of Guru Gobind Singh')).toBe('guru-gobind-singh');
      expect(matchDharmVeerFigure('Chanakya Neeti quotes')).toBe('chanakya');
    });

    it('returns null for non-hero queries', () => {
      expect(matchDharmVeerFigure('How to practice pranayama daily?')).toBeNull();
    });
  });

  describe('isFestivalRuleQuery', () => {
    it('detects festival and vrat keywords', () => {
      expect(isFestivalRuleQuery('Why do we fast on Karva Chauth?')).toBe(true);
      expect(isFestivalRuleQuery('Significance of Ekadashi vrat')).toBe(true);
      expect(isFestivalRuleQuery('Maha Shivratri fasting rules')).toBe(true);
    });

    it('returns false for non-festival queries', () => {
      expect(isFestivalRuleQuery('What is the meaning of Om?')).toBe(false);
    });
  });

  describe('hasDharmicIntent', () => {
    it('identifies Dharmic concepts and verse patterns', () => {
      expect(hasDharmicIntent('What is Karma yoga?', ['karma', 'yoga'])).toBe(true);
      expect(hasDharmicIntent('Explain verse 2.47', ['verse'])).toBe(true);
      expect(hasDharmicIntent('Dhammapada teachings', ['dhammapada'])).toBe(true);
      expect(hasDharmicIntent('What is Om?', ['om'])).toBe(true);
    });

    it('returns false for mundane or off-topic queries', () => {
      expect(hasDharmicIntent('What should I eat for breakfast?', ['eat', 'breakfast'])).toBe(false);
      expect(hasDharmicIntent('How is the weather today?', ['weather', 'today'])).toBe(false);
      expect(hasDharmicIntent('How do I use my computer?', ['use', 'computer'])).toBe(false);
      expect(hasDharmicIntent('What is the company policy?', ['company', 'policy'])).toBe(false);
      expect(hasDharmicIntent('What changed in app version 2.47?', ['changed', 'app', 'version', '2.47'])).toBe(false);
    });
  });

  describe('retrieveDharmaChatGrounding integration', () => {
    it('grounds Gita topic query with Chapter 6 verse 26 on controlling the mind', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'What does Krishna say about the wavering mind in the Gita?',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('pathshala_gita');
      expect(res.documents.length).toBeGreaterThan(0);
      expect(res.documents[0].id).toContain('6.26');
      expect(res.groundingPromptText).toContain('PRAMANA GROUNDING');
      expect(res.groundingPromptText).toContain('6.26');
    });

    it('grounds exact verse query with neighboring context', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'Explain Gita 2.47 on action without attachment',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('pathshala_gita');
      expect(res.documents[0].id).toContain('2.47');
    });

    it('grounds Dharm Veer hero queries with authentic source passages', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'Tell me about the bravery of Rani Lakshmibai',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('dharam_veer');
      expect(res.documents.length).toBeGreaterThanOrEqual(1);
      expect(res.documents[0].id).toContain('rani-lakshmibai');
    });

    it('grounds Festival inquiries with governed calendar rules', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'Why do we observe fasting on Karva Chauth?',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('calendar_festival_rules');
      expect(res.documents.some((d) => d.id === 'rule_karva-chauth')).toBe(true);
    });

    it('grounds Upanishadic philosophical inquiries', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'What is the relationship between Atman and Brahman in the Upanishads?',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('pathshala_upanishads');
      expect(res.documents.length).toBeGreaterThan(0);
    });

    it("recognizes but withholds Ramayana inquiries until source audit approval", async () => {
      const res = await retrieveDharmaChatGrounding({
        message: "What is Rama's pledge of refuge in the Ramayana?",
        tradition: "hindu",
      });
      expect(res.isGrounded).toBe(false);
      expect(res.corpus).toBe("valmiki_ramayana");
      expect(res.documents).toHaveLength(0);
      expect(res.groundingPromptText).toContain('APPROVED SOURCE COVERAGE UNAVAILABLE');
      expect(res.groundingPromptText).toContain('does not yet have a source-audited Ramayana passage');
      expect(res.groundingPromptText).not.toContain('verified passages from authorized scriptures');
    });

    it("grounds Puranic Vrat Katha inquiries", async () => {
      const res = await retrieveDharmaChatGrounding({
        message: "Tell me the Karva Chauth katha of Queen Veervati",
        tradition: "hindu",
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe("bhakti_katha");
      expect(res.documents.length).toBeGreaterThan(0);
      expect(res.documents[0].id).toContain("2.12");
      expect(res.groundingPromptText).toContain('CURATED DEVOTIONAL STUDY MATERIAL');
      expect(res.groundingPromptText).toContain('not a verbatim scripture translation');
    });

    it("grounds Satyanarayan Puranic Katha inquiries", async () => {
      const res = await retrieveDharmaChatGrounding({
        message: "Tell me the Satyanarayan katha for Purnima",
        tradition: "hindu",
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe("bhakti_katha");
      expect(res.documents.length).toBeGreaterThan(0);
      expect(res.documents[0].id).toContain("2.7");
    });

    it('fails closed on off-topic and everyday questions without forcing scripture', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'Hello, what should I eat for breakfast?',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(false);
      expect(res.corpus).toBeNull();
      expect(res.documents).toHaveLength(0);
      expect(res.groundingPromptText).toBeNull();
    });

    it.each([
      'How do I use my computer?',
      'What is the company policy?',
      'What changed in app version 2.47?',
    ])('fails closed when a mundane word merely contains a Dharmic term: %s', async (message) => {
      const res = await retrieveDharmaChatGrounding({ message, tradition: 'hindu' });
      expect(res.isGrounded).toBe(false);
      expect(res.corpus).toBeNull();
      expect(res.documents).toHaveLength(0);
    });

    it('prioritizes an explicitly named Gita source over the saved Sikh tradition', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'What does Krishna teach in Bhagavad Gita 2.47?',
        tradition: 'sikh',
      });
      expect(res.isGrounded).toBe(true);
      expect(res.corpus).toBe('pathshala_gita');
      expect(res.documents[0].id).toContain('2.47');
    });

    it('prioritizes an explicitly named Ramayana source over the saved Jain tradition', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: 'What does the Ramayana say about refuge?',
        tradition: 'jain',
      });
      expect(res.isGrounded).toBe(false);
      expect(res.corpus).toBe('valmiki_ramayana');
      expect(res.documents).toHaveLength(0);
      expect(res.groundingPromptText).toContain('APPROVED SOURCE COVERAGE UNAVAILABLE');
    });

    it('fails closed on empty messages', async () => {
      const res = await retrieveDharmaChatGrounding({
        message: '   ',
        tradition: 'hindu',
      });
      expect(res.isGrounded).toBe(false);
      expect(res.corpus).toBeNull();
      expect(res.documents).toHaveLength(0);
    });
  });
});
