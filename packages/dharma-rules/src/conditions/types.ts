export const CONDITION_EVALUATOR_VERSION = '1.0.0';

export interface LocationInput {
  lat: number;
  lon: number;
  tz: string; // IANA timezone, e.g. 'Asia/Kolkata'
}

export type LocationInputWithTz = LocationInput;

export type PeriodType =
  | 'sunrise'
  | 'sunset'
  | 'midday'
  | 'moonrise'
  | 'moonset'
  | 'nishita'
  | 'pradosha'
  | 'madhyahna'
  | 'aparahna'
  | 'brahma_muhurta'
  | 'abhijit'
  | 'arunodaya';

export type PresenceMode = 'at' | 'prevails' | 'touches' | 'majority';

export interface BaseCondition {
  type: string;
}

export interface LunarMonthCondition extends BaseCondition {
  type: 'lunar_month';
  value: string;
  monthSystem: 'purnimanta' | 'amanta';
}

export interface PakshaCondition extends BaseCondition {
  type: 'paksha';
  value: 'shukla' | 'krishna';
}

export interface TithiCondition extends BaseCondition {
  type: 'tithi';
  value: number; // 1..15 (canonical within-paksha index). absolute indices (1..30) are deprecated.
  paksha?: 'shukla' | 'krishna';
}

export interface NakshatraCondition extends BaseCondition {
  type: 'nakshatra';
  value: string;
}

export interface TithiPresenceCondition extends BaseCondition {
  type: 'tithi_presence';
  tithi: number;
  period: PeriodType;
  mode: PresenceMode;
}

export interface NakshatraPresenceCondition extends BaseCondition {
  type: 'nakshatra_presence';
  nakshatra: string;
  period: PeriodType;
  mode: PresenceMode;
}

export interface ViddhaCondition extends BaseCondition {
  type: 'viddha';
  piercedBy: number; // e.g. 10
  atPeriod: 'arunodaya' | 'sunrise';
  action: 'shift_next' | 'shift_prev' | 'disqualify';
}

export interface GenericCondition extends BaseCondition {
  type: string;
  [key: string]: any;
}

export type RuleCondition =
  | LunarMonthCondition
  | PakshaCondition
  | TithiCondition
  | NakshatraCondition
  | TithiPresenceCondition
  | NakshatraPresenceCondition
  | ViddhaCondition
  | GenericCondition;

export interface EvaluationReason {
  code: string;
  text: string;
  details?: Record<string, any>;
}

export interface ConditionEvaluationResult {
  conditionType: string;
  satisfied: boolean | 'indeterminate';
  reasons: EvaluationReason[];
  diagnostics: string[];
  window?: {
    name: string;
    startUtc: string;
    endUtc: string;
    startLocal: string;
    endLocal: string;
  };
  astronomy?: {
    tithiIndex?: number;
    tithiName?: string;
    nakshatraName?: string;
    paksha?: string;
    masaName?: string;
  };
}

export interface VariantEvaluationResult {
  ruleId: string;
  festivalId: string;
  civilDate: string;
  location: LocationInput;
  traditionProfile?: string;
  qualified: boolean | 'indeterminate';
  conditionResults: ConditionEvaluationResult[];
  reasons: EvaluationReason[];
  diagnostics: string[];
}
