import { createMiddleware } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { createServerClient } from '@supabase/ssr';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const authHeader = getRequestHeader('Authorization') ?? '';

    const supabase = createServerClient(
      process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        cookies: { getAll: () => [], setAll: () => {} },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized');

    return next({ context: { supabase, user } });
  }
);
