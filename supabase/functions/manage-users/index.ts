import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the calling user is authenticated and has permission
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!

    // Create a client with the user's token to check permissions
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token)
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.user.id

    // Check if user has pode_gerenciar_acessos permission
    const { data: roleData } = await userClient
      .from('user_roles')
      .select('pode_gerenciar_acessos')
      .eq('user_id', userId)
      .single()

    if (!roleData?.pode_gerenciar_acessos) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { action, ...body } = await req.json()

    switch (action) {
      case 'create': {
        const { email, password, nome } = body
        if (!email || !password) {
          return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome: nome || email },
        })

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update': {
        const { targetUserId, email: newEmail, password: newPassword, nome: newNome } = body
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const updateData: Record<string, any> = {}
        if (newEmail) updateData.email = newEmail
        if (newPassword) updateData.password = newPassword
        if (newNome) updateData.user_metadata = { nome: newNome }

        const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
          targetUserId,
          updateData
        )

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ user: updated.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete': {
        const { targetUserId } = body
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)

        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Also delete user_roles entry
        await adminClient.from('user_roles').delete().eq('user_id', targetUserId)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'list': {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

        if (listError) {
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const safeUsers = users.map(u => ({
          id: u.id,
          email: u.email,
          nome: u.user_metadata?.nome || '',
          created_at: u.created_at,
        }))

        return new Response(JSON.stringify({ users: safeUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})