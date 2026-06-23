import { useState } from 'react';
import { buildReport, downloadReport, type ReportData, type ReportOptions } from '../../utils/report';

interface Props {
  data: ReportData;
  onClose: () => void;
}

const ITEMS: { key: keyof ReportOptions; label: string }[] = [
  { key: 'goals', label: 'Objetivos cumplidos' },
  { key: 'logs', label: 'Logs (agrupados por etiqueta)' },
  { key: 'notes', label: 'Notas' },
];

export default function ReportDialog({ data, onClose }: Props) {
  const [options, setOptions] = useState<ReportOptions>({ goals: true, logs: true, notes: true });

  const toggle = (key: keyof ReportOptions) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  function download() {
    downloadReport(data.day, buildReport(data, options));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="card w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-semibold">Descargar resumen</h3>
          <p className="mt-1 text-sm text-slate-500">
            Las estadísticas siempre se incluyen. Elige qué más añadir:
          </p>
        </div>

        <div className="space-y-2">
          {ITEMS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggle(key)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={download} className="btn-primary flex-1">
            Descargar .md
          </button>
        </div>
      </div>
    </div>
  );
}
