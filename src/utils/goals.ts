import type { EntryWithTag, GoalWithTag } from '../types';
import { hmToMinutes } from './date';

/**
 * Clases de color para el badge de porcentaje de cumplimiento.
 * Escala graduada: rojo (bajo) -> naranja -> amarillo -> verde suave -> verde intenso.
 * (Strings estáticos para que Tailwind no los purgue.)
 */
export function completionColorClasses(percent: number): string {
  if (percent >= 91) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
  if (percent >= 81) return 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400';
  if (percent >= 66) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400';
  if (percent >= 51) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400';
}

/**
 * Un log se considera "finalizado" si:
 *  - tiene hora final propia (end_time), o
 *  - existe otro log con hora de inicio posterior (ya hay un log posterior).
 */
export function isEntryFinalized(entry: EntryWithTag, all: EntryWithTag[]): boolean {
  if (entry.end_time) return true;
  const t = hmToMinutes(entry.entry_time) ?? 0;
  return all.some((e) => e.id !== entry.id && (hmToMinutes(e.entry_time) ?? 0) > t);
}

/**
 * Objetivos del día (no cumplidos, con etiqueta) que tienen al menos un log
 * finalizado con esa misma etiqueta -> candidatos a sugerir como cumplidos.
 */
export function findCompletableGoals(
  goals: GoalWithTag[],
  entries: EntryWithTag[],
): GoalWithTag[] {
  return goals.filter(
    (g) =>
      !g.completed &&
      g.tag_id &&
      entries.some((e) => e.tag_id === g.tag_id && isEntryFinalized(e, entries)),
  );
}
