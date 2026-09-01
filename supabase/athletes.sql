-- ============================================================
--  선수단 테이블 추가
--  schema.sql 을 이미 실행한 프로젝트에 이어서 실행하세요.
--  (여러 번 실행해도 안전합니다.)
-- ============================================================

create table if not exists athletes (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  grade     text not null,   -- grade-1-2 | grade-3-4 | grade-5-6 | grade-middle-adult
  gender    text not null,   -- male | female
  photo_url text,
  intro     text,
  awards    text,            -- 줄바꿈으로 구분된 목록
  sort      int default 0
);

create index if not exists athletes_group_idx on athletes (grade, gender, sort);

alter table athletes enable row level security;

-- 공개 읽기
drop policy if exists "athletes_public_read" on athletes;
create policy "athletes_public_read" on athletes
  for select to anon, authenticated using (true);

-- 관리자만 쓰기
drop policy if exists "athletes_admin_write" on athletes;
create policy "athletes_admin_write" on athletes
  for all to authenticated using (true) with check (true);
