import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getSupabaseBrowserClient } from '../integrations/supabase/client';
import { AppNav } from '../components/AppNav';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    if (!user) throw redirect({ to: '/auth' });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <AppNav />
      <main>
        <Outlet />
      </main>
    </>
  );
}
