-- ============================================================
--  ANTAEAN FENCING CLUB — Supabase schema
--  Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
--  (한 번만 실행하면 됩니다. 다시 실행해도 안전하도록 작성했습니다.)
-- ============================================================

-- ---------- 지점 ----------
create table if not exists branches (
  id            text primary key,          -- 'songdo' | 'baegot'
  name          text not null,
  address       text,
  phone         text,
  parking       text,
  instagram     text,
  naver_map_url text,
  kakao_url     text,
  sort          int  default 0
);

-- ---------- 지도자 ----------
create table if not exists coaches (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  title        text,
  photo_url    text,
  education    text,   -- 줄바꿈으로 구분된 목록
  career       text,
  certificates text,
  coaching     text,
  awards       text,
  sort         int default 0
);

-- ---------- 프로그램 ----------
create table if not exists programs (
  id         text primary key,             -- hobby | junior | athlete | adult
  name       text not null,
  target     text,
  features   text,
  class_time text,
  image_url  text,
  sort       int default 0
);

-- ---------- 시간표 ----------
create table if not exists schedules (
  id         uuid primary key default gen_random_uuid(),
  branch_id  text references branches(id) on delete cascade,
  day        text not null,                -- 월~일
  time_range text not null,                -- '16:00-17:00'
  program_id text references programs(id) on delete set null,
  note       text,
  sort       int default 0
);

-- ---------- 공지 ----------
create table if not exists notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  pinned     boolean default false,
  image_url  text,
  created_at timestamptz default now()
);

-- ---------- 갤러리 ----------
create table if not exists gallery (
  id        uuid primary key default gen_random_uuid(),
  branch_id text references branches(id) on delete cascade,
  image_url text not null,
  caption   text,
  is_hero   boolean default false,
  sort      int default 0
);

-- ---------- 체험/상담 문의 ----------
create table if not exists inquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  age        text,
  branch_id  text,
  phone      text not null,
  experience text,                          -- 처음 / 경험 있음
  program_id text,
  message    text,
  agreed     boolean not null default false,
  status     text default 'new',            -- new | contacted
  memo       text,
  created_at timestamptz default now()
);

create index if not exists inquiries_created_idx on inquiries (created_at desc);
create index if not exists notices_created_idx   on notices   (pinned desc, created_at desc);
create index if not exists schedules_branch_idx  on schedules (branch_id, sort);
create index if not exists gallery_branch_idx    on gallery   (branch_id, sort);


-- ============================================================
--  RLS — 공개 테이블은 읽기만 열고, 쓰기는 로그인한 관리자만.
--  문의(inquiries)는 누구나 넣을 수 있고, 읽기는 관리자만.
-- ============================================================
alter table branches  enable row level security;
alter table coaches   enable row level security;
alter table programs  enable row level security;
alter table schedules enable row level security;
alter table notices   enable row level security;
alter table gallery   enable row level security;
alter table inquiries enable row level security;

-- 공개 읽기 + 관리자 쓰기
do $$
declare t text;
begin
  foreach t in array array['branches','coaches','programs','schedules','notices','gallery']
  loop
    execute format('drop policy if exists "%s_public_read" on %I', t, t);
    execute format('create policy "%s_public_read" on %I for select to anon, authenticated using (true)', t, t);

    execute format('drop policy if exists "%s_admin_write" on %I', t, t);
    execute format('create policy "%s_admin_write" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- 문의: 익명은 INSERT만, 조회/수정/삭제는 관리자만
drop policy if exists "inquiries_public_insert" on inquiries;
create policy "inquiries_public_insert" on inquiries
  for insert to anon, authenticated with check (true);

drop policy if exists "inquiries_admin_read" on inquiries;
create policy "inquiries_admin_read" on inquiries
  for select to authenticated using (true);

drop policy if exists "inquiries_admin_update" on inquiries;
create policy "inquiries_admin_update" on inquiries
  for update to authenticated using (true) with check (true);

drop policy if exists "inquiries_admin_delete" on inquiries;
create policy "inquiries_admin_delete" on inquiries
  for delete to authenticated using (true);


-- ============================================================
--  Storage — 이미지 버킷
-- ============================================================
insert into storage.buckets (id, name, public)
values ('public-images', 'public-images', true)
on conflict (id) do update set public = true;

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'public-images');

drop policy if exists "images_admin_insert" on storage.objects;
create policy "images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'public-images');

drop policy if exists "images_admin_update" on storage.objects;
create policy "images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'public-images');

drop policy if exists "images_admin_delete" on storage.objects;
create policy "images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'public-images');


-- ============================================================
--  무료 플랜 일시정지 방지용 (선택)
--  Supabase 무료 프로젝트는 7일간 요청이 없으면 일시정지됩니다.
--  Cloudflare Cron 등에서 하루 한 번 아래를 호출하면 됩니다.
--    GET {SUPABASE_URL}/rest/v1/branches?select=id&limit=1
-- ============================================================
