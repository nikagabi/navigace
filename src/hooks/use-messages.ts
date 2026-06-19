import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getMessages, askAssistant } from '../lib/chat.functions';
import type { MessageRow } from '../integrations/supabase/types';

export function useMessages(conversationId: string | null) {
  const getMessagesFn = useServerFn(getMessages);
  const askFn = useServerFn(askAssistant);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (id: string | null = conversationId) => {
    if (!id) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getMessagesFn({ data: { conversationId: id } });
      setMessages(data as MessageRow[]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, getMessagesFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (message: string, id: string | null = conversationId) => {
      if (!id) return;
      setSending(true);
      setError(null);
      try {
        await askFn({ data: { conversationId: id, message } });
        await refresh(id);
      } catch (err: any) {
        setError(err.message ?? 'Asistent momentálně nedostupný. Zkuste to znovu.');
      } finally {
        setSending(false);
      }
    },
    [conversationId, askFn, refresh]
  );

  return { messages, loading, sending, error, send, refresh };
}
