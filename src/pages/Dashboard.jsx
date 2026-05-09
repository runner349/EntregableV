import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const formatCurrency = value =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value || 0)

const formatNumber = value => new Intl.NumberFormat('es-PE').format(value || 0)

const csvEscape = value => {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

const formatDate = value => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatTime = value => {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const todayLabel = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}).format(new Date())

const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

const fallbackSalesByHour = [
  { hour: '08:00', value: 28 },
  { hour: '09:00', value: 54 },
  { hour: '10:00', value: 42 },
  { hour: '11:00', value: 76 },
  { hour: '12:00', value: 62 },
  { hour: '13:00', value: 84 },
  { hour: '14:00', value: 58 },
  { hour: '15:00', value: 70 },
]

function useCountUp(end, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const target = Number(end || 0)
    if (!target) {
      setValue(0)
      return undefined
    }

    let frame
    let startTime

    const tick = timestamp => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)

      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [end, duration])

  return value
}

function AnimatedMetric({ value, type }) {
  const animated = useCountUp(value)
  return type === 'currency'
    ? formatCurrency(animated)
    : formatNumber(Math.round(animated))
}

function Skeleton({ height = 18, width = '100%', radius = 10 }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

function StatCard({ item, index }) {
  return (
    <article
      className="dashboard-stat"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, color: '#64748B', fontSize: 13, fontWeight: 700 }}>{item.label}</p>
          <strong style={{ display: 'block', marginTop: 8, color: '#0F172A', fontSize: 28, lineHeight: 1, fontWeight: 900, letterSpacing: '-0.02em' }}>
            <AnimatedMetric value={item.value} type={item.type} />
          </strong>
        </div>
        <span className="dashboard-stat-icon">
          <i className={`ti ${item.icon}`} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, color: '#64748B', fontSize: 12, fontWeight: 800 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: item.tone || '#22C55E' }} />
        {item.meta}
      </div>
    </article>
  )
}

function SalesChart({ data }) {
  return (
    <div style={{ padding: 20 }}>
      <div className="dashboard-chart">
        {data.map((item, index) => (
          <div key={item.hour} className="dashboard-bar-wrap">
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div
                className="dashboard-bar"
                title={item.isFallback ? `${item.hour}: referencia ${item.percent}%` : `${item.hour}: ${formatCurrency(item.amount)}`}
                style={{
                  height: `${Math.max(item.percent, item.amount > 0 ? 8 : 3)}%`,
                  animationDelay: `${180 + index * 80}ms`,
                }}
              >
                <span />
              </div>
            </div>
            <small>{item.hour}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressCard({ label, value, detail, progress, delay }) {
  return (
    <div className="dashboard-progress-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="dashboard-progress-top">
        <div>
          <p>{label}</p>
          <span>{detail}</span>
        </div>
        <strong>{value}</strong>
      </div>
      <div className="dashboard-progress-track">
        <div
          style={{
            width: `${Math.min(progress, 100)}%`,
          }}
        />
      </div>
    </div>
  )
}

export default function Dashboard({ profile }) {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const [{ data: ventasData, error: ventasError }, { data: productosData, error: productosError }] = await Promise.all([
        supabase
          .from('Ventas')
          .select('*, Clientes(*), Tipos_Comprobantes(*)')
          .order('fecha_hora', { ascending: false })
          .limit(50),
        supabase
          .from('Productos')
          .select('*, Productos_Precios(*), Categorias(*)')
          .eq('estado', true)
          .order('nombre_comercial'),
      ])

      if (ventasError || productosError) {
        throw new Error([ventasError?.message, productosError?.message].filter(Boolean).join(' | '))
      }

      setVentas(ventasData || [])
      setProductos(productosData || [])
    } catch (error) {
      setVentas([])
      setProductos([])
      setErrorMsg(error.message || 'No se pudieron cargar los datos del dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const ventasCompletadas = useMemo(
    () => ventas.filter(v => (v.estado || '').toLowerCase() === 'completada'),
    [ventas]
  )

  const todaySales = useMemo(
    () => ventasCompletadas.reduce((total, sale) => total + Number(sale.total || 0), 0),
    [ventasCompletadas]
  )

  const averageTicket = ventasCompletadas.length ? todaySales / ventasCompletadas.length : 0

  const lowStock = useMemo(
    () => productos
      .filter(product => Number(product.stock_actual_unidades || 0) <= Number(product.stock_minimo_unidades || 0))
      .slice(0, 6),
    [productos]
  )

  const topClients = useMemo(() => {
    const map = new Map()

    ventasCompletadas.forEach(sale => {
      const name = sale.Clientes?.nombres_razon_social || 'Publico general'
      map.set(name, (map.get(name) || 0) + Number(sale.total || 0))
    })

    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [ventasCompletadas])

  const salesByHour = useMemo(() => {
    const totals = Object.fromEntries(hours.map(hour => [hour, 0]))

    ventasCompletadas.forEach(sale => {
      if (!sale.fecha_hora) return
      const hour = `${String(new Date(sale.fecha_hora).getHours()).padStart(2, '0')}:00`
      if (totals[hour] !== undefined) totals[hour] += Number(sale.total || 0)
    })

    const max = Math.max(...Object.values(totals), 1)
    const hasHourlySales = Object.values(totals).some(total => total > 0)

    if (!hasHourlySales) {
      return fallbackSalesByHour.map(item => ({
        hour: item.hour,
        amount: item.value,
        percent: item.value,
        isFallback: true,
      }))
    }

    return hours.map(hour => ({
      hour,
      amount: totals[hour],
      percent: Math.round((totals[hour] / max) * 100),
    }))
  }, [ventasCompletadas])

  const goal = 23500
  const goalProgress = Math.min(Math.round((todaySales / goal) * 100), 100)
  const completedRate = ventas.length ? Math.round((ventasCompletadas.length / ventas.length) * 100) : 0
  const stockRiskRate = productos.length ? Math.round((lowStock.length / productos.length) * 100) : 0

  const kpis = [
    {
      label: 'Venta del dia',
      value: todaySales,
      type: 'currency',
      meta: loading ? 'cargando Supabase' : 'segun ventas registradas',
      icon: 'ti-report-money',
      tone: '#22C55E',
    },
    {
      label: 'Ticket promedio',
      value: averageTicket,
      type: 'currency',
      meta: `${formatNumber(ventasCompletadas.length)} comprobantes`,
      icon: 'ti-receipt',
      tone: '#0EA5E9',
    },
    {
      label: 'Productos activos',
      value: productos.length,
      type: 'number',
      meta: 'inventario registrado',
      icon: 'ti-pill',
      tone: '#22C55E',
    },
    {
      label: 'Stock critico',
      value: lowStock.length,
      type: 'number',
      meta: 'requiere reposicion',
      icon: 'ti-alert-triangle',
      tone: '#F59E0B',
    },
  ]

  const exportSalesCsv = () => {
    if (!ventasCompletadas.length) return

    const headers = ['Operacion', 'Comprobante', 'Tipo', 'Cliente', 'Fecha', 'Hora', 'Total', 'Estado']
    const rows = ventasCompletadas.map(sale => [
      `Venta #${sale.id_venta}`,
      `${sale.serie_documento || ''}-${sale.numero_documento || ''}`,
      sale.Tipos_Comprobantes?.nombre_documento || 'Comprobante',
      sale.Clientes?.nombres_razon_social || 'Publico general',
      formatDate(sale.fecha_hora),
      formatTime(sale.fecha_hora),
      Number(sale.total || 0).toFixed(2),
      sale.estado || 'Completada',
    ])

    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map(row => row.map(csvEscape).join(',')),
    ].join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `dashboard-ultimas-ventas-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <style>{dashboardStyles}</style>
      <div className="dashboard-shell">
        {errorMsg && (
          <div className="dashboard-alert">
            <i className="ti ti-alert-circle" />
            {errorMsg}
          </div>
        )}

        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <div className="dashboard-eyebrow">
              <span />
              Operacion comercial
            </div>
            <h1>Dashboard de ventas</h1>
            <p>Control diario de caja, comprobantes, inventario critico y rendimiento de tienda.</p>
          </div>

          <div className="dashboard-context-grid">
            {[
              ['Fecha', todayLabel, 'ti-calendar'],
              ['Caja', 'Abierta', 'ti-cash-banknote'],
              ['Sucursal', 'Nova Salud', 'ti-building-store'],
            ].map(([label, value, icon], index) => (
              <div key={label} className="dashboard-context" style={{ animationDelay: `${120 + index * 70}ms` }}>
                <i className={`ti ${icon}`} />
                <div>
                  <span>{label}</span>
                  <strong className={label === 'Caja' ? 'is-open' : ''}>{value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-kpis">
          {loading
            ? [1, 2, 3, 4].map(item => (
              <article key={item} className="dashboard-stat">
                <Skeleton width="45%" height={14} />
                <div style={{ marginTop: 16 }}><Skeleton width="65%" height={30} /></div>
                <div style={{ marginTop: 18 }}><Skeleton width="75%" height={12} /></div>
              </article>
            ))
            : kpis.map((item, index) => <StatCard key={item.label} item={item} index={index} />)}
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-left-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-head">
                <div>
                  <h2>Ventas por hora</h2>
                  <p>Rendimiento acumulado del turno</p>
                </div>
                <span className="dashboard-chip">En vivo</span>
              </div>
              {loading ? (
                <div style={{ padding: 20 }}><Skeleton height={260} radius={14} /></div>
              ) : (
                <SalesChart data={salesByHour} />
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-head">
                <div>
                  <h2>Top clientes</h2>
                  <p>Clientes con mayor importe en las ultimas ventas</p>
                </div>
                <i className="ti ti-users" style={{ color: '#047857' }} />
              </div>

              {loading ? (
                <div style={{ padding: 20 }}><Skeleton height={150} radius={14} /></div>
              ) : topClients.length === 0 ? (
                <div className="dashboard-empty">
                  <span><i className="ti ti-users-off" /></span>
                  <strong>Sin clientes destacados</strong>
                  <p>Cuando haya ventas, aqui veras los mejores clientes.</p>
                </div>
              ) : (
                <div className="dashboard-top-clients">
                  {topClients.map((client, index) => {
                    const max = topClients[0]?.total || 1
                    const percent = Math.round((client.total / max) * 100)
                    return (
                      <div key={client.name} className="dashboard-client-row">
                        <span className="dashboard-client-rank">{index + 1}</span>
                        <div className="dashboard-client-body">
                          <div>
                            <strong>{client.name}</strong>
                            <span>{formatCurrency(client.total)}</span>
                          </div>
                          <div><span style={{ width: `${percent}%` }} /></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          </div>

          <aside className="dashboard-panel dashboard-stock">
            <div className="dashboard-panel-head">
              <div>
                <h2>Inventario critico</h2>
                <p>Prioridad de reposicion</p>
              </div>
              <i className="ti ti-alert-triangle" />
            </div>

            <div className="dashboard-stock-list">
              {loading ? (
                <div style={{ padding: 20 }}><Skeleton height={120} radius={14} /></div>
              ) : lowStock.length === 0 ? (
                <div className="dashboard-empty">
                  <span><i className="ti ti-circle-check" /></span>
                  <strong>No hay stock critico</strong>
                  <p>Los productos estan por encima del minimo configurado.</p>
                </div>
              ) : lowStock.map((product, index) => (
                <div key={product.id_producto} className="dashboard-stock-item" style={{ animationDelay: `${260 + index * 70}ms` }}>
                  <div>
                    <strong>{product.nombre_comercial}</strong>
                    <span>{product.Categorias?.nombre_categoria || 'Sin categoria'}</span>
                  </div>
                  <em>{product.stock_actual_unidades || 0} und.</em>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="dashboard-panel dashboard-ops-strip">
          <div className="dashboard-panel-head">
            <div>
              <h2>Indicadores operativos</h2>
              <p>Seguimiento de metas y calidad del turno</p>
            </div>
            <i className="ti ti-activity" style={{ color: '#047857' }} />
          </div>
          <div className="dashboard-progress-list dashboard-progress-list-horizontal">
            <ProgressCard
              label="Meta mensual"
              value={`${goalProgress}%`}
              detail={`${formatCurrency(todaySales)} de ${formatCurrency(goal)}`}
              progress={goalProgress}
              delay={220}
            />
            <ProgressCard
              label="Ventas completadas"
              value={`${completedRate}%`}
              detail={`${ventasCompletadas.length} de ${ventas.length} movimientos`}
              progress={completedRate}
              delay={300}
            />
            <ProgressCard
              label="Riesgo de inventario"
              value={`${stockRiskRate}%`}
              detail={`${lowStock.length} productos bajo minimo`}
              progress={stockRiskRate}
              delay={380}
            />
          </div>
        </section>

        <section className="dashboard-sales">
          <div className="dashboard-sales-head">
            <div className="dashboard-sales-title">
              <span className="dashboard-sales-icon"><i className="ti ti-receipt-2" /></span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2>Ultimas ventas</h2>
                  <span className="dashboard-live">En vivo</span>
                </div>
                <p>Movimientos recientes del punto de venta y comprobantes emitidos.</p>
              </div>
            </div>

            <div className="dashboard-sales-actions">
              <div>
                <span>Total</span>
                <strong>{formatCurrency(todaySales)}</strong>
              </div>
              <div>
                <span>Ventas</span>
                <strong>{ventasCompletadas.length}</strong>
              </div>
              <div>
                <span>Promedio</span>
                <strong>{formatCurrency(averageTicket)}</strong>
              </div>
              <div>
                <span>Mayor venta</span>
                <strong>{formatCurrency(Math.max(...ventasCompletadas.map(sale => Number(sale.total || 0)), 0))}</strong>
              </div>
              <button type="button" onClick={exportSalesCsv} disabled={!ventasCompletadas.length}>
                <i className="ti ti-download" />
                Exportar
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <div className="dashboard-sales-feed">
              <div className="dashboard-feed-head">
                <span>Operacion</span>
                <span>Comprobante</span>
                <span>Cliente</span>
                <span>Fecha</span>
                <span>Vendedor</span>
                <span>Importe</span>
                <span>Estado</span>
              </div>

              {loading ? (
                <div className="dashboard-table-empty">Cargando ultimas ventas desde Supabase...</div>
              ) : ventasCompletadas.length === 0 ? (
                <div className="dashboard-table-empty">
                  <div className="dashboard-empty" style={{ padding: 0 }}>
                    <span><i className="ti ti-receipt-off" /></span>
                    <strong>No hay ventas registradas</strong>
                    <p>Las ventas nuevas apareceran aqui despues de registrarlas.</p>
                  </div>
                </div>
              ) : ventasCompletadas.slice(0, 10).map((sale, index) => {
                const customer = sale.Clientes?.nombres_razon_social || 'Publico general'
                const docType = sale.Tipos_Comprobantes?.nombre_documento || 'Comprobante'

                return (
                  <article key={sale.id_venta} className="dashboard-sale-card" style={{ animationDelay: `${360 + index * 55}ms` }}>
                    <div className="dashboard-transaction-op">
                      <span><i className="ti ti-shopping-cart" /></span>
                      <div>
                        <strong>Venta #{sale.id_venta}</strong>
                        <small>{docType}</small>
                      </div>
                    </div>

                    <code className="dashboard-voucher">{sale.serie_documento}-{sale.numero_documento}</code>

                    <div className="dashboard-customer-cell">
                      <span>{customer.slice(0, 1).toUpperCase()}</span>
                      <div className="dashboard-customer">{customer}</div>
                    </div>

                    <span className="dashboard-date">
                      {formatDate(sale.fecha_hora)}
                      <small>{formatTime(sale.fecha_hora)}</small>
                    </span>

                    <span className="dashboard-vendedor">{profile?.username || 'Sistema'}</span>

                    <strong className="dashboard-amount">{formatCurrency(sale.total)}</strong>

                    <span className="dashboard-status">
                      <span />
                      {sale.estado || 'Completada'}
                    </span>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}

const dashboardStyles = `
.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #FFFFFF;
  color: #0F172A;
  font-family: 'Inter', 'DM Sans', sans-serif;
}
.dashboard-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #FECDD3;
  background: #FFF1F2;
  color: #BE123C;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 800;
}
.dashboard-hero,
.dashboard-stat,
.dashboard-panel,
.dashboard-sales {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.dashboard-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  background:
    linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 58%, #F0FDF4 100%);
  padding: 22px 24px;
  animation: fadeUp 0.45s ease both;
}
.dashboard-hero::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #22C55E, #047857);
}
.dashboard-hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}
.dashboard-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #047857;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.dashboard-eyebrow span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22C55E;
  animation: pulse 2s ease infinite;
}
.dashboard-hero h1,
.dashboard-sales h2,
.dashboard-panel h2 {
  margin: 0;
  color: #0F172A;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.dashboard-hero h1 {
  margin-top: 10px;
  font-size: 28px;
}
.dashboard-hero p,
.dashboard-sales p,
.dashboard-panel p {
  margin: 5px 0 0;
  color: #64748B;
  font-size: 13px;
}
.dashboard-context-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(112px, 1fr));
  gap: 10px;
}
.dashboard-context {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #E2E8F0;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  animation: fadeUp 0.45s ease both;
}
.dashboard-context > i {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #BBF7D0;
  font-size: 17px;
}
.dashboard-context span,
.dashboard-sales-actions span {
  display: block;
  color: #94A3B8;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dashboard-context strong {
  display: block;
  margin-top: 4px;
  color: #1E293B;
  font-size: 13px;
  font-weight: 900;
}
.dashboard-context strong.is-open {
  color: #047857;
}
.dashboard-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.dashboard-stat {
  position: relative;
  overflow: hidden;
  padding: 20px;
  background: linear-gradient(180deg, #FFFFFF, #FCFCFD);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  animation: fadeUp 0.45s ease both;
}
.dashboard-stat::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, #22C55E, transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.dashboard-stat:hover {
  transform: translateY(-4px);
  border-color: #BBF7D0;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
}
.dashboard-stat:hover::after {
  opacity: 1;
}
.dashboard-stat-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #BBF7D0;
  font-size: 22px;
  transition: all 0.35s ease;
}
.dashboard-stat:hover .dashboard-stat-icon {
  transform: translateY(-2px);
  background: #059669;
  color: #FFFFFF;
  box-shadow: 0 12px 22px rgba(5, 150, 105, 0.22);
}
.dashboard-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
}
.dashboard-left-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
}
.dashboard-panel {
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
  animation: fadeUp 0.45s ease both;
}
.dashboard-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #E2E8F0;
  background: linear-gradient(90deg, #FFFFFF, #F8FAFC);
  padding: 16px 20px;
}
.dashboard-panel-head h2,
.dashboard-sales h2 {
  font-size: 16px;
}
.dashboard-panel-head > i {
  color: #D97706;
  font-size: 26px;
}
.dashboard-chip,
.dashboard-live {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #BBF7D0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 900;
}
.dashboard-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 260px;
  border-left: 1px solid #E2E8F0;
  border-bottom: 1px solid #E2E8F0;
  border-radius: 0 0 10px 10px;
  background:
    linear-gradient(180deg, rgba(226, 232, 240, 0.42) 1px, transparent 1px) 0 0 / 100% 25%,
    #FFFFFF;
  padding: 10px 8px 12px;
}
.dashboard-bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.dashboard-bar {
  position: relative;
  width: 100%;
  min-height: 4px;
  border-radius: 8px 8px 3px 3px;
  background: linear-gradient(180deg, #22C55E, #047857);
  box-shadow: 0 10px 20px rgba(5, 150, 105, 0.16);
  transform-origin: bottom;
  animation: barRise 0.6s ease both;
  transition: filter 0.3s ease, transform 0.3s ease;
}
.dashboard-bar:hover {
  filter: brightness(1.08);
  transform: scaleX(1.08);
}
.dashboard-bar span {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
}
.dashboard-bar-wrap small {
  color: #94A3B8;
  font-size: 11px;
  font-weight: 800;
}
.dashboard-progress-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}
.dashboard-progress-list-horizontal {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.dashboard-ops-strip {
  border-color: #D1FAE5;
  background: #FFFFFF;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}
.dashboard-ops-strip .dashboard-panel-head {
  border-bottom: 1px solid #D1FAE5;
  background: linear-gradient(90deg, #F8FAFC, #FFFFFF 50%, #ECFDF5);
}
.dashboard-progress-card {
  border: none;
  border-right: 1px solid #E2E8F0;
  background: transparent;
  border-radius: 0;
  padding: 18px 20px;
  animation: fadeUp 0.45s ease both;
  transition: background 0.25s ease;
}
.dashboard-progress-card:last-child {
  border-right: none;
}
.dashboard-progress-card:hover {
  transform: none;
  background: #F8FAFC;
}
.dashboard-progress-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.dashboard-progress-top p {
  margin: 0;
  color: #0F172A;
  font-size: 14px;
  font-weight: 900;
}
.dashboard-progress-top span {
  display: block;
  margin-top: 4px;
  color: #64748B;
  font-size: 12px;
  font-weight: 700;
}
.dashboard-progress-top strong {
  flex-shrink: 0;
  min-width: 58px;
  text-align: right;
  border-radius: 0;
  background: transparent;
  color: #047857;
  border: none;
  padding: 0;
  font-size: 26px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.03em;
}
.dashboard-progress-track {
  height: 7px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 999px;
  background: #E5E7EB;
}
.dashboard-progress-track div {
  height: 100%;
  min-width: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #047857, #22C55E);
  animation: progressIn 0.8s ease both;
}
.dashboard-stock-list {
  display: flex;
  flex-direction: column;
}
.dashboard-stock-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #F1F5F9;
  padding: 16px 20px;
  animation: fadeUp 0.4s ease both;
  transition: background 0.25s ease;
}
.dashboard-stock-item:hover {
  background: #FFFBEB;
}
.dashboard-stock-item strong {
  display: block;
  color: #0F172A;
  font-size: 13px;
  font-weight: 900;
}
.dashboard-stock-item span {
  display: block;
  margin-top: 4px;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
}
.dashboard-stock-item em {
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #FECDD3;
  background: #FFF1F2;
  color: #BE123C;
  padding: 5px 9px;
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}
.dashboard-empty {
  padding: 34px 20px;
  text-align: center;
}
.dashboard-empty span {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin: 0 auto;
  border-radius: 14px;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E2E8F0;
  font-size: 26px;
}
.dashboard-empty strong {
  display: block;
  margin-top: 14px;
  color: #0F172A;
  font-size: 14px;
  font-weight: 900;
}
.dashboard-empty p {
  margin: 5px 0 0;
  color: #64748B;
  font-size: 13px;
}
.dashboard-sales {
  overflow: hidden;
  animation: fadeUp 0.45s ease both;
  border-radius: 18px;
  border-color: #D1FAE5;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}
.dashboard-sales-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #E2E8F0;
  background:
    radial-gradient(circle at 92% 12%, rgba(34, 197, 94, 0.18), transparent 28%),
    linear-gradient(90deg, #F8FAFC, #FFFFFF 54%, #ECFDF5);
  padding: 22px;
}
.dashboard-sales-title {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 260px;
}
.dashboard-sales-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #059669;
  color: #FFFFFF;
  font-size: 22px;
  box-shadow: 0 12px 24px rgba(5, 150, 105, 0.22);
}
.dashboard-sales-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(108px, 1fr)) auto;
  gap: 10px;
  align-items: stretch;
}
.dashboard-sales-actions > div,
.dashboard-sales-actions button {
  border: 1px solid #D1FAE5;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 11px 13px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.045);
}
.dashboard-sales-actions strong {
  display: block;
  margin-top: 5px;
  color: #0F172A;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}
.dashboard-sales-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #047857;
  color: #FFFFFF;
  border-color: #047857;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.25s ease;
}
.dashboard-sales-actions button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #065F46;
  border-color: #065F46;
  color: #FFFFFF;
}
.dashboard-sales-actions button:disabled {
  cursor: not-allowed;
  background: #F1F5F9;
  color: #94A3B8;
}
.dashboard-table-wrap {
  padding: 16px 16px 18px;
  overflow-x: auto;
  background:
    linear-gradient(180deg, #FFFFFF 0, #F8FAFC 34px),
    #F8FAFC;
}
.dashboard-sales-feed {
  display: grid;
  gap: 12px;
}
.dashboard-feed-head {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.45fr 0.9fr 1fr 0.9fr 0.9fr;
  gap: 12px;
  align-items: center;
  border: 1px solid #D1FAE5;
  border-radius: 14px;
  background: linear-gradient(90deg, #ECFDF5, #FFFFFF);
  padding: 11px 14px;
}
.dashboard-feed-head span {
  color: #047857;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  white-space: nowrap;
}
.dashboard-feed-head span:nth-child(6) {
  text-align: right;
}
.dashboard-sale-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.45fr 0.9fr 1fr 0.9fr 0.9fr;
  align-items: center;
  gap: 12px;
  position: relative;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  background: #FFFFFF;
  padding: 16px 18px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  animation: fadeUp 0.35s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.dashboard-sale-card::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 14px;
  bottom: 14px;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, #22C55E, #047857);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.dashboard-sale-card:hover {
  transform: translateY(-3px);
  border-color: #BBF7D0;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.09);
}
.dashboard-sale-card:hover::before {
  opacity: 1;
}
.dashboard-sale-card .dashboard-transaction-op,
.dashboard-sale-card .dashboard-customer-cell,
.dashboard-sale-card .dashboard-voucher,
.dashboard-sale-card .dashboard-date,
.dashboard-sale-card .dashboard-vendedor,
.dashboard-sale-card .dashboard-amount,
.dashboard-sale-card .dashboard-status {
  min-width: 0;
}
.dashboard-sale-card .dashboard-status {
  justify-self: start;
}
.dashboard-sale-card .dashboard-amount {
  justify-self: end;
}
.dashboard-vendedor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}
.dashboard-date small {
  display: block;
  margin-top: 3px;
  color: #94A3B8;
  font-size: 11px;
  font-weight: 800;
}
.dashboard-sale-card-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #BBF7D0;
  font-size: 22px;
}
.dashboard-sale-card-main {
  min-width: 0;
}
.dashboard-sale-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.dashboard-sale-card-top strong {
  display: block;
  color: #0F172A;
  font-size: 15px;
  font-weight: 900;
}
.dashboard-sale-card-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.dashboard-sale-card-tags span,
.dashboard-sale-card-tags code {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 900;
}
.dashboard-sale-card-tags span {
  border: 1px solid #BBF7D0;
  background: #F0FDF4;
  color: #047857;
}
.dashboard-sale-card-tags code {
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  color: #334155;
  font-family: 'DM Mono', 'JetBrains Mono', monospace;
}
.dashboard-sale-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 14px;
}
.dashboard-sale-client {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dashboard-sale-client > span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 11px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #E2E8F0;
  font-size: 12px;
  font-weight: 900;
}
.dashboard-sale-client strong {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}
.dashboard-sale-client small {
  display: block;
  margin-top: 2px;
  color: #94A3B8;
  font-size: 11px;
  font-weight: 800;
}
.dashboard-sale-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.dashboard-sale-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.dashboard-sale-card-total {
  min-width: 132px;
  border-left: 1px solid #E2E8F0;
  padding-left: 18px;
  text-align: right;
}
.dashboard-sale-card-total span {
  display: block;
  color: #94A3B8;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dashboard-sale-card-total strong {
  display: block;
  margin-top: 6px;
  color: #047857;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.dashboard-transactions {
  min-width: 980px;
  display: grid;
  gap: 9px;
}
.dashboard-transactions-head,
.dashboard-transaction-row {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1.55fr 0.8fr 0.8fr 0.9fr 0.9fr;
  align-items: center;
  gap: 14px;
}
.dashboard-transactions-head {
  border: 1px solid #A7F3D0;
  border-radius: 14px;
  background: linear-gradient(180deg, #D1FAE5, #ECFDF5);
  color: #065F46;
  padding: 11px 12px;
  box-shadow: 0 10px 22px rgba(5, 150, 105, 0.10);
}
.dashboard-transactions-head span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 9px;
  background: #FFFFFF;
  border: 1px solid #BBF7D0;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
.dashboard-transactions-head span:nth-child(6) {
  justify-content: flex-end;
}
.dashboard-transaction-row {
  position: relative;
  border: 1px solid #E2E8F0;
  border-radius: 15px;
  background: #FFFFFF;
  padding: 13px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
  animation: fadeUp 0.35s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}
.dashboard-transaction-row::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 999px;
  background: #22C55E;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.dashboard-transaction-row:hover {
  transform: translateY(-3px);
  border-color: #BBF7D0;
  background: #FDFEFD;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.09);
}
.dashboard-transaction-row:hover::before {
  opacity: 1;
}
.dashboard-transaction-op {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.dashboard-transaction-op > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #BBF7D0;
  font-size: 18px;
}
.dashboard-transaction-op strong {
  display: block;
  color: #0F172A;
  font-size: 13px;
  font-weight: 900;
}
.dashboard-transaction-op small {
  display: inline-flex;
  width: fit-content;
  margin-top: 5px;
  border-radius: 999px;
  background: #F0FDF4;
  color: #047857;
  border: 1px solid #BBF7D0;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 900;
}
.dashboard-table {
  width: 100%;
  min-width: 920px;
  border-collapse: separate;
  border-spacing: 0 10px;
}
.dashboard-table thead tr {
  background: linear-gradient(90deg, #0F172A, #1E293B);
  color: #CBD5E1;
}
.dashboard-table th {
  padding: 13px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.dashboard-table th:first-child {
  border-radius: 12px 0 0 12px;
}
.dashboard-table th:last-child {
  border-radius: 0 12px 12px 0;
}
.dashboard-table td {
  border-top: 1px solid #E2E8F0;
  border-bottom: 1px solid #E2E8F0;
  background: #FFFFFF;
  padding: 14px 16px;
  color: #475569;
  font-size: 13px;
  vertical-align: middle;
}
.dashboard-table td:first-child {
  border-left: 1px solid #E2E8F0;
  border-radius: 12px 0 0 12px;
}
.dashboard-table td:last-child {
  border-right: 1px solid #E2E8F0;
  border-radius: 0 12px 12px 0;
}
.dashboard-table tbody tr {
  animation: fadeUp 0.35s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.dashboard-table tbody tr:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.09);
}
.dashboard-table tbody tr:hover td {
  background: #F0FDF4;
  border-color: #BBF7D0;
}
.dashboard-voucher {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  border-radius: 9px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  color: #1E293B;
  padding: 7px 10px;
  font-family: 'DM Mono', 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 900;
}
.dashboard-table-empty {
  padding: 48px 16px !important;
  text-align: center;
  color: #64748B !important;
  font-weight: 800;
}
.dashboard-operation {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dashboard-operation > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
  color: #047857;
  border: 1px solid #BBF7D0;
  font-size: 18px;
  transition: all 0.25s ease;
}
.dashboard-table tbody tr:hover .dashboard-operation > span {
  background: #059669;
  color: #FFFFFF;
  border-color: #059669;
}
.dashboard-operation strong {
  display: block;
  color: #0F172A;
  font-size: 13px;
}
.dashboard-operation small {
  display: block;
  margin-top: 5px;
}
.dashboard-type-badge {
  width: fit-content;
  border-radius: 999px;
  border: 1px solid #E2E8F0;
  background: #F0FDF4;
  color: #047857;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 900;
}
.dashboard-customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dashboard-customer-cell > span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #F8FAFC;
  color: #047857;
  border: 1px solid #D1FAE5;
  font-size: 12px;
  font-weight: 900;
}
.dashboard-customer {
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-weight: 800;
}
.dashboard-date {
  color: #64748B;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.dashboard-amount {
  display: inline-flex;
  justify-content: flex-end;
  justify-self: end;
  min-width: 94px;
  border-radius: 10px;
  background: #ECFDF5;
  color: #047857 !important;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 900;
}
.dashboard-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  justify-self: start;
  border-radius: 999px;
  border: 1px solid #BBF7D0;
  background: #ECFDF5;
  color: #047857;
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}
.dashboard-status span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22C55E;
  animation: pulse 2s ease infinite;
}
.dashboard-top-clients {
  display: grid;
  gap: 12px;
  padding: 18px 20px 20px;
}
.dashboard-client-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #F8FAFC;
  padding: 12px;
  transition: all 0.25s ease;
}
.dashboard-client-row:hover {
  transform: translateY(-2px);
  border-color: #BBF7D0;
  background: #FFFFFF;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}
.dashboard-client-rank {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #047857;
  color: #FFFFFF !important;
  font-size: 12px !important;
  font-weight: 900;
}
.dashboard-client-body {
  flex: 1;
  min-width: 0;
}
.dashboard-client-body > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}
.dashboard-client-body strong {
  color: #0F172A;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dashboard-client-body > div:first-child span {
  color: #047857;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}
.dashboard-client-body > div:last-child {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #E2E8F0;
}
.dashboard-client-body > div:last-child span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #047857, #22C55E);
}
@keyframes barRise {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}
@keyframes progressIn {
  from { transform: scaleX(0); transform-origin: left; }
  to { transform: scaleX(1); transform-origin: left; }
}
@media (max-width: 1280px) {
  .dashboard-main-grid,
  .dashboard-left-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-sales-head {
    align-items: stretch;
    flex-direction: column;
  }
}
@media (max-width: 900px) {
  .dashboard-hero,
  .dashboard-sales-head {
    align-items: stretch;
    flex-direction: column;
  }
  .dashboard-kpis,
  .dashboard-context-grid,
  .dashboard-sales-actions,
  .dashboard-sales-strip {
    grid-template-columns: 1fr;
  }
  .dashboard-sale-card {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .dashboard-feed-head {
    display: none;
  }
  .dashboard-sale-card-total {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 1px solid #E2E8F0;
    padding-left: 0;
    padding-top: 12px;
    text-align: left;
  }
  .dashboard-sale-card-bottom,
  .dashboard-sale-card-top {
    align-items: flex-start;
    flex-direction: column;
  }
  .dashboard-sale-meta {
    justify-content: flex-start;
  }
}
`
