// ================================================================
// Isla Drop — Concierge (World-class rebuild)
// Photo management via Supabase — admins/partners upload per service
// All existing services, AI, booking flow preserved + upgraded
// ================================================================
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '../../lib/store'
import toast from 'react-hot-toast'

const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }
const C = {
  bg:'linear-gradient(170deg,#0A2A38 0%,#0D3545 35%,#1A5060 100%)',
  header:'linear-gradient(135deg,#0D3B4A,#1A5263)',
  surface:'rgba(255,255,255,0.06)', surfaceB:'rgba(255,255,255,0.1)',
  border:'rgba(255,255,255,0.1)', accent:'#C4683A', gold:'#C8A84B',
  green:'#7EE8A2', muted:'rgba(255,255,255,0.45)', white:'white',
}

// ── Inline translations ───────────────────────────────────────
const T = { total:'Total', popular:'Popular', bookNow:'Book now',
  getDirections:'Get directions', guests:'Guests',
  concierge:'Concierge', luxuryExperiences:'Luxury experiences · Ibiza' }
function useT_ctx() { return T }

// ── Fallback photos by category (Unsplash CDN, free) ─────────
const CATEGORY_PHOTOS = {
  boats:       'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600&q=80',
  villas:      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
  clubs:       'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80',
  vip:         'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=600&q=80',
  beach_clubs: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  restaurants: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  experiences: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
}

// ── Service photo: Supabase first, fallback to Unsplash ────────
function ServicePhoto({ service, height=180, style={} }) {
  const [src, setSrc] = useState(service.photo_url || CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.experiences)
  return (
    <div style={{ height, overflow:'hidden', position:'relative', background:'rgba(0,0,0,0.3)', ...style }}>
      <img src={src} alt={service.name}
        onError={()=>setSrc(CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.experiences)}
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,53,69,0.92) 0%,rgba(13,53,69,0.3) 50%,transparent 100%)' }}/>
    </div>
  )
}

// ── Live photo hook — reads from Supabase concierge_service_photos ──
function useServicePhotos() {
  const [photos, setPhotos] = useState({})
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('concierge_service_photos').select('service_id,photo_url,approved')
        .eq('approved', true).order('created_at', { ascending:false })
        .then(({ data }) => {
          if (!data) return
          const map = {}
          data.forEach(row => { if (!map[row.service_id]) map[row.service_id] = row.photo_url })
          setPhotos(map)
        }).catch(() => {})
    }).catch(() => {})
  }, [])
  return photos
}

// ── SERVICES catalogue ────────────────────────────────────────
const SERVICES = [
  // BOATS
  { id:'boat-001', category:'boats', name:'RIB Speedboat — Half Day', subtitle:'Up to 8 guests · 4 hours · Captain included', description:"Explore Ibiza's secret coves and crystal-clear waters aboard a sleek RIB. Visit Cala Bassa, Cala Comte and sail across to Formentera. Captain and safety gear included.", price:605, unit:'half day', emoji:'🚤', partner:'Boats Ibiza', location:'Marina Botafoch, Ibiza Town', lat:38.9085, lng:1.4423, highlights:['Captain included','Up to 8 guests','Coves & snorkelling','Fuel extra'], popular:true, duration:'4 hours', minGuests:1, maxGuests:8, includes:'Captain, safety gear, insurance', insider_tip:'Request Cala d\'Hort for views of Es Vedrà — the most dramatic rock formation in Ibiza.' },
  { id:'boat-002', category:'boats', name:'RIB Speedboat — Full Day', subtitle:'Up to 8 guests · 8 hours · Captain included', description:'A full day on the Mediterranean. Sail to Formentera for lunch on the beach, swim in hidden coves and watch the Ibiza sunset from the water. The ultimate day at sea.', price:1100, unit:'full day', emoji:'🚤', partner:'Smart Charter Ibiza', location:'Marina Botafoch, Ibiza Town', lat:38.9085, lng:1.4423, highlights:['8 hours','Formentera trip','Snorkelling gear','Fuel extra'], popular:true, duration:'8 hours', minGuests:1, maxGuests:8, includes:'Captain, safety equipment, snorkelling gear', insider_tip:'Leave by 9am to reach Formentera for lunch and still catch the Ibiza sunset on the way back.' },
  { id:'boat-003', category:'boats', name:'Sailing Catamaran — Full Day', subtitle:'Up to 12 guests · 8 hours · Crew included', description:"Spacious, stable and perfect for groups. The catamaran's wide deck is ideal for sunbathing, dining and celebrations. Includes professional skipper and crew.", price:1870, unit:'full day', emoji:'⛵', partner:'Real Yacht Charter', location:'Santa Eularia Marina, Ibiza', lat:38.9845, lng:1.5329, highlights:['Up to 12 guests','Crew included','Wide sundeck','Great for groups'], popular:false, duration:'8 hours', minGuests:4, maxGuests:12, includes:'Skipper, crew, life jackets', insider_tip:'Perfect for birthday groups. The wide deck allows catering to be set up — ask about our catering add-on.' },
  { id:'boat-004', category:'boats', name:'Luxury Motor Yacht — Full Day', subtitle:'Up to 10 guests · 8 hours · Captain & crew', description:'Step aboard a premium motor yacht for the ultimate Ibiza day at sea. Multiple decks, jacuzzi, full bar and professional crew. The VIP experience on the water.', price:4400, unit:'full day', emoji:'🛥️', partner:'Ibiza Rent a Boat', location:'Marina Ibiza, Ibiza Town', lat:38.9067, lng:1.4326, highlights:['Captain & crew','Jacuzzi on board','Full bar','VIP service'], popular:true, duration:'8 hours', minGuests:2, maxGuests:10, includes:'Full crew, open bar, water toys, fuel', insider_tip:'Ask for Juan as your captain — he knows every secret cove on the island.' },
  { id:'boat-005', category:'boats', name:'Sunset Cruise — 3 Hours', subtitle:'Up to 10 guests · 6pm–9pm · Skipper included', description:'The most romantic way to experience the legendary Ibiza sunset. Sail along the coast as the sky turns gold and rose, with champagne and music on deck.', price:770, unit:'per cruise', emoji:'🌅', partner:'Boats Ibiza', location:'San Antonio Marina', lat:38.9800, lng:1.3036, highlights:['Sunset views','Skipper included','Up to 10 guests','Champagne optional'], popular:true, duration:'3 hours', minGuests:2, maxGuests:10, includes:'Skipper, safety equipment', insider_tip:'The west coast near San Antonio gives the best sunset views in all of Ibiza.' },
  // VILLAS
  { id:'villa-001', category:'villas', name:'Luxury Finca — 4 Bedrooms', subtitle:'8 guests · Private pool · San Rafael area', description:"A stunning traditional Ibicencan finca with a private pool, al fresco dining terrace and panoramic countryside views. Central location, 15 minutes from all major clubs.", price:1210, unit:'per night', emoji:'🏡', partner:'Ibiza Luxury Villas', location:'San Rafael, Ibiza', lat:38.9600, lng:1.3800, highlights:['4 bedrooms','Private pool','Daily cleaning','Concierge'], popular:true, duration:'min 3 nights', minGuests:1, maxGuests:8, includes:'Daily cleaning, concierge, welcome hamper', insider_tip:'Request a late checkout — the pool in the midday heat before your evening flight is worth every minute.' },
  { id:'villa-002', category:'villas', name:'Sunset View Villa — 6 Bedrooms', subtitle:'12 guests · Infinity pool · San Antonio area', description:"One of Ibiza's finest sunset-view villas. Perched above San Antonio with an infinity pool, outdoor kitchen and breathtaking west-facing views. Perfect for large groups.", price:2750, unit:'per night', emoji:'🏡', partner:'Aqualiving Villas', location:'San Antonio area, Ibiza', lat:38.9800, lng:1.3200, highlights:['6 bedrooms','Infinity pool','Sunset views','Up to 12 guests'], popular:true, duration:'min 5 nights', minGuests:4, maxGuests:12, includes:'Daily cleaning, concierge, linen', insider_tip:'The infinity pool faces due west. Every evening becomes a private sunset party.' },
  { id:'villa-003', category:'villas', name:'Ultra-Luxury Es Cubells Estate', subtitle:'16 guests · Multiple pools · Sea views', description:"An extraordinary estate in the exclusive Es Cubells area with direct sea views, multiple pools, a private gym, home cinema and a dedicated staff team. The pinnacle of Ibiza luxury.", price:8800, unit:'per night', emoji:'🏰', partner:'Icon Private Collection', location:'Es Cubells, South Ibiza', lat:38.8650, lng:1.3250, highlights:['8 bedrooms','3 pools','Private staff','Home cinema'], popular:false, duration:'min 7 nights', minGuests:8, maxGuests:16, includes:'Full staff team, chef available, security', insider_tip:'The estate has a private path to a secluded beach. Almost nobody knows it exists.' },
  // VIP
  { id:'vip-001', category:'vip', name:'Pacha VIP Table — 4 Guests', subtitle:'Prime position · Bottle service included', description:"Experience Pacha like a celebrity. Your own private table near the dancefloor with dedicated waitress service, premium bottle service and guaranteed entry for 4 guests.", price:1100, unit:'table for 4', emoji:'👑', partner:'Pacha Ibiza', location:'Passeig de Joan Carles I, Ibiza Town', lat:38.9083, lng:1.4369, highlights:['4 entries included','Bottle service','Dedicated waitress','Prime location'], popular:true, duration:'Midnight to 6am', minGuests:1, maxGuests:30, includes:'4 entries, 1 premium bottle, mixers, dedicated host', insider_tip:'Request a table on the mezzanine level — best view of the dancefloor without being in the crowd.' },
  { id:'vip-002', category:'vip', name:'Ushuaia VIP Daybed — 4 Guests', subtitle:'Exclusive daybed · Pool level · Full service', description:"The ultimate Ushuaia experience. A prime pool-level daybed with exclusive bottle service, personal host and the best sightlines to the main stage. Book weeks in advance.", price:2750, unit:'daybed for 4', emoji:'🛏️', partner:'Ushuaia Ibiza', location:"Playa d'en Bossa, Ibiza", lat:38.8820, lng:1.4120, highlights:['Pool level','4 entries','Personal host','Best stage views'], popular:true, duration:'4pm–midnight', minGuests:1, maxGuests:30, includes:'4 entries, daybed, personal host, minimum spend', insider_tip:'Thursdays for Martin Garrix, Fridays for Stormzy — check the summer schedule when booking.' },
  { id:'vip-003', category:'vip', name:'Amnesia VIP Table — 5 Guests', subtitle:'Balcony position · DJ views · Bottle service', description:'Secure a premium balcony table at Amnesia with panoramic views of the legendary dancefloor. Includes entry for 5 guests, dedicated table service and a welcome bottle.', price:1320, unit:'table for 5', emoji:'🌟', partner:'Amnesia Ibiza', location:'Carretera Ibiza-San Antonio, San Rafael', lat:38.9570, lng:1.3770, highlights:['5 entries','Balcony position','Welcome bottle','DJ views'], popular:false, duration:'11pm to 7am', minGuests:1, maxGuests:30, includes:'5 entries, 1 premium bottle, table service', insider_tip:'The Terrace room VIP tables look directly at the DJ booth. Arrive by midnight.' },
  // BEACH CLUBS
  { id:'bc-001', category:'beach_clubs', name:'Blue Marlin Ibiza — VIP Daybed', subtitle:'Cala Jondal · Up to 4 guests · Full service', description:"The most iconic beach club in Ibiza. A plush VIP daybed on the legendary Cala Jondal with dedicated host and full table service. Free entry included.", price:440, unit:'daybed (incl. service)', emoji:'🏖️', partner:'Blue Marlin Ibiza', location:'Cala Jondal, South Ibiza', lat:38.8720, lng:1.3580, highlights:['Free entry','Full table service','Live DJ sets','Min spend incl.'], popular:true, duration:'11am to late', minGuests:1, maxGuests:4, includes:'Daybed, dedicated host, minimum spend', insider_tip:'Get the tuna tataki and a bottle of Laurent-Perrier rosé. Peak DJ set is 3–5pm.' },
  { id:'bc-002', category:'beach_clubs', name:'Cala Bassa Beach Club — Balinese Bed', subtitle:'Cala Bassa · Shaded bed · Turquoise water', description:"The most beautiful natural beach on the island. A shaded Balinese bed under juniper trees with four restaurants, a Taittinger champagne lounge and water sports.", price:275, unit:'per bed (min spend)', emoji:'🌊', partner:'Cala Bassa Beach Club', location:'Cala Bassa, West Ibiza', lat:38.9600, lng:1.2350, highlights:['4 restaurants','Champagne lounge','Water sports','Family friendly'], popular:true, duration:'10am to sunset', minGuests:1, maxGuests:4, includes:'Balinese bed, access, minimum spend', insider_tip:'The turquoise water here rivals the Maldives. Arrive before 11am for the best beds.' },
  { id:'bc-003', category:'beach_clubs', name:'Cotton Beach Club — Clifftop Table', subtitle:'Cala Tarida · Panoramic views · Lunch', description:'Perched on cliffs above Cala Tarida with breathtaking panoramic sea views. Chic white decor, Mediterranean cuisine and an extensive wine list.', price:165, unit:'per person (lunch)', emoji:'☁️', partner:'Cotton Beach Club', location:'Cala Tarida, West Ibiza', lat:38.9350, lng:1.2200, highlights:['Cliff panorama','Lunch included','Wine list','Sunset views'], popular:false, duration:'1pm to sunset', minGuests:2, maxGuests:8, includes:'Lunch, non-alcoholic welcome drink', insider_tip:'Request table 12 — it overhangs the cliff and has unobstructed views from every angle.' },
  { id:'bc-004', category:'beach_clubs', name:'Nassau Beach Club — VIP Table', subtitle:"Playa d'en Bossa · White beds · Party", description:"The ultimate Playa den Bossa beach club. Big white beds, valet parking, champagne service and an electric atmosphere on Ibiza's most famous beach strip.", price:330, unit:'per table (min spend)', emoji:'🤍', partner:'Nassau Beach Club', location:"Playa den Bossa, South Ibiza", lat:38.8830, lng:1.4170, highlights:['Party atmosphere','White beds','Valet parking','Full service'], popular:false, duration:'10am to midnight', minGuests:2, maxGuests:6, includes:'Table, minimum spend, valet parking', insider_tip:'The energy peaks after 4pm when the DJ shifts up a gear. Arrive for lunch and stay all day.' },
  { id:'bc-005', category:'beach_clubs', name:'Nikki Beach — Champagne Brunch', subtitle:'Jet-set luxury · Santa Eulalia', description:'The ultimate jet-set Sunday experience. Champagne rituals, live music, themed events and the most glamorous crowd in Ibiza on the terrace.', price:150, unit:'per person', emoji:'🥂', partner:'Nikki Beach', location:"Playa s'Argamassa, Santa Eulalia", lat:38.9900, lng:1.5550, highlights:['Arrive by yacht','Champagne rituals','Live music & themed events','International jet-set crowd'], popular:true, duration:'Brunch to evening', minGuests:2, maxGuests:10, includes:'Brunch, welcome champagne, entertainment', insider_tip:'Sunday Brunch is the event of the week. White attire encouraged. Yacht arrival is unforgettable.' },
  { id:'bc-007', category:'beach_clubs', name:'Beso Beach — Long Lunch', subtitle:'Barefoot luxury · Ses Salines', description:"The legendary Ibiza long lunch that turns into a sunset party. Fresh seafood, Balearic music and authentic barefoot luxury on one of the island's finest beaches.", price:95, unit:'per person', emoji:'🦩', partner:'Beso Beach', location:'Ses Salines, Sant Josep', lat:38.8710, lng:1.3960, highlights:['Legendary long lunches','Barefoot luxury','Fresh seafood','Laid-back Ibiza energy'], popular:true, duration:'Lunch to sunset', minGuests:2, maxGuests:10, includes:'Reservation, welcome drink', insider_tip:'Arrive at 1:30pm for lunch. By 4pm the dancing starts naturally. By 6pm nobody wants to leave.' },
  // RESTAURANTS
  { id:'rest-001', category:'restaurants', name:'La Gaia — Michelin Star Dinner', subtitle:'Ibiza Gran Hotel · 10-course tasting menu', description:"Ibiza's only Michelin-starred restaurant. Chef Molina's tasting menu is a sensory journey through the finest Mediterranean ingredients — the pinnacle of fine dining on the island.", price:220, unit:'per person (tasting menu)', emoji:'⭐', partner:'Ibiza Gran Hotel', location:'Ibiza Town', lat:38.9100, lng:1.4360, highlights:['Michelin starred','10-course menu','Wine pairing','Iconic setting'], popular:true, duration:'Dinner from 7pm', minGuests:1, maxGuests:10, includes:'10-course menu, optional wine pairing', insider_tip:'Add the wine pairing — the sommelier pairs Balearic wines you cannot find elsewhere. Book 3 weeks ahead.' },
  { id:'rest-002', category:'restaurants', name:'Nobu Ibiza — Omakase Experience', subtitle:'Talamanca Bay · Japanese-Peruvian fusion', description:'The legendary Nobu brand in Ibiza. Stunning bay views, world-famous Nikkei fusion cuisine and the most elegant atmosphere on the island. The Omakase experience is unmissable.', price:185, unit:'per person', emoji:'🍣', partner:'Nobu Hotel Ibiza Bay', location:'Talamanca Bay, Ibiza Town', lat:38.9260, lng:1.4520, highlights:['Nobu signature','Bay views','Omakase option','Celebrity favourite'], popular:true, duration:'Lunch and Dinner', minGuests:1, maxGuests:10, includes:'Omakase menu, water, service', insider_tip:'Request a table on the terrace for bay views. The black cod miso and yellowtail sashimi are non-negotiable.' },
  { id:'rest-003', category:'restaurants', name:'Amante Ibiza — Clifftop Dinner', subtitle:"Sol d'en Serra · Cliffside · Organic cuisine", description:'An extraordinary restaurant on cliffs above turquoise waters. Contemporary organic Spanish and Italian cuisine from its own kitchen garden. Moonlit dinners here are unforgettable.', price:95, unit:'per person', emoji:'🌙', partner:'Amante Ibiza', location:"Sol d'en Serra, Santa Eulalia", lat:38.9800, lng:1.5600, highlights:['Cliff setting','Organic menu','Sea views','Romantic'], popular:true, duration:'Lunch and Dinner', minGuests:2, maxGuests:8, includes:'À la carte reservation, welcome drink', insider_tip:'The cliffside terrace at sunset is one of the most romantic settings in the Mediterranean.' },
  { id:'rest-004', category:'restaurants', name:'Blue Marlin — Beach Restaurant', subtitle:'Cala Jondal · Mediterranean and Sushi · Seafront', description:"Dine with your feet almost in the sand at one of the world's most glamorous beach restaurants. Mediterranean cuisine meets sushi, served to the soundtrack of legendary DJ sets.", price:110, unit:'per person', emoji:'🐟', partner:'Blue Marlin Ibiza', location:'Cala Jondal, South Ibiza', lat:38.8720, lng:1.3580, highlights:['Beach setting','Sushi bar','DJ soundtrack','Seafront tables'], popular:false, duration:'Lunch and Dinner', minGuests:2, maxGuests:8, includes:'À la carte reservation', insider_tip:'Lunch here and stay for the afternoon DJ — it transitions seamlessly from restaurant to party.' },
  { id:'rest-005', category:'restaurants', name:'Atzaro — Garden Estate Dinner', subtitle:'San Lorenzo · Orange groves · Garden restaurant', description:"A stunning countryside estate surrounded by orange groves. Creative Mediterranean cuisine in the most romantic, fragrant garden setting on the island.", price:85, unit:'per person', emoji:'🌿', partner:'Atzaro Agroturismo', location:'San Lorenzo, North Ibiza', lat:39.0300, lng:1.4750, highlights:['Garden setting','Orange groves','Romantic','Creative menu'], popular:false, duration:'Dinner from 7:30pm', minGuests:2, maxGuests:10, includes:'À la carte reservation, complimentary welcome', insider_tip:'Go on a Tuesday evening when they host live acoustic music in the orange grove. Magical.' },
  { id:'rest-010', category:'restaurants', name:"Gordon Ramsay Hell's Kitchen", subtitle:"First European outpost · The Unexpected Hotel", description:"Gordon Ramsay's first European venue brings the drama of Hell's Kitchen to Ibiza. The red and blue kitchen setup faces the dining room, service is theatrical, food is exceptional.", price:120, unit:'per person', emoji:'🔥', partner:"Hell's Kitchen Ibiza", location:"The Unexpected Hotel, Playa d'en Bossa", lat:38.8835, lng:1.4005, highlights:["First European venue",'Theatrical kitchen','Celebrity chef','Electric atmosphere'], popular:true, duration:'Dinner', minGuests:2, maxGuests:10, includes:'À la carte reservation', insider_tip:'Book as soon as reservations open — Summer 2025 opening means intense demand.' },
  { id:'rest-011', category:'restaurants', name:'Sublimotion — Gastro-sensory', subtitle:"World's most immersive dinner · Hard Rock Hotel", description:"The world's most expensive and immersive dining experience. Maximum 12 guests per night in a room where the walls, sound, scent and temperature change between each of the 20+ courses.", price:1800, unit:'per person', emoji:'🎭', partner:'Sublimotion', location:"Hard Rock Hotel, Playa d'en Bossa", lat:38.8840, lng:1.4000, highlights:['Max 12 guests','Aromatically controlled','Michelin-level food','World record experience'], popular:false, duration:'3-4 hours', minGuests:2, maxGuests:12, includes:'All 20+ courses, wine pairing, full experience', insider_tip:'Book months ahead. This is not just dinner — it is the most memorable night of your life on the island.' },
  // EXPERIENCES
  { id:'exp-001', category:'experiences', name:'Private Chef — Villa Dinner', subtitle:'4 course meal · Up to 12 guests · Ingredients included', description:"A professional Ibiza chef comes to your villa to prepare a stunning 4-course Mediterranean dinner. Everything included — shopping, cooking, serving and cleanup. Just enjoy.", price:165, unit:'per person', emoji:'👨‍🍳', partner:'Deliciously Sorted Ibiza', location:'Your villa, anywhere on Ibiza', lat:38.9067, lng:1.4326, highlights:['4 courses','Ingredients included','Cleanup included','Wine pairing available'], popular:true, duration:'3-4 hours', minGuests:4, maxGuests:20, includes:'Shopping, preparation, 4 courses, service, cleanup', insider_tip:'Add the cocktail welcome package — the chef arrives an hour early and prepares cocktails while cooking. Spectacular.' },
  { id:'exp-002', category:'experiences', name:'Sunrise Yoga — Ses Salines Beach', subtitle:'90 min · All levels · Mats provided', description:"Start your morning with yoga on one of Ibiza's most beautiful beaches as the sun rises over the salt flats. A magical, peaceful way to begin a day in paradise.", price:88, unit:'per person', emoji:'🧘', partner:'Ibiza Retreats', location:'Ses Salines Beach, South Ibiza', lat:38.8650, lng:1.4050, highlights:['Sunrise setting','90 minutes','All levels welcome','Mats & tea provided'], popular:false, duration:'90 minutes', minGuests:1, maxGuests:15, includes:'Mat, blocks, tea ceremony after session', insider_tip:'The flamingos in the salt flats behind you at sunrise is one of those Ibiza moments nobody expects.' },
  { id:'exp-003', category:'experiences', name:'Quad Bike Adventure Tour', subtitle:'3 hours · Guide included · Countryside & coves', description:"Explore Ibiza's stunning interior and hidden coves on a quad bike. Your guide leads you through countryside tracks, traditional villages and to secret swimming spots.", price:132, unit:'per person', emoji:'🏍️', partner:'Quad Ibiza', location:'San Antonio area, Ibiza', lat:38.9800, lng:1.3200, highlights:['Guide included','Hidden coves','Countryside tracks','Helmets provided'], popular:true, duration:'3 hours', minGuests:2, maxGuests:12, includes:'Quad bike, helmet, guide, fuel', insider_tip:'The route goes through Sant Agustí and down to a completely secret cove that has no road access.' },
  { id:'exp-004', category:'experiences', name:'Private Helicopter Tour', subtitle:'30 min · Island panorama · Unforgettable', description:'See Ibiza as very few do — from the air. A private helicopter tour circling the entire island, from the white villages of the north to the turquoise waters of Formentera.', price:770, unit:'per person (min 2)', emoji:'🚁', partner:'Helicopteros Insulares', location:'Ibiza Airport, Ibiza Town', lat:38.8730, lng:1.3730, highlights:['30-minute flight','Island panorama','Formentera views','Private charter'], popular:false, duration:'30 minutes', minGuests:2, maxGuests:5, includes:'Private flight, pilot, safety briefing', insider_tip:'Request the route over Es Vedrà at golden hour. It looks like a film set — completely surreal.' },
  { id:'exp-005', category:'experiences', name:'Dalt Vila Guided Night Tour', subtitle:'2 hours · UNESCO heritage · Private guide', description:"Discover the magic of Ibiza's ancient walled city after dark. Your private guide reveals the history, secrets and legends of Dalt Vila under the stars.", price:77, unit:'per person', emoji:'🏰', partner:'Ibiza Culture Tours', location:'Dalt Vila, Ibiza Town', lat:38.9074, lng:1.4312, highlights:['UNESCO World Heritage','Private guide','Evening setting','History & culture'], popular:false, duration:'2 hours', minGuests:2, maxGuests:10, includes:'Private guide, historical notes, welcome drink', insider_tip:'The guide knows tunnels and viewpoints not on any map. Finish at Croissant Show for the best churros.' },
  // CLUBS
  { id:'club-001', category:'clubs', name:'Pacha Ibiza — Entry', subtitle:'The original icon · Ibiza Town', description:"The club that defined Ibiza. Founded in 1973, Pacha remains the most iconic and beloved nightclub in the world. Multiple rooms, world-class residencies and an atmosphere that is completely its own.", price:110, unit:'per person', emoji:'🍒', partner:'Pacha Ibiza', location:'Passeig de Joan Carles I, Ibiza Town', lat:38.9054, lng:1.4380, highlights:['Icon since 1973','World-class residencies','Multiple rooms','VIP tables available'], popular:true, duration:'All night', openingHours:'midnight-06:00', bookingTimes:['23:00','00:00','01:00','02:00','03:00'], minGuests:1, maxGuests:20, includes:'Entry ticket', insider_tip:'Arrive after 1am when the energy peaks. Friday Flower Power nights are legendary.' },
  { id:'club-002', category:'clubs', name:'Ushuaia — Open-air Show', subtitle:'Open-air superclub · Playa den Bossa', description:"The world's biggest open-air club. Featuring a giant pool, an enormous production stage and the biggest DJ names in the world performing in the Ibiza sunshine.", price:143, unit:'per person', emoji:'🌴', partner:'Ushuaia Entertainment', location:"Playa d'en Bossa, Sant Josep", lat:38.8837, lng:1.4012, highlights:["World's biggest open-air club",'Giant pool stage','Top DJ residencies','Afternoon shows'], popular:true, duration:'Evening show', openingHours:'18:00-00:00', bookingTimes:['17:00','18:00','19:00','20:00','21:00'], minGuests:1, maxGuests:20, includes:'Entry ticket', insider_tip:'Shows run afternoon to midnight. Buy well in advance — the biggest shows sell out weeks ahead.' },
  { id:'club-003', category:'clubs', name:'Hi Ibiza — Entry Ticket', subtitle:'Most modern superclub · Playa den Bossa', description:"Ibiza's most technically advanced club. A stunning LED light art installation, two exceptional rooms and the finest sound system on the island. Consistently ranked top 10 in the world.", price:99, unit:'per person', emoji:'⚡', partner:'Hi Ibiza', location:"Platja d'en Bossa, Sant Josep", lat:38.8831, lng:1.4008, highlights:['LED light installation','Theatre & Club rooms','Best sound system','Top 10 world club'], popular:true, duration:'All night', openingHours:'midnight-06:00', bookingTimes:['23:00','00:00','01:00','02:00','03:00'], minGuests:1, maxGuests:20, includes:'Entry ticket', insider_tip:'The Club room has the most extraordinary production. Eric Prydz and Bicep residencies are essential.' },
  { id:'club-004', category:'clubs', name:'Amnesia Ibiza — Entry', subtitle:'Legendary superclub · San Rafael', description:'A true Ibiza legend. Two enormous rooms — the Main Room and the iconic open-air Terrace — hosting the best names in house and techno all summer long.', price:88, unit:'per person', emoji:'🎊', partner:'Amnesia', location:'Ctra. Ibiza a San Antonio, San Rafael', lat:38.9390, lng:1.3960, highlights:['Iconic Foam Party','Two massive dance floors','Terrace & Club Room','Techno & house legends'], popular:true, duration:'All night', openingHours:'midnight-06:00', bookingTimes:['23:00','00:00','01:00','02:00','03:00'], minGuests:1, maxGuests:20, includes:'Entry ticket', insider_tip:'The Terrace room is the soul of Amnesia. Tuesday Foam Party nights are a rite of passage.' },
  { id:'club-005', category:'clubs', name:'DC-10 — Entry Ticket', subtitle:'Underground legend · Airport road', description:'The most credible underground club in Ibiza. Right by the runway, DC-10 is raw, unpolished and completely authentic. Circoloco Mondays have been running for over 20 years.', price:60, unit:'per person', emoji:'✈️', partner:'DC-10', location:'Cami de sa Fita, Sant Josep', lat:38.8920, lng:1.3760, highlights:['Original underground club','Circoloco Mondays','Terrace under the planes','Techno & deep house'], popular:true, duration:'All night', openingHours:'15:00-23:00 Mon/Fri', bookingTimes:['14:00','15:00','16:00','17:00','18:00'], minGuests:1, maxGuests:10, includes:'Entry ticket', insider_tip:'Circoloco on Mondays is the most legendary party in Ibiza. Doors at 3pm — arrive at 4pm.' },
  { id:'club-006', category:'clubs', name:'UNVRS Ibiza — Entry', subtitle:'New hyperclub · 10,000 capacity · San Rafael', description:"UNVRS is Ibiza's newest and most ambitious venue. 10,000 capacity, a futuristic light tunnel entrance and a production budget unlike anything seen before.", price:80, unit:'per person', emoji:'🌌', partner:'UNVRS', location:'Urbanizacion San Rafael, Ibiza', lat:38.9380, lng:1.3970, highlights:['10,000 capacity','Futuristic light tunnel','Grand opening 2025','Futuristic production'], popular:true, duration:'All night', openingHours:'midnight-06:00', bookingTimes:['23:00','00:00','01:00','02:00','03:00'], minGuests:1, maxGuests:20, includes:'Entry ticket', insider_tip:'The VIP tickets at €500 include full table service — worth it for the light tunnel alone.' },
  { id:'club-007', category:'clubs', name:'Cova Santa — Dinner & Party', subtitle:'Natural cave venue · San Jose hills', description:"Set inside a spectacular natural cave in the Ibiza countryside, Cova Santa combines an elevated dinner show with an outdoor party under the stars. Completely unlike anything else on the island.", price:130, unit:'per person', emoji:'🌿', partner:'Cova Santa', location:'Ctra San Jose, Ibiza', lat:38.9120, lng:1.3560, highlights:['Natural cave setting','Elevated dinner show','Outdoor party under stars','Unique venue'], popular:true, duration:'Evening', openingHours:'19:00-02:00', bookingTimes:['19:00','20:00','21:00','22:00','23:00'], minGuests:2, maxGuests:10, includes:'Entry, dinner show access', insider_tip:'Dinner inside the cave first, then party outside. Unlike anything else in Ibiza — a guaranteed highlight.' },
  { id:'club-008', category:'clubs', name:'Lio Ibiza — Cabaret Show', subtitle:'Upscale cabaret · Ibiza Town marina', description:"The most glamorous night out in Ibiza Town. Acrobatic cabaret performers, spectacular marina views, strict dress code and a level of sophistication that stands entirely apart from the clubs.", price:200, unit:'per person', emoji:'🎭', partner:'Lio', location:'Marina Botafoch, Ibiza Town', lat:38.9060, lng:1.4400, highlights:['Marina views','Acrobatic cabaret','Dress code enforced','Most glamorous venue'], popular:true, duration:'Evening', openingHours:'20:00-03:00', bookingTimes:['20:00','21:00','22:00'], minGuests:2, maxGuests:10, includes:'Entry, show access, welcome drink', insider_tip:'Book the dinner package. The show begins at midnight — the food and atmosphere beforehand are exceptional.' },
  { id:'club-014', category:'clubs', name:'Heart Ibiza — Show & Club', subtitle:'Ibiza Town · Art + Music + Gastronomy', description:'A collaboration between the El Bulli team and Cirque du Soleil creators. Heart is part restaurant, part art gallery, part club — a unique cultural experience that only exists in Ibiza.', price:165, unit:'per person', emoji:'❤️', partner:'Heart Ibiza', location:'Marina de Ibiza, Ibiza Town', lat:38.9052, lng:1.4418, highlights:['El Bulli team','Cirque du Soleil inspired','Art + music + food','Unique experience'], popular:true, duration:'20:00-04:00', openingHours:'20:00-04:00', bookingTimes:['20:00','21:00','22:00','23:00'], minGuests:1, maxGuests:10, includes:'Entry, show access', insider_tip:'Book the full dinner package — the show begins before midnight and the food is genuinely remarkable.' },
]

const CATEGORIES = [
  { key:'all', label:'All', emoji:'✨' },
  { key:'boats', label:'Boats & Yachts', emoji:'⛵' },
  { key:'villas', label:'Villas', emoji:'🏡' },
  { key:'clubs', label:'Club Tickets', emoji:'🎵' },
  { key:'vip', label:'VIP', emoji:'👑' },
  { key:'beach_clubs', label:'Beach Clubs', emoji:'🏖️' },
  { key:'restaurants', label:'Restaurants', emoji:'🍽️' },
  { key:'experiences', label:'Experiences', emoji:'🎯' },
]

const FEATURED = ['boat-004','vip-001','bc-001','rest-001','exp-004','club-007']

// ── AI: Design My Experience ──────────────────────────────────
async function designExperience(userPrompt, type) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No API key configured — add VITE_ANTHROPIC_API_KEY to Vercel')
  const serviceList = SERVICES.map(s=>s.id+'|'+s.name+'|€'+s.price+' '+s.unit).join('\n')
  const system = 'You are Isla, the definitive Ibiza concierge. Design perfect '+type+' itineraries with specific times and insider knowledge. Respond ONLY with valid JSON: {"title":"string","intro":"string","timeline":[{"time":"HH:MM","venue":"string","tip":"string","service_id":"optional"}],"isla_insight":"string","vibe_tags":["tag"]}'
  const message = 'Design the perfect Ibiza '+type+' for: '+userPrompt+'\n\nCatalogue:\n'+serviceList
  const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':apiKey},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1200,system,messages:[{role:'user',content:message}]})})
  if(!resp.ok){const e=await resp.text();throw new Error('API '+resp.status+': '+e.slice(0,120))}
  const data=await resp.json()
  const raw=data.content?.[0]?.text||''
  if(!raw) throw new Error('Empty response')
  try{return JSON.parse(raw.replace(/```json|```/g,'').trim())}
  catch{return{title:'Your Ibiza '+type,intro:raw,timeline:[],isla_insight:'',vibe_tags:[]}}
}

// ── Featured Hero Carousel ────────────────────────────────────
function HeroCarousel({ services, onBook, photos }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(i=>(i+1)%services.length), 5000)
    return () => clearInterval(timerRef.current)
  }, [services.length])

  const s = services[idx]
  if (!s) return null
  const photoUrl = photos[s.id] || CATEGORY_PHOTOS[s.category] || CATEGORY_PHOTOS.experiences

  return (
    <div style={{ margin:'0 0 4px', position:'relative', height:240, overflow:'hidden' }}>
      <img src={photoUrl} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        onError={e=>{ e.target.src = CATEGORY_PHOTOS[s.category] || CATEGORY_PHOTOS.experiences }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,30,40,0.95) 0%,rgba(10,30,40,0.4) 55%,rgba(10,30,40,0.1) 100%)' }}/>

      {/* Content */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
          <div style={{ flex:1 }}>
            {s.popular && <div style={{ display:'inline-block', background:'rgba(196,104,58,0.9)', color:'white', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, marginBottom:6, letterSpacing:'0.5px' }}>FEATURED</div>}
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white', lineHeight:1.2, marginBottom:4 }}>{s.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginBottom:10 }}>{s.subtitle}</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:18, fontWeight:700, color:'#E8A070' }}>€{s.price.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{s.unit}</div>
            </div>
          </div>
          <button onClick={()=>onBook(s)}
            style={{ padding:'10px 18px', background:'#C4683A', border:'none', borderRadius:12, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans, flexShrink:0, boxShadow:'0 4px 16px rgba(196,104,58,0.5)' }}>
            Book now
          </button>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position:'absolute', top:14, right:16, display:'flex', gap:5 }}>
        {services.map((_, i) => (
          <button key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?20:6, height:6, borderRadius:99, background:i===idx?'white':'rgba(255,255,255,0.35)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }}/>
        ))}
      </div>
    </div>
  )
}

// ── Concierge team intro card ─────────────────────────────────
function ConciergeTeamCard() {
  return (
    <div style={{ margin:'16px 16px 0', background:'linear-gradient(135deg,rgba(200,168,75,0.12),rgba(43,122,139,0.15))', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:18, padding:'18px 20px', display:'flex', gap:16, alignItems:'flex-start' }}>
      <div style={{ fontSize:40, flexShrink:0, lineHeight:1 }}>🌴</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:4 }}>Your Isla concierge team</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:14 }}>Available 24 hours a day throughout the Ibiza season. Every booking is personally managed — we confirm within 2 hours and stay in touch from start to finish.</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>window.open('https://wa.me/34971000000?text=Hi%20Isla%20Concierge%20team%20%E2%80%94%20I%20need%20help%20planning%20my%20Ibiza%20experience','_blank')}
            style={{ flex:1, padding:'10px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.35)', borderRadius:10, color:'#25D366', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            💬 WhatsApp us
          </button>
          <button onClick={()=>window.open('mailto:concierge@isladrop.net','_blank')}
            style={{ flex:1, padding:'10px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer', fontFamily:F.sans }}>
            ✉️ Email us
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Service Card (world-class) ────────────────────────────────
function ServiceCard({ service, onBook, onDirections, photos }) {
  const [expanded, setExpanded] = useState(false)
  const photoUrl = photos[service.id] || CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.experiences
  const enquiries = Math.floor(Math.random() * 18) + 4 // social proof

  return (
    <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:20, overflow:'hidden', marginBottom:16 }}>
      {/* Hero photo */}
      <div style={{ height:180, position:'relative', overflow:'hidden' }}>
        <img src={photoUrl} alt={service.name}
          onError={e=>{ e.target.src = CATEGORY_PHOTOS[service.category] || CATEGORY_PHOTOS.experiences }}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(13,53,69,0.9) 0%,transparent 60%)' }}/>
        {service.popular && (
          <div style={{ position:'absolute', top:12, left:12, background:'rgba(196,104,58,0.92)', color:'white', fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:'0.5px', backdropFilter:'blur(4px)' }}>POPULAR</div>
        )}
        <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', borderRadius:20, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#7EE8A2' }}/>
          <span style={{ fontSize:10, color:'white', fontWeight:500 }}>{enquiries} enquiries this week</span>
        </div>
        {/* Price overlay */}
        <div style={{ position:'absolute', bottom:12, left:16 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:F.serif }}>€{service.price.toLocaleString()}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{service.unit}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <div style={{ flex:1, marginRight:10 }}>
            <div style={{ fontFamily:F.serif, fontSize:18, color:'white', lineHeight:1.2, marginBottom:3 }}>{service.name}</div>
            <div style={{ fontSize:11, color:C.muted }}>{service.subtitle}</div>
          </div>
          <div style={{ fontSize:24, flexShrink:0 }}>{service.emoji}</div>
        </div>

        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.65, marginBottom:12 }}>
          {expanded ? service.description : (service.description||'').slice(0,110)+'...'}
          {(service.description||'').length > 110 && (
            <button onClick={()=>setExpanded(e=>!e)} style={{ background:'none', border:'none', color:'rgba(196,104,58,0.8)', cursor:'pointer', fontSize:12, fontFamily:F.sans, padding:0, marginLeft:4 }}>
              {expanded?'Less':'More'}
            </button>
          )}
        </div>

        {/* Highlights */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {service.highlights.map(h=>(
            <span key={h} style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:99, padding:'3px 10px', fontSize:11, color:'rgba(255,255,255,0.7)' }}>{h}</span>
          ))}
        </div>

        {/* What's included */}
        {service.includes && (
          <div style={{ background:'rgba(126,232,162,0.07)', border:'0.5px solid rgba(126,232,162,0.2)', borderRadius:10, padding:'9px 12px', marginBottom:12, fontSize:11, color:'rgba(255,255,255,0.6)', display:'flex', gap:7, alignItems:'flex-start' }}>
            <span style={{ flexShrink:0 }}>✓</span>
            <span><strong style={{ color:'rgba(255,255,255,0.8)' }}>Included:</strong> {service.includes}</span>
          </div>
        )}

        {/* Insider tip */}
        {service.insider_tip && (
          <div style={{ background:'rgba(200,168,75,0.08)', border:'0.5px solid rgba(200,168,75,0.25)', borderRadius:10, padding:'10px 12px', marginBottom:14, display:'flex', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>🌴</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.gold, letterSpacing:'0.5px', marginBottom:3 }}>ISLA INSIDER</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>{service.insider_tip}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>window.open('https://wa.me/34971000000?text=Hi%2C%20I%20am%20interested%20in%20booking%20'+encodeURIComponent(service.name)+'.%20Can%20you%20help%3F','_blank')}
            style={{ padding:'10px 14px', background:'rgba(37,211,102,0.12)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:10, color:'#25D366', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:5 }}>
            💬 Ask
          </button>
          <button onClick={()=>onDirections(service)}
            style={{ padding:'10px 14px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:12, cursor:'pointer', fontFamily:F.sans, display:'flex', alignItems:'center', gap:5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Map
          </button>
          <button onClick={()=>onBook(service)}
            style={{ flex:1, padding:'10px 16px', background:'#C4683A', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 2px 12px rgba(196,104,58,0.35)' }}>
            Book now →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Booking modal ─────────────────────────────────────────────
function BookingModal({ service, onClose, onBook }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState(service.bookingTimes?.[0]||'18:00')
  const [guests, setGuests] = useState(service.minGuests||1)
  const [notes, setNotes] = useState('')
  const total = service.price * (service.unit.includes('person') ? guests : 1)
  const minDate = new Date(); minDate.setDate(minDate.getDate()+1)
  const minDateStr = minDate.toISOString().split('T')[0]
  const inp = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, fontFamily:F.sans, fontSize:14, color:'white', outline:'none', boxSizing:'border-box', marginBottom:14 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:'22px 22px 0 0', padding:'24px 20px 44px', width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 22px' }}/>

        {/* Service header */}
        <div style={{ height:120, borderRadius:14, overflow:'hidden', marginBottom:18, position:'relative' }}>
          <img src={CATEGORY_PHOTOS[service.category]} alt={service.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{ position:'absolute', inset:0, background:'rgba(10,30,40,0.55)' }}/>
          <div style={{ position:'absolute', bottom:14, left:16, right:16 }}>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white', lineHeight:1.2 }}>{service.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{service.partner} · {service.location}</div>
          </div>
        </div>

        <div style={{ fontSize:13, color:C.muted, marginBottom:6 }}>Select date</div>
        <input type="date" value={date} min={minDateStr} onChange={e=>setDate(e.target.value)} style={{ ...inp, colorScheme:'dark' }} />

        <div style={{ fontSize:13, color:C.muted, marginBottom:10 }}>Preferred time</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:18 }}>
          {(service.bookingTimes||['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00']).map(slot=>(
            <button key={slot} onClick={()=>setTime(slot)}
              style={{ padding:'8px 14px', borderRadius:20, fontSize:12, border:'0.5px solid '+(time===slot?C.accent:'rgba(255,255,255,0.18)'), background:time===slot?'rgba(196,104,58,0.25)':'rgba(255,255,255,0.06)', color:time===slot?'#E8A070':'rgba(255,255,255,0.75)', cursor:'pointer', fontFamily:F.sans, fontWeight:time===slot?600:400 }}>
              {slot}
            </button>
          ))}
        </div>

        {service.unit.includes('person') && service.maxGuests>1 && (
          <>
            <div style={{ fontSize:13, color:C.muted, marginBottom:10 }}>Number of guests</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
              <button onClick={()=>setGuests(Math.max(service.minGuests,guests-1))} style={{ width:40, height:40, background:C.surfaceB, border:'none', borderRadius:'50%', color:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>-</button>
              <span style={{ fontSize:22, fontWeight:700, color:'white', minWidth:36, textAlign:'center' }}>{guests}</span>
              <button onClick={()=>setGuests(Math.min(service.maxGuests,guests+1))} style={{ width:40, height:40, background:C.surfaceB, border:'none', borderRadius:'50%', color:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              <span style={{ fontSize:12, color:C.muted }}>{service.minGuests}–{service.maxGuests} guests</span>
            </div>
          </>
        )}

        <div style={{ fontSize:13, color:C.muted, marginBottom:6 }}>Special requests (optional)</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Dietary requirements, occasions, any special needs..."
          rows={3} style={{ ...inp, resize:'none', lineHeight:1.55 }} />

        {/* Price summary */}
        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:6 }}>
            <span>{service.name}</span>
            <span>€{service.price.toLocaleString()} {service.unit.includes('person')?'x '+guests:''}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:10 }}>
            <span>Isla concierge (included)</span><span>€0</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:17, fontWeight:700, color:'white', borderTop:'0.5px solid rgba(255,255,255,0.1)', paddingTop:10 }}>
            <span>Total</span>
            <span style={{ color:'#E8A070' }}>€{total.toLocaleString()}</span>
          </div>
        </div>

        <button onClick={()=>{ if(!date){toast.error('Please select a date');return} onBook({service,date,time,guests,notes,total}) }}
          style={{ width:'100%', padding:'16px', background:'#C4683A', border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, boxShadow:'0 4px 20px rgba(196,104,58,0.4)', marginBottom:10 }}>
          Request booking →
        </button>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
          Confirmed within 2 hours · concierge@isladrop.net
        </div>
      </div>
    </div>
  )
}

// ── Directions modal ──────────────────────────────────────────
function DirectionsModal({ service, onClose }) {
  const dest = service.lat+','+service.lng
  const name = encodeURIComponent(service.location)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'linear-gradient(170deg,#0D3545,#1A5060)', borderRadius:'22px 22px 0 0', padding:'24px 20px 44px', width:'100%', maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 20px' }}/>
        <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:4 }}>Get directions</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>📍 {service.location}</div>
        <button onClick={()=>{window.open('https://www.google.com/maps/dir/?api=1&destination='+dest+'&destination_place_id='+name,'_blank');onClose()}}
          style={{ width:'100%', padding:'14px', background:'#4285F4', color:'white', border:'none', borderRadius:12, fontFamily:F.sans, fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Google Maps
        </button>
        <button onClick={()=>{window.open('https://maps.apple.com/?daddr='+dest+'&dirflg=d','_blank');onClose()}}
          style={{ width:'100%', padding:'14px', background:'rgba(255,255,255,0.1)', color:'white', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:12, fontFamily:F.sans, fontSize:14, fontWeight:500, cursor:'pointer' }}>
          Apple Maps
        </button>
      </div>
    </div>
  )
}

// ── AI Design My Experience panel ─────────────────────────────
function DesignExperiencePanel({ onBook }) {
  const [mode, setMode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [startTime, setStartTime] = useState('')

  const QUICK_DAY = ['Romantic couple day','Group of 8 friends','Family with children','Solo luxury escape','Birthday celebration','Pool party day','Beach club day']
  const QUICK_NIGHT = ['VIP club night','Ladies night out','Boys night out',"Gentleman's evening",'Birthday night out','Intimate dinner','Sunset to sunrise']

  const generate = async (p) => {
    const tc = startTime?' Starting at '+startTime+'.':''
    const fp = mode==='day'
      ? 'Design the perfect Ibiza day for: '+(p||prompt)+tc+'. Be specific about times, venues and Ibiza knowledge. Include beach clubs, restaurants, boat trips where relevant.'
      : 'Design the perfect Ibiza night for: '+(p||prompt)+'. Start from sunset. Give specific arrival times and insider tips on when clubs peak. Never suggest empty venues.'
    setLoading(true); setResult(null)
    try { const r = await designExperience(fp, mode); setResult(r) }
    catch(err) { setResult({ title:'', text:err.message.includes('No API key')?'AI requires VITE_ANTHROPIC_API_KEY in Vercel settings.':'Could not generate right now ('+err.message+'). Please try again.', timeline:[], isla_insight:'', vibe_tags:[] }) }
    setLoading(false)
  }

  if (!mode) return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, padding:20, marginBottom:20 }}>
      <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:4 }}>Design Your Experience</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:18 }}>Tell Isla your group and occasion — she will plan the perfect Ibiza itinerary</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button onClick={()=>setMode('day')} style={{ padding:'18px 14px', background:'linear-gradient(135deg,rgba(200,168,75,0.2),rgba(43,122,139,0.2))', border:'0.5px solid rgba(200,168,75,0.3)', borderRadius:16, cursor:'pointer', textAlign:'left' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>☀️</div>
          <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:3 }}>Design My Day</div>
          <div style={{ fontSize:11, color:C.muted }}>Boats, beaches, restaurants</div>
          <div style={{ marginTop:10, fontSize:11, color:C.gold, fontWeight:600 }}>AI-powered →</div>
        </button>
        <button onClick={()=>setMode('night')} style={{ padding:'18px 14px', background:'linear-gradient(135deg,rgba(196,104,58,0.25),rgba(80,20,100,0.3))', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:16, cursor:'pointer', textAlign:'left' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🌙</div>
          <div style={{ fontFamily:F.serif, fontSize:16, color:'white', marginBottom:3 }}>Design My Night</div>
          <div style={{ fontSize:11, color:C.muted }}>Dinner, clubs, VIP</div>
          <div style={{ marginTop:10, fontSize:11, color:'#E8A070', fontWeight:600 }}>AI-powered →</div>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, padding:20, marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={()=>{setMode(null);setResult(null);setPrompt('')}} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:0, lineHeight:1 }}>←</button>
        <div style={{ fontFamily:F.serif, fontSize:18, color:'white' }}>{mode==='day'?'☀️ Design My Day':'🌙 Design My Night'}</div>
      </div>

      {!result && !loading && (
        <>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
            {(mode==='day'?QUICK_DAY:QUICK_NIGHT).map(q=>(
              <button key={q} onClick={()=>generate(q)} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.8)', cursor:'pointer', fontFamily:F.sans }}>
                {q}
              </button>
            ))}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Start time (optional)</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
            {(mode==='day'?['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']:['18:00','19:00','20:00','21:00','22:00','23:00','00:00']).map(s=>(
              <button key={s} onClick={()=>setStartTime(startTime===s?'':s)}
                style={{ padding:'6px 12px', borderRadius:20, fontSize:11, border:'0.5px solid '+(startTime===s?C.accent:'rgba(255,255,255,0.18)'), background:startTime===s?'rgba(196,104,58,0.25)':'rgba(255,255,255,0.05)', color:startTime===s?'#E8A070':'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:F.sans, fontWeight:startTime===s?600:400 }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generate()}
              placeholder="Describe your group, occasion or vibe..."
              style={{ flex:1, padding:'12px 16px', background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:24, color:'white', fontSize:13, fontFamily:F.sans, outline:'none' }}/>
            <button onClick={()=>generate()} disabled={!prompt.trim()}
              style={{ width:44, height:44, background:prompt.trim()?C.accent:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', cursor:prompt.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.15)', borderTopColor:C.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
          <div style={{ fontFamily:F.serif, fontSize:18, color:'white', marginBottom:6 }}>Isla is planning your experience...</div>
          <div style={{ fontSize:13, color:C.muted }}>Drawing on local knowledge to create your perfect itinerary</div>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}

      {result && (
        <>
          {result.text ? (
            <div style={{ padding:'16px', background:'rgba(240,149,149,0.1)', border:'0.5px solid rgba(240,149,149,0.3)', borderRadius:12, fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{result.text}</div>
          ) : (
            <>
              {result.vibe_tags?.length>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                  {result.vibe_tags.map(tag=>(
                    <span key={tag} style={{ background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.35)', borderRadius:99, padding:'3px 12px', fontSize:11, color:'#E8A070', fontWeight:500 }}>{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:8 }}>{result.title}</div>
              {result.intro && <div style={{ fontSize:13, color:C.muted, lineHeight:1.65, marginBottom:18 }}>{result.intro}</div>}
              {result.timeline?.length>0 && (
                <div style={{ marginBottom:16 }}>
                  {result.timeline.map((item,i)=>{
                    const linked = item.service_id ? SERVICES.find(s=>s.id===item.service_id) : null
                    return (
                      <div key={i} style={{ display:'flex', gap:14, marginBottom:16, position:'relative' }}>
                        <div style={{ flexShrink:0, width:48, textAlign:'right' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:C.gold }}>{item.time}</div>
                        </div>
                        <div style={{ width:1, background:'rgba(255,255,255,0.1)', flexShrink:0, position:'relative' }}>
                          <div style={{ position:'absolute', top:4, left:-4, width:9, height:9, borderRadius:'50%', background:C.accent, border:'2px solid #0D3545' }}/>
                        </div>
                        <div style={{ flex:1, paddingBottom:4 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:F.sans, marginBottom:3 }}>{item.venue}</div>
                          {item.tip && <div style={{ fontSize:12, color:C.muted, lineHeight:1.55 }}>{item.tip}</div>}
                          {linked && (
                            <button onClick={()=>onBook(linked)}
                              style={{ marginTop:8, padding:'6px 14px', background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:99, color:'#E8A070', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F.sans }}>
                              Book {linked.name} from €{linked.price.toLocaleString()} →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {result.isla_insight && (
                <div style={{ background:'rgba(200,168,75,0.08)', border:'0.5px solid rgba(200,168,75,0.25)', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', gap:8 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>🌴</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.gold, letterSpacing:'0.5px', marginBottom:3 }}>ISLA INSIGHT</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>{result.isla_insight}</div>
                  </div>
                </div>
              )}
            </>
          )}
          <button onClick={()=>{setResult(null);setPrompt('');setStartTime('')}} style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:F.sans, marginTop:8 }}>
            Generate another experience
          </button>
        </>
      )}
    </div>
  )
}

// ── Booking confirmation screen ───────────────────────────────
function BookingConfirmed({ booking, onContinue, onBack }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:F.serif, fontSize:28, color:'white', marginBottom:8 }}>Request sent!</div>
        <div style={{ fontSize:15, color:C.muted, lineHeight:1.65, marginBottom:28 }}>
          Your booking request for <strong style={{ color:'white' }}>{booking.service.name}</strong> on {new Date(booking.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})} has been received.
        </div>
        <div style={{ background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:18, padding:'20px', marginBottom:24, textAlign:'left' }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>Booking summary</div>
          {[['Service',booking.service.name],['Date',new Date(booking.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})],['Time',booking.time],['Guests',booking.guests+' guest'+(booking.guests!==1?'s':'')],['Total','€'+booking.total.toLocaleString()]].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
              <span style={{ color:C.muted }}>{l}</span>
              <span style={{ color:'white', fontWeight:l==='Total'?700:400 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(37,211,102,0.1)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:24, fontSize:12, color:'#7EE8A2', lineHeight:1.6 }}>
          Our concierge team will confirm within 2 hours via WhatsApp and email. If you need to speak with us now: <strong>+34 971 000 000</strong>
        </div>
        <button onClick={onContinue} style={{ width:'100%', padding:'15px', background:C.accent, border:'none', borderRadius:14, color:'white', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:F.sans, marginBottom:10 }}>
          Browse more experiences
        </button>
        <button onClick={onBack} style={{ width:'100%', padding:'13px', background:'none', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:14, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:F.sans }}>
          Back to home
        </button>
      </div>
    </div>
  )
}

// ── Main Concierge export ─────────────────────────────────────
export default function Concierge({ onBack }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [bookingService, setBookingService] = useState(null)
  const [directionsService, setDirectionsService] = useState(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(null)
  const photos = useServicePhotos()

  const featured = FEATURED.map(id=>SERVICES.find(s=>s.id===id)).filter(Boolean)

  const filtered = SERVICES.filter(s => {
    const matchCat = activeCategory==='all' || s.category===activeCategory
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.subtitle.toLowerCase().includes(search.toLowerCase()) || s.partner.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleConfirmBooking = async ({ service, date, time, guests, notes, total }) => {
    setBookingService(null)
    toast.loading('Processing your booking...', { id:'booking' })
    try {
      let customerEmail = 'guest@isladrop.net', customerName = 'Guest', customerId = null
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data:{ user } } = await supabase.auth.getUser()
        if (user) {
          customerEmail = user.email; customerId = user.id
          const { data:profile } = await supabase.from('profiles').select('full_name').eq('id',user.id).single()
          if (profile?.full_name) customerName = profile.full_name
        }
      } catch {}
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(supabaseUrl+'/functions/v1/process-concierge-booking', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+supabaseKey },
        body: JSON.stringify({ type:'new_booking', booking:{ customer_email:customerEmail, customer_name:customerName, customer_id:customerId, service_id:service.id, service_name:service.name, service_category:service.category, partner:service.partner, location:service.location, lat:service.lat, lng:service.lng, date, time, guests, notes, price:service.price, total } })
      })
      const result = await res.json().catch(()=>({ success:false }))
      toast.dismiss('booking')
      if (result?.instantly_confirmed) toast.success('Booking instantly confirmed!', { duration:5000 })
      else toast.success('Request sent — confirming within 2 hours', { duration:4000 })
    } catch {
      toast.dismiss('booking')
    }
    setBookingConfirmed({ service, date, time, guests, notes, total, bookingRef:'CB-'+Date.now().toString(36).toUpperCase() })
  }

  if (bookingConfirmed) return (
    <BookingConfirmed booking={bookingConfirmed} onContinue={()=>setBookingConfirmed(null)} onBack={onBack} />
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:100 }}>
      {/* Sticky header */}
      <div style={{ background:C.header, padding:'16px 16px 14px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={onBack} style={{ width:36,height:36,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.serif, fontSize:22, color:'white', lineHeight:1 }}>Isla Concierge</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Luxury experiences · Ibiza</div>
          </div>
          <button onClick={()=>window.open('https://wa.me/34971000000?text=Hi%20Isla%20Concierge%20team','_blank')}
            style={{ padding:'8px 14px', background:'rgba(37,211,102,0.15)', border:'0.5px solid rgba(37,211,102,0.3)', borderRadius:20, color:'#25D366', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F.sans, flexShrink:0 }}>
            💬 Chat
          </button>
        </div>

        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.09)', borderRadius:12, padding:'9px 14px', gap:8, marginBottom:12, border:'0.5px solid rgba(255,255,255,0.1)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search experiences, venues, partners..."
            style={{ flex:1, background:'none', border:'none', color:'white', fontSize:13, fontFamily:F.sans, outline:'none' }}/>
          {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16, padding:0 }}>✕</button>}
        </div>

        {/* Category pills */}
        <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
          {CATEGORIES.map(cat=>(
            <button key={cat.key} onClick={()=>setActiveCategory(cat.key)}
              style={{ padding:'7px 14px', borderRadius:20, fontSize:12, background:activeCategory===cat.key?'rgba(255,255,255,0.92)':'rgba(255,255,255,0.1)', color:activeCategory===cat.key?'#0D3B4A':'white', border:'none', cursor:'pointer', fontFamily:F.sans, fontWeight:activeCategory===cat.key?500:400, whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s' }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero carousel — only on All tab with no search */}
      {activeCategory==='all' && !search && (
        <HeroCarousel services={featured} onBook={setBookingService} photos={photos} />
      )}

      <div style={{ padding:'0 16px' }}>
        {/* Team card — top of all/no-search */}
        {activeCategory==='all' && !search && <ConciergeTeamCard />}

        {/* AI panel */}
        {activeCategory==='all' && !search && (
          <div style={{ marginTop:20 }}>
            <DesignExperiencePanel onBook={setBookingService} />
          </div>
        )}

        {/* Section header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, marginBottom:14 }}>
          <div style={{ fontFamily:F.serif, fontSize:22, color:'white' }}>
            {search ? '"'+search+'"' : activeCategory==='all' ? 'All experiences' : CATEGORIES.find(c=>c.key===activeCategory)?.label}
          </div>
          <div style={{ fontSize:12, color:C.muted }}>{filtered.length} available</div>
        </div>

        {filtered.length===0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <div style={{ fontFamily:F.serif, fontSize:20, color:'white', marginBottom:6 }}>Nothing found</div>
            <div style={{ fontSize:13 }}>Try a different search or category</div>
          </div>
        )}

        {filtered.map(service=>(
          <ServiceCard key={service.id} service={service} onBook={setBookingService} onDirections={setDirectionsService} photos={photos} />
        ))}
      </div>

      {bookingService && <BookingModal service={bookingService} onClose={()=>setBookingService(null)} onBook={handleConfirmBooking} />}
      {directionsService && <DirectionsModal service={directionsService} onClose={()=>setDirectionsService(null)} />}
    </div>
  )
}
