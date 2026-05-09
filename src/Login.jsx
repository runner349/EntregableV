import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const form = new FormData(e.target)
    const email = form.get('email')
    const password = form.get('password')

    if (!email || !password) {
      setErrorMsg('Completa todos los campos')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <>
      <style>{styles}</style>

      <div style={{
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000', fontFamily: "'Inter', 'DM Sans', sans-serif", overflow: 'hidden', position: 'relative'
      }}>
        {/* Fondo decorativo sutil */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Card de login */}
        <div style={{
          background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 24, padding: '48px 40px',
          maxWidth: 440, width: '90%', textAlign: 'center', position: 'relative', zIndex: 1,
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, background: 'rgba(34,197,94,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              fontSize: 28, color: '#22C55E'
            }}>
              <i className="ti ti-heart-plus" />
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>
              Nova Salud
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Sistema de gestión farmacéutica
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              style={{
                width: '100%', background: '#050505', border: '1px solid #1A1A1A', borderRadius: 14,
                padding: '14px 18px', color: '#FFF', fontSize: 15, fontFamily: "'Inter', sans-serif",
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#22C55E'}
              onBlur={e => e.target.style.borderColor = '#1A1A1A'}
            />

            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              style={{
                width: '100%', background: '#050505', border: '1px solid #1A1A1A', borderRadius: 14,
                padding: '14px 18px', color: '#FFF', fontSize: 15, fontFamily: "'Inter', sans-serif",
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#22C55E'}
              onBlur={e => e.target.style.borderColor = '#1A1A1A'}
            />

            {errorMsg && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                padding: '10px 14px', borderRadius: 10, color: '#EF4444', fontSize: 13, fontWeight: 600
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', border: 'none', borderRadius: 14, padding: '15px',
                background: loading ? '#1A1A1A' : '#22C55E',
                color: loading ? '#666' : '#000', fontSize: 16, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(34,197,94,0.25)'
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#4ADE80' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#22C55E' }}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ margin: '24px 0 0', color: '#444', fontSize: 12 }}>
            Botica Nova Salud &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; background: #000; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`