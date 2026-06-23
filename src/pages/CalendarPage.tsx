import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EntryWithTag, GoalWithTag, NoteWithTag } from '../types';
import { listActiveDaysInMonth, listMonthEntries } from '../services/entries';
import { listMonthCompletedGoals } from '../services/goals';
import { listMonthNotes, listNoteDaysInMonth } from '../services/notes';
import { completionColorClasses } from '../utils/goals';
import { useTags } from '../hooks/useTags';
import { displayTime, longDate, monthLabel, toISODate, todayISO, WEEKDAYS } from '../utils/date';
import TagDot from '../components/tags/TagDot';
import TagSelect from '../components/tags/TagSelect';

type Mode = 'none' | 'goals' | 'logs' | 'notes';
type CalItem = GoalWithTag | EntryWithTag | NoteWithTag;

const NEUTRAL = '#94a3b8';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { tags } = useTags();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const [mode, setMode] = useState<Mode>('none');
  const [tagId, setTagId] = useState<string | null>(null);

  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<GoalWithTag[]>([]);
  const [entries, setEntries] = useState<EntryWithTag[]>([]);
  const [notes, setNotes] = useState<NoteWithTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const load = async () => {
      if (mode === 'goals') {
        const g = await listMonthCompletedGoals(year, month, tagId);
        if (alive) setGoals(g);
      } else if (mode === 'logs') {
        const e = await listMonthEntries(year, month, tagId);
        if (alive) setEntries(e);
      } else if (mode === 'notes') {
        const n = await listMonthNotes(year, month, tagId);
        if (alive) setNotes(n);
      } else {
        const [d, noteDays] = await Promise.all([
          listActiveDaysInMonth(year, month),
          listNoteDaysInMonth(year, month),
        ]);
        if (alive) setActiveDays(new Set([...d, ...noteDays]));
      }
    };
    load().finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [year, month, mode, tagId]);

  const selectedTagColor = tagId ? tags.find((t) => t.id === tagId)?.color ?? NEUTRAL : null;

  // Mapa día -> color e items, según el modo activo.
  const { dayColor, byDay } = useMemo(() => {
    const colorMap = new Map<string, string>();
    const items = new Map<string, CalItem[]>();

    const push = (day: string, item: CalItem, color: string) => {
      if (!items.has(day)) items.set(day, []);
      items.get(day)!.push(item);
      if (!colorMap.has(day)) colorMap.set(day, selectedTagColor ?? color);
    };

    if (mode === 'goals') {
      for (const g of goals) push(g.day, g, g.tag?.color ?? NEUTRAL);
    } else if (mode === 'logs') {
      for (const e of entries) push(e.day, e, e.tag?.color ?? NEUTRAL);
    } else if (mode === 'notes') {
      for (const n of notes) push(n.day, n, n.tag?.color ?? NEUTRAL);
    }
    return { dayColor: colorMap, byDay: items };
  }, [mode, goals, entries, notes, selectedTagColor]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  // Cuadrícula (lunes primero)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayISO();
  const filtered = mode !== 'none';
  const sortedDays = [...byDay.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="btn-ghost" aria-label="Mes anterior">
          ‹
        </button>
        <h2 className="font-semibold">{monthLabel(year, month)}</h2>
        <button onClick={() => shiftMonth(1)} className="btn-ghost" aria-label="Mes siguiente">
          ›
        </button>
      </div>

      {/* Filtros */}
      <div className="card space-y-2">
        <div className="flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          {(
            [
              ['none', 'Normal'],
              ['goals', 'Objetivos'],
              ['logs', 'Logs'],
              ['notes', 'Notas'],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === m ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filtered && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Etiqueta:</span>
            <TagSelect tags={tags} value={tagId} onChange={setTagId} className="flex-1" />
          </div>
        )}
        {mode === 'goals' && (
          <p className="text-xs text-slate-400">Días con objetivos cumplidos del color de su etiqueta.</p>
        )}
        {mode === 'logs' && (
          <p className="text-xs text-slate-400">Días con logs del color de su etiqueta.</p>
        )}
        {mode === 'notes' && (
          <p className="text-xs text-slate-400">Días con notas del color de su etiqueta.</p>
        )}
      </div>

      {/* Calendario */}
      <div className="card">
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((dayNum, i) => {
            if (dayNum === null) return <div key={i} />;
            const iso = toISODate(new Date(year, month, dayNum));
            const isToday = iso === today;
            const color = dayColor.get(iso);
            const hasData = filtered ? byDay.has(iso) : activeDays.has(iso);

            return (
              <button
                key={i}
                onClick={() => navigate(`/day/${iso}`)}
                style={
                  color && !isToday ? { backgroundColor: `${color}33`, color } : undefined
                }
                className={`relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  isToday ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900' : ''
                }`}
              >
                {dayNum}
                {/* Punto para modo normal (sin color de tag) */}
                {!filtered && hasData && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      isToday ? 'bg-white/80' : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end text-xs text-slate-400">
        <button onClick={goToday} className="btn-ghost text-xs">
          Hoy
        </button>
      </div>

      {loading && <p className="text-center text-xs text-slate-400">Cargando…</p>}

      {/* Lista de previsualización por día (modos con filtro) */}
      {filtered && !loading && (
        <div className="space-y-3">
          {sortedDays.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              {mode === 'goals'
                ? 'Sin objetivos cumplidos con ese filtro este mes.'
                : mode === 'notes'
                  ? 'Sin notas con ese filtro este mes.'
                  : 'Sin logs con ese filtro este mes.'}
            </p>
          )}
          {sortedDays.map((d) => (
            <div key={d} className="card">
              <button
                onClick={() => navigate(`/day/${d}`)}
                className="mb-2 text-left text-sm font-medium hover:underline"
              >
                {longDate(d)}
              </button>
              <ul className="space-y-1">
                {byDay.get(d)!.map((item) =>
                  mode === 'goals' ? (
                    <GoalPreview key={item.id} goal={item as GoalWithTag} />
                  ) : mode === 'notes' ? (
                    <NotePreview key={item.id} note={item as NoteWithTag} />
                  ) : (
                    <LogPreview key={item.id} entry={item as EntryWithTag} />
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalPreview({ goal }: { goal: GoalWithTag }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {goal.tag && <TagDot color={goal.tag.color} />}
      <span className="min-w-0 flex-1 truncate">{goal.text}</span>
      <span
        className={`shrink-0 rounded-full px-1.5 text-xs font-medium tabular-nums ${completionColorClasses(
          goal.completion_percent,
        )}`}
      >
        {goal.completion_percent}%
      </span>
    </li>
  );
}

function LogPreview({ entry }: { entry: EntryWithTag }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-slate-500">
        {displayTime(entry.entry_time)}
      </span>
      {entry.tag && <TagDot color={entry.tag.color} />}
      <span className="min-w-0 flex-1 truncate">
        {entry.tag ? `${entry.tag.name}: ` : ''}
        {entry.text}
      </span>
    </li>
  );
}

function NotePreview({ note }: { note: NoteWithTag }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-slate-500">
        {displayTime(note.note_time)}
      </span>
      {note.pending && (
        <span
          className={`shrink-0 rounded-full px-1.5 text-xs font-medium ${
            note.done
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
          }`}
        >
          {note.done ? '✓' : 'Pend.'}
        </span>
      )}
      {note.tag && <TagDot color={note.tag.color} />}
      <span className={`min-w-0 flex-1 truncate ${note.done ? 'text-slate-400 line-through' : ''}`}>
        {note.text}
      </span>
    </li>
  );
}
