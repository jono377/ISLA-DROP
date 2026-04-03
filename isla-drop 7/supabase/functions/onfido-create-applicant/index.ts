// supabase/functions/onfido-create-applicant/index.ts
// Deploy with: supabase functions deploy onfido-create-applicant

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONFIDO_API_URL = 'https://api.eu.onfido.com/v3.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { firstName, lastName, dob, customerId } = await req.json()
    const token = Deno.env.get('ONFIDO_API_TOKEN')!

    // 1. Create Onfido applicant
    const applicantRes = await fetch(`${ONFIDO_API_URL}/applicants`, {
      method: 'POST',
      headers: {
        Authorization: `Token token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        dob, // YYYY-MM-DD format
      }),
    })

    if (!applicantRes.ok) {
      const err = await applicantRes.json()
      throw new Error(`Onfido applicant error: ${JSON.stringify(err)}`)
    }

    const applicant = await applicantRes.json()

    // 2. Generate SDK token
    const sdkRes = await fetch(`${ONFIDO_API_URL}/sdk_token`, {
      method: 'POST',
      headers: {
        Authorization: `Token token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicant_id: applicant.id,
        referrer: '*://*/*', // Allow all referrers — restrict to your domain in production
      }),
    })

    const sdkData = await sdkRes.json()

    // 3. Create check (document + face + age validation)
    const checkRes = await fetch(`${ONFIDO_API_URL}/checks`, {
      method: 'POST',
      headers: {
        Authorization: `Token token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicant_id: applicant.id,
        report_names: ['document', 'facial_similarity_photo', 'age_validation'],
      }),
    })

    const check = await checkRes.json()

    // 4. Store Onfido IDs on customer record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase
      .from('customers')
      .update({ onfido_check_id: check.id })
      .eq('id', customerId)

    return new Response(
      JSON.stringify({
        sdkToken: sdkData.token,
        applicantId: applicant.id,
        checkId: check.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Onfido error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
