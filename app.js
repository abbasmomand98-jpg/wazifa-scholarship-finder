// ============================================================
// WAZIFA — Scholarship Finder (UX Concept)
// app.js — DOM wiring only. All rules live in logic.js.
// ============================================================
(function () {
  "use strict";

  var L = window.WAZIFA_LOGIC;
  var DATA = window.WAZIFA_SCHOLARSHIPS || [];
  var DOC_KEY = "wazifa-docs-v1";

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- tabs ----------
  var tabs = [
    ["tabFinder", "panelFinder"],
    ["tabChecker", "panelChecker"],
    ["tabTracker", "panelTracker"],
    ["tabScam", "panelScam"]
  ];
  tabs.forEach(function (pair) {
    $(pair[0]).addEventListener("click", function () {
      tabs.forEach(function (p) {
        $(p[0]).classList.toggle("active", p[0] === pair[0]);
        $(p[1]).hidden = (p[1] !== pair[1]);
      });
    });
  });

  // ---------- finder ----------
  var selectedId = DATA.length ? DATA[0].id : null;

  function renderFinder() {
    var list = L.filterScholarships(DATA, {
      query: $("schSearch").value,
      level: $("levelFilter").value,
      province: $("provinceFilter").value
    });
    var ul = $("schList");
    if (!list.length) {
      ul.innerHTML = "<li>No scholarships match your filters.</li>";
    } else {
      ul.innerHTML = list.map(function (s) {
        var cls = s.id === selectedId ? ' class="selected"' : "";
        return "<li" + cls + " data-id=\"" + s.id + "\">" +
          "<span><strong>" + esc(s.name) + "</strong>" +
          "<span class=\"meta\">" + esc(s.provider) + " · " + esc(s.level) +
          " · " + esc(s.province) + " · " + esc(s.amountLabel) + "</span></span>" +
          "<span class=\"deadline-chip\">" + esc(L.deadlineLabel(s.deadline)) + "</span></li>";
      }).join("");
      ul.querySelectorAll("li[data-id]").forEach(function (li) {
        li.addEventListener("click", function () {
          selectedId = li.getAttribute("data-id");
          renderFinder();
        });
      });
    }
    renderDetail();
  }

  function renderDetail() {
    var s = L.lookupScholarship(selectedId);
    if (!s) { $("schDetail").innerHTML = ""; return; }
    var profile = currentProfile();
    var m = L.matchScore(s, profile);
    $("schDetail").innerHTML =
      "<h3>" + esc(s.name) + "</h3>" +
      "<p class=\"sub\">" + esc(s.description) + "</p>" +
      "<p><span class=\"match-chip\">" + m.percent + "% match</span> " +
      "<span class=\"deadline-chip\">Deadline: " + esc(s.deadline) + " · " +
      esc(L.deadlineLabel(s.deadline)) + "</span></p>" +
      "<p><strong>" + esc(s.amountLabel) + "</strong> · " + esc(s.type) +
      (s.forWomen ? " · Women only" : "") + "</p>" +
      m.passed.map(function (p) {
        return "<div class=\"check-row\"><span>" + esc(p) + "</span><span class=\"pass\">Pass</span></div>";
      }).join("") +
      m.failed.map(function (f) {
        return "<div class=\"check-row\"><span>" + esc(f) + "</span><span class=\"fail\">Check</span></div>";
      }).join("") +
      "<p class=\"sub\">Documents usually needed: " + esc(s.docs.join(", ")) + ".</p>";
  }

  function currentProfile() {
    return {
      marks: $("chkMarks").value,
      income: $("chkIncome").value,
      domicile: $("chkDomicile").value,
      level: $("chkLevel").value
    };
  }

  ["schSearch", "levelFilter", "provinceFilter"].forEach(function (id) {
    $(id).addEventListener("input", renderFinder);
    $(id).addEventListener("change", renderFinder);
  });

  // ---------- checker ----------
  $("chkBtn").addEventListener("click", function () {
    var profile = currentProfile();
    var scored = DATA.map(function (s) {
      return { s: s, m: L.matchScore(s, profile) };
    }).sort(function (a, b) { return b.m.percent - a.m.percent; });
    $("chkResult").innerHTML = scored.map(function (row) {
      return "<div class=\"check-row\"><span><strong>" + esc(row.s.name) + "</strong> · " +
        esc(L.deadlineLabel(row.s.deadline)) + "</span>" +
        "<span class=\"match-chip\">" + row.m.percent + "%</span></div>";
    }).join("");
  });

  // ---------- tracker + docs ----------
  function loadDocs() {
    try { return JSON.parse(localStorage.getItem(DOC_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveDocs(obj) {
    try { localStorage.setItem(DOC_KEY, JSON.stringify(obj)); } catch (e) { /* private mode */ }
  }

  function renderTracker() {
    var sorted = L.sortedByDeadline(DATA);
    $("trackerList").innerHTML = sorted.map(function (s) {
      var days = L.daysUntil(s.deadline);
      var pct = days === null ? 0 : Math.max(5, Math.min(100, 100 - days));
      var cls = days !== null && days <= 21 ? "fill soon" : "fill";
      return "<div style=\"margin-bottom:0.9rem;\"><div style=\"display:flex;justify-content:space-between;gap:0.5rem;\">" +
        "<strong>" + esc(s.name) + "</strong><span class=\"deadline-chip\">" +
        esc(L.deadlineLabel(s.deadline)) + "</span></div>" +
        "<div class=\"countdown\" style=\"margin-top:0.35rem;\"><div class=\"" + cls +
        "\" style=\"width:" + pct + "%\"></div></div></div>";
    }).join("");
  }

  function renderDocs() {
    var id = $("docScholarship").value;
    var s = L.lookupScholarship(id);
    if (!s) { $("docList").innerHTML = ""; return; }
    var saved = loadDocs()[id] || {};
    $("docList").innerHTML = s.docs.map(function (doc, i) {
      var checked = saved[doc] ? " checked" : "";
      return "<label class=\"doc-row\"><input type=\"checkbox\" data-doc=\"" + i + "\"" + checked + " /> " +
        esc(doc) + "</label>";
    }).join("");
    var done = s.docs.filter(function (d) { return saved[d]; }).length;
    $("docProgress").textContent = done + " of " + s.docs.length + " documents ready";
    $("docList").querySelectorAll("input[type=checkbox]").forEach(function (box) {
      box.addEventListener("change", function () {
        var all = loadDocs();
        all[id] = all[id] || {};
        all[id][s.docs[Number(box.getAttribute("data-doc"))]] = box.checked;
        saveDocs(all);
        renderDocs();
      });
    });
  }

  $("docScholarship").innerHTML = DATA.map(function (s) {
    return "<option value=\"" + s.id + "\">" + esc(s.name) + "</option>";
  }).join("");
  $("docScholarship").addEventListener("change", renderDocs);

  // ---------- scam spotter ----------
  $("scamBtn").addEventListener("click", function () {
    var r = L.scamCheck($("scamInput").value);
    var head = r.risk === "high" ? "High risk — do not pay." :
               (r.risk === "medium" ? "Caution — one red flag found." :
                "No red flags found in this message.");
    $("scamResult").innerHTML = "<p class=\"calc-result\">" + head + "</p>" +
      (r.flags.length ? "<ul>" + r.flags.map(function (f) {
        return "<li>" + esc(f) + "</li>";
      }).join("") + "</ul>" : "<p class=\"sub\">Still verify the scholarship on its official portal.</p>");
  });

  // ---------- init ----------
  renderFinder();
  renderTracker();
  renderDocs();
})();
