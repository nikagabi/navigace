import { useEffect, useState, type ReactNode } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { getSupabaseBrowserClient } from '../../integrations/supabase/client';
import { adminListConversations, getStats } from '../../lib/chat.functions';
import { getDirectorOverview } from '../../lib/hr.functions';
import { useDocuments } from '../../hooks/use-documents';
import { FileUploadZone } from '../../components/FileUploadZone';
import { DocumentCard } from '../../components/DocumentCard';
import { EmptyState } from '../../components/EmptyState';
import { StatsCard } from '../../components/StatsCard';
import { exportConversationsToCSV } from '../../lib/export';
import type { Stats } from '../../integrations/supabase/types';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth' });
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'hr_admin')
      .maybeSingle();
    if (!role) throw redirect({ to: '/chat' });
  },
  component: AdminPage,
});

type Tab = 'documents' | 'conversations' | 'stats' | 'overview';

function AdminPage() {
  const [tab, setTab] = useState<Tab>('documents');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>Dokumenty</TabButton>
        <TabButton active={tab === 'conversations'} onClick={() => setTab('conversations')}>Konverzace</TabButton>
        <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>Statistiky</TabButton>
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Přehled firmy</TabButton>
      </div>

      {tab === 'documents' && <DocumentsTab />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'overview' && <OverviewTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-[var(--radius-md)] whitespace-nowrap ${
        active ? 'bg-[var(--accent)] text-[var(--bg)]' : 'btn-secondary'
      }`}
    >
      {children}
    </button>
  );
}

function DocumentsTab() {
  const { documents, uploadProgress, upload, remove } = useDocuments();

  return (
    <div className="flex flex-col gap-4">
      <FileUploadZone onFile={upload} progress={uploadProgress} />

      {documents.length === 0 ? (
        <EmptyState icon="📂" title="Žádné dokumenty" description="Nahrajte první firemní dokument." />
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminConversation {
  id: string;
  user_email: string;
  title: string;
  message_count: number;
  created_at: string;
}

function ConversationsTab() {
  const listFn = useServerFn(adminListConversations);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await listFn();
      setConversations(data as AdminConversation[]);
      setLoading(false);
    })();
  }, [listFn]);

  if (loading) return <p className="text-[var(--muted)]">Načítám…</p>;

  if (conversations.length === 0) {
    return <EmptyState icon="💬" title="Žádné konverzace" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => exportConversationsToCSV(conversations)}
        >
          Exportovat CSV
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
              <th className="py-2 pr-4">Uživatel</th>
              <th className="py-2 pr-4">Název</th>
              <th className="py-2 pr-4">Zprávy</th>
              <th className="py-2 pr-4">Datum</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map(c => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                <td className="py-2 pr-4">{c.user_email}</td>
                <td className="py-2 pr-4">{c.title}</td>
                <td className="py-2 pr-4">{c.message_count}</td>
                <td className="py-2 pr-4">{new Date(c.created_at).toLocaleDateString('cs-CZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OverviewEmployee {
  userId: string;
  name: string;
  role: string;
  positionTitle: string | null;
  department: string | null;
  crewName: string | null;
  phone: string | null;
  vacationEntitled: number | null;
  vacationUsed: number | null;
  vacationRemaining: number | null;
}

interface OverviewAttendance {
  user_id: string;
  employeeName: string;
  work_date: string;
  description: string;
  hours: number | null;
  status: string;
}

interface OverviewPayslip {
  user_id: string;
  employeeName: string;
  period: string;
  gross_salary: number;
  net_salary: number;
}

interface OverviewData {
  employees: OverviewEmployee[];
  warehouse: { id: string; item_name: string; quantity: number; unit: string; location: string | null }[];
  attendance: OverviewAttendance[];
  finance: { totalGrossThisMonth: number; totalNetThisMonth: number; payslips: OverviewPayslip[] };
}

const ROLE_LABELS: Record<string, string> = {
  reditel: 'Ředitel',
  manazer: 'Manažer',
  mistr: 'Mistr',
  zamestnanec: 'Zaměstnanec',
};

function OverviewTab() {
  const overviewFn = useServerFn(getDirectorOverview);
  const [data, setData] = useState<OverviewData | null>(null);
  const [sub, setSub] = useState<'employees' | 'warehouse' | 'attendance' | 'finance'>('employees');

  useEffect(() => {
    (async () => {
      const result = await overviewFn();
      setData(result as OverviewData);
    })();
  }, [overviewFn]);

  if (!data) return <p className="text-[var(--muted)]">Načítám…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto">
        <TabButton active={sub === 'employees'} onClick={() => setSub('employees')}>Zaměstnanci</TabButton>
        <TabButton active={sub === 'warehouse'} onClick={() => setSub('warehouse')}>Sklad</TabButton>
        <TabButton active={sub === 'attendance'} onClick={() => setSub('attendance')}>Docházka</TabButton>
        <TabButton active={sub === 'finance'} onClick={() => setSub('finance')}>Finance</TabButton>
      </div>

      {sub === 'employees' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-2 pr-4">Jméno</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Pozice</th>
                <th className="py-2 pr-4">Směna/oddělení</th>
                <th className="py-2 pr-4">Telefon</th>
                <th className="py-2 pr-4">Dovolená (zbývá/nárok)</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map(e => (
                <tr key={e.userId} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-2 pr-4">{e.name}</td>
                  <td className="py-2 pr-4">{ROLE_LABELS[e.role] ?? e.role}</td>
                  <td className="py-2 pr-4">{e.positionTitle ?? '—'}</td>
                  <td className="py-2 pr-4">{e.crewName ?? e.department ?? '—'}</td>
                  <td className="py-2 pr-4">{e.phone ?? '—'}</td>
                  <td className="py-2 pr-4">
                    {e.vacationRemaining ?? '—'} / {e.vacationEntitled ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sub === 'warehouse' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-2 pr-4">Položka</th>
                <th className="py-2 pr-4">Množství</th>
                <th className="py-2 pr-4">Umístění</th>
              </tr>
            </thead>
            <tbody>
              {data.warehouse.map(w => (
                <tr key={w.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-2 pr-4">{w.item_name}</td>
                  <td className="py-2 pr-4">{w.quantity} {w.unit}</td>
                  <td className="py-2 pr-4">{w.location ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sub === 'attendance' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-2 pr-4">Zaměstnanec</th>
                <th className="py-2 pr-4">Datum</th>
                <th className="py-2 pr-4">Stav</th>
                <th className="py-2 pr-4">Hodiny</th>
                <th className="py-2 pr-4">Popis</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.map((a, i) => (
                <tr key={i} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-2 pr-4">{a.employeeName}</td>
                  <td className="py-2 pr-4">{a.work_date}</td>
                  <td className="py-2 pr-4">
                    <span className={`badge ${a.status === 'odvedeno' ? 'badge-ready' : 'badge-error'}`}>{a.status}</span>
                  </td>
                  <td className="py-2 pr-4">{a.hours ?? '—'}</td>
                  <td className="py-2 pr-4">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sub === 'finance' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard icon="💰" label="Hrubé mzdy tento měsíc" value={`${data.finance.totalGrossThisMonth} Kč`} />
            <StatsCard icon="💵" label="Čisté mzdy tento měsíc" value={`${data.finance.totalNetThisMonth} Kč`} />
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                  <th className="py-2 pr-4">Zaměstnanec</th>
                  <th className="py-2 pr-4">Období</th>
                  <th className="py-2 pr-4">Hrubá mzda</th>
                  <th className="py-2 pr-4">Čistá mzda</th>
                </tr>
              </thead>
              <tbody>
                {data.finance.payslips.slice(0, 50).map((p, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2 pr-4">{p.employeeName}</td>
                    <td className="py-2 pr-4">{p.period}</td>
                    <td className="py-2 pr-4">{p.gross_salary} Kč</td>
                    <td className="py-2 pr-4">{p.net_salary} Kč</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsTab() {
  const statsFn = useServerFn(getStats);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const data = await statsFn();
      setStats(data as Stats);
    })();
  }, [statsFn]);

  if (!stats) return <p className="text-[var(--muted)]">Načítám…</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatsCard icon="👥" label="Celkem uživatelů" value={stats.total_users} />
      <StatsCard icon="📄" label="Připravených dokumentů" value={stats.total_documents} />
      <StatsCard icon="🧩" label="Indexovaných úryvků" value={stats.total_chunks} />
      <StatsCard icon="💬" label="Celkem konverzací" value={stats.total_conversations} />
      <StatsCard icon="❓" label="Celkem dotazů" value={stats.total_messages} />
      <StatsCard icon="⭐" label="Průměrné hodnocení" value={stats.avg_satisfaction ?? '—'} />
    </div>
  );
}
