import { useEffect, useState, type ReactNode } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { getSupabaseBrowserClient } from '../../integrations/supabase/client';
import { adminListConversations, getStats } from '../../lib/chat.functions';
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

type Tab = 'documents' | 'conversations' | 'stats';

function AdminPage() {
  const [tab, setTab] = useState<Tab>('documents');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>Dokumenty</TabButton>
        <TabButton active={tab === 'conversations'} onClick={() => setTab('conversations')}>Konverzace</TabButton>
        <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>Statistiky</TabButton>
      </div>

      {tab === 'documents' && <DocumentsTab />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'stats' && <StatsTab />}
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
