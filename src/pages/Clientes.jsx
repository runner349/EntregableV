import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  const [form, setForm] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombres_razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('Clientes')
      .select('*')
      .eq('estado', true)
      .order('nombres_razon_social')

    setClientes(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.numero_documento || !form.nombres_razon_social) {
      return alert('Completa los campos obligatorios')
    }

    if (editando) {
      const { error } = await supabase
        .from('Clientes')
        .update(form)
        .eq('id_cliente', editando)

      if (error) return alert('Error: ' + error.message)
    } else {
      const { error } = await supabase
        .from('Clientes')
        .insert(form)

      if (error) return alert('Error: ' + error.message)
    }

    setMostrarForm(false)
    setEditando(null)
    setForm({ tipo_documento: 'DNI', numero_documento: '', nombres_razon_social: '', direccion: '', telefono: '', email: '' })
    cargarClientes()
  }

  const handleEditar = (c) => {
    setEditando(c.id_cliente)
    setForm({
      tipo_documento: c.tipo_documento || 'DNI',
      numero_documento: c.numero_documento,
      nombres_razon_social: c.nombres_razon_social,
      direccion: c.direccion || '',
      telefono: c.telefono || '',
      email: c.email || ''
    })
    setMostrarForm(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Desactivar este cliente?')) return

    const { error } = await supabase
      .from('Clientes')
      .update({ estado: false })
      .eq('id_cliente', id)

    if (error) return alert('Error: ' + error.message)
    cargarClientes()
  }

  const filtrados = clientes.filter(c =>
    !busqueda ||
    c.nombres_razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numero_documento?.includes(busqueda)
  )

  if (loading) return <div style={{ padding: 30 }}>Cargando clientes...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input
          className="form-control"
          style={{ maxWidth: 300 }}
          placeholder="Buscar por nombre o documento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }}>
          <i className="ti ti-plus" />
          Nuevo cliente
        </button>
      </div>

      {/* Modal formulario */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select className="form-control" value={form.tipo_documento} onChange={e => setForm({ ...form, tipo_documento: e.target.value })}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">CE</option>
              </select>
              <input className="form-control" placeholder="N° documento" value={form.numero_documento} onChange={e => setForm({ ...form, numero_documento: e.target.value })} required />
              <input className="form-control" placeholder="Nombre / Razón social" value={form.nombres_razon_social} onChange={e => setForm({ ...form, nombres_razon_social: e.target.value })} required />
              <input className="form-control" placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              <input className="form-control" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              <input className="form-control" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo doc.</th>
              <th>N° documento</th>
              <th>Nombre / Razón social</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No hay clientes</td></tr>
            ) : (
              filtrados.map(c => (
                <tr key={c.id_cliente}>
                  <td><span className="badge badge-info">{c.tipo_documento}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.numero_documento}</td>
                  <td>{c.nombres_razon_social}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{c.direccion || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" title="Editar" onClick={() => handleEditar(c)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="icon-btn danger" title="Eliminar" onClick={() => handleEliminar(c.id_cliente)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}