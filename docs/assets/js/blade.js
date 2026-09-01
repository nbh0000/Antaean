/* ============================================================
   Blade light — 칼끝에 맺힌 빛.

   빛이 화면을 날아가는 게 아니라, 손(피벗)에 쥔 칼이 움직이고
   그 칼 끝에 맺힌 빛이 지나간 자리를 짧게 남긴다.

     · 피벗(손)은 섹션 밖 한 지점에 고정
     · 칼끝 = 피벗에서 각도 θ, 길이 R 만큼 떨어진 점
     · θ 를 흔들면 호를 그리고(패링·베기), R 을 늘리면 찌른다(런지)

   꼬리는 시간 기준으로 사라지므로 빠르게 휘두르면 길게 늘어나고
   천천히 움직이면 짧게 맺힌다 — 실제 잔상과 같은 방식이다.
   ============================================================ */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var TAIL_MS = 2600;         // 자취가 남아 있는 시간
  var SAMPLE_MS = 20;         // 점을 찍는 간격 (길어진 만큼 개수를 아낀다)
  var TAU = Math.PI * 2;
  var TONE = {
    dark:  { core: "255,255,255", glow: "245,197,24", w: 0.9, a: 1 },
    light: { core: "214,168,12",  glow: "214,168,12", w: 0.8, a: 0.45 }
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick() { return Math.random() < 0.5 ? -1 : 1; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- 칼 한 자루 ---------- */
  function Blade(w, h, seed) {
    this.trail = [];
    this.act = null;
    this.place(w, h, seed);
    /* 처음 한 번만 서서히 나타나고, 그 뒤로는 사라지지 않고 계속 움직인다.
       변화는 피벗 드리프트와 무작위 동작으로만 만든다. */
    this.fade = 0;
  }

  /* 피벗(손)을 섹션 가장자리 바깥에 두고, 칼끝이 화면을 쓸도록 길이를 잡는다 */
  Blade.prototype.place = function (w, h, seed) {
    var side = seed % 3;
    if (side === 0) {            // 왼쪽 아래에서 겨눔
      this.px = -w * 0.06;  this.py = h * rnd(0.78, 1.02);  this.th = rnd(-0.95, -0.45);
    } else if (side === 1) {     // 오른쪽 아래에서 겨눔
      this.px = w * 1.06;   this.py = h * rnd(0.78, 1.02);  this.th = Math.PI + rnd(0.45, 0.95);
    } else {                     // 왼쪽 위에서 내려 겨눔
      this.px = -w * 0.06;  this.py = -h * rnd(0.02, 0.16); this.th = rnd(0.45, 0.95);
    }
    this.w = w; this.h = h;
    this.R0 = Math.hypot(w, h) * rnd(0.45, 0.62);
    this.R = this.R0;
    this.thick = rnd(0.75, 1.15);
    /* 피벗(손)도 아주 천천히 흔들린다. 고정 피벗이면 정확한 원호만
       그려져 기계적으로 보이므로, 미세한 드리프트로 곡선을 흐르게 한다. */
    this.bx = this.px; this.by = this.py;
    this.cpx = this.px; this.cpy = this.py;
    this.dx = w * rnd(0.05, 0.11); this.dy = h * rnd(0.05, 0.12);
    this.wx = rnd(0.00013, 0.00028); this.wy = rnd(0.00011, 0.00025);
    this.phx = rnd(0, TAU); this.phy = rnd(0, TAU);
  };

  /* 다음 동작 — 펜싱 프레이즈처럼 짧게 끊어 이어붙인다 */
  /* 칼끝이 섹션 밖으로 나가면 안쪽 임의의 지점을 겨누도록 되돌린다.
     이게 없으면 칼이 화면 밖으로 나가 한동안 안 보인다. */
  Blade.prototype.steerBack = function () {
    var w = this.w, h = this.h;
    var cx = w * rnd(0.18, 0.82), cy = h * rnd(0.18, 0.82);
    var tx = cx - this.cpx, ty = cy - this.cpy;
    var targetTh = Math.atan2(ty, tx);
    var targetR = Math.hypot(tx, ty);
    var dth = ((targetTh - this.th + Math.PI * 3) % TAU) - Math.PI;
    return {
      dth: dth,
      dr: (targetR - this.R) / this.R0,
      dur: rnd(1000, 1700),
      ease: easeInOut
    };
  };

  Blade.prototype.outside = function () {
    var p = this.trail[this.trail.length - 1];
    if (!p) return false;
    var m = 0.06;
    return p.x < -this.w * m || p.x > this.w * (1 + m) ||
           p.y < -this.h * m || p.y > this.h * (1 + m);
  };

  Blade.prototype.next = function () {
    if (this.outside()) return this.steerBack();
    /* 각도(θ)와 길이(R)를 늘 함께 바꾼다.
       둘이 동시에 변해야 정확한 원호가 아니라 나선형 곡선이 그려진다. */
    var r = Math.random();
    var d = this.lastDir = (Math.random() < 0.72 ? (this.lastDir || pick()) : -(this.lastDir || pick()));

    if (r < 0.50) {   /* 큰 호 — 부드럽게 휘감는다 */
      return { dth: rnd(0.70, 1.35) * d, dr: rnd(-0.16, 0.16), dur: rnd(1400, 2400), ease: easeInOut };
    }
    if (r < 0.72) {   /* 작은 호 — 방향을 바꾸며 감는다 */
      return { dth: rnd(0.35, 0.70) * d, dr: rnd(-0.12, 0.12), dur: rnd(800, 1400), ease: easeInOut };
    }
    if (r < 0.86) {   /* 뻗으며 감기 */
      return { dth: rnd(0.20, 0.45) * d, dr: rnd(0.14, 0.26), dur: rnd(700, 1100), ease: easeInOut };
    }
    if (r < 0.96) {   /* 회수하며 감기 */
      return { dth: rnd(0.20, 0.45) * d, dr: -rnd(0.14, 0.26), dur: rnd(900, 1400), ease: easeInOut };
    }
    /* 짧은 스냅 — 가끔만 */
    return { dth: rnd(0.22, 0.40) * d, dr: 0, dur: rnd(380, 560), ease: easeOut };
  };

  Blade.prototype.step = function (dt, now) {
    if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 900);

    if (!this.act) {
      this.act = this.next();
      this.act.t = 0;
      this.th0 = this.th;
      this.r0 = this.R;
    }
    var a = this.act;
    a.t += dt;
    var u = Math.min(a.t / a.dur, 1);
    var e = a.ease(u);
    this.th = this.th0 + a.dth * e;
    this.R = this.r0 + this.R0 * a.dr * e;
    if (u >= 1) {
      /* 너무 뻗거나 접히지 않게 되돌려 둔다 */
      this.R = Math.max(this.R0 * 0.6, Math.min(this.R0 * 1.4, this.R));
      this.act = null;
    }

    var tr = this.trail;
    if (!tr.length || now - tr[tr.length - 1].t >= SAMPLE_MS) {
      this.cpx = this.bx + Math.sin(now * this.wx + this.phx) * this.dx;
      this.cpy = this.by + Math.sin(now * this.wy + this.phy) * this.dy;
      tr.push({
        x: this.cpx + Math.cos(this.th) * this.R,
        y: this.cpy + Math.sin(this.th) * this.R,
        t: now
      });
    }
    while (tr.length && now - tr[0].t > TAIL_MS) tr.shift();
  };

  Blade.prototype.draw = function (ctx, tone, now) {
    var tr = this.trail;
    if (tr.length < 2 || this.fade <= 0) return;
    var c = TONE[tone];
    var fade = this.fade;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* 잔상 — 번짐 한 겹, 심지 한 겹 */
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < tr.length - 1; i++) {
        var f = 1 - (now - tr[i].t) / TAIL_MS;
        if (f <= 0.01) continue;
        if (pass === 0) {                       // 아주 옅은 번짐
          ctx.strokeStyle = "rgba(" + c.glow + "," + (f * 0.10 * c.a * fade).toFixed(3) + ")";
          ctx.lineWidth = c.w * this.thick * (0.45 + f * 0.55) * 2.6;
        } else {                                // 가는 자취
          ctx.strokeStyle = "rgba(" + c.core + "," + (f * 0.42 * c.a * fade).toFixed(3) + ")";
          ctx.lineWidth = c.w * this.thick * (0.55 + f * 0.45);
        }
        ctx.beginPath();
        ctx.moveTo(tr[i].x, tr[i].y);
        ctx.lineTo(tr[i + 1].x, tr[i + 1].y);
        ctx.stroke();
      }
    }

    /* 움직이는 오브젝트(칼끝) — 자취와 달리 감쇠하지 않고 항상 그린다.
       이게 없으면 선두가 흐려져 무엇이 움직이는지 보이지 않는다. */
    var head = tr[tr.length - 1];
    var rr = c.w * this.thick * 2.2;
    var g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, rr * 5);
    g.addColorStop(0, "rgba(" + c.core + "," + (0.95 * c.a * fade).toFixed(3) + ")");
    g.addColorStop(0.16, "rgba(" + c.glow + "," + (0.42 * c.a * fade).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + c.glow + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(head.x, head.y, rr * 5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(" + c.core + "," + (0.98 * c.a * fade).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(head.x, head.y, rr, 0, TAU);
    ctx.fill();
  };

  /* ---------- 섹션에 붙이기 ---------- */
  function mount(host, tone, count) {
    if (host.querySelector(":scope > canvas.blades")) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    var cv = document.createElement("canvas");
    cv.className = "blades";
    cv.setAttribute("aria-hidden", "true");
    host.insertBefore(cv, host.firstChild);

    var ctx = cv.getContext("2d");
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var blades = [], on = false, raf = null, last = 0;

    function size() {
      var r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!blades.length) {
        for (var i = 0; i < count; i++) {
          blades.push(new Blade(w, h, i + Math.floor(Math.random() * 3)));
        }
      } else {
        for (var j = 0; j < blades.length; j++) {
          blades[j].place(w, h, j);
          blades[j].trail.length = 0;
        }
      }
    }

    function frame(now) {
      var dt = Math.min(now - (last || now), 50);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < blades.length; i++) {
        blades[i].step(dt, now);
        blades[i].draw(ctx, tone, now);
      }
      raf = on ? requestAnimationFrame(frame) : null;
    }

    function play(v) {
      on = v;
      if (v && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!v && raf) { cancelAnimationFrame(raf); raf = null; }
    }

    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    else window.addEventListener("resize", size);

    /* 화면 안에 있고 탭이 보일 때만 돌린다.
       두 조건을 따로 들고 있어야 탭을 갔다 와도 다시 살아난다. */
    var inView = true;
    var sync = function () { play(inView && document.visibilityState === "visible"); };

    if ("IntersectionObserver" in window) {
      inView = false;
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        sync();
      }, { threshold: 0 }).observe(host);
    }
    document.addEventListener("visibilitychange", sync);
    sync();
  }

  function init() {
    /* 표시할 곳을 HTML 에서 data-blade 로 지정한다.
       (data-blade="light" 를 주면 밝은 배경용 톤) */
    document.querySelectorAll("[data-blade]").forEach(function (host) {
      var tone = host.dataset.blade === "light" ? "light" : "dark";
      mount(host, tone, 2);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
