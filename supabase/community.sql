-- ============================================================
--  커뮤니티 — 클럽 일상 사진 / 대회 기록
--  schema.sql 을 이미 실행한 프로젝트에 이어서 실행하세요.
--  (여러 번 실행해도 안전합니다.)
-- ============================================================

-- 커뮤니티 > 클럽 일상 사진
create table if not exists daily_photos (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text,
  sort       int default 0,
  created_at timestamptz default now()
);

create index if not exists daily_photos_sort_idx on daily_photos (sort);

alter table daily_photos enable row level security;

drop policy if exists "daily_photos_public_read" on daily_photos;
create policy "daily_photos_public_read" on daily_photos
  for select to anon, authenticated using (true);

drop policy if exists "daily_photos_admin_write" on daily_photos;
create policy "daily_photos_admin_write" on daily_photos
  for all to authenticated using (true) with check (true);


-- 커뮤니티 > 대회 기록
create table if not exists competitions (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  sort       int default 0,
  created_at timestamptz default now()
);

create index if not exists competitions_sort_idx on competitions (sort);

alter table competitions enable row level security;

drop policy if exists "competitions_public_read" on competitions;
create policy "competitions_public_read" on competitions
  for select to anon, authenticated using (true);

drop policy if exists "competitions_admin_write" on competitions;
create policy "competitions_admin_write" on competitions
  for all to authenticated using (true) with check (true);
