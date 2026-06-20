import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '../integrations/supabase/auth-middleware';
import { embedText, chatComplete } from './ai-gateway.server';
import type { ChunkMatch } from '../integrations/supabase/types';

const SYSTEM_PROMPT = `Jsi Navigace — interní HR asistent firmy.

PRAVIDLA:
1. Odpovídej VÝHRADNĚ z poskytnutého kontextu (firemní dokumenty NEBO osobní/HR údaje níže).
2. Pokud odpověď není v kontextu, řekni: "Tuto informaci nenacházím."
3. Nikdy nevymýšlej fakta, čísla, data ani postupy.
4. Odpovídej stručně a věcně v češtině.
5. U dokumentů vždy uveď zdroj (dostaneš ho v kontextu). U osobních/HR údajů zdroj uvádět nemusíš.
6. Osobní a HR údaje v kontextu jsou už předfiltrované podle oprávnění tazatele — pokud tam někdo není uveden, nemáš o něm informace a neodpovídej na základě domněnek.
7. Pokud je dotaz nesrozumitelný, požádej o upřesnění.

FORMÁT:
- Používej markdown (tučné písmo, seznamy) pro přehlednost.
- Citace zdrojů dokumentů jsou automaticky doplněny systémem, neuvádí je v textu odpovědi.`;

function buildContextPrompt(chunks: ChunkMatch[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const contextParts = chunks.map(
    (c, i) =>
      `[Zdroj ${i + 1}: ${c.document_title}, část ${c.chunk_index + 1}]\n${c.content}`
  );

  return `\n\nKONTEXT Z FIREMNÍCH DOKUMENTŮ:\n${contextParts.join('\n\n---\n\n')}`;
}

function age(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const ms = Date.now() - new Date(birthDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

async function fetchEmployeeBundle(supabase: any, targetUserId: string) {
  const year = new Date().getFullYear();
  const [profile, vacation, payslips, benefits, trips, logs] = await Promise.all([
    supabase.from('employee_profiles').select('*').eq('user_id', targetUserId).maybeSingle(),
    supabase.from('vacation_balances').select('*').eq('user_id', targetUserId).eq('year', year).maybeSingle(),
    supabase.from('payslips').select('*').eq('user_id', targetUserId).order('issued_at', { ascending: false }).limit(1),
    supabase.from('benefits').select('*').eq('user_id', targetUserId),
    supabase.from('business_trips').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false }).limit(3),
    supabase.from('work_logs').select('*').eq('user_id', targetUserId).order('work_date', { ascending: false }).limit(5),
  ]);

  if (!profile.data) return null;

  return {
    profile: profile.data,
    vacation: vacation.data,
    payslip: payslips.data?.[0] ?? null,
    benefits: benefits.data ?? [],
    trips: trips.data ?? [],
    logs: logs.data ?? [],
  };
}

function formatEmployeeBundle(bundle: NonNullable<Awaited<ReturnType<typeof fetchEmployeeBundle>>>, label: string): string {
  const p = bundle.profile;
  const lines: string[] = [`${label}: ${p.first_name} ${p.last_name}`];
  lines.push(`Pozice: ${p.position_title ?? '—'} (${p.department ?? '—'}${p.crew_name ? ', ' + p.crew_name : ''})`);
  if (p.birth_date) lines.push(`Datum narození: ${p.birth_date} (věk: ${age(p.birth_date)} let)`);
  if (p.phone) lines.push(`Telefon: ${p.phone}`);
  if (p.personal_email) lines.push(`Osobní e-mail: ${p.personal_email}`);
  if (p.address) lines.push(`Adresa: ${p.address}, ${p.city} ${p.postal_code}`);
  if (p.hire_date) lines.push(`Nástup: ${p.hire_date} (${p.employment_type}, ${p.contract_type})`);

  if (bundle.vacation) {
    lines.push(`Dovolená ${bundle.vacation.year}: nárok ${bundle.vacation.days_entitled} dní, vyčerpáno ${bundle.vacation.days_used}, zbývá ${bundle.vacation.days_remaining}`);
  }
  if (bundle.payslip) {
    lines.push(`Poslední výplata (${bundle.payslip.period}): hrubá mzda ${bundle.payslip.gross_salary} Kč, čistá ${bundle.payslip.net_salary} Kč`);
  }
  if (bundle.benefits.length > 0) {
    lines.push(`Benefity: ${bundle.benefits.map((b: any) => b.value_czk ? `${b.name} (${b.value_czk} Kč)` : b.name).join(', ')}`);
  }
  if (bundle.trips.length > 0) {
    lines.push(`Pracovní cesty: ${bundle.trips.map((t: any) => `${t.destination} (${t.start_date}–${t.end_date}, ${t.status})`).join('; ')}`);
  }
  if (bundle.logs.length > 0) {
    lines.push(`Docházka (posledních dní): ${bundle.logs.map((l: any) => `${l.work_date} ${l.status}${l.hours ? ' ' + l.hours + 'h' : ''} – ${l.description}`).join('; ')}`);
  }
  return lines.join('\n');
}

async function buildEmployeeContextPrompt(supabase: any, userId: string, message: string): Promise<string> {
  const own = await fetchEmployeeBundle(supabase, userId);
  const parts: string[] = [];
  if (own) parts.push(formatEmployeeBundle(own, 'MOJE OSOBNÍ A PRACOVNÍ ÚDAJE'));

  const words = (message.match(/[A-Za-zÁ-Žá-ž]{3,}/g) ?? []).slice(0, 8);
  if (words.length > 0) {
    const orFilter = words.map(w => `first_name.ilike.%${w}%,last_name.ilike.%${w}%`).join(',');
    const { data: matches } = await supabase
      .from('employee_profiles')
      .select('user_id')
      .or(orFilter)
      .neq('user_id', userId)
      .limit(3);

    for (const m of matches ?? []) {
      const bundle = await fetchEmployeeBundle(supabase, m.user_id);
      if (bundle) parts.push(formatEmployeeBundle(bundle, 'ÚDAJE O ZAMĚSTNANCI'));
    }
  }

  if (parts.length === 0) return '';
  return `\n\nOSOBNÍ A HR ÚDAJE (předfiltrované podle oprávnění tazatele):\n${parts.join('\n\n')}`;
}

const AskInput = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

export const askAssistant = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(AskInput)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const userId = context.user.id;

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', data.conversationId)
      .eq('user_id', userId)
      .single();

    if (convErr || !conv) {
      throw new Error('Konverzace nenalezena nebo nemáte přístup.');
    }

    await supabase.from('messages').insert({
      conversation_id: data.conversationId,
      role: 'user',
      content: data.message,
    });

    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedText(data.message);
    } catch {
      throw new Error('Vektorové vyhledávání momentálně nedostupné.');
    }

    const { data: chunks } = await supabase.rpc('match_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: 5,
      similarity_threshold: 0.3,
    });

    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', data.conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const docContextStr = buildContextPrompt(chunks ?? []);
    const employeeContextStr = await buildEmployeeContextPrompt(supabase, userId, data.message);
    const fullSystem = SYSTEM_PROMPT + docContextStr + employeeContextStr;

    let aiResponse: string;
    try {
      aiResponse = await chatComplete(
        fullSystem,
        (history ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      );
    } catch (err: any) {
      if (err.message === 'TOO_MANY_REQUESTS') {
        throw new Error('Příliš mnoho požadavků. Zkuste to za chvíli.');
      }
      if (err.message === 'CREDIT_EXHAUSTED') {
        throw new Error('Kredit AI asistenta byl vyčerpán. Kontaktujte administrátora.');
      }
      throw new Error('AI asistent momentálně nedostupný.');
    }

    const sources = (chunks ?? []).map((c: ChunkMatch) => ({
      document_id: c.document_id,
      title: c.document_title,
      chunk_index: c.chunk_index,
      similarity: Math.round(c.similarity * 100),
    }));

    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        role: 'assistant',
        content: aiResponse,
        sources,
      })
      .select()
      .single();

    const msgCount = history?.length ?? 0;
    if (msgCount <= 1) {
      const title = data.message.length > 50
        ? data.message.slice(0, 50) + '…'
        : data.message;
      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', data.conversationId);
    }

    return { message: savedMsg, sources };
  });

export const listConversations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', context.user.id)
      .order('updated_at', { ascending: false });
    return data ?? [];
  });

export const createConversation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('conversations')
      .insert({ user_id: context.user.id })
      .select()
      .single();
    if (error || !data) throw new Error('Konverzaci se nepodařilo vytvořit.');
    return data;
  });

const DeleteConversationInput = z.object({ conversationId: z.string().uuid() });

export const deleteConversation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(DeleteConversationInput)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from('conversations')
      .delete()
      .eq('id', data.conversationId)
      .eq('user_id', context.user.id);
    return { success: true };
  });

const GetMessagesInput = z.object({ conversationId: z.string().uuid() });

export const getMessages = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .validator(GetMessagesInput)
  .handler(async ({ data, context }) => {
    const { data: messages } = await context.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', data.conversationId)
      .order('created_at', { ascending: true });
    return messages ?? [];
  });

const FeedbackInput = z.object({
  messageId: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(-1)]),
});

export const submitFeedback = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(FeedbackInput)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from('message_feedback')
      .upsert(
        { message_id: data.messageId, user_id: context.user.id, rating: data.rating },
        { onConflict: 'message_id,user_id' }
      );
    return { success: true };
  });

async function requireAdmin(supabase: any, userId: string) {
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'hr_admin')
    .maybeSingle();
  if (!role) throw new Error('Nedostatečná oprávnění.');
}

export const adminListConversations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.user.id);

    const { data: conversations } = await context.supabase
      .from('conversations')
      .select('*, profiles:user_id(email)')
      .order('created_at', { ascending: false });

    const result = await Promise.all(
      (conversations ?? []).map(async (c: any) => {
        const { count } = await context.supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id);
        return {
          id: c.id,
          user_email: c.profiles?.email ?? '',
          title: c.title,
          message_count: count ?? 0,
          created_at: c.created_at,
        };
      })
    );

    return result;
  });

export const getStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.user.id);
    const { data } = await context.supabase.rpc('get_stats');
    return data;
  });
