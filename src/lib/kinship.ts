/**
 * Kinship and Generational Hierarchy for Kutumb Vansh
 *
 * Maps abstract database generation integers (Gen 1, 2, 3...) to warm,
 * human-relational kinship tiers with educational tooltips.
 */

export interface KinshipTier {
  generation: number;
  label: string;
  hindiLabel: string;
  shortLabel: string;
  description: string;
  tooltip: string;
}

export function getKinshipTier(generation: number): KinshipTier {
  switch (generation) {
    case 1:
      return {
        generation: 1,
        label: 'Root Ancestor',
        hindiLabel: 'मूल पूर्वज',
        shortLabel: 'Root',
        description: 'First recorded foundational elders',
        tooltip: 'Root Ancestor (Gen 1 in Kutumb Vansh) · The earliest recorded foundation of your family lineage.',
      };
    case 2:
      return {
        generation: 2,
        label: 'Grandparents',
        hindiLabel: 'दादा-दादी',
        shortLabel: 'Elders',
        description: 'Grandparents and ancestral elders',
        tooltip: "Grandparents' Generation (Gen 2 in Kutumb Vansh) · Respected elders whose blessings guide the family.",
      };
    case 3:
      return {
        generation: 3,
        label: "Parents' Gen",
        hindiLabel: 'माता-पिता',
        shortLabel: 'Parents',
        description: 'Parents and family seniors',
        tooltip: "Parents' Generation (Gen 3 in Kutumb Vansh) · Ascending lineage connecting you to your ancestral roots.",
      };
    case 4:
      return {
        generation: 4,
        label: 'Current Gen',
        hindiLabel: 'समकालीन',
        shortLabel: 'Current',
        description: 'You, spouse, siblings, and cousins',
        tooltip: 'Current Generation (Gen 4 in Kutumb Vansh) · You, siblings, and cousins carrying forward your family legacy.',
      };
    case 5:
      return {
        generation: 5,
        label: 'Next Gen',
        hindiLabel: 'संतान',
        shortLabel: 'Children',
        description: 'Children, nieces, and nephews',
        tooltip: 'Next Generation (Gen 5 in Kutumb Vansh) · Children and descendants carrying family wisdom forward.',
      };
    case 6:
      return {
        generation: 6,
        label: 'Grandchildren',
        hindiLabel: 'पौत्र-पौत्री',
        shortLabel: 'Grandkids',
        description: 'Grandchildren and future heirs',
        tooltip: 'Grandchildren (Gen 6 in Kutumb Vansh) · Future lineage branches expanding the family tree.',
      };
    default:
      if (generation <= 0) {
        return {
          generation,
          label: 'Earliest Lineage',
          hindiLabel: 'प्राचीन पूर्वज',
          shortLabel: 'Ancient',
          description: 'Historical ancestral roots',
          tooltip: `Generation ${generation} in Kutumb Vansh · Foundational lineage elders.`,
        };
      }
      return {
        generation,
        label: `Gen ${generation} Descendants`,
        hindiLabel: `पीढ़ी ${generation}`,
        shortLabel: `Gen ${generation}`,
        description: `Generation ${generation} descendants`,
        tooltip: `Generation ${generation} in Kutumb Vansh · Future lineage descendants.`,
      };
  }
}
