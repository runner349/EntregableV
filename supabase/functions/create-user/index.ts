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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // 1. Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
    })

    if (authError) throw new Error(authError.message)

    // 2. Actualizar la tabla Usuarios para vincular al empleado
    const { error: updateError } = await supabaseAdmin
      .from("Usuarios")
      .update({
        id_empleado: id_empleado,
        id_rol: id_rol,
        estado: true,
      })
      .eq("username", email)

    if (updateError) throw new Error(updateError.message)

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