import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCandidateTypePipelineMode,
  getRoutinePipelineMode,
  isCandidateResolverGloballyEnabled,
  shouldProcessCandidateType,
} from './notification-candidate-pipeline-mode';

describe('notification-candidate-pipeline-mode', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to globally disabled when env is unset', () => {
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    expect(isCandidateResolverGloballyEnabled()).toBe(false);
  });

  it('returns true when NOTIFICATION_RESOLVER_ENABLED=true', () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    expect(isCandidateResolverGloballyEnabled()).toBe(true);
  });

  it('defaults new candidate types to disabled', () => {
    expect(getCandidateTypePipelineMode('dharm_veer')).toBe('disabled');
    expect(getCandidateTypePipelineMode('quiz')).toBe('disabled');
    expect(getCandidateTypePipelineMode('streak')).toBe('disabled');
  });

  it('respects per-type candidate mode override', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER = 'candidate';
    process.env.NOTIFICATION_CANDIDATE_MODE_QUIZ = 'legacy';

    expect(getCandidateTypePipelineMode('dharm_veer')).toBe('candidate');
    expect(getCandidateTypePipelineMode('quiz')).toBe('legacy');
    expect(getCandidateTypePipelineMode('streak')).toBe('disabled');
  });

  it('defaults existing routine reminder types to legacy', () => {
    delete process.env.NOTIFICATION_ROUTINE_MODE_JAPA;
    delete process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA;
    delete process.env.NOTIFICATION_ROUTINE_MODE_NITYA;

    expect(getRoutinePipelineMode('japa')).toBe('legacy');
    expect(getRoutinePipelineMode('shloka')).toBe('legacy');
    expect(getRoutinePipelineMode('nitya')).toBe('legacy');
  });

  it('respects per-type routine mode override', () => {
    process.env.NOTIFICATION_ROUTINE_MODE_JAPA = 'candidate';
    process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA = 'disabled';
    process.env.NOTIFICATION_ROUTINE_MODE_NITYA = 'candidate';

    expect(getRoutinePipelineMode('japa')).toBe('candidate');
    expect(getRoutinePipelineMode('shloka')).toBe('disabled');
    expect(getRoutinePipelineMode('nitya')).toBe('candidate');
  });

  it('requires both global flag AND per-type candidate flag to process', () => {
    process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER = 'candidate';

    // Global disabled
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'false';
    expect(shouldProcessCandidateType('dharm_veer')).toBe(false);

    // Global enabled
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    expect(shouldProcessCandidateType('dharm_veer')).toBe(true);

    // Type still disabled
    expect(shouldProcessCandidateType('quiz')).toBe(false);
  });
});
