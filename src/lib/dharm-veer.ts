/**
 * Public compatibility surface for Dharm Veer types, content and selection.
 *
 * Implementation is split by responsibility so server routes and tests can
 * import the smallest stable module without changing the existing API.
 */
export type { DharmVeer } from './dharm-veer-types';
export { DHARM_VEERS } from './dharm-veer-roster';
export { TRADITION_META, getDharmVeerOfTheDay, selectDharmVeer } from './dharm-veer-rotation';
export { pickDharmVeerLocalizedText, pickDharmVeerQuote } from './dharm-veer-localization';
