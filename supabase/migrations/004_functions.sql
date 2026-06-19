-- Security definer: kontrola role (zabrání RLS rekurzi)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Vektorové vyhledávání
create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold float default 0.3
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float,
  document_title text
)
language sql stable security definer
set search_path = public
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title as document_title
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where
    d.status = 'ready'
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Statistiky pro admin dashboard
create or replace function public.get_stats()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_documents', (select count(*) from public.documents where status = 'ready'),
    'total_chunks', (select count(*) from public.document_chunks),
    'total_conversations', (select count(*) from public.conversations),
    'total_messages', (select count(*) from public.messages where role = 'user'),
    'avg_satisfaction', (select round(avg(rating)::numeric, 2) from public.message_feedback)
  );
$$;
