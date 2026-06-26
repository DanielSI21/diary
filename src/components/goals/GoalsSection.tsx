import { useState, type FormEvent } from 'react';
import type { GoalWithTag, Tag } from '../../types';
import { createGoal, deleteGoal, updateGoal } from '../../services/goals';
import { completionColorClasses } from '../../utils/goals';
import TagSelect from '../tags/TagSelect';
import TagDot from '../tags/TagDot';
import CollapsibleSection from '../CollapsibleSection';

interface Props {
  day: string;
  goals: GoalWithTag[];
  loading: boolean;
  tags: Tag[];
  onRefresh: () => Promise<void>;
  /** Abre el diálogo de porcentaje (lo gestiona DayView). */
  onRequestComplete: (goal: GoalWithTag) => void;
}

export default function GoalsSection({
  day,
  goals,
  loading,
  tags,
  onRefresh,
  onRequestComplete,
}: Props) {
  const [text, setText] = useState('');
  const [tagId, setTagId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const allDone = goals.length > 0 && goals.every((g) => g.completed);

  async function add(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    try {
      await createGoal({ day, text: value, tag_id: tagId, sort_order: goals.length });
      setText('');
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleSection
      title="Objetivos del día"
      right={
        <span className="text-xs text-slate-400">
          {goals.filter((g) => g.completed).length}/{goals.length}
        </span>
      }
    >
      <ul className="space-y-1">
        {goals.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            tags={tags}
            onRefresh={onRefresh}
            onRequestComplete={onRequestComplete}
          />
        ))}
      </ul>

      {!loading && goals.length === 0 && (
        <p className="py-2 text-sm text-slate-400">Sin objetivos. Añade el primero.</p>
      )}

      {allDone && (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          🎉 ¡Objetivos del día completados!
        </div>
      )}

      <form onSubmit={add} className="mt-3 space-y-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nuevo objetivo…"
          className="input"
        />
        <div className="flex gap-2">
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary shrink-0">
            Añadir
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}

function GoalRow({
  goal,
  tags,
  onRefresh,
  onRequestComplete,
}: {
  goal: GoalWithTag;
  tags: Tag[];
  onRefresh: () => Promise<void>;
  onRequestComplete: (goal: GoalWithTag) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  const [tagId, setTagId] = useState<string | null>(goal.tag_id);

  function toggle() {
    if (goal.completed) {
      // Desmarcar: directo, sin diálogo.
      void updateGoal(goal.id, { completed: false }).then(onRefresh);
    } else {
      // Marcar: abre el diálogo de porcentaje en DayView.
      onRequestComplete(goal);
    }
  }
  async function save() {
    const value = text.trim();
    if (!value) return;
    await updateGoal(goal.id, { text: value, tag_id: tagId });
    setEditing(false);
    await onRefresh();
  }
  async function remove() {
    await deleteGoal(goal.id);
    await onRefresh();
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="input"
        />
        <div className="mt-2 flex gap-2">
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
          <button onClick={save} className="btn-primary shrink-0">
            Guardar
          </button>
          <button onClick={() => setEditing(false)} className="btn-ghost shrink-0">
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <button
        onClick={toggle}
        aria-label={goal.completed ? 'Marcar como no completado' : 'Marcar como completado'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          goal.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {goal.completed && (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1" onClick={() => setEditing(true)}>
        <span
          className={`cursor-text text-sm ${goal.completed ? 'text-slate-400 line-through' : ''}`}
        >
          {goal.text}
        </span>
        {goal.tag && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <TagDot color={goal.tag.color} />
            {goal.tag.name}
          </span>
        )}
      </div>

      {/* Badge de porcentaje: clic para reajustar */}
      {goal.completed && (
        <button
          onClick={() => onRequestComplete(goal)}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition ${completionColorClasses(
            goal.completion_percent,
          )}`}
          title="Ajustar porcentaje"
        >
          {goal.completion_percent}%
        </button>
      )}

      <button
        onClick={remove}
        aria-label="Eliminar objetivo"
        className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M6 7h12M9 7V5h6v2m-1 0v12M10 7v12M5 7l1 13h12l1-13" />
        </svg>
      </button>
    </li>
  );
}
