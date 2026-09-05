/* ============================================================
   관리자에서 입력한 내용을 공개 페이지에 채워 넣는다.

   설계 원칙: 덧씌우기(progressive enhancement).
   Supabase 가 연결되지 않았거나 데이터가 비어 있으면 아무것도 건드리지
   않고, HTML 에 이미 들어 있는 txt 원문/빈 상태 문구가 그대로 남는다.
   ============================================================ */
(function () {
  "use strict";
  if (!window.AF || !AF.ready) return;

  var esc = AF.esc;

  /* 새로 그린 영역을 곧바로 보이게 한다.
     스크롤 등장 효과(.rv / .rv--clip)는 site.js 가 페이지를 읽을 때 한 번만
     감시를 걸기 때문에, 뒤늦게 그린 요소는 스스로 is-in 을 붙여야 한다. */
  function reveal(root) {
    root.querySelectorAll(".rv, .rv--clip").forEach(function (el) {
      el.classList.add("is-in");
    });
    if (root.classList) root.classList.add("is-in");
  }

  /* 뒤늦게 그린 수상내역 접기 버튼에 동작을 붙인다. */
  function bindAcc(root) {
    root.querySelectorAll("[data-acc]").forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener("click", function () {
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        panel.classList.toggle("is-open", open);
      });
    });
  }

  /* ---------- 공지 ---------- */
  function noticeHref(id) {
    return "community.html?notice=" + encodeURIComponent(id) + "#community-notice";
  }

  function noticeBody(text) {
    return esc(text || "").split("\r").join("").split("\n").join("<br>");
  }

  async function noticeDetail(box, id) {
    var rows = await AF.list("notices", function (q) { return q.eq("id", id).limit(1); });
    if (!rows.length) return false;
    var n = rows[0];
    box.classList.remove("empty");
    box.innerHTML =
      '<article class="notice-view">' +
        '<h3 class="notice-view__title">' +
          (n.pinned ? '<span class="tag">공지</span>' : "") + esc(n.title) +
        "</h3>" +
        '<p class="notice-view__date">' + AF.fmtDate(n.created_at) + "</p>" +
        (n.image_url
          ? '<img class="notice-view__img" src="' + esc(n.image_url) + '" alt="" loading="lazy">'
          : "") +
        '<div class="notice-view__body">' + noticeBody(n.body) + "</div>" +
        '<p class="notice-view__foot">' +
          '<a class="btn btn--line" href="community.html#community-notice">목록</a>' +
        "</p>" +
      "</article>";
    return true;
  }

  async function notices() {
    var box = document.querySelector("[data-live=notices]");
    if (!box) return;
    var limit = parseInt(box.dataset.limit, 10) || 0;

    /* 상세 보기: community.html?notice=<id> */
    var wanted = new URLSearchParams(location.search).get("notice");
    if (wanted && !limit) {
      if (await noticeDetail(box, wanted)) return;
    }

    var rows = await AF.list("notices", function (q) {
      q = q.order("pinned", { ascending: false }).order("created_at", { ascending: false });
      return limit ? q.limit(limit) : q;
    });
    if (!rows.length) return;
    box.classList.remove("empty");
    box.innerHTML =
      '<ul class="notice-list">' + rows.map(function (n) {
        return '<li><a href="' + esc(noticeHref(n.id)) + '">' +
          (n.pinned ? '<span class="tag">공지</span>' : "") +
          '<span class="t">' + esc(n.title) + "</span>" +
          '<span class="d">' + AF.fmtDate(n.created_at) + "</span></a></li>";
      }).join("") + "</ul>";
  }

  /* ---------- 시간표 ---------- */
  async function schedules() {
    var boxes = document.querySelectorAll("[data-live=schedule]");
    if (!boxes.length) return;
    var progs = await AF.list("programs");
    var byId = {};
    progs.forEach(function (p) { byId[p.id] = p.name; });

    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var rows = await AF.list("schedules", function (q) {
        return q.eq("branch_id", box.dataset.branch).order("sort");
      });
      if (!rows.length) continue;
      box.classList.remove("empty");
      box.innerHTML =
        '<div class="table-scroll"><table class="sched">' +
        "<thead><tr><th>요일</th><th>시간</th><th>반</th><th>비고</th></tr></thead><tbody>" +
        rows.map(function (r) {
          /* 요일·반은 여러 개일 수 있다. 예전 단일 컬럼도 함께 받아 준다. */
          var days = (r.days && r.days.length) ? r.days : (r.day ? [r.day] : []);
          var pids = (r.program_ids && r.program_ids.length)
            ? r.program_ids : (r.program_id ? [r.program_id] : []);
          var names = pids.map(function (id) { return byId[id] || ""; }).filter(Boolean);
          var time = (r.start_time && r.end_time)
            ? r.start_time + " ~ " + r.end_time
            : (r.time_range || "");
          return "<tr><td>" + esc(days.join(" · ")) + "</td>" +
                 "<td>" + esc(time) + "</td>" +
                 "<td>" + esc(names.join(" · ")) + "</td>" +
                 "<td>" + esc(r.note || "") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
  }

  /* ---------- 프로그램 ----------
     관리자에서 고친 반 이름·대상·수업특징·수업시간을 프로그램 페이지와
     메인 카드에 반영한다. 값이 비어 있으면 HTML 원본을 그대로 둔다. */
  var PROG_FIELDS = ["name", "target", "features", "class_time"];

  async function programs() {
    var slots = document.querySelectorAll("[data-live-program]");
    if (!slots.length) return;
    var rows = await AF.list("programs");
    if (!rows.length) return;
    var byId = {};
    rows.forEach(function (r) { byId[r.id] = r; });

    slots.forEach(function (card) {
      var p = byId[card.dataset.liveProgram];
      if (!p) return;
      PROG_FIELDS.forEach(function (f) {
        var el = card.querySelector('[data-prog-field="' + f + '"]');
        if (!el) return;
        var v = p[f];
        var block = el.closest("[data-prog-block]");
        if (!v) { if (block) block.hidden = true; return; }
        if (block) block.hidden = false;
        if (f === "name" || el.tagName === "P" || el.tagName === "H2" || el.tagName === "H3") {
          el.textContent = v;
        } else {
          /* 줄바꿈으로 구분된 여러 문단 */
          el.innerHTML = AF.lines(v).map(function (line) {
            return "<p>" + esc(line) + "</p>";
          }).join("");
        }
      });
    });
  }

  /* ---------- 갤러리 ---------- */
  async function gallery() {
    var boxes = document.querySelectorAll("[data-live=gallery]");
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var rows = await AF.list("gallery", function (q) {
        return q.eq("branch_id", box.dataset.branch).order("sort");
      });
      if (!rows.length) continue;
      box.classList.remove("empty");
      box.className = "gal";
      box.innerHTML = rows.map(function (g) {
        return '<figure><img src="' + esc(g.image_url) + '" alt="' + esc(g.caption || "") + '" loading="lazy"></figure>';
      }).join("");
    }
  }

  /* ---------- 지도자 ----------
     DB 에 지도자가 한 명이라도 있으면 강사진 페이지의 카드를 전부 다시 그린다.
     그래야 관리자에서 지도자를 추가·삭제하거나 HTML 에 없던 항목(선수경력·
     자격증 등)을 채웠을 때도 그대로 반영된다. 직책에 "코치"가 들어 있으면
     코치 탭, 그 밖에는 감독 탭에 넣는다. */
  var COACH_FIELDS = ["education", "career", "certificates", "coaching"];
  var COACH_LABEL = {
    education: "학력", career: "선수경력", certificates: "자격증", coaching: "지도경력"
  };

  function coachCard(c, key) {
    var photo = c.photo_url
      ? '<img src="' + esc(c.photo_url) + '" alt="' + esc(c.name) + '">'
      : '<span class="coach__initial">' + esc(String(c.name || "").slice(0, 1)) + "</span>";

    var blocks = COACH_FIELDS.map(function (f) {
      var ls = AF.lines(c[f]);
      if (!ls.length) return "";
      return '<div class="coach__block"><h4>' + COACH_LABEL[f] + "</h4><ul>" +
        ls.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
        "</ul></div>";
    }).join("");

    var awards = AF.lines(c.awards);
    var accId = "awards-" + key;
    var acc = awards.length
      ? '<div class="acc">' +
          '<button class="acc__btn" type="button" data-acc aria-expanded="false" aria-controls="' +
            accId + '">수상내역</button>' +
          '<div class="acc__body coach__block" id="' + accId + '"><ul>' +
            awards.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
          "</ul></div>" +
        "</div>"
      : "";

    return '<article class="coach rv is-in">' +
      "<div>" +
        '<div class="coach__photo rv rv--zoom is-in">' + photo + "</div>" +
      "</div><div>" +
        '<h2 class="coach__name">' + esc(c.name) + "</h2>" +
        (c.title ? '<p class="coach__role">' + esc(c.title) + "</p>" : "") +
        blocks + acc +
      "</div></article>";
  }

  async function coaches() {
    var photos = document.querySelectorAll("[data-live=coach-photo]");
    var cards = document.querySelectorAll("[data-live-coach]");
    var director = document.querySelector('[data-tabpanel="staff-director"]');
    var coachPanel = document.querySelector('[data-tabpanel="staff-coach"]');
    if (!photos.length && !cards.length && !director) return;
    var rows = await AF.list("coaches", function (q) { return q.order("sort"); });
    if (!rows.length) return;

    /* 강사진 페이지: 카드를 통째로 다시 그린다. */
    if (director && coachPanel) {
      var groups = { director: [], coach: [] };
      rows.forEach(function (c) {
        groups[/코치/.test(c.title || "") ? "coach" : "director"].push(c);
      });
      [[director, groups.director, "d"], [coachPanel, groups.coach, "c"]]
        .forEach(function (pair) {
          var panel = pair[0], list = pair[1], p = pair[2];
          panel.innerHTML = list.length
            ? list.map(function (c, i) { return coachCard(c, p + i); }).join("")
            : '<div class="empty">등록된 지도자가 없습니다.</div>';
          reveal(panel);
          bindAcc(panel);
        });
      return;
    }

    /* 그 밖의 페이지: 이름(없으면 순서)으로 짝지어 값만 채운다. */
    var byName = {};
    rows.forEach(function (c) { byName[c.name] = c; });
    photos.forEach(function (el, idx) {
      var c = byName[el.dataset.name] || rows[idx];
      if (!c || !c.photo_url) return;
      el.innerHTML = '<img src="' + esc(c.photo_url) + '" alt="' + esc(c.name) + '">';
    });
  }

  /* ---------- Team Antaean (선수단) ----------
     DB에 선수가 한 명이라도 있으면 정적 자리표시자를 전부 걷어내고
     등록된 선수만 보여 준다. 아무도 없으면 HTML 원본을 그대로 둔다. */
  async function athletes() {
    var grids = document.querySelectorAll("[data-live=athletes]");
    if (!grids.length) return;
    var rows = await AF.list("athletes", function (q) { return q.order("sort"); });
    if (!rows.length) return;

    grids.forEach(function (grid) {
      var list = rows.filter(function (r) {
        return r.grade === grid.dataset.grade && r.gender === grid.dataset.gender;
      });
      if (!list.length) {
        grid.classList.remove("grid", "grid--3");
        grid.className = "empty";
        grid.textContent = "등록된 선수가 없습니다.";
        return;
      }
      grid.innerHTML = list.map(function (a) {
        var awards = AF.lines(a.awards);
        var photo = a.photo_url
          ? '<img src="' + esc(a.photo_url) + '" alt="' + esc(a.name) + '" loading="lazy">'
          : '<span class="coach__initial">' + esc(a.name.slice(0, 1)) + "</span>";
        return '<article class="athlete rv">' +
          '<div class="athlete__photo rv rv--clip">' + photo + "</div>" +
          '<div class="athlete__body">' +
          "<strong>" + esc(a.name) + "</strong>" +
          (a.intro ? "<p>" + esc(a.intro) + "</p>" : "") +
          (awards.length
            ? '<div class="acc"><span class="athlete__label">수상이력</span><ul class="ticks">' +
              awards.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>"
            : "") +
          "</div></article>";
      }).join("");
      /* 나중에 그린 요소는 site.js 의 스크롤 감시 대상이 아니다.
         is-in 을 직접 붙이지 않으면 rv--clip 이 clip-path 로 잘라 버린다. */
      reveal(grid);
    });
  }

  /* ---------- 커뮤니티 > 클럽 일상 ----------
     사진이 한 장이라도 등록되어 있으면 HTML 에 들어 있던 기본 사진을
     전부 걷어내고 등록된 사진만 보여 준다. 없으면 원본 그대로 둔다. */
  async function daily() {
    var box = document.querySelector("[data-live=daily]");
    if (!box) return;
    var rows = await AF.list("daily_photos", function (q) { return q.order("sort"); });
    if (!rows.length) return;
    box.innerHTML = rows.map(function (r) {
      return '<figure class="rv rv--clip is-in"><img src="' + esc(r.image_url) + '" alt="' +
        esc(r.caption || "클럽 일상") + '" loading="lazy"></figure>';
    }).join("");
  }

  /* ---------- 커뮤니티 > 대회 기록 ---------- */
  async function competitions() {
    var box = document.querySelector("[data-live=competitions]");
    if (!box) return;
    var rows = await AF.list("competitions", function (q) { return q.order("sort"); });
    if (!rows.length) return;
    box.classList.remove("empty");
    box.innerHTML =
      '<ul class="rec-list">' + rows.map(function (r) {
        return "<li><strong>" + esc(r.title) + "</strong>" +
          (r.body ? "<p>" + noticeBody(r.body) + "</p>" : "") + "</li>";
      }).join("") + "</ul>";
  }

  /* ---------- 지점 정보 ---------- */
  async function branches() {
    var slots = document.querySelectorAll("[data-live-branch]");
    if (!slots.length) return;
    var rows = await AF.list("branches");
    if (!rows.length) return;
    var byId = {};
    rows.forEach(function (b) { byId[b.id] = b; });

    slots.forEach(function (el) {
      var b = byId[el.dataset.liveBranch];
      if (!b) return;
      var f = el.dataset.liveField;
      var v = b[f];
      /* 카카오톡 오픈채팅 주소는 지점마다 다르다.
         관리자에 주소가 없는 지점은 버튼을 감춘다. */
      if (f === "kakao_url") {
        if (v) {
          el.href = v;
          el.target = "_blank";
          el.rel = "noopener";
          el.removeAttribute("aria-disabled");
          el.hidden = false;
        } else {
          el.hidden = true;
        }
        return;
      }
      if (!v) return;
      if (f === "phone") {
        el.textContent = v;
        if (el.tagName === "A") el.href = "tel:" + AF.digits(v);
      } else if (f === "address") {
        el.textContent = v;
        if (el.tagName === "A") {
          el.href = b.naver_map_url || ("https://map.naver.com/p/search/" + encodeURIComponent(v));
        }
      } else if (f === "naver_map_url") {
        el.href = b.naver_map_url || ("https://map.naver.com/p/search/" + encodeURIComponent(b.address || b.name));
      } else if (f === "instagram") {
        el.textContent = v;
        if (el.tagName === "A") el.href = "https://www.instagram.com/" + v.replace(/^@/, "");
      } else {
        el.textContent = v;
      }
    });

    /* 카카오톡 버튼은 지점 정보에 들어 있는 주소를 우선 쓴다 */
    var kakao = (byId.songdo && byId.songdo.kakao_url) || (byId.baegot && byId.baegot.kakao_url);
    if (kakao) {
      document.querySelectorAll('a[aria-disabled="true"], a[href="#"]').forEach(function (a) {
        if (!/카카오톡/.test(a.textContent)) return;
        a.href = kakao;
        a.removeAttribute("aria-disabled");
        a.target = "_blank";
        a.rel = "noopener";
      });
    }
  }

  Promise.all([notices(), schedules(), gallery(), coaches(), athletes(), branches(),
               daily(), competitions(), programs()])
    .catch(function (e) { console.warn("[live]", e); });
})();
