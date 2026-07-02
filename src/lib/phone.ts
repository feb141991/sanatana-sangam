export const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+1',    flag: '🇨🇦', name: 'Canada' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  // Add additional common codes as needed
];

export function formatPhone(countryCode: string, number: string) {
  // Remove any non‑digit characters from the number
  const cleaned = number.replace(/\D/g, '');
  return `${countryCode}${cleaned}`;
}
