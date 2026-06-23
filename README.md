# Diario de Productividad

App web minimalista y mobile-first (PWA instalable) para gestionar tu día:

- **Objetivos del día** — crear, editar, completar y eliminar. Leyenda al completarlos todos.
- **Diario por horas** — captura rápida con hora automática editable, etiquetas de colores y orden cronológico.
- **Resumen del día** — gráfica de dona con el tiempo por etiqueta.
- **Calendario** — navega meses, marca días con datos y abre cualquier día.
- **Ajustes** — CRUD de etiquetas con color, activo/inactivo y orden.

Stack: **Vite + React + TypeScript + Tailwind CSS + Supabase**, desplegable en **Cloudflare Pages**.

---

## 1. Requisitos

- Node.js 18+ y npm.
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito sirve).

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta el contenido completo de [`supabase/schema.sql`](supabase/schema.sql).
   Esto crea las tablas (`tags`, `goals`, `entries`), índices, triggers de `updated_at`
   y las políticas **Row Level Security** (cada usuario solo ve sus datos).
   > Si ya habías creado la BD con una versión anterior, ejecuta en orden las migraciones
   > pendientes: [`migration_002.sql`](supabase/migration_002.sql),
   > [`migration_003.sql`](supabase/migration_003.sql) y
   > [`migration_004.sql`](supabase/migration_004.sql) (tabla `notes`: notas y pendientes).
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
4. **Auth → Providers → Email**: deja habilitado *Email*. Para pruebas rápidas puedes
   desactivar *Confirm email* (en **Auth → Sign In / Providers**). El *Magic link* funciona sin contraseña.
5. **Auth → URL Configuration**: añade tu URL local (`http://localhost:5173`) y la de
   producción de Cloudflare Pages a **Redirect URLs** (necesario para magic links).

## 3. Variables de entorno

```bash
cp .env.example .env
```

Rellena `.env`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

## 4. Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Crea una cuenta (o usa magic link), añade etiquetas en
**Ajustes** y empieza a registrar tu día.

Otros scripts:

- `npm run build` — compila TypeScript y genera `dist/` listo para producción.
- `npm run preview` — sirve el build localmente.
- `npm run lint` — chequeo de tipos (`tsc --noEmit`).

## 5. Desplegar en Cloudflare Pages

### Opción A — desde el dashboard (Workers + Static Assets)

1. Sube este repo a GitHub/GitLab.
2. En Cloudflare → **Workers & Pages → Create → Import a repository**.
3. Selecciona el repo y configura:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Path / Root directory:** `/`
4. En **Settings → Environment variables** añade `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (para Production y Preview).
5. Deploy. Cada push redepliega automáticamente.

> **SPA routing:** [`wrangler.jsonc`](wrangler.jsonc) configura
> `not_found_handling = "single-page-application"` para que las rutas (`/day/...`,
> `/calendar`) funcionen al recargar.

### Opción B — CLI (Wrangler)

```bash
npm run build
npx wrangler deploy
```

(Define las variables de entorno con `npx wrangler pages secret put ...` o en el dashboard.)

---

## Modelo de datos

| Tabla     | Campos clave                                                                          |
|-----------|---------------------------------------------------------------------------------------|
| `tags`    | name, color, active, sort_order, user_id, created_at, updated_at                       |
| `goals`   | day, text, completed, **completion_percent**, **tag_id**, sort_order, user_id, …       |
| `entries` | day, entry_time, **end_time**, text, tag_id, **goal_id**, user_id, …                   |

`tag_id` y `goal_id` usan *on delete set null* (borrar un tag/objetivo no rompe el historial).
Todo con RLS por `user_id = auth.uid()`.

### Objetivos: cumplimiento y vínculo con logs

- Un log se considera **finalizado** si tiene hora final **o** existe un log posterior.
- Al finalizar un log cuyo tag coincide con el de un objetivo no cumplido, la app **sugiere**
  marcar ese objetivo como cumplido (banner). Al aceptar, se vinculan al objetivo todos los
  logs del día con esa etiqueta (`entries.goal_id`).
- Al marcar un objetivo (por la sugerencia o por el checkbox) se elige un **porcentaje de
  cumplimiento** (default 100%, ajustable). El badge de % es reeditable con un clic.

### Calendario con filtros

- **Objetivos**: colorea los días con objetivos cumplidos según el color de su etiqueta.
- **Logs**: colorea los días con logs y muestra debajo una lista con hora + previsualización
  (`Trabajo: …`) agrupada por día.
- Ambos modos aceptan filtro por etiqueta (o «todas»).

## Regla de cálculo del resumen

Cada entrada del diario dura **hasta la siguiente** (ordenadas por hora). La última:

- **Hoy:** hasta la hora actual.
- **Día pasado:** hasta una hora de cierre configurable (`CLOSE_HOUR`, default **22:00**
  en [`src/utils/summary.ts`](src/utils/summary.ts)).

`tiempo_tag = Σ duraciones`; `porcentaje = tiempo_tag / total_registrado`.

## Estructura

```
src/
  components/   goals · diary · summary · tags · Layout
  context/      AuthContext
  hooks/        useTags · useGoals · useEntries
  lib/          supabase (cliente)
  pages/        Login · DayView · CalendarPage · Settings
  services/     tags · goals · entries (capa de datos)
  types/        modelos TypeScript
  utils/        date · summary (regla de cálculo)
supabase/
  schema.sql    tablas + índices + RLS + triggers
```
