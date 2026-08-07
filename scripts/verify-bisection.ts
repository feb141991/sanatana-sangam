import {
  unwrapForward,
} from '../packages/panchang-engine/src/core/astronomy.js';
import {
  binaryRoot,
} from '../packages/panchang-engine/src/core/astronomy-adapter.js';

// Hand-rolled implementation
function solveNextBoundaryLegacy(
  startDate: Date,
  startValue: number,
  stepDegrees: number,
  valueAt: (date: Date) => number,
  maxSearchHours = 72
): Date | null {
  let target = Math.ceil(startValue / stepDegrees) * stepDegrees;
  if (Math.abs(target - startValue) < 1e-9) {
    target += stepDegrees;
  }

  let low = startDate.getTime();
  let high = low + 6 * 60 * 60 * 1000;
  const maxHigh = low + maxSearchHours * 60 * 60 * 1000;

  while (high <= maxHigh) {
    const highValue = unwrapForward(valueAt(new Date(high)), startValue);
    if (highValue >= target) {
      break;
    }
    high += 6 * 60 * 60 * 1000;
  }

  if (high > maxHigh) {
    return null;
  }

  for (let i = 0; i < 45; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const midValue = unwrapForward(valueAt(new Date(mid)), startValue);
    if (midValue >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return new Date(high);
}

// binaryRoot based implementation
function solveNextBoundaryNew(
  startDate: Date,
  startValue: number,
  stepDegrees: number,
  valueAt: (date: Date) => number,
  maxSearchHours = 72
): Date | null {
  let target = Math.ceil(startValue / stepDegrees) * stepDegrees;
  if (Math.abs(target - startValue) < 1e-9) {
    target += stepDegrees;
  }

  let low = startDate.getTime();
  let high = low + 6 * 60 * 60 * 1000;
  const maxHigh = low + maxSearchHours * 60 * 60 * 1000;

  while (high <= maxHigh) {
    const highValue = unwrapForward(valueAt(new Date(high)), startValue);
    if (highValue >= target) {
      break;
    }
    high += 6 * 60 * 60 * 1000;
  }

  if (high > maxHigh) {
    return null;
  }

  // Use binaryRoot to find the exact root of: f(t) = midValue - target
  const f = (t: number) => {
    const val = unwrapForward(valueAt(new Date(t)), startValue);
    return val - target;
  };

  const rootMs = binaryRoot(f, low, high);
  return new Date(rootMs);
}

// Let's mock a simple linear function that simulates elongation/sidereal longitude change
// Say it increases by 12 degrees per day (12 / 86400000 degrees per ms)
const rate = 12 / 86400000;
const mockValueAt = (d: Date) => d.getTime() * rate;

console.log('--- Checking numerical agreement between legacy bisection and binaryRoot ---');
const testStartDate = new Date(Date.UTC(2026, 2, 20, 0, 0, 0));
const startVal = mockValueAt(testStartDate);

for (let step = 1; step <= 5; step++) {
  const stepDeg = 12; // tithi step size
  const resLegacy = solveNextBoundaryLegacy(testStartDate, startVal, stepDeg, mockValueAt);
  const resNew = solveNextBoundaryNew(testStartDate, startVal, stepDeg, mockValueAt);
  
  if (resLegacy && resNew) {
    const diffMs = resNew.getTime() - resLegacy.getTime();
    console.log(`Step ${step}:`);
    console.log(`  Legacy: ${resLegacy.toISOString()} (${resLegacy.getTime()})`);
    console.log(`  New:    ${resNew.toISOString()} (${resNew.getTime()})`);
    console.log(`  Diff:   ${diffMs} ms (${(diffMs / 1000).toFixed(4)} s)`);
  } else {
    console.log(`Step ${step}: One or both returned null!`);
  }
}
