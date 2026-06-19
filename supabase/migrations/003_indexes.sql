create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

create index document_chunks_document_idx
  on public.document_chunks (document_id);

create index messages_conv_idx
  on public.messages (conversation_id, created_at);

create index conversations_user_idx
  on public.conversations (user_id, updated_at desc);

create index documents_status_idx
  on public.documents (status);
