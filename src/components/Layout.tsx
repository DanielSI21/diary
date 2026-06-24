import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { todayISO } from '../utils/date';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition',
    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600',
  ].join(' ');

export default function Layout() {
  const location = useLocation();
  const { signOut } = useAuth();
  // El tab "Día" queda activo en cualquier ruta /day/*
  const dayActive = location.pathname.startsWith('/day');

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Diario</h1>
        <button
          onClick={() => void signOut()}
          className="btn-ghost text-xs"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl pb-[env(safe-area-inset-bottom)]">
          <NavLink to={`/day/${todayISO()}`} className={() => navItemClass({ isActive: dayActive })}>
            <Icon path="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            Día
          </NavLink>
          <NavLink to="/notes" className={navItemClass}>
            <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4" />
            Notas
          </NavLink>
          <NavLink to="/calendar" className={navItemClass}>
            <Icon path="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
            Calendario
          </NavLink>
          <NavLink to="/settings" className={navItemClass}>
            <Icon path="M10.3 4.3a2 2 0 013.4 0l.4.7a2 2 0 002 1l.8-.1a2 2 0 011.7 3l-.4.7a2 2 0 000 2l.4.7a2 2 0 01-1.7 3l-.8-.1a2 2 0 00-2 1l-.4.7a2 2 0 01-3.4 0l-.4-.7a2 2 0 00-2-1l-.8.1a2 2 0 01-1.7-3l.4-.7a2 2 0 000-2l-.4-.7a2 2 0 011.7-3l.8.1a2 2 0 002-1z M12 12.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            Ajustes
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d={path} />
    </svg>
  );
}
