import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// COLORES VIBRANTES PARA HOVER
// ============================================
const hoverColors = [
  { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.5)', shadow: 'rgba(34, 197, 94, 0.2)' },
  { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.5)', shadow: 'rgba(6, 182, 212, 0.2)' },
  { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.5)', shadow: 'rgba(249, 115, 22, 0.2)' },
  { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.5)', shadow: 'rgba(168, 85, 247, 0.2)' },
  { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.5)', shadow: 'rgba(236, 72, 153, 0.2)' },
  { bg: 'rgba(250, 204, 21, 0.08)', border: 'rgba(250, 204, 21, 0.5)', shadow: 'rgba(250, 204, 21, 0.2)' },
]

// ============================================
// GRADIENTES PARA AVATARES
// ============================================
const avatarGradients = [
  'linear-gradient(135deg, #22C55E, #10B981)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #A855F7, #7C3AED)',
  'linear-gradient(135deg, #EC4899, #8B5CF6)',
  'linear-gradient(135deg, #EAB308, #F97316)',
]

// ============================================
// SKELETON
// ============================================
const Skeleton = ({ width, height, radius = 12 }) => (
  <div style={{
    width: width || '100%', height: height || 20, borderRadius: radius,
    background: 'linear-gradient(90deg, #0A0A0A 25%, #111 50%, #0A0A0A 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  }} />
)

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [notificacion, setNotificacion] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)

  const [form, setForm] = useState({
    dni: '', nombres: '', apellidos: '', id_cargo: '',
    username: '', password: '', id_rol: 2
  })

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    const { data: emp } = await supabase.from('Empleados').select('*, Cargos(*), Usuarios(*)').order('apellidos')
    setEmpleados(emp || [])
    const { data: car } = await supabase.from('Cargos').select('*')
    setCargos(car || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.dni || !form.nombres || !form.apellidos || !form.id_cargo) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' }); return
    }
    try {
      if (editando) {
        await supabase.from('Empleados').update({ dni: form.dni, nombres: form.nombres, apellidos: form.apellidos, id_cargo: form.id_cargo }).eq('id_empleado', editando)
        setNotificacion({ tipo: 'success', mensaje: '✅ Empleado actualizado correctamente' })
      } else {
        const { data: empleado, error } = await supabase.from('Empleados').insert({ dni: form.dni, nombres: form.nombres, apellidos: form.apellidos, id_cargo: form.id_cargo }).select('id_empleado').single()
        if (error) throw error
        if (form.username && form.password) {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ email: form.username, password: form.password, id_empleado: empleado.id_empleado, id_rol: form.id_rol })
            })
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Error al crear usuario') }
            setNotificacion({ tipo: 'success', mensaje: '✅ Empleado y usuario creados correctamente' })
          } catch (authError) {
            setNotificacion({ tipo: 'success', mensaje: '⚠️ Empleado creado pero falló el acceso: ' + authError.message })
          }
        } else {
          setNotificacion({ tipo: 'success', mensaje: '✅ Empleado creado sin acceso al sistema' })
        }
      }
      setMostrarForm(false); setEditando(null)
      setForm({ dni: '', nombres: '', apellidos: '', id_cargo: '', username: '', password: '', id_rol: 2 })
      cargarDatos()
    } catch (e) { setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + e.message }) }
  }

  const handleEditar = (e) => {
    setEditando(e.id_empleado)
    setForm({
      dni: e.dni, nombres: e.nombres, apellidos: e.apellidos, id_cargo: e.id_cargo,
      username: e.Usuarios?.username || '', password: '', id_rol: e.Usuarios?.id_rol || 2
    })
    setMostrarForm(true)
  }

  // Toggle estado (Activar/Desactivar)
  const handleToggleEstado = (empleado) => {
    setConfirmToggle(empleado)
  }

  const confirmarToggle = async () => {
    if (!confirmToggle) return
    const nuevoEstado = !confirmToggle.estado
    const accion = nuevoEstado ? 'activado' : 'desactivado'
    
    const { error } = await supabase.from('Empleados').update({ estado: nuevoEstado }).eq('id_empleado', confirmToggle.id_empleado)
    if (error) {
      setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + error.message })
    } else {
      setNotificacion({ tipo: 'success', mensaje: `✅ Empleado ${accion} correctamente` })
    }
    setConfirmToggle(null)
    cargarDatos()
  }

  const filtrados = empleados.filter(e =>
    !busqueda || e.nombres?.toLowerCase().includes(busqueda.toLowerCase()) || e.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) || e.dni?.includes(busqueda)
  )

  const inputStyle = { width: '100%', background: '#050505', border: '1px solid #1A1A1A', borderRadius: 12, padding: '10px 14px', color: '#FFF', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  if (loading) {
    return (
      <div style={{ padding: 28, background: '#000', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
          <div><Skeleton width={200} height={36} /><div style={{ marginTop: 8 }}><Skeleton width={280} height={18} /></div></div>
          <Skeleton width={150} height={42} radius={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Skeleton width={52} height={52} radius="50%" />
            <div style={{ flex: 1 }}><Skeleton width="50%" height={18} /><div style={{ marginTop: 6 }}><Skeleton width="35%" height={14} /></div></div>
            <Skeleton width={90} height={32} radius={10} />
          </div>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="fade-in">
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>Empleados</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{empleados.length} empleados registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }} style={{ padding: '11px 22px' }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }} /> Nuevo empleado
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar empleado por nombre, apellido o DNI..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ ...inputStyle, maxWidth: 400, marginBottom: 20, transition: 'all 0.3s ease' }}
        onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 12px rgba(34,197,94,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = '#1A1A1A'; e.target.style.boxShadow = 'none'; }}
      />

      {/* LISTA DE EMPLEADOS COMO CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20 }}>
            <i className="ti ti-id-badge" style={{ fontSize: 48, color: '#1A1A1A', display: 'block', marginBottom: 12 }} />
            <strong style={{ color: '#FFF', display: 'block', fontSize: 16 }}>No se encontraron empleados</strong>
          </div>
        ) : filtrados.map((e, i) => {
          const colorIndex = i % hoverColors.length
          const hoverColor = hoverColors[colorIndex]
          const avatarGrad = avatarGradients[colorIndex]
          const initials = `${(e.nombres || '?')[0]}${(e.apellidos || '?')[0]}`.toUpperCase()
          const isActive = e.estado

          return (
            <div
              key={e.id_empleado}
              style={{
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid #1A1A1A',
                borderRadius: 16,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                cursor: 'default',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: `fadeUp 0.4s ${0.05 + i * 0.04}s both`,
              }}
              onMouseEnter={ev => {
                ev.currentTarget.style.background = hoverColor.bg
                ev.currentTarget.style.borderColor = hoverColor.border
                ev.currentTarget.style.boxShadow = `0 8px 28px ${hoverColor.shadow}, 0 0 40px ${hoverColor.shadow}40`
                ev.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
              }}
              onMouseLeave={ev => {
                ev.currentTarget.style.background = 'rgba(10, 10, 10, 0.7)'
                ev.currentTarget.style.borderColor = '#1A1A1A'
                ev.currentTarget.style.boxShadow = 'none'
                ev.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              {/* Avatar con gradiente */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: avatarGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
                color: '#FFF',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${hoverColor.shadow}`,
              }}>
                {initials}
              </div>

              {/* Información principal */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 16, fontWeight: 700, color: '#FFF', display: 'block', letterSpacing: '-0.01em' }}>
                  {e.nombres} {e.apellidos}
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>
                    {e.Cargos?.nombre_cargo || 'Sin cargo'}
                  </span>
                  <span style={{ color: '#333' }}>•</span>
                  {e.Usuarios?.username ? (
                    <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-mail" style={{ fontSize: 13 }} /> {e.Usuarios.username}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#444' }}>Sin usuario</span>
                  )}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#555' }}>
                    DNI: {e.dni}
                  </span>
                </div>
              </div>

              {/* Estado + Botones */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                {/* Badge de estado */}
                <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? '#22C55E' : '#EF4444',
                    display: 'inline-block', marginRight: 4,
                    animation: isActive ? 'pulse 2s ease infinite' : 'none'
                  }} />
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>

                {/* Botón Editar */}
                <button
                  className="icon-btn"
                  title="Editar"
                  onClick={() => handleEditar(e)}
                  style={{
                    width: 34, height: 34, border: '1px solid #1A1A1A', borderRadius: 10, background: 'transparent',
                    color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#22C55E'; ev.currentTarget.style.color = '#22C55E'; ev.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.borderColor = '#1A1A1A'; ev.currentTarget.style.color = '#666'; ev.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="ti ti-edit" style={{ fontSize: 14 }} />
                </button>

                {/* Botón Activar/Desactivar dinámico */}
                <button
                  onClick={() => handleToggleEstado(e)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    background: isActive ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                    color: isActive ? '#EF4444' : '#22C55E',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={ev => {
                    ev.currentTarget.style.background = isActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'
                    ev.currentTarget.style.borderColor = isActive ? '#EF4444' : '#22C55E'
                  }}
                  onMouseLeave={ev => {
                    ev.currentTarget.style.background = isActive ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)'
                    ev.currentTarget.style.borderColor = isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'
                  }}
                >
                  <i className={`ti ${isActive ? 'ti-toggle-off' : 'ti-toggle-on'}`} style={{ fontSize: 13 }} />
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={ev => ev.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#FFF' }}>{editando ? 'Editar empleado' : 'Nuevo empleado'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} placeholder="DNI (8 dígitos)" maxLength={8} value={form.dni} onChange={ev => setForm({ ...form, dni: ev.target.value })} required />
              <input style={inputStyle} placeholder="Nombres" value={form.nombres} onChange={ev => setForm({ ...form, nombres: ev.target.value })} required />
              <input style={inputStyle} placeholder="Apellidos" value={form.apellidos} onChange={ev => setForm({ ...form, apellidos: ev.target.value })} required />
              <select style={selectStyle} value={form.id_cargo} onChange={ev => setForm({ ...form, id_cargo: ev.target.value })} required>
                <option value="">Seleccionar cargo</option>
                {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>)}
              </select>

              <hr style={{ border: 'none', borderTop: '1px solid #1A1A1A', margin: '4px 0' }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#22C55E' }}>🔐 Acceso al sistema (opcional)</p>
              <input style={inputStyle} type="email" placeholder="Email / Usuario" value={form.username} onChange={ev => setForm({ ...form, username: ev.target.value })} />
              <input style={inputStyle} type="password" placeholder="Contraseña" value={form.password} onChange={ev => setForm({ ...form, password: ev.target.value })} />
              <select style={selectStyle} value={form.id_rol} onChange={ev => setForm({ ...form, id_rol: parseInt(ev.target.value) })}>
                <option value={1}>Administrador</option>
                <option value={2}>Vendedor</option>
                <option value={3}>Farmacéutico</option>
                <option value={4}>Almacenero</option>
              </select>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear empleado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN TOGGLE */}
      {confirmToggle && (
        <div className="modal-overlay" onClick={() => setConfirmToggle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: confirmToggle.estado ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24
            }}>
              {confirmToggle.estado ? '⚠️' : '✅'}
            </div>
            <h3 style={{ color: '#FFF', margin: '0 0 6px' }}>
              ¿{confirmToggle.estado ? 'Desactivar' : 'Activar'} este empleado?
            </h3>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
              {confirmToggle.estado
                ? 'El empleado no podrá acceder al sistema hasta que sea reactivado.'
                : 'El empleado podrá acceder nuevamente al sistema.'}
            </p>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 13 }}>
              {confirmToggle.nombres} {confirmToggle.apellidos}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmToggle(null)}>Cancelar</button>
              <button
                onClick={confirmarToggle}
                style={{
                  padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  background: confirmToggle.estado ? '#EF4444' : '#22C55E',
                  color: '#FFF',
                  boxShadow: confirmToggle.estado ? '0 6px 18px rgba(239,68,68,0.25)' : '0 6px 18px rgba(34,197,94,0.25)',
                }}
              >
                Sí, {confirmToggle.estado ? 'desactivar' : 'activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIÓN */}
      {notificacion && (
        <div className="modal-overlay" onClick={() => setNotificacion(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: notificacion.tipo === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>
              {notificacion.tipo === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ color: '#FFF', fontSize: 15, margin: '0 0 18px' }}>{notificacion.mensaje}</p>
            <button className="btn btn-primary" onClick={() => setNotificacion(null)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  )
}