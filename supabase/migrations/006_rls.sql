-- Zapni RLS na všech tabulkách
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_feedback enable row level security;

-- GRANTy
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant select on public.document_chunks to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.message_feedback to authenticated;
grant execute on function public.has_role to authenticated;
grant execute on function public.match_chunks to authenticated;
grant execute on function public.get_stats to authenticated;

-- Policies: profiles
create policy "Vlastní profil" on public.profiles
  for select using (auth.uid() = id);

create policy "Admin vidí všechny profily" on public.profiles
  for select using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Aktualizace vlastního profilu" on public.profiles
  for update using (auth.uid() = id);

-- Policies: user_roles
create policy "Vlastní role" on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Admin vidí všechny role" on public.user_roles
  for select using (public.has_role(auth.uid(), 'hr_admin'));

-- Policies: documents
create policy "Admin spravuje dokumenty" on public.documents
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Employee vidí ready dokumenty" on public.documents
  for select using (
    public.has_role(auth.uid(), 'employee')
    and status = 'ready'
  );

-- Policies: document_chunks
create policy "Admin vidí chunks" on public.document_chunks
  for all using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Employee vidí chunks ready dokumentů" on public.document_chunks
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.status = 'ready'
    )
  );

-- Policies: conversations
create policy "Vlastní konverzace" on public.conversations
  for all using (auth.uid() = user_id);

create policy "Admin vidí všechny konverzace" on public.conversations
  for select using (public.has_role(auth.uid(), 'hr_admin'));

-- Policies: messages
create policy "Zprávy vlastní konverzace" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Admin vidí všechny zprávy" on public.messages
  for select using (public.has_role(auth.uid(), 'hr_admin'));

-- Policies: message_feedback
create policy "Vlastní feedback" on public.message_feedback
  for all using (auth.uid() = user_id);

-- Storage: privátní bucket pro dokumenty
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Admin upload" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'hr_admin')
  );

create policy "Admin delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'hr_admin')
  );

create policy "Admin download" on storage.objects
  for select using (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'hr_admin')
  );
