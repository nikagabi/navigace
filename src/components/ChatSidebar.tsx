import type { Conversation } from '../integrations/supabase/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function ChatSidebar({ conversations, activeId, onSelect, onCreate }: ChatSidebarProps) {
  return (
    <aside className="w-[280px] h-full border-r border-[var(--line)] flex flex-col bg-[var(--surface)]">
      <div className="p-3">
        <button type="button" className="btn w-full" onClick={onCreate}>
          + Nová konverzace
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {conversations.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm truncate ${
              c.id === activeId ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="truncate">{c.title}</div>
            <div className="text-xs text-[var(--muted)]">
              {new Date(c.updated_at).toLocaleString('cs-CZ')}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
