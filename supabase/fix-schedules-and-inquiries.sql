-- ============================================================
--  급한 수정 2건 — Supabase SQL Editor 에 통째로 붙여넣고 실행하세요.
--  (여러 번 실행해도 안전합니다.)
--
--  1) 시간표 저장이 실패하는 문제
--     관리자 화면은 요일·반을 여러 개 고르도록 되어 있는데
--     DB 에 해당 컬럼(days, program_ids, start_time, end_time)이 없습니다.
--
--  2) 방문자가 체험·상담 신청을 보낼 수 없는 문제
--     inquiries 테이블에 익명 등록 정책이 빠져 있어
--     신청 폼 제출이 전부 거부되고 있습니다.
-- ============================================================


-- ------------------------------------------------------------
--  1) 시간표 확장 (supabase/schedules-multi.sql 과 동일)
-- ------------------------------------------------------------
alter table schedules
  add column if not exists program_ids text[] default '{}',   -- 반 여러 개
  add column if not exists days        text[] default '{}',   -- 요일 여러 개
  add column if not exists start_time  text,                  -- 'HH:MM'
  add column if not exists end_time    text;                  -- 'HH:MM'

-- 기존 줄을 새 구조로 옮긴다
update schedules
   set program_ids = array[program_id]
 where program_id is not null
   and (program_ids is null or cardinality(program_ids) = 0);

update schedules
   set days = array[day]
 where day is not null
   and (days is null or cardinality(days) = 0);

-- 'HH:MM-HH:MM' 형태로 들어가 있던 값을 시작/종료로 분리
update schedules
   set start_time = split_part(replace(time_range, ' ', ''), '-', 1),
       end_time   = split_part(replace(time_range, ' ', ''), '-', 2)
 where time_range like '%-%'
   and (start_time is null or start_time = '');

-- 예전 단일 컬럼은 되돌릴 수 있도록 남겨 두되, 비어 있어도 되게 한다
alter table schedules alter column day        drop not null;
alter table schedules alter column time_range drop not null;
alter table schedules alter column program_id drop not null;


-- ------------------------------------------------------------
--  2) 체험·상담 신청 폼 (방문자 등록 허용)
--     읽기·수정·삭제는 계속 관리자만 가능하다.
-- ------------------------------------------------------------
alter table inquiries enable row level security;

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
