import { useMemo, useState, type FormEvent } from 'react';
import type { EntryWithTag, NoteWithTag, Tag } from '../../types';
import { createEntry } from '../../services/entries';
import { nowHM, normalizeHM } from '../../utils/date';
import TagSelect from '../tags/TagSelect';
import TimeInput from '../TimeInput';
import DiaryRow from './DiaryRow';
import NoteRow from '../notes/NoteRow';

interface Props {
  day: string;
  entries: EntryWithTag[];
  tags: Tag[];
  loading: boolean;
  onChanged: () => Promise<void>;
  notes: NoteWithTag[];
  onNotesChanged: () => Promise<void>;
}

type TimelineItem =
  | { kind: 'entry'; time: string; entry: EntryWithTag }
  | { kind: 'note'; time: string; note: NoteWithTag };

export default function DiarySection({
  day,
  entries,
  tags,
  loading,
  onChanged,
  notes,
  onNotesChanged,
}: Props) {
  // La hora arranca en "ahora" y es totalmente editable.
  const [time, setTime] = useState(nowHM());
  const [endTime, setEndTime] = useState(''); // opcional
  const [text, setText] = useState('');
  const [tagId, setTagId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  // Logs + notas (si están activadas) intercalados por hora de inicio.
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = entries.map((entry) => ({
      kind: 'entry',
      time: entry.entry_time,
      entry,
    }));
    if (showNotes) {
      for (const note of notes) items.push({ kind: 'note', time: note.note_time, note });
    }
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [entries, notes, showNotes]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const hm = normalizeHM(time);
    if (!hm) {
      setError('Hora inválida. Usa formato HH:MM (ej. 10:37).');
      return;
    }
    let endHm: string | null = null;
    if (endTime.trim()) {
      endHm = normalizeHM(endTime);
      if (!endHm) {
        setError('Hora final inválida. Usa formato HH:MM o déjala vacía.');
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      await createEntry({ day, entry_time: hm, end_time: endHm, text: value, tag_id: tagId });
      // Reset: texto y hora final vacíos, hora de inicio a "ahora".
      setText('');
      setEndTime('');
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Diario del día</h2>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={showNotes}
            onChange={(e) => setShowNotes(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Mostrar notas
        </label>
      </div>

      {/* Captura rápida */}
      <form onSubmit={add} className="space-y-2">
        <div className="flex items-center gap-2">
          <TimeInput
            value={time}
            onChange={setTime}
            ariaLabel="Hora de inicio"
            className="input w-20 shrink-0 text-center font-mono tabular-nums"
          />
          <span className="text-slate-400">→</span>
          <TimeInput
            value={endTime}
            onChange={setEndTime}
            ariaLabel="Hora final (opcional)"
            placeholder="fin"
            className="input w-20 shrink-0 text-center font-mono tabular-nums placeholder:font-sans"
          />
          <span className="text-xs text-slate-400">opcional</span>
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué estás haciendo?"
          className="input"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary shrink-0">
            Guardar
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 space-y-1">
        {timeline.map((item) =>
          item.kind === 'entry' ? (
            <DiaryRow key={`e-${item.entry.id}`} entry={item.entry} tags={tags} onChanged={onChanged} />
          ) : (
            <NoteRow key={`n-${item.note.id}`} note={item.note} tags={tags} onChanged={onNotesChanged} />
          ),
        )}
        {!loading && timeline.length === 0 && (
          <p className="py-2 text-sm text-slate-400">
            Aún no hay registros. Escribe arriba para empezar.
          </p>
        )}
      </div>
    </section>
  );
}
