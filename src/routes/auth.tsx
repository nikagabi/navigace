import { useState, type FormEvent } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { getSupabaseBrowserClient } from '../integrations/supabase/client';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (tab === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (count === 1) {
          // eslint-disable-next-line no-alert
          alert('Byl vám přidělen administrátorský účet.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      navigate({ to: '/chat' });
    } catch (err: any) {
      setError(err.message ?? 'Něco se nepodařilo. Zkuste to znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await getSupabaseBrowserClient().auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-[420px]">
        <div className="flex mb-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`flex-1 py-2 rounded-[var(--radius-sm)] ${tab === 'login' ? 'bg-[var(--accent)] text-[var(--bg)]' : ''}`}
            onClick={() => setTab('login')}
          >
            Přihlášení
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-[var(--radius-sm)] ${tab === 'register' ? 'bg-[var(--accent)] text-[var(--bg)]' : ''}`}
            onClick={() => setTab('register')}
          >
            Registrace
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'register' && (
            <input
              className="input"
              type="text"
              placeholder="Jméno"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Heslo"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Odesílám…' : tab === 'login' ? 'Přihlásit se' : 'Zaregistrovat se'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4 text-[var(--muted)] text-sm">
          <span className="flex-1 border-t border-[var(--line)]" />
          nebo
          <span className="flex-1 border-t border-[var(--line)]" />
        </div>

        <button type="button" className="btn btn-secondary w-full" onClick={handleGoogle}>
          Pokračovat s Google
        </button>
      </div>
    </main>
  );
}
