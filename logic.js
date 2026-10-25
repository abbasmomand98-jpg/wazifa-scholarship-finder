// ============================================================
// WAZIFA — Scholarship Finder (UX Concept)
// logic.js — PURE FUNCTIONS ONLY: no DOM, no localStorage.
// Works in a browser (plain <script> tag) and in Node via UMD.
// ============================================================

(function (global) {
  "use strict";

  function _list() { return global.WAZIFA_SCHOLARSHIPS || []; }

  function round2(x) { return Math.round(x * 100) / 100; }

  function formatPKR(n) {
    var num = Number(n);
    if (!isFinite(num)) num = 0;
    var rounded = Math.round(num);
    var negative = rounded < 0;
    var digits = String(Math.abs(rounded));
    var grouped = "";
    while (digits.length > 3) {
      grouped = "," + digits.slice(-3) + grouped;
      digits = digits.slice(0, -3);
    }
    grouped = digits + grouped;
    return (negative ? "Rs -" : "Rs ") + grouped;
  }

  function lookupScholarship(id) {
    var list = _list();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // Days from `today` (Date or "YYYY-MM-DD") to a deadline string.
  // Negative when the deadline has passed. Null for bad input.
  function daysUntil(deadline, today) {
    if (!deadline) return null;
    var d = new Date(deadline + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    var t = today ? new Date(today + "T00:00:00") : new Date();
    if (isNaN(t.getTime())) return null;
    // Compare calendar days, ignoring time-of-day.
    var dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var tt = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((dd - tt) / 86400000);
  }

  function deadlineLabel(deadline, today) {
    var days = daysUntil(deadline, today);
    if (days === null) return "Deadline unknown";
    if (days < 0) return "Closed " + Math.abs(days) + " day(s) ago";
    if (days === 0) return "Closes today";
    if (days === 1) return "Closes tomorrow";
    return days + " days left";
  }

  // Filter by search text, level and province. "All Pakistan" awards
  // always pass a province filter (they are open nationwide).
  function filterScholarships(list, filters) {
    filters = filters || {};
    var q = (filters.query || "").toLowerCase().trim();
    var level = filters.level || "";
    var province = filters.province || "";
    return (list || []).filter(function (s) {
      if (q) {
        var hay = (s.name + " " + s.provider + " " + s.type).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (level && s.level !== level) return false;
      if (province && s.province !== province && s.province !== "All Pakistan") return false;
      return true;
    });
  }

  // Score a profile against one scholarship. Profile:
  // { marks, income, domicile, level }. Returns
  // { percent, passed: [labels], failed: [labels] }.
  function matchScore(scholarship, profile) {
    if (!scholarship || !profile) return { percent: 0, passed: [], failed: [] };
    var checks = [];
    var marks = Number(profile.marks);
    checks.push({
      label: "Marks " + scholarship.minMarks + "% or above",
      pass: isFinite(marks) && marks >= scholarship.minMarks
    });
    if (scholarship.maxIncome === null || scholarship.maxIncome === undefined) {
      checks.push({ label: "No income cap", pass: true });
    } else {
      var income = Number(profile.income);
      checks.push({
        label: "Family income under " + formatPKR(scholarship.maxIncome) + " / month",
        pass: isFinite(income) && income <= scholarship.maxIncome
      });
    }
    checks.push({
      label: "Domicile: " + scholarship.province,
      pass: !profile.domicile || scholarship.province === "All Pakistan" ||
            scholarship.province === profile.domicile
    });
    checks.push({
      label: "Level: " + scholarship.level,
      pass: !profile.level || scholarship.level === profile.level
    });
    var passed = checks.filter(function (c) { return c.pass; });
    var failed = checks.filter(function (c) { return !c.pass; });
    return {
      percent: Math.round((passed.length / checks.length) * 100),
      passed: passed.map(function (c) { return c.label; }),
      failed: failed.map(function (c) { return c.label; })
    };
  }

  // Sort a list by deadline, soonest first. Invalid deadlines go last.
  function sortedByDeadline(list) {
    var copy = (list || []).slice();
    copy.sort(function (a, b) {
      var da = daysUntil(a.deadline, "2026-10-25");
      var db = daysUntil(b.deadline, "2026-10-25");
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
    return copy;
  }

  // Scam-spotter: flag fee/guarantee language in an agent message.
  // Returns { risk: "high"|"medium"|"low", flags: [reasons] }.
  function scamCheck(text) {
    var t = (text || "").toLowerCase();
    var patterns = [
      [/processing fee|registration fee|agent fee|service charges/, "Asks for a fee — real scholarships are free to apply"],
      [/guarantee|100% sure|confirmed selection|seat reserved/, "Guarantees selection — no honest agent can do that"],
      [/advance payment|pay first|deposit|send money|easypaisa|jazzcash/, "Asks for money up front"],
      [/urgent|last chance|pay today|act now/, "Pressure to pay quickly"],
      [/whatsapp.*fee|fee.*whatsapp/, "Fee discussed over WhatsApp only"]
    ];
    var flags = [];
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i][0].test(t)) flags.push(patterns[i][1]);
    }
    var risk = flags.length >= 2 ? "high" : (flags.length === 1 ? "medium" : "low");
    return { risk: risk, flags: flags };
  }

  var WAZIFA_LOGIC = {
    formatPKR: formatPKR,
    lookupScholarship: lookupScholarship,
    daysUntil: daysUntil,
    deadlineLabel: deadlineLabel,
    filterScholarships: filterScholarships,
    matchScore: matchScore,
    sortedByDeadline: sortedByDeadline,
    scamCheck: scamCheck
  };

  global.WAZIFA_LOGIC = WAZIFA_LOGIC;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = WAZIFA_LOGIC;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
