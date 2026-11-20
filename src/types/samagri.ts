/**
 * Shoonaya Kosh - Sacred Provisions & Samagri Data Types
 * Strict typing for authentic physical ritual items, dhoop, ganga jal, and pooja packs.
 */

export type SamagriCategory =
  | 'pooja-kit'
  | 'ganga-jal'
  | 'dhoop-incense'
  | 'camphor'
  | 'mala'
  | 'altar-vessel';

export interface ProvenanceDetails {
  origin: string;              // e.g. "Gangotri, Uttarakhand", "Vrindavan, UP", "Varanasi"
  certifiedPure: boolean;
  purityGuarantee: string;     // e.g. "100% Charcoal-Free", "Sealed at Source", "Edible/Bhimseni Grade"
  craftTradition?: string;     // e.g. "Hand-rolled by temple artisans", "Brass sand-casting"
}

export interface KitItemDetail {
  name: string;
  quantity: string;
  significance: string;        // Ritual purpose, e.g. "For Kalash sthapana", "For Panchamrit abhishek"
}

export interface SacredProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: SamagriCategory;
  priceInr: number;
  priceUsd: number;
  image: string;
  description: string;
  provenance: ProvenanceDetails;
  itemsIncluded?: KitItemDetail[];  // Specific to pooja packs/kits
  targetObservanceSlugs?: string[]; // Maps to festival or vrat slugs (e.g. 'satyanarayan', 'ekadashi', 'pradosh')
  inStock: boolean;
  isPreOrder?: boolean;
}

export interface ObservanceSamagriPayload {
  kit: SacredProduct;
  ritualContext: {
    observanceName: string;
    targetDate?: string;
    deliveryEstimatedDays: number;
    recommendedOrderDeadline?: string;
  };
  companionEssentials: SacredProduct[];
}
