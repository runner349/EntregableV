// ===========================================
// src/lib/useAuth.js
// Hook personalizado para obtener el perfil del usuario
// ===========================================

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState(null)           // Datos de auth.user
  const [profile, setProfile] = useState(null)     // Datos de tabla Usuarios
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarUsuario = async () => {
      setLoading(true)

      // 1. Obtener sesión actual
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user || null

      setUser(authUser)

      // 2. Si hay sesión, cargar perfil de la tabla Usuarios
      if (authUser?.email) {
        const { data: perfilData } = await supabase
          .from('Usuarios')
          .select('id_usuario, username, id_rol, estado')
          .eq('username', authUser.email)
          .maybeSingle()

        setProfile(perfilData || {
          id_usuario: null,
          username: authUser.email,
          id_rol: 2,
          estado: true
        })
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    cargarUsuario()

    // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user || null
      setUser(authUser)

      if (authUser?.email) {
        supabase
          .from('Usuarios')
          .select('id_usuario, username, id_rol, estado')
          .eq('username', authUser.email)
          .maybeSingle()
          .then(({ data }) => {
            setProfile(data || {
              id_usuario: null,
              username: authUser.email,
              id_rol: 2,
              estado: true
            })
          })
      } else {
        setProfile(null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}