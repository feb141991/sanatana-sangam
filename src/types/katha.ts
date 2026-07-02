/**
 * Katha type definitions — zero runtime cost, no katha-library import.
 *
 * These types are copied from src/lib/katha-library.ts.
 * Keep in sync if the source types change.
 */

export type KathaTradition = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';

export type KathaOccasion =
  | 'ekadashi' | 'purnima' | 'amavasya' | 'pradosh' | 'chaturthi'
  | 'shivaratri' | 'navratri' | 'diwali' | 'holi' | 'janmashtami'
  | 'ramnavami' | 'ganesh-chaturthi' | 'karva-chauth' | 'teej'
  | 'gurpurab' | 'baisakhi' | 'vesak' | 'paryushana' | 'uposatha' | 'general';

export interface Katha {
  id: string;
  tradition: KathaTradition;
  occasion: KathaOccasion;
  /** Month number (1–12) for Ekadashi kathas; null for non-month-specific */
  ekadashiMonth?: number;
  deity?: string;
  title: string;
  titleHi?: string;
  titlePa?: string;
  preview: string;
  previewHi?: string;
  previewPa?: string;
  body: string[];
  bodyHi?: string[];
  bodyPa?: string[];
  phal: string;
  phalHi?: string;
  phalPa?: string;
  durationMin: number;
  tags: string[];
  /** Emoji portrait shown on hero cards */
  portrait?: string;
  relatedJapaMantra?: string;
  relatedPathshalaId?: string;
}
