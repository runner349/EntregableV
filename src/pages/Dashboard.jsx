import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// UTILERÍA
// ============================================
const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(value || 0)

const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(value || 0)

// ============================================
// ANIMACIÓN COUNT-UP
// ============================================
const useCountUp = (end, duration = 1000) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (end === 0) return setValue(0)
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setValue(end); clearInterval(timer) }
      else { setValue(Math.floor(start)) }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return value
}

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

// ============================================
// KPI CARD
// ============================================
const KpiCard = ({ label, value, icon, trend, delay = 0 }) => {
  const countValue = useCountUp(typeof value === 'number' ? value : 0)
  const displayValue = typeof value === 'number'
    ? (label.includes('S/') ? formatCurrency(countValue) : formatNumber(countValue))
    : value

  return (
    <div style={{
      background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20,
      padding: '22px 24px', position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      animation: `fadeUp 0.6s ${delay}s cubic-bezier(0.16, 1, 0.3, 1) both`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: '#22C55E', opacity: 0.03, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
          <h3 style={{ margin: '10px 0', fontSize: 36, fontWeight: 700, color: '#FFF', letterSpacing: '-0.03em', fontFamily: "'DM Mono', 'Inter', monospace" }}>{displayValue}</h3>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? '#22C55E' : '#EF4444', background: trend > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 999 }}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span style={{ fontSize: 10, color: '#666' }}>vs ayer</span>
            </div>
          )}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#22C55E' }}>
          <i className={`ti ${icon}`} />
        </div>
      </div>
    </div>
  )
}

// ============================================
// GRÁFICO DE BARRAS SIMPLE
// ============================================
const BarChart = ({ data, maxValue = 100 }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, padding: '0 4px' }}>
    {data.map((item, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: `fadeUp 0.5s ${0.1 + i * 0.06}s both` }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#666', opacity: item.value > 0 ? 1 : 0 }}>{item.value}</span>
        <div style={{ width: '100%', height: `${(item.value / maxValue) * 150}px`, background: `linear-gradient(180deg, #22C55E, rgba(34,197,94,0.3))`, borderRadius: '6px 6px 4px 4px', boxShadow: '0 0 12px rgba(34,197,94,0.2)', transition: 'all 0.3s ease', cursor: 'pointer', minHeight: 4 }}
          onMouseEnter={e => { e.target.style.filter = 'brightness(1.3)'; }}
          onMouseLeave={e => { e.target.style.filter = 'brightness(1)'; }}
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: '#666' }}>{item.label}</span>
      </div>
    ))}
  </div>
)

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Dashboard() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [detallesVentas, setDetallesVentas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [{ data: ventasData }, { data: productosData }, { data: detallesData }] = await Promise.all([
        supabase.from('Ventas').select('*, Clientes(*), Tipos_Comprobantes(*)').order('fecha_hora', { ascending: false }).limit(100),
        supabase.from('Productos').select('*, Productos_Precios(*), Categorias(*)').eq('estado', true).order('nombre_comercial'),
        supabase.from('Detalle_Ventas').select('*, Productos(*)').limit(500),
      ])
      setVentas(ventasData || [])
      setProductos(productosData || [])
      setDetallesVentas(detallesData || [])
    } catch (e) { console.error(e) }
    finally { setTimeout(() => setLoading(false), 800) }
  }

  const ventasCompletadas = useMemo(() => ventas.filter(v => v.estado === 'Completada'), [ventas])
  const todaySales = useMemo(() => ventasCompletadas.reduce((t, v) => t + (v.total || 0), 0), [ventasCompletadas])
  const avgTicket = ventasCompletadas.length ? todaySales / ventasCompletadas.length : 0
  const numTransacciones = ventasCompletadas.length
  const lowStock = useMemo(() => productos.filter(p => p.stock_actual_unidades <= p.stock_minimo_unidades), [productos])

  // ============================================
  // PRODUCTOS MÁS Y MENOS VENDIDOS
  // ============================================
  const rankingProductos = useMemo(() => {
    const conteo = {}
    detallesVentas.forEach(d => {
      const nombre = d.Productos?.nombre_comercial || 'Desconocido'
      conteo[nombre] = (conteo[nombre] || 0) + (d.cantidad || 0)
    })
    const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1])
    return {
      masVendido: ordenados.slice(0, 5),
      menosVendido: ordenados.slice(-5).reverse(),
    }
  }, [detallesVentas])

  const topClientes = useMemo(() => {
    const conteo = {}
    ventasCompletadas.forEach(v => { const n = v.Clientes?.nombres_razon_social || 'General'; conteo[n] = (conteo[n] || 0) + 1 })
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [ventasCompletadas])

  const hourlyData = [
    { label: '8am', value: 28, color: '#22C55E' }, { label: '9am', value: 45, color: '#4ADE80' },
    { label: '10am', value: 62, color: '#22C55E' }, { label: '11am', value: 84, color: '#4ADE80' },
    { label: '12pm', value: 78, color: '#22C55E' }, { label: '1pm', value: 56, color: '#4ADE80' },
    { label: '2pm', value: 42, color: '#22C55E' }, { label: '3pm', value: 38, color: '#4ADE80' },
  ]

  if (loading) {
    return (
      <div style={{ padding: 28, background: '#000', minHeight: '100vh' }}>
        <div style={{ marginBottom: 28 }}><Skeleton width={200} height={36} /><div style={{ marginTop: 8 }}><Skeleton width={300} height={18} /></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: 24 }}><Skeleton width={100} height={14} /><div style={{ marginTop: 12 }}><Skeleton width={160} height={36} /></div><div style={{ marginTop: 8 }}><Skeleton width={70} height={14} /></div></div>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 12px #22C55E', animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#666' }}>Farmacia en línea</span>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>Panel de Control</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>Monitoreo inteligente de tu negocio farmacéutico</p>
        </div>
        <button onClick={cargarDatos} className="btn" style={{ padding: '10px 20px' }}>
          <i className="ti ti-refresh" style={{ fontSize: 16 }} /> Actualizar
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
        <KpiCard label="Ventas del día" value={todaySales} icon="ti-report-money" trend={14} delay={0} />
        <KpiCard label="Ticket promedio" value={avgTicket} icon="ti-receipt" trend={8} delay={0.1} />
        <KpiCard label="Transacciones" value={numTransacciones} icon="ti-shopping-cart-check" trend={21} delay={0.2} />
        <KpiCard label="Stock crítico" value={lowStock.length} icon="ti-alert-triangle" trend={-3} delay={0.3} />
      </div>

      {/* GRÁFICO + TOP CLIENTES */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 28 }}>
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '24px', animation: 'fadeUp 0.6s 0.4s ease both' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div><h3 style={{ margin: 0, fontSize: 16, color: '#FFF' }}>Ventas por hora</h3><p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>Rendimiento del turno</p></div>
            <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>+12%</span>
          </div>
          <BarChart data={hourlyData} maxValue={100} />
        </div>

        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '24px', animation: 'fadeUp 0.6s 0.5s ease both' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, color: '#FFF' }}>Top Clientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topClientes.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>Sin datos</p> :
              topClientes.map(([name, count], i) => {
                const max = topClientes[0][1]; const pct = Math.round((count / max) * 100)
                return (
                  <div key={i} style={{ animation: `fadeUp 0.4s ${0.6 + i * 0.06}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#FFF' }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: '#1A1A1A', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #22C55E, rgba(34,197,94,0.3))', borderRadius: 6, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* PRODUCTOS MÁS Y MENOS VENDIDOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
        {/* MÁS VENDIDOS */}
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '24px', animation: 'fadeUp 0.6s 0.6s ease both' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔥 Más Vendidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rankingProductos.masVendido.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Sin datos</p>
            ) : rankingProductos.masVendido.map(([nombre, cantidad], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: `fadeUp 0.4s ${0.7 + i * 0.05}s both` }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#22C55E' : '#1A1A1A', color: i === 0 ? '#000' : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: '#FFF' }}>{nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>{cantidad} u.</span>
              </div>
            ))}
          </div>
        </div>

        {/* MENOS VENDIDOS */}
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '24px', animation: 'fadeUp 0.6s 0.7s ease both' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            📉 Menos Vendidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rankingProductos.menosVendido.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Sin datos</p>
            ) : rankingProductos.menosVendido.map(([nombre, cantidad], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: `fadeUp 0.4s ${0.8 + i * 0.05}s both` }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#1A1A1A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: '#FFF' }}>{nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', fontFamily: "'DM Mono', monospace" }}>{cantidad} u.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28, animation: 'fadeUp 0.6s 0.9s ease both' }}>
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderLeft: '3px solid #EF4444', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div><strong style={{ display: 'block', color: '#EF4444', fontSize: 13 }}>Stock crítico detectado</strong><span style={{ color: '#666', fontSize: 11 }}>{lowStock.length} productos bajo el mínimo</span></div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderLeft: '3px solid #22C55E', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div><strong style={{ display: 'block', color: '#22C55E', fontSize: 13 }}>Insight del día</strong><span style={{ color: '#666', fontSize: 11 }}>Ventas +14% respecto a ayer</span></div>
        </div>
      </div>

      {/* ÚLTIMAS VENTAS */}
      <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, overflow: 'hidden', animation: 'fadeUp 0.6s 1.0s ease both' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#FFF' }}>Últimas ventas</h3>
              <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s ease infinite' }} />EN VIVO
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>Movimientos recientes del punto de venta</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}><span style={{ display: 'block', fontSize: 9, color: '#666', fontWeight: 700, textTransform: 'uppercase' }}>Total</span><strong style={{ color: '#FFF', fontSize: 15 }}>{formatCurrency(todaySales)}</strong></div>
            <div style={{ textAlign: 'right' }}><span style={{ display: 'block', fontSize: 9, color: '#666', fontWeight: 700, textTransform: 'uppercase' }}>Ventas</span><strong style={{ color: '#FFF', fontSize: 15 }}>{numTransacciones}</strong></div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Comprobante', 'Cliente', 'Fecha', 'Total', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '12px 20px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasCompletadas.slice(0, 8).map((v, i) => (
                <tr key={v.id_venta} style={{ animation: `fadeUp 0.4s ${1.1 + i * 0.04}s both` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace", background: '#111', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                      {v.serie_documento}-{v.numero_documento}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>{v.Clientes?.nombres_razon_social || 'Público'}</td>
                  <td style={{ padding: '12px 20px', fontSize: 12, color: '#666' }}>{new Date(v.fecha_hora).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 20px', fontWeight: 700 }}>S/ {v.total?.toFixed(2)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="badge badge-success"><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }} /> {v.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}