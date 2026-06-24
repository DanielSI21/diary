import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Tag } from '../../types';
import { createEntriesBulk } from '../../services/entries';
import { parseLogs } from '../../utils/importLogs';
import { displayTime, longDate } from '../../utils/date';
import TagDot from '../tags/TagDot';

interface Props {
  day: string; // día en el que se importarán los logs (el de la pantalla, no "hoy")
  tags: Tag[];
  onImported: () => Promise<void>;
}

export default function ImportLogs({ day, tags, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Previsualización en vivo (solo si ya escribió algo).
  const parsed = useMemo(
    () => (raw.trim() ? parseLogs(raw, tags) : null),
    [raw, tags],
  );

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRaw(String(reader.result ?? ''));
      setDone(null);
      setFatal(null);
    };
    reader.readAsText(file);
    e.target.value = ''; // permite resubir el mismo archivo
  }

  async function doImport() {
    if (!parsed || parsed.logs.length === 0) return;
    setBusy(true);
    setFatal(null);
    try {
      const count = await createEntriesBulk(day, parsed.logs);
      setDone(`${count} log${count === 1 ? '' : 's'} importado${count === 1 ? '' : 's'}.`);
      setRaw('');
      await onImported();
    } catch (err) {
      setFatal((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h2 className="font-semibold">Importar logs</h2>
        <span className="text-slate-400">{open ? '–' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pega el JSON que te entregó ChatGPT o Claude (o sube un archivo). Se
            guardarán en <span className="font-medium">{longDate(day)}</span>.
          </p>

          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setDone(null);
              setFatal(null);
            }}
            placeholder='[{ "start": "20:10", "end": "20:50", "description": "…", "tag": "Trabajo" }]'
            rows={6}
            className="input resize-y font-mono text-xs"
            spellCheck={false}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.txt,application/json,text/plain"
              onChange={onFile}
              className="hidden"
            />
            <button onClick={() => fileRef.current?.click()} className="btn-ghost">
              Subir archivo
            </button>
            {raw && (
              <button onClick={() => { setRaw(''); setDone(null); setFatal(null); }} className="btn-ghost">
                Limpiar
              </button>
            )}
            <button
              onClick={doImport}
              disabled={busy || !parsed || parsed.logs.length === 0}
              className="btn-primary ml-auto"
            >
              {busy
                ? 'Importando…'
                : `Importar${parsed && parsed.logs.length ? ` ${parsed.logs.length}` : ''}`}
            </button>
          </div>

          {fatal && <p className="text-sm text-red-600">{fatal}</p>}
          {done && <p className="text-sm text-green-600 dark:text-green-400">{done}</p>}

          {parsed?.error && <p className="text-sm text-red-600">{parsed.error}</p>}

          {parsed && parsed.logs.length > 0 && (
            <div className="space-y-1 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              <p className="px-1 text-xs font-medium text-slate-500">
                Previsualización ({parsed.logs.length})
              </p>
              {parsed.logs.map((l, i) => {
                const tag = l.tag_id ? tags.find((t) => t.id === l.tag_id) : null;
                return (
                  <div key={i} className="flex items-start gap-2 px-1 py-0.5 text-sm">
                    <span className="shrink-0 font-mono tabular-nums text-slate-500">
                      {displayTime(l.entry_time)}
                      {l.end_time ? `–${displayTime(l.end_time)}` : ''}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{l.text}</span>
                    {tag && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <TagDot color={tag.color} />
                        {tag.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {parsed && parsed.warnings.length > 0 && (
            <ul className="space-y-0.5 text-xs text-amber-600 dark:text-amber-400">
              {parsed.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
