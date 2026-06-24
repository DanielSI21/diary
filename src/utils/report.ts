import type { EntryWithTag, GoalWithTag, NoteWithTag, TagSummary } from '../types';
import { displayTime, formatDuration, longDate } from './date';
import { ANALYSIS_PROMPT } from './analysisPrompt';

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
  /** Análisis guardado para el día (Markdown), si existe. */
  analysis?: string | null;
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

  // --- Análisis guardado (al final, conserva el Markdown tal cual) ---
  if (data.analysis && data.analysis.trim()) {
    lines.push('', '# Análisis guardado', '', data.analysis.trim());
  }

  return lines.join('\n') + '\n';
}

/**
 * Resumen completo del día para enviar a un modelo (todos los goals —cumplidos
 * y pendientes—, todos los logs y notas). No depende de las opciones del reporte.
 */
export function buildAnalysisSummary(data: ReportData): string {
  const { day, summaries, totalMinutes, entries, notes, goals } = data;
  const completed = goals.filter((g) => g.completed);
  const lines: string[] = [];

  lines.push(`## Día — ${longDate(day)}`, '');

  // Estadísticas
  lines.push('### Estadísticas');
  lines.push(`- Tiempo total registrado: ${formatDuration(totalMinutes)}`);
  lines.push(
    `- Logs: ${entries.length} · Notas: ${notes.length} · ` +
      `Pendientes: ${notes.filter((n) => n.pending).length} · ` +
      `Objetivos cumplidos: ${completed.length} de ${goals.length}`,
  );
  if (summaries.length > 0) {
    lines.push('', '#### Tiempo por etiqueta');
    for (const s of summaries) {
      lines.push(`- ${s.name}: ${formatDuration(s.minutes)} (${s.percent.toFixed(0)}%)`);
    }
  }

  // Objetivos (todos, con estado)
  if (goals.length > 0) {
    lines.push('', '### Objetivos');
    for (const g of goals) {
      const tag = g.tag ? ` (${g.tag.name})` : '';
      const state = g.completed ? `[cumplido ${g.completion_percent}%]` : '[pendiente]';
      lines.push(`- ${state} ${g.text}${tag}`);
    }
  }

  // Logs agrupados por etiqueta
  if (entries.length > 0) {
    lines.push('', '### Logs');
    for (const group of groupEntriesByTag(entries, summaries)) {
      lines.push('', `#### ${group.name}`);
      for (const e of group.entries) lines.push(`- ${logLine(e)}`);
    }
  }

  // Notas / pendientes / pensamientos
  if (notes.length > 0) {
    lines.push('', '### Notas y pendientes');
    const sorted = [...notes].sort((a, b) => a.note_time.localeCompare(b.note_time));
    for (const n of sorted) {
      const tag = n.tag ? ` (${n.tag.name})` : '';
      lines.push(`- ${noteLine(n)}${tag}`);
    }
  }

  return lines.join('\n');
}

/**
 * Texto listo para pegar en ChatGPT/Claude/Codex: prompt fijo + resumen del día
 * y, si existe, el análisis previo guardado (claramente separado del contenido
 * original para que el modelo no lo confunda con un log).
 */
export function buildAnalysisClipboard(data: ReportData): string {
  const parts: string[] = [];

  parts.push('# Prompt de análisis', '', ANALYSIS_PROMPT);
  parts.push('', '# Resumen del día', '', buildAnalysisSummary(data));

  if (data.analysis && data.analysis.trim()) {
    parts.push(
      '',
      '# Análisis previo guardado',
      '',
      '> Lo siguiente es un análisis generado anteriormente, NO un log original del día.',
      '',
      data.analysis.trim(),
    );
  }

  return parts.join('\n') + '\n';
}

/** Copia texto al portapapeles; devuelve true si lo logró. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cae al método de respaldo
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
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
