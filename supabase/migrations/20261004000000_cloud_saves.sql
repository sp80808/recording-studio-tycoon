-- Cloud saves (bead 84a.2): per-guest save slots synced from the game.
-- Requires Anonymous sign-ins enabled (Supabase dashboard > Auth > Providers).
-- RLS keeps every guest isolated to their own user_id rows.

create table if not exists public.cloud_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null,
  payload text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.cloud_saves enable row level security;

drop policy if exists "cloud_saves_owner_read" on public.cloud_saves;
create policy "cloud_saves_owner_read"
  on public.cloud_saves for select
  using (auth.uid() = user_id);

drop policy if exists "cloud_saves_owner_write" on public.cloud_saves;
create policy "cloud_saves_owner_write"
  on public.cloud_saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "cloud_saves_owner_update" on public.cloud_saves;
create policy "cloud_saves_owner_update"
  on public.cloud_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cloud_saves_owner_delete" on public.cloud_saves;
create policy "cloud_saves_owner_delete"
  on public.cloud_saves for delete
  using (auth.uid() = user_id);
