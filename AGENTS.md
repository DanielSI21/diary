# Diario de Productividad — Guía para agentes

App web **mobile-first** y **PWA instalable** para gestionar el día: objetivos, diario por
horas, notas/pendientes, resumen de tiempo por etiqueta, calendario y reporte exportable.

> Este archivo y `AGENTS.md` tienen el mismo contenido. Si editas uno, sincroniza el otro.

## Stack

- **Vite 5** + **React 18** + **TypeScript 5** (SPA, `react-router-dom` v6).
- **Tailwind CSS 3** (dark mode por clase `.dark` en `<html>`).
- **Supabase** (`@supabase/supabase-js`) — auth + Postgres con Row Level Security.
- **vite-plugin-pwa** (`registerType: 'autoUpdate'`).
- Despliegue: **Cloudflare** (Workers + Static Assets) vía **Wrangler**.
- Sin librería de tests; el "lint" es chequeo de tipos.

## Comandos

```bash
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # tsc -b && vite build  ->  dist/
npm run preview  # sirve el build local
npm run lint     # tsc --noEmit (no hay ESLint ni tests)
npm run deploy   # npx wrangler deploy
```

Verifica siempre con `npm run lint` antes de dar por terminado un cambio (es el único
chequeo automatizado del repo).

## Configuración / entorno

- Variables (prefijo `VITE_`, ver `.env.example`): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`. `src/lib/supabase.ts` lanza error si faltan.
- Auth: PKCE, sesión persistida en `localStorage` (`storageKey: 'diario-auth'`),
  `autoRefreshToken` y `detectSessionInUrl` (magic links). `AuthContext` además fuerza
  renovación del token al volver a enfocar/recuperar conexión (clave para iOS/PWA).
- `wrangler.jsonc`: sirve `./dist` con `not_found_handling: "single-page-application"`
  (routing del SPA al recargar). **No** agregues `public/_redirects`: entra en conflicto.
- Tema: `theme` en `localStorage`; default = preferencia del sistema. `applyTheme` fija
  `colorScheme` para que los inputs nativos (`time`, `date`) sigan el tema.

## Arquitectura

Capas claras, de datos hacia UI:

```
src/
  lib/supabase.ts        Cliente Supabase (singleton, config de auth)
  context/AuthContext     Sesión, user, signOut, auto-refresh de token
  services/               Capa de datos: 1 archivo por tabla (tags, goals, entries, notes)
  hooks/                  useTags, useGoals, useEntries, useNotes, useTheme (estado + llamadas a services)
  utils/                  date, summary, goals, report, importLogs, theme (lógica pura)
  components/             goals · diary · notes · summary · tags + Layout, TimeInput
  pages/                  Login · DayView · NotesPage · CalendarPage · Settings
  types/index.ts          Modelos (Tag, Goal, Entry, Note + variantes *WithTag, summaries)
supabase/                 schema.sql + migration_002..004.sql (ejecutar en SQL Editor)
```

**Patrón:** las `pages`/`components` no llaman a Supabase directo — usan **hooks**, que a su
vez usan **services**. La lógica de cálculo vive en **utils** (pura y testeable mentalmente).
Las interfaces `*WithTag` son el modelo con el `tag` ya resuelto por join.

### Rutas (`App.tsx`)

`/login` (pública) · todo lo demás bajo `<Protected><Layout/></Protected>`:
`/` → redirige a `/day/{hoy}` · `/day/:date` · `/notes` · `/calendar` · `/settings`.
Nav inferior fija (mobile-first): Día · Notas · Calendario · Ajustes.

## Modelo de datos (Supabase / Postgres)

Todas las tablas con **RLS** `auth.uid() = user_id` (select/insert/update/delete) y trigger
`set_updated_at`. FKs a `tags`/`goals` usan `on delete set null` (borrar un tag/objetivo
**no** rompe el historial).

| Tabla     | Campos clave |
|-----------|--------------|
| `tags`    | `name`, `color`, `active`, `sort_order` · único por `(user_id, lower(name))` |
| `goals`   | `day`, `text`, `completed`, `completion_percent` (0–100, def. 100), `tag_id`, `sort_order` |
| `entries` | `day`, `entry_time`, `end_time?`, `text`, `tag_id`, `goal_id` |
| `notes`   | `day`, `note_time`, `text`, `tag_id`, `pending`, `due_date?`, `done`, `done_at?` |
| `analyses`| `day`, `text` (Markdown largo) · único por `(user_id, day)` — análisis externo del día |

Vista `day_activity`: cuenta goals/entries/notes por `(user_id, day)` para el calendario
(`security_invoker = true`).

**Migraciones:** `schema.sql` es el estado base (tags/goals/entries). Para una BD existente
ejecuta en orden `migration_002` (tag en goals + end_time en entries), `migration_003`
(`completion_percent` + `goals.goal_id` en entries), `migration_004` (tabla `notes`) y
`migration_005` (tabla `analyses`).
Al cambiar el esquema, **añade una nueva migración** idempotente (`if not exists`,
`drop policy if exists`) en vez de editar las existentes.

## Funcionalidades

- **Objetivos del día** — CRUD; al completar todos aparece una leyenda.
- **Diario por horas (logs)** — captura rápida con hora automática editable (`TimeInput`),
  `end_time` opcional, etiqueta de color, orden cronológico.
- **Objetivos ↔ logs** (`utils/goals.ts`): un log está *finalizado* si tiene `end_time` o
  existe otro log posterior. Al finalizar un log cuyo tag coincide con un objetivo no
  cumplido, la app **sugiere** marcarlo (banner); al aceptar vincula al objetivo todos los
  logs del día con ese tag (`entries.goal_id`). Completar pide un **% de cumplimiento**
  (`CompletionDialog`, default 100, reeditable). El badge de % usa escala de color
  (`completionColorClasses`).
- **Notas / pendientes** (`NotesPage`, `notes`): nota con hora; `pending` la convierte en
  pendiente con `due_date` opcional y `done`. `PendingBanner` avisa de pendientes que vencen.
  `LinkedText` hace clickeables las URLs del texto.
- **Resumen del día** (`SummarySection`, `DonutChart`) — gráfica de dona del tiempo por tag.
- **Reporte** (`ReportDialog`, `utils/report.ts`) — genera Markdown (estadísticas + objetivos
  + logs agrupados por tag + notas) y lo descarga como `resumen-YYYY-MM-DD.md`. Incluye el
  análisis guardado al final bajo `# Análisis guardado` si existe.
- **Análisis del día** (`SummarySection`, `AnalysisDialog`, tabla `analyses`,
  `utils/analysisPrompt.ts`): «Copiar resumen para análisis» copia al portapapeles el prompt
  fijo + resumen completo del día (+ análisis previo, separado) listo para pegar en
  ChatGPT/Claude/Codex (`buildAnalysisClipboard`). «Guardar análisis» pega/sube (`.txt`/`.md`)
  un análisis externo (Markdown largo) ligado al día; se muestra en «Análisis guardado» y se
  puede editar, reemplazar o eliminar.
- **Importar logs** (`ImportLogs`, `utils/importLogs.ts`) — pega/sube JSON (p. ej. salida de
  ChatGPT/Claude; ver `PROMPT_IMPORTAR_LOGS.md`). Parser tolerante: acepta array o
  `{logs:[]}`, alias es/en de campos, cercos markdown; matchea tags por nombre.
- **Calendario** (`CalendarPage`) — navega meses, colorea días con datos, filtra por tag,
  modos objetivos/logs.
- **Ajustes** (`Settings`) — CRUD de tags (color, activo, orden) + toggle de tema.

### Regla de cálculo del resumen (`utils/summary.ts`)

Cada entrada dura **hasta la siguiente** (ordenadas por hora); `end_time` propio tiene
prioridad. La última sin `end_time` dura hasta el *límite*: **hoy** = hora actual; **día
pasado** = `CLOSE_HOUR` (constante, default **22:00**). Si el límite ≤ última entrada, se
asignan 60 min mínimos. `porcentaje = minutos_tag / total`.

## Convenciones

- **Idioma:** UI, comentarios y nombres de dominio en **español**. Mantén ese estilo.
- **Fechas:** usa los helpers de `utils/date.ts` (`toISODate`/`fromISODate`/`todayISO`).
  Nunca uses `toISOString()` para fechas locales (bug de zona horaria). Días = `'YYYY-MM-DD'`,
  horas = `'HH:MM'`/`'HH:MM:SS'`.
- **Tailwind:** clases de color dinámicas deben ser **strings estáticos completos** (Tailwind
  purga las construidas por concatenación) — ver `completionColorClasses`.
- **Mobile-first** y soporte dark mode (`dark:` + `colorScheme`) en todo componente nuevo.
- Cambios de datos: pasa por `services/` → `hooks/`, no llames a `supabase` desde componentes.
