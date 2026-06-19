import { useEffect, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useConversations } from '../../hooks/use-conversations';
import { useMessages } from '../../hooks/use-messages';
import { useIsMobile } from '../../hooks/use-mobile';
import { ChatSidebar } from '../../components/ChatSidebar';
import { ChatMessage } from '../../components/ChatMessage';
import { LoadingDots } from '../../components/LoadingDots';
import { EmptyState } from '../../components/EmptyState';

export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatPage,
});

const SUGGESTIONS = [
  'Kolik dní dovolené mám nárok?',
  'Jaké jsou benefity pro nové zaměstnance?',
  'Jak probíhá schvalování pracovní cesty?',
];

function ChatPage() {
  const { conversations, create } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, sending, error, send } = useMessages(activeId);
  const [input, setInput] = useState('');
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = async () => {
    const conv = await create();
    setActiveId(conv.id);
    setDrawerOpen(false);
  };

  const handleSelect = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    let id = activeId;
    if (!id) {
      const conv = await create();
      id = conv.id;
      setActiveId(id);
    }
    await send(text, id);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {isMobile ? (
        <>
          <button
            type="button"
            className="btn btn-secondary fixed top-16 left-3 z-10"
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          {drawerOpen && (
            <div className="fixed inset-0 z-20 flex">
              <ChatSidebar
                conversations={conversations}
                activeId={activeId}
                onSelect={handleSelect}
                onCreate={handleCreate}
              />
              <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
            </div>
          )}
        </>
      ) : (
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onCreate={handleCreate}
        />
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <EmptyState
              icon="💬"
              title="Jak vám mohu pomoci?"
              action={
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {messages.map(m => <ChatMessage key={m.id} message={m} />)}
              {sending && <LoadingDots />}
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-[var(--line)] p-4">
          <form
            className="max-w-3xl mx-auto flex gap-2 items-end"
            onSubmit={e => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <textarea
              className="input flex-1 resize-none max-h-32"
              placeholder="Napište dotaz..."
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <button type="submit" className="btn" disabled={!input.trim() || sending}>
              ↑
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
