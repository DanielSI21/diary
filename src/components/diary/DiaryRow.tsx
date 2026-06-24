import { useState } from 'react';
import type { EntryWithTag, Tag } from '../../types';
import { deleteEntry, updateEntry } from '../../services/entries';
import { displayTime, normalizeHM } from '../../utils/date';
import TagSelect from '../tags/TagSelect';
import TagDot from '../tags/TagDot';

interface Props {
  entry: EntryWithTag;
  tags: Tag[];
  onChanged: () => Promise<void>;
}

export default function DiaryRow({ entry, tags, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(displayTime(entry.entry_time));
  const [endTime, setEndTime] = useState(entry.end_time ? displayTime(entry.end_time) : '');
  const [text, setText] = useState(entry.text);
  const [tagId, setTagId] = useState<string | null>(entry.tag_id);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = text.trim();
    const hm = normalizeHM(time);
    if (!value) return setError('El texto no puede estar vacío.');
    if (!hm) return setError('Hora inválida (HH:MM).');
    let endHm: string | null = null;
    if (endTime.trim()) {
      endHm = normalizeHM(endTime);
      if (!endHm) return setError('Hora final inválida (HH:MM) o déjala vacía.');
    }
    await updateEntry(entry.id, { entry_time: hm, end_time: endHm, text: value, tag_id: tagId });
    setEditing(false);
    setError(null);
    await onChanged();
  }

  async function remove() {
    await deleteEntry(entry.id);
    await onChanged();
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Hora de inicio"
            className="input w-28 shrink-0 font-mono tabular-nums"
          />
          <span className="text-slate-400">→</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            aria-label="Hora final (opcional)"
            className="input w-28 shrink-0 font-mono tabular-nums"
          />
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input mt-2"
          autoFocus
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
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <span className="mt-0.5 w-[4.5rem] shrink-0 font-mono text-xs tabular-nums text-slate-500">
        {displayTime(entry.entry_time)}
        {entry.end_time && <span className="text-slate-400">–{displayTime(entry.end_time)}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm">{entry.text}</p>
        {entry.tag && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
            <TagDot color={entry.tag.color} />
            {entry.tag.name}
          </span>
        )}
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
