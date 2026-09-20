# Presupuestos App — Gestión de Presupuestos para Servicios Domésticos

Aplicación web para gestionar presupuestos de limpieza residencial y jardinería, dirigida tanto a empresas prestadoras de servicios como a trabajadores independientes.

Resuelve el problema de **presupuestos imprecisos o demorados**: actualmente, calcular el tiempo y costo de un trabajo sin ver la propiedad previamente (ej. evaluar el grado de suciedad o los m² de un jardín) genera retrasos y estimaciones poco confiables. Esta app permite a un cliente obtener un **pre-presupuesto al instante**, sin necesidad de una visita previa.

> 📄 Informe técnico completo del proyecto: ver `docs/Informe_Tecnico_Proyecto.docx` (elicitación, requerimientos, historias de usuario, arquitectura, uso de IA, etc.)

## Estado del proyecto

✅ **Proyecto completo** — Sprints 1 a 4 finalizados.

- ✅ Sprint 1 — Fundaciones y diseño
- ✅ Sprint 2 — Núcleo funcional (auth, CRUD, estimación de presupuesto, seguridad)
- ✅ Sprint 3 — Integración frontend y automatización (n8n Cloud)
- ✅ Sprint 4 — Validaciones, despliegue y pruebas finales

## Enlaces

- 🚀 **Aplicación en producción**: https://presupuestos-app-drab.vercel.app
- 💻 **Repositorio**: https://github.com/Jesu1005/presupuestos-app

## Alcance del MVP

- Un cliente solicita, un proveedor responde (sin marketplace de múltiples proveedores).
- El estado del espacio se captura por selección múltiple (sin fotos).
- Tarifas fijas por tipo de servicio (sin panel de configuración por proveedor).
- Itinerario simplificado: fecha deseada + turno (sin calendario interactivo).

Ver el detalle completo de decisiones de alcance en [`AGENTS.md`](./AGENTS.md).

## Arquitectura

```
┌──────────────────────┐      HTTPS       ┌───────────────────────────┐
│  Cliente / Proveedor  │ ───────────────► │   Frontend (Next.js +     │
│  (navegador)          │                  │   Tailwind) — Vercel      │
└──────────────────────┘                  └─────────────┬─────────────┘
                                                          │ Cliente JS
                                                          │ (REST + RPC)
                                                          ▼
                                            ┌───────────────────────────┐
                                            │  Backend (BaaS)           │
                                            │  Supabase Cloud           │
                                            │  Auth + PostgreSQL +      │
                                            │  REST/RPC + RLS           │
                                            └─────────────┬─────────────┘
                                                          │ Trigger (pg_net)
                                                          │ AFTER INSERT
                                                          ▼
                                            ┌───────────────────────────┐
                                            │  n8n Cloud (webhook)      │
                                            └─────────────┬─────────────┘
                                                          │ SMTP (Gmail)
                                                          ▼
                                              Correo al proveedor
```

**Frontend**: Next.js + Tailwind CSS, desplegado en Vercel. Se comunica con Supabase mediante el cliente JS oficial (API REST autogenerada + llamadas RPC para operaciones sensibles).

**Backend**: Supabase (PostgreSQL + Auth + REST/RPC), como servicio administrado (BaaS) en Supabase Cloud. Toda tabla tiene Row Level Security (RLS) activado; las transiciones de aprobación/rechazo del cliente pasan por funciones RPC (`aprobar_solicitud`, `rechazar_solicitud`) con `SECURITY DEFINER`, en vez de exponer un `UPDATE` directo sobre campos sensibles como `precio_final`.

**Automatización**: un trigger de PostgreSQL (`AFTER INSERT` en `solicitudes_presupuesto`), usando la extensión `pg_net`, arma el payload completo (proveedor, cliente, servicio, pre-presupuesto, fecha, turno) y llama de forma asíncrona a un webhook de **n8n Cloud**, que envía el correo de notificación al proveedor vía SMTP (Gmail).

**Base de datos**: 4 tablas (`perfiles`, `tipos_servicio`, `propiedades`, `solicitudes_presupuesto`) — ver diagrama y detalle en la sección "Modelo de datos" más abajo.

## Estructura del proyecto

```
Software/
├── AGENTS.md               # Contexto y reglas de alcance del proyecto (para IA y humanos)
├── backlog_mvp.md           # Historias de usuario priorizadas
├── docs/
│   └── Informe_Tecnico_Proyecto.docx
│    └──plan tecnico proyecto.docx
├── frontend/                 # Aplicación Next.js + Tailwind
│   ├── app/
│   │   ├── login/
│   │   ├── registro/
│   │   ├── solicitar/        # Calculadora de presupuesto (cliente)
│   │   ├── mis-solicitudes/  # Estado y aprobación (cliente)
│   │   ├── proveedor/        # Listado y detalle de solicitudes (proveedor)
│   │   └── lib/
│   │       ├── supabaseClient.ts
│   │       └── estimacion.ts # Lógica de cálculo del pre-presupuesto (con pruebas)
│   └── .env.local            # Variables de entorno (no versionado)
└── backend/
    └── supabase/
        ├── migrations/        # Esquema, RLS, funciones RPC y trigger de notificación
        └── seed.sql           # Tarifas fijas iniciales
```

## Setup — Desarrollo local

### Requisitos previos

- [Node.js](https://nodejs.org/) (LTS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con WSL2 en Windows)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- Git

### 1. Backend (Supabase local)

```bash
cd backend
supabase start
```

Esto levanta PostgreSQL, Auth, la API REST y Supabase Studio de forma local con Docker. Al finalizar, la terminal muestra la URL del proyecto y las API keys locales.

Para aplicar el esquema de base de datos y las tarifas iniciales desde cero:

```bash
supabase db reset
```

Studio local (panel visual de la base de datos): [http://127.0.0.1:54323](http://127.0.0.1:54323)

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Crea un archivo `frontend/.env.local` con las variables (usa los valores que te muestra `supabase start`):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-publishable-key-local>
```

### 3. Pruebas

```bash
cd frontend
npm test
```

Corre las pruebas unitarias de la lógica de estimación de presupuesto (Vitest).

## Setup — Producción

- **Base de datos**: proyecto en [Supabase Cloud](https://supabase.com), vinculado con `supabase link --project-ref <ref>` y actualizado con `supabase db push`. Las tarifas iniciales se cargan manualmente vía el SQL Editor del dashboard (el `seed.sql` solo se ejecuta automáticamente en local).
- **Frontend**: desplegado en [Vercel](https://vercel.com), con Root Directory configurado en `frontend/` y las variables `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` apuntando al proyecto de Supabase Cloud.
- **Automatización**: workflow de n8n publicado en [n8n Cloud](https://n8n.io); la URL del webhook está configurada en la función `notificar_nueva_solicitud()` de la base de datos en la nube.

## Modelo de datos

El esquema completo está documentado en `backend/schema_mvp.dbml` (visualizable en [dbdiagram.io](https://dbdiagram.io)). Resumen de tablas:

- **perfiles** — datos de usuario (cliente o proveedor), vinculada a Supabase Auth, con columna `email` propia para las notificaciones.
- **tipos_servicio** — catálogo de tarifas fijas por tipo de servicio.
- **propiedades** — propiedades registradas por cada cliente.
- **solicitudes_presupuesto** — núcleo del sistema: solicitud, cálculo automático, ajuste manual del proveedor y flujo de estados (`solicitado → revisado → aprobado/rechazado`).

Todas las tablas tienen **Row Level Security (RLS)** activado. Las transiciones de aprobación/rechazo del cliente se implementan como funciones RPC (`aprobar_solicitud`, `rechazar_solicitud`) para evitar exponer un `UPDATE` directo sobre campos sensibles como `precio_final`.

## Flujo principal

1. El cliente se registra, registra una propiedad y solicita un presupuesto (`/solicitar`), viendo un pre-presupuesto calculado al instante.
2. El proveedor recibe un correo automático (vía n8n Cloud), ve la solicitud (`/proveedor`), ajusta o confirma el precio final, y la marca como `revisado`.
3. El cliente ve el presupuesto revisado (`/mis-solicitudes`) y lo aprueba o rechaza.

## Uso de Inteligencia Artificial en este proyecto

Este proyecto se desarrolló con apoyo de un asistente conversacional (Claude) para planificación, diseño y documentación, y de un agente de código en terminal (opencode) para la implementación. El archivo `AGENTS.md` documenta el contexto y las reglas de alcance que guían al agente de código. El detalle completo del proceso (herramientas, prompts, consideraciones, y qué decisiones fueron del equipo humano vs. delegadas a la IA) está en el informe técnico (`docs/Informe_Tecnico_Proyecto.docx`, Sección 7).

## Autor

Jesus Guzman— Aplicación para la Gestión de Presupuestos en Servicios Domésticos.
