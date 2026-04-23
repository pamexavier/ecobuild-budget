// supabase/functions/manage-users/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('URL_PROJETO')
    const supabaseServiceKey = Deno.env.get('SERVICE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Checar permissão: pode_gerenciar_acessos OU role = 'super_admin'
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('pode_gerenciar_acessos, role')
      .eq('user_id', user.id)
      .single()

    const canManage = roleData?.pode_gerenciar_acessos || roleData?.role === 'super_admin'

    if (!canManage) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para gerenciar acessos' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { action, ...params } = body

    switch (action) {
      case 'list': {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const safeUsers = users.map(u => ({
          id: u.id,
          email: u.email,
          nome: u.user_metadata?.nome || '',
          created_at: u.created_at,
        }))

        return new Response(
          JSON.stringify({ users: safeUsers }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create': {
        const { email, password, nome } = params

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email e senha são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome: nome || email.split('@')[0] },
        })

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ user: newUser.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        const { targetUserId, email, password, nome } = params

        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: 'targetUserId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password
        if (nome) updateData.user_metadata = { nome }

        const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
          targetUserId,
          updateData
        )

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ user: updated.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        const { targetUserId } = params

        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: 'targetUserId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Remove vínculos de user_roles (todos os tenants) antes de deletar do auth
        await adminClient.from('user_roles').delete().eq('user_id', targetUserId)

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})