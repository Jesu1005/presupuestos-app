# Backlog — App de Presupuestos (MVP)

## Épica 1: Solicitud de presupuesto (Cliente)
1. **Como cliente**, quiero registrarme e iniciar sesión, para poder solicitar presupuestos.
2. **Como cliente**, quiero registrar mi propiedad (dirección, tipo, m²), para no repetir esos datos en cada solicitud.
3. **Como cliente**, quiero completar un formulario tipo calculadora (tipo de servicio, estado del espacio, fecha y turno deseado) y ver un pre-presupuesto al instante, para saber cuánto costará sin esperar una visita.
4. **Como cliente**, quiero ver el estado de mis solicitudes (solicitado/revisado/aprobado/rechazado), para saber en qué va mi pedido.
5. **Como cliente**, quiero aprobar o rechazar el presupuesto final que me envía el proveedor, para confirmar o cancelar el trabajo.

## Épica 2: Gestión de solicitudes (Proveedor/Trabajador)
6. **Como proveedor**, quiero iniciar sesión y ver la lista de solicitudes que me llegan, para gestionarlas.
7. **Como proveedor**, quiero ver el pre-presupuesto calculado automáticamente y poder editarlo o confirmarlo, para ajustar casos particulares.
8. **Como proveedor**, quiero marcar una solicitud como revisada, aprobada o rechazada, para mantener el flujo actualizado.
9. **Como proveedor**, quiero recibir un correo automático cuando llega una solicitud nueva, para no tener que estar revisando la app constantemente.

## Épica 3: Configuración base (Equipo/Admin, no un usuario final)
10. **Como equipo del proyecto**, necesitamos definir las tarifas fijas por tipo de servicio en la base de datos, para que el cálculo automático funcione.

---

## Prioridad para las 4 semanas (orden de implementación)
| Prioridad | Historia | Sprint |
|---|---|---|
| Alta | #1 Registro/login | Sprint 2 |
| Alta | #10 Tarifas fijas | Sprint 1 |
| Alta | #2 Registrar propiedad | Sprint 2 |
| Alta | #3 Calculadora + pre-presupuesto | Sprint 2 |
| Alta | #6 Ver solicitudes (proveedor) | Sprint 3 |
| Alta | #7 Editar/confirmar precio | Sprint 3 |
| Alta | #8 Cambiar estado | Sprint 3 |
| Media | #4 Ver estado (cliente) | Sprint 3 |
| Media | #5 Aprobar/rechazar (cliente) | Sprint 3 |
| Media | #9 Notificación por correo (n8n) | Sprint 3 |

## Fuera del backlog del MVP (explícitamente descartado)
- Subida de fotos.
- Reseñas/calificaciones.
- Múltiples proveedores compitiendo por una solicitud.
- Calendario interactivo / gestión de cuadrillas.
- Panel de configuración de precios por proveedor.
