import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { getSupabaseBrowserClient } from '../integrations/supabase/client';

export function AppNav() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'hr_admin')
        .maybeSingle();
      setIsAdmin(!!role);
    })();
  }, []);

  const handleSignOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    navigate({ to: '/auth' });
  };

  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-[var(--surface)]/90 border-b border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          NAVIGACE
        </Link>

        <button
          type="button"
          className="md:hidden btn btn-secondary !px-3 !py-1"
          onClick={() => setMenuOpen(o => !o)}
        >
          ☰
        </button>

        <div className={`${menuOpen ? 'flex' : 'hidden'} md:flex absolute md:relative top-14 left-0 right-0 md:top-auto flex-col md:flex-row gap-1 md:gap-4 bg-[var(--surface)] md:bg-transparent p-4 md:p-0 border-b md:border-0 border-[var(--line)] items-start md:items-center`}>
          <Link to="/chat" className="px-2 py-1">Chat</Link>
          {isAdmin && <Link to="/admin" className="px-2 py-1">Admin</Link>}
          <Link to="/pitch" className="px-2 py-1">Pitch</Link>
          <button type="button" onClick={handleSignOut} className="px-2 py-1 text-left">
            Odhlásit
          </button>
        </div>
      </div>
    </nav>
  );
}
