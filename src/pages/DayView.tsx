import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { GoalWithTag } from '../types';
import { addDays, longDate, todayISO } from '../utils/date';
import { findCompletableGoals } from '../utils/goals';
import { updateGoal } from '../services/goals';
import { linkEntriesToGoal } from '../services/entries';
import { useTags } from '../hooks/useTags';
import { useEntries } from '../hooks/useEntries';
import { useGoals } from '../hooks/useGoals';
import { useNotes, useDueNotes } from '../hooks/useNotes';
import GoalsSection from '../components/goals/GoalsSection';
import CompletionDialog from '../components/goals/CompletionDialog';
import DiarySection from '../components/diary/DiarySection';
import ImportLogs from '../components/diary/ImportLogs';
import SummarySection from '../components/summary/SummarySection';
import NotesSection from '../components/notes/NotesSection';
import PendingBanner from '../components/notes/PendingBanner';
import TagDot from '../components/tags/TagDot';

type Tab = 'day' | 'notes' | 'summary';

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const day = date ?? todayISO();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('day');

  const { tags } = useTags();
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals(day);
  const { entries, loading: entriesLoading, refresh: refreshEntries } = useEntries(day);
  const { notes, loading: notesLoading, refresh: refreshNotes } = useNotes(day);
  const { notes: dueNotes, refresh: refreshDue } = useDueNotes(day);

  // El banner se resuelve marcando "hecho" o convirtiendo en objetivo;
  // refresca notas y objetivos para reflejar ambos casos.
  const onDueChanged = async () => {
    await Promise.all([refreshDue(), refreshNotes(), refreshGoals()]);
  };

  // Diálogo de porcentaje (compartido por sugerencia y por marcado directo).
  const [completing, setCompleting] = useState<GoalWithTag | null>(null);
  // Sugerencias ya descartadas en esta sesión (por id de objetivo).
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Detecta el primer objetivo completable a partir de logs finalizados.
  const suggestion = useMemo(() => {
    const candidates = findCompletableGoals(goals, entries).filter((g) => !dismissed.has(g.id));
    return candidates[0] ?? null;
  }, [goals, entries, dismissed]);

  // Si cambia el día, limpia descartes y diálogo.
  useEffect(() => {
    setDismissed(new Set());
    setCompleting(null);
  }, [day]);

  async function confirmCompletion(percent: number) {
    if (!completing) return;
    await updateGoal(completing.id, { completed: true, completion_percent: percent });
    if (completing.tag_id) {
      await linkEntriesToGoal(day, completing.tag_id, completing.id);
    }
    setCompleting(null);
    setDismissed((prev) => new Set(prev).add(completing.id));
    await Promise.all([refreshGoals(), refreshEntries()]);
  }

  const isToday = day === todayISO();
  const go = (d: string) => navigate(`/day/${d}`);

  return (
    <div className="space-y-4">
      {/* Navegación de fecha */}
      <div className="flex items-center justify-between">
        <button onClick={() => go(addDays(day, -1))} className="btn-ghost" aria-label="Día anterior">
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">{longDate(day)}</p>
          {!isToday && (
            <button onClick={() => go(todayISO())} className="text-xs text-slate-400 hover:text-slate-600">
              Volver a hoy
            </button>
          )}
        </div>
        <button onClick={() => go(addDays(day, 1))} className="btn-ghost" aria-label="Día siguiente">
          ›
        </button>
      </div>

      {/* Pestañas Día / Notas / Resumen */}
      <div className="flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
        {(
          [
            ['day', 'Día'],
            ['notes', 'Notas'],
            ['summary', 'Resumen'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              tab === t ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Pendientes que vencen este día (visible en cualquier pestaña). */}
      <PendingBanner day={day} notes={dueNotes} onChanged={onDueChanged} />

      {tab === 'day' && (
        <>
          {/* Sugerencia: log finalizado con tag de un objetivo no cumplido */}
          {suggestion && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  {suggestion.tag && <TagDot color={suggestion.tag.color} />}
                  Finalizaste un log de «{suggestion.tag?.name}».
                </p>
                <p className="truncate text-slate-500">
                  ¿Marcar «{suggestion.text}» como cumplido?
                </p>
              </div>
              <button onClick={() => setCompleting(suggestion)} className="btn-primary shrink-0">
                Sí
              </button>
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(suggestion.id))}
                className="btn-ghost shrink-0"
              >
                Ahora no
              </button>
            </div>
          )}

          <GoalsSection
            day={day}
            goals={goals}
            loading={goalsLoading}
            tags={tags}
            onRefresh={refreshGoals}
            onRequestComplete={setCompleting}
          />
          <DiarySection
            day={day}
            entries={entries}
            tags={tags}
            loading={entriesLoading}
            onChanged={refreshEntries}
            notes={notes}
            onNotesChanged={refreshNotes}
          />
          <ImportLogs day={day} tags={tags} onImported={refreshEntries} />
        </>
      )}

      {tab === 'notes' && (
        <NotesSection
          day={day}
          notes={notes}
          tags={tags}
          loading={notesLoading}
          onChanged={refreshNotes}
        />
      )}

      {tab === 'summary' && (
        <SummarySection day={day} entries={entries} goals={goals} notes={notes} />
      )}

      {completing && (
        <CompletionDialog
          goal={completing}
          onConfirm={confirmCompletion}
          onCancel={() => setCompleting(null)}
        />
      )}
    </div>
  );
}
