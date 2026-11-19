import dharmVeer365Snapshot from './data/dharm-veer-365-snapshot.json';
import type { DharmVeer } from './dharm-veer-types';

export const DHARM_VEERS: DharmVeer[] = dharmVeer365Snapshot as unknown as DharmVeer[];
