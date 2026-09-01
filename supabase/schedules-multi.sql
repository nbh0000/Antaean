-- ============================================================
--  시간표 확장
--    · 반을 여러 개 선택 (예: 16:00~17:00 에 취미반 + 꿈나무반)
--    · 요일을 여러 개 선택 (예: 월·수·금 같은 시간)
--    · 시작/종료 시각을 분 단위로 저장
--
--  schema.sql 을 실행한 프로젝트에 이어서 돌리세요.
--  여러 번 실행해도 안전합니다.
-- ============================================================

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
