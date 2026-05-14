import { createClient } from '@supabase/supabase-js'
import { usuarioCreateSchema } from '@/lib/validations/usuarios.schema'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
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
    return Response.json({ error: authError.message }, { status: 400 })
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
