#!/usr/bin/env bash
# Assembles static pages from _build fragments.
#   usage: bash _build/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

KAKAO_URL="#"   # TODO: 카카오톡 채널 URL 확정되면 교체
VER="$(date +%s)" # asset cache-buster

build() {            # build <out.html> <body-fragment> <page-key> <title> <hero|solid>
  local out="$1" body="$2" key="$3" title="$4" mode="$5"
  local desc="엔티언펜싱클럽은 펜싱을 처음 접하는 아이부터 전문적인 선수 활동을 목표로 하는 학생, 그리고 성인까지 함께할 수 있는 전문 펜싱클럽입니다."
  local solid=""
  [ "$mode" = "solid" ] && solid=" data-hdr-solid"

  {
    cat <<HTML
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:type" content="website">
    <link rel="icon" href="assets/img/brand/antaean-logo.jpg">
    <link rel="stylesheet" href="assets/css/site.css?v=${VER}">
  </head>
  <body data-page="${key}">
HTML
    sed "s|{{HDR_SOLID}}|${solid}|g" _build/header.html
    cat "_build/${body}"
    sed -e "s|{{KAKAO_URL}}|${KAKAO_URL}|g" -e "s|{{VER}}|${VER}|g" _build/footer.html
    cat <<'HTML'
  </body>
</html>
HTML
  } > "$out"

  # mark current menu item
  sed -i "s|<a class=\"hdr__top\" href=\"[a-z]*\.html\" data-nav=\"${key}\"|& aria-current=\"page\"|" "$out"
  echo "  built $out"
}

build index.html    body-index.html    home     "엔티언펜싱클럽 | ANTAEAN FENCING CLUB"        hero
build about.html    body-about.html    about    "학원소개 | 엔티언펜싱클럽"                     solid
build programs.html body-programs.html programs "프로그램 | 엔티언펜싱클럽"                     solid
build coaching.html body-coaching.html coaching "강사진 | 엔티언펜싱클럽"                       solid
build contact.html  body-contact.html  contact  "오시는 길 | 엔티언펜싱클럽"                    solid
build trial.html    body-trial.html    trial    "체험수업 / 상담신청 | 엔티언펜싱클럽"          solid
build songdo.html     body-songdo.html     songdo     "송도점 | 엔티언펜싱클럽"        hero
build baegot.html     body-baegot.html     baegot     "배곧점 | 엔티언펜싱클럽"        hero
build facilities.html body-facilities.html facilities "시설안내 | 엔티언펜싱클럽"      hero
build fencing.html    body-fencing.html    fencing    "펜싱 정보 | 엔티언펜싱클럽"     solid
build athletes.html   body-athletes.html   athletes   "선수단 | 엔티언펜싱클럽"        solid
build community.html  body-community.html  community  "커뮤니티 | 엔티언펜싱클럽"      solid
echo "done."
