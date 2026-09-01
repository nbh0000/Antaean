# -*- coding: utf-8 -*-
"""admin/*.html 생성기.  실행: python _build/build-admin.py"""
import io, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "admin")
os.makedirs(OUT, exist_ok=True)

SB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.min.js"

PAGE = """<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} | ANTAEAN 관리자</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" href="../assets/img/brand/antaean-logo.jpg">
    <link rel="stylesheet" href="../assets/css/admin.css">
  </head>
  <body>
{body}
    <script src="{sb}"></script>
    <script src="../assets/js/config.js"></script>
    <script src="../assets/js/db.js"></script>
{extra}
    <script>
{script}
    </script>
  </body>
</html>
"""

SHELL = """    <div class="a-wrap">
      <nav class="a-side"></nav>
      <main class="a-main">
        <div class="a-head">
          <h1>{h1}</h1>
          <p>{hint}</p>
        </div>
{main}
      </main>
    </div>"""


def page(name, title, h1, hint, main, script, shell=True, extra=None):
    body = SHELL.format(h1=h1, hint=hint, main=main) if shell else main
    if extra is None:
        extra = '    <script src="../assets/js/admin.js"></script>'
    html = PAGE.format(title=title, body=body, sb=SB, script=script, extra=extra)
    io.open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n").write(html)
    print("  admin/" + name)


# ============================================================ login
page("login.html", "로그인", "", "",
     shell=False,
     extra="",
     main="""    <div class="login-wrap">
      <form class="login-box" id="f">
        <h1>ANTAEAN 관리자</h1>
        <p class="hint">클럽에서 발급받은 이메일과 비밀번호로 로그인하세요.</p>
        <div class="field">
          <label for="email">이메일</label>
          <input id="email" type="email" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="pw">비밀번호</label>
          <input id="pw" type="password" autocomplete="current-password" required>
        </div>
        <button class="btn btn-primary" type="submit" id="go">로그인</button>
        <p class="err" id="err"></p>
      </form>
    </div>""",
     script="""      var f = document.getElementById("f"), err = document.getElementById("err"), go = document.getElementById("go");
      if (!AF.ready) {
        err.textContent = "assets/js/config.js 에 Supabase 주소와 anon 키를 먼저 넣어 주세요.";
        go.disabled = true;
      } else {
        AF.session().then(function (s) { if (s) location.replace("index.html"); });
      }
      f.addEventListener("submit", async function (e) {
        e.preventDefault();
        err.textContent = ""; go.disabled = true; go.textContent = "확인 중…";
        try {
          await AF.signIn(document.getElementById("email").value.trim(), document.getElementById("pw").value);
          location.replace("index.html");
        } catch (ex) {
          err.textContent = "이메일 또는 비밀번호가 올바르지 않습니다.";
          go.disabled = false; go.textContent = "로그인";
        }
      });""")

# ============================================================ dashboard
page("index.html", "대시보드", "대시보드",
     "새로 들어온 문의를 먼저 확인하세요. 왼쪽 메뉴에서 홈페이지 내용을 수정할 수 있습니다.",
     """        <div class="stats">
          <div class="stat hot"><span>확인하지 않은 문의</span><b id="s-new">–</b></div>
          <div class="stat"><span>전체 문의</span><b id="s-all">–</b></div>
          <div class="stat"><span>등록된 공지</span><b id="s-notice">–</b></div>
          <div class="stat"><span>등록된 사진</span><b id="s-gal">–</b></div>
        </div>
        <div class="card">
          <h2>최근 문의 5건</h2>
          <p class="hint">이름을 누르면 문의함에서 자세히 볼 수 있습니다.</p>
          <table><thead><tr><th>받은 날짜</th><th>이름</th><th>희망 지점</th><th>연락처</th><th>상태</th></tr></thead>
          <tbody id="recent"><tr><td colspan="5" class="empty">불러오는 중…</td></tr></tbody></table>
        </div>""",
     """      (async function () {
        if (!(await Admin.guard("home"))) return;
        var cnt = async function (t, f) {
          var q = AF.client.from(t).select("id", { count: "exact", head: true });
          if (f) q = f(q);
          var r = await q; return r.count || 0;
        };
        document.getElementById("s-new").textContent    = await cnt("inquiries", function (q) { return q.eq("status", "new"); });
        document.getElementById("s-all").textContent    = await cnt("inquiries");
        document.getElementById("s-notice").textContent = await cnt("notices");
        document.getElementById("s-gal").textContent    = await cnt("gallery");

        var rows = await AF.list("inquiries", function (q) { return q.order("created_at", { ascending: false }).limit(5); });
        var tb = document.getElementById("recent");
        if (!rows.length) { tb.innerHTML = '<tr><td colspan="5" class="empty">아직 들어온 문의가 없습니다.</td></tr>'; return; }
        var BR = { songdo: "송도점", baegot: "배곧점" };
        var statusTag = function (st) {
          return st === "new" ? '<span class="tag new">신규</span>' : '<span class="tag done">연락완료</span>';
        };
        tb.innerHTML = rows.map(function (r) {
          return '<tr class="' + (r.status === "new" ? "unread" : "") + '">' +
            "<td>" + AF.fmtDate(r.created_at) + "</td>" +
            '<td><a href="inquiries.html#' + r.id + '"><b>' + AF.esc(r.name) + "</b></a></td>" +
            "<td>" + AF.esc(BR[r.branch_id] || r.branch_id || "") + "</td>" +
            '<td><a href="tel:' + AF.digits(r.phone) + '">' + AF.esc(r.phone) + "</a></td>" +
            "<td>" + statusTag(r.status) + "</td></tr>";
        }).join("");
      })();""")

# ============================================================ inquiries
page("inquiries.html", "문의함", "문의함",
     "홈페이지 체험·상담 신청이 여기로 들어옵니다. 연락을 마쳤으면 '연락완료'로 바꿔 두세요.",
     """        <div class="card">
          <div class="actions" style="margin-bottom:14px">
            <button class="btn btn-line btn-sm" data-f="all">전체</button>
            <button class="btn btn-line btn-sm" data-f="new">신규만</button>
            <button class="btn btn-line btn-sm" data-f="contacted">연락완료만</button>
          </div>
          <table><thead><tr><th>받은 날짜</th><th>이름</th><th>연령</th><th>지점</th><th>연락처</th><th>경험</th><th>프로그램</th><th>상태</th><th></th></tr></thead>
          <tbody id="rows"><tr><td colspan="9" class="empty">불러오는 중…</td></tr></tbody></table>
        </div>
        <div class="card" id="detail" hidden>
          <h2>문의 상세</h2>
          <p class="hint">메모는 클럽 내부용입니다. 홈페이지에는 보이지 않습니다.</p>
          <div id="d-body"></div>
        </div>""",
     """      (async function () {
        if (!(await Admin.guard("inquiries"))) return;
        var BR = { songdo: "송도점", baegot: "배곧점" };
        var PG = { hobby: "취미반", junior: "꿈나무반", athlete: "선수반", adult: "성인반" };
        var statusTag = function (st) {
          return st === "new" ? '<span class="tag new">신규</span>' : '<span class="tag done">연락완료</span>';
        };
        var all = [], filter = "all";

        async function load() {
          all = await AF.list("inquiries", function (q) { return q.order("created_at", { ascending: false }); });
          render();
          if (location.hash) open(location.hash.slice(1));
        }
        function render() {
          var rows = all.filter(function (r) { return filter === "all" || r.status === filter; });
          var tb = document.getElementById("rows");
          if (!rows.length) { tb.innerHTML = '<tr><td colspan="9" class="empty">해당하는 문의가 없습니다.</td></tr>'; return; }
          tb.innerHTML = rows.map(function (r) {
            return '<tr class="' + (r.status === "new" ? "unread" : "") + '">' +
              "<td>" + AF.fmtDate(r.created_at) + "</td>" +
              "<td><b>" + AF.esc(r.name) + "</b></td>" +
              "<td>" + AF.esc(r.age || "") + "</td>" +
              "<td>" + AF.esc(BR[r.branch_id] || "") + "</td>" +
              '<td><a href="tel:' + AF.digits(r.phone) + '">' + AF.esc(r.phone) + "</a></td>" +
              "<td>" + AF.esc(r.experience || "") + "</td>" +
              "<td>" + AF.esc(PG[r.program_id] || "") + "</td>" +
              "<td>" + statusTag(r.status) + "</td>" +
              '<td class="rt"><button class="btn btn-line btn-sm" data-open="' + r.id + '">열기</button></td></tr>';
          }).join("");
        }
        function open(id) {
          var r = all.filter(function (x) { return x.id === id; })[0];
          if (!r) return;
          var d = document.getElementById("detail");
          d.hidden = false;
          document.getElementById("d-body").innerHTML =
            '<div class="row">' +
            "<div><b>이름</b><br>" + AF.esc(r.name) + "</div>" +
            "<div><b>연령</b><br>" + AF.esc(r.age || "-") + "</div>" +
            "<div><b>희망 지점</b><br>" + AF.esc(BR[r.branch_id] || "-") + "</div>" +
            '<div><b>연락처</b><br><a href="tel:' + AF.digits(r.phone) + '">' + AF.esc(r.phone) + "</a></div>" +
            "<div><b>펜싱 경험 여부</b><br>" + AF.esc(r.experience || "-") + "</div>" +
            "<div><b>희망 프로그램</b><br>" + AF.esc(PG[r.program_id] || "-") + "</div>" +
            "</div>" +
            '<div class="field" style="margin-top:14px"><label>문의내용</label><div style="white-space:pre-wrap">' + (AF.esc(r.message) || "-") + "</div></div>" +
            '<div class="field"><label for="memo">메모 (내부용)</label><textarea id="memo">' + AF.esc(r.memo || "") + "</textarea></div>" +
            '<div class="actions">' +
            '<button class="btn btn-primary" id="d-save">메모 저장</button>' +
            '<button class="btn btn-line" id="d-status">' + (r.status === "new" ? "연락완료로 바꾸기" : "신규로 되돌리기") + "</button>" +
            '<button class="btn btn-danger" id="d-del">삭제</button>' +
            "</div>";
          d.scrollIntoView({ behavior: "smooth", block: "start" });

          document.getElementById("d-save").addEventListener("click", async function () {
            await Admin.save("inquiries", { id: r.id, memo: document.getElementById("memo").value }, { message: "메모를 저장했습니다." });
            r.memo = document.getElementById("memo").value;
          });
          document.getElementById("d-status").addEventListener("click", async function () {
            var next = r.status === "new" ? "contacted" : "new";
            await Admin.save("inquiries", { id: r.id, status: next }, { message: "상태를 바꿨습니다." });
            r.status = next; render(); open(r.id); Admin.refreshBadge();
          });
          document.getElementById("d-del").addEventListener("click", async function () {
            if (await Admin.remove("inquiries", r.id, AF.esc(r.name) + " 님의 문의")) {
              d.hidden = true; await load(); Admin.refreshBadge();
            }
          });
        }
        document.addEventListener("click", function (e) {
          var b = e.target.closest("[data-open]"); if (b) open(b.dataset.open);
          var f = e.target.closest("[data-f]"); if (f) { filter = f.dataset.f; render(); }
        });
        load();
      })();""")

# ============================================================ notices
page("notices.html", "공지사항", "공지사항",
     "홈페이지 메인과 공지 목록에 표시됩니다. '상단 고정'을 켜면 목록 맨 위에 붙습니다.",
     """        <div class="card">
          <h2 id="form-title">새 공지 작성</h2>
          <p class="hint">제목만 넣어도 등록됩니다. 사진은 한 장까지 올릴 수 있습니다.</p>
          <form id="f">
            <input type="hidden" id="id">
            <div class="field"><label for="title">제목</label><input id="title" type="text" required></div>
            <div class="field"><label for="body">내용</label><textarea id="body"></textarea>
              <div class="hint">줄바꿈은 그대로 표시됩니다.</div></div>
            <div class="field"><label for="img">사진</label><input id="img" type="file" accept="image/*">
              <div class="hint">올리면 자동으로 가로 1600px로 줄여 저장합니다.</div>
              <div id="preview" style="margin-top:8px"></div></div>
            <div class="field"><label class="check"><input id="pinned" type="checkbox"> 상단 고정</label></div>
            <div class="actions">
              <button class="btn btn-primary" type="submit" id="go">등록</button>
              <button class="btn btn-line" type="button" id="reset" hidden>새로 작성</button>
            </div>
          </form>
        </div>
        <div class="card">
          <h2>등록된 공지</h2>
          <table><thead><tr><th>날짜</th><th>제목</th><th>고정</th><th></th></tr></thead>
          <tbody id="rows"><tr><td colspan="4" class="empty">불러오는 중…</td></tr></tbody></table>
        </div>""",
     """      (async function () {
        if (!(await Admin.guard("notices"))) return;
        var f = document.getElementById("f"), rows = document.getElementById("rows");
        var imageUrl = null;

        document.getElementById("img").addEventListener("change", async function (e) {
          var file = e.target.files[0]; if (!file) return;
          Admin.toast("사진을 올리는 중입니다…");
          try {
            imageUrl = await AF.upload("notices", file);
            document.getElementById("preview").innerHTML = '<img class="thumb" src="' + imageUrl + '">';
            Admin.toast("사진을 올렸습니다.");
          } catch (ex) { Admin.toast("사진을 올리지 못했습니다.", true); }
        });

        function reset() {
          f.reset(); document.getElementById("id").value = ""; imageUrl = null;
          document.getElementById("preview").innerHTML = "";
          document.getElementById("form-title").textContent = "새 공지 작성";
          document.getElementById("go").textContent = "등록";
          document.getElementById("reset").hidden = true;
        }
        document.getElementById("reset").addEventListener("click", reset);

        f.addEventListener("submit", async function (e) {
          e.preventDefault();
          var row = {
            title: document.getElementById("title").value.trim(),
            body: document.getElementById("body").value,
            pinned: document.getElementById("pinned").checked
          };
          if (imageUrl) row.image_url = imageUrl;
          var id = document.getElementById("id").value;
          if (id) row.id = id;
          await Admin.save("notices", row);
          reset(); load();
        });

        async function load() {
          var list = await AF.list("notices", function (q) {
            return q.order("pinned", { ascending: false }).order("created_at", { ascending: false });
          });
          if (!list.length) { rows.innerHTML = '<tr><td colspan="4" class="empty">등록된 공지가 없습니다.</td></tr>'; return; }
          rows.innerHTML = list.map(function (n) {
            return "<tr><td>" + AF.fmtDate(n.created_at) + "</td>" +
              "<td>" + (n.image_url ? '<img class="thumb" src="' + n.image_url + '" style="float:left;margin-right:10px">' : "") + AF.esc(n.title) + "</td>" +
              "<td>" + (n.pinned ? "고정" : "") + "</td>" +
              '<td class="rt"><button class="btn btn-line btn-sm" data-edit="' + n.id + '">수정</button> ' +
              '<button class="btn btn-danger btn-sm" data-del="' + n.id + '">삭제</button></td></tr>';
          }).join("");
          window._notices = list;
        }
        document.addEventListener("click", async function (e) {
          var ed = e.target.closest("[data-edit]");
          if (ed) {
            var n = window._notices.filter(function (x) { return x.id === ed.dataset.edit; })[0];
            document.getElementById("id").value = n.id;
            document.getElementById("title").value = n.title || "";
            document.getElementById("body").value = n.body || "";
            document.getElementById("pinned").checked = !!n.pinned;
            imageUrl = n.image_url || null;
            document.getElementById("preview").innerHTML = n.image_url ? '<img class="thumb" src="' + n.image_url + '">' : "";
            document.getElementById("form-title").textContent = "공지 수정";
            document.getElementById("go").textContent = "수정 저장";
            document.getElementById("reset").hidden = false;
            f.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          var dl = e.target.closest("[data-del]");
          if (dl && await Admin.remove("notices", dl.dataset.del, "이 공지")) load();
        });
        load();
      })();""")

# ============================================================ programs
page("programs.html", "프로그램", "프로그램",
     "홈페이지 프로그램 페이지의 4개 반 내용입니다. 반은 추가·삭제하지 않고 내용만 고칩니다.",
     """        <div id="list"><div class="empty">불러오는 중…</div></div>""",
     """      (async function () {
        if (!(await Admin.guard("programs"))) return;
        var list = await AF.list("programs", function (q) { return q.order("sort"); });
        var box = document.getElementById("list");
        if (!list.length) { box.innerHTML = '<div class="card"><div class="empty">프로그램이 없습니다. supabase/seed.sql 을 먼저 실행하세요.</div></div>'; return; }
        box.innerHTML = list.map(function (p) {
          return '<div class="card" data-p="' + p.id + '">' +
            "<h2>" + AF.esc(p.name) + "</h2>" +
            '<p class="hint">대상 · 수업 특징 · 수업시간 순으로 홈페이지에 표시됩니다.</p>' +
            '<div class="field"><label>대상</label><textarea data-k="target" style="min-height:64px">' + AF.esc(p.target) + "</textarea></div>" +
            '<div class="field"><label>수업 특징</label><textarea data-k="features">' + AF.esc(p.features) + "</textarea></div>" +
            '<div class="field"><label>수업시간</label><textarea data-k="class_time" style="min-height:64px">' + AF.esc(p.class_time) + "</textarea>" +
            '<div class="hint">한 줄에 하나씩 적으면 홈페이지에서도 줄이 나뉩니다.</div></div>' +
            '<div class="actions"><button class="btn btn-primary" data-save="' + p.id + '">저장</button></div></div>';
        }).join("");
        box.addEventListener("click", async function (e) {
          var b = e.target.closest("[data-save]"); if (!b) return;
          var card = b.closest("[data-p]"), row = { id: card.dataset.p };
          card.querySelectorAll("[data-k]").forEach(function (el) { row[el.dataset.k] = el.value; });
          await Admin.save("programs", row);
        });
      })();""")

# ============================================================ schedules
page("schedules.html", "시간표", "시간표",
     "지점별 수업 시간표입니다. 요일과 반은 여러 개를 함께 고를 수 있습니다.",
     '        <div class="card">\n          <div class="actions" style="margin-bottom:12px">\n            <button class="btn btn-line btn-sm" data-b="songdo">송도점</button>\n            <button class="btn btn-line btn-sm" data-b="baegot">배곧점</button>\n            <span style="flex:1"></span>\n            <button class="btn btn-primary btn-sm" id="add">줄 추가</button>\n          </div>\n          <p class="hint" style="margin:0 0 12px">\n            요일과 반은 여러 개를 함께 고를 수 있습니다.\n            (예: 월·수·금 16:00~17:00 에 취미반 + 꿈나무반)\n          </p>\n          <div style="overflow-x:auto">\n            <table>\n              <thead><tr>\n                <th style="min-width:210px">요일</th>\n                <th style="min-width:170px">시간</th>\n                <th style="min-width:230px">반</th>\n                <th style="min-width:140px">비고</th>\n                <th style="width:72px">순서</th>\n                <th style="width:70px"></th>\n              </tr></thead>\n              <tbody id="rows"></tbody>\n            </table>\n          </div>\n          <div class="actions" style="margin-top:14px">\n            <button class="btn btn-primary" id="save">전체 저장</button>\n          </div>\n        </div>',
     '      (async function () {\n        if (!(await Admin.guard("schedules"))) return;\n        var DAYS = ["월", "화", "수", "목", "금", "토", "일"];\n        var branch = "songdo", progs = [], rows = [];\n        progs = await AF.list("programs", function (q) { return q.order("sort"); });\n\n        function chips(name, list, chosen, key) {\n          return \'<div class="chips">\' + list.map(function (o) {\n            var v = o.v === undefined ? o : o.v;\n            var t = o.t === undefined ? o : o.t;\n            var on = (chosen || []).indexOf(v) >= 0;\n            return \'<label class="chip"><input type="checkbox" data-\' + key + \'="\' + AF.esc(v) + \'"\' +\n              (on ? " checked" : "") + "> " + AF.esc(t) + "</label>";\n          }).join("") + "</div>";\n        }\n\n        function draw() {\n          document.querySelectorAll("[data-b]").forEach(function (b) {\n            b.classList.toggle("btn-primary", b.dataset.b === branch);\n            b.classList.toggle("btn-line", b.dataset.b !== branch);\n          });\n          var tb = document.getElementById("rows");\n          if (!rows.length) {\n            tb.innerHTML = \'<tr><td colspan="6" class="empty">등록된 시간표가 없습니다. \\\'줄 추가\\\'를 눌러 입력하세요.</td></tr>\';\n            return;\n          }\n          tb.innerHTML = rows.map(function (r, i) {\n            return \'<tr data-i="\' + i + \'">\' +\n              "<td>" + chips("days", DAYS, r.days || [], "day") + "</td>" +\n              \'<td><div class="time-pair">\' +\n                \'<input data-k="start_time" type="time" step="60" value="\' + AF.esc(r.start_time || "") + \'">\' +\n                "<span>~</span>" +\n                \'<input data-k="end_time" type="time" step="60" value="\' + AF.esc(r.end_time || "") + \'">\' +\n              "</div></td>" +\n              "<td>" + chips("progs", progs.map(function (p) { return { v: p.id, t: p.name }; }), r.program_ids || [], "prog") + "</td>" +\n              \'<td><input data-k="note" type="text" value="\' + AF.esc(r.note || "") + \'"></td>\' +\n              \'<td><input data-k="sort" type="text" inputmode="numeric" value="\' + (r.sort || 0) + \'"></td>\' +\n              \'<td class="rt"><button class="btn btn-danger btn-sm" data-del="\' + i + \'">삭제</button></td></tr>\';\n          }).join("");\n        }\n\n        async function load() {\n          rows = await AF.list("schedules", function (q) {\n            return q.eq("branch_id", branch).order("sort");\n          });\n          draw();\n        }\n\n        function collect() {\n          document.querySelectorAll("#rows tr[data-i]").forEach(function (tr) {\n            var r = rows[+tr.dataset.i];\n            if (!r) return;\n            tr.querySelectorAll("[data-k]").forEach(function (el) {\n              r[el.dataset.k] = el.dataset.k === "sort" ? (parseInt(el.value, 10) || 0) : el.value;\n            });\n            r.days = Array.prototype.map.call(\n              tr.querySelectorAll("[data-day]:checked"), function (el) { return el.dataset.day; });\n            r.program_ids = Array.prototype.map.call(\n              tr.querySelectorAll("[data-prog]:checked"), function (el) { return el.dataset.prog; });\n          });\n        }\n\n        document.addEventListener("click", async function (e) {\n          var b = e.target.closest("[data-b]");\n          if (b) { collect(); branch = b.dataset.b; await load(); return; }\n\n          if (e.target.id === "add") {\n            collect();\n            rows.push({\n              branch_id: branch, days: [], program_ids: [],\n              start_time: "", end_time: "", note: "", sort: rows.length\n            });\n            draw();\n            return;\n          }\n\n          var d = e.target.closest("[data-del]");\n          if (d) {\n            var i = +d.dataset.del, r = rows[i];\n            if (r.id && !(await Admin.remove("schedules", r.id, "이 줄"))) return;\n            collect();\n            rows.splice(i, 1);\n            draw();\n            return;\n          }\n\n          if (e.target.id === "save") {\n            collect();\n            var bad = rows.filter(function (r) { return !r.start_time || !r.end_time; });\n            if (bad.length) { Admin.toast("시작·종료 시각이 비어 있는 줄이 있습니다.", true); return; }\n            var noDay = rows.filter(function (r) { return !r.days.length; });\n            if (noDay.length) { Admin.toast("요일을 고르지 않은 줄이 있습니다.", true); return; }\n\n            for (var i = 0; i < rows.length; i++) {\n              var r = rows[i];\n              r.branch_id = branch;\n              /* 예전 단일 컬럼도 함께 채워 두어 이전 데이터와 섞여도 깨지지 않게 한다 */\n              r.day = r.days[0] || null;\n              r.program_id = null;\n              r.time_range = r.start_time + "-" + r.end_time;\n              await Admin.save("schedules", r, { message: "" });\n            }\n            Admin.toast("시간표를 저장했습니다.");\n            load();\n          }\n        });\n\n        load();\n      })();')

# ============================================================ coaches
page("coaches.html", "지도자", "지도자",
     "강사진 페이지에 표시됩니다. 각 항목은 한 줄에 하나씩 적으면 홈페이지에서 목록으로 나옵니다.",
     """        <div class="actions" style="margin-bottom:14px"><button class="btn btn-primary" id="add">지도자 추가</button></div>
        <div id="list"><div class="empty">불러오는 중…</div></div>""",
     """      (async function () {
        if (!(await Admin.guard("coaches"))) return;
        var FIELDS = [
          ["education", "학력"], ["career", "선수경력"], ["certificates", "자격증"],
          ["coaching", "지도경력"], ["awards", "수상내역"]
        ];
        var box = document.getElementById("list");

        async function load() {
          var list = await AF.list("coaches", function (q) { return q.order("sort"); });
          if (!list.length) { box.innerHTML = '<div class="card"><div class="empty">등록된 지도자가 없습니다.</div></div>'; return; }
          box.innerHTML = list.map(function (c) {
            return '<div class="card" data-c="' + c.id + '">' +
              '<div class="row">' +
              '<div class="field"><label>이름</label><input data-k="name" type="text" value="' + AF.esc(c.name) + '"></div>' +
              '<div class="field"><label>직책</label><input data-k="title" type="text" value="' + AF.esc(c.title || "") + '"></div>' +
              '<div class="field"><label>표시 순서</label><input data-k="sort" type="text" inputmode="numeric" value="' + (c.sort || 0) + '"></div>' +
              "</div>" +
              '<div class="field"><label>사진</label>' +
              (c.photo_url ? '<img class="thumb" style="width:90px;height:118px;margin-bottom:8px" src="' + c.photo_url + '">' : '<div class="hint" style="margin-bottom:8px">사진이 없으면 홈페이지에는 이름 이니셜이 표시됩니다.</div>') +
              '<input type="file" accept="image/*" data-photo="' + c.id + '"></div>' +
              FIELDS.map(function (f) {
                return '<div class="field"><label>' + f[1] + "</label><textarea data-k=\\"" + f[0] + "\\">" + AF.esc(c[f[0]] || "") + "</textarea>" +
                       '<div class="hint">한 줄에 하나씩 적어 주세요.</div></div>';
              }).join("") +
              '<div class="actions"><button class="btn btn-primary" data-save="' + c.id + '">저장</button>' +
              '<button class="btn btn-danger" data-del="' + c.id + '">삭제</button></div></div>';
          }).join("");
          window._coaches = list;
        }

        document.getElementById("add").addEventListener("click", async function () {
          await Admin.save("coaches", { name: "새 지도자", sort: 99 }, { message: "추가했습니다. 내용을 채워 주세요." });
          load();
        });
        box.addEventListener("change", async function (e) {
          var p = e.target.closest("[data-photo]"); if (!p || !p.files[0]) return;
          Admin.toast("사진을 올리는 중입니다…");
          try {
            var url = await AF.upload("coaches", p.files[0]);
            await Admin.save("coaches", { id: p.dataset.photo, photo_url: url }, { message: "사진을 저장했습니다." });
            load();
          } catch (ex) { Admin.toast("사진을 올리지 못했습니다.", true); }
        });
        box.addEventListener("click", async function (e) {
          var s = e.target.closest("[data-save]");
          if (s) {
            var card = e.target.closest("[data-c]"), row = { id: card.dataset.c };
            card.querySelectorAll("[data-k]").forEach(function (el) {
              row[el.dataset.k] = el.dataset.k === "sort" ? (parseInt(el.value, 10) || 0) : el.value;
            });
            await Admin.save("coaches", row); return;
          }
          var d = e.target.closest("[data-del]");
          if (d) {
            var c = window._coaches.filter(function (x) { return x.id === d.dataset.del; })[0];
            if (await Admin.remove("coaches", d.dataset.del, AF.esc(c.name) + " 지도자")) {
              if (c.photo_url) AF.removeImage(c.photo_url);
              load();
            }
          }
        });
        load();
      })();""")

# ============================================================ gallery
page("gallery.html", "갤러리", "갤러리",
     "학원소개 페이지의 시설 사진입니다. 지점을 고르고 사진을 올리면 바로 홈페이지에 표시됩니다.",
     """        <div class="card">
          <div class="actions" style="margin-bottom:12px">
            <button class="btn btn-line btn-sm" data-b="songdo">송도점</button>
            <button class="btn btn-line btn-sm" data-b="baegot">배곧점</button>
          </div>
          <div class="field">
            <label for="up">사진 올리기</label>
            <input id="up" type="file" accept="image/*" multiple>
            <div class="hint">여러 장을 한 번에 고를 수 있습니다. 가로 1600px로 자동으로 줄여 저장합니다.</div>
          </div>
        </div>
        <div class="card">
          <h2>등록된 사진</h2>
          <p class="hint">숫자가 작을수록 앞에 나옵니다. 숫자를 바꾸면 자동으로 저장됩니다.</p>
          <div class="gal-grid" id="grid"></div>
        </div>""",
     """      (async function () {
        if (!(await Admin.guard("gallery"))) return;
        var branch = "baegot";
        async function load() {
          document.querySelectorAll("[data-b]").forEach(function (b) {
            b.classList.toggle("btn-primary", b.dataset.b === branch);
            b.classList.toggle("btn-line", b.dataset.b !== branch);
          });
          var list = await AF.list("gallery", function (q) { return q.eq("branch_id", branch).order("sort"); });
          var g = document.getElementById("grid");
          if (!list.length) { g.innerHTML = '<div class="empty">등록된 사진이 없습니다.</div>'; return; }
          g.innerHTML = list.map(function (r) {
            return '<div class="gal-item" data-g="' + r.id + '"><img src="' + r.image_url + '" alt="">' +
              '<div class="bar"><input type="text" inputmode="numeric" value="' + (r.sort || 0) + '" data-sort="' + r.id + '">' +
              '<button class="btn btn-danger btn-sm" data-del="' + r.id + '">삭제</button></div></div>';
          }).join("");
          window._gal = list;
        }
        document.addEventListener("click", async function (e) {
          var b = e.target.closest("[data-b]"); if (b) { branch = b.dataset.b; load(); return; }
          var d = e.target.closest("[data-del]");
          if (d) {
            var r = window._gal.filter(function (x) { return x.id === d.dataset.del; })[0];
            if (await Admin.remove("gallery", d.dataset.del, "이 사진")) { AF.removeImage(r.image_url); load(); }
          }
        });
        document.addEventListener("change", async function (e) {
          var s = e.target.closest("[data-sort]");
          if (s) { await Admin.save("gallery", { id: s.dataset.sort, sort: parseInt(s.value, 10) || 0 }, { message: "순서를 바꿨습니다." }); load(); }
        });
        document.getElementById("up").addEventListener("change", async function (e) {
          var files = Array.prototype.slice.call(e.target.files); if (!files.length) return;
          Admin.toast(files.length + "장을 올리는 중입니다…");
          try {
            for (var i = 0; i < files.length; i++) {
              var url = await AF.upload("gallery", files[i]);
              await Admin.save("gallery", { branch_id: branch, image_url: url, sort: 90 + i }, { message: "" });
            }
            Admin.toast("사진을 올렸습니다."); e.target.value = ""; load();
          } catch (ex) { Admin.toast("사진을 올리지 못했습니다.", true); }
        });
        load();
      })();""")

# ============================================================ branches
page("branches.html", "지점 정보", "지점 정보",
     "오시는 길과 푸터에 표시되는 정보입니다. 전화번호나 주소가 바뀌면 여기서 고치세요.",
     """        <div id="list"><div class="empty">불러오는 중…</div></div>""",
     """      (async function () {
        if (!(await Admin.guard("branches"))) return;
        var F = [
          ["name", "지점 이름", "예: 송도점"],
          ["address", "주소", "홈페이지에서 누르면 네이버 지도로 연결됩니다."],
          ["phone", "대표 연락처", "누르면 바로 전화가 걸립니다."],
          ["parking", "주차 안내", "예: 무료주차2시간"],
          ["instagram", "인스타그램 아이디", "@ 없이 아이디만 적어 주세요."],
          ["naver_map_url", "네이버 지도 주소", "비워 두면 주소로 검색합니다."],
          ["kakao_url", "카카오톡 채널 주소", "카카오톡 문의 버튼이 연결될 주소입니다."]
        ];
        var list = await AF.list("branches", function (q) { return q.order("sort"); });
        var box = document.getElementById("list");
        if (!list.length) { box.innerHTML = '<div class="card"><div class="empty">지점 정보가 없습니다. supabase/seed.sql 을 먼저 실행하세요.</div></div>'; return; }
        box.innerHTML = list.map(function (b) {
          return '<div class="card" data-b="' + b.id + '"><h2>' + AF.esc(b.name) + "</h2>" +
            F.map(function (f) {
              return '<div class="field"><label>' + f[1] + "</label>" +
                '<input data-k="' + f[0] + '" type="text" value="' + AF.esc(b[f[0]] || "") + '">' +
                '<div class="hint">' + f[2] + "</div></div>";
            }).join("") +
            '<div class="actions"><button class="btn btn-primary" data-save="' + b.id + '">저장</button></div></div>';
        }).join("");
        box.addEventListener("click", async function (e) {
          var s = e.target.closest("[data-save]"); if (!s) return;
          var card = e.target.closest("[data-b]"), row = { id: card.dataset.b };
          card.querySelectorAll("[data-k]").forEach(function (el) { row[el.dataset.k] = el.value.trim(); });
          await Admin.save("branches", row);
        });
      })();""")

# ============================================================ athletes
page("athletes.html", "선수단", "선수단",
     "홈페이지 선수단 페이지에 표시됩니다. 학년과 성별로 나뉘어 자동으로 정렬됩니다.",
     '        <div class="card">\n          <h2 id="form-title">선수 추가</h2>\n          <p class="hint">이름·학년·성별만 넣어도 등록됩니다. 사진과 수상이력은 나중에 채워도 됩니다.</p>\n          <form id="f">\n            <input type="hidden" id="id">\n            <div class="row">\n              <div class="field"><label for="name">이름</label><input id="name" type="text" required></div>\n              <div class="field"><label for="grade">학년</label>\n                <select id="grade">\n                  <option value="grade-1-2">1,2학년</option>\n                  <option value="grade-3-4">3,4학년</option>\n                  <option value="grade-5-6">5,6학년</option>\n                  <option value="grade-middle-adult">중,고,성인</option>\n                </select></div>\n              <div class="field"><label for="gender">성별</label>\n                <select id="gender"><option value="male">남자 선수</option><option value="female">여자 선수</option></select></div>\n              <div class="field"><label for="sort">표시 순서</label><input id="sort" type="text" inputmode="numeric" value="0">\n                <div class="hint">숫자가 작을수록 앞에 나옵니다.</div></div>\n            </div>\n            <div class="field"><label for="intro">자기 소개</label><textarea id="intro" style="min-height:70px"></textarea></div>\n            <div class="field"><label for="awards">수상이력</label><textarea id="awards"></textarea>\n              <div class="hint">한 줄에 하나씩 적어 주세요.</div></div>\n            <div class="field"><label for="img">사진</label><input id="img" type="file" accept="image/*">\n              <div class="hint">올리면 자동으로 가로 1600px로 줄여 저장합니다.</div>\n              <div id="preview" style="margin-top:8px"></div></div>\n            <div class="actions">\n              <button class="btn btn-primary" type="submit" id="go">등록</button>\n              <button class="btn btn-line" type="button" id="reset" hidden>새로 작성</button>\n            </div>\n          </form>\n        </div>\n        <div id="list"><div class="empty">불러오는 중…</div></div>',
     '      (async function () {\n        if (!(await Admin.guard("athletes"))) return;\n        var GRADES = [["grade-1-2", "1,2학년"], ["grade-3-4", "3,4학년"],\n                      ["grade-5-6", "5,6학년"], ["grade-middle-adult", "중,고,성인"]];\n        var GENDERS = [["male", "남자 선수"], ["female", "여자 선수"]];\n\n        var f = document.getElementById("f"), box = document.getElementById("list");\n        var photoUrl = null, rows = [];\n\n        var setPreview = function (url) {\n          document.getElementById("preview").innerHTML =\n            url ? \'<img class="thumb" style="width:80px;height:104px" src="\' + url + \'">\' : "";\n        };\n\n        document.getElementById("img").addEventListener("change", async function (e) {\n          var file = e.target.files[0];\n          if (!file) return;\n          Admin.toast("사진을 올리는 중입니다…");\n          try {\n            photoUrl = await AF.upload("athletes", file);\n            setPreview(photoUrl);\n            Admin.toast("사진을 올렸습니다.");\n          } catch (ex) {\n            Admin.toast("사진을 올리지 못했습니다.", true);\n          }\n        });\n\n        function reset() {\n          f.reset();\n          document.getElementById("id").value = "";\n          document.getElementById("sort").value = "0";\n          photoUrl = null;\n          setPreview(null);\n          document.getElementById("form-title").textContent = "선수 추가";\n          document.getElementById("go").textContent = "등록";\n          document.getElementById("reset").hidden = true;\n        }\n        document.getElementById("reset").addEventListener("click", reset);\n\n        f.addEventListener("submit", async function (e) {\n          e.preventDefault();\n          var row = {\n            name: document.getElementById("name").value.trim(),\n            grade: document.getElementById("grade").value,\n            gender: document.getElementById("gender").value,\n            intro: document.getElementById("intro").value,\n            awards: document.getElementById("awards").value,\n            sort: parseInt(document.getElementById("sort").value, 10) || 0\n          };\n          if (!row.name) { document.getElementById("name").focus(); return; }\n          if (photoUrl) row.photo_url = photoUrl;\n          var id = document.getElementById("id").value;\n          if (id) row.id = id;\n          await Admin.save("athletes", row);\n          reset();\n          load();\n        });\n\n        function rowHtml(r) {\n          var thumb = r.photo_url ? \'<img class="thumb" src="\' + r.photo_url + \'">\' : "";\n          return "<tr>" +\n            \'<td style="width:74px">\' + thumb + "</td>" +\n            "<td><b>" + AF.esc(r.name) + "</b><br>" +\n            \'<span style="color:#5b6472;font-size:13px">\' + AF.esc(r.intro || "") + "</span></td>" +\n            \'<td style="width:60px">\' + (r.sort || 0) + "</td>" +\n            \'<td class="rt">\' +\n            \'<button class="btn btn-line btn-sm" data-edit="\' + r.id + \'">수정</button> \' +\n            \'<button class="btn btn-danger btn-sm" data-del="\' + r.id + \'">삭제</button>\' +\n            "</td></tr>";\n        }\n\n        async function load() {\n          rows = await AF.list("athletes", function (q) { return q.order("sort"); });\n          if (!rows.length) {\n            box.innerHTML = \'<div class="card"><div class="empty">등록된 선수가 없습니다. 위에서 추가해 주세요.</div></div>\';\n            return;\n          }\n          box.innerHTML = GRADES.map(function (g) {\n            var inGrade = rows.filter(function (r) { return r.grade === g[0]; });\n            if (!inGrade.length) return "";\n            var body = GENDERS.map(function (s) {\n              var list = inGrade.filter(function (r) { return r.gender === s[0]; });\n              if (!list.length) return "";\n              return \'<p class="hint" style="margin:14px 0 6px"><b>\' + s[1] + "</b></p>" +\n                "<table><tbody>" + list.map(rowHtml).join("") + "</tbody></table>";\n            }).join("");\n            return \'<div class="card"><h2>\' + g[1] + "</h2>" + body + "</div>";\n          }).join("");\n        }\n\n        document.addEventListener("click", async function (e) {\n          var ed = e.target.closest("[data-edit]");\n          if (ed) {\n            var r = rows.filter(function (x) { return x.id === ed.dataset.edit; })[0];\n            if (!r) return;\n            document.getElementById("id").value = r.id;\n            document.getElementById("name").value = r.name || "";\n            document.getElementById("grade").value = r.grade;\n            document.getElementById("gender").value = r.gender;\n            document.getElementById("intro").value = r.intro || "";\n            document.getElementById("awards").value = r.awards || "";\n            document.getElementById("sort").value = r.sort || 0;\n            photoUrl = r.photo_url || null;\n            setPreview(photoUrl);\n            document.getElementById("form-title").textContent = "선수 수정";\n            document.getElementById("go").textContent = "수정 저장";\n            document.getElementById("reset").hidden = false;\n            f.scrollIntoView({ behavior: "smooth", block: "center" });\n            return;\n          }\n          var dl = e.target.closest("[data-del]");\n          if (dl) {\n            var a = rows.filter(function (x) { return x.id === dl.dataset.del; })[0];\n            if (!a) return;\n            if (await Admin.remove("athletes", dl.dataset.del, AF.esc(a.name) + " 선수")) {\n              if (a.photo_url) AF.removeImage(a.photo_url);\n              load();\n            }\n          }\n        });\n\n        load();\n      })();')

print("done.")
