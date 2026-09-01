/* ============================================================
   관리자 공통 — 셸(상단바/사이드), 로그인 가드, 저장/삭제 헬퍼
   각 admin/*.html 은 이 파일을 부르고 자기 화면 로직만 작성합니다.
   ============================================================ */
window.Admin = (function () {
  "use strict";

  var MENU = [
    { href: "index.html",     label: "대시보드",   key: "home" },
    { href: "inquiries.html", label: "문의함",     key: "inquiries", badge: true },
    { href: "notices.html",   label: "공지사항",   key: "notices" },
    { href: "programs.html",  label: "프로그램",   key: "programs" },
    { href: "schedules.html", label: "시간표",     key: "schedules" },
    { href: "coaches.html",   label: "지도자",     key: "coaches" },
    { href: "gallery.html",   label: "갤러리",     key: "gallery" },
    { href: "branches.html",  label: "지점 정보",  key: "branches" }
  ];

  /* ---------- 알림 ---------- */
  var toastEl;
  function toast(msg, isErr) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = "toast on" + (isErr ? " err" : "");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.className = "toast"; }, 2600);
  }

  /* ---------- 셸 ---------- */
  function shell(activeKey) {
    var top = document.createElement("header");
    top.className = "a-top";
    top.innerHTML =
      '<b>ANTAEAN 관리자</b><span class="sp"></span>' +
      '<a class="site" href="../index.html" target="_blank" rel="noopener">홈페이지 보기 ↗</a>' +
      '<button type="button" id="a-logout">로그아웃</button>';
    document.body.prepend(top);

    var side = document.querySelector(".a-side");
    if (side) {
      side.innerHTML = MENU.map(function (m) {
        return '<a href="' + m.href + '" class="' + (m.key === activeKey ? "on" : "") + '">' +
               '<span>' + m.label + '</span>' +
               (m.badge ? '<span class="badge" id="a-newcount" hidden>0</span>' : "") +
               "</a>";
      }).join("");
    }

    document.getElementById("a-logout").addEventListener("click", async function () {
      await AF.signOut();
      location.href = "login.html";
    });
  }

  /* ---------- 로그인 가드 ---------- */
  async function guard(activeKey) {
    if (!AF.ready) {
      document.body.innerHTML =
        '<div class="a-wrap"><div class="a-main"><div class="banner">' +
        "<b>Supabase 연결 정보가 아직 없습니다.</b>" +
        "<code>assets/js/config.js</code> 파일에 Project URL 과 anon 키를 넣어 주세요. " +
        "설정 전까지 관리자 화면은 동작하지 않습니다." +
        "</div></div></div>";
      return null;
    }
    var s = await AF.session();
    if (!s) { location.replace("login.html"); return null; }
    shell(activeKey);
    refreshBadge();
    return s;
  }

  async function refreshBadge() {
    var el = document.getElementById("a-newcount");
    if (!el || !AF.client) return;
    var res = await AF.client.from("inquiries")
      .select("id", { count: "exact", head: true }).eq("status", "new");
    if (res.count) { el.textContent = res.count; el.hidden = false; }
  }

  /* ---------- 저장 / 삭제 ---------- */
  async function save(table, row, opts) {
    opts = opts || {};
    var q = AF.client.from(table);
    var res = row.id ? await q.update(row).eq("id", row.id).select()
                     : await q.insert(row).select();
    if (res.error) { toast("저장하지 못했습니다. " + res.error.message, true); throw res.error; }
    toast(opts.message || "저장했습니다.");
    return res.data && res.data[0];
  }

  async function upsert(table, row, opts) {
    opts = opts || {};
    var res = await AF.client.from(table).upsert(row).select();
    if (res.error) { toast("저장하지 못했습니다. " + res.error.message, true); throw res.error; }
    toast(opts.message || "저장했습니다.");
    return res.data && res.data[0];
  }

  /** 삭제는 언제나 확인을 받는다. */
  async function remove(table, id, what) {
    if (!window.confirm((what || "이 항목") + "을(를) 삭제할까요?\n삭제하면 되돌릴 수 없습니다.")) return false;
    var res = await AF.client.from(table).delete().eq("id", id);
    if (res.error) { toast("삭제하지 못했습니다. " + res.error.message, true); return false; }
    toast("삭제했습니다.");
    return true;
  }

  /** 저장 버튼을 눌린 동안 잠그고 다시 푼다. */
  function busy(btn, fn) {
    return async function (e) {
      if (e) e.preventDefault();
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "처리 중…";
      try { await fn(e); }
      catch (err) { console.error(err); }
      finally { btn.disabled = false; btn.textContent = label; }
    };
  }

  return {
    guard: guard, shell: shell, toast: toast,
    save: save, upsert: upsert, remove: remove, busy: busy,
    refreshBadge: refreshBadge
  };
})();
