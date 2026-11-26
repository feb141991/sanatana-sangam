import assert from 'node:assert/strict';
import test from 'node:test';
import { consecutiveGroups, missingInstances, matchesRuleOutput, hasScopedReview } from './audit-ekadashi-coverage';

test('a tithi spanning adjacent sunrise scans is one candidate instance', () => {
  assert.deepEqual(consecutiveGroups(['2028-06-02','2028-06-01','2028-06-01']),[['2028-06-01','2028-06-02']]);
});
test('two annual instances are preserved for coverage, with the omitted one detected', () => {
  const groups=consecutiveGroups(['2028-01-02','2028-12-21']);
  assert.deepEqual(missingInstances(groups,['2028-01-02']),[['2028-12-21']]);
  assert.deepEqual(missingInstances(groups,['2028-01-02','2028-12-21']),[]);
});
test('choosing the last day of a repeated tithi still covers that instance', () => {
  assert.deepEqual(missingInstances([['2028-06-01','2028-06-02']],['2028-06-02']),[]);
});
test('empty candidates are not fabricated into missing observances', () => {
  assert.deepEqual(consecutiveGroups([]),[]);assert.deepEqual(missingInstances([],[]),[]);
});
test('year-boundary dates stay separate when the intervening year is not scanned', () => {
  assert.deepEqual(consecutiveGroups(['2027-12-31','2028-01-01']),[['2027-12-31','2028-01-01']]);
  assert.deepEqual(consecutiveGroups(['2027-01-01','2027-12-31']),[['2027-01-01'],['2027-12-31']]);
});

test('the production legacy-default qualifier matches an unqualified canonical rule', () => {
  assert.equal(matchesRuleOutput({slug:'test-ekadashi'},{slug:'test-ekadashi',ruleKey:'test-ekadashi::legacy-default'}),true);
  assert.equal(matchesRuleOutput({slug:'test-ekadashi'},{slug:'test-ekadashi',ruleKey:'test-ekadashi'}),true);
});
test('distinct tradition variants and distinct slugs never merge during the audit', () => {
  assert.equal(matchesRuleOutput({slug:'test-ekadashi',variant_key:'smarta'},{slug:'test-ekadashi',ruleKey:'test-ekadashi::vaishnava_vidhava'}),false);
  assert.equal(matchesRuleOutput({slug:'other-ekadashi'},{slug:'test-ekadashi',ruleKey:'test-ekadashi::legacy-default'}),false);
});

test('a queued Vaishnava review never masks a silently dropped Smarta variant', () => {
  const queue=[{slug:'test-ekadashi',variant_key:'vaishnava_vidhava'}];
  assert.equal(hasScopedReview('test-ekadashi::vaishnava_vidhava',queue),true);
  assert.equal(hasScopedReview('test-ekadashi::smarta',queue),false);
  assert.equal(hasScopedReview('different-ekadashi::vaishnava_vidhava',queue),false);
  assert.equal(hasScopedReview('test-ekadashi::smarta',[]),false);
});
