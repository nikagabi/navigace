import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '../integrations/supabase/auth-middleware';

async function requireAdmin(supabase: any, userId: string) {
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'hr_admin')
    .maybeSingle();
  if (!role) throw new Error('Nedostatečná oprávnění.');
}

export const getDirectorOverview = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    await requireAdmin(supabase, context.user.id);

    const year = new Date().getFullYear();

    const [profilesRes, rolesRes, vacationsRes, warehouseRes, logsRes, payslipsRes] = await Promise.all([
      supabase.from('employee_profiles').select('*').order('last_name', { ascending: true }),
      supabase.from('user_roles').select('user_id, role').in('role', ['manazer', 'mistr', 'zamestnanec']),
      supabase.from('vacation_balances').select('*').eq('year', year),
      supabase.from('warehouse_items').select('*').order('item_name', { ascending: true }),
      supabase.from('work_logs').select('*').order('work_date', { ascending: false }).limit(60),
      supabase.from('payslips').select('*').order('issued_at', { ascending: false }).limit(200),
    ]);

    const profiles = profilesRes.data ?? [];
    const roleByUser = new Map((rolesRes.data ?? []).map((r: any) => [r.user_id, r.role]));
    const vacationByUser = new Map((vacationsRes.data ?? []).map((v: any) => [v.user_id, v]));
    const nameByUser = new Map(profiles.map((p: any) => [p.user_id, `${p.first_name} ${p.last_name}`]));

    const employees = profiles.map((p: any) => {
      const vacation = vacationByUser.get(p.user_id);
      return {
        userId: p.user_id,
        name: `${p.first_name} ${p.last_name}`,
        role: roleByUser.get(p.user_id) ?? 'reditel',
        positionTitle: p.position_title,
        department: p.department,
        crewName: p.crew_name,
        phone: p.phone,
        vacationEntitled: vacation?.days_entitled ?? null,
        vacationUsed: vacation?.days_used ?? null,
        vacationRemaining: vacation?.days_remaining ?? null,
      };
    });

    const attendance = (logsRes.data ?? []).map((l: any) => ({
      ...l,
      employeeName: nameByUser.get(l.user_id) ?? '—',
    }));

    const payslips = (payslipsRes.data ?? []).map((p: any) => ({
      ...p,
      employeeName: nameByUser.get(p.user_id) ?? '—',
    }));

    const currentMonth = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const thisMonthPayslips = payslips.filter((p: any) => p.period === currentMonth);
    const finance = {
      totalGrossThisMonth: thisMonthPayslips.reduce((sum: number, p: any) => sum + Number(p.gross_salary), 0),
      totalNetThisMonth: thisMonthPayslips.reduce((sum: number, p: any) => sum + Number(p.net_salary), 0),
      payslips,
    };

    return {
      employees,
      warehouse: warehouseRes.data ?? [],
      attendance,
      finance,
    };
  });

const LogWorkInput = z.object({
  description: z.string().min(1).max(500),
  hours: z.number().min(0).max(24).optional(),
  status: z.enum(['odvedeno', 'chybi', 'nedokonceno']),
});

export const logWork = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(LogWorkInput)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('work_logs')
      .insert({
        user_id: context.user.id,
        description: data.description,
        hours: data.hours ?? null,
        status: data.status,
      })
      .select()
      .single();
    if (error || !row) throw new Error('Záznam se nepodařilo uložit.');
    return row;
  });
