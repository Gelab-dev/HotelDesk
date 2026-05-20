# HotelDesk

Sistema de gestión de turnos de desayuno para hoteles. Permite a los huéspedes reservar su turno desde el celular vía QR, y al personal de recepción gestionar el día desde un panel de administración.

## Funcionalidades

**Vista huésped**
- Verificación automática contra Cloudbeds (demo con datos de prueba)
- Selección de turno con disponibilidad en tiempo real
- Restricciones dietarias (Sin TACC, Sin lactosa, Vegetariano, Vegano)
- Detección de reserva existente con opción de modificar
- Soporte multiidioma (ES / EN / PT / FR)
- Bloqueo visible cuando las reservas están cerradas

**Panel de administración**
- Vista diaria con navegación entre fechas
- Reporte por turno: personas, restricciones y comentarios
- Modal con detalle de huéspedes por turno
- Buscador por habitación, nombre, apellido y/o fecha
- Bloqueo de reservas con toggle
- Exportar reporte CSV del día
- Carga masiva de grupos desde Excel (.xlsx / .xls)
- Plantilla Excel descargable

## Stack

- **Next.js 15** — App Router, Server Components, API Routes
- **Prisma 7** — ORM con SQLite (desarrollo) / PostgreSQL (producción)
- **TypeScript** — tipado estricto en toda la app
- **Tailwind CSS** — estilos utilitarios
- **xlsx** — lectura de archivos Excel para carga masiva

## Estructura del proyecto

```
src/
├── app/
│   ├── api/              # API Routes (solo transporte HTTP)
│   │   ├── reservas/
│   │   ├── verificar/
│   │   ├── disponibilidad/
│   │   ├── buscar/
│   │   ├── reporte/
│   │   ├── grupos/
│   │   └── configuracion/
│   ├── admin/            # Página del panel de administración
│   └── page.tsx          # Página del formulario del huésped
├── components/
│   ├── huesped/          # FormularioReserva
│   └── admin/            # PanelAdmin
├── hooks/                # Lógica de estado y fetching
│   ├── useReservas.ts
│   ├── useVerificarHuesped.ts
│   ├── useDisponibilidad.ts
│   └── useBuscador.ts
├── services/             # Lógica de negocio
│   ├── reservas.service.ts
│   ├── huespedes.service.ts
│   ├── grupos.service.ts
│   ├── reporte.service.ts
│   └── configuracion.service.ts
├── lib/                  # Utilidades
│   ├── prisma.ts
│   ├── normalizar.ts
│   ├── api-errors.ts
│   ├── parse-json-response.ts
│   └── validation-error.ts
└── types/
    └── index.ts
```

## Instalación

**Requisitos:** Node.js 18+ y npm

```bash
# Clonar el repositorio
git clone https://github.com/Gelab-dev/HotelDesk.git
cd HotelDesk

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de la base de datos

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente de Prisma
npx prisma generate

# Cargar huéspedes de prueba
npx tsx prisma/seed.ts

# Generar plantilla Excel para carga masiva
npm run plantilla-grupos

# Iniciar en desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

El panel de administración se accede en `http://localhost:3000/admin`.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="file:./prisma/dev.db"
```

## Huéspedes de prueba

El seed carga 10 huéspedes con estadías activas en mayo 2026. Algunos ejemplos:

| Habitación | Nombre | Apellido | Check-in | Check-out |
|---|---|---|---|---|
| 101 | Maria | Garcia | 19/05 | 24/05 |
| 303 | Juan Cruz | Gelabert | 20/05 | 27/05 |
| 501 | Emma | Wilson | 20/05 | 24/05 |

Para verificar un huésped en el formulario, los datos deben coincidir exactamente (sin distinguir mayúsculas ni acentos).

## Carga masiva de grupos

Descargar la plantilla desde el panel de administración → completar con los datos del grupo → subir con el botón "Carga masiva".

Columnas del Excel:

| Columna | Requerida | Valores aceptados |
|---|---|---|
| habitacion | Sí | Número de habitación |
| nombre | Sí | Nombre del huésped |
| apellido | Sí | Apellido del huésped |
| fecha | Sí | YYYY-MM-DD |
| turno | Sí | 07:30 / 08:30 / 09:30 |
| sin_tacc | No | Sí/No, 1/0, vacío |
| sin_lactosa | No | Sí/No, 1/0, vacío |
| vegetariano | No | Sí/No, 1/0, vacío |
| vegano | No | Sí/No, 1/0, vacío |
| comentarios | No | Texto libre |

## Producción

Para migrar a PostgreSQL en producción, reemplazá el provider en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Y actualizá `DATABASE_URL` en las variables de entorno de Vercel con la URL de tu base de datos.

---

Desarrollado por [Gelab](https://gelab.dev) — automatizamos negocios argentinos con IA y desarrollo web.
