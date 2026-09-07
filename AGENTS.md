# Contexto del proyecto — App de Presupuestos para Servicios Domésticos

## Qué es esto
App web para gestionar presupuestos de limpieza residencial y jardinería (empresas y trabajadores independientes). Resuelve el problema de presupuestos imprecisos/demorados al no poder ver la propiedad antes de cotizar.

## Alcance del MVP (4 semanas) — IMPORTANTE, no expandir sin confirmar con el usuario
- Un cliente solicita, UN proveedor responde. No hay competencia entre múltiples proveedores por la misma solicitud (no es un marketplace).
- NO se suben fotografías. El estado del espacio se captura con opción múltiple (`mantenimiento_regular`, `maleza_alta`, `abandono_total`), cada una con un multiplicador fijo aplicado en el backend.
- Tarifas FIJAS por tipo de servicio, definidas en la tabla `tipos_servicio`. No hay panel de configuración de precios por proveedor.
- Itinerario simplificado: solo `fecha_deseada` + `turno` (mañana/tarde). No hay calendario interactivo ni gestión de disponibilidad.
- NO hay rotación de personal, cuadrillas ni asignación de trabajadores a trabajos.
- NO hay sistema de reseñas/calificaciones en esta fase.
- El pre-presupuesto se calcula automáticamente; el proveedor puede editarlo/confirmarlo manualmente antes de enviarlo al cliente.
- Flujo de estados de una solicitud: `solicitado → revisado → aprobado/rechazado`.

## Fuera de alcance (mejoras futuras, no construir ahora)
Fotos de evidencia, marketplace con múltiples proveedores, tarifario configurable por proveedor, cuadrillas/rotación de personal, itinerario avanzado, reseñas/reputación.

## Stack tecnológico
- Frontend: Next.js + Tailwind CSS (carpeta `frontend/`)
- Backend/DB: Supabase (PostgreSQL + Auth), corriendo LOCAL vía Docker (carpeta `backend/`, inicializado con `supabase init`)
- Automatización: n8n, reducido a un único webhook (nueva solicitud → correo al proveedor)
- Deploy: Vercel
- Repositorio: GitHub (https://github.com/Jesu1005/presupuestos-app)

## Modelo de datos
El esquema DBML recortado para el MVP está en `backend/schema_mvp.dbml`. Tiene 5 tablas: `perfiles` (vinculada a `auth.users` de Supabase Auth, no se guarda contraseña propia), `tipos_servicio`, `propiedades`, `solicitudes_presupuesto`. Antes de crear o modificar tablas, revisar ese archivo como fuente de verdad.

## Plan de trabajo (Scrum, 4 sprints semanales)
1. **Semana 1**: fundaciones — backlog, modelo de datos, tarifas base, repos, wireframes.
2. **Semana 2**: backend — auth, CRUD de solicitudes, lógica de estimación con tarifas fijas.
3. **Semana 3**: frontend conectado al backend, ajuste manual de precio por el proveedor, automatización mínima con n8n.
4. **Semana 4**: pruebas, despliegue en Vercel, documentación.

## Reglas para el agente
- No agregues tablas, columnas o funcionalidades que no estén en `schema_mvp.dbml` o en este documento sin preguntar primero.
- Si una petición del usuario parece expandir el alcance del MVP (ej. agregar fotos, múltiples proveedores, calendario avanzado), señálalo antes de implementarlo.
- Prioriza soluciones simples y rápidas de construir sobre soluciones "más completas" — el objetivo es un MVP funcional en 4 semanas, no un producto final.
