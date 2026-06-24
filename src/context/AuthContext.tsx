import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Cierra la sesión de forma intencional (botón "Salir"). */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Al volver a abrir/enfocar la app (p. ej. tras horas en segundo plano en el
  // iPhone) o al recuperar conexión, forzamos una renovación del token. Mientras
  // el refresh token siga en almacenamiento, la sesión se restaura sin pedir login.
  const refreshingRef = useRef(false);
  useEffect(() => {
    async function resume() {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        const expiresAt = data.session?.expires_at; // segundos epoch
        // Renueva solo si el access token ya expiró o lo hará en <60 s. Evita
        // renovaciones innecesarias que podrían disparar la revocación por
        // "reuse" del refresh token en redes inestables.
        if (expiresAt && expiresAt - Date.now() / 1000 < 60) {
          await supabase.auth.refreshSession();
        }
      } catch {
        // Sin red: conservamos la sesión actual y reintentamos al próximo evento.
      } finally {
        refreshingRef.current = false;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') void resume();
    }

    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
