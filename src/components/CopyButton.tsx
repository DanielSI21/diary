import { useState } from 'react';
import { copyToClipboard } from '../utils/report';

interface Props {
  /** Texto que se copia tal cual al portapapeles. */
  text: string;
  ariaLabel?: string;
  className?: string;
}

/** Botón-ícono para copiar texto puro al portapapeles, con feedback breve. */
export default function CopyButton({ text, ariaLabel = 'Copiar texto', className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      aria-label={copied ? 'Copiado' : ariaLabel}
      className={`rounded p-1 text-slate-400 hover:text-slate-700 ${className ?? ''}`}
    >
      {copied ? (
        <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      )}
    </button>
  );
}
