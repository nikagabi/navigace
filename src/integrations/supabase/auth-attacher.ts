import { createMiddleware } from '@tanstack/react-start';
import { createBrowserClient } from '@supabase/ssr';

export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const supabase = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
    const { data: { session } } = await supabase.auth.getSession();
    return next({
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : '',
      },
    });
  }
);
