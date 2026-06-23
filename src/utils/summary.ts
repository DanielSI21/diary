import type { DaySummary, EntryWithTag, TagSummary } from '../types';
import { hmToMinutes } from './date';
import { todayISO } from './date';

/**
 * Hora de cierre (en horas, 0-24) usada para acotar la última entrada
 * cuando se consulta un día PASADO. Cambia este valor si quieres otro límite.
 */
export const CLOSE_HOUR = 22;

const NO_TAG_COLOR = '#cbd5e1';
const NO_TAG_NAME = 'Sin etiqueta';

/**
 * Regla de cálculo:
 *  - Si la entrada tiene hora final propia, dura desde su inicio hasta esa hora.
 *  - Si NO tiene hora final, dura hasta que empieza la siguiente entrada.
 *  - La última entrada (sin hora final) dura hasta el "límite":
 *      · día = hoy   -> hora actual
 *      · día pasado  -> CLOSE_HOUR (configurable)
 *  - Si el límite es <= a la última entrada, se le asigna 60 min mínimos.
 */
export function computeDaySummary(entries: EntryWithTag[], day: string): DaySummary {
  if (entries.length === 0) return { summaries: [], totalMinutes: 0 };

  const sorted = [...entries].sort((a, b) => a.entry_time.localeCompare(b.entry_time));

  const isToday = day === todayISO();
  let boundary: number;
  if (isToday) {
    const now = new Date();
    boundary = now.getHours() * 60 + now.getMinutes();
  } else {
    boundary = CLOSE_HOUR * 60;
  }

  const lastMinutes = hmToMinutes(sorted[sorted.length - 1].entry_time) ?? 0;
  if (boundary <= lastMinutes) boundary = lastMinutes + 60;

  const map = new Map<string, TagSummary>();
  let total = 0;

  for (let i = 0; i < sorted.length; i++) {
    const start = hmToMinutes(sorted[i].entry_time) ?? 0;
    const explicitEnd = sorted[i].end_time ? hmToMinutes(sorted[i].end_time as string) : null;
    const end =
      explicitEnd ?? // hora final propia tiene prioridad
      (i < sorted.length - 1 ? hmToMinutes(sorted[i + 1].entry_time) ?? start : boundary);
    const duration = Math.max(0, end - start);
    total += duration;

    const tag = sorted[i].tag;
    const key = tag?.id ?? 'none';
    const existing = map.get(key);
    if (existing) {
      existing.minutes += duration;
    } else {
      map.set(key, {
        tagId: tag?.id ?? null,
        name: tag?.name ?? NO_TAG_NAME,
        color: tag?.color ?? NO_TAG_COLOR,
        minutes: duration,
        percent: 0,
      });
    }
  }

  const summaries = [...map.values()]
    .map((s) => ({ ...s, percent: total ? (s.minutes / total) * 100 : 0 }))
    .sort((a, b) => b.minutes - a.minutes);

  return { summaries, totalMinutes: total };
}
