import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'password' | 'magic';

export default function Login() {
  const [mode, setMode] = useState<Mode>('password');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setInfo('Te enviamos un enlace de acceso. Revisa tu correo.');
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Cuenta creada. Si la confirmación por correo está activa, revísalo.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Diario de Productividad</h1>
          <p className="mt-1 text-sm text-slate-500">Objetivos, diario y resumen de tu día.</p>
        </div>

        <div className="card">
          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'password' ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
              }`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'magic' ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
              }`}
            >
              Magic link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            {mode === 'password' && (
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-emerald-600">{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? 'Procesando…'
                : mode === 'magic'
                  ? 'Enviar enlace'
                  : isSignUp
                    ? 'Crear cuenta'
                    : 'Entrar'}
            </button>
          </form>

          {mode === 'password' && (
            <button
              type="button"
              onClick={() => setIsSignUp((v) => !v)}
              className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              {isSignUp ? '¿Ya tienes cuenta? Entrar' : '¿Sin cuenta? Crear una'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
