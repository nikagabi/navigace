import type { DocumentStatus } from '../integrations/supabase/types';

const LABELS: Record<DocumentStatus, string> = {
  ready: 'Připraveno',
  processing: 'Zpracovává se',
  error: 'Chyba',
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
