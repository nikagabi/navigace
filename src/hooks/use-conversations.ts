import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { listConversations, createConversation, deleteConversation } from '../lib/chat.functions';
import type { Conversation } from '../integrations/supabase/types';

export function useConversations() {
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const deleteFn = useServerFn(deleteConversation);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFn();
      setConversations(data as Conversation[]);
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async () => {
    const conv = await createFn();
    await refresh();
    return conv as Conversation;
  }, [createFn, refresh]);

  const remove = useCallback(
    async (conversationId: string) => {
      await deleteFn({ data: { conversationId } });
      await refresh();
    },
    [deleteFn, refresh]
  );

  return { conversations, loading, refresh, create, remove };
}
