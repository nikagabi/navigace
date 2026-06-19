import { useState } from 'react';
import type { DocumentRow } from '../integrations/supabase/types';
import { StatusBadge } from './StatusBadge';

interface DocumentCardProps {
  document: DocumentRow;
  onDelete: (documentId: string, storagePath: string) => Promise<void>;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(document.id, document.storage_path);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium truncate">{document.title}</p>
        <p className="text-sm text-[var(--muted)]">
          {formatSize(document.file_size)} · {document.chunks_count} úryvků ·{' '}
          {new Date(document.created_at).toLocaleDateString('cs-CZ')}
        </p>
        {document.status === 'error' && document.error_message && (
          <p className="text-sm text-[var(--danger)]">{document.error_message}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={document.status} />
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--danger)]">Smazat dokument? Tato akce je nevratná.</span>
            <button type="button" className="btn-danger btn" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Mažu…' : 'Smazat'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>
              Zrušit
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
            Smazat
          </button>
        )}
      </div>
    </div>
  );
}
