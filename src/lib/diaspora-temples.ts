/**
 * Curated diaspora temple directory.
 *
 * These are hand-verified, well-known sacred places in diaspora cities.
 * They are used as a primary overlay on top of OpenStreetMap (Overpass) results
 * — so diaspora users see real results even when OSM data is sparse.
 *
 * Coordinates are approximate (within ~200 m of the actual entrance).
 * Expand this list as the community grows — each row is pure JSON, no build step.
 */

export interface CuratedTemple {
  id: string;                                            // stable slug — never change
  name: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
  lat: number;
  lon: number;
  city: string;
  country: string;
  address?: string;
  website?: string;
  deity?: string;
  sampradaya?: string;
  opening?: string;
}

export const DIASPORA_TEMPLES: CuratedTemple[] = [

  // ─────────────────────────────────────────────────────────────────────────
  // UNITED KINGDOM
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'uk-neasden-baps',
    name: 'BAPS Swaminarayan Mandir (Neasden Temple)',
    tradition: 'hindu',
    lat: 51.5558, lon: -0.2311,
    city: 'London', country: 'United Kingdom',
    address: 'Pramukh Swami Rd, Neasden, London NW10 8LT',
    website: 'https://londonmandir.baps.org',
    sampradaya: 'Swaminarayan',
    opening: 'Mo-Su 09:00-18:00',
  },
  {
    id: 'uk-watford-bhaktivedanta',
    name: 'Bhaktivedanta Manor (ISKCON)',
    tradition: 'hindu',
    lat: 51.6957, lon: -0.3972,
    city: 'Watford', country: 'United Kingdom',
    address: 'Dharam Marg, Hilfield Lane, Aldenham, Watford WD25 8EZ',
    website: 'https://bhaktivedantamanor.co.uk',
    sampradaya: 'Gaudiya Vaishnava',
    opening: 'Mo-Su 07:30-20:00',
  },
  {
    id: 'uk-tividale-balaji',
    name: 'Sri Venkateswara (Balaji) Temple Tividale',
    tradition: 'hindu',
    lat: 52.5059, lon: -2.0411,
    city: 'Tividale', country: 'United Kingdom',
    address: 'Dudley Rd, Tividale, Oldbury B69 2DY',
    website: 'https://balajitemple.co.uk',
    deity: 'Venkateswara',
  },
  {
    id: 'uk-leicester-swaminarayan',
    name: 'Shri Swaminarayan Mandir Leicester',
    tradition: 'hindu',
    lat: 52.6369, lon: -1.1282,
    city: 'Leicester', country: 'United Kingdom',
    address: 'Loughborough Rd, Leicester LE4 5PJ',
    sampradaya: 'Swaminarayan',
  },
  {
    id: 'uk-southall-gurdwara',
    name: 'Sri Guru Singh Sabha Gurdwara Southall',
    tradition: 'sikh',
    lat: 51.5073, lon: -0.3716,
    city: 'Southall', country: 'United Kingdom',
    address: 'Park Ave, Southall UB1 3AG',
    opening: 'Open 24 hours',
  },
  {
    id: 'uk-smethwick-gurdwara',
    name: 'Guru Nanak Gurdwara Smethwick',
    tradition: 'sikh',
    lat: 52.4916, lon: -1.9888,
    city: 'Smethwick', country: 'United Kingdom',
    address: 'High St, Smethwick B66 3AP',
    opening: 'Open 24 hours',
  },
  {
    id: 'uk-east-ham-murugan',
    name: 'Sri Murugan Temple East Ham',
    tradition: 'hindu',
    lat: 51.5361, lon: 0.0463,
    city: 'London', country: 'United Kingdom',
    address: 'Richmond Rd, East Ham, London E6 1EP',
    deity: 'Murugan',
  },
  {
    id: 'uk-wolverhampton-gurdwara',
    name: 'Gurdwara Guru Nanak Darbar Wolverhampton',
    tradition: 'sikh',
    lat: 52.5868, lon: -2.1236,
    city: 'Wolverhampton', country: 'United Kingdom',
    address: 'Clarence St, Wolverhampton WV1 4HZ',
    opening: 'Open 24 hours',
  },
  {
    id: 'uk-bradford-gurdwara',
    name: 'Gurdwara Singh Sabha Bradford',
    tradition: 'sikh',
    lat: 53.7930, lon: -1.7543,
    city: 'Bradford', country: 'United Kingdom',
    address: 'Wakefield Rd, Bradford BD4 7QN',
  },
  {
    id: 'uk-glasgow-gurdwara',
    name: 'Glasgow Gurdwara Singh Sabha',
    tradition: 'sikh',
    lat: 55.8536, lon: -4.2551,
    city: 'Glasgow', country: 'United Kingdom',
    address: 'Albert Dr, Pollokshields, Glasgow G41 2PE',
    opening: 'Open 24 hours',
  },
  {
    id: 'uk-leicester-gurdwara',
    name: 'Guru Tegh Bahadur Gurdwara Leicester',
    tradition: 'sikh',
    lat: 52.6361, lon: -1.1224,
    city: 'Leicester', country: 'United Kingdom',
    address: 'Western Blvd, Leicester LE2 7HZ',
  },
  {
    id: 'uk-coventry-radhasoami',
    name: 'Radha Soami Satsang Beas Coventry',
    tradition: 'sikh',
    lat: 52.4081, lon: -1.5106,
    city: 'Coventry', country: 'United Kingdom',
    address: 'Stoney Stanton Rd, Coventry CV1 4FP',
  },
  {
    id: 'uk-luton-shree-sanatan',
    name: 'Shree Sanatan Hindu Mandir Luton',
    tradition: 'hindu',
    lat: 51.8795, lon: -0.4196,
    city: 'Luton', country: 'United Kingdom',
    address: 'Westbourne Rd, Luton LU4 8JF',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UNITED STATES
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'us-nj-baps-akshardham',
    name: 'BAPS Swaminarayan Akshardham',
    tradition: 'hindu',
    lat: 40.2143, lon: -74.6124,
    city: 'Robbinsville', country: 'United States',
    address: '1 Akshardham Dr, Robbinsville Township, NJ 08691',
    website: 'https://baps.org',
    sampradaya: 'Swaminarayan',
    opening: 'We-Mo 09:00-18:00',
  },
  {
    id: 'us-pa-venkateswara-pittsburgh',
    name: 'Sri Venkateswara Temple Pittsburgh',
    tradition: 'hindu',
    lat: 40.4444, lon: -80.1718,
    city: 'Penn Hills', country: 'United States',
    address: '1230 S McCully Dr, Penn Hills, PA 15235',
    website: 'https://svtemple.org',
    deity: 'Venkateswara',
  },
  {
    id: 'us-ny-ganesha-flushing',
    name: 'Hindu Temple Society of North America (Ganesha Temple)',
    tradition: 'hindu',
    lat: 40.7485, lon: -73.8307,
    city: 'Flushing', country: 'United States',
    address: '45-57 Bowne St, Flushing, NY 11355',
    website: 'https://nyganeshtemple.org',
    deity: 'Ganesha',
    opening: 'Mo-Su 08:00-21:00',
  },
  {
    id: 'us-ca-iskcon-la',
    name: 'ISKCON Los Angeles (Hare Krishna Temple)',
    tradition: 'hindu',
    lat: 34.0044, lon: -118.4038,
    city: 'Los Angeles', country: 'United States',
    address: '3764 Watseka Ave, Los Angeles, CA 90034',
    website: 'https://iskconla.com',
    sampradaya: 'Gaudiya Vaishnava',
    opening: 'Mo-Su 04:30-21:00',
  },
  {
    id: 'us-tx-meenakshi-houston',
    name: 'Sri Meenakshi Temple',
    tradition: 'hindu',
    lat: 29.5590, lon: -95.4060,
    city: 'Pearland', country: 'United States',
    address: '17130 McLean Rd, Pearland, TX 77584',
    website: 'https://smt.org',
    deity: 'Meenakshi',
    opening: 'Mo-Su 08:00-20:30',
  },
  {
    id: 'us-md-siva-vishnu-lanham',
    name: 'Sri Siva Vishnu Temple',
    tradition: 'hindu',
    lat: 38.9591, lon: -76.8608,
    city: 'Lanham', country: 'United States',
    address: '6905 Cipriano Rd, Lanham, MD 20706',
    website: 'https://ssvt.org',
    opening: 'Mo-Su 09:00-20:00',
  },
  {
    id: 'us-va-durga-fairfax',
    name: 'Durga Temple Fairfax',
    tradition: 'hindu',
    lat: 38.8635, lon: -77.3561,
    city: 'Fairfax', country: 'United States',
    address: '10900 Lawyers Rd, Vienna, VA 22181',
    website: 'https://durgatemple.org',
    deity: 'Durga',
  },
  {
    id: 'us-il-baps-chicago',
    name: 'BAPS Swaminarayan Temple Chicago',
    tradition: 'hindu',
    lat: 41.8742, lon: -88.0098,
    city: 'Bartlett', country: 'United States',
    address: '1 Swaminarayan Blvd, Bartlett, IL 60103',
    sampradaya: 'Swaminarayan',
    opening: 'Mo-Su 09:00-18:00',
  },
  {
    id: 'us-ca-venkateswara-malibu',
    name: 'Sri Venkateswara Temple Malibu',
    tradition: 'hindu',
    lat: 34.0369, lon: -118.7048,
    city: 'Calabasas', country: 'United States',
    address: '1600 Las Virgenes Rd, Calabasas, CA 91302',
    deity: 'Venkateswara',
  },
  {
    id: 'us-nj-swaminarayan-edison',
    name: 'Shree Swaminarayan Temple Edison',
    tradition: 'hindu',
    lat: 40.5187, lon: -74.3795,
    city: 'Edison', country: 'United States',
    address: '280 Rock Ave, Green Brook Township, NJ 08812',
    sampradaya: 'Swaminarayan',
  },
  {
    id: 'us-ga-venkateswara-atlanta',
    name: 'Sri Venkateswara Temple Atlanta',
    tradition: 'hindu',
    lat: 33.9033, lon: -84.2166,
    city: 'Lilburn', country: 'United States',
    address: '5905 Lawrenceville Hwy, Lilburn, GA 30047',
    deity: 'Venkateswara',
    opening: 'Mo-Su 08:00-20:00',
  },
  {
    id: 'us-ca-shiva-vishnu-livermore',
    name: 'Shiva Vishnu Temple Livermore',
    tradition: 'hindu',
    lat: 37.6879, lon: -121.8224,
    city: 'Livermore', country: 'United States',
    address: '1232 Arrowhead Ave, Livermore, CA 94551',
    opening: 'Mo-Su 08:00-20:00',
  },
  {
    id: 'us-tx-gurdwara-dallas',
    name: 'Sikh Society of North Texas Gurdwara',
    tradition: 'sikh',
    lat: 32.8998, lon: -97.0641,
    city: 'Irving', country: 'United States',
    address: '1750 E Rochelle Blvd, Irving, TX 75062',
    opening: 'Open 24 hours',
  },
  {
    id: 'us-ca-gurdwara-san-jose',
    name: 'Gurdwara Sahib San Jose',
    tradition: 'sikh',
    lat: 37.3318, lon: -121.8863,
    city: 'San Jose', country: 'United States',
    address: '3636 Gurdwara Ave, San Jose, CA 95148',
    opening: 'Open 24 hours',
  },
  {
    id: 'us-ny-gurdwara-richmond-hill',
    name: 'Sikh Cultural Society Gurdwara Richmond Hill',
    tradition: 'sikh',
    lat: 40.6989, lon: -73.8294,
    city: 'Richmond Hill', country: 'United States',
    address: '95-30 118th St, Richmond Hill, NY 11419',
    opening: 'Open 24 hours',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CANADA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'ca-on-baps-toronto',
    name: 'BAPS Swaminarayan Mandir Toronto',
    tradition: 'hindu',
    lat: 43.6532, lon: -79.5283,
    city: 'Etobicoke', country: 'Canada',
    address: '61 Claireville Dr, Etobicoke, ON M9W 6P4',
    sampradaya: 'Swaminarayan',
    opening: 'Mo-Su 09:00-18:00',
  },
  {
    id: 'ca-on-vishnu-mandir',
    name: 'Vishnu Mandir North York',
    tradition: 'hindu',
    lat: 43.7682, lon: -79.5198,
    city: 'North York', country: 'Canada',
    address: '8640 Yonge St, Richmond Hill, ON L4C 7A1',
    deity: 'Vishnu',
    opening: 'Mo-Su 09:00-20:00',
  },
  {
    id: 'ca-on-laxmi-narayan-brampton',
    name: 'Laxmi Narayan Mandir Brampton',
    tradition: 'hindu',
    lat: 43.7315, lon: -79.7624,
    city: 'Brampton', country: 'Canada',
    address: '6650 McLaughlin Rd, Mississauga, ON L5R 3K4',
  },
  {
    id: 'ca-on-ottawa-hindu-temple',
    name: 'Ottawa Hindu Temple',
    tradition: 'hindu',
    lat: 45.3588, lon: -75.7550,
    city: 'Ottawa', country: 'Canada',
    address: '4835 Bank St, Ottawa, ON K1X 1G8',
  },
  {
    id: 'ca-bc-gurdwara-dashmesh-surrey',
    name: 'Gurdwara Dashmesh Darbar Surrey',
    tradition: 'sikh',
    lat: 49.1913, lon: -122.8490,
    city: 'Surrey', country: 'Canada',
    address: '12885 85 Ave, Surrey, BC V3W 0K8',
    opening: 'Open 24 hours',
  },
  {
    id: 'ca-bc-khalsa-diwan-vancouver',
    name: 'Khalsa Diwan Society Vancouver (Ross Street Temple)',
    tradition: 'sikh',
    lat: 49.2363, lon: -123.1010,
    city: 'Vancouver', country: 'Canada',
    address: '8000 Ross St, Vancouver, BC V5X 4N8',
    opening: 'Open 24 hours',
  },
  {
    id: 'ca-bc-gurdwara-nanak-sar-abbotsford',
    name: 'Gurdwara Nanak Sar Abbotsford',
    tradition: 'sikh',
    lat: 49.0504, lon: -122.2697,
    city: 'Abbotsford', country: 'Canada',
    address: '32086 Peardonville Rd, Abbotsford, BC V2T 6K3',
    opening: 'Open 24 hours',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AUSTRALIA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'au-nsw-venkateswara-helensburgh',
    name: 'Sri Venkateswara Temple (Tirupati Balaji) NSW',
    tradition: 'hindu',
    lat: -34.1764, lon: 150.9936,
    city: 'Helensburgh', country: 'Australia',
    address: '1A Woronora Rd, Helensburgh NSW 2508',
    website: 'https://venkateswara.org.au',
    deity: 'Venkateswara',
    opening: 'We-Su 08:00-19:00',
  },
  {
    id: 'au-vic-shiva-vishnu-carrum-downs',
    name: 'Shiva Vishnu Temple Melbourne',
    tradition: 'hindu',
    lat: -38.0933, lon: 145.1298,
    city: 'Carrum Downs', country: 'Australia',
    address: '109-113 Ballarto Rd, Carrum Downs VIC 3201',
    website: 'https://svtemple.com.au',
    opening: 'Mo-Su 08:00-21:00',
  },
  {
    id: 'au-vic-gurdwara-nanak-naam',
    name: 'Gurdwara Nanak Naam Jahaaz Melbourne',
    tradition: 'sikh',
    lat: -37.8136, lon: 144.9631,
    city: 'Melbourne', country: 'Australia',
    address: '149 Victoria Pde, Collingwood VIC 3066',
    opening: 'Open 24 hours',
  },
  {
    id: 'au-qld-murugan-temple-brisbane',
    name: 'Sri Murugan Temple Brisbane',
    tradition: 'hindu',
    lat: -27.4698, lon: 153.0251,
    city: 'Brisbane', country: 'Australia',
    address: '2 Harts Rd, Indooroopilly QLD 4068',
    deity: 'Murugan',
  },
  {
    id: 'au-wa-gurdwara-perth',
    name: 'Sikh Gurdwara Perth',
    tradition: 'sikh',
    lat: -31.9505, lon: 115.8605,
    city: 'Perth', country: 'Australia',
    address: '4 Smyth Rd, Bentley WA 6102',
    opening: 'Open 24 hours',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UNITED ARAB EMIRATES
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'ae-dubai-hindu-temple-bur-dubai',
    name: 'Hindu Dharma Sabha Dubai (Shiva & Krishna Temple)',
    tradition: 'hindu',
    lat: 25.2657, lon: 55.2977,
    city: 'Dubai', country: 'UAE',
    address: 'Al Fahidi St, Bur Dubai, Dubai',
    opening: 'Mo-Su 06:00-20:00',
  },
  {
    id: 'ae-dubai-gurdwara-sikh',
    name: 'Gurunanak Darbar Gurdwara Dubai',
    tradition: 'sikh',
    lat: 25.2049, lon: 55.4137,
    city: 'Jebel Ali', country: 'UAE',
    address: 'Jebel Ali Village, Dubai',
    opening: 'Open 24 hours',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SINGAPORE
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'sg-veeramakaliamman',
    name: 'Sri Veeramakaliamman Temple',
    tradition: 'hindu',
    lat: 1.3060, lon: 103.8520,
    city: 'Singapore', country: 'Singapore',
    address: '141 Serangoon Rd, Singapore 218042',
    deity: 'Kali',
    opening: 'Mo-Su 05:30-21:30',
  },
  {
    id: 'sg-mariamman',
    name: 'Sri Mariamman Temple',
    tradition: 'hindu',
    lat: 1.2833, lon: 103.8450,
    city: 'Singapore', country: 'Singapore',
    address: '244 South Bridge Rd, Singapore 058793',
    deity: 'Mariamman',
    opening: 'Mo-Su 07:00-21:00',
  },
  {
    id: 'sg-central-sikh-temple',
    name: 'Central Sikh Temple Singapore',
    tradition: 'sikh',
    lat: 1.3018, lon: 103.8273,
    city: 'Singapore', country: 'Singapore',
    address: '2 Towner Rd, Singapore 327804',
    opening: 'Open 24 hours',
  },
  {
    id: 'sg-baps-singapore',
    name: 'BAPS Swaminarayan Sanstha Singapore',
    tradition: 'hindu',
    lat: 1.3521, lon: 103.8198,
    city: 'Singapore', country: 'Singapore',
    sampradaya: 'Swaminarayan',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOUTH AFRICA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'za-durban-umbilo-shree-ambalavaanar',
    name: 'Shree Ambalavaanar Alayam Durban',
    tradition: 'hindu',
    lat: -29.8587, lon: 30.9932,
    city: 'Durban', country: 'South Africa',
    address: '275 Umbilo Rd, Umbilo, Durban 4001',
    deity: 'Murugan',
    opening: 'Mo-Su 06:00-20:00',
  },
  {
    id: 'za-johannesburg-shree-sanatan',
    name: 'Shree Sanathan Dharma Sabha Johannesburg',
    tradition: 'hindu',
    lat: -26.2041, lon: 28.0473,
    city: 'Johannesburg', country: 'South Africa',
    address: '2 Laxton Ave, Lenasia, Johannesburg',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MALAYSIA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'my-kl-batu-caves',
    name: 'Batu Caves Temple (Sri Subramaniya Swamy)',
    tradition: 'hindu',
    lat: 3.2379, lon: 101.6840,
    city: 'Kuala Lumpur', country: 'Malaysia',
    address: 'Batu Caves, 68100 Batu Caves, Selangor',
    deity: 'Murugan',
    opening: 'Mo-Su 06:00-21:00',
  },
  {
    id: 'my-kl-sri-mahamariamman',
    name: 'Sri Mahamariamman Temple Kuala Lumpur',
    tradition: 'hindu',
    lat: 3.1467, lon: 101.6982,
    city: 'Kuala Lumpur', country: 'Malaysia',
    address: '163 Jln Tun H S Lee, City Centre, 50000 Kuala Lumpur',
    deity: 'Mariamman',
    opening: 'Mo-Su 06:00-20:30',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MAURITIUS
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'mu-port-louis-maheswarnath',
    name: 'Maheswarnath Temple Triolet',
    tradition: 'hindu',
    lat: -20.0500, lon: 57.5333,
    city: 'Triolet', country: 'Mauritius',
    address: 'Triolet, Mauritius',
    deity: 'Shiva',
    opening: 'Mo-Su 05:00-20:00',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRINIDAD & TOBAGO
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'tt-port-of-spain-dattatreya',
    name: 'Dattatreya Temple (Carapichaima)',
    tradition: 'hindu',
    lat: 10.5308, lon: -61.3553,
    city: 'Carapichaima', country: 'Trinidad & Tobago',
    address: 'Waterloo Rd, Carapichaima, Trinidad',
    opening: 'Mo-Su 06:00-18:00',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NETHERLANDS
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'nl-amsterdam-shri-radha-madanmohan',
    name: 'Shri Radha Madanmohan Temple Amsterdam',
    tradition: 'hindu',
    lat: 52.3676, lon: 4.9041,
    city: 'Amsterdam', country: 'Netherlands',
    address: 'Schalk Burgerstraat 88, 1092 JT Amsterdam',
    sampradaya: 'Gaudiya Vaishnava',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEW ZEALAND
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'nz-auckland-shri-shiva-vishnu',
    name: 'Shri Shiva Vishnu Temple Auckland',
    tradition: 'hindu',
    lat: -36.8485, lon: 174.7633,
    city: 'Auckland', country: 'New Zealand',
    address: '103 Henderson Valley Rd, Henderson, Auckland 0612',
    opening: 'Mo-Su 09:00-20:00',
  },
];

// ── Haversine distance (km) ────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns curated temples within `radiusMetres` of the given coordinates,
 * sorted by distance (nearest first). Pure client-side — no API call.
 */
export function getCuratedNearbyTemples(
  lat: number,
  lon: number,
  radiusMetres: number
): (CuratedTemple & { distanceKm: number })[] {
  const radiusKm = radiusMetres / 1000;
  return DIASPORA_TEMPLES
    .map((t) => ({ ...t, distanceKm: haversineKm(lat, lon, t.lat, t.lon) }))
    .filter((t) => t.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
