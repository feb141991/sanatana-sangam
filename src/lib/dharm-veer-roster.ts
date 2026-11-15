import { BUDDHIST_VEERS } from './data/dharm-veers/buddhist';
import { HINDU_VEERS } from './data/dharm-veers/hindu';
import { JAIN_VEERS } from './data/dharm-veers/jain';
import { SIKH_VEERS } from './data/dharm-veers/sikh';
import type { DharmVeer } from './dharm-veer-types';

export const DHARM_VEERS: DharmVeer[] = [...HINDU_VEERS, ...SIKH_VEERS, ...BUDDHIST_VEERS, ...JAIN_VEERS];
