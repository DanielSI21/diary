import { useState } from 'react';
import type { GoalWithTag } from '../../types';
import TagDot from '../tags/TagDot';

interface Props {
  goal: GoalWithTag;
  onConfirm: (percent: number) => void | Promise<void>;
  onCancel: () => void;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export default function CompletionDialog({ goal, onConfirm, onCancel }: Props) {
  const [percent, setPercent] = useState<number>(goal.completion_percent ?? 100);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(clamp(percent));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-semibold">¿Qué tanto lo cumpliste?</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            {goal.tag && <TagDot color={goal.tag.color} />}
            <span className="truncate">{goal.text}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPercent((p) => clamp(p - 5))}
            className="btn-ghost h-10 w-10 text-xl"
            aria-label="Restar 5%"
          >
            −
          </button>
          <div className="flex items-baseline">
            <input
              type="number"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => setPercent(clamp(Number(e.target.value)))}
              className="input w-20 text-center text-2xl font-semibold tabular-nums"
            />
            <span className="ml-1 text-xl font-semibold text-slate-400">%</span>
          </div>
          <button
            type="button"
            onClick={() => setPercent((p) => clamp(p + 5))}
            className="btn-ghost h-10 w-10 text-xl"
            aria-label="Sumar 5%"
          >
            +
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => setPercent(clamp(Number(e.target.value)))}
          className="w-full accent-emerald-500"
        />

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={confirm} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Guardando…' : 'Marcar cumplido'}
          </button>
        </div>
      </div>
    </div>
  );
}
