import { useState, type FormEvent } from 'react';
import type { NoteWithTag, Tag } from '../../types';
import { createNote } from '../../services/notes';
import { nowHM, normalizeHM } from '../../utils/date';
import TagSelect from '../tags/TagSelect';
import NoteRow from './NoteRow';

interface Props {
  day: string;
  notes: NoteWithTag[];
  tags: Tag[];
  loading: boolean;
  onChanged: () => Promise<void>;
}

export default function NotesSection({ day, notes, tags, loading, onChanged }: Props) {
  const [time, setTime] = useState(nowHM());
  const [text, setText] = useState('');
  const [tagId, setTagId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const hm = normalizeHM(time);
    if (!hm) {
      setError('Hora inválida. Usa formato HH:MM (ej. 10:37).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createNote({
        day,
        note_time: hm,
        text: value,
        tag_id: tagId,
        pending,
        due_date: pending && dueDate ? dueDate : null,
      });
      setText('');
      setPending(false);
      setDueDate('');
      setTime(nowHM());
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 className="mb-3 font-semibold">Notas del día</h2>

      <form onSubmit={add} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Hora"
            className="input w-28 shrink-0 font-mono tabular-nums"
          />
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe una nota o pensamiento… (puedes pegar enlaces)"
          rows={2}
          className="input resize-y"
          autoComplete="off"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={pending}
              onChange={(e) => setPending(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Pendiente
          </label>
          {pending && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Fecha del pendiente (opcional)"
              className="input w-auto flex-1"
            />
          )}
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary ml-auto shrink-0">
            Guardar
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 space-y-1">
        {notes.map((note) => (
          <NoteRow key={note.id} note={note} tags={tags} onChanged={onChanged} />
        ))}
        {!loading && notes.length === 0 && (
          <p className="py-2 text-sm text-slate-400">
            Aún no hay notas. Escribe arriba para empezar.
          </p>
        )}
      </div>
    </section>
  );
}
