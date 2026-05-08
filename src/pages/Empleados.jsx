import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const [form, setForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    id_cargo: '',
    username: '',
    password: '',
    id_rol: 2
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    // Cargar empleados con su cargo
    const { data: emp } = await supabase
      .from('Empleados')
      .select('*, Cargos(*), Usuarios(*)')
      .order('apellidos')

    setEmpleados(emp || [])

    // Cargar cargos disponibles
    const { data: car } = await supabase.from('Cargos').select('*')
    setCargos(car || [])

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.dni || !form.nombres || !form.apellidos || !form.id_cargo) {
      return alert('Completa los campos obligatorios')
    }

    try {
      if (editando) {
        // Editar empleado
        const { error } = await supabase
          .from('Empleados')
          .update({
            dni: form.dni,
            nombres: form.nombres,
            apellidos: form.apellidos,
            id_cargo: form.id_cargo
          })
          .eq('id_empleado', editando)

        if (error) throw error
        alert('✅ Empleado actualizado')
      } else {
        // 1. Crear empleado primero
        const { data: empleado, error: errorEmp } = await supabase
          .from('Empleados')
          .insert({
            dni: form.dni,
            nombres: form.nombres,
            apellidos: form.apellidos,
            id_cargo: form.id_cargo
          })
          .select('id_empleado')
          .single()

        if (errorEmp) {
          // Manejar error de DNI duplicado
          if (errorEmp.message?.includes('duplicate key')) {
            throw new Error('Ya existe un empleado con ese DNI')
          }
          throw errorEmp
        }

        // 2. Si tiene email y password, crear usuario
        if (form.username && form.password) {
          try {
            // 🔥 Usar la Edge Function para crear el usuario en Auth
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                  email: form.username,
                  password: form.password,
                  id_empleado: empleado.id_empleado,
                  id_rol: form.id_rol
                })
              }
            )

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Error al crear usuario')
            }

            alert('✅ Empleado y usuario creados correctamente. Ya puede iniciar sesión.')
          } catch (authError) {
            console.error('Error al crear usuario:', authError)
            alert('⚠️ Empleado creado, pero hubo un problema al crear su acceso al sistema: ' + authError.message)
          }
        } else {
          alert('✅ Empleado creado sin acceso al sistema')
        }
      }

      setMostrarForm(false)
      setEditando(null)
      setForm({ dni: '', nombres: '', apellidos: '', id_cargo: '', username: '', password: '', id_rol: 2 })
      cargarDatos()
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const handleEditar = (e) => {
    setEditando(e.id_empleado)
    setForm({
      dni: e.dni,
      nombres: e.nombres,
      apellidos: e.apellidos,
      id_cargo: e.id_cargo,
      username: e.Usuarios?.username || '',
      password: '',
      id_rol: e.Usuarios?.id_rol || 2
    })
    setMostrarForm(true)
  }

  const handleDesactivar = async (id) => {
    if (!confirm('¿Desactivar este empleado?')) return

    const { error } = await supabase
      .from('Empleados')
      .update({ estado: false })
      .eq('id_empleado', id)

    if (error) return alert('Error: ' + error.message)
    cargarDatos()
  }

  const filtrados = empleados.filter(e =>
    !busqueda ||
    e.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.dni?.includes(busqueda)
  )

  if (loading) return <div style={{ padding: 30 }}>Cargando empleados...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }}>
          <i className="ti ti-plus" />
          Nuevo empleado
        </button>
      </div>

      {/* Modal formulario */}
      {mostrarForm && (
        <div className="modal-backdrop" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar empleado' : 'Nuevo empleado'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="form-control" placeholder="DNI (8 dígitos)" maxLength={8} value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required />
              <input className="form-control" placeholder="Nombres" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required />
              <input className="form-control" placeholder="Apellidos" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required />

              <select className="form-control" value={form.id_cargo} onChange={e => setForm({ ...form, id_cargo: e.target.value })} required>
                <option value="">Seleccionar cargo</option>
                {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>)}
              </select>

              <hr />

              <p style={{ fontWeight: 600, margin: 0 }}>Acceso al sistema (opcional)</p>
              <input className="form-control" type="email" placeholder="Email/Usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              <input className="form-control" type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

              <select className="form-control" value={form.id_rol} onChange={e => setForm({ ...form, id_rol: parseInt(e.target.value) })}>
                <option value={1}>Administrador</option>
                <option value={2}>Vendedor</option>
                <option value={3}>Farmacéutico</option>
                <option value={4}>Almacenero</option>
              </select>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear empleado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre completo</th>
              <th>Cargo</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No hay empleados</td></tr>
            ) : filtrados.map(e => (
              <tr key={e.id_empleado}>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{e.dni}</td>
                <td style={{ fontWeight: 500 }}>{e.nombres} {e.apellidos}</td>
                <td><span className="badge badge-info">{e.Cargos?.nombre_cargo}</span></td>
                <td style={{ color: 'var(--gray-500)' }}>{e.Usuarios?.username || 'Sin usuario'}</td>
                <td><span className={`badge ${e.estado ? 'badge-success' : 'badge-danger'}`}>{e.estado ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" title="Editar" onClick={() => handleEditar(e)}>
                      <i className="ti ti-edit" />
                    </button>
                    <button className="icon-btn danger" title="Desactivar" onClick={() => handleDesactivar(e.id_empleado)}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}