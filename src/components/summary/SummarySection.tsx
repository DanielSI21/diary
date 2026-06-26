import { useMemo, useState } from 'react';
import type { EntryWithTag, GoalWithTag, NoteWithTag } from '../../types';
import { computeDaySummary } from '../../utils/summary';
import {
  buildAnalysisClipboard,
  buildWeeklyAnalysisClipboard,
  copyToClipboard,
  groupEntriesByTag,
  type ReportData,
} from '../../utils/report';
import { completionColorClasses } from '../../utils/goals';
import { addDays, displayTime, formatDuration, todayISO } from '../../utils/date';
import { listEntriesRange } from '../../services/entries';
import { listNotesRange } from '../../services/notes';
import { listGoalsRange } from '../../services/goals';
import { listAnalysesRange } from '../../services/analyses';
import { useAnalysis } from '../../hooks/useAnalysis';
import DonutChart from './DonutChart';
import ReportDialog from './ReportDialog';
import AnalysisDialog from './AnalysisDialog';
import Markdown from './Markdown';
import TagDot from '../tags/TagDot';
import CollapsibleSection from '../CollapsibleSection';

interface Props {
  day: string;
  entries: EntryWithTag[];
  goals: GoalWithTag[];
  notes: NoteWithTag[];
}

type CopyState = 'idle' | 'copied' | 'error';

export default function SummarySection({ day, entries, goals, notes }: Props) {
  const { summaries, totalMinutes } = useMemo(
    () => computeDaySummary(entries, day),
    [entries, day],
  );
  const logGroups = useMemo(() => groupEntriesByTag(entries, summaries), [entries, summaries]);
  const completedGoals = useMemo(() => goals.filter((g) => g.completed), [goals]);
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => a.note_time.localeCompare(b.note_time)),
    [notes],
  );

  const { analysis, save: saveAnalysis, remove: removeAnalysis } = useAnalysis(day);

  const [showReport, setShowReport] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [weeklyState, setWeeklyState] = useState<CopyState>('idle');

  const reportData: ReportData = {
    day,
    summaries,
    totalMinutes,
    entries,
    notes,
    goals,
    analysis: analysis?.text ?? null,
  };

  async function copyForAnalysis() {
    const ok = await copyToClipboard(buildAnalysisClipboard(reportData));
    setCopyState(ok ? 'copied' : 'error');
    setTimeout(() => setCopyState('idle'), 2500);
  }

  // Copia el resumen de los últimos 7 días (día visto y los 6 anteriores),
  // incluyendo logs, notas, objetivos y los análisis previos (de día y por ítem).
  async function copyWeeklyForAnalysis() {
    try {
      const start = addDays(day, -6);
      const [ent, nts, gls, ans] = await Promise.all([
        listEntriesRange(start, day),
        listNotesRange(start, day),
        listGoalsRange(start, day),
        listAnalysesRange(start, day),
      ]);
      const analysisByDay = new Map(ans.map((a) => [a.day, a.text]));
      const days: ReportData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = addDays(day, -i);
        const dEntries = ent.filter((e) => e.day === d);
        const { summaries, totalMinutes } = computeDaySummary(dEntries, d);
        days.push({
          day: d,
          summaries,
          totalMinutes,
          entries: dEntries,
          notes: nts.filter((n) => n.day === d),
          goals: gls.filter((g) => g.day === d),
          analysis: analysisByDay.get(d) ?? null,
        });
      }
      const ok = await copyToClipboard(buildWeeklyAnalysisClipboard(days));
      setWeeklyState(ok ? 'copied' : 'error');
    } catch {
      setWeeklyState('error');
    }
    setTimeout(() => setWeeklyState('idle'), 2500);
  }

  async function deleteAnalysis() {
    if (!confirm('¿Eliminar el análisis guardado de este día?')) return;
    await removeAnalysis();
  }

  const hasAnything =
    entries.length > 0 || notes.length > 0 || completedGoals.length > 0 || !!analysis;
  if (!hasAnything) {
    return (
      <section className="card text-center text-sm text-slate-400">
        Sin registros, notas ni objetivos cumplidos para resumir.
      </section>
    );
  }

  const boundaryNote =
    day === todayISO()
      ? 'La última entrada cuenta hasta la hora actual.'
      : 'La última entrada cuenta hasta las 22:00.';

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <CollapsibleSection
          title="Resumen del día"
          right={<span className="text-xs text-slate-400">Total: {formatDuration(totalMinutes)}</span>}
        >
          <p className="mb-4 text-xs text-slate-400">{boundaryNote}</p>

          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative">
              <DonutChart data={summaries} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{formatDuration(totalMinutes)}</span>
                <span className="text-xs text-slate-400">registrado</span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-2">
              {summaries.map((s) => (
                <li key={s.tagId ?? 'none'} className="flex items-center gap-2 text-sm">
                  <TagDot color={s.color} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular-nums text-slate-500">{formatDuration(s.minutes)}</span>
                  <span className="w-12 text-right tabular-nums text-slate-400">
                    {s.percent.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleSection>
      )}

      {/* Detalle enlistado: objetivos, logs por etiqueta, notas */}
      <CollapsibleSection title="Detalle" bodyClassName="space-y-4">
        {completedGoals.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium text-slate-500">Objetivos cumplidos</h3>
            <ul className="space-y-1">
              {completedGoals.map((g) => (
                <li key={g.id} className="flex items-center gap-2 text-sm">
                  {g.tag && <TagDot color={g.tag.color} />}
                  <span className="min-w-0 flex-1 break-words">{g.text}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 text-xs font-medium tabular-nums ${completionColorClasses(
                      g.completion_percent,
                    )}`}
                  >
                    {g.completion_percent}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {logGroups.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium text-slate-500">Logs</h3>
            <div className="space-y-2">
              {logGroups.map((group) => (
                <div key={group.name}>
                  <p className="text-sm font-medium">{group.name}:</p>
                  <ul className="mt-0.5 space-y-0.5 pl-3">
                    {group.entries.map((e) => (
                      <li key={e.id} className="flex gap-2 text-sm">
                        <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">
                          {displayTime(e.entry_time)}
                          {e.end_time && (
                            <span className="text-slate-400">–{displayTime(e.end_time)}</span>
                          )}
                        </span>
                        <span className="min-w-0 break-words">{e.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedNotes.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium text-slate-500">Notas</h3>
            <ul className="space-y-1">
              {sortedNotes.map((n) => (
                <li key={n.id} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">
                    {displayTime(n.note_time)}
                  </span>
                  {n.pending && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                      {n.done ? '✓' : 'Pend.'}
                    </span>
                  )}
                  <span
                    className={`min-w-0 break-words ${n.done ? 'text-slate-400 line-through' : ''}`}
                  >
                    {n.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CollapsibleSection>

      {/* Análisis guardado */}
      {analysis && (
        <CollapsibleSection
          title="Análisis guardado"
          right={
            <div className="flex gap-2">
              <button onClick={() => setShowAnalysisDialog(true)} className="btn-ghost text-xs">
                Editar
              </button>
              <button
                onClick={deleteAnalysis}
                className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </div>
          }
        >
          <Markdown
            text={analysis.text}
            className="break-words text-slate-700 dark:text-slate-200"
          />
        </CollapsibleSection>
      )}

      {/* Acciones */}
      <div className="space-y-2">
        <button onClick={() => setShowReport(true)} className="btn-primary w-full">
          Descargar resumen
        </button>
        <button onClick={copyForAnalysis} className="btn-ghost w-full border border-slate-200 dark:border-slate-700">
          {copyState === 'copied'
            ? '¡Copiado!'
            : copyState === 'error'
              ? 'No se pudo copiar'
              : 'Copiar resumen para análisis'}
        </button>
        <button
          onClick={copyWeeklyForAnalysis}
          className="btn-ghost w-full border border-slate-200 dark:border-slate-700"
        >
          {weeklyState === 'copied'
            ? '¡Copiado!'
            : weeklyState === 'error'
              ? 'No se pudo copiar'
              : 'Copiar resumen de los últimos 7 días para análisis'}
        </button>
        <button
          onClick={() => setShowAnalysisDialog(true)}
          className="btn-ghost w-full border border-slate-200 dark:border-slate-700"
        >
          {analysis ? 'Editar análisis guardado' : 'Guardar análisis'}
        </button>
      </div>

      {showReport && (
        <ReportDialog data={reportData} onClose={() => setShowReport(false)} />
      )}

      {showAnalysisDialog && (
        <AnalysisDialog
          initialText={analysis?.text ?? ''}
          onSave={saveAnalysis}
          onClose={() => setShowAnalysisDialog(false)}
        />
      )}
    </div>
  );
}
