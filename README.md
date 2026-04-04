    # 🍾 Isla Drop — Ibiza 24/7 Beverage Delivery App

A full-stack, production-ready delivery app built for 24/7 alcohol and beverage distribution on the island of Ibiza. Three apps in one codebase: **Customer**, **Driver**, and **Ops Dashboard**.

---

## 📱 What's Included

| App | Who Uses It | Key Features |
|-----|-------------|--------------|
| **Customer App** | Guests, tourists, villa renters | Browse catalogue, pinpoint map drop, age verification, Stripe payment, live order tracking |
| **Driver App** | Delivery riders | GPS tracking, order queue, accept/decline, step-by-step delivery flow, navigation link |
| **Ops Dashboard** | Your operations team | Live fleet map, order management, driver statuses, KPI header, alerts panel |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Customer, Driver & Ops UIs |
| Database | Supabase (PostgreSQL + PostGIS) | Orders, users, products, geo queries |
| Realtime | Supabase Realtime | Live order & driver location updates |
| Auth | Supabase Auth | Customer / Driver / Ops role-based login |
| Payments | Stripe | Card, Apple Pay, Google Pay |
| Maps | Mapbox GL JS | Pinpoint delivery drop, fleet map |
| ID Verification | Onfido | Age verification — document + facial |
| State | Zustand | Client-side cart, auth, driver state |
| Toasts | react-hot-toast | Order confirmations, errors |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd isla-drop
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all four services (instructions below):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

### 3. Set up the database

1. Go to your [Supabase dashboard](https://app.supabase.com) → SQL editor
2. Paste and run the entire contents of `supabase_schema.sql`
3. This creates all tables, RLS policies, and seeds 12 starter products

### 4. Deploy Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both functions
supabase functions deploy create-payment-intent
supabase functions deploy onfido-create-applicant
supabase functions deploy onfido-webhook
```

Edge function source code is embedded in `src/lib/stripe.js` and `src/lib/onfido.js` as exported constants — copy them into `supabase/functions/<name>/index.ts`.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Service Setup Guides

### Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → used only in Edge Functions as `SUPABASE_SERVICE_ROLE_KEY`
3. In **Database → Extensions**, enable `postgis`
4. Run `supabase_schema.sql` in the SQL editor
5. In **Realtime**, enable replication for: `orders`, `drivers`, `driver_locations`

### Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Go to **Developers → API keys**
3. Copy the **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy the **Secret key** → set as `STRIPE_SECRET_KEY` in your Supabase Edge Function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   ```
5. In Stripe dashboard, enable **Apple Pay** and **Google Pay** under Payment Methods
6. For production, set up a webhook pointing to your Supabase function URL

### Mapbox

1. Create an account at [mapbox.com](https://mapbox.com)
2. Go to **Tokens** and create a new token with:
   - `styles:read`
   - `tiles:read`
   - `geocoding:read`
3. Copy the token → `VITE_MAPBOX_TOKEN`
4. Add your production domain to the token's allowed URLs

### Onfido (Age & ID Verification)

1. Create an account at [onfido.com](https://onfido.com) (contact their sales team for EU licence)
2. Go to **Settings → API Tokens** and copy your token
3. Set it as a secret in Supabase:
   ```bash
   supabase secrets set ONFIDO_API_TOKEN=api_sandbox.YOUR_TOKEN
   ```
4. In the Onfido dashboard, set up a webhook pointing to:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/onfido-webhook
   ```
5. Start with sandbox mode for testing — use test document images from Onfido's docs
6. Switch to live mode before going to production

> **Fallback:** If Onfido is not yet configured, the app falls back gracefully — the driver is prompted to verify ID in person at delivery.

---

## 📂 Project Structure

```
isla-drop/
├── index.html                   # Entry HTML + Onfido SDK script tag
├── package.json
├── .env.example                 # All required env vars documented
├── supabase_schema.sql          # Complete DB schema — run this first
│
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Root: auth guard + role-based routing + tab bar
    ├── index.css                # Global styles + Google Fonts
    │
    ├── lib/
    │   ├── supabase.js          # Supabase client + all DB/realtime helpers
    │   ├── stripe.js            # Stripe loader + PaymentIntent helper + Edge Function code
    │   ├── onfido.js            # Onfido SDK init + Edge Function + Webhook code
    │   └── store.js             # Zustand stores: auth, cart, driver, ops
    │
    └── components/
        ├── customer/
        │   ├── CustomerApp.jsx  # Main customer screen: catalogue, cart, checkout, tracking
        │   ├── DeliveryMap.jsx  # Mapbox map with draggable pin + reverse geocoding
        │   ├── AgeVerification.jsx  # Onfido flow + DOB form
        │   └── StripeCheckout.jsx   # Stripe Elements payment form
        │
        ├── driver/
        │   └── DriverApp.jsx    # Order queue, GPS tracking, delivery status flow
        │
        ├── ops/
        │   └── OpsApp.jsx       # KPI header, live orders, fleet, Mapbox fleet map
        │
        └── shared/
            └── AuthScreen.jsx   # Sign in / Sign up with role selection
```

---

## 🗃 Database Schema Overview

```
profiles          → base user record (id, role, full_name, phone)
customers         → extends profiles (stripe_id, age_verified, onfido_check_id)
drivers           → extends profiles (is_online, current_location, rating)
products          → catalogue (name, category, price, emoji, stock)
orders            → order record with full delivery geo + status machine
order_items       → line items linking orders → products
driver_locations  → time-series GPS pings for fleet tracking
```

**Order status flow:**
```
pending → age_check → confirmed → preparing → assigned → picked_up → en_route → delivered
                                                                               ↘ cancelled
```

Row-Level Security is enabled on all tables. Customers can only see their own orders. Drivers can only see assigned orders. Ops role has full read access.

---

## 💳 Payment Flow

```
1. Customer fills cart + sets delivery pin
2. Age verification triggered (Onfido or DOB form)
3. Frontend calls Supabase Edge Function → Stripe PaymentIntent created server-side
4. Stripe Elements renders (card / Apple Pay / Google Pay)
5. Payment confirmed client-side
6. Order record created in Supabase with paymentIntentId
7. Order enters status machine → drivers notified via Realtime
```

---

## 🆔 Age Verification Flow

```
1. Customer enters name + DOB (client-side 18+ check)
2. Edge Function creates Onfido applicant + SDK token
3. Onfido Web SDK launches in-app (document photo + selfie)
4. Onfido webhook fires on check completion
5. Edge Function marks customers.age_verified = true
6. Any pending orders for that customer advance to 'confirmed'
7. Driver always performs secondary in-person ID check at delivery
```

---

## 🛵 Driver GPS Tracking

- `navigator.geolocation.watchPosition()` runs while driver is online
- Location pings every ~10 seconds to `driver_locations` table
- `drivers.current_location` (PostGIS Point) updated on each ping
- Ops fleet map subscribes to `driver_locations` via Supabase Realtime
- GPS watch is cleared when driver goes offline or closes the app

---

## 🚢 Deployment

### Frontend (Vercel — recommended)

```bash
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or any static host
vercel --prod
```

Set all `VITE_*` environment variables in your Vercel project settings.

### Supabase Edge Functions

```bash
supabase functions deploy create-payment-intent
supabase functions deploy onfido-create-applicant
supabase functions deploy onfido-webhook
```

### Custom domain

Point `app.isladrop.com` (or your domain) at your Vercel deployment. Update:
- Mapbox token allowed URLs
- Stripe webhook endpoint
- Onfido webhook URL
- Supabase allowed redirect URLs (Auth settings)

---

## 📋 Spanish Legal Requirements

Operating an alcohol delivery service in Ibiza (Illes Balears) requires:

- **Licencia de venta de bebidas alcohólicas** — obtained from the Consell Insular d'Eivissa
- **Minimum age**: 18 years (enforced via Onfido + driver in-person check)
- **No delivery to visibly intoxicated persons** — driver training required
- **Hours**: Some municipalities restrict delivery hours — check local ordinances
- **GDPR compliance**: User data processed under Spanish/EU law — add a privacy policy

> This app implements the technical age-verification infrastructure. You are responsible for obtaining the relevant trading licences before going live.

---

## 🧪 Testing

### Stripe test cards
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Decline |

Use any future expiry, any CVV, any postcode.

### Onfido sandbox
Use test document images from: https://documentation.onfido.com/#sandbox-testing

### Mapbox
The free tier includes 50,000 map loads/month — more than enough for early operations.

---

## 📞 Support & Next Steps

Once you're set up, logical next features to build:

1. **Push notifications** (Firebase FCM) — new order alerts for drivers
2. **WhatsApp order updates** (Twilio / WhatsApp Business API)
3. **Stock management** — low stock alerts, reorder triggers
4. **Surge pricing** — dynamic delivery fee based on demand + time of night
5. **Villa accounts** — pre-verified repeat customers (hotels, villas, clubs)
6. **Driver earnings reports** — weekly payout summaries
7. **Analytics dashboard** — revenue by product, peak hours heatmap

---

*Built for Isla Drop · Ibiza, Spain · © 2025*
