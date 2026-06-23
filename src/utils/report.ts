import type { EntryWithTag, GoalWithTag, NoteWithTag, TagSummary } from '../types';
import { displayTime, formatDuration, longDate } from './date';

export interface ReportOptions {
  logs: boolean;
  notes: boolean;
  goals: boolean;
}

export interface ReportData {
  day: string;
  summaries: TagSummary[];
  totalMinutes: number;
  entries: EntryWithTag[];
  notes: NoteWithTag[];
  goals: GoalWithTag[];
}

/** Logs agrupados por etiqueta, en el orden del resumen (más tiempo primero). */
export function groupEntriesByTag(
  entries: EntryWithTag[],
  summaries: TagSummary[],
): { name: string; entries: EntryWithTag[] }[] {
  return summaries
    .map((s) => ({
      name: s.name,
      entries: entries
        .filter((e) => (e.tag_id ?? null) === s.tagId)
        .sort((a, b) => a.entry_time.localeCompare(b.entry_time)),
    }))
    .filter((g) => g.entries.length > 0);
}

function logLine(e: EntryWithTag): string {
  const time = e.end_time
    ? `${displayTime(e.entry_time)}–${displayTime(e.end_time)}`
    : displayTime(e.entry_time);
  return `${time} ${e.text}`;
}

function noteLine(n: NoteWithTag): string {
  const prefix = n.pending ? `[${n.done ? '✓' : 'Pendiente'}${n.due_date ? ` ${n.due_date}` : ''}] ` : '';
  return `${displayTime(n.note_time)} ${prefix}${n.text.replace(/\n+/g, ' ')}`;
}

/** Construye el reporte del día en Markdown según las opciones elegidas. */
export function buildReport(data: ReportData, options: ReportOptions): string {
  const { day, summaries, totalMinutes, entries, notes, goals } = data;
  const completed = goals.filter((g) => g.completed);
  const lines: string[] = [];

  lines.push(`# Resumen — ${longDate(day)}`, '');

  // --- Estadísticas (siempre) ---
  lines.push('## Estadísticas');
  lines.push(`- Tiempo total registrado: ${formatDuration(totalMinutes)}`);
  lines.push(
    `- Logs: ${entries.length} · Notas: ${notes.length} · ` +
      `Pendientes: ${notes.filter((n) => n.pending).length} · ` +
      `Objetivos cumplidos: ${completed.length} de ${goals.length}`,
  );
  if (summaries.length > 0) {
    lines.push('', '### Tiempo por etiqueta');
    for (const s of summaries) {
      lines.push(`- ${s.name}: ${formatDuration(s.minutes)} (${s.percent.toFixed(0)}%)`);
    }
  }

  // --- Objetivos cumplidos ---
  if (options.goals && completed.length > 0) {
    lines.push('', '## Objetivos cumplidos');
    for (const g of completed) {
      const tag = g.tag ? ` (${g.tag.name})` : '';
      lines.push(`- [${g.completion_percent}%] ${g.text}${tag}`);
    }
  }

  // --- Logs agrupados por etiqueta ---
  if (options.logs && entries.length > 0) {
    lines.push('', '## Logs');
    for (const group of groupEntriesByTag(entries, summaries)) {
      lines.push('', `### ${group.name}`);
      for (const e of group.entries) lines.push(`- ${logLine(e)}`);
    }
  }

  // --- Notas ---
  if (options.notes && notes.length > 0) {
    lines.push('', '## Notas');
    const sorted = [...notes].sort((a, b) => a.note_time.localeCompare(b.note_time));
    for (const n of sorted) lines.push(`- ${noteLine(n)}`);
  }

  return lines.join('\n') + '\n';
}

/** Descarga el texto como archivo (Markdown). */
export function downloadReport(day: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resumen-${day}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
