
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // IMPORTANTE: Para gerenciar usuários (criar/deletar/resetar senha de terceiros),
    // precisamos da SERVICE_ROLE_KEY. A anon key não tem permissão para auth.admin.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing on server configuration')
    }

    // Criamos o cliente com a chave de serviço (Admin total)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { action, email, password, userId, userData } = await req.json()

    // --- AÇÃO: CRIAR USUÁRIO ---
    if (action === 'create_user') {
        if (!email || !password) throw new Error('Email and password required')

        // 1. Cria o usuário no Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirma automaticamente
            user_metadata: userData || {}
        })

        if (authError) throw authError

        // 2. Cria o registro na tabela pública (app_users) se não existir
        // (Isso geralmente é feito por Triggers no banco, mas podemos reforçar aqui)
        if (userData?.role) {
            const { error: dbError } = await supabaseAdmin
                .from('app_users')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    name: userData.fullName || email.split('@')[0],
                    role: userData.role
                })
            
            if (dbError) console.error("Error syncing app_users:", dbError)
        }

        return new Response(JSON.stringify(authData.user), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- AÇÃO: RESETAR SENHA ---
    if (action === 'reset_password') {
        if (!userId || !password) throw new Error('UserId and new password required')

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: password }
        )

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- AÇÃO: DELETAR USUÁRIO ---
    if (action === 'delete_user') {
        if (!userId) throw new Error('UserId required')

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error

        // Limpa tabela pública também
        await supabaseAdmin.from('app_users').delete().eq('id', userId)
        
        // Se for vendedor, desativa ou deleta? Vamos deletar da tabela sellers também se houver vinculo manual,
        // mas aqui vamos focar no Auth.
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
