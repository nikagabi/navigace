-- Automatické vytvoření profilu a přiřazení role po registraci
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  is_first_user boolean;
begin
  -- Vytvoř profil
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Zjisti, zda je první uživatel
  select count(*) = 1 into is_first_user
  from auth.users;

  -- První uživatel = hr_admin, ostatní = employee
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when is_first_user then 'hr_admin'::public.app_role else 'employee'::public.app_role end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Automatická aktualizace updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger documents_updated_at before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();
