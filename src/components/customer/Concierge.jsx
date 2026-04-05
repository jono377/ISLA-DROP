import { useState, useRef, useEffect } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

// ── Real Ibiza market prices + 10% commission ─────────────────
// Sources: boatsibiza.com, ticketsibiza.com, ibiza-luxuryvillas.com (April 2026)

const SERVICES = [
  // ── BOATS & YACHTS ──────────────────────────────────────────
  {
    id: 'boat-001',
    category: 'boats',
    name: 'RIB Speedboat — Half Day',
    subtitle: 'Up to 8 guests · 4 hours · Captain included',
    description: 'Explore Ibiza\'s secret coves and crystal-clear waters aboard a sleek RIB. Visit Cala Bassa, Cala Comte and sail across to Formentera. Captain and safety gear included.',
    price: 605,
    unit: 'half day',
    emoji: '🚤',
    partner: 'Boats Ibiza',
    location: 'Marina Botafoch, Ibiza Town',
    lat: 38.9085, lng: 1.4423,
    highlights: ['Captain included', 'Up to 8 guests', 'Coves & snorkelling', 'Fuel extra'],
    popular: true,
    duration: '4 hours',
    minGuests: 1, maxGuests: 8,
  },
  {
    id: 'boat-002',
    category: 'boats',
    name: 'RIB Speedboat — Full Day',
    subtitle: 'Up to 8 guests · 8 hours · Captain included',
    description: 'A full day on the Mediterranean. Sail to Formentera for lunch on the beach, swim in hidden coves and watch the Ibiza sunset from the water. The ultimate day at sea.',
    price: 1100,
    unit: 'full day',
    emoji: '🚤',
    partner: 'Smart Charter Ibiza',
    location: 'Marina Botafoch, Ibiza Town',
    lat: 38.9085, lng: 1.4423,
    highlights: ['8 hours', 'Formentera trip', 'Snorkelling gear', 'Fuel extra'],
    popular: true,
    duration: '8 hours',
    minGuests: 1, maxGuests: 8,
  },
  {
    id: 'boat-003',
    category: 'boats',
    name: 'Sailing Catamaran — Full Day',
    subtitle: 'Up to 12 guests · 8 hours · Crew included',
    description: 'Spacious, stable and perfect for groups. The catamaran\'s wide deck is ideal for sunbathing, dining and celebrations. Includes professional skipper and crew.',
    price: 1870,
    unit: 'full day',
    emoji: '⛵',
    partner: 'Real Yacht Charter',
    location: 'Santa Eularia Marina, Ibiza',
    lat: 38.9845, lng: 1.5329,
    highlights: ['Up to 12 guests', 'Crew included', 'Wide sundeck', 'Great for groups'],
    popular: false,
    duration: '8 hours',
    minGuests: 4, maxGuests: 12,
  },
  {
    id: 'boat-004',
    category: 'boats',
    name: 'Luxury Motor Yacht — Full Day',
    subtitle: 'Up to 10 guests · 8 hours · Captain & crew',
    description: 'Step aboard a premium motor yacht for the ultimate Ibiza day at sea. Multiple decks, jacuzzi, full bar and professional crew. The VIP experience on the water.',
    price: 4400,
    unit: 'full day',
    emoji: '🛥️',
    partner: 'Ibiza Rent a Boat',
    location: 'Marina Ibiza, Ibiza Town',
    lat: 38.9067, lng: 1.4326,
    highlights: ['Captain & crew', 'Jacuzzi on board', 'Full bar', 'VIP service'],
    popular: true,
    duration: '8 hours',
    minGuests: 2, maxGuests: 10,
  },
  {
    id: 'boat-005',
    category: 'boats',
    name: 'Sunset Cruise — 3 Hours',
    subtitle: 'Up to 10 guests · 6pm–9pm · Skipper included',
    description: 'The most romantic way to experience the legendary Ibiza sunset. Sail along the coast as the sky turns gold and rose, with champagne and music on deck.',
    price: 770,
    unit: 'per cruise',
    emoji: '🌅',
    partner: 'Boats Ibiza',
    location: 'San Antonio Marina',
    lat: 38.9800, lng: 1.3036,
    highlights: ['Sunset views', 'Skipper included', 'Up to 10 guests', 'Champagne optional'],
    popular: true,
    duration: '3 hours',
    minGuests: 2, maxGuests: 10,
  },

  // ── VILLAS ───────────────────────────────────────────────────
  {
    id: 'villa-001',
    category: 'villas',
    name: 'Luxury Finca — 4 Bedrooms',
    subtitle: '8 guests · Private pool · San Rafael area',
    description: 'A stunning traditional Ibicencan finca with a private pool, al fresco dining terrace and panoramic countryside views. Central location, 15 minutes from all major clubs.',
    price: 1210,
    unit: 'per night',
    emoji: '🏡',
    partner: 'Ibiza Luxury Villas',
    location: 'San Rafael, Ibiza',
    lat: 38.9600, lng: 1.3800,
    highlights: ['4 bedrooms', 'Private pool', 'Daily cleaning', 'Concierge'],
    popular: true,
    duration: 'min 3 nights',
    minGuests: 1, maxGuests: 8,
  },
  {
    id: 'villa-002',
    category: 'villas',
    name: 'Sunset View Villa — 6 Bedrooms',
    subtitle: '12 guests · Infinity pool · San Antonio area',
    description: 'One of Ibiza\'s finest sunset-view villas. Perched above San Antonio with an infinity pool, outdoor kitchen and breathtaking west-facing views. Perfect for large groups.',
    price: 2750,
    unit: 'per night',
    emoji: '🏡',
    partner: 'Aqualiving Villas',
    location: 'San Antonio area, Ibiza',
    lat: 38.9800, lng: 1.3200,
    highlights: ['6 bedrooms', 'Infinity pool', 'Sunset views', 'Up to 12 guests'],
    popular: true,
    duration: 'min 5 nights',
    minGuests: 4, maxGuests: 12,
  },
  {
    id: 'villa-003',
    category: 'villas',
    name: 'Ultra-Luxury Es Cubells Estate',
    subtitle: '16 guests · Multiple pools · Sea views',
    description: 'An extraordinary estate in the exclusive Es Cubells area with direct sea views, multiple pools, a private gym, home cinema and a dedicated staff team. The pinnacle of Ibiza luxury.',
    price: 8800,
    unit: 'per night',
    emoji: '🏰',
    partner: 'Icon Private Collection',
    location: 'Es Cubells, South Ibiza',
    lat: 38.8650, lng: 1.3250,
    highlights: ['8 bedrooms', '3 pools', 'Private staff', 'Home cinema'],
    popular: false,
    duration: 'min 7 nights',
    minGuests: 8, maxGuests: 16,
  },

  // ── CLUB TICKETS ─────────────────────────────────────────────
  {
    id: 'club-001',
    category: 'clubs',
    name: 'Pacha Ibiza — General Entry',
    subtitle: 'The world\'s most famous club · Ibiza Town',
    description: 'Entry to the legendary Pacha — Ibiza\'s oldest and most iconic club, home to its signature cherry logo and world-class DJ residencies. Book in advance for guaranteed entry.',
    price: 110,
    unit: 'per person',
    emoji: '🍒',
    partner: 'Pacha Ibiza',
    location: 'Passeig de Joan Carles I, Ibiza Town',
    lat: 38.9083, lng: 1.4369,
    highlights: ['Skip the queue', 'Guaranteed entry', 'Top resident DJs', '18+ only'],
    popular: true,
    duration: 'From midnight',
    minGuests: 1, maxGuests: 20,
  },
  {
    id: 'club-002',
    category: 'clubs',
    name: 'Ushuaia Ibiza — Day Club Entry',
    subtitle: 'Open-air superclub · Playa d\'en Bossa',
    description: 'The world\'s most spectacular open-air club. Iconic daytime events with superstar DJs, incredible production and the most Instagrammable pool parties on the island.',
    price: 143,
    unit: 'per person',
    emoji: '☀️',
    partner: 'Ushuaia Ibiza',
    location: 'Playa d\'en Bossa, Ibiza',
    lat: 38.8820, lng: 1.4120,
    highlights: ['Open-air venue', 'World-class DJs', 'Spectacular shows', '18+ only'],
    popular: true,
    duration: '4pm–midnight',
    minGuests: 1, maxGuests: 20,
  },
  {
    id: 'club-003',
    category: 'clubs',
    name: 'Hi Ibiza — General Entry',
    subtitle: 'World\'s best club · Playa d\'en Bossa',
    description: 'Multiple award winner for world\'s best club. Known for cutting-edge production, intimate atmosphere and the most forward-thinking music programme on the island.',
    price: 99,
    unit: 'per person',
    emoji: '🎵',
    partner: 'Hi Ibiza',
    location: 'Playa d\'en Bossa, Ibiza',
    lat: 38.8800, lng: 1.4100,
    highlights: ['World\'s best club', 'Award-winning', 'Intimate venue', '18+ only'],
    popular: false,
    duration: 'From midnight',
    minGuests: 1, maxGuests: 20,
  },
  {
    id: 'club-004',
    category: 'clubs',
    name: 'Amnesia Ibiza — General Entry',
    subtitle: 'Two iconic rooms · San Rafael',
    description: 'One of the most legendary clubs in the world. Two rooms, legendary foam parties, and a history that defines Ibiza\'s clubbing culture. An essential Ibiza experience.',
    price: 88,
    unit: 'per person',
    emoji: '🎉',
    partner: 'Amnesia Ibiza',
    location: 'Carretera Ibiza-San Antonio, San Rafael',
    lat: 38.9570, lng: 1.3770,
    highlights: ['Two rooms', 'Legendary history', 'Iconic foam parties', '18+ only'],
    popular: false,
    duration: 'From 11pm',
    minGuests: 1, maxGuests: 20,
  },

  // ── VIP PACKAGES ─────────────────────────────────────────────
  {
    id: 'vip-001',
    category: 'vip',
    name: 'Pacha VIP Table — 4 Guests',
    subtitle: 'Prime position · Bottle service included',
    description: 'Experience Pacha like a celebrity. Your own private table near the dancefloor with dedicated waitress service, premium bottle service and guaranteed entry for 4 guests.',
    price: 1100,
    unit: 'table for 4',
    emoji: '👑',
    partner: 'Pacha Ibiza',
    location: 'Passeig de Joan Carles I, Ibiza Town',
    lat: 38.9083, lng: 1.4369,
    highlights: ['4 entries included', 'Bottle service', 'Dedicated waitress', 'Prime location'],
    popular: true,
    duration: 'Midnight to 6am',
    minGuests: 4, maxGuests: 4,
  },
  {
    id: 'vip-002',
    category: 'vip',
    name: 'Ushuaia VIP Daybed — 4 Guests',
    subtitle: 'Exclusive daybed · Pool level · Full service',
    description: 'The ultimate Ushuaia experience. A prime pool-level daybed with exclusive bottle service, personal host and the best sightlines to the main stage. Book weeks in advance.',
    price: 2750,
    unit: 'daybed for 4',
    emoji: '🛏️',
    partner: 'Ushuaia Ibiza',
    location: 'Playa d\'en Bossa, Ibiza',
    lat: 38.8820, lng: 1.4120,
    highlights: ['Pool level', '4 entries', 'Personal host', 'Best stage views'],
    popular: true,
    duration: '4pm–midnight',
    minGuests: 4, maxGuests: 4,
  },
  {
    id: 'vip-003',
    category: 'vip',
    name: 'Amnesia VIP Table — 5 Guests',
    subtitle: 'Balcony position · DJ views · Bottle service',
    description: 'Secure a premium balcony table at Amnesia with panoramic views of the legendary dancefloor. Includes entry for 5 guests, dedicated table service and a welcome bottle.',
    price: 1320,
    unit: 'table for 5',
    emoji: '🌟',
    partner: 'Amnesia Ibiza',
    location: 'Carretera Ibiza-San Antonio, San Rafael',
    lat: 38.9570, lng: 1.3770,
    highlights: ['5 entries', 'Balcony position', 'Welcome bottle', 'DJ views'],
    popular: false,
    duration: '11pm to 7am',
    minGuests: 5, maxGuests: 5,
  },


  // BEACH CLUBS
  {
    id: 'bc-001', category: 'beach_clubs',
    name: 'Blue Marlin Ibiza — VIP Daybed',
    subtitle: 'Cala Jondal · Up to 4 guests · Full service',
    description: 'The most iconic beach club in Ibiza. A plush VIP daybed on the legendary Cala Jondal with dedicated host and full table service. Free entry included.',
    price: 440, unit: 'daybed (incl. service)', emoji: '🏖️',
    partner: 'Blue Marlin Ibiza', location: 'Cala Jondal, South Ibiza',
    lat: 38.8720, lng: 1.3580,
    highlights: ['Free entry', 'Full table service', 'Live DJ sets', 'Min spend incl.'],
    popular: true, duration: '11am to late', minGuests: 1, maxGuests: 4,
  },
  {
    id: 'bc-002', category: 'beach_clubs',
    name: 'Cala Bassa Beach Club — Balinese Bed',
    subtitle: 'Cala Bassa · Shaded bed · Turquoise water',
    description: 'The most beautiful natural beach on the island. A shaded Balinese bed under juniper trees with four restaurants, a Taittinger champagne lounge and water sports.',
    price: 275, unit: 'per bed (min spend)', emoji: '🌊',
    partner: 'Cala Bassa Beach Club', location: 'Cala Bassa, West Ibiza',
    lat: 38.9600, lng: 1.2350,
    highlights: ['4 restaurants', 'Champagne lounge', 'Water sports', 'Family friendly'],
    popular: true, duration: '10am to sunset', minGuests: 1, maxGuests: 4,
  },
  {
    id: 'bc-003', category: 'beach_clubs',
    name: 'Cotton Beach Club — Clifftop Table',
    subtitle: 'Cala Tarida · Panoramic views · Lunch',
    description: 'Perched on cliffs above Cala Tarida with breathtaking panoramic sea views. Chic white decor, Mediterranean cuisine and an extensive wine list.',
    price: 165, unit: 'per person (lunch)', emoji: '☁️',
    partner: 'Cotton Beach Club', location: 'Cala Tarida, West Ibiza',
    lat: 38.9350, lng: 1.2200,
    highlights: ['Cliff panorama', 'Lunch included', 'Wine list', 'Sunset views'],
    popular: false, duration: '1pm to sunset', minGuests: 2, maxGuests: 8,
  },
  {
    id: 'bc-004', category: 'beach_clubs',
    name: 'Nassau Beach Club — VIP Table',
    subtitle: "Playa d'en Bossa · White beds · Party",
    description: "The ultimate Playa den Bossa beach club. Big white beds, valet parking, champagne service and an electric atmosphere on Ibiza's most famous beach strip.",
    price: 330, unit: 'per table (min spend)', emoji: '🤍',
    partner: 'Nassau Beach Club', location: "Playa den Bossa, South Ibiza",
    lat: 38.8830, lng: 1.4170,
    highlights: ['Party atmosphere', 'White beds', 'Valet parking', 'Full service'],
    popular: false, duration: '10am to midnight', minGuests: 2, maxGuests: 6,
  },
  // RESTAURANTS
  {
    id: 'rest-001', category: 'restaurants',
    name: 'La Gaia — Michelin Star Dinner',
    subtitle: 'Ibiza Gran Hotel · 10-course tasting menu',
    description: "Ibiza's only Michelin-starred restaurant. Chef Molina's tasting menu is a sensory journey through the finest Mediterranean ingredients — the pinnacle of fine dining on the island.",
    price: 220, unit: 'per person (tasting menu)', emoji: '⭐',
    partner: 'Ibiza Gran Hotel', location: 'Ibiza Town',
    lat: 38.9100, lng: 1.4360,
    highlights: ['Michelin starred', '10-course menu', 'Wine pairing', 'Iconic setting'],
    popular: true, duration: 'Dinner from 7pm', minGuests: 1, maxGuests: 10,
  },
  {
    id: 'rest-002', category: 'restaurants',
    name: 'Nobu Ibiza — Omakase Experience',
    subtitle: 'Talamanca Bay · Japanese-Peruvian fusion',
    description: 'The legendary Nobu brand in Ibiza. Stunning bay views, world-famous Nikkei fusion cuisine and the most elegant atmosphere on the island. The Omakase experience is unmissable.',
    price: 185, unit: 'per person', emoji: '🍣',
    partner: 'Nobu Hotel Ibiza Bay', location: 'Talamanca Bay, Ibiza Town',
    lat: 38.9260, lng: 1.4520,
    highlights: ['Nobu signature', 'Bay views', 'Omakase option', 'Celebrity favourite'],
    popular: true, duration: 'Lunch and Dinner', minGuests: 1, maxGuests: 10,
  },
  {
    id: 'rest-003', category: 'restaurants',
    name: 'Amante Ibiza — Clifftop Dinner',
    subtitle: "Sol d'en Serra · Cliffside · Organic cuisine",
    description: 'An extraordinary restaurant on cliffs above turquoise waters. Contemporary organic Spanish and Italian cuisine from its own kitchen garden. Moonlit dinners here are unforgettable.',
    price: 95, unit: 'per person', emoji: '🌙',
    partner: 'Amante Ibiza', location: "Sol d'en Serra, Santa Eulalia",
    lat: 38.9800, lng: 1.5600,
    highlights: ['Cliff setting', 'Organic menu', 'Sea views', 'Romantic'],
    popular: true, duration: 'Lunch and Dinner', minGuests: 2, maxGuests: 8,
  },
  {
    id: 'rest-004', category: 'restaurants',
    name: 'Blue Marlin — Beach Restaurant',
    subtitle: 'Cala Jondal · Mediterranean and Sushi · Seafront',
    description: "Dine with your feet almost in the sand at one of the world's most glamorous beach restaurants. Mediterranean cuisine meets sushi, served to the soundtrack of legendary DJ sets.",
    price: 110, unit: 'per person', emoji: '🐟',
    partner: 'Blue Marlin Ibiza', location: 'Cala Jondal, South Ibiza',
    lat: 38.8720, lng: 1.3580,
    highlights: ['Beach setting', 'Sushi bar', 'DJ soundtrack', 'Seafront tables'],
    popular: false, duration: 'Lunch and Dinner', minGuests: 2, maxGuests: 8,
  },
  {
    id: 'rest-005', category: 'restaurants',
    name: 'Atzaro — Garden Estate Dinner',
    subtitle: 'San Lorenzo · Orange groves · Garden restaurant',
    description: 'A stunning countryside estate surrounded by orange groves. Creative Mediterranean cuisine in the most romantic, fragrant garden setting on the island.',
    price: 85, unit: 'per person', emoji: '🌿',
    partner: 'Atzaro Agroturismo', location: 'San Lorenzo, North Ibiza',
    lat: 39.0300, lng: 1.4750,
    highlights: ['Garden setting', 'Orange groves', 'Romantic', 'Creative menu'],
    popular: false, duration: 'Dinner from 7:30pm', minGuests: 2, maxGuests: 10,
  },

  // ── EXPERIENCES ──────────────────────────────────────────────
  {
    id: 'exp-001',
    category: 'experiences',
    name: 'Private Chef — Villa Dinner',
    subtitle: '4 course meal · Up to 12 guests · Ingredients included',
    description: 'A professional Ibiza chef comes to your villa to prepare a stunning 4-course Mediterranean dinner. Everything included — shopping, cooking, serving and cleanup. Just enjoy.',
    price: 165,
    unit: 'per person',
    emoji: '👨‍🍳',
    partner: 'Deliciously Sorted Ibiza',
    location: 'Your villa, anywhere on Ibiza',
    lat: 38.9067, lng: 1.4326,
    highlights: ['4 courses', 'Ingredients included', 'Cleanup included', 'Wine pairing available'],
    popular: true,
    duration: '3-4 hours',
    minGuests: 4, maxGuests: 20,
  },
  {
    id: 'exp-002',
    category: 'experiences',
    name: 'Sunrise Yoga — Ses Salines Beach',
    subtitle: '90 min · All levels · Mats provided',
    description: 'Start your morning with yoga on one of Ibiza\'s most beautiful beaches as the sun rises over the salt flats. A magical, peaceful way to begin a day in paradise.',
    price: 88,
    unit: 'per person',
    emoji: '🧘',
    partner: 'Ibiza Retreats',
    location: 'Ses Salines Beach, South Ibiza',
    lat: 38.8650, lng: 1.4050,
    highlights: ['Sunrise setting', '90 minutes', 'All levels welcome', 'Mats & tea provided'],
    popular: false,
    duration: '90 minutes',
    minGuests: 1, maxGuests: 15,
  },
  {
    id: 'exp-003',
    category: 'experiences',
    name: 'Quad Bike Adventure Tour',
    subtitle: '3 hours · Guide included · Countryside & coves',
    description: 'Explore Ibiza\'s stunning interior and hidden coves on a quad bike. Your guide leads you through countryside tracks, traditional villages and to secret swimming spots.',
    price: 132,
    unit: 'per person',
    emoji: '🏍️',
    partner: 'Quad Ibiza',
    location: 'San Antonio area, Ibiza',
    lat: 38.9800, lng: 1.3200,
    highlights: ['Guide included', 'Hidden coves', 'Countryside tracks', 'Helmets provided'],
    popular: true,
    duration: '3 hours',
    minGuests: 2, maxGuests: 12,
  },
  {
    id: 'exp-004',
    category: 'experiences',
    name: 'Private Helicopter Tour',
    subtitle: '30 min · Island panorama · Unforgettable',
    description: 'See Ibiza as very few do — from the air. A private helicopter tour circling the entire island, from the white villages of the north to the turquoise waters of Formentera.',
    price: 770,
    unit: 'per person (min 2)',
    emoji: '🚁',
    partner: 'Helicopteros Insulares',
    location: 'Ibiza Airport, Ibiza Town',
    lat: 38.8730, lng: 1.3730,
    highlights: ['30-minute flight', 'Island panorama', 'Formentera views', 'Private charter'],
    popular: false,
    duration: '30 minutes',
    minGuests: 2, maxGuests: 5,
  },
  {
    id: 'exp-005',
    category: 'experiences',
    name: 'Dalt Vila Guided Night Tour',
    subtitle: '2 hours · UNESCO heritage · Private guide',
    description: 'Discover the magic of Ibiza\'s ancient walled city after dark. Your private guide reveals the history, secrets and legends of Dalt Vila under the stars.',
    price: 77,
    unit: 'per person',
    emoji: '🏰',
    partner: 'Ibiza Culture Tours',
    location: 'Dalt Vila, Ibiza Town',
    lat: 38.9074, lng: 1.4312,
    highlights: ['UNESCO World Heritage', 'Private guide', 'Evening setting', 'History & culture'],
    popular: false,
    duration: '2 hours',
    minGuests: 2, maxGuests: 10,
  },
]

const CATEGORIES = [
  { key: 'all',         label: 'All',         emoji: '✨' },
  { key: 'boats',       label: 'Boats & Yachts', emoji: '⛵' },
  { key: 'villas',      label: 'Villas',      emoji: '🏡' },
  { key: 'clubs',       label: 'Club Tickets', emoji: '🎵' },
  { key: 'vip',         label: 'VIP Packages', emoji: '👑' },
  { key: 'beach_clubs',  label: 'Beach Clubs', emoji: '🏖️' },
  { key: 'restaurants', label: 'Restaurants', emoji: '🍽️' },
  { key: 'experiences', label: 'Experiences', emoji: '🎯' },
]

// ── Calendar ─────────────────────────────────────────────────
function BookingModal({ service, onClose, onBook }) {
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(service.minGuests)
  const [notes, setNotes] = useState('')
  const total = service.price * (service.unit.includes('person') ? guests : 1)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const inp = {
    width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.08)',
    border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10,
    fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'white',
    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{service.emoji}</span>
          <div>
            <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 18, color: 'white' }}>{service.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{service.partner}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Select date</div>
        <input type="date" value={date} min={minDateStr} onChange={e => setDate(e.target.value)} style={{ ...inp, colorScheme: 'dark' }} />

        {service.unit.includes('person') && service.maxGuests > 1 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Number of guests</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <button onClick={() => setGuests(Math.max(service.minGuests, guests - 1))}
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
              <span style={{ fontSize: 18, fontWeight: 500, color: 'white', minWidth: 30, textAlign: 'center' }}>{guests}</span>
              <button onClick={() => setGuests(Math.min(service.maxGuests, guests + 1))}
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif' }}>({service.minGuests}-{service.maxGuests} guests)</span>
            </div>
          </>
        )}

        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Special requests (optional)</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requirements, dietary needs, occasion details..." rows={3}
          style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />

        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>
            <span>{service.name}</span>
            <span>€{service.price.toLocaleString()} {service.unit.includes('person') ? 'x ' + guests : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontFamily: 'DM Sans,sans-serif' }}>
            <span>Isla Drop concierge (10%)</span>
            <span>included</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 500, color: 'white', fontFamily: 'DM Sans,sans-serif', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
            <span>Total</span>
            <span style={{ color: '#E8A070' }}>€{total.toLocaleString()}</span>
          </div>
        </div>

        <button onClick={() => { if (!date) { toast.error('Please select a date'); return } onBook({ service, date, guests, notes, total }) }}
          style={{ width: '100%', padding: '15px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}>
          Request Booking
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: 'DM Sans,sans-serif' }}>
          Booking requests confirmed within 2 hours · concierge@isladrop.net
        </div>
      </div>
    </div>
  )
}

// ── Directions Modal ─────────────────────────────────────────
function DirectionsModal({ service, onClose }) {
  const openMaps = (type) => {
    const dest = service.lat + ',' + service.lng
    const name = encodeURIComponent(service.location)
    if (type === 'google') window.open('https://www.google.com/maps/dir/?api=1&destination=' + dest + '&destination_place_id=' + name, '_blank')
    else window.open('https://maps.apple.com/?daddr=' + dest + '&dirflg=d', '_blank')
    onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 20, color: 'white', marginBottom: 6 }}>Get Directions</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontFamily: 'DM Sans,sans-serif' }}>📍 {service.location}</div>
        <button onClick={() => openMaps('google')}
          style={{ width: '100%', padding: '14px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Google Maps
        </button>
        <button onClick={() => openMaps('apple')}
          style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Apple Maps
        </button>
      </div>
    </div>
  )
}

// ── Service Card ─────────────────────────────────────────────
function ServiceCard({ service, onBook, onDirections }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(43,122,139,0.4),rgba(26,80,99,0.6))', padding: '16px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 32, flexShrink: 0 }}>{service.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 16, color: 'white', marginBottom: 2, lineHeight: 1.2 }}>{service.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif' }}>{service.subtitle}</div>
        </div>
        {service.popular && (
          <div style={{ background: '#C4683A', borderRadius: 20, padding: '3px 9px', fontSize: 10, color: 'white', fontWeight: 500, flexShrink: 0 }}>Popular</div>
        )}
      </div>

      <div style={{ padding: '12px 16px 16px' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: 12, fontFamily: 'DM Sans,sans-serif' }}>{service.description}</div>

        {/* Highlights */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {service.highlights.map(h => (
            <span key={h} style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>{h}</span>
          ))}
        </div>

        {/* Price + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#E8A070' }}>€{service.price.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif' }}>{service.unit}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onDirections(service)}
              style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Map
            </button>
            <button onClick={() => onBook(service)}
              style={{ padding: '9px 16px', background: '#C4683A', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI Design My Day/Night ────────────────────────────────────
async function designExperience(prompt, type, userBookings) {
  const serviceList = SERVICES.map(s => s.id + '|' + s.name + '|' + s.category + '|€' + s.price + ' ' + s.unit).join('\n')
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })
  const bookingsContext = userBookings && userBookings.length > 0
    ? 'Client has booked with us: ' + userBookings.map(b => b.service_name + ' on ' + b.booking_date).join(', ')
    : 'No prior bookings with us — do NOT assume accommodation type or other bookings'

  const system = 'You are Isla — the most plugged-in, creative and indispensable Ibiza concierge. You live and breathe this island. You know which DJ is on at which club tonight, when restaurants hit their stride, when the beach clubs peak. You are warm, specific, and genuinely excited about making this experience unforgettable.\n\nCRITICAL RULES:\n- NEVER suggest a villa or private accommodation option unless the client has booked one with us\n- DO suggest restaurants, beach clubs, boats, experiences based on their vibe\n- For club nights: suggest arrival 45-90 mins after the headliner starts (clubs are dead when they open)\n- For restaurants: suggest prime booking times (8:30-9:30pm for most Ibiza restaurants, not 7pm which is tourist hour)\n- For beach clubs: arrive by 1pm to get beds, peak vibe is 3-5pm\n- For sunsets: San Antonio lighthouse area or Cafe del Mar, arrive 30 mins before sunset\n- Be CREATIVE and SPECIFIC with timing\n- Today is: ' + today + '\n\nCLIENT CONTEXT:\n' + bookingsContext + '\n\nOUR SERVICES (id|name|category|price):\n' + serviceList + '\n\nReturn JSON only: { "title": "string", "intro": "string", "timeline": [{ "time": "string", "activity": "string", "detail": "string", "service_id": "optional" }], "isla_insight": "string", "services": ["id1"], "vibe_tags": ["tag1"] }'

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: 'Design a ' + type + ' experience for: ' + prompt }],
    }),
  })

  if (!resp.ok) throw new Error('API error: ' + resp.status)
  const data = await resp.json()
  const raw = data.content?.[0]?.text || '{}'
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()) }
  catch { return null }
}


function DesignExperience({ onBook }) {
  const [mode, setMode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [prompt, setPrompt] = useState('')

  const QUICK_DAY = ['Romantic couple day', 'Group of 8 friends', 'Family with children', 'Solo luxury escape', 'Birthday celebration', 'Corporate group']
  const QUICK_NIGHT = ['VIP club night', 'Intimate dinner party', 'Birthday party group', 'Sunset to sunrise', 'Luxury couple evening', 'Group celebration']

  const generate = async (p) => {
    const fullPrompt = mode === 'day'
      ? 'Design the perfect Ibiza day experience for: ' + (p || prompt) + '. Include activities from morning to evening.'
      : 'Design the perfect Ibiza night experience for: ' + (p || prompt) + '. Start from sunset and go through the night.'
    setLoading(true)
    setResult(null)
    try {
      const r = await designExperience(fullPrompt, mode)
      setResult(r)
    } catch {
      setResult({ text: 'Unable to generate right now. Browse our services below and build your own perfect day!', services: [] })
    }
    setLoading(false)
  }

  if (!mode) return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 20, color: 'white', marginBottom: 6 }}>Design Your Experience</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontFamily: 'DM Sans,sans-serif' }}>Let Isla AI curate the perfect itinerary for you</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setMode('day')} style={{ flex: 1, padding: '14px', background: 'rgba(245,201,122,0.15)', border: '0.5px solid rgba(245,201,122,0.3)', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>☀️</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'white', fontFamily: 'DM Sans,sans-serif' }}>Design My Day</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Boats, beaches, lunch</div>
        </button>
        <button onClick={() => setMode('night')} style={{ flex: 1, padding: '14px', background: 'rgba(43,122,139,0.2)', border: '0.5px solid rgba(43,122,139,0.35)', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🌙</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'white', fontFamily: 'DM Sans,sans-serif' }}>Design My Night</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Dinner, clubs, VIP</div>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode(null); setResult(null); setPrompt('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 18, color: 'white' }}>{mode === 'day' ? '☀️ Design My Day' : '🌙 Design My Night'}</div>
      </div>

      {!result && !loading && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            {(mode === 'day' ? QUICK_DAY : QUICK_NIGHT).map(q => (
              <button key={q} onClick={() => generate(q)} style={{ padding: '7px 13px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>{q}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} placeholder="Describe your group, occasion or vibe..." style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 24, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'white', outline: 'none' }} />
            <button onClick={() => generate()} disabled={!prompt.trim()} style={{ width: 42, height: 42, background: prompt.trim() ? '#C4683A' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans,sans-serif', fontSize: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          Isla is designing your perfect experience...
        </div>
      )}

      {result && (
        <>
          {/* Handle both old {text} and new {title,intro,timeline} formats */}
          {result.title && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:'white', marginBottom:4 }}>{result.title}</div>
              {result.vibe_tags && <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>{result.vibe_tags.map((t,i) => <span key={i} style={{ fontSize:11, background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'3px 9px', color:'rgba(255,255,255,0.6)' }}>{t}</span>)}</div>}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', marginBottom: 14, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontFamily: 'DM Sans,sans-serif', whiteSpace: 'pre-wrap' }}>
            {result.intro || result.text}
          </div>
          {result.timeline && result.timeline.map((item, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ flexShrink:0, textAlign:'right', minWidth:52 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#E8A070', fontFamily:'DM Sans,sans-serif' }}>{item.time}</div>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'white', fontFamily:'DM Sans,sans-serif', marginBottom:3 }}>{item.activity}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5, fontFamily:'DM Sans,sans-serif' }}>{item.detail}</div>
              </div>
            </div>
          ))}
          {result.isla_insight && (
            <div style={{ background:'rgba(196,104,58,0.15)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:12, color:'#E8A070', lineHeight:1.5, fontFamily:'DM Sans,sans-serif' }}>
              <span style={{ fontWeight:500 }}>Isla insider: </span>{result.isla_insight}
            </div>
          )}
          {result.services && result.services.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>INCLUDED IN YOUR ITINERARY</div>
              {result.services.map(s => <ServiceCard key={s.id} service={s} onBook={onBook} onDirections={() => {}} />)}
            </>
          )}
          <button onClick={() => { setResult(null); setPrompt('') }} style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', marginTop: 8 }}>
            Generate another experience
          </button>
        </>
      )}
    </div>
  )
}

// ── Main Concierge Page ───────────────────────────────────────
export default function Concierge({ onBack }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [bookingService, setBookingService] = useState(null)
  const [directionsService, setDirectionsService] = useState(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(null)

  const filtered = activeCategory === 'all' ? SERVICES : SERVICES.filter(s => s.category === activeCategory)

  const handleBook = (service) => setBookingService(service)

  const handleConfirmBooking = async ({ service, date, guests, notes, total }) => {
    setBookingService(null)
    toast.loading('Processing your booking...', { id: 'booking' })
    try {
      // Get user details from Supabase if logged in
      let customerEmail = 'guest@isladrop.net'
      let customerName = 'Guest'
      let customerId = null
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          customerEmail = user.email
          customerId = user.id
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
          if (profile?.full_name) customerName = profile.full_name
        }
      } catch {}

      // Call the edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(supabaseUrl + '/functions/v1/process-concierge-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + supabaseKey },
        body: JSON.stringify({
          type: 'new_booking',
          booking: {
            customer_email: customerEmail,
            customer_name: customerName,
            customer_id: customerId,
            service_id: service.id,
            service_name: service.name,
            service_category: service.category,
            partner: service.partner,
            location: service.location,
            lat: service.lat,
            lng: service.lng,
            date,
            guests,
            notes,
            price: service.price,
            total,
          }
        })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Booking failed')
      toast.dismiss('booking')
      if (result.instantly_confirmed) {
        toast.success('Booking instantly confirmed! Check your email.', { duration: 6000 })
      } else {
        toast.success('Request sent — we will confirm within 2 hours.', { duration: 5000 })
      }
      setBookingConfirmed({
        service, date, guests, notes, total,
        bookingRef: result.booking_ref,
        instantlyConfirmed: result.instantly_confirmed,
        method: result.method,
        confirmationCode: result.confirmation_code,
      })
    } catch (err) {
      toast.dismiss('booking')
      // Fallback — still show confirmation screen, email might not have sent
      toast.success('Request received! We will confirm within 2 hours.', { duration: 4000 })
      setBookingConfirmed({ service, date, guests, notes, total, bookingRef: 'CB-' + Date.now().toString(36).toUpperCase() })
    }
  }

  if (bookingConfirmed) return (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 26, color: 'white', marginBottom: 8 }}>Request Sent!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24, lineHeight: 1.6, fontFamily: 'DM Sans,sans-serif' }}>
        Your booking request for {bookingConfirmed.service.name} on {new Date(bookingConfirmed.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} has been received.
        Our concierge team will confirm within 2 hours via email.
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>BOOKING SUMMARY</div>
        <div style={{ fontSize: 14, color: 'white', marginBottom: 4, fontFamily: 'DM Sans,sans-serif' }}>{bookingConfirmed.service.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif' }}>{bookingConfirmed.service.location}</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#E8A070', marginTop: 8 }}>€{bookingConfirmed.total.toLocaleString()}</div>
      </div>
      <button onClick={() => { setBookingConfirmed(null) }} style={{ width: '100%', padding: '14px', background: '#C4683A', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}>
        Browse more experiences
      </button>
      <button onClick={onBack} style={{ width: '100%', padding: '12px', background: 'none', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12, fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
        Back to home
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 100%)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0D3B4A,#1A5263)', padding: '16px 16px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <div style={{ fontFamily: 'DM Serif Display,serif', fontSize: 24, color: 'white', lineHeight: 1 }}>Concierge</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Luxury experiences · Ibiza</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, background: activeCategory === cat.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)', color: activeCategory === cat.key ? '#0D3B4A' : 'white', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: activeCategory === cat.key ? 500 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {activeCategory === 'all' && <DesignExperience onBook={handleBook} />}
        {filtered.map(service => (
          <ServiceCard key={service.id} service={service} onBook={handleBook} onDirections={setDirectionsService} />
        ))}
      </div>

      {bookingService && <BookingModal service={bookingService} onClose={() => setBookingService(null)} onBook={handleConfirmBooking} />}
      {directionsService && <DirectionsModal service={directionsService} onClose={() => setDirectionsService(null)} />}
    </div>
  )
}
