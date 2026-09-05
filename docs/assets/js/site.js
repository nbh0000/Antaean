/* ANTAEAN FENCING CLUB — site behaviour */
(function () {
  "use strict";

  var hdr = document.querySelector("[data-hdr]");
  var body = document.body;

  /* ---------- header: transparent -> solid on scroll ---------- */
  if (hdr) {
    var solidFrom = hdr.hasAttribute("data-hdr-solid") ? -1 : 80;
    var onScroll = function () {
      if (solidFrom < 0 || window.scrollY > solidFrom) hdr.classList.add("is-solid");
      else hdr.classList.remove("is-solid");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- desktop dropdown (one panel per menu item) ---------- */
  var items = document.querySelectorAll("[data-nav-item]");
  var closeTimer = null;

  var closeAll = function (except) {
    items.forEach(function (it) {
      if (it !== except) it.classList.remove("is-open");
    });
    if (hdr && !document.querySelector("[data-nav-item].is-open")) {
      hdr.classList.remove("is-open");
    }
  };
  var open = function (it) {
    window.clearTimeout(closeTimer);
    closeAll(it);
    it.classList.add("is-open");
    if (hdr) hdr.classList.add("is-open");
  };
  var scheduleClose = function () {
    closeTimer = window.setTimeout(function () { closeAll(null); }, 140);
  };

  items.forEach(function (it) {
    it.addEventListener("mouseenter", function () { open(it); });
    it.addEventListener("mouseleave", scheduleClose);
    it.addEventListener("focusin", function () { open(it); });
    it.addEventListener("focusout", function () {
      window.requestAnimationFrame(function () {
        if (!it.contains(document.activeElement)) scheduleClose();
      });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeAll(null);
    body.classList.remove("mnav-open");
    var b = document.querySelector("[data-burger]");
    if (b) b.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("click", function (e) {
    if (e.target instanceof Element && !e.target.closest("[data-nav-item]")) closeAll(null);
  });

  /* ---------- mobile overlay + accordion ---------- */
  var burger = document.querySelector("[data-burger]");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = body.classList.toggle("mnav-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
  }
  document.querySelectorAll("[data-mnav-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest("[data-mnav-group]");
      if (!group) return;
      var willOpen = !group.classList.contains("is-open");
      document.querySelectorAll("[data-mnav-group].is-open").forEach(function (g) {
        g.classList.remove("is-open");
        var b = g.querySelector("[data-mnav-top]");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      group.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });
  document.querySelectorAll(".mnav a").forEach(function (a) {
    a.addEventListener("click", function () {
      body.classList.remove("mnav-open");
      if (burger) burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var btns = group.querySelectorAll("[data-tab]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.tab;
        btns.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
        group.querySelectorAll("[data-tabpanel]").forEach(function (p) {
          p.hidden = p.dataset.tabpanel !== key;
        });
      });
    });
  });

  /* ---------- open the tab named by the URL hash ---------- */
  var openTabFromHash = function () {
    var h = window.location.hash.replace("#", "");
    if (!h) return;
    var btn = document.querySelector('[data-tab="' + (window.CSS && CSS.escape ? CSS.escape(h) : h) + '"]');
    if (btn) btn.click();
  };
  openTabFromHash();
  window.addEventListener("hashchange", openTabFromHash);

  /* ---------- accordion ---------- */
  document.querySelectorAll("[data-acc]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
    });
  });

  /* ---------- reveal on scroll ----------
     [data-stagger] gives its .rv children an incremental delay so a row of
     cards rises one after another instead of all at once. */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.dataset.stagger, 10);
    if (!step) step = 90;
    var i = 0;
    Array.prototype.forEach.call(group.children, function (child) {
      var el = child.classList.contains("rv") ? child : child.querySelector(".rv");
      if (!el) return;
      el.style.setProperty("--d", i * step + "ms");
      i += 1;
    });
  });

  var rv = document.querySelectorAll(".rv");

  /* Direct rect check. IntersectionObserver does not deliver while a tab is
     backgrounded, and bfcache restores can drop the queued entries, so a
     reveal-driven page can come back with everything stuck at opacity 0.
     This runs the same rule by hand whenever the page becomes visible. */
  var syncReveals = function () {
    var h = window.innerHeight || document.documentElement.clientHeight;
    rv.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.88 && r.bottom > 0) el.classList.add("is-in");
      else if (r.top > 0) el.classList.remove("is-in");
    });
  };

  if (rv.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
        } else if (en.boundingClientRect.top > 0) {
          /* Only rearm while the element is still BELOW the viewport, so
             scrolling down replays it. Anything that left past the top stays
             put — re-animating on the way up just looks twitchy. */
          en.target.classList.remove("is-in");
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    rv.forEach(function (el) { io.observe(el); });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") syncReveals();
    });
    window.addEventListener("pageshow", syncReveals);
    window.addEventListener("load", syncReveals);
  } else {
    rv.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- phone hyphen auto-format ---------- */
  var phone = document.querySelector("[data-phone]");
  if (phone) {
    phone.addEventListener("input", function () {
      var d = phone.value.replace(/\D/g, "").slice(0, 11);
      var out = d;
      if (d.length > 7) out = d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
      else if (d.length > 3) out = d.slice(0, 3) + "-" + d.slice(3);
      phone.value = out;
    });
  }

  /* ---------- apply form -> Supabase inquiries ---------- */
  var BRANCH_ID  = { "송도점": "songdo", "배곧점": "baegot" };
  var PROGRAM_ID = { "취미반": "hobby", "꿈나무반": "junior", "선수반": "athlete", "성인반": "adult" };

  var apply = document.querySelector("[data-apply]");
  var applyDone = document.querySelector("[data-apply-done]");
  if (apply) {
    apply.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (apply.querySelector('[name="company"]').value) return; // honeypot

      var bad = null;
      apply.querySelectorAll("[required]").forEach(function (el) {
        var ok = el.type === "checkbox" ? el.checked
          : el.type === "radio" ? apply.querySelector('[name="' + el.name + '"]:checked')
          : el.value.trim();
        if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }

      var pick = function (n) {
        var el = apply.querySelector('[name="' + n + '"]:checked');
        return el ? el.value : null;
      };
      var row = {
        name:       apply.querySelector('[name="name"]').value.trim(),
        age:        apply.querySelector('[name="age"]').value.trim() || null,
        branch_id:  BRANCH_ID[pick("branch")] || null,
        phone:      apply.querySelector('[name="phone"]').value.trim(),
        experience: pick("experience"),
        program_id: PROGRAM_ID[pick("program")] || null,
        message:    apply.querySelector('[name="message"]').value.trim() || null,
        agreed:     true
      };

      var btn = apply.querySelector('[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "전송 중…";

      /* 접수되지 않았는데 완료 화면을 보여 주면 신청이 그냥 사라진다.
         저장이 확인된 경우에만 완료 화면으로 넘어간다. */
      var sent = false;
      if (window.AF && AF.ready) {
        var res = await AF.client.from("inquiries").insert(row);
        if (res.error) console.error("[apply]", res.error);
        else sent = true;
      }
      if (!sent) {
        window.alert("신청을 접수하지 못했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.");
      }
      btn.disabled = false;
      btn.textContent = label;
      if (!sent) return;

      apply.hidden = true;
      if (applyDone) {
        applyDone.hidden = false;
        document.body.style.overflow = "hidden";
        var back = applyDone.querySelector("a.btn");
        if (back) window.requestAnimationFrame(function () { back.focus(); });
      }
    });
  }

  /* ---------- privacy modal ---------- */
  var modal = document.querySelector("[data-modal]");
  document.querySelectorAll("[data-modal-open]").forEach(function (b) {
    b.addEventListener("click", function () { if (modal) modal.hidden = false; });
  });
  document.querySelectorAll("[data-modal-close]").forEach(function (b) {
    b.addEventListener("click", function () { if (modal) modal.hidden = true; });
  });
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.hidden = true; });
  }
  /* ---------- 카카오톡 채널 주소를 config.js 값으로 채운다 ---------- */
  var kakao = (window.AF && AF.cfg && AF.cfg.KAKAO_URL) || "";
  document.querySelectorAll('a[href="#"], a[href=""]').forEach(function (a) {
    if (!/카카오톡/.test(a.textContent)) return;
    if (kakao) { a.href = kakao; }
    else { a.setAttribute("aria-disabled", "true"); a.removeAttribute("target"); }
  });
})();
