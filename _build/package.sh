#!/usr/bin/env bash
# ============================================================
#  배포용 폴더(dist/) 만들기
#    사용법:  bash _build/package.sh
#
#  공개해도 되는 파일만 골라 담는다.
#  작업용 폴더를 통째로 올리면 아래가 전부 공개 URL 로 노출된다:
#    _removed/  (격리한 실명 아동 사진)
#    content/   (고객이 보낸 원본 txt·사진)
#    supabase/  (DB 스키마)
#    _build/    (빌드 조각)
#    *.md       (내부 문서)
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DIST="docs"   # GitHub Pages 가 main 브랜치의 /docs 를 서빙한다
rm -rf "$DIST"
mkdir -p "$DIST"

# 1) 공개 페이지
cp *.html "$DIST"/

# 2) 관리자 (Supabase 로그인 + RLS 로 보호됨, robots 차단)
cp -r admin "$DIST"/

# 3) 정적 자산
mkdir -p "$DIST/assets"
cp -r assets/css assets/js assets/img "$DIST/assets"/

#    참조되지 않는 4K 원본은 제외 (7.7MB)
rm -f "$DIST"/assets/img/hero/fencing-master-*.jpg

# 4) 배포 설정
cp _headers netlify.toml robots.txt "$DIST"/ 2>/dev/null || true

echo "── dist/ 준비 완료 ──"
echo "  페이지   : $(ls "$DIST"/*.html | wc -l)개"
echo "  관리자   : $(ls "$DIST"/admin/*.html | wc -l)개"
echo "  전체 용량: $(du -sh "$DIST" | cut -f1)"
echo
echo "제외된 폴더: _removed / content / supabase / _build / *.md"
