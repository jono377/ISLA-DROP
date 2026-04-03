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

/**
 * Onfido Webhook Handler — deploy to: supabase/functions/onfido-webhook/index.ts
 * Set your webhook URL in the Onfido dashboard:
 * https://app.onfido.com/dashboard/webhook-settings
 * URL: https://YOUR_PROJECT.supabase.co/functions/v1/onfido-webhook
 */
