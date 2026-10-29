// Single source of truth for droitco.com.
// Public brand is DROIT. First person: we / our. All open stores are 24/7.

export const site = {
  brand: 'DROIT',
  legalVoice: 'Droit', // sentence-case use inside prose
  origin: 'https://droitco.com',
  tagline: 'Self storage, open 24/7',
  phone: { display: '(888) 711-6050', tel: '+18887116050' },
  founded: '2020-01-01',
};

// Grouped by audience: renters first, then the owner path behind one hub,
// then the company. Booking and Management live under Owners, not in the nav.
export const nav = [
  { href: 'locations.html', label: 'Locations' },
  { href: 'owners.html', label: 'Owners' },
  { href: 'development.html', label: 'Development' },
  { href: 'about.html', label: 'About' },
  { href: 'contact.html', label: 'Contact' },
];

export const states = {
  IA: 'Iowa',
};

// `photo` maps to src/photos/<photo>.jpg -> img/<photo>-<w>.{avif,webp,jpg}
// `domain: null` means we do not present a marketing website for that store.
export const stores = [
  {
    slug: 'des-moines',
    name: 'Smart Self Storage',
    city: 'Des Moines',
    state: 'IA',
    street: '4400 NE 14th St',
    zip: '50313',
    phone: { display: '(515) 882-5226', tel: '+15158825226' },
    rentUrl: 'https://desmoinessmartselfstorage.com',
    domain: 'desmoinessmartselfstorage.com',
    photo: 'des-moines',
    alt: 'Smart Self Storage in Des Moines, Iowa — drive-up units',
    headline: 'Self storage on NE 14th Street.',
    summary: 'Drive-up units on the north side of Des Moines, with 24/7 gate access.',
    features: ['Drive-up units', '24/7 access', 'Online rental'],
  },
];

// Construction only. Never marketed as open, never given a rent CTA.
export const builds = [];

// Third-party industry research. Never presented as Droit performance.
export const industry = {
  label: 'Industry figures, not Droit results',
  stats: [
    { value: '68,000+', unit: '', label: 'Active U.S. self-storage facilities', source: 'TractIQ, July 2026' },
    { value: '2.1', unit: 'B', label: 'Rentable square feet nationwide', source: 'StorageCafe, June 2026' },
    { value: '$44.3', unit: 'B', label: 'Annual industry value', source: '2024 Self-Storage Almanac' },
  ],
  discovery: {
    title: 'How renters find a store',
    note: 'SSA 2023 Demand Study. Google, including Maps and reviews, now matches a roadside sign as a first touch.',
    rows: [
      { label: 'Internet', value: 41 },
      { label: 'Drive past', value: 30 },
      { label: 'Google & reviews', value: 24 },
    ],
  },
  households: {
    title: 'Households using storage',
    note: 'Share of U.S. households renting at least one unit. SSA 2025 Demand Study, cited by TractIQ.',
    rows: [
      { label: '2005', value: 8.95, max: 12.6, display: '8.95%' },
      { label: '2024', value: 12.6, max: 12.6, display: '12.60%' },
    ],
  },
  occupancy: {
    title: 'Occupancy by operator type',
    note: 'Q1 2026 national occupancy, CMBS-reporting facilities. TractIQ. Occupancy rose 3.6 points from Q1 2025.',
    rows: [
      { label: 'REIT portfolios', value: 87.7, max: 87.7, display: '87.7%' },
      { label: 'Non-designated', value: 85.2, max: 87.7, display: '85.2%' },
      { label: 'Sophisticated', value: 81.8, max: 87.7, display: '81.8%' },
    ],
  },
  radius: {
    percent: 69,
    title: 'Most renters stay close',
    body: [
      'Thirty-three percent will travel ten minutes or less. Another thirty-six percent travel ten to nineteen minutes.',
      'If the listing is not in the Map Pack for that radius, the unit does not get the call.',
    ],
    note: 'SSA 2023 Demand Study, cited in local-search operator research.',
  },
  footnote:
    'Industry figures, not Droit results. SSA Demand Study (household use 2005–2024; renter discovery 2023). TractIQ market data updated July 31, 2026. StorageCafe, June 2026. 2024 Self-Storage Almanac.',
};

export const managementModules = [
  { n: '01', title: 'Inbound', body: 'Texts, emails, missed calls. Same day. We answer as the manager.' },
  { n: '02', title: 'Collections', body: 'Past-due text and email, Sunday, Wednesday, and Friday at 9am CT.' },
  { n: '03', title: 'Gates', body: 'Cut access on day 5 late. Restore when they pay. We do not open or close the gate itself.' },
  { n: '04', title: 'Liens and auctions', body: 'Two months with no payment, then notices.' },
  { n: '05', title: 'Website', body: 'We build and host the store site. Name, address, phone, hours, and a rent link. Maps points at it.' },
  {
    n: '06',
    title: 'Full management',
    body: 'All of the above, plus a monthly owner recap. You still approve refunds, legal work, and anything that spends money.',
  },
];

export const smsConsent =
  'By checking this box, I agree to receive account and rental text messages from Droit at the mobile number provided. ' +
  'Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe. Reply HELP for help or call (888) 711-6050. ' +
  'Consent is not a condition of renting. No mobile opt-in or text message consent will be shared with third parties or affiliates ' +
  'for marketing or promotional purposes.';

export const openStates = [...new Set(stores.map((s) => s.state))];
export const mapsUrl = (s) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${s.street}, ${s.city}, ${s.state} ${s.zip}`.trim()
  )}`;
