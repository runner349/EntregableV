# 🏥 Nova Salud — Sistema de Ventas

Proyecto frontend en React + Vite para el sistema de ventas de la Botica Nova Salud.

## 🚀 Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo
npm run dev

# 3. Abrir en el navegador
http://localhost:5173
```

## 📁 Estructura del proyecto

```
nova-salud/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       # Menú lateral de navegación
│   │   └── Topbar.jsx        # Barra superior con breadcrumb
│   ├── pages/
│   │   ├── Dashboard.jsx     # Métricas y últimas ventas
│   │   ├── NuevaVenta.jsx    # Módulo de ventas (boleta/factura)
│   │   ├── Historial.jsx     # Historial de comprobantes
│   │   ├── Productos.jsx     # Catálogo de medicamentos
│   │   ├── Clientes.jsx      # Gestión de clientes
│   │   └── Empleados.jsx     # Gestión de empleados
│   ├── data/
│   │   └── mockData.js       # Datos de prueba (reemplazar con Supabase)
│   ├── App.jsx               # Componente raíz con enrutamiento
│   ├── main.jsx              # Entry point
│   └── index.css             # Estilos globales
├── index.html
├── vite.config.js
└── package.json
```

## 🗄️ Próximo paso: conectar Supabase

El archivo `src/data/mockData.js` contiene datos de prueba.
Reemplazar cada función con llamadas a la API de Supabase usando el script SQL del proyecto.

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Ejemplo: obtener productos
const { data } = await supabase.from('Productos').select('*')
```

## 📦 Módulos incluidos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | KPIs del día, stock bajo, últimas ventas |
| Nueva venta | Boleta / Factura con carrito e IGV automático |
| Historial | Filtros por tipo y fecha, exportar |
| Productos | Catálogo con alertas de stock y vencimiento |
| Clientes | Registro por DNI o RUC |
| Empleados | Usuarios del sistema con cargos |

## 🛠️ Tecnologías

- **React 18** + **Vite 5**
- **CSS puro** (sin Tailwind ni librerías de UI)
- **Tabler Icons** (iconos)
- **DM Sans** (tipografía)
