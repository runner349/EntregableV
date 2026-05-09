import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// COLORES VIBRANTES PARA HOVER
// ============================================
const hoverColors = [
  { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.5)', shadow: 'rgba(34, 197, 94, 0.2)' },   // Verde neón
  { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.5)', shadow: 'rgba(6, 182, 212, 0.2)' },    // Cyan
  { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.5)', shadow: 'rgba(249, 115, 22, 0.2)' }, // Naranja
  { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.5)', shadow: 'rgba(168, 85, 247, 0.2)' }, // Púrpura
  { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.5)', shadow: 'rgba(236, 72, 153, 0.2)' }, // Rosa
  { bg: 'rgba(250, 204, 21, 0.08)', border: 'rgba(250, 204, 21, 0.5)', shadow: 'rgba(250, 204, 21, 0.2)' }, // Amarillo
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

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [form, setForm] = useState({
    tipo_documento: 'DNI', numero_documento: '', nombres_razon_social: '',
    direccion: '', telefono: '', email: ''
  })

  useEffect(() => { cargarClientes() }, [])

  const cargarClientes = async () => {
    setLoading(true)
    const { data } = await supabase.from('Clientes').select('*').eq('estado', true).order('nombres_razon_social')
    setClientes(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.numero_documento || !form.nombres_razon_social) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' }); return
    }
    try {
      if (editando) {
        await supabase.from('Clientes').update(form).eq('id_cliente', editando)
        setNotificacion({ tipo: 'success', mensaje: '✅ Cliente actualizado correctamente' })
      } else {
        await supabase.from('Clientes').insert(form)
        setNotificacion({ tipo: 'success', mensaje: '✅ Cliente creado correctamente' })
      }
      setMostrarForm(false); setEditando(null)
      setForm({ tipo_documento: 'DNI', numero_documento: '', nombres_razon_social: '', direccion: '', telefono: '', email: '' })
      cargarClientes()
    } catch (e) { setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + e.message }) }
  }

  const handleEditar = (c) => {
    setEditando(c.id_cliente)
    setForm({
      tipo_documento: c.tipo_documento || 'DNI', numero_documento: c.numero_documento,
      nombres_razon_social: c.nombres_razon_social, direccion: c.direccion || '',
      telefono: c.telefono || '', email: c.email || ''
    })
    setMostrarForm(true)
  }

  const handleEliminar = (id) => setConfirmDelete(id)

  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    await supabase.from('Clientes').update({ estado: false }).eq('id_cliente', confirmDelete)
    setNotificacion({ tipo: 'success', mensaje: '🗑️ Cliente eliminado correctamente' })
    setConfirmDelete(null); cargarClientes()
  }

  const filtrados = clientes.filter(c =>
    !busqueda || c.nombres_razon_social?.toLowerCase().includes(busqueda.toLowerCase()) || c.numero_documento?.includes(busqueda)
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
            <Skeleton width={48} height={48} radius="50%" />
            <div style={{ flex: 1 }}><Skeleton width="60%" height={18} /><div style={{ marginTop: 6 }}><Skeleton width="40%" height={14} /></div></div>
            <Skeleton width={80} height={28} />
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
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>Clientes</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{clientes.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }} style={{ padding: '11px 22px' }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }} /> Nuevo cliente
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar por nombre o documento..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ ...inputStyle, maxWidth: 380, marginBottom: 20, transition: 'all 0.3s ease' }}
        onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 12px rgba(34,197,94,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = '#1A1A1A'; e.target.style.boxShadow = 'none'; }}
      />

      {/* LISTA DE CLIENTES COMO CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20 }}>
            <i className="ti ti-users" style={{ fontSize: 48, color: '#1A1A1A', display: 'block', marginBottom: 12 }} />
            <strong style={{ color: '#FFF', display: 'block', fontSize: 16 }}>No se encontraron clientes</strong>
            <p style={{ color: '#666', margin: '6px 0 0' }}>Intenta con otro término de búsqueda</p>
          </div>
        ) : filtrados.map((c, i) => {
          const colorIndex = i % hoverColors.length
          const hoverColor = hoverColors[colorIndex]
          const avatarGrad = avatarGradients[colorIndex]
          const initials = (c.nombres_razon_social || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div
              key={c.id_cliente}
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
              onMouseEnter={e => {
                e.currentTarget.style.background = hoverColor.bg
                e.currentTarget.style.borderColor = hoverColor.border
                e.currentTarget.style.boxShadow = `0 8px 28px ${hoverColor.shadow}, 0 0 40px ${hoverColor.shadow}40`
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(10, 10, 10, 0.7)'
                e.currentTarget.style.borderColor = '#1A1A1A'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              {/* Avatar con gradiente */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: avatarGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
                color: '#FFF',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${hoverColor.shadow}`,
              }}>
                {initials}
              </div>

              {/* Información principal */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15, fontWeight: 700, color: '#FFF', letterSpacing: '-0.01em' }}>
                    {c.nombres_razon_social}
                  </strong>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: c.tipo_documento === 'RUC' ? 'rgba(34,197,94,0.15)' : c.tipo_documento === 'CE' ? 'rgba(249,115,22,0.15)' : 'rgba(6,182,212,0.15)',
                    color: c.tipo_documento === 'RUC' ? '#22C55E' : c.tipo_documento === 'CE' ? '#F97316' : '#06B6D4',
                  }}>
                    {c.tipo_documento}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-id" style={{ fontSize: 13 }} /> {c.numero_documento}
                  </span>
                  {c.telefono && (
                    <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-phone" style={{ fontSize: 13 }} /> {c.telefono}
                    </span>
                  )}
                  {c.direccion && (
                    <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 13 }} /> {c.direccion}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="icon-btn"
                  title="Editar"
                  onClick={() => handleEditar(c)}
                  style={{
                    width: 36, height: 36, border: '1px solid #1A1A1A', borderRadius: 10, background: 'transparent',
                    color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="ti ti-edit" style={{ fontSize: 15 }} />
                </button>
                <button
                  className="icon-btn danger"
                  title="Eliminar"
                  onClick={() => handleEliminar(c.id_cliente)}
                  style={{
                    width: 36, height: 36, border: '1px solid #1A1A1A', borderRadius: 10, background: 'transparent',
                    color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#FFF' }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select style={selectStyle} value={form.tipo_documento} onChange={e => setForm({ ...form, tipo_documento: e.target.value })}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">CE</option>
              </select>
              <input style={inputStyle} placeholder="N° documento" value={form.numero_documento} onChange={e => setForm({ ...form, numero_documento: e.target.value })} required />
              <input style={inputStyle} placeholder="Nombre / Razón social" value={form.nombres_razon_social} onChange={e => setForm({ ...form, nombres_razon_social: e.target.value })} required />
              <input style={inputStyle} placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              <input style={inputStyle} placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>⚠️</div>
            <h3 style={{ color: '#FFF', margin: '0 0 6px' }}>¿Eliminar este cliente?</h3>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Esta acción desactivará el cliente del sistema.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarEliminar}>Sí, eliminar</button>
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