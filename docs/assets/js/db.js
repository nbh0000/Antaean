/* ============================================================
   Supabase 공통 레이어 — 공개 페이지와 관리자 화면이 함께 씁니다.
   window.AF 하나만 노출합니다.
   ============================================================ */
window.AF = (function () {
  "use strict";

  var cfg = window.ANTAEAN_CONFIG || {};
  var ready = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var client = ready
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  /* ---------- 유틸 ---------- */
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** 줄바꿈으로 구분된 텍스트를 <li> 목록으로 */
  function lines(text) {
    return String(text || "")
      .split("\n")
      .map(function (l) { return l.trim(); })
      .filter(Boolean);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate());
  }

  function digits(v) { return String(v || "").replace(/\D/g, ""); }

  /* ---------- 조회 ---------- */
  function table(name) {
    return client ? client.from(name) : null;
  }

  /** 실패하거나 미설정이면 [] 를 돌려주어 정적 콘텐츠가 그대로 남게 한다. */
  async function list(name, build) {
    if (!client) return [];
    try {
      var q = client.from(name).select("*");
      if (build) q = build(q);
      var res = await q;
      if (res.error) { console.warn("[AF]", name, res.error.message); return []; }
      return res.data || [];
    } catch (e) {
      console.warn("[AF]", name, e);
      return [];
    }
  }

  /* ---------- 인증 ---------- */
  async function session() {
    if (!client) return null;
    var res = await client.auth.getSession();
    return res.data ? res.data.session : null;
  }
  async function signIn(email, password) {
    if (!client) throw new Error("Supabase 연결 정보가 설정되지 않았습니다.");
    var res = await client.auth.signInWithPassword({ email: email, password: password });
    if (res.error) throw res.error;
    return res.data;
  }
  async function signOut() {
    if (client) await client.auth.signOut();
  }

  /* ---------- 이미지 업로드 ----------
     업로드 전에 브라우저에서 최대 1600px 로 줄이고, 파일명은 uuid 로 바꾼다.
     (한글 파일명 금지, 원본 그대로 올리면 용량이 너무 큼) */
  function resize(file, max) {
    max = max || 1600;
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (w <= max && h <= max) return resolve(file);
        var s = max / Math.max(w, h);
        var c = document.createElement("canvas");
        c.width = Math.round(w * s);
        c.height = Math.round(h * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { resolve(b || file); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("이미지를 읽을 수 없습니다.")); };
      img.src = url;
    });
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  async function upload(folder, file) {
    if (!client) throw new Error("Supabase 연결 정보가 설정되지 않았습니다.");
    var blob = await resize(file, 1600);
    var ext = (blob.type === "image/jpeg") ? "jpg" : (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = folder + "/" + uuid() + "." + ext.replace(/[^a-z0-9]/g, "");
    var res = await client.storage.from("public-images").upload(path, blob, {
      cacheControl: "31536000", upsert: false, contentType: blob.type || file.type
    });
    if (res.error) throw res.error;
    return client.storage.from("public-images").getPublicUrl(path).data.publicUrl;
  }

  async function removeImage(publicUrl) {
    if (!client || !publicUrl) return;
    var m = String(publicUrl).split("/public-images/")[1];
    if (!m) return;
    await client.storage.from("public-images").remove([decodeURIComponent(m)]);
  }

  return {
    ready: ready,
    client: client,
    cfg: cfg,
    table: table,
    list: list,
    session: session,
    signIn: signIn,
    signOut: signOut,
    upload: upload,
    removeImage: removeImage,
    esc: esc,
    lines: lines,
    fmtDate: fmtDate,
    digits: digits
  };
})();
