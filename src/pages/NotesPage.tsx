import { useState } from 'react';
import type { NoteKind } from '../services/notes';
import { useAllNotes } from '../hooks/useNotes';
import { useTags } from '../hooks/useTags';
import TagSelect from '../components/tags/TagSelect';
import NoteRow from '../components/notes/NoteRow';

const KINDS: [NoteKind, string][] = [
  ['all', 'Todas'],
  ['note', 'Notas'],
  ['pending', 'Pendientes'],
];

export default function NotesPage() {
  const { tags } = useTags();
  const [kind, setKind] = useState<NoteKind>('all');
  const [tagId, setTagId] = useState<string | null>(null);
  const { notes, loading, refresh } = useAllNotes(kind, tagId);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Notas</h2>

      {/* Filtros */}
      <div className="card space-y-2">
        <div className="flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          {KINDS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                kind === k ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Etiqueta:</span>
          <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
        </div>
      </div>

      <div className="card">
        <div className="space-y-1">
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} tags={tags} onChanged={refresh} showDay />
          ))}
          {loading && <p className="py-2 text-center text-xs text-slate-400">Cargando…</p>}
          {!loading && notes.length === 0 && (
            <p className="py-2 text-sm text-slate-400">
              No hay notas con este filtro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
