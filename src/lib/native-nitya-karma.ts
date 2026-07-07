export type NativeNityaStepId =
  | 'woke_brahma_muhurta'
  | 'snana_done'
  | 'tilak_done'
  | 'japa_done'
  | 'sandhya_done'
  | 'aarti_done'
  | 'shloka_done';

export const NATIVE_NITYA_STEP_ORDER: readonly NativeNityaStepId[] = [
  'woke_brahma_muhurta',
  'snana_done',
  'tilak_done',
  'japa_done',
  'sandhya_done',
  'aarti_done',
  'shloka_done',
];

export function isNativeNityaStepId(value: string): value is NativeNityaStepId {
  return (NATIVE_NITYA_STEP_ORDER as readonly string[]).includes(value);
}

export function countCompletedNativeNityaSteps(doneIds: ReadonlySet<string>) {
  return NATIVE_NITYA_STEP_ORDER.filter((stepId) => doneIds.has(stepId)).length;
}
