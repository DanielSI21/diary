import { useRef, useState } from 'react';

interface Props {
  /** Texto inicial (si se está editando un análisis existente). */
  initialText?: string;
  /** Título del diálogo (default = análisis del día). */
  title?: string;
  /** Descripción bajo el título. */
  description?: string;
  onSave: (text: string) => Promise<void> | void;
  onClose: () => void;
}

/** Diálogo para pegar o subir un análisis (texto largo, Markdown). */
export default function AnalysisDialog({
  initialText = '',
  title = 'Guardar análisis',
  description,
  onSave,
  onClose,
}: Props) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setText(await file.text());
    } catch {
      setError('No se pudo leer el archivo.');
    } finally {
      e.target.value = '';
    }
  }

  async function save() {
    if (!text.trim()) {
      setError('Pega o sube un análisis primero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(text);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[85vh] w-full max-w-lg flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {description ?? (
              <>
                Pega el análisis generado por ChatGPT, Claude o Codex, o sube un archivo
                <code className="mx-1">.txt</code>/<code>.md</code>.
              </>
            )}
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí el análisis…"
          className="input min-h-[40vh] flex-1 resize-none font-mono text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            Subir archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={onFile}
            className="hidden"
          />
          <span className="text-xs text-slate-400">{text.length.toLocaleString()} caracteres</span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={saving}>
            Cancelar
          </button>
          <button onClick={save} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
