/**
 * Onfido ID Verification Integration
 *
 * Flow:
 * 1. Customer submits DOB + name on frontend
 * 2. We call our Edge Function to create an Onfido applicant + SDK token
 * 3. We load the Onfido Web SDK in an iframe/modal
 * 4. On completion, Onfido sends a webhook to our Edge Function
 * 5. Edge Function updates customers.age_verified = true
 *
 * For sandbox testing use: https://documentation.onfido.com/#sandbox-testing
 */

/**
 * Step 1: Create Onfido applicant and get SDK token
 * Calls your Supabase Edge Function (which holds the Onfido API key)
 */
export async function startOnfidoVerification({ firstName, lastName, dob, customerId }) {
  const { supabase } = await import('./supabase')

  const { data, error } = await supabase.functions.invoke('onfido-create-applicant', {
    body: { firstName, lastName, dob, customerId },
  })

  if (error) throw error
  return data // { sdkToken, applicantId, checkId }
}

/**
 * Step 2: Load the Onfido Web SDK
 * Add <script src="https://sdk.onfido.com/v14/onfido.min.js"> to your index.html
 */
export function initOnfidoSDK({ sdkToken, onComplete, onError }) {
  if (!window.Onfido) {
    throw new Error('Onfido SDK not loaded. Add the script tag to index.html.')
  }

  const onfido = window.Onfido.init({
    token: sdkToken,
    containerId: 'onfido-mount',
    useModal: true,
    isModalOpen: true,
    steps: [
      { type: 'welcome', options: { title: 'Verify your age', descriptions: ['We need to confirm you are 18+ to complete your order.', 'This takes about 2 minutes.'] } },
      { type: 'document', options: { documentTypes: { passport: true, driving_licence: true, national_identity_card: true } } },
      { type: 'face', options: { requestedVariant: 'standard' } },
      { type: 'complete', options: { message: 'Verification submitted!', submessage: 'We\'ll confirm your order once verified.' } },
    ],
    onComplete: (data) => {
      onfido.setOptions({ isModalOpen: false })
      onComplete(data)
    },
    onError: (err) => {
      console.error('Onfido error:', err)
      onError(err)
    },
    onModalRequestClose: () => {
      onfido.setOptions({ isModalOpen: false })
    },
  })

  return onfido
}

/**
 * Edge Function code — deploy to: supabase/functions/onfido-create-applicant/index.ts
 */
export const ONFIDO_EDGE_FUNCTION = `
const ONFIDO_API_URL = 'https://api.eu.onfido.com/v3.6'

Deno.serve(async (req) => {
  const { firstName, lastName, dob, customerId } = await req.json()
  const token = Deno.env.get('ONFIDO_API_TOKEN')

  // 1. Create applicant
  const applicantRes = await fetch(\`\${ONFIDO_API_URL}/applicants\`, {
    method: 'POST',
    headers: { Authorization: \`Token token=\${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: firstName, last_name: lastName, dob }),
  })
  const applicant = await applicantRes.json()

  // 2. Create SDK token
  const sdkRes = await fetch(\`\${ONFIDO_API_URL}/sdk_token\`, {
    method: 'POST',
    headers: { Authorization: \`Token token=\${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_id: applicant.id, referrer: '*' }),
  })
  const sdk = await sdkRes.json()

  // 3. Create check
  const checkRes = await fetch(\`\${ONFIDO_API_URL}/checks\`, {
    method: 'POST',
    headers: { Authorization: \`Token token=\${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      applicant_id: applicant.id,
      report_names: ['document', 'facial_similarity_photo', 'age_validation'],
    }),
  })
  const check = await checkRes.json()

  // 4. Store applicant & check IDs on customer record
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  await supabase.from('customers').update({
    onfido_check_id: check.id,
  }).eq('id', customerId)

  return new Response(JSON.stringify({
    sdkToken: sdk.token,
    applicantId: applicant.id,
    checkId: check.id,
  }), { headers: { 'Content-Type': 'application/json' } })
})
`

/**
 * Onfido Webhook Handler — deploy to: supabase/functions/onfido-webhook/index.ts
 * Set your webhook URL in the Onfido dashboard:
 * https://app.onfido.com/dashboard/webhook-settings
 * URL: https://YOUR_PROJECT.supabase.co/functions/v1/onfido-webhook
 */
export const ONFIDO_WEBHOOK = `
Deno.serve(async (req) => {
  const payload = await req.json()

  if (payload.payload?.action === 'check.completed') {
    const checkId = payload.payload?.object?.id
    const result = payload.payload?.object?.result // 'clear' | 'consider' | 'unidentified'

    if (result === 'clear' && checkId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      await supabase.from('customers')
        .update({
          age_verified: true,
          age_verified_at: new Date().toISOString(),
        })
        .eq('onfido_check_id', checkId)

      // Advance any pending orders for this customer
      const { data: customer } = await supabase.from('customers')
        .select('id').eq('onfido_check_id', checkId).single()

      if (customer) {
        await supabase.from('orders')
          .update({ status: 'confirmed' })
          .eq('customer_id', customer.id)
          .eq('status', 'age_check')
      }
    }
  }

  return new Response('ok')
})
`
