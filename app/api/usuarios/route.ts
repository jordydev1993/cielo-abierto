import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { usuarioCreateSchema } from '@/lib/validations/usuarios.schema'

export async function POST(request: Request) {
  const supabaseServer = await createServerClient()

  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { data: role } = await supabaseServer.rpc('get_my_role')
  if (role !== 'Admin') {
    return Response.json(
      { error: 'Acceso denegado: su rol no cuenta con los permisos necesarios para gestionar usuarios.' },
      { status: 403 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()

  const parsed = usuarioCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { nombre, apellido, email, password, rol_id, telefono } = parsed.data

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    const friendly = msg.includes('already') || msg.includes('exists') || msg.includes('registered')
      ? 'Ya existe un usuario registrado con ese email. Ingresá un email diferente. (U-EX-01)'
      : 'Error al crear el usuario. Intentá nuevamente.'
    return Response.json({ error: friendly }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert({
      nombre,
      apellido,
      email,
      rol_id,
      telefono: telefono || null,
      auth_user_id: authData.user.id,
    })
    .select()
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json(data, { status: 201 })
}
