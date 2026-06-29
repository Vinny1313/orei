-- Adds opaque public route keys so browser URLs do not expose internal UUIDs.

create extension if not exists pgcrypto with schema extensions;

alter table public.characters
  add column if not exists route_key text;

update public.characters
set route_key = encode(gen_random_bytes(12), 'hex')
where route_key is null;

alter table public.characters
  alter column route_key set default encode(gen_random_bytes(12), 'hex'),
  alter column route_key set not null;

create unique index if not exists characters_route_key_idx
  on public.characters (route_key);

alter table public.campaigns
  add column if not exists route_key text;

update public.campaigns
set route_key = encode(gen_random_bytes(12), 'hex')
where route_key is null;

alter table public.campaigns
  alter column route_key set default encode(gen_random_bytes(12), 'hex'),
  alter column route_key set not null;

create unique index if not exists campaigns_route_key_idx
  on public.campaigns (route_key);
