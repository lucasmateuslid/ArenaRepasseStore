
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Tratamento de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Setup do Cliente Supabase com Auth Context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      throw new Error('Missing Authorization Header')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // 3. Validação do Método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
    }

    // 4. Parse e Validação do Body
    let body;
    try {
      body = await req.json()
    } catch (e) {
      throw new Error('Invalid JSON body')
    }

    const { id, soldPrice, soldDate, soldBy } = body

    if (!id) throw new Error('Car ID is required')
    if (!soldPrice || isNaN(Number(soldPrice))) throw new Error('Valid Sold Price is required')
    if (!soldDate) throw new Error('Sold Date is required')
    if (!soldBy) throw new Error('Sales person (Sold By) is required')

    // 5. Execução da Venda (Update)
    const updates = {
      status: 'sold',
      soldPrice: Number(soldPrice),
      soldDate: soldDate,
      soldBy: soldBy
    }

    const { data, error } = await supabase
      .from('cars')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    // Verifica se houve atualização (RLS pode retornar sucesso mas 0 linhas se não permitido)
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Car not found or permission denied' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
