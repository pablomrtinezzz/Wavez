-- Wavez · community photos
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again (idempotent).

-- 1. Report metadata. Only the server (secret key) can access it: RLS is on
--    and there are deliberately no policies for anon/authenticated users.
create table if not exists public.spot_reports (
  id                   uuid primary key,
  spot_id              text        not null,
  photo_path           text        not null,
  captured_at          timestamptz not null,
  uploaded_at          timestamptz not null default now(),
  user_note            text        check (char_length(user_note) <= 300),
  is_realtime_verified boolean     not null default false,
  capture_method       text        not null check (capture_method in ('camera_direct', 'gallery_upload')),
  distance_to_spot_m   integer     check (distance_to_spot_m >= 0),
  verification_flags   text[]      not null default '{}',
  condition_snapshot   jsonb,
  -- Salted hash of the uploader's IP, used only for rate limiting
  client_key           text        not null
);

create index if not exists spot_reports_spot_captured_idx on public.spot_reports (spot_id, captured_at desc);
create index if not exists spot_reports_client_uploaded_idx on public.spot_reports (client_key, uploaded_at desc);
create index if not exists spot_reports_captured_idx on public.spot_reports (captured_at);

alter table public.spot_reports enable row level security;

-- 2. Photo storage: public read (photos are shown on the website), writes
--    only through the server. Max 2 MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spot-photos', 'spot-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
