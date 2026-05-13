import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email, password, id_empleado, id_rol } = await req.json()

    // Crear cliente de Supabase con SERVICE ROLE (tiene permisos admin)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""  // ✅ Corregido: sin prefijo SUPABASE_
    )

    // 1. Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw new Error(authError.message)

    // 2. Upsert en la tabla Usuarios (crea si no existe, actualiza si existe)
    const { error: upsertError } = await supabaseAdmin
      .from("Usuarios")
      .upsert({
        username: email,
        password_hash: "supabase_auth",
        id_empleado: id_empleado,
        id_rol: id_rol,
        estado: true,
      }, { onConflict: "username" })  // ✅ Usa upsert en lugar de update

    if (upsertError) throw new Error(upsertError.message)

    return new Response(
      JSON.stringify({
        success: true,
        user: authUser.user,
        message: "✅ Usuario creado y vinculado correctamente",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})