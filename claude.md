엔티언 펜싱클럽(ANTAEAN FENCING CLUB) 홈페이지 — 프로젝트 스펙

송도점·배곧점 2개 지점을 운영하는 펜싱클럽 홈페이지 + 관리자 페이지. 클럽에서 관리자 로그인 후 사진·시간표·공지·프로그램·지도자 프로필을 직접 수정한다.

기존 코드 처리 원칙

이미 만들어진 사이트(크림 배경·세리프 제목·메뉴 7개: 학원소개/펜싱 정보/프로그램/강사진/선수단/커뮤니티/오시는 길)를 개선하는 프로젝트다.

새로 스캐폴딩하지 않는다. 기존 프레임워크·라우팅·컴포넌트 구조를 최대한 유지하고 그 위에서 수정한다.
기존 사이트의 문구는 대부분 txt에 없는 임의 작성 문장이다. 전부 교체 대상.
고객이 요청하지 않은 페이지(펜싱 정보·선수단·커뮤니티)는 삭제하되 파일은 /_removed로 옮겨 보관.
기존 시설 사진은 유지해서 소개·오시는길·갤러리에 사용.
아래 스택 절은 "백엔드가 없을 때 추가할 기준"이다. 기존 프로젝트가 다른 스택이면 그 스택을 따르고, 백엔드만 Supabase로 붙인다.
콘텐츠 원칙 — 최우선 규칙

고객이 보낸 /content txt 4개에 없는 문구는 단 한 줄도 만들지 않는다.

소개문·교육방향·WHY ANTAEAN·프로그램 설명·지도자 프로필·지점 정보·신청 폼 항목은 txt 원문을 그대로 사용. 요약·윤문·재배열·오타 수정·문장 추가 전부 금지.
슬로건, 캐치프레이즈, 통계 숫자, 후기, 연혁, FAQ, 대회 실적 요약 등 txt에 없는 내용은 절대 생성하지 않는다. "그럴듯한" 문장을 넣고 싶어도 넣지 않는다.
txt에 없어서 비어 있는 것(시간표, 지도자 사진, 송도점 사진, 공지)은 빈 상태로 두고 관리자에서 입력하게 한다. 빈 상태 문구는 "등록된 시간표가 없습니다" 같은 사실 서술만.
허용되는 UI 라벨은 아래뿐이다. 이 외의 텍스트가 필요하면 만들지 말고 나에게 물어라.
메뉴: 홈 / 클럽소개 / 지도자 / 프로그램 / 체험·상담신청 / 오시는길 / 공지
버튼: 체험수업 신청 / 상담 문의 / 프로그램 보기 / 더보기 / 전화하기 / 카카오톡 문의 / 인스타그램 / 네이버 지도 / 신청하기 / 목록
폼: txt의 신청 항목명 그대로. 완료 화면 문구는 txt 문장 사용 — "신청 완료 후 클럽에서 확인하여 연락드립니다."
섹션 영문 소제목: ABOUT / PROGRAMS / COACHES / WHY ANTAEAN / LOCATION / NOTICE / APPLY (txt의 "WHY ANTAEAN?"과 클럽 영문명만 활용)
개인정보 수집·이용 동의 문구: 법정 필수 항목(수집 항목·목적·보유기간)만 사실대로 작성하되, 보유기간은 "상담 완료 후 파기"로 두고 나에게 확인 요청.
메타 description, OG 문구도 txt 첫 문장(엔티언펜싱클럽은 … 전문 펜싱클럽입니다.)만 사용.
관리자 화면의 설명 문구는 조작 안내(예: "사진을 올리면 소개 페이지 갤러리에 표시됩니다")만 허용. 마케팅 문구 금지.
기술 스택 (고정)
Next.js 15 App Router + TypeScript + Tailwind CSS
Supabase: Postgres(DB), Storage(이미지), Auth(관리자 로그인 1계정, 이메일/비밀번호)
배포: Cloudflare Workers/Pages (@opennextjs/cloudflare 어댑터, 무료·상업용 허용). Vercel Hobby는 상업용 금지라 사용하지 않음. 도메인은 나중에 Cloudflare DNS로 연결
폰트: Pretendard (CDN), 아이콘: lucide-react
폼 검증: react-hook-form + zod
이미지: next/image, remotePatterns에 Supabase Storage 도메인 등록
디자인 방향 (고객 요청 반영)
컬러: 네이비 
#0B1F3A(주), 옐로우 
#F5C518(포인트), 화이트, 라이트그레이 
#EEF0F3, 텍스트 
#111827. 클럽 로고(버건디)는 원본 그대로 사용 — 흰 배경 또는 네이비 배경 위 흰색 원형/사각 플레이트 위에 배치.
"어린이 학원"이 아니라 "전문 펜싱클럽" 이미지. 카툰·파스텔·둥근 말풍선·귀여운 아이콘 금지. 날카롭고 역동적이고 절제된 스포츠 브랜드 톤.
메인 히어로는 사진 없이 그래픽으로 구성: 네이비 풀블리드 배경 + 옐로우 피스트 라인(사선/수평 라인) + 원본 SVG 펜싱 실루엣(런지 자세) + 큰 영문 타이포 "ANTAEAN FENCING CLUB" + 한글 카피 "취미로 시작해도, 선수의 꿈을 가져도." 실루엣 SVG는 직접 그린 오리지널이어야 하며, 품질이 떨어지면 교차하는 블레이드 라인·피스트 그리드 같은 추상 그래픽으로 대체.
타이포: 한글 Pretendard, 영문 디스플레이는 Google Fonts 컨덴스드 계열(Bebas Neue 또는 Oswald). 섹션 제목은 영문 소제목(작게, 옐로우, letter-spacing) + 한글 제목(크게, 볼드).
모션: 히어로 라인이 그려지는 애니메이션, 스크롤 시 섹션 페이드업, 카드 hover에 옐로우 언더라인. 과하지 않게.
반복 모티프: 피스트 라인(가는 옐로우 선), 사선 컷 섹션 경계, 번호(01~06) 타이포.
시설 사진은 소개·오시는 길·갤러리에서 사용. 지도자 사진은 추후 관리자 업로드 전까지 이니셜 플레이스홀더.
모바일 우선. 하단 고정 바(모바일): 전화 / 카카오톡 / 체험신청 3버튼(옐로우).
헤더 (레퍼런스: wekeep.co.kr 메인 헤더 느낌)
상단 고정(fixed). 히어로 위에서는 투명 배경 + 흰색 로고/메뉴, 스크롤 80px 이후 흰 배경 + 네이비 텍스트 + 얇은 하단 그림자로 전환(transition 0.3s). 로고도 흰 버전/원본 버전 스왑.
레이아웃: 좌측 로고 / 중앙 1뎁스 메뉴 6개(간격 넓게, 폰트 15px medium) / 우측 옐로우 CTA 버튼 "체험수업 신청" (레퍼런스의 로그인 버튼 자리).
1뎁스 hover 시 풀와이드 드롭다운 패널이 헤더 아래 펼쳐지며 모든 1뎁스의 2뎁스가 한 번에 열 정렬로 보이는 메가메뉴 방식(레퍼런스와 동일). 패널 배경 흰색, 현재 hover 중인 1뎁스 아래 옐로우 인디케이터 라인.
메뉴 구조
클럽소개: 클럽소개 / 교육방향 / WHY ANTAEAN / 시설 사진
지도자: 지도자 소개
프로그램: 취미반 / 꿈나무반 / 선수반 / 성인반 / 시간표
체험·상담신청: 체험수업 신청 / 상담 문의
오시는길: 송도점 / 배곧점
공지: 공지사항
2뎁스는 앵커(#) 또는 탭 파라미터로 연결.
모바일: 우측 햄버거 → 전체화면 오버레이 메뉴(네이비 배경). 1뎁스 탭하면 아코디언으로 2뎁스 펼침(레퍼런스의 m_fold 방식). 하단에 전화·카카오톡·인스타 아이콘 3개.
헤더 높이 데스크톱 80px / 모바일 60px. 히어로 콘텐츠는 헤더 높이만큼 padding-top.
공개 페이지 (라우트)
라우트	내용
/	히어로(사진 슬라이드), 클럽 한줄 소개, 프로그램 4개 카드, WHY ANTAEAN 6개, 지점 2개 요약(주소·전화), 최근 공지 3개, 체험신청 CTA
/about	클럽 소개, 교육방향 5개, WHY ANTAEAN 6개, 시설 사진 갤러리(지점 탭)
/coaches	지도자 카드(사진·직책·학력·선수경력·자격증·지도경력·수상내역 아코디언)
/programs	취미반·꿈나무반·선수반·성인반 — 대상/수업특징/수업시간. 하단에 지점별 시간표(송도/배곧 탭, 요일×시간 표)
/apply	체험수업/상담 신청 폼 + 전화·카카오톡 버튼
/location	송도점·배곧점 — 주소(클릭→네이버지도), 전화(클릭→tel:), 주차안내, 인스타그램 링크
/notice, /notice/[id]	공지 목록·상세

공통: 헤더(위 "헤더" 절 참고), 푸터(네이비 배경, 로고·지점 2개 정보·인스타 링크·개인정보처리방침·사업자 정보 자리)

관리자 (/admin, middleware로 보호)
/admin/login — Supabase Auth 이메일/비밀번호
/admin — 대시보드: 미확인 문의 수, 최근 문의 5건
/admin/inquiries — 문의 목록, 상세, 상태(신규/연락완료) 변경, 메모
/admin/notices — 공지 CRUD (제목, 내용(간단 마크다운 or textarea), 고정 여부, 이미지 첨부)
/admin/programs — 프로그램 4개 내용 수정 (대상/특징/수업시간/대표 이미지)
/admin/schedules — 지점별 시간표 편집: 행(요일·시간·반·비고) 추가/삭제/순서
/admin/coaches — 지도자 CRUD (사진 업로드, 각 항목은 줄바꿈 리스트로 저장)
/admin/gallery — 지점별 시설 사진 업로드/삭제/순서, 히어로 사용 여부 체크
/admin/branches — 지점 정보(주소·전화·주차·인스타·네이버지도 URL·카카오톡 채널 URL)
관리자 UI는 shadcn/ui 스타일의 단순 폼. 사장님이 쓰는 화면이니 설명 문구를 항목마다 붙일 것.
DB 스키마 (Supabase SQL)
sql
create table branches (
  id text primary key,            -- 'songdo' | 'baegot'
  name text not null,             -- 송도점 / 배곧점
  address text, phone text, parking text,
  instagram text, naver_map_url text, kakao_url text,
  sort int default 0
);
create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null, title text, photo_url text,
  education text, career text, certificates text, coaching text, awards text, -- 줄바꿈 구분
  sort int default 0
);
create table programs (
  id text primary key,            -- hobby | junior | athlete | adult
  name text not null, target text, features text, class_time text,
  image_url text, sort int default 0
);
create table schedules (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  day text not null,              -- 월~일
  time_range text not null,       -- '16:00-17:00'
  program_id text references programs(id),
  note text, sort int default 0
);
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text, pinned boolean default false,
  image_url text, created_at timestamptz default now()
);
create table gallery (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  image_url text not null, caption text,
  is_hero boolean default false, sort int default 0
);
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null, age text, branch_id text, phone text not null,
  experience text,                -- 처음 / 경험 있음
  program_id text, message text,
  agreed boolean not null default false,
  status text default 'new',      -- new | contacted
  memo text, created_at timestamptz default now()
);
RLS: 공개 테이블은 anon select 허용, inquiries는 anon insert만 허용, 나머지 쓰기는 authenticated만.
Storage 버킷 public-images (public). 업로드 경로 coaches/, gallery/, notices/, programs/.
초기 데이터 (seed)

/content/ 폴더의 txt 4개를 그대로 seed 스크립트로 넣는다.

ANTAEAN_FENCING_CLUB_소개.txt → about 페이지 정적 텍스트(교육방향·WHY 6개는 코드에 상수로)
프로그램_안내.txt → programs 4행
감독_코치_프로필.txt → coaches 3행 (김제형 대표원장 / 최원준 감독 / 김기백 코치)
체험수업__상담신청.txt → branches 2행 + 신청 폼 항목
시설 사진 → 배곧점 gallery (송도점 사진·지도자 사진은 추후 관리자에서 업로드)
시간표는 아직 없음 → 빈 상태 + 관리자에서 입력 (성인반은 월~금 20:00~21:30 고정 안내)
체험/상담 신청 폼

항목: 이름, 연령, 희망 지점(송도/배곧), 연락처, 펜싱 경험(처음/경험 있음), 희망 프로그램(취미반/꿈나무반/선수반/성인반), 문의내용, 개인정보 수집·이용 동의(필수, 동의 문구 모달)

제출 → inquiries insert → 완료 화면 "확인 후 연락드리겠습니다"
전화번호 자동 하이픈, 간단한 스팸 방지(honeypot)
(선택) Resend로 관리자 이메일 알림 — 환경변수 있을 때만 동작
지점 정보
송도점: 인천 연수구 해돋이로152번길 9 대홍프라자 5층 505호 (할리스건물) / 010-2848-6663 / 무료주차 2시간 / IG antaeanfencingclub_songdo
배곧점: 경기도 시흥시 배곧4로 32-9 골든프라자 5층 503호 (모닝글로리건물) / 010-4488-7866 / 무료주차 2시간 / IG antaeanfencingclub_baegot
네이버지도 링크: https://map.naver.com/p/search/{주소 인코딩} 기본값, 관리자에서 교체 가능
작업 순서 (세션 단위)
스캐폴딩 + Supabase 스키마·RLS·Storage + seed 스크립트
공개 페이지 7개 (모바일 먼저 확인)
관리자 로그인 + 6개 관리 화면
신청 폼 + 관리자 문의함
Cloudflare 배포(@opennextjs/cloudflare), 환경변수, Supabase keep-alive Cron(매일 1회 select 쿼리 — 무료 플랜 7일 미사용 시 일시정지 방지), OG 이미지, 파비콘(로고), 성능 점검
관리자 사용 설명서 1장(md) 작성 → 고객 전달
주의
모든 전화번호는 <a href="tel:">, 주소는 새 탭 지도 링크
이미지 업로드 시 브라우저에서 리사이즈(최대 1600px) 후 업로드
관리자 삭제는 confirm 필수
한글 URL·파일명 금지, 업로드 파일명은 uuid로
Cloudflare Workers는 Node 런타임 일부 미지원 → nodejs_compat 플래그, 이미지 최적화는 unoptimized 또는 Cloudflare Images 사용
Supabase·Cloudflare 계정은 고객 이메일로 생성하고 개발자를 멤버로 초대 (소유권은 고객)