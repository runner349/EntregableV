import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('usuario')
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // ✅ Login exitoso → Redirigir al dashboard
    console.log('✅ Sesión iniciada:', data.user.email)
    window.location.href = '/dashboard'  // o usa React Router
  }

  // ✅ Función para cerrar sesión (para pruebas)
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <>
      <style>{styles}</style>

      <div className="login-page">
        <div className="login-left">
          <div className="circle circle-one"></div>
          <div className="circle circle-two"></div>

          <div className="login-content">
            <h1>Bienvenido</h1>
            <p>Ingresa para continuar en Nova Salud</p>

            <form onSubmit={handleLogin}>
              <input type="email" name="email" placeholder="Correo" />
              <input type="password" name="password" placeholder="Contraseña" />

              {errorMsg && <div className="login-error">{errorMsg}</div>}

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Login'}
              </button>
            </form>

            <button onClick={handleLogout} style={{ marginTop: 10, background: 'red', color: 'white', padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="login-right">
          <div className="right-circle"></div>

          <div className="right-content">
            <h2>¿Nuevo aquí?</h2>
            <p>Crea una cuenta desde Supabase Auth para acceder al sistema.</p>

            <button className="signup-btn" type="button">
              Sign Up
            </button>
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

.login-left {
  position: relative;
  background: linear-gradient(135deg, #4f8ee8, #235ebd);
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
  color: white;
  text-align: center;
  position: relative;
  z-index: 3;
  padding: 30px;
}

.login-content h1 {
  font-size: 54px;
  margin: 0 0 18px;
}

.login-content p {
  font-size: 22px;
  margin-bottom: 42px;
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
  font-size: 24px;
  outline: none;
}

.login-error {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255,255,255,0.35);
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
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-btn:hover {
  background: #f97316;
}

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
  max-width: 520px;
  padding: 30px;
}

.right-content h2 {
  font-size: 44px;
  margin: 0 0 28px;
  color: #111;
}

.right-content p {
  font-size: 25px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 45px;
}

.signup-btn {
  width: 360px;
  padding: 24px;
  border: none;
  border-radius: 16px;
  background: #2f65c7;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.signup-btn:hover {
  background: #2555aa;
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

.right-circle {
  position: absolute;
  width: 360px;
  height: 360px;
  right: -100px;
  bottom: -120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5397e9, #2566c8);
}

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

  .login-content p {
    font-size: 16px;
  }

  input,
  .login-btn {
    font-size: 16px;
    padding: 15px;
  }
}
`