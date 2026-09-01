# -*- coding: utf-8 -*-
"""build-admin.py 에 선수단 화면 정의를 끼워 넣는다. 1회용."""
import io, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)))

MAIN = '''        <div class="card">
          <h2 id="form-title">선수 추가</h2>
          <p class="hint">이름·학년·성별만 넣어도 등록됩니다. 사진과 수상이력은 나중에 채워도 됩니다.</p>
          <form id="f">
            <input type="hidden" id="id">
            <div class="row">
              <div class="field"><label for="name">이름</label><input id="name" type="text" required></div>
              <div class="field"><label for="grade">학년</label>
                <select id="grade">
                  <option value="grade-1-2">1,2학년</option>
                  <option value="grade-3-4">3,4학년</option>
                  <option value="grade-5-6">5,6학년</option>
                  <option value="grade-middle-adult">중,고,성인</option>
                </select></div>
              <div class="field"><label for="gender">성별</label>
                <select id="gender"><option value="male">남자 선수</option><option value="female">여자 선수</option></select></div>
              <div class="field"><label for="sort">표시 순서</label><input id="sort" type="text" inputmode="numeric" value="0">
                <div class="hint">숫자가 작을수록 앞에 나옵니다.</div></div>
            </div>
            <div class="field"><label for="intro">자기 소개</label><textarea id="intro" style="min-height:70px"></textarea></div>
            <div class="field"><label for="awards">수상이력</label><textarea id="awards"></textarea>
              <div class="hint">한 줄에 하나씩 적어 주세요.</div></div>
            <div class="field"><label for="img">사진</label><input id="img" type="file" accept="image/*">
              <div class="hint">올리면 자동으로 가로 1600px로 줄여 저장합니다.</div>
              <div id="preview" style="margin-top:8px"></div></div>
            <div class="actions">
              <button class="btn btn-primary" type="submit" id="go">등록</button>
              <button class="btn btn-line" type="button" id="reset" hidden>새로 작성</button>
            </div>
          </form>
        </div>
        <div id="list"><div class="empty">불러오는 중…</div></div>'''

SCRIPT = r'''      (async function () {
        if (!(await Admin.guard("athletes"))) return;
        var GRADES = [["grade-1-2", "1,2학년"], ["grade-3-4", "3,4학년"],
                      ["grade-5-6", "5,6학년"], ["grade-middle-adult", "중,고,성인"]];
        var GENDERS = [["male", "남자 선수"], ["female", "여자 선수"]];

        var f = document.getElementById("f"), box = document.getElementById("list");
        var photoUrl = null, rows = [];

        var setPreview = function (url) {
          document.getElementById("preview").innerHTML =
            url ? '<img class="thumb" style="width:80px;height:104px" src="' + url + '">' : "";
        };

        document.getElementById("img").addEventListener("change", async function (e) {
          var file = e.target.files[0];
          if (!file) return;
          Admin.toast("사진을 올리는 중입니다…");
          try {
            photoUrl = await AF.upload("athletes", file);
            setPreview(photoUrl);
            Admin.toast("사진을 올렸습니다.");
          } catch (ex) {
            Admin.toast("사진을 올리지 못했습니다.", true);
          }
        });

        function reset() {
          f.reset();
          document.getElementById("id").value = "";
          document.getElementById("sort").value = "0";
          photoUrl = null;
          setPreview(null);
          document.getElementById("form-title").textContent = "선수 추가";
          document.getElementById("go").textContent = "등록";
          document.getElementById("reset").hidden = true;
        }
        document.getElementById("reset").addEventListener("click", reset);

        f.addEventListener("submit", async function (e) {
          e.preventDefault();
          var row = {
            name: document.getElementById("name").value.trim(),
            grade: document.getElementById("grade").value,
            gender: document.getElementById("gender").value,
            intro: document.getElementById("intro").value,
            awards: document.getElementById("awards").value,
            sort: parseInt(document.getElementById("sort").value, 10) || 0
          };
          if (!row.name) { document.getElementById("name").focus(); return; }
          if (photoUrl) row.photo_url = photoUrl;
          var id = document.getElementById("id").value;
          if (id) row.id = id;
          await Admin.save("athletes", row);
          reset();
          load();
        });

        function rowHtml(r) {
          var thumb = r.photo_url ? '<img class="thumb" src="' + r.photo_url + '">' : "";
          return "<tr>" +
            '<td style="width:74px">' + thumb + "</td>" +
            "<td><b>" + AF.esc(r.name) + "</b><br>" +
            '<span style="color:#5b6472;font-size:13px">' + AF.esc(r.intro || "") + "</span></td>" +
            '<td style="width:60px">' + (r.sort || 0) + "</td>" +
            '<td class="rt">' +
            '<button class="btn btn-line btn-sm" data-edit="' + r.id + '">수정</button> ' +
            '<button class="btn btn-danger btn-sm" data-del="' + r.id + '">삭제</button>' +
            "</td></tr>";
        }

        async function load() {
          rows = await AF.list("athletes", function (q) { return q.order("sort"); });
          if (!rows.length) {
            box.innerHTML = '<div class="card"><div class="empty">등록된 선수가 없습니다. 위에서 추가해 주세요.</div></div>';
            return;
          }
          box.innerHTML = GRADES.map(function (g) {
            var inGrade = rows.filter(function (r) { return r.grade === g[0]; });
            if (!inGrade.length) return "";
            var body = GENDERS.map(function (s) {
              var list = inGrade.filter(function (r) { return r.gender === s[0]; });
              if (!list.length) return "";
              return '<p class="hint" style="margin:14px 0 6px"><b>' + s[1] + "</b></p>" +
                "<table><tbody>" + list.map(rowHtml).join("") + "</tbody></table>";
            }).join("");
            return '<div class="card"><h2>' + g[1] + "</h2>" + body + "</div>";
          }).join("");
        }

        document.addEventListener("click", async function (e) {
          var ed = e.target.closest("[data-edit]");
          if (ed) {
            var r = rows.filter(function (x) { return x.id === ed.dataset.edit; })[0];
            if (!r) return;
            document.getElementById("id").value = r.id;
            document.getElementById("name").value = r.name || "";
            document.getElementById("grade").value = r.grade;
            document.getElementById("gender").value = r.gender;
            document.getElementById("intro").value = r.intro || "";
            document.getElementById("awards").value = r.awards || "";
            document.getElementById("sort").value = r.sort || 0;
            photoUrl = r.photo_url || null;
            setPreview(photoUrl);
            document.getElementById("form-title").textContent = "선수 수정";
            document.getElementById("go").textContent = "수정 저장";
            document.getElementById("reset").hidden = false;
            f.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          var dl = e.target.closest("[data-del]");
          if (dl) {
            var a = rows.filter(function (x) { return x.id === dl.dataset.del; })[0];
            if (!a) return;
            if (await Admin.remove("athletes", dl.dataset.del, AF.esc(a.name) + " 선수")) {
              if (a.photo_url) AF.removeImage(a.photo_url);
              load();
            }
          }
        });

        load();
      })();'''

BLOCK = (
    '\n# ============================================================ athletes\n'
    'page("athletes.html", "선수단", "선수단",\n'
    '     "홈페이지 선수단 페이지에 표시됩니다. 학년과 성별로 나뉘어 자동으로 정렬됩니다.",\n'
    '     ' + repr(MAIN) + ',\n'
    '     ' + repr(SCRIPT) + ')\n'
)

p = os.path.join(ROOT, "build-admin.py")
s = io.open(p, encoding="utf-8").read()
if "athletes.html" not in s:
    s = s.replace('\nprint("done.")', BLOCK + '\nprint("done.")')
    io.open(p, "w", encoding="utf-8", newline="\n").write(s)
    print("build-admin.py 에 선수단 화면 추가")
else:
    print("이미 추가되어 있음")
