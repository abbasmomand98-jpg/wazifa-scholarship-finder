// ============================================================
// WAZIFA — Scholarship Finder (UX Concept)
// test.js — node-runnable smoke test for logic.js.
// Run: node test.js
// ============================================================

const fs = require("fs");
const path = require("path");

global.eval(fs.readFileSync(path.join(__dirname, "data.js"), "utf8"));
const L = require(path.join(__dirname, "logic.js"));

let passed = 0, failed = 0;
function assert(cond, label, actual, expected) {
  if (cond) { passed++; }
  else { failed++; console.error("FAIL:", label, "| actual:", actual, "| expected:", expected); }
}
function eq(a, b) { return a === b; }

// ---------- data ----------
assert(Array.isArray(WAZIFA_SCHOLARSHIPS) && WAZIFA_SCHOLARSHIPS.length === 12,
  "12 scholarships loaded", WAZIFA_SCHOLARSHIPS.length, 12);
assert(WAZIFA_SCHOLARSHIPS.every(s => s.id && s.name && s.deadline && s.docs && s.docs.length > 0),
  "every scholarship has id/name/deadline/docs", true, true);
assert(new Set(WAZIFA_SCHOLARSHIPS.map(s => s.id)).size === 12,
  "scholarship ids unique", true, true);

// ---------- formatPKR ----------
assert(eq(L.formatPKR(60000), "Rs 60,000"), "formatPKR 60000", L.formatPKR(60000), "Rs 60,000");
assert(eq(L.formatPKR(0), "Rs 0"), "formatPKR 0", L.formatPKR(0), "Rs 0");
assert(eq(L.formatPKR(NaN), "Rs 0"), "formatPKR NaN", L.formatPKR(NaN), "Rs 0");
assert(eq(L.formatPKR("45000"), "Rs 45,000"), "formatPKR string", L.formatPKR("45000"), "Rs 45,000");

// ---------- daysUntil / deadlineLabel ----------
assert(eq(L.daysUntil("2026-11-15", "2026-10-25"), 21), "daysUntil 21", L.daysUntil("2026-11-15", "2026-10-25"), 21);
assert(eq(L.daysUntil("2026-10-25", "2026-10-25"), 0), "daysUntil today 0", L.daysUntil("2026-10-25", "2026-10-25"), 0);
assert(eq(L.daysUntil("2026-10-20", "2026-10-25"), -5), "daysUntil past -5", L.daysUntil("2026-10-20", "2026-10-25"), -5);
assert(eq(L.daysUntil("bogus", "2026-10-25"), null), "daysUntil bad -> null", L.daysUntil("bogus", "2026-10-25"), null);
assert(eq(L.daysUntil(null, "2026-10-25"), null), "daysUntil null -> null", L.daysUntil(null, "2026-10-25"), null);
assert(eq(L.deadlineLabel("2026-11-15", "2026-10-25"), "21 days left"), "label 21 days", L.deadlineLabel("2026-11-15", "2026-10-25"), "21 days left");
assert(eq(L.deadlineLabel("2026-10-25", "2026-10-25"), "Closes today"), "label today", L.deadlineLabel("2026-10-25", "2026-10-25"), "Closes today");
assert(eq(L.deadlineLabel("2026-10-26", "2026-10-25"), "Closes tomorrow"), "label tomorrow", L.deadlineLabel("2026-10-26", "2026-10-25"), "Closes tomorrow");
assert(eq(L.deadlineLabel("2026-10-20", "2026-10-25"), "Closed 5 day(s) ago"), "label closed", L.deadlineLabel("2026-10-20", "2026-10-25"), "Closed 5 day(s) ago");

// ---------- lookup ----------
const hec = L.lookupScholarship("hec-need-based");
assert(hec && eq(hec.name, "HEC Need-Based Scholarship"), "lookup hec", hec && hec.name, "HEC Need-Based Scholarship");
assert(L.lookupScholarship("nope") === null, "lookup missing -> null", L.lookupScholarship("nope"), null);

// ---------- filterScholarships ----------
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "HEC" }).length, 2),
  "filter query HEC -> 2", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "HEC" }).length, 2);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "hec" }).length, 2),
  "filter query case-insensitive", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "hec" }).length, 2);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "zzz" }).length, 0),
  "filter query no match -> 0", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { query: "zzz" }).length, 0);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { province: "Punjab" }).length, 5),
  "filter Punjab includes All Pakistan -> 5", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { province: "Punjab" }).length, 5);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { province: "Sindh" }).length, 7),
  "filter Sindh includes All Pakistan -> 7", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { province: "Sindh" }).length, 7);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, {}).length, 12),
  "filter empty -> all", L.filterScholarships(WAZIFA_SCHOLARSHIPS, {}).length, 12);
assert(eq(L.filterScholarships(WAZIFA_SCHOLARSHIPS, { level: "Postgraduate" }).length, 0),
  "filter level mismatch -> 0", L.filterScholarships(WAZIFA_SCHOLARSHIPS, { level: "Postgraduate" }).length, 0);
assert(eq(L.filterScholarships(null, {}).length, 0),
  "filter null list -> []", L.filterScholarships(null, {}).length, 0);

// ---------- matchScore ----------
const prof = { marks: 88, income: 45000, domicile: "Punjab", level: "Undergraduate" };
const mHec = L.matchScore(hec, prof);
assert(eq(mHec.percent, 100), "match HEC 100%", mHec.percent, 100);
assert(eq(mHec.passed.length, 4), "match HEC 4 passed", mHec.passed.length, 4);
const low = L.matchScore(hec, { marks: 50, income: 200000, domicile: "Sindh", level: "Undergraduate" });
assert(eq(low.percent, 50), "match low profile 50% (All-Pakistan domicile + level still pass)", low.percent, 50);
assert(eq(low.failed.length, 2), "match low profile 2 failed", low.failed.length, 2);
const uet = L.lookupScholarship("uet-merit");
const mUet = L.matchScore(uet, { marks: 88, income: 999999, domicile: "Khyber Pakhtunkhwa", level: "Undergraduate" });
assert(eq(mUet.percent, 100), "match UET no income cap 100%", mUet.percent, 100);
const mBad = L.matchScore(null, prof);
assert(eq(mBad.percent, 0), "match null scholarship -> 0", mBad.percent, 0);
const mNoProf = L.matchScore(hec, null);
assert(eq(mNoProf.percent, 0), "match null profile -> 0", mNoProf.percent, 0);
const mBoundary = L.matchScore(hec, { marks: 60, income: 80000, domicile: "Punjab", level: "Undergraduate" });
assert(eq(mBoundary.percent, 100), "match exact thresholds 100%", mBoundary.percent, 100);

// ---------- sortedByDeadline ----------
const sorted = L.sortedByDeadline(WAZIFA_SCHOLARSHIPS);
assert(eq(sorted[0].id, "hec-need-based"), "sorted first = earliest deadline", sorted[0].id, "hec-need-based");
assert(eq(sorted[sorted.length - 1].id, "nust-need"), "sorted last = latest deadline", sorted[sorted.length - 1].id, "nust-need");
assert(eq(sorted.length, 12), "sorted keeps all 12", sorted.length, 12);
assert(eq(WAZIFA_SCHOLARSHIPS[0].id, "hec-need-based"), "sorted does not mutate input order (first unchanged)", WAZIFA_SCHOLARSHIPS[0].id, "hec-need-based");

// ---------- scamCheck ----------
const scam = L.scamCheck("Pay a Rs 5,000 processing fee and your selection is guaranteed!");
assert(eq(scam.risk, "high"), "scam fee+guarantee -> high", scam.risk, "high");
assert(scam.flags.length >= 2, "scam fee+guarantee flags >= 2", scam.flags.length, ">=2");
const feeOnly = L.scamCheck("There is a small registration fee.");
assert(eq(feeOnly.risk, "medium"), "scam fee only -> medium", feeOnly.risk, "medium");
const clean = L.scamCheck("Apply free on the official HEC portal before 15 November.");
assert(eq(clean.risk, "low") && eq(clean.flags.length, 0), "scam clean -> low/0", JSON.stringify(clean), "{low,[]}");
const empty = L.scamCheck("");
assert(eq(empty.risk, "low"), "scam empty -> low", empty.risk, "low");
const advance = L.scamCheck("Urgent: send an advance payment via Easypaisa.");
assert(eq(advance.risk, "high"), "scam advance+urgent -> high", advance.risk, "high");

// ---------- summary ----------
console.log("----------------------------------------");
console.log("WAZIFA logic tests — passed:", passed, "| failed:", failed);
if (failed > 0) { process.exitCode = 1; }
