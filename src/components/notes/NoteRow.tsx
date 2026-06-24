import { useState } from 'react';
import type { NoteWithTag, Tag } from '../../types';
import { deleteNote, setNoteDone, updateNote } from '../../services/notes';
import { displayTime, longDate, normalizeHM } from '../../utils/date';
import TagSelect from '../tags/TagSelect';
import TagDot from '../tags/TagDot';
import TimeInput from '../TimeInput';
import LinkedText from './LinkedText';

interface Props {
  note: NoteWithTag;
  tags: Tag[];
  onChanged: () => Promise<void>;
  /** Muestra la fecha de la nota (vista global de todas las notas). */
  showDay?: boolean;
}

export default function NoteRow({ note, tags, onChanged, showDay }: Props) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(displayTime(note.note_time));
  const [text, setText] = useState(note.text);
  const [tagId, setTagId] = useState<string | null>(note.tag_id);
  const [pending, setPending] = useState(note.pending);
  const [dueDate, setDueDate] = useState(note.due_date ?? '');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = text.trim();
    const hm = normalizeHM(time);
    if (!value) return setError('El texto no puede estar vacío.');
    if (!hm) return setError('Hora inválida (HH:MM).');
    await updateNote(note.id, {
      note_time: hm,
      text: value,
      tag_id: tagId,
      pending,
      due_date: pending && dueDate ? dueDate : null,
    });
    setEditing(false);
    setError(null);
    await onChanged();
  }

  async function remove() {
    await deleteNote(note.id);
    await onChanged();
  }

  async function toggleDone() {
    await setNoteDone(note.id, !note.done);
    await onChanged();
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <TimeInput
            value={time}
            onChange={setTime}
            ariaLabel="Hora"
            className="input w-20 shrink-0 text-center font-mono tabular-nums"
          />
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="input mt-2 resize-y"
          autoFocus
        />
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={pending}
            onChange={(e) => setPending(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Marcar como pendiente
        </label>
        {pending && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Fecha (opcional):</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input flex-1"
            />
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button onClick={save} className="btn-primary flex-1">
            Guardar
          </button>
          <button onClick={() => setEditing(false)} className="btn-ghost shrink-0">
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      {note.pending ? (
        <button
          onClick={toggleDone}
          aria-label={note.done ? 'Reabrir pendiente' : 'Marcar como hecho'}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            note.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {note.done && (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ) : (
        <span className="mt-0.5 w-12 shrink-0 font-mono text-xs tabular-nums text-slate-500">
          {displayTime(note.note_time)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <LinkedText
          text={note.text}
          className={`block break-words text-sm ${note.done ? 'text-slate-400 line-through' : ''}`}
        />
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
          {showDay && <span>{longDate(note.day)}</span>}
          {note.pending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Pendiente{note.due_date ? ` · ${note.due_date}` : ''}
            </span>
          )}
          {note.tag && (
            <span className="inline-flex items-center gap-1">
              <TagDot color={note.tag.color} />
              {note.tag.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => setEditing(true)}
          aria-label="Editar"
          className="rounded p-1 text-slate-400 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
        <button
          onClick={remove}
          aria-label="Eliminar"
          className="rounded p-1 text-slate-400 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 7h12M9 7V5h6v2m-1 0v12M10 7v12M5 7l1 13h12l1-13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
