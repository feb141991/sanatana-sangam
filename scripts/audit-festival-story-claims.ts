import rules from '../packages/dharma-rules/src/festivals/rules.json';
import { FESTIVAL_STORIES, getFestivalStory } from '../src/lib/festival-stories';

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

const structurallyIncomplete = FESTIVAL_STORIES.filter((story) =>
  !story.origin.trim() ||
  !story.significance.trim() ||
  story.rituals.length === 0 ||
  !story.shloka.text.trim() ||
  !story.shloka.translation.trim() ||
  !story.shloka.source.trim()
).map((story) => story.slug);

const outsideAdvertisedWordRange = FESTIVAL_STORIES.map((story) => ({
  slug: story.slug,
  words: wordCount(`${story.origin} ${story.significance}`),
})).filter(({ words }) => words < 480 || words > 580);

// A number in a source label is only a locator-bearing proxy. It does not prove
// that the verse, translation, edition, or attribution was textually verified.
const attributionOnlySources = FESTIVAL_STORIES
  .filter((story) => !/\d/u.test(story.shloka.source))
  .map((story) => ({ slug: story.slug, source: story.shloka.source }));

const unresolvedIncludedRules = rules
  .filter((rule) => rule.launch_status === 'included')
  .filter((rule) => !getFestivalStory(rule.slug, rule.display_name))
  .map((rule) => rule.slug);

console.log(JSON.stringify({
  storyCount: FESTIVAL_STORIES.length,
  structurallyIncomplete,
  storiesInside480To580Words: FESTIVAL_STORIES.length - outsideAdvertisedWordRange.length,
  outsideAdvertisedWordRange,
  locatorBearingSourceLabels: FESTIVAL_STORIES.length - attributionOnlySources.length,
  attributionOnlySources,
  includedRuleRows: rules.filter((rule) => rule.launch_status === 'included').length,
  unresolvedIncludedRules,
  caveat: 'Presence, length, and locator-shaped text do not establish scriptural authenticity or translation accuracy.',
}, null, 2));

if (structurallyIncomplete.length > 0 || unresolvedIncludedRules.length > 0) {
  process.exitCode = 1;
}
