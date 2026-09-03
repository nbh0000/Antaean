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
     관리자에 등록된 지도자가 있으면 이름으로 짝을 지어 사진과 각 항목을
     모두 관리자 값으로 바꾼다. 항목이 비어 있으면 그 블록을 감춘다.
     DB 에 없는 지도자는 HTML 원본 그대로 둔다. */
  var COACH_FIELDS = ["education", "career", "certificates", "coaching", "awards"];

  async function coaches() {
    var photos = document.querySelectorAll("[data-live=coach-photo]");
    var cards = document.querySelectorAll("[data-live-coach]");
    if (!photos.length && !cards.length) return;
    var rows = await AF.list("coaches");
    if (!rows.length) return;
    var byName = {};
    rows.forEach(function (c) { byName[c.name] = c; });

    /* 관리자에서 이름을 바꾸면 이름으로는 짝이 안 맞는다.
       그럴 때를 대비해 표시 순서대로도 짝지을 수 있게 해 둔다. */
    var ordered = rows.slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
    var cardList = Array.prototype.slice.call(cards);
    function pick(key, idx) { return byName[key] || ordered[idx] || null; }

    photos.forEach(function (el, idx) {
      var c = pick(el.dataset.name, idx);
      if (!c || !c.photo_url) return;
      el.innerHTML = '<img src="' + esc(c.photo_url) + '" alt="' + esc(c.name) + '">';
    });

    cardList.forEach(function (card, idx) {
      var c = pick(card.dataset.liveCoach, idx);
      if (!c) return;

      var nameEl = card.querySelector('[data-coach-field="name"]');
      if (nameEl && c.name) nameEl.textContent = c.name;
      var titleEl = card.querySelector('[data-coach-field="title"]');
      if (titleEl) {
        if (c.title) { titleEl.textContent = c.title; titleEl.hidden = false; }
        else { titleEl.hidden = true; }
      }

      COACH_FIELDS.forEach(function (f) {
        var ul = card.querySelector('[data-coach-field="' + f + '"]');
        if (!ul) return;
        var block = ul.closest("[data-coach-block]");
        var lines = AF.lines(c[f]);
        if (!lines.length) { if (block) block.hidden = true; return; }
        if (block) block.hidden = false;
        ul.innerHTML = lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("");
      });
    });
  }


  /* ---------- 선수단 ----------
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
          '<div class="athlete__photo rv--clip">' + photo + "</div>" +
          '<div class="athlete__body">' +
          "<strong>" + esc(a.name) + "</strong>" +
          (a.intro ? "<p>" + esc(a.intro) + "</p>" : "") +
          (awards.length
            ? '<div class="acc"><span class="athlete__label">수상이력</span><ul class="ticks">' +
              awards.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>"
            : "") +
          "</div></article>";
      }).join("");
      grid.querySelectorAll(".rv").forEach(function (el) { el.classList.add("is-in"); });
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
