import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AGE_GUIDANCE_POLICY,
  ageOnDate,
  isUnderGuidanceAge,
} from './age-guidance';

describe('age guidance policy', () => {
  const today = new Date(2026, 7, 25);

  it('handles the eighteenth-birthday boundary without blocking accounts', () => {
    assert.equal(ageOnDate('2008-08-25', today), 18);
    assert.equal(isUnderGuidanceAge('2008-08-25', today), false);
    assert.equal(isUnderGuidanceAge('2008-08-26', today), true);
    assert.equal(AGE_GUIDANCE_POLICY.accountAccess, 'allowed_without_age_block');
  });

  it('rejects impossible and future dates', () => {
    assert.equal(ageOnDate('2026-02-30', today), null);
    assert.equal(ageOnDate('2027-01-01', today), null);
    assert.equal(isUnderGuidanceAge('not-a-date', today), false);
  });

  it('records guidance without claiming verified parental consent', () => {
    assert.equal(AGE_GUIDANCE_POLICY.verifiedParentalConsentImplemented, false);
    assert.match(AGE_GUIDANCE_POLICY.notice.body, /parent or guardian/);
    assert.match(AGE_GUIDANCE_POLICY.notice.familyBody, /someone under 18/);
  });
});
