import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AVATAR_GRADIENTS = [
  ['#16A34A', '#059669'],
  ['#22C55E', '#0EA5E9'],
  ['#10B981', '#14B8A6'],
  ['#60A5FA', '#6366F1'],
  ['#A78BFA', '#7C3AED'],
  ['#F59E0B', '#F97316'],
]

const ROL_META = {
  1: { label: 'Admin', color: '#0EA5E9' },
  2: { label: 'Vendedor', color: '#16A34A' },
  3: { label: 'Farmaceutico', color: '#7C3AED' },
  4: { label: 'Almacenero', color: '#D97706' },
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

.em {
  --surface: #FFFFFF;
  --soft: #F8FAFC;
  --soft-green: #F0FDF4;
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --text: #0F172A;
  --muted: #94A3B8;
  --muted2: #64748B;
  --accent: #16A34A;
  --accent-dark: #15803D;
  --danger: #DC2626;
  --warning: #D97706;
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  min-height: calc(100vh - 56px);
  color: var(--text);
  background: #FFFFFF;
  border-radius: 20px;
}

.em * { box-sizing: border-box; }
.em-inner { padding: 4px 4px 28px; }

.em-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #FFFFFF;
  box-shadow: 0 16px 36px rgba(15, 23, 42, .07);
}

.em-header-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.em-heading-icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #FFFFFF;
  background: linear-gradient(135deg, #16A34A, #059669);
  box-shadow: 0 16px 28px rgba(22, 163, 74, .24);
  flex-shrink: 0;
}

.em-heading-icon i { font-size: 30px; }

.em-title {
  margin: 0;
  font-size: 42px;
  line-height: .95;
  letter-spacing: -.04em;
  color: var(--accent);
  font-weight: 900;
}

.em-title-sub {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--muted2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.em-header-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.em-stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--soft);
  color: var(--muted2);
  font-size: 12px;
  font-weight: 800;
}

.em-stat-pill strong { color: var(--text); font-size: 14px; }
.em-stat-pill.active { border-color: #BBF7D0; background: var(--soft-green); color: var(--accent-dark); }
.em-stat-pill.active strong { color: var(--accent-dark); }
.em-stat-pill.warn { border-color: #FED7AA; background: #FFF7ED; color: var(--warning); }
.em-stat-pill i { font-size: 18px; }

.em-btn {
  border: none;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  cursor: pointer;
  transition: all .2s ease;
  white-space: nowrap;
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 800;
}

.em-btn i { font-size: 18px; }
.em-btn-accent { background: var(--accent); color: #FFFFFF; padding: 13px 22px; box-shadow: 0 12px 24px rgba(22, 163, 74, .22); }
.em-btn-accent:hover { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(22, 163, 74, .28); }
.em-btn-ghost { background: #FFFFFF; color: var(--muted2); padding: 11px 20px; border: 1px solid var(--border); }
.em-btn-ghost:hover { background: var(--soft); color: var(--text); }
.em-btn-danger { background: var(--danger); color: #FFFFFF; padding: 11px 20px; box-shadow: 0 10px 22px rgba(220, 38, 38, .18); }
.em-btn-success { background: var(--accent); color: #FFFFFF; padding: 11px 20px; box-shadow: 0 10px 22px rgba(22, 163, 74, .18); }

.em-search-wrap {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #FFFFFF;
  box-shadow: 0 10px 24px rgba(15, 23, 42, .05);
}

.em-search-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.em-search-row { display: flex; align-items: center; gap: 12px; }

.em-search-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid #BBF7D0;
  border-radius: 13px;
  background: var(--soft-green);
  color: var(--accent);
  flex-shrink: 0;
}

.em-search-icon i { font-size: 21px; }

.em-search {
  width: 100%;
  max-width: 620px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--soft);
  color: var(--text);
  outline: none;
  transition: border-color .25s, box-shadow .25s, background .25s;
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
}

.em-search::placeholder { color: var(--muted); font-weight: 400; }
.em-search:focus { background: #FFFFFF; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(22, 163, 74, .12); }

.em-list { display: flex; flex-direction: column; gap: 12px; }

.em-row {
  display: grid;
  grid-template-columns: 54px 50px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 17px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #FFFFFF;
  position: relative;
  transition: all .25s cubic-bezier(.16, 1, .3, 1);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .045);
}

.em-row::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 16px;
  bottom: 16px;
  width: 5px;
  border-radius: 999px;
  background: var(--accent);
}

.em-row:hover { transform: translateY(-3px); border-color: #86EFAC; box-shadow: 0 18px 34px rgba(15, 23, 42, .09); }
.em-row.inactive-row { opacity: .68; }
.em-row.inactive-row::before { background: var(--danger); }
.em-row.inactive-row:hover { opacity: 1; }

.em-row-num {
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 800;
  user-select: none;
}

.em-avatar {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .02em;
  flex-shrink: 0;
  transition: transform .25s;
}

.em-row:hover .em-avatar { transform: scale(1.08); }

.em-name {
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.em-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px; margin-top: 7px; }

.em-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.em-meta-item i {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 1px solid #DCFCE7;
  border-radius: 8px;
  background: var(--soft-green);
  color: var(--accent);
  font-size: 13px;
  flex-shrink: 0;
}

.em-cargo-badge,
.em-role-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.em-cargo-badge { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.em-role-badge { background: #F8FAFC; border: 1px solid currentColor; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .06em; }

.em-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.em-icon-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #BBF7D0;
  border-radius: 12px;
  background: var(--soft-green);
  color: var(--accent);
  cursor: pointer;
  transition: all .18s ease;
  font-size: 17px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, .05);
}

.em-icon-btn:hover { transform: translateY(-2px); color: #FFFFFF; background: var(--accent); border-color: var(--accent); }

.em-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid;
  transition: all .2s ease;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: .04em;
  background: #FFFFFF;
}

.em-toggle-pill.active { color: var(--accent-dark); border-color: #BBF7D0; background: var(--soft-green); }
.em-toggle-pill.inactive { color: var(--danger); border-color: #FECACA; background: #FEF2F2; }
.em-toggle-pill:hover { transform: translateY(-2px); }

.em-empty {
  padding: 70px 20px;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: 20px;
  background: var(--soft);
}

.em-empty-title { margin: 16px 0 8px; color: var(--muted2); font-size: 24px; font-weight: 900; letter-spacing: -.02em; }

.em-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, .35);
  backdrop-filter: blur(8px);
  animation: em-fade .2s ease;
}

.em-modal {
  width: 100%;
  max-width: 520px;
  padding: 34px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: #FFFFFF;
  box-shadow: 0 30px 70px rgba(15, 23, 42, .18);
  animation: em-scale .3s cubic-bezier(.16, 1, .3, 1);
}

.em-modal-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--soft-green);
  color: var(--accent);
}

.em-modal-icon i { font-size: 22px; }
.em-modal-title { margin: 0 0 4px; color: var(--text); font-size: 24px; font-weight: 900; letter-spacing: -.02em; }
.em-modal-sub { margin-bottom: 26px; color: var(--muted2); font-size: 13px; }
.em-divider { height: 1px; margin: 20px 0; background: var(--border); }

.em-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--accent-dark);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.em-section-label::after { content: ''; flex: 1; height: 1px; background: #BBF7D0; }
.em-label { display: block; margin-bottom: 7px; color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }
.em-field { margin-bottom: 16px; }

.em-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--soft);
  color: var(--text);
  outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  font-size: 14px;
}

.em-input::placeholder { color: var(--muted); }
.em-input:focus { background: #FFFFFF; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(22, 163, 74, .12); }
.em-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2316A34A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 38px; }
.em-input option { background: #FFFFFF; color: var(--text); }
.em-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.em-modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 26px; }

.em-toast {
  position: fixed;
  bottom: 32px;
  left: 40px;
  z-index: 1001;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 14px;
  background: #FFFFFF;
  box-shadow: 0 18px 42px rgba(15, 23, 42, .14);
  cursor: pointer;
  animation: em-slide .32s cubic-bezier(.16, 1, .3, 1);
}

.em-toast.err { border-left-color: var(--danger); }
.em-toast.warn { border-left-color: var(--warning); }
.em-toast-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
.em-toast-icon.ok { background: var(--soft-green); color: var(--accent); }
.em-toast-icon.err { background: #FEF2F2; color: var(--danger); }
.em-toast-icon.warn { background: #FFF7ED; color: var(--warning); }

.em-skel { background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%); background-size: 200% 100%; border-radius: 8px; animation: em-shimmer 1.6s infinite; }

@keyframes em-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes em-scale { from { opacity: 0; transform: scale(.94) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
@keyframes em-slide { from { opacity: 0; transform: translateX(-24px) } to { opacity: 1; transform: translateX(0) } }
@keyframes em-shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes em-up { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
@keyframes em-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }

.em-anim-up { animation: em-up .4s ease both; }
.em-pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: em-pulse 2s infinite; display: inline-block; box-shadow: 0 0 0 4px rgba(22, 163, 74, .12); }
.em-pulse-dot.red { background: var(--danger); box-shadow: 0 0 0 4px rgba(220, 38, 38, .12); }

@media (max-width: 820px) {
  .em-header { align-items: flex-start; flex-direction: column; }
  .em-header-tools { width: 100%; justify-content: space-between; }
  .em-title { font-size: 34px; }
  .em-row { grid-template-columns: 42px 1fr; gap: 12px; }
  .em-avatar { display: none; }
  .em-actions { grid-column: 1 / -1; justify-content: flex-end; }
  .em-grid2 { grid-template-columns: 1fr; gap: 0; }
}
`

function InjectCSS() {
  useEffect(() => {
    let el = document.getElementById('em-css')
    if (!el) {
      el = document.createElement('style')
      el.id = 'em-css'
      document.head.appendChild(el)
    }
    el.textContent = CSS
  }, [])
  return null
}

function Skel({ w, h, r = 8 }) {
  return <div className="em-skel" style={{ width: w || '100%', height: h || 18, borderRadius: r }} />
}

function getRelation(value) {
  return Array.isArray(value) ? value[0] : value
}

function Toast({ data, onClose }) {
  const t = useRef()

  useEffect(() => {
    t.current = setTimeout(onClose, 4000)
    return () => clearTimeout(t.current)
  }, [onClose])

  const isWarn = data.tipo === 'warning'
  const isOk = data.tipo === 'success'
  const icon = isOk ? 'ti-check' : isWarn ? 'ti-alert-triangle' : 'ti-alert-circle'
  const iconClass = isOk ? 'ok' : isWarn ? 'warn' : 'err'

  return (
    <div className={`em-toast${isOk ? '' : isWarn ? ' warn' : ' err'}`} onClick={onClose}>
      <span className={`em-toast-icon ${iconClass}`}>
        <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
      </span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
          {isOk ? 'Listo' : isWarn ? 'Atencion' : 'Error'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.4 }}>{data.mensaje}</p>
      </div>
    </div>
  )
}

function Modal({ onClose, children, maxW = 520 }) {
  return (
    <div className="em-overlay" onClick={onClose}>
      <div className="em-modal" style={{ maxWidth: maxW }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [notificacion, setNotificacion] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = { dni: '', nombres: '', apellidos: '', id_cargo: '', username: '', password: '', id_rol: 2 }
  const [form, setForm] = useState(emptyForm)
  const sf = (key, value) => setForm(current => ({ ...current, [key]: value }))

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [{ data: emp, error: empError }, { data: car, error: carError }] = await Promise.all([
        supabase.from('Empleados').select('*, Cargos(*), Usuarios(*)').order('apellidos'),
        supabase.from('Cargos').select('*').order('nombre_cargo'),
      ])

      if (empError) throw empError
      if (carError) throw carError

      setEmpleados(emp || [])
      setCargos(car || [])
    } catch (error) {
      setEmpleados([])
      setCargos([])
      setNotificacion({ tipo: 'error', mensaje: error.message || 'No se pudieron cargar los empleados' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (!form.dni || !form.nombres || !form.apellidos || !form.id_cargo) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' })
      return
    }

    if (!editando && ((form.username && !form.password) || (!form.username && form.password))) {
      setNotificacion({ tipo: 'error', mensaje: 'Para crear acceso debes ingresar email y contrasena' })
      return
    }

    setSaving(true)

    try {
      const employeePayload = {
        dni: form.dni.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        id_cargo: Number(form.id_cargo),
      }

      if (editando) {
        const { error } = await supabase
          .from('Empleados')
          .update(employeePayload)
          .eq('id_empleado', editando)

        if (error) throw error
        setNotificacion({ tipo: 'success', mensaje: 'Empleado actualizado correctamente' })
      } else {
        const { data: empleado, error } = await supabase
          .from('Empleados')
          .insert(employeePayload)
          .select('id_empleado')
          .single()

        if (error) throw error

        if (form.username && form.password) {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                email: form.username.trim(),
                password: form.password,
                id_empleado: empleado.id_empleado,
                id_rol: Number(form.id_rol),
              }),
            })

            if (!response.ok) {
              const err = await response.json().catch(() => ({}))
              throw new Error(err.error || 'Error al crear usuario')
            }

            setNotificacion({ tipo: 'success', mensaje: 'Empleado y usuario creados correctamente' })
          } catch (authError) {
            setNotificacion({ tipo: 'warning', mensaje: `Empleado creado, pero fallo el acceso: ${authError.message}` })
          }
        } else {
          setNotificacion({ tipo: 'success', mensaje: 'Empleado creado sin acceso al sistema' })
        }
      }

      setMostrarForm(false)
      setEditando(null)
      setForm(emptyForm)
      cargarDatos()
    } catch (error) {
      setNotificacion({ tipo: 'error', mensaje: error.message || 'No se pudo guardar el empleado' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditar = empleado => {
    const user = getRelation(empleado.Usuarios)

    setEditando(empleado.id_empleado)
    setForm({
      dni: empleado.dni || '',
      nombres: empleado.nombres || '',
      apellidos: empleado.apellidos || '',
      id_cargo: empleado.id_cargo || '',
      username: user?.username || '',
      password: '',
      id_rol: user?.id_rol || 2,
    })
    setMostrarForm(true)
  }

  const confirmarToggle = async () => {
    if (!confirmToggle) return

    const nuevoEstado = !confirmToggle.estado
    const { error } = await supabase
      .from('Empleados')
      .update({ estado: nuevoEstado })
      .eq('id_empleado', confirmToggle.id_empleado)

    if (error) {
      setNotificacion({ tipo: 'error', mensaje: error.message || 'No se pudo cambiar el estado' })
    } else {
      setNotificacion({ tipo: 'success', mensaje: `Empleado ${nuevoEstado ? 'activado' : 'desactivado'} correctamente` })
    }

    setConfirmToggle(null)
    cargarDatos()
  }

  const searchTerm = busqueda.trim().toLowerCase()
  const filtrados = empleados.filter(empleado => {
    if (!searchTerm) return true

    const cargo = getRelation(empleado.Cargos)
    const user = getRelation(empleado.Usuarios)

    return [
      empleado.nombres,
      empleado.apellidos,
      empleado.dni,
      cargo?.nombre_cargo,
      user?.username,
    ].some(value => String(value || '').toLowerCase().includes(searchTerm))
  })

  const activos = empleados.filter(empleado => empleado.estado).length
  const inactivos = empleados.filter(empleado => !empleado.estado).length

  if (loading) {
    return (
      <div className="em">
        <InjectCSS />
        <div className="em-inner">
          <div className="em-header">
            <div className="em-header-main">
              <Skel w={58} h={58} r={18} />
              <div>
                <Skel w={240} h={42} r={8} />
                <div style={{ marginTop: 12 }}><Skel w={220} h={13} /></div>
              </div>
            </div>
            <Skel w={164} h={48} r={13} />
          </div>
          <div className="em-search-wrap"><Skel w={420} h={44} r={13} /></div>
          <div className="em-list">
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className="em-row">
                <Skel w={32} h={18} />
                <Skel w={46} h={46} r={15} />
                <div>
                  <Skel w="45%" h={18} />
                  <div style={{ marginTop: 10 }}><Skel w="62%" h={14} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skel w={38} h={38} r={12} />
                  <Skel w={92} h={38} r={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="em">
      <InjectCSS />

      <div className="em-inner">
        <div className="em-header em-anim-up">
          <div className="em-header-main">
            <div className="em-heading-icon">
              <i className="ti ti-id-badge-2" />
            </div>
            <div>
              <h1 className="em-title">Empleados</h1>
              <div className="em-title-sub">
                <span className="em-pulse-dot" />
                <span>Gestion del personal y accesos</span>
                {busqueda && filtrados.length !== empleados.length && (
                  <span style={{ color: 'var(--accent)', marginLeft: 4 }}>/ {filtrados.length} filtrados</span>
                )}
              </div>
            </div>
          </div>

          <div className="em-header-tools">
            <div className="em-stat-pill active">
              <i className="ti ti-user-check" />
              <strong>{activos}</strong> activos
            </div>
            {inactivos > 0 && (
              <div className="em-stat-pill warn">
                <i className="ti ti-user-x" />
                <strong>{inactivos}</strong> inactivos
              </div>
            )}
            <button className="em-btn em-btn-accent" onClick={() => { setEditando(null); setForm(emptyForm); setMostrarForm(true) }}>
              <i className="ti ti-user-plus" /> Nuevo empleado
            </button>
          </div>
        </div>

        <div className="em-search-wrap em-anim-up" style={{ animationDelay: '.06s' }}>
          <span className="em-search-label">Busqueda</span>
          <div className="em-search-row">
            <span className="em-search-icon">
              <i className="ti ti-search" />
            </span>
            <input
              className="em-search"
              placeholder="Nombre, apellido, cargo, usuario o DNI"
              value={busqueda}
              onChange={event => setBusqueda(event.target.value)}
            />
          </div>
        </div>

        <div className="em-list">
          {filtrados.length === 0 ? (
            <div className="em-empty em-anim-up">
              <i className="ti ti-id-badge-2" style={{ fontSize: 42, color: 'var(--muted)', display: 'block' }} />
              <div className="em-empty-title">{busqueda ? 'Sin resultados' : 'Sin empleados'}</div>
              <p style={{ color: 'var(--muted2)', fontSize: 13, margin: 0 }}>
                {busqueda ? `No hay coincidencias para "${busqueda}"` : 'Agrega tu primer empleado arriba'}
              </p>
            </div>
          ) : filtrados.map((empleado, index) => {
            const cargo = getRelation(empleado.Cargos)
            const user = getRelation(empleado.Usuarios)
            const rolInfo = ROL_META[user?.id_rol] || null
            const pal = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
            const init = `${(empleado.nombres || '?')[0]}${(empleado.apellidos || '?')[0]}`.toUpperCase()
            const isActive = Boolean(empleado.estado)

            return (
              <div
                key={empleado.id_empleado}
                className={`em-row em-anim-up${isActive ? '' : ' inactive-row'}`}
                style={{ animationDelay: `${0.04 + index * 0.035}s` }}
              >
                <div className="em-row-num">{String(index + 1).padStart(2, '0')}</div>

                <div
                  className="em-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})`,
                    boxShadow: `0 4px 20px ${pal[0]}44`,
                  }}
                >
                  {init}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="em-name">{empleado.nombres} {empleado.apellidos}</span>
                    {rolInfo && (
                      <span className="em-role-badge" style={{ color: rolInfo.color, borderColor: `${rolInfo.color}55` }}>
                        {rolInfo.label}
                      </span>
                    )}
                  </div>

                  <div className="em-meta">
                    <span className="em-meta-item"><i className="ti ti-id" />{empleado.dni}</span>
                    <span className="em-cargo-badge">{cargo?.nombre_cargo || 'Sin cargo'}</span>
                    {user?.username ? (
                      <span className="em-meta-item"><i className="ti ti-at" />{user.username}</span>
                    ) : (
                      <span className="em-meta-item" style={{ color: 'var(--muted)' }}>
                        <i className="ti ti-lock-off" />sin acceso
                      </span>
                    )}
                  </div>
                </div>

                <div className="em-actions">
                  <button className="em-icon-btn" title="Editar" onClick={() => handleEditar(empleado)}>
                    <i className="ti ti-edit" />
                  </button>
                  <button
                    className={`em-toggle-pill ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => setConfirmToggle(empleado)}
                  >
                    <span className={`em-pulse-dot${isActive ? '' : ' red'}`} style={{ animation: isActive ? undefined : 'none' }} />
                    {isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {mostrarForm && (
        <Modal onClose={() => setMostrarForm(false)}>
          <div className="em-modal-icon">
            <i className="ti ti-user-plus" />
          </div>
          <h2 className="em-modal-title">{editando ? 'Editar empleado' : 'Nuevo empleado'}</h2>
          <p className="em-modal-sub">
            {editando ? 'Actualiza los datos del empleado.' : 'Completa la informacion del nuevo empleado.'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="em-field">
              <label className="em-label">DNI *</label>
              <input
                className="em-input"
                placeholder="00000000"
                maxLength={8}
                value={form.dni}
                onChange={event => sf('dni', event.target.value)}
                required
              />
            </div>

            <div className="em-grid2">
              <div className="em-field">
                <label className="em-label">Nombres *</label>
                <input className="em-input" placeholder="Nombres" value={form.nombres} onChange={event => sf('nombres', event.target.value)} required />
              </div>
              <div className="em-field">
                <label className="em-label">Apellidos *</label>
                <input className="em-input" placeholder="Apellidos" value={form.apellidos} onChange={event => sf('apellidos', event.target.value)} required />
              </div>
            </div>

            <div className="em-field">
              <label className="em-label">Cargo *</label>
              <select className="em-input em-select" value={form.id_cargo} onChange={event => sf('id_cargo', event.target.value)} required>
                <option value="">Seleccionar cargo</option>
                {cargos.map(cargo => <option key={cargo.id_cargo} value={cargo.id_cargo}>{cargo.nombre_cargo}</option>)}
              </select>
            </div>

            {!editando && (
              <>
                <div className="em-divider" />
                <div className="em-section-label">
                  <i className="ti ti-lock" /> Acceso al sistema opcional
                </div>
                <div className="em-grid2">
                  <div className="em-field">
                    <label className="em-label">Email / Usuario</label>
                    <input className="em-input" type="email" placeholder="correo@dominio.com" value={form.username} onChange={event => sf('username', event.target.value)} />
                  </div>
                  <div className="em-field">
                    <label className="em-label">Contrasena</label>
                    <input className="em-input" type="password" placeholder="********" value={form.password} onChange={event => sf('password', event.target.value)} />
                  </div>
                </div>
                <div className="em-field">
                  <label className="em-label">Rol del sistema</label>
                  <select className="em-input em-select" value={form.id_rol} onChange={event => sf('id_rol', Number(event.target.value))}>
                    <option value={1}>Administrador</option>
                    <option value={2}>Vendedor</option>
                    <option value={3}>Farmaceutico</option>
                    <option value={4}>Almacenero</option>
                  </select>
                </div>
              </>
            )}

            <div className="em-divider" />
            <div className="em-modal-actions">
              <button type="button" className="em-btn em-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button type="submit" className="em-btn em-btn-accent" disabled={saving} style={{ opacity: saving ? .7 : 1 }}>
                {saving ? <><i className="ti ti-loader-2" /> Guardando...</> : editando ? 'Guardar cambios' : 'Crear empleado'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmToggle && (
        <Modal onClose={() => setConfirmToggle(null)} maxW={420}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              className="em-modal-icon"
              style={{
                background: confirmToggle.estado ? '#FEF2F2' : '#F0FDF4',
                color: confirmToggle.estado ? 'var(--danger)' : 'var(--accent)',
                margin: '0 auto 20px',
              }}
            >
              <i className={`ti ${confirmToggle.estado ? 'ti-user-x' : 'ti-user-check'}`} />
            </div>
            <h2 className="em-modal-title">
              {confirmToggle.estado ? 'Desactivar empleado' : 'Activar empleado'}
            </h2>
            <p style={{ color: 'var(--accent-dark)', margin: '10px 0 6px', fontWeight: 800 }}>
              {confirmToggle.nombres} {confirmToggle.apellidos}
            </p>
            <p style={{ color: 'var(--muted2)', fontSize: 13, lineHeight: 1.6, margin: '0 0 32px' }}>
              {confirmToggle.estado
                ? 'El registro quedara inactivo hasta que lo reactives.'
                : 'El registro volvera a quedar activo.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="em-btn em-btn-ghost" onClick={() => setConfirmToggle(null)}>Cancelar</button>
              {confirmToggle.estado
                ? <button className="em-btn em-btn-danger" onClick={confirmarToggle}>Si, desactivar</button>
                : <button className="em-btn em-btn-success" onClick={confirmarToggle}>Si, activar</button>}
            </div>
          </div>
        </Modal>
      )}

      {notificacion && <Toast data={notificacion} onClose={() => setNotificacion(null)} />}
    </div>
  )
}
