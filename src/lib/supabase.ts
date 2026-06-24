import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Copia .env.example a .env y rellena ' +
      'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Guarda la sesión en localStorage (sobrevive al cierre/reinicio del navegador).
    persistSession: true,
    storage: window.localStorage,
    storageKey: 'diario-auth',
    // Renueva el access token automáticamente antes de que expire.
    autoRefreshToken: true,
    detectSessionInUrl: true, // necesario para magic links
    // PKCE: el refresh token se mantiene válido de forma indefinida mientras se use.
    flowType: 'pkce',
  },
});
