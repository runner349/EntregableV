import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function stockBadge(stock) {
  if (stock <= 5) return <span className="badge badge-danger">{stock} u.</span>
  if (stock <= 20) return <span className="badge badge-warning">{stock} u.</span>
  return <span className="badge badge-success">{stock} u.</span>
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [laboratorios, setLaboratorios] = useState([])
  const [presentaciones, setPresentaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  // Formulario
  const [form, setForm] = useState({
    nombre_comercial: '',
    principio_activo: '',
    id_laboratorio: '',
    id_categoria: '',
    id_presentacion: '',
    stock_actual_unidades: 0,
    stock_minimo_unidades: 20,
    fecha_vencimiento: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    // Cargar productos
    const { data: prod } = await supabase
      .from('Productos')
      .select('*, Laboratorios(*), Categorias(*), Presentaciones(*), Productos_Precios(*)')
      .eq('estado', true)
      .order('nombre_comercial')

    setProductos(prod || [])

    // Cargar catálogos
    const { data: cat } = await supabase.from('Categorias').select('*')
    setCategorias(cat || [])

    const { data: lab } = await supabase.from('Laboratorios').select('*').eq('estado', true)
    setLaboratorios(lab || [])

    const { data: pres } = await supabase.from('Presentaciones').select('*')
    setPresentaciones(pres || [])

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editando) {
      // Editar producto existente
      const { error } = await supabase
        .from('Productos')
        .update(form)
        .eq('id_producto', editando)

      if (error) return alert('Error: ' + error.message)
    } else {
      // Crear nuevo producto
      const { error } = await supabase
        .from('Productos')
        .insert(form)

      if (error) return alert('Error: ' + error.message)
    }

    setMostrarForm(false)
    setEditando(null)
    setForm({ nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '', id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20, fecha_vencimiento: '' })
    cargarDatos()
  }

  const handleEditar = (p) => {
    setEditando(p.id_producto)
    setForm({
      nombre_comercial: p.nombre_comercial,
      principio_activo: p.principio_activo || '',
      id_laboratorio: p.id_laboratorio,
      id_categoria: p.id_categoria,
      id_presentacion: p.id_presentacion,
      stock_actual_unidades: p.stock_actual_unidades,
      stock_minimo_unidades: p.stock_minimo_unidades,
      fecha_vencimiento: p.fecha_vencimiento || ''
    })
    setMostrarForm(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return

    const { error } = await supabase
      .from('Productos')
      .update({ estado: false })
      .eq('id_producto', id)

    if (error) return alert('Error: ' + error.message)
    cargarDatos()
  }

  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.Categorias?.nombre_categoria).filter(Boolean))]

  const filtrados = productos.filter(p => {
    const matchBusq = !busqueda || 
      p.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = categoria === 'Todas' || p.Categorias?.nombre_categoria === categoria
    return matchBusq && matchCat
  })

  if (loading) return <div style={{ padding: 30 }}>Cargando productos...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Buscar medicamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        >
          {categoriasUnicas.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }}>
          <i className="ti ti-plus" />
          Nuevo producto
        </button>
      </div>

      {/* Formulario Modal */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="form-control" placeholder="Nombre comercial" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} required />
              <input className="form-control" placeholder="Principio activo" value={form.principio_activo} onChange={e => setForm({ ...form, principio_activo: e.target.value })} />
              
              <select className="form-control" value={form.id_laboratorio} onChange={e => setForm({ ...form, id_laboratorio: e.target.value })} required>
                <option value="">Seleccionar laboratorio</option>
                {laboratorios.map(l => <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre_laboratorio}</option>)}
              </select>

              <select className="form-control" value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })} required>
                <option value="">Seleccionar categoría</option>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>

              <select className="form-control" value={form.id_presentacion} onChange={e => setForm({ ...form, id_presentacion: e.target.value })} required>
                <option value="">Seleccionar presentación</option>
                {presentaciones.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre_presentacion}</option>)}
              </select>

              <input className="form-control" type="number" placeholder="Stock actual" value={form.stock_actual_unidades} onChange={e => setForm({ ...form, stock_actual_unidades: parseInt(e.target.value) })} required />
              <input className="form-control" type="number" placeholder="Stock mínimo" value={form.stock_minimo_unidades} onChange={e => setForm({ ...form, stock_minimo_unidades: parseInt(e.target.value) })} />
              <input className="form-control" type="date" placeholder="Fecha vencimiento" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre comercial</th>
              <th>Laboratorio</th>
              <th>Categoría</th>
              <th>Presentación</th>
              <th>Stock</th>
              <th>Vence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No hay productos</td></tr>
            ) : (
              filtrados.map(p => (
                <tr key={p.id_producto}>
                  <td style={{ fontWeight: 600 }}>{p.nombre_comercial}</td>
                  <td>{p.Laboratorios?.nombre_laboratorio}</td>
                  <td><span className="badge badge-info">{p.Categorias?.nombre_categoria}</span></td>
                  <td>{p.Presentaciones?.nombre_presentacion}</td>
                  <td>{stockBadge(p.stock_actual_unidades)}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>
                    {p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" title="Editar" onClick={() => handleEditar(p)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="icon-btn danger" title="Eliminar" onClick={() => handleEliminar(p.id_producto)}>
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