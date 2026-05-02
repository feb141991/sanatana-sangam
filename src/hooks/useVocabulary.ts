import { useMemo } from 'react';
import { getTraditionMeta } from '@/lib/tradition-config';

/**
 * useVocabulary Hook
 * 
 * Provides tradition-aware terminology for common concepts.
 * This ensures that a Sikh user sees "Sangat" while a Hindu user sees "Sangam",
 * even if the underlying feature is the same.
 */
export function useVocabulary(tradition: string = 'hindu') {
  const meta = useMemo(() => getTraditionMeta(tradition), [tradition]);

  /**
   * Translate a base concept into its tradition-specific counterpart.
   * If no translation exists, returns the key itself.
   */
  const term = useMemo(() => {
    return (key: string): string => {
      const normalizedKey = key.toLowerCase();
      const translation = meta.vocabulary[normalizedKey];
      
      if (translation) return translation;
      
      // Fallback: return capitalized key
      return key.charAt(0).toUpperCase() + key.slice(1);
    };
  }, [meta.vocabulary]);

  return { term };
}
