import type { MessageSource } from '../integrations/supabase/types';

export function SourceCitation({ source }: { source: MessageSource }) {
  return (
    <span className="badge badge-ready" title={`Relevance ${source.similarity}%`}>
      📎 {source.title} · část {source.chunk_index + 1} · {source.similarity}%
    </span>
  );
}
