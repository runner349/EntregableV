import { useState } from 'react'
import { supabase } from './lib/supabase'

// ── Logo Nova Salud (igual al que tienes en tu proyecto) ──────────────────────
function NovaSaludLogo({ iconSize = 36, textSize = 24, color = '#ffffff' }) {
  const cross = color === '#ffffff' ? '#00a86b' : '#ffffff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 40C24 40 6 28.5 6 16.5C6 11.25 10.25 7 15.5 7C18.8 7 21.7 8.7 24 11.3C26.3 8.7 29.2 7 32.5 7C37.75 7 42 11.25 42 16.5C42 28.5 24 40 24 40Z"
          fill={color}
        />
        <rect x="21.5" y="13" width="5" height="14" rx="2.2" fill={cross} />
        <rect x="17" y="17.5" width="14" height="5" rx="2.2" fill={cross} />
      </svg>
      <span style={{
        fontSize: textSize,
        fontWeight: 800,
        color: color,
        letterSpacing: '-0.02em',
        fontFamily: 'Arial, Helvetica, sans-serif',
        lineHeight: 1,
      }}>
        Nova Salud
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

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

    setLoading(false)
  }

  return (
    <>
      <style>{styles}</style>

      <div className="login-page">

        {/* ── Panel izquierdo (azul) ── */}
        <div className="login-left">
          <div className="circle circle-one" />
          <div className="circle circle-two" />

          <div className="login-content">

            {/* Logo blanco arriba */}
            <div className="login-logo">
              <NovaSaludLogo iconSize={34} textSize={22} color="#ffffff" />
            </div>

            <h1>Bienvenido</h1>
            <p className="login-sub">Ingresa para continuar en Nova Salud</p>

            {/* Hint mejorado con ícono de candado */}
            <div className="credentials-hint">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Ingresa tus credenciales para acceder
            </div>

            <form onSubmit={handleLogin}>
              <input type="email"    name="email"    placeholder="Correo electrónico" />
              <input type="password" name="password" placeholder="Contraseña" />

              {errorMsg && <div className="login-error">{errorMsg}</div>}

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <span className="forgot">Nova Salud</span>
          </div>
        </div>

        {/* ── Panel derecho (blanco) ── */}
        <div className="login-right">
          <div className="right-circle" />

          <div className="right-content">
            <div className="right-logo">
              <NovaSaludLogo iconSize={64} textSize={42} color="#00a86b" />
            </div>
            <p>
              Sistema de gestión farmacéutica.<br />
              Controla tu inventario, ventas y productos desde un solo lugar.
            </p>
            <div className="brand-tag">
              Salud · Confianza · Eficiencia
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

const styles = `
* {
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
}

html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
}

.login-page {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  overflow: hidden;
  background: white;
}

/* ── Panel izquierdo ── */
.login-left {
  position: relative;
  background: linear-gradient(135deg, #2dd4a0, #00a86b);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-left::after {
  content: "";
  position: absolute;
  right: -150px;
  top: -5%;
  width: 340px;
  height: 110%;
  background: white;
  border-radius: 50%;
  z-index: 1;
}

.login-content {
  width: 100%;
  max-width: 520px;
  text-align: center;
  position: relative;
  z-index: 3;
  padding: 30px;
}

.login-logo {
  margin-bottom: 26px;
}

/* h1 Bienvenido — blanco puro */
.login-content h1 {
  font-size: 54px;
  margin: 0 0 14px;
  color: #ffffff;
  font-weight: 900;
}

/* Subtítulo — blanco con leve transparencia */
.login-sub {
  font-size: 20px;
  margin-bottom: 30px;
  color: rgba(255,255,255,0.88);
}

/* ── Credentials hint rediseñado ── */
.credentials-hint {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: rgba(255,255,255,0.14);
  border: 1.5px solid rgba(255,255,255,0.50);
  border-radius: 14px;
  padding: 13px 22px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 28px;
  letter-spacing: 0.01em;
  backdrop-filter: blur(8px);
  box-shadow:
    0 2px 12px rgba(0,0,0,0.12),
    inset 0 1px 0 rgba(255,255,255,0.30);
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

input {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 25px 28px;
  font-size: 22px;
  outline: none;
}

.login-error {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.45);
  padding: 12px;
  border-radius: 14px;
  font-weight: bold;
  color: #fff;
}

.login-btn {
  border: none;
  border-radius: 18px;
  padding: 25px;
  background: #ff9026;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.18s;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-btn:hover:not(:disabled) {
  background: #f97316;
}

.forgot {
  display: block;
  margin-top: 26px;
  font-size: 17px;
  font-weight: bold;
  color: rgba(255,255,255,0.78);
  cursor: pointer;
}

/* ── Panel derecho ── */
.login-right {
  position: relative;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.right-content {
  text-align: center;
  max-width: 440px;
  padding: 30px;
  position: relative;
  z-index: 2;
}

.right-logo {
  margin-bottom: 28px;
}

.right-content p {
  font-size: 20px;
  line-height: 1.65;
  color: #444;
  margin-bottom: 36px;
}

.brand-tag {
  display: inline-block;
  background: #edfff6;
  color: #00a86b;
  border: 1.5px solid #a0e6c8;
  border-radius: 100px;
  padding: 10px 26px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.right-circle {
  position: absolute;
  width: 360px;
  height: 360px;
  right: -100px;
  bottom: -120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2dd4a0, #00a86b);
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
}

.circle-one {
  width: 470px;
  height: 470px;
  left: -160px;
  bottom: -170px;
}

.circle-two {
  width: 320px;
  height: 320px;
  right: -40px;
  top: -95px;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-left::after {
    display: none;
  }

  .login-right {
    display: none;
  }

  .login-content h1 {
    font-size: 38px;
  }

  .login-sub {
    font-size: 16px;
  }

  input,
  .login-btn {
    font-size: 16px;
    padding: 15px;
  }

  .credentials-hint {
    font-size: 14px;
    padding: 11px 16px;
  }
}
`