/* ============================================================
   Supabase 연결 정보
   ------------------------------------------------------------
   Supabase 대시보드 > Project Settings > API 에서 값을 복사해
   아래 두 줄만 바꾸면 됩니다.

     URL      : Project URL
     ANON_KEY : anon / public 키  (service_role 키는 절대 넣지 마세요)

   anon 키는 공개되어도 안전합니다. 실제 권한은 Supabase 의 RLS 정책이
   막아 줍니다 (supabase/schema.sql 참고).
   ============================================================ */
window.ANTAEAN_CONFIG = {
  SUPABASE_URL: "https://djfosgwhhxpyvkhpbxjh.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZm9zZ3doaHhweXZraHBieGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjgyNDQsImV4cCI6MjEwMzg0NDI0NH0.pk7i3dLjFgh9oRFylAmECJ1zSK5bgZ_J8JFIe4dRzB0",

  /* 카카오톡 채널 주소 (없으면 빈 문자열로 두세요) */
  KAKAO_URL: ""
};
