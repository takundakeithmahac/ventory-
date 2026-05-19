-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Brands table: stores each user's SKU data + source
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade unique,
  skus        jsonb not null default '[]',
  source      text default 'csv',
  updated_at  timestamptz default now()
);

-- Decisions table: stores favorited + dismissed decision IDs per user
create table if not exists decisions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  decision_id  text not null,
  action       text not null check (action in ('favorited', 'dismissed')),
  created_at   timestamptz default now(),
  unique(user_id, decision_id)
);

-- Row Level Security: users can only see their own data
alter table brands   enable row level security;
alter table decisions enable row level security;

create policy "brands: own rows only"
  on brands for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "decisions: own rows only"
  on decisions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
