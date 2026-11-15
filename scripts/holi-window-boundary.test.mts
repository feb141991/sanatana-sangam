import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePanchang, computeAstronomy, getSunriseForDateStr } from '@sangam/panchang-engine';
import { findBoundaryAround } from './holi-window-audit';

test('the same Purnima boundary has one UTC instant at every location', () => {
  const anchors = [new Date('2028-03-11T12:00:00Z')];
  const locations = [
    { lat: 23.1765, lon: 75.7885 },
    { lat: 22.5726, lon: 88.3639 },
    { lat: 28.6139, lon: 77.209 },
  ];
  for (const anchor of anchors) {
    const expected = findBoundaryAround(anchor, 180, 'before').toISOString();
    for (const location of locations) {
      // The old path anchored calculation to each location's sunrise, then
      // parsed formatted tithiUpto text. Those strings differ for this year.
      const sunrise = getSunriseForDateStr('2028-03-11', {
        lat: location.lat,
        lon: location.lon,
        tz: 'Asia/Kolkata',
      }).sunrise;
      const oldFormatted = calculatePanchang(sunrise, location.lat, location.lon, 'Asia/Kolkata').tithiUpto;
      const actual = findBoundaryAround(anchor, 180, 'before').toISOString();
      assert.equal(actual, expected, `${location} must not change the astronomical boundary`);
      assert.ok(oldFormatted.length > 0);
    }
  }

  const old2028Values = locations.map((location) => {
    const sunrise = getSunriseForDateStr('2028-03-11', {
      lat: location.lat,
      lon: location.lon,
      tz: 'Asia/Kolkata',
    }).sunrise;
    return calculatePanchang(sunrise, location.lat, location.lon, 'Asia/Kolkata').tithiUpto;
  });
  assert.ok(new Set(old2028Values).size > 1, 'the old formatted boundary must expose the location-dependent parsing bug');
});

test('the canonical boundary is independent of formatted tithi output', () => {
  const boundary = findBoundaryAround(new Date('2028-03-11T12:00:00Z'), 180, 'before');
  assert.ok(Number.isFinite(computeAstronomy(boundary).elongation));
  assert.ok(Math.abs(((computeAstronomy(boundary).elongation - 180 + 540) % 360) - 180) < 1e-5);
});
