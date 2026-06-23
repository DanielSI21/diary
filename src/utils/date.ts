const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/** Fecha local -> 'YYYY-MM-DD' (sin zona horaria, evita el bug de toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' -> Date local a medianoche. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Hora actual en formato 'HH:MM'. */
export function nowHM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 'HH:MM' o 'HH:MM:SS' -> minutos desde medianoche. null si es inválido. */
export function hmToMinutes(value: string): number | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Normaliza '9:5' -> '09:05'. Devuelve null si no es válido. */
export function normalizeHM(value: string): string | null {
  const total = hmToMinutes(value);
  if (total === null) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 'HH:MM:SS' -> 'HH:MM' para mostrar. */
export function displayTime(time: string): string {
  return time.slice(0, 5);
}

/** Minutos -> '2h 15m' / '45m'. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Etiqueta legible: 'lunes 22 de junio de 2026' (capitalizada). */
export function longDate(iso: string): string {
  const d = fromISODate(iso);
  const wd = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()];
  const label = `${wd} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthLabel(year: number, month: number): string {
  const label = `${MONTHS[month]} ${year}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export { MONTHS, WEEKDAYS };
