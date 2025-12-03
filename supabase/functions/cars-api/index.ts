
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Tratamento de CORS (Pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Setup do Cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      throw new Error('Missing Authorization Header')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { method } = req
    const url = new URL(req.url)
    const id = url.searchParams.get('id') // ?id=...

    // --- GET: Listar ou Buscar Único ---
    if (method === 'GET') {
        let query = supabase.from('cars').select('*')

        if (id) {
            // Buscar um carro específico
            // REMOVIDO .single() para evitar erro 406 se RLS bloquear ou ID não existir
            const { data, error } = await query.eq('id', id)
            
            if (error) throw error
            if (!data || data.length === 0) {
                 return new Response(JSON.stringify({ error: 'Car not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else {
            // Filtros via Query Params
            const make = url.searchParams.get('make')
            const vehicleType = url.searchParams.get('vehicleType')
            const maxPrice = url.searchParams.get('maxPrice')
            
            if (make) query = query.eq('make', make)
            if (vehicleType) query = query.eq('vehicleType', vehicleType)
            if (maxPrice) query = query.lte('price', maxPrice)
            
            // Ordenação padrão
            query = query.order('created_at', { ascending: false })

            const { data, error } = await query
            if (error) throw error
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
    }

    // --- POST: Criar Veículo ---
    if (method === 'POST') {
        let body;
        try {
            body = await req.json()
        } catch (e) {
            throw new Error('Invalid JSON body')
        }

        const { data, error } = await supabase.from('cars').insert([body]).select()
        if (error) throw error
        return new Response(JSON.stringify(data?.[0] || {}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- PUT: Atualizar Veículo ---
    if (method === 'PUT') {
        if (!id) throw new Error('ID is required for update')
        
        let body;
        try {
            body = await req.json()
        } catch (e) {
            throw new Error('Invalid JSON body')
        }
        
        // Remove campos que não devem ser atualizados diretamente ou que vêm sujos
        const { id: _, created_at: __, ...updates } = body

        // REMOVIDO .single()
        const { data, error } = await supabase.from('cars').update(updates).eq('id', id).select()
        
        if (error) throw error
        
        // Verifica se houve atualização
        if (!data || data.length === 0) {
             return new Response(JSON.stringify({ error: 'Update failed or ID not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- DELETE: Remover Veículo ---
    if (method === 'DELETE') {
        if (!id) throw new Error('ID is required for delete')
        const { error } = await supabase.from('cars').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
