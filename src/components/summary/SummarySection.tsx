import { useMemo, useState } from 'react';
import type { EntryWithTag, GoalWithTag, NoteWithTag } from '../../types';
import { computeDaySummary } from '../../utils/summary';
import { groupEntriesByTag } from '../../utils/report';
import { completionColorClasses } from '../../utils/goals';
import { displayTime, formatDuration, todayISO } from '../../utils/date';
import DonutChart from './DonutChart';
import ReportDialog from './ReportDialog';
import TagDot from '../tags/TagDot';

interface Props {
  day: string;
  entries: EntryWithTag[];
  goals: GoalWithTag[];
  notes: NoteWithTag[];
}

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

  const [showReport, setShowReport] = useState(false);

  const hasAnything = entries.length > 0 || notes.length > 0 || completedGoals.length > 0;
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
        <section className="card">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold">Resumen del día</h2>
            <span className="text-xs text-slate-400">Total: {formatDuration(totalMinutes)}</span>
          </div>
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
        </section>
      )}

      {/* Detalle enlistado: objetivos, logs por etiqueta, notas */}
      <section className="card space-y-4">
        <h2 className="font-semibold">Detalle</h2>

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
      </section>

      <button onClick={() => setShowReport(true)} className="btn-primary w-full">
        Descargar resumen
      </button>

      {showReport && (
        <ReportDialog
          data={{ day, summaries, totalMinutes, entries, notes, goals }}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
