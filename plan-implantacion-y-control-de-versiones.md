# Plan de Implantación y Rollback + Control de Versiones

**Proyecto:** App de Presupuestos para Servicios Domésticos
**Repositorio:** https://github.com/Jesu1005/presupuestos-app
**Rama principal:** `main`
**Estado del historial:** 8 commits al cierre del Sprint 3
**Elaboración:** Documento del proyecto

---

# Parte I — Plan de Implantación y Rollback

## 1. Objetivo

Definir el proceso ordenado para **poner en producción** los componentes del sistema (frontend en Vercel, base de datos en Supabase, automatización en n8n) y el procedimiento para **volver atrás de forma segura y rápida** ante una falla, sin perder datos ni interrumpir el servicio por más tiempo del necesario.

## 2. Alcance y componentes implantables

| Componente | Tecnología | Entorno objetivo | Depende de |
|---|---|---|---|
| Frontend (Next.js + Tailwind) | Next.js 16 (App Router, Turbopack) | Vercel | API de Supabase, variables de entorno |
| Backend / Base de datos | Supabase (PostgreSQL + Auth) | Supabase Cloud (local vía Docker para desarrollo) | Migraciones SQL |
| Automatización | n8n (1 webhook: nueva solicitud → e-mail al proveedor) | n8n Cloud o auto-host | Webhook HTTP, credenciales SMTP |
| Repositorio | GitHub | GitHub.com | — |

## 3. Fases de implantación

### Fase 0 — Preparación (pre-despliegue)
- Verificaciones en local: `npm run lint` y `npm run build` en `frontend/` (sin warnings ni errores).
- `supabase db reset` en local y aplicación de todas las migraciones (`supabase/migrations/*`) sin errores.
- Ejecución del seed (`seed.sql`) y verificación de tarifas y roles.
- Configuración de variables de entorno en Vercel:
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (proyecto de producción).
- Configuración de branch protection en GitHub (ver Parte II, §6.5).

### Fase 1 — Grabado de la etiqueta de versión
- Al cerrar cada sprint: crear un tag semántico, p. ej. `v0.1.0` (Sprint 2), `v0.2.0` (Sprint 3), etc., apuntando al commit verificado.
  ```
  git tag -a v0.2.0 -m "Version 0.2.0 — Sprint 3 (MVP + UI)"
  git push origin v0.2.0
  ```

### Fase 2 — Implantación del backend (Supabase)
1. Aplicar migraciones:
   ```
   supabase link --project-ref <ref-proyecto>
   supabase db push
   ```
2. Verificar tablas, RLS y funciones RPC (`aprobar_solicitud`, `rechazar_solicitud`) con consultas de humo.
3. Confirmar el webhook de base de datos hacia n8n (evento INSERT en `solicitudes_presupuesto`).

### Fase 3 — Implantación de la automatización (n8n)
1. Importar el workflow del webhook de "nueva solicitud".
2. Configurar el destino (panel del proveedor y/o e-mail) y las credenciales SMTP.
3. Prueba e2e: crear una solicitud de presupuesto y verificar que llega la notificación.

### Fase 4 — Implantación del frontend (Vercel)
1. Conectar el repositorio a Vercel (deploy automático por push a `main`).
2. En el dashboard: **Production → Deployments → Deploy** del commit correspondiente a la versión.
3. Smoke test post-deploy:
   - Registro de cliente y de proveedor.
   - Alta de solicitud con cálculo del pre-presupuesto.
   - Revisión del precio por el proveedor (estado `revisado`).
   - Aprobación/rechazo por el cliente (estado `aprobado`/`rechazado`).
   - Favicon, login/registro, navegación entre roles.

### Fase 5 — Verificación global y cutover
- Recorrido completo happy-path en producción.
- Confirmar URL canónica, certificado y favicon.
- Comunicar al equipo la versión implantada (tag + commit) en el README o changelog.

## 4. Plan de Rollback

Principio rector: **revertir por el nivel más bajo de impacto y el más rápido de ejecutar**, en este orden: (1) frontend, (2) backend/base de datos, (3) automatización.

### 4.1 Rollback de frontend (Vercel) — el más rápido
- Vercel guarda los despliegues previos. Volver atrás:
  ```
  npx vercel rollback <url-del-deploy>
  ```
  o en el dashboard: seleccionar el deployment anterior y elegir **`Promote to Production`**.
- Alternativa por código (si la versión anterior no está desplegada):
  ```
  git revert <commit-que-introdujo-el-bug>
  git push origin main      # dispara el deploy automático
  ```

### 4.2 Rollback de base de datos (Supabase)
Dos escenarios:

**a) Migración defectuosa:**
1. Redactar una migración **compensatoria** (la inversa) y aplicarla:
   ```
   supabase db push
   ```
2. Si la migración aún no se propagó a producción: no aplicarla y `supabase db push` con el estado anterior.
3. Si hay datos que corregir, ejecutar un UPDATE/rollback manual con un script de migración con nombre `rollback_<fecha>.sql`.

**b) Corrupción o pérdida de datos:** usar **PITR (Point-in-Time Recovery)** de Supabase para restaurar a un instante anterior al incidente; el procedimiento se valida en un proyecto de staging antes de afectar producción.

Regla de seguridad: **nunca** se edita ni se borra una migración ya aplicada; se genera una nueva que revierte el cambio.

### 4.3 Rollback de n8n
- Desactivar o restaurar la **versión anterior del workflow** desde el historial de versiones de n8n.
- Si el webhook quedó mal configurado, re-apuntar el trigger de Supabase al endpoint correcto.

### 4.4 Rollback de código por Git (repositorio)
- **Si el bug es el último commit publicado** y aún no se usa en producción: `git reset` (ver Parte II, §4.4).
- **Si ya está en producción y otros commits dependen de él:** `git revert` (crea un commit inverso, no reescribe historia).

### 4.5 Decisiones de rollback (runbook resumido)

| Síntoma | Acción | Tiempo estimado |
|---|---|---|
| La página no carga / CSS roto | `vercel rollback` al deploy anterior | < 2 min |
| Error al enviar solicitudes | Revisar RLS + variables de entorno; si viene de un commit, `git revert` | 5–15 min |
| Estado de solicitudes corrupto | Migración compensatoria o PITR | 15–60 min |
| Webhook no notifica | Restaurar workflow en n8n, revisar credenciales SMTP | 5–10 min |

### 4.6 Criterios de salida del plan
- El incidente quedó registrado (issue en GitHub con el commit causante cuando se identifica).
- El rollback se validó con el smoke test de la Fase 4.
- Se crea la tarea de backlog para corregir la causa raíz en un branch separado.

---

# Parte II — Control de Versiones

## 1. Conceptos sobre versiones de sistemas

- **Versión:** estado congelado y identificable de un sistema en un punto del tiempo, con número (semántico: `mayor.menor.patch`). En este proyecto el MVP se versiona por **sprint**: Sprint 2 → `v0.1.0`, Sprint 3 → `v0.2.0`, Sprint 4 → `v0.3.0` y release `v1.0.0`.
- **Configuración:** conjunto de elementos versionables (código, esquema DB, migraciones, workflows de n8n, variables de entorno documentadas).
- **Requisito:** poder reconstruir con exactitud cualquier versión publicada (reproducibilidad). Eso exige que **todo** lo que configura el sistema esté en el repositorio, no solo el código fuente.

## 2. Proceso de versionado de software

Ciclo aplicado al proyecto:
1. **Cambio** de un ítem de backlog (issue en GitHub vinculado al commit del PR).
2. **Commit** atómico con mensaje descriptivo en español (convención del repo) → estado intermedio.
3. **Verificación** automática/manual: `npm run lint` + `npm run build` + pruebas de estimación (test local del Sprint 2).
4. **Publicación** (push a `main` → deploy en Vercel).
5. **Etiquetado** del repositorio al cerrar cada entregable (tag de sprint).
6. **Trazabilidad** commit ↔ PR ↔ issue ↔ despliegue ↔ versión.

## 3. Control de versiones (qué es y por qué importa aquí)

Sistema que registra todos los cambios del proyecto, con autor, fecha y mensaje, permitiendo:
- Volver a cualquier estado anterior (rollback).
- Saber **quién** cambió **qué** y **cuándo** (auditoría).
- Trabajar en paralelo sin pisarse (ramas).
- Localizar la causa de bugs (bisect, blame).

En este proyecto Git + GitHub centraliza frontend, esquema, migraciones y datos de prueba; las variables secretas **nunca** se versionan (`.env.local` está en `.gitignore`).

## 4. Fundamentos internos y gestión local

### 4.1 Arquitectura interna de Git

Git guarda **objetos inmutables** bajo `.git/objects`:

| Objeto | Contenido | En este proyecto |
|---|---|---|
| **Blob** | Contenido de un archivo (sin nombre) | Cada archivo versionado: `app/page.tsx`, `schema_mvp.dbml`, etc. |
| **Tree** | Directorio: lista de blobs/trees con nombres y permisos | La estructura `frontend/`, `backend/`, etc. |
| **Commit** | Tree raíz + metadatos (autor, hora, mensaje, hashes padre) | Cada uno de los 8 commits del historial |
| **Tag** | Referencia a un commit (anotado con mensaje y firma) | Futuros `v0.1.0`, `v0.2.0`… |

- **Índice (Staging Area):** zona intermedia (`.git/index`) donde se arma el próximo commit (`git add`).
- **Puntero HEAD:** referencia a la rama/commit actual; es la "posición" donde trabaja el usuario.

Diagrama del flujo local:
```
Working Directory --(git add)--> Staging Area / Índice --(git commit)--> Repositorio (commits)
                                                      |
                                                   HEAD → main → commit
```

### 4.2 Configuración profesional y llaves SSH/GPG

- Configuración de identidad y zona segura de ejecutables:
  ```
  git config --global user.name "Jesu1005"
  git config --global user.email "guzmanfloresmanuel05@gmail.com"
  git config --global core.autocrlf true   # normaliza CRLF en Windows
  git config --global init.defaultBranch main
  ```
- **SSH** (autenticación fuerte): generar y registrar en GitHub para no usar token cada vez:
  ```
  ssh-keygen -t ed25519 -C "guzmanfloresmanuel05@gmail.com"
  ```
  y probar: `ssh -T git@github.com`.
- **GPG** (firma de commits): generar par de llaves, `git config --global user.signingkey <id>` y `git config --global commit.gpgsign true`; así los commits quedan **firmados** (verificables como "Verified" en GitHub), práctica recomendada para gobiernos/auditorías.

### 4.3 Gestión de estado local

Comandos rutinarios aplicados al proyecto:
- `git status` → qué cambió y qué no; es el primer paso siempre.
- `git diff` → ver el cambio **antes** de `git add` (doble verificación, nunca commitear líneas accidentales).
- `git diff --staged` → revisar exactamente lo que entrará al commit.
- `git log --oneline --graph --all` → historial como grafo (ramas visibles).
- `git log --stat` / `--format="%h %an %s"` → log formateado para informes.
- `git stash` → guardar trabajo en curso sin comitear (útil al cambiar de tarea); `git stash list`, `git stash pop`.
- **`.gitignore` avanzado:** además de `node_modules`, `.next`, `.env.local`:
  ```
  .env*
  !.env.example
  supabase/.branches/*.log
  *.log
  .DS_Store
  ```
  y commit de `.env.example` con los nombres de variables **sin valores secretos**.

### 4.4 Deshacer cambios de forma segura

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `git checkout -- <archivo>` | Descarta cambios sin commitear | Restaurar un archivo al estado del HEAD |
| `git restore <archivo>` | Ídem (forma moderna) | Remplazo recomendado de `checkout` para descartar |
| `git restore --staged <archivo>` | Sacar del índice sin tocar el contenido | Deshacer un `git add` accidental |
| `git reset --soft <commit>` | Mueve HEAD, **deja el índice intacto** | Rehacer el último commit conservando el staging |
| `git reset --mixed <commit>` | Mueve HEAD y limpia el índice (default) | Deshacer `git add` o descomitear conservando el trabajo |
| `git reset --hard <commit>` | Mueve HEAD y **descarta cambios** | Volver a un estado exacto ANTES de publicar; peligroso (pierde trabajo) |
| `git revert <commit>` | Crea un **commit inverso**, no reescribe historia | Deshacer un cambio **ya publicado en `main`** (se usa en los rollback de §4) |

En este proyecto, los commits de `main` nunca se reescriben con `reset` salvo que sean locales y no compartidos: **lo publicado se revierte con `git revert`** y se documenta con su propio commit.

## 5. Estrategias de ramificación (Branching Strategies)

### 5.1 Manejo de ramas
- Creación: `git branch feature/xyz` o `git checkout -b feature/xyz`; publicar: `git push -u origin feature/xyz`.
- **Merge fast-forward:** ocurre cuando la rama destino no avanzó y la fusionada desciende de ella; Git simplemente mueve el puntero (historial lineal).
- **Merge commit:** cuando las ramas divergieron, Git crea un commit con **dos padres** que une ambas historias (preserva el contexto).
- **Conflictos de fusión:** suceden cuando ambas ramas modificaron las mismas líneas. Resolución paso a paso:
  1. `git status` → identificar archivos conflictivos.
  2. Editar el archivo quitando los marcadores `<<<<<<<`, `=======` y `>>>>>>>`, dejando el código correcto.
  3. `git add <archivo>` y `git commit` para cerrar la fusión.
  Nunca se resuelve a ciegas: se corre `npm run lint` + `npm run build` después.

### 5.2 Rebase interactivo
`git rebase -i <base>` abre un editor para reordenar, **combinar (squash)** o corregir mensajes de commits antes de publicar. Regla de oro del equipo: **rebase solo sobre commits que nadie más tiene**; el historial compartido de `main` nunca se reescribe. En este proyecto se usa para aplanar varios "commits provisionales" de una feature en uno limpio antes de abrir el PR.

### 5.3 Modelos de trabajo en equipo (comparados)

| Modelo | Estructura | Cuándo conviene | En este proyecto |
|---|---|---|---|
| **Gitflow** | `main` (producción), `develop` (integración), `feature/*`, `release/*`, `hotfix/*` | Productos con entregas programadas y soporte de versiones antiguas | No elegido: MVP de 4 semanas con 1 desarrollador — el overhead de `develop`/`release` no aporta |
| **Trunk-Based Development** | Una rama principal + ramas cortas de feature + **feature flags**, integración continua rápida | Equipos ágiles modernos, despliegues frecuentes | **Recomendado para este proyecto** |

**Recomendación del proyecto:** **Trunk-Based simplificado**. `main` siempre desplegable; cada tarea del backlog va en un branch corto `feature/<tarea>` que se fusiona con PR y deploy automático en Vercel. Para el MVP no se requieren feature flags persistentes; si se necesita lanzar algo "apagado", se usa una bandera de configuración en `.env.example` (documentada).

Ejemplo de ciclo concreto para el proyecto:
```
main:  dde65fe → 826987e → 4b71ae1 → 21b0382 → 94612ca → 4aaf72e → 9b08928 → ff7bffa (Sprint 3)
                                                         \
feature/tostadas:  2 commits → PR → merge a main (Sprint 4)
```

## 6. Flujos colaborativos en plataformas remotas (GitHub)

### 6.1 Configuración de repositorios remotos
```
git remote add origin https://github.com/Jesu1005/presupuestos-app.git
git fetch origin        # descarga cambios sin tocar el working dir
git pull origin main    # fetch + merge/pull de la rama
git push origin main    # publica commits locales
```
Verificación: `git remote -v` (actualmente `origin` → `presupuestos-app.git`).

### 6.2 Modelos de contribución
- **Fork & Pull Request:** cada colaborador clona el repositorio a su cuenta y propone cambios con PRs. Modelo abierto (proyectos públicos).
- **Shared Repository:** todos los colaboradores trabajan sobre el mismo repositorio y cada cambio se propone como branch + PR. Requiere menos fricción y fija los roles con *branch protection*.

**Se usa el modelo Shared Repository:** el desarrollo del MVP se realiza directo en `main` (Trunk-Based) y, a partir de la incorporación de colaboradores o del Sprint 4, cada tarea entra por **PR con revisión**.

### 6.3 Anatomía de un Pull Request
Un PR de este proyecto debe incluir:
- **Título** imperativo y corto ("Refactor de tarjetas del panel proveedor").
- **Descripción:** qué/por qué/como, con captura opcional.
- **Vínculo con el backlog:** "Cierra #14" (issue del backlog).
- **Historial limpio:** uno o pocos commits con mensajes descriptivos.
- **Comprobaciones:** `npm run lint`, `npm run build`, prueba manual del flujo afectado.

Plantilla resumida del cuerpo del PR:
```
## Qué hace
## Cómo se probó
## Vinculación (issue #)
## Checklist
- [ ] lint OK
- [ ] build OK
```

### 6.4 Code Reviews y gobierno del código
Políticas recomendadas para `main` (Branch Protection Rules en GitHub):
- Requerir PR y **revisión de al menos un par** antes de fusionar.
- Requerir estado de **checks CI** en verde (lint + build + tests).
- Bloquear push directo a `main`.
- Requerir que el branch esté actualizado antes del merge.
- Opcional: firma de commits (GPG) para fusiones.
- En CI se verifica que **no se comprometen secretos** (regla de escaneo de `.env.*`).

## 7. Técnicas avanzadas y diagnóstico

### 7.1 Búsqueda de errores: `git bisect`
Cuando un bug aparece sin saber en qué commit: búsqueda binaria entre un commit bueno y uno malo.
Ejemplo aplicado al proyecto:
```
git bisect start
git bisect bad ff7bffa                # el bug está presente
git bisect good 94612ca               # aquí no existía
# Git marca un commit intermedio; se prueba, se responde good/bad
# al final: git bisect reset + git bisect log
```
En ~3 pasos para 8 commits se aísla el responsable exacto.

### 7.2 Selección quirúrgica de cambios: `git cherry-pick`
Aplicar **un commit específico** a otra rama sin traer todo el resto:
```
git checkout -b hotfix/precio       # desde el tag de la versión en producción
git cherry-pick abc1234             # solo el commit del fix
# verificar, PR, merge, tag de patch
```
Ideal para llevar un fix de `main` a un tag de versión en producción.

### 7.3 Auditoría y rastreo: `git blame`
`git blame <archivo>` muestra autor, commit y fecha de **cada línea**:
```
git blame frontend/lib/estimacion.ts
```
Permite responder "¿cuándo y quién introdujo el multiplicador de maleza alta?" y vincularlo al issues/PR, dando trazabilidad completa para auditorías y para preparar un rollback quirúrgico por archivo.

---

# Anexo — Estados del proyecto para los ejemplos

| Ítem | Valor |
|---|---|
| Rama de producción | `main` |
| Remoto | `origin` → `https://github.com/Jesu1005/presupuestos-app.git` |
| Commits al cierre de Sprint 3 | 8 (`dde65fe` … `ff7bffa`) |
| Próximo tag sugerido | `v0.2.0` en el commit del Sprint 3 |
| Estrategia de ramificación | Trunk-Based (branch corto por tarea + PR) |
| Estrategia de rollback | Frontend `vercel rollback` → código `git revert` → DB migración compensatoria/PITR → n8n versión anterior |