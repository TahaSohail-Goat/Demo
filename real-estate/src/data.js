/*
 * Calder Hale demo listings. Every residence, price and figure here is fictional.
 * CUSTOMIZE: replace with the brokerage's own feed (IDX/RESO Web API) before launch.
 * Keep the static featured cards in index.html in sync with this list.
 */

export const AREAS = Object.freeze([
  'Malibu',
  'Pacific Palisades',
  'Santa Monica',
  'Brentwood',
  'Beverly Hills',
  'Hollywood Hills'
]);

const img = name => ({ src: `assets/images/${name}.webp`, small: `assets/images/${name}-sm.webp` });

export const LISTINGS = Object.freeze([
  {
    id: 'linden-residence',
    name: 'The Linden Residence',
    area: 'Santa Monica',
    locale: 'North of Montana',
    status: 'Just listed',
    listing: 'sale',
    price: 4875000,
    beds: 4,
    baths: 5,
    sqft: 3950,
    lot: '7,500 sq ft',
    year: 2021,
    type: 'Modern traditional',
    cover: img('linden-patio'),
    gallery: ['linden-patio', 'interior-dining', 'interior-kitchen', 'interior-lounge', 'interior-bedroom'].map(img),
    summary: 'Warm limestone, walls of glass and a covered loggia that turns the garden into a second living room.',
    description: [
      'Set on one of the quietest blocks north of Montana, The Linden Residence was built around the way a family actually lives: a kitchen that opens straight onto the loggia, a dining room washed in afternoon light, and bedrooms tucked away upstairs.',
      'Oversized pocketing doors disappear into the walls so the loggia, lawn and outdoor kitchen read as one continuous space. Inside, wide-plank oak, custom millwork and a restrained palette let the architecture lead.'
    ],
    features: ['Covered loggia with outdoor kitchen', 'Pocketing glass walls', 'Chef’s kitchen with scullery', 'Primary suite with private terrace', 'Wide-plank European oak', 'Two-car garage with EV charging']
  },
  {
    id: 'villa-serein',
    name: 'Villa Serein',
    area: 'Malibu',
    locale: 'Point Dume',
    status: 'For sale',
    listing: 'sale',
    price: 14950000,
    beds: 6,
    baths: 8,
    sqft: 7850,
    lot: '0.9 acres',
    year: 2019,
    type: 'Contemporary villa',
    cover: img('villa-serein'),
    gallery: ['villa-serein', 'interior-living', 'interior-sunroom', 'interior-kitchen', 'interior-bedroom'].map(img),
    summary: 'A white-rendered villa framed by palms, with a 60-foot pool and cantilevered terraces facing the light.',
    description: [
      'Villa Serein is composed as a series of crisp white volumes that step back from a 60-foot swimming pool. Palms and mature landscaping give the grounds a resort-like privacy just minutes from the sand.',
      'The ground floor opens entirely to the pool terrace and outdoor dining pavilion. Upstairs, each bedroom has direct access to a glass-balustraded terrace.'
    ],
    features: ['60-foot swimming pool', 'Outdoor dining pavilion', 'Glass-balustraded terraces', 'Guest suite with separate entry', 'Home cinema', 'Gated motor court']
  },
  {
    id: 'cedar-pavilion',
    name: 'The Cedar Pavilion',
    area: 'Pacific Palisades',
    locale: 'Riviera',
    status: 'For sale',
    listing: 'sale',
    price: 8450000,
    beds: 5,
    baths: 6,
    sqft: 5900,
    lot: '0.4 acres',
    year: 2020,
    type: 'Contemporary',
    cover: img('cedar-pavilion'),
    gallery: ['cedar-pavilion', 'interior-living', 'interior-kitchen', 'interior-lounge', 'interior-bedroom'].map(img),
    summary: 'Cedar, stone and a sweeping timber pergola that shades a deck running the full length of the pool.',
    description: [
      'The Cedar Pavilion pairs a stone-clad upper volume with warm cedar at ground level. A timber pergola extends the living spaces out over a generous deck and swimming pool.',
      'Inside, the plan is organised around a double-height living room and a kitchen designed for entertaining, with every principal room opening to the garden.'
    ],
    features: ['Timber pergola and pool deck', 'Double-height living room', 'Stone and cedar façade', 'Wine room', 'Detached studio', 'Landscaped garden paths']
  },
  {
    id: 'sunset-terrace',
    name: 'Sunset Terrace House',
    area: 'Hollywood Hills',
    locale: 'Bird Streets',
    status: 'In escrow',
    listing: 'sale',
    price: 6295000,
    beds: 4,
    baths: 5,
    sqft: 4700,
    lot: '9,800 sq ft',
    year: 2018,
    type: 'Modern',
    cover: img('sunset-terrace'),
    gallery: ['sunset-terrace', 'interior-sunroom', 'interior-living', 'interior-bedroom', 'interior-lounge'].map(img),
    summary: 'Layered terraces, teak screens and glass balconies catching the last of the evening sun.',
    description: [
      'Sunset Terrace House is built as a stack of terraces, each one oriented to a different part of the day. Teak screens filter the light and give the street façade its quiet rhythm.',
      'A rooftop deck with a covered lounge sits above the principal suite, with sweeping views across the basin at dusk.'
    ],
    features: ['Rooftop deck with covered lounge', 'Teak privacy screens', 'Glass balconies on every level', 'Gym and steam room', 'Smart-home lighting', 'Gated parking']
  },
  {
    id: 'courtyard-house',
    name: 'The Courtyard House',
    area: 'Beverly Hills',
    locale: 'The Flats',
    status: 'For sale',
    listing: 'sale',
    price: 11200000,
    beds: 5,
    baths: 7,
    sqft: 6400,
    lot: '0.5 acres',
    year: 2022,
    type: 'Contemporary',
    cover: img('courtyard-house'),
    gallery: ['courtyard-house', 'interior-living', 'interior-dining', 'interior-kitchen', 'interior-bedroom'].map(img),
    summary: 'A private, gated compound of white planes and timber screens arranged around a shaded courtyard.',
    description: [
      'Behind a gated motor court, The Courtyard House unfolds as a series of pavilions linked by a central, tree-shaded courtyard. Timber screens temper the light and frame long views through the house.',
      'The layout gives every generation its own space, with a ground-floor guest wing and a primary suite that occupies the entire upper floor.'
    ],
    features: ['Gated motor court', 'Central shaded courtyard', 'Ground-floor guest wing', 'Full-floor primary suite', 'Staff quarters', 'Four-car garage']
  },
  {
    id: 'graphite-house',
    name: 'Graphite House',
    area: 'Brentwood',
    locale: 'Brentwood Park',
    status: 'For sale',
    listing: 'sale',
    price: 5750000,
    beds: 4,
    baths: 4.5,
    sqft: 4100,
    lot: '0.3 acres',
    year: 2023,
    type: 'Minimalist single-level',
    cover: img('graphite-house'),
    gallery: ['graphite-house', 'interior-lounge', 'interior-kitchen', 'interior-living', 'interior-bedroom'].map(img),
    summary: 'A single-level home in charcoal render, hidden behind tall hedges with a floating pergola terrace.',
    description: [
      'Graphite House is a calm, single-level home finished in charcoal render and framed by tall evergreen hedges. Floor-to-ceiling glass pulls the lawn and trees right into the living spaces.',
      'A steel pergola shelters an outdoor dining terrace at the end of the garden — the natural place to end the day.'
    ],
    features: ['Single-level living', 'Steel pergola dining terrace', 'Floor-to-ceiling glazing', 'Mature evergreen privacy', 'Radiant floor heating', 'Solar and battery storage']
  },
  {
    id: 'casa-cielo',
    name: 'Casa Cielo',
    area: 'Malibu',
    locale: 'Carbon Canyon',
    status: 'For lease',
    listing: 'lease',
    price: 32000,
    beds: 5,
    baths: 5,
    sqft: 4800,
    lot: '0.6 acres',
    year: 1988,
    type: 'Spanish hillside',
    cover: img('casa-cielo'),
    gallery: ['casa-cielo', 'interior-sunroom', 'interior-living', 'interior-dining', 'interior-bedroom'].map(img),
    summary: 'Whitewashed walls, terracotta roofs and gardens of cactus and bougainvillea climbing the hillside.',
    description: [
      'Casa Cielo is a whitewashed hillside hacienda with terracotta roofs, sculptural stair walls and gardens planted with cactus, palms and bougainvillea.',
      'Available furnished on a twelve-month lease, with terraces on every level and ocean glimpses from the upper rooms.'
    ],
    features: ['Available furnished', 'Terraces on every level', 'Drought-tolerant gardens', 'Ocean glimpses', 'Detached guest casita', 'Twelve-month minimum term']
  }
]);

export const findListing = id => LISTINGS.find(listing => listing.id === id) || null;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatPrice = listing => listing.listing === 'lease' ? `${usd.format(listing.price)} / month` : usd.format(listing.price);
export const formatNumber = value => new Intl.NumberFormat('en-US').format(value);
export const formatMoney = value => usd.format(value);
