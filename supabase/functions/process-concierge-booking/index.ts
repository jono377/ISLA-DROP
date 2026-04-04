import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')!
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')!
const OPENTABLE_API_KEY    = Deno.env.get('OPENTABLE_API_KEY') || ''
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Booking method types ──────────────────────────────────────
type BookingMethod = 'opentable' | 'thefork' | 'bokun' | 'email' | 'manual'

interface BookingResult {
  method: BookingMethod
  success: boolean
  confirmed: boolean        // true = instant confirm, false = pending partner
  confirmationCode?: string
  partnerResponse?: string
  error?: string
}


// ── Stripe payment capture (called on confirmation) ───────────
async function capturePayment(bookingId: string, totalPrice: number, customerEmail: string, serviceName: string): Promise<string | null> {
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')
  if (!STRIPE_SECRET) { console.warn('No Stripe key — skipping payment capture'); return null }

  try {
    // 1. Find or create Stripe customer
    const customerSearch = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:"${customerEmail}"`,
      { headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` } }
    )
    const customerData = await customerSearch.json()
    let customerId = customerData.data?.[0]?.id

    if (!customerId) {
      const newCustomer = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: customerEmail, description: 'Isla Drop Concierge customer' }),
      })
      const nc = await newCustomer.json()
      customerId = nc.id
    }

    // 2. Create a PaymentIntent
    const amountCents = Math.round(totalPrice * 100)
    const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        amount: String(amountCents),
        currency: 'eur',
        customer: customerId,
        description: `Isla Drop Concierge: ${serviceName}`,
        metadata: JSON.stringify({ booking_id: bookingId, service: serviceName }),
        // In production, you'd use payment_method from customer's saved cards
        // or send a payment link to the customer to complete payment
        'payment_method_types[]': 'card',
      }),
    })
    const pi = await piRes.json()
    return pi.id || null
  } catch (err) {
    console.error('Stripe capture error:', err)
    return null
  }
}

// ── OpenTable restaurant IDs for Ibiza ────────────────────────
// These would be verified via the OpenTable restaurant search API
const OPENTABLE_IDS: Record<string, string> = {
  'rest-001': '1234567',   // La Gaia — to be verified
  'rest-002': '1234568',   // Nobu Ibiza Bay
  'rest-003': '1234569',   // Amante Ibiza
  'rest-004': '1234570',   // Blue Marlin restaurant
  'rest-005': '1234571',   // Atzaro
}

// TheFork restaurant IDs (TripAdvisor)
const THEFORK_IDS: Record<string, string> = {
  'rest-001': 'lagaia-ibiza',
  'rest-002': 'nobu-ibiza-bay',
  'rest-003': 'amante-ibiza',
}

// Bokun product IDs (activities/experiences)
const BOKUN_IDS: Record<string, string> = {
  'exp-002': 'yoga-ses-salines',
  'exp-003': 'quad-bike-ibiza',
  'exp-005': 'dalt-vila-tour',
}

// ── Email ─────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Isla Drop Concierge <concierge@isladrop.com>', to, subject, html }),
  })
  if (!res.ok) throw new Error(`Email failed: ${await res.text()}`)
  return res.json()
}

// ── OpenTable Booking ─────────────────────────────────────────
async function bookViaOpenTable(booking: any, restaurantId: string): Promise<BookingResult> {
  try {
    // OpenTable API v2 — create reservation
    const res = await fetch(`https://platform.otreservations.com/v2/restaurants/${restaurantId}/reservations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        date_time: `${booking.booking_date}T20:00:00`, // Default 8pm, customer can specify
        party_size: booking.guests,
        first_name: booking.customer_name.split(' ')[0],
        last_name: booking.customer_name.split(' ').slice(1).join(' ') || 'Guest',
        email: booking.customer_email,
        phone: booking.customer_phone || '',
        special_requests: booking.special_notes || `Booking via Isla Drop Concierge. Ref: ${booking.booking_ref}`,
        source: 'isla_drop_concierge',
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return {
        method: 'opentable',
        success: true,
        confirmed: true,
        confirmationCode: data.reservation_id || data.confirmation_number,
        partnerResponse: `OpenTable confirmation: ${data.reservation_id}`,
      }
    }

    // If specific time not available, try to find next available slot
    const errBody = await res.json().catch(() => ({}))
    if (res.status === 409 || errBody.error === 'not_available') {
      // Check availability for alternative times
      const availRes = await fetch(
        `https://platform.otreservations.com/v2/restaurants/${restaurantId}/availability?date=${booking.booking_date}&party_size=${booking.guests}`,
        { headers: { 'Authorization': `Bearer ${OPENTABLE_API_KEY}` } }
      )
      if (availRes.ok) {
        const avail = await availRes.json()
        const slots = avail.availability?.time_slots || []
        if (slots.length > 0) {
          return {
            method: 'opentable',
            success: false,
            confirmed: false,
            error: `Requested time unavailable. Available slots: ${slots.slice(0, 3).map((s: any) => s.time).join(', ')}`,
          }
        }
      }
      return { method: 'opentable', success: false, confirmed: false, error: 'No availability on this date' }
    }

    throw new Error(`OpenTable error: ${res.status}`)
  } catch (err) {
    console.error('OpenTable booking failed:', err)
    return { method: 'opentable', success: false, confirmed: false, error: String(err) }
  }
}

// ── TheFork Booking ───────────────────────────────────────────
async function bookViaTheFork(booking: any, restaurantSlug: string): Promise<BookingResult> {
  try {
    // TheFork API (requires partnership agreement — uses widget API in production)
    const res = await fetch('https://api.thefork.com/v1/reservations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('THEFORK_API_KEY') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurant_slug: restaurantSlug,
        date: booking.booking_date,
        time: '20:00',
        covers: booking.guests,
        customer_first_name: booking.customer_name.split(' ')[0],
        customer_last_name: booking.customer_name.split(' ').slice(1).join(' ') || 'Guest',
        customer_email: booking.customer_email,
        comment: `Isla Drop Concierge booking. Ref: ${booking.booking_ref}. ${booking.special_notes || ''}`,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return {
        method: 'thefork',
        success: true,
        confirmed: true,
        confirmationCode: data.id || data.reservation_code,
        partnerResponse: `TheFork reservation confirmed: ${data.id}`,
      }
    }
    return { method: 'thefork', success: false, confirmed: false, error: `TheFork error: ${res.status}` }
  } catch (err) {
    return { method: 'thefork', success: false, confirmed: false, error: String(err) }
  }
}

// ── Bokun Activity Booking ────────────────────────────────────
async function bookViaBokun(booking: any, productId: string): Promise<BookingResult> {
  try {
    const res = await fetch('https://api.bokun.io/activity.json/book', {
      method: 'POST',
      headers: {
        'X-Bokun-AccessKey': Deno.env.get('BOKUN_ACCESS_KEY') || '',
        'X-Bokun-SecretKey': Deno.env.get('BOKUN_SECRET_KEY') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        date: booking.booking_date,
        participants: booking.guests,
        customer: {
          firstName: booking.customer_name.split(' ')[0],
          lastName: booking.customer_name.split(' ').slice(1).join(' ') || 'Guest',
          email: booking.customer_email,
        },
        comment: `Ref: ${booking.booking_ref}. ${booking.special_notes || ''}`,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return {
        method: 'bokun',
        success: true,
        confirmed: true,
        confirmationCode: data.bookingRef || data.id,
        partnerResponse: `Bokun booking confirmed: ${data.bookingRef}`,
      }
    }
    return { method: 'bokun', success: false, confirmed: false, error: `Bokun error: ${res.status}` }
  } catch (err) {
    return { method: 'bokun', success: false, confirmed: false, error: String(err) }
  }
}

// ── Partner email map ─────────────────────────────────────────
const PARTNER_EMAILS: Record<string, string> = {
  'Blue Marlin Ibiza':        'reservations@bluemarlinibiza.com',
  'Cala Bassa Beach Club':    'reservations@calabassabeachclub.com',
  'Cotton Beach Club':        'info@cottonbeachclub.com',
  'Nassau Beach Club':        'info@nassauibiza.com',
  'Boats Ibiza':              'info@boatsibiza.com',
  'Smart Charter Ibiza':      'info@smartcharteribiza.com',
  'Real Yacht Charter':       'info@realyachtcharter.com',
  'Ibiza Rent a Boat':        'info@ibizarentaboat.com',
  'Pacha Ibiza':              'vip@pacha.com',
  'Ushuaia Ibiza':            'vip@theushuaiaexperience.com',
  'Hi Ibiza':                 'vip@hiibiza.com',
  'Amnesia Ibiza':            'info@amnesia.es',
  'Ibiza Luxury Villas':      'reservations@ibiza-luxuryvillas.com',
  'Aqualiving Villas':        'info@aqualivingvillas.com',
  'Icon Private Collection':  'reservations@iconprivatecollection.com',
  'Ibiza Gran Hotel':         'restaurantes@ibizagranhotel.com',
  'Nobu Hotel Ibiza Bay':     'ibizabay@nobuhotels.com',
  'Amante Ibiza':             'reservations@amanteibiza.com',
  'Atzaro Agroturismo':       'info@atzaro.com',
  'Deliciously Sorted Ibiza': 'info@deliciouslysorted.com',
  'Helicopteros Insulares':   'info@helicopterosinsulares.com',
  'Ibiza Culture Tours':      'info@ibizaculturetours.com',
  'Ibiza Retreats':           'info@ibizaretreats.com',
  'Quad Ibiza':               'info@quadibiza.com',
}

// ── Smart booking router ──────────────────────────────────────
// Determines the best booking method and executes it
async function smartBookingRouter(booking: any): Promise<BookingResult & { method_used: string }> {
  const id = booking.service_id
  const category = booking.service_category

  // 1. Try OpenTable first for restaurants
  if (category === 'restaurants' && OPENTABLE_IDS[id] && OPENTABLE_API_KEY) {
    console.log(`Attempting OpenTable booking for ${id}`)
    const result = await bookViaOpenTable(booking, OPENTABLE_IDS[id])
    if (result.success) return { ...result, method_used: 'OpenTable (instant confirm)' }
    // Fall through to TheFork if OpenTable fails
    if (THEFORK_IDS[id]) {
      const forkResult = await bookViaTheFork(booking, THEFORK_IDS[id])
      if (forkResult.success) return { ...forkResult, method_used: 'TheFork (instant confirm)' }
    }
  }

  // 2. Try TheFork for restaurants without OpenTable
  if (category === 'restaurants' && THEFORK_IDS[id] && !OPENTABLE_IDS[id]) {
    const result = await bookViaTheFork(booking, THEFORK_IDS[id])
    if (result.success) return { ...result, method_used: 'TheFork (instant confirm)' }
  }

  // 3. Try Bokun for activities
  if (category === 'experiences' && BOKUN_IDS[id]) {
    const result = await bookViaBokun(booking, BOKUN_IDS[id])
    if (result.success) return { ...result, method_used: 'Bokun (instant confirm)' }
  }

  // 4. Auto-email for boats, beach clubs, clubs (fast response, usually same day)
  const autoEmailCategories = ['boats', 'beach_clubs', 'clubs', 'vip', 'experiences']
  if (autoEmailCategories.includes(category)) {
    const partnerEmail = PARTNER_EMAILS[booking.partner]
    if (partnerEmail) {
      const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
      await sendEmail(
        partnerEmail,
        `Booking Request — ${booking.service_name} — ${dateStr} — ${booking.booking_ref}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;padding:20px;color:#333;">
        <h2 style="color:#0D3B4A;">Booking Request from Isla Drop Concierge</h2>
        <p>Dear ${booking.partner} team,</p>
        <p>We have a booking request from one of our concierge clients and would like to confirm availability:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f0e8;"><td style="padding:10px;font-weight:bold;">Service</td><td style="padding:10px;">${booking.service_name}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Date</td><td style="padding:10px;">${dateStr}</td></tr>
          <tr style="background:#f5f0e8;"><td style="padding:10px;font-weight:bold;">Guests</td><td style="padding:10px;">${booking.guests}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Special requests</td><td style="padding:10px;">${booking.special_notes || 'None'}</td></tr>
          <tr style="background:#f5f0e8;"><td style="padding:10px;font-weight:bold;">Our reference</td><td style="padding:10px;font-family:monospace;">${booking.booking_ref}</td></tr>
        </table>
        <p>Please reply to this email to confirm availability. Once confirmed, we will process payment and send you and the client a full confirmation.</p>
        <p>You can also call us on +34 XXX XXX XXX or reply directly to <a href="mailto:concierge@isladrop.com">concierge@isladrop.com</a></p>
        <p style="color:#666;font-size:12px;">Isla Drop Concierge · 24/7 Luxury Service · Ibiza</p>
        </div>`
      )
      return {
        method: 'email',
        success: true,
        confirmed: false,
        method_used: 'Auto-email sent to partner (pending confirmation)',
        partnerResponse: `Email sent to ${partnerEmail}`,
      }
    }
  }

  // 5. Manual fallback — ops team handles villas and high-value items
  return {
    method: 'manual',
    success: true,
    confirmed: false,
    method_used: 'Flagged for ops team (manual booking required)',
  }
}

// ── Generate AI confirmation email ────────────────────────────
async function generateConfirmationEmail(booking: any, bookingResult: BookingResult): Promise<string> {
  const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const isInstant = bookingResult.confirmed
  const firstName = booking.customer_name.split(' ')[0]

  const prompt = `Write a beautiful, warm confirmation email for an Ibiza luxury concierge booking.

Customer: ${firstName}
Service: ${booking.service_name}
Date: ${dateStr}
Guests: ${booking.guests}
Booking reference: ${booking.booking_ref}
Special notes: ${booking.special_notes || 'None'}
Status: ${isInstant ? 'INSTANTLY CONFIRMED — booking is 100% confirmed' : 'REQUEST RECEIVED — awaiting partner confirmation (within 2 hours)'}
${bookingResult.confirmationCode ? `Confirmation code: ${bookingResult.confirmationCode}` : ''}

Write a luxury concierge email in HTML format. Use the colour #0D3B4A for headings. Include:
1. A warm, personalised opening
2. The booking summary in a styled table
3. ${isInstant ? 'Clear confirmation that this is CONFIRMED and they are all set' : 'Clear expectation that we will confirm within 2 hours and no payment is taken yet'}
4. What they should do next / what to expect
5. Contact details: concierge@isladrop.com

Use elegant, warm language. Keep it under 400 words. Return only the HTML body content.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': ANTHROPIC_API_KEY },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
  })

  if (!res.ok) return generateFallbackEmail(booking, bookingResult)
  const data = await res.json()
  return data.content?.[0]?.text || generateFallbackEmail(booking, bookingResult)
}

function generateFallbackEmail(booking: any, result: BookingResult): string {
  const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const isInstant = result.confirmed
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-family:Georgia,serif;color:#0D3B4A;margin:0;">Isla Drop Concierge</h1>
  </div>
  <div style="background:white;border-radius:16px;padding:32px;">
    <h2 style="color:#0D3B4A;font-family:Georgia,serif;">${isInstant ? 'Booking Confirmed ✅' : 'Request Received 🌴'}</h2>
    <p>Dear ${booking.customer_name},</p>
    <p>${isInstant
      ? 'Your booking is confirmed! Everything is arranged — see your details below.'
      : 'Your concierge request has been received. We are contacting the partner now and will confirm within 2 hours. No payment is taken until your booking is confirmed.'
    }</p>
    <div style="background:#f5f0e8;border-radius:12px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Reference</td><td style="padding:8px 0;font-weight:bold;text-align:right;">${booking.booking_ref}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Service</td><td style="padding:8px 0;font-weight:bold;text-align:right;">${booking.service_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Date</td><td style="padding:8px 0;font-weight:bold;text-align:right;">${dateStr}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Guests</td><td style="padding:8px 0;font-weight:bold;text-align:right;">${booking.guests}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px;">Total</td><td style="padding:8px 0;font-weight:bold;color:#C4683A;font-size:16px;text-align:right;">€${booking.total_price?.toLocaleString()}</td></tr>
        ${result.confirmationCode ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">Confirmation</td><td style="padding:8px 0;font-weight:bold;text-align:right;">${result.confirmationCode}</td></tr>` : ''}
      </table>
    </div>
    <p style="color:#666;font-size:13px;">Questions? <a href="mailto:concierge@isladrop.com" style="color:#C4683A;">concierge@isladrop.com</a></p>
  </div>
</div>
</body></html>`
}

// ── Main handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const body = await req.json()

    // ── New booking ───────────────────────────────────────────
    if (body.type === 'new_booking') {
      const booking = body.booking

      // 1. Save to database
      const { data: saved, error } = await supabase
        .from('concierge_bookings')
        .insert({
          customer_email:   booking.customer_email,
          customer_name:    booking.customer_name,
          customer_id:      booking.customer_id || null,
          service_id:       booking.service_id,
          service_name:     booking.service_name,
          service_category: booking.service_category,
          partner:          booking.partner,
          location:         booking.location,
          location_lat:     booking.lat,
          location_lng:     booking.lng,
          booking_date:     booking.date,
          guests:           booking.guests,
          special_notes:    booking.notes,
          price_per_unit:   booking.price,
          total_price:      booking.total,
        })
        .select()
        .single()

      if (error) throw error

      // 2. Run smart booking router
      console.log(`Processing booking ${saved.booking_ref} via smart router...`)
      const bookingResult = await smartBookingRouter(saved)
      console.log(`Booking result:`, bookingResult)

      // 3. Generate personalised AI email
      const emailHtml = await generateConfirmationEmail(saved, bookingResult)

      // 4. Send customer email
      const emailSubject = bookingResult.confirmed
        ? `Booking Confirmed! ${saved.service_name} · ${saved.booking_ref}`
        : `Request Received — ${saved.service_name} · ${saved.booking_ref}`

      await sendEmail(saved.customer_email, emailSubject, emailHtml)

      // 5. Send ops notification
      await sendEmail(
        'concierge@isladrop.com',
        `[${bookingResult.confirmed ? 'AUTO-CONFIRMED' : 'NEEDS CONFIRMATION'}] ${saved.service_name} · ${saved.booking_ref}`,
        `<h2>${bookingResult.confirmed ? '✅ Auto-Confirmed' : '⏳ Awaiting Confirmation'}</h2>
        <p><strong>Method:</strong> ${bookingResult.method_used}</p>
        <p><strong>Ref:</strong> ${saved.booking_ref}</p>
        <p><strong>Service:</strong> ${saved.service_name}</p>
        <p><strong>Partner:</strong> ${saved.partner}</p>
        <p><strong>Date:</strong> ${saved.booking_date}</p>
        <p><strong>Guests:</strong> ${saved.guests}</p>
        <p><strong>Total:</strong> €${saved.total_price}</p>
        <p><strong>Commission:</strong> €${(saved.total_price * 0.10).toFixed(2)}</p>
        <p><strong>Customer:</strong> ${saved.customer_name} (${saved.customer_email})</p>
        <p><strong>Notes:</strong> ${saved.special_notes || 'None'}</p>
        ${bookingResult.confirmationCode ? `<p><strong>Confirmation code:</strong> ${bookingResult.confirmationCode}</p>` : ''}
        ${bookingResult.error ? `<p style="color:red;"><strong>Error:</strong> ${bookingResult.error}</p>` : ''}
        <hr>
        <p><a href="https://isla-drop.vercel.app/?staff=true">Open Management Dashboard →</a></p>`
      )

      // 6. Update booking in DB
      await supabase
        .from('concierge_bookings')
        .update({
          ai_notes: `Booking method: ${bookingResult.method_used}${bookingResult.confirmationCode ? ` | Code: ${bookingResult.confirmationCode}` : ''}${bookingResult.error ? ` | Error: ${bookingResult.error}` : ''}`,
          confirmation_sent_at: new Date().toISOString(),
          status: bookingResult.confirmed ? 'confirmed' : 'pending',
          confirmed_at: bookingResult.confirmed ? new Date().toISOString() : null,
        })
        .eq('id', saved.id)

      return new Response(JSON.stringify({
        success: true,
        booking_ref: saved.booking_ref,
        booking_id: saved.id,
        instantly_confirmed: bookingResult.confirmed,
        method: bookingResult.method_used,
        confirmation_code: bookingResult.confirmationCode || null,
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    // ── Status update (ops dashboard) ─────────────────────────
    if (body.type === 'update_status') {
      const { booking_id, status, ops_notes } = body

      const { data: booking } = await supabase
        .from('concierge_bookings')
        .update({
          status,
          ops_notes,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
          cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
        })
        .eq('id', booking_id)
        .select()
        .single()

      if (booking) {
        const dateStr = new Date(booking.booking_date).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
        if (status === 'confirmed') {
          // Trigger payment collection
          const paymentIntentId = await capturePayment(
            booking.id,
            booking.total_price,
            booking.customer_email,
            booking.service_name
          )

          // Generate secure Stripe payment link email
          const paymentLinkHtml = paymentIntentId
            ? `<div style="background:#f0f8e8;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
                <p style="margin:0 0 10px;font-weight:bold;color:#0D3B4A;">Complete Your Payment</p>
                <p style="margin:0 0 12px;font-size:13px;color:#666;">Click below to securely pay for your booking</p>
                <a href="https://isla-drop.vercel.app/pay?booking=${booking.booking_ref}" 
                   style="background:#C4683A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  Pay €${booking.total_price?.toLocaleString()} Securely →
                </a>
              </div>`
            : `<p>Our team will contact you shortly to arrange payment of <strong>€${booking.total_price?.toLocaleString()}</strong>.</p>`

          await sendEmail(
            booking.customer_email,
            `Confirmed! ${booking.service_name} — ${booking.booking_ref}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <h1 style="color:#0D3B4A;font-family:Georgia,serif;">Your booking is confirmed! ✅</h1>
            <p>Dear ${booking.customer_name},</p>
            <p>Your booking for <strong>${booking.service_name}</strong> on <strong>${dateStr}</strong> is confirmed.</p>
            ${ops_notes ? `<div style="background:#f0f8e8;border-radius:8px;padding:16px;margin:16px 0;"><strong>Note from your concierge:</strong><br>${ops_notes}</div>` : ''}
            <p>Reference: <strong>${booking.booking_ref}</strong></p>
            <p>Total: <strong style="color:#C4683A;">€${booking.total_price?.toLocaleString()}</strong></p>
            ${paymentLinkHtml}
            <p>Questions? <a href="mailto:concierge@isladrop.com" style="color:#C4683A;">concierge@isladrop.com</a></p>
            </div>`
          )
        }
        if (status === 'cancelled') {
          await sendEmail(
            booking.customer_email,
            `Booking Update — ${booking.booking_ref}`,
            `<p>Dear ${booking.customer_name}, your booking for ${booking.service_name} has been cancelled. ${ops_notes || ''} No payment has been taken. Please contact concierge@isladrop.com to rebook or for any queries.</p>`
          )
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })

  } catch (err) {
    console.error('Booking error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
