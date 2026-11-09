// gratuity-calculator-bd -- pure gratuity math (no DOM). Node-testable.
// Money is integer paisa everywhere (1 taka = 100 paisa).
//
// Standard rule used (labelled educational assumption, see README):
//   gratuity = last drawn basic salary x months-per-year multiplier x
//   years of service, payable after 5 years of continuous service.
//   Default multiplier is 1 (one month's basic per completed year).
//   Fractional-year toggle: off = completed years only (the standard
//   reading), on = pro-rata months counted (total months / 12).
//   This app does NOT present any rate as an official government figure.
(function (root) {
  'use strict';

  var APP = 'gratuity-calculator-bd';
  var VERSION = 1;

  var TAKA = '\u09f3';
  var BN_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea',
                   '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];

  var LIMITS = {
    basicMax: 10000000,       // BDT per month
    yearsMin: 0,
    yearsMax: 60,
    monthsMin: 0,
    monthsMax: 11,
    multiplierMin: 0.5,
    multiplierMax: 2,
    incrementPctMax: 20,
    minServiceMonths: 60      // 5 years of continuous service
  };

  function isFiniteNumber(x) { return typeof x === 'number' && isFinite(x); }

  function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  // Format integer paisa as "Tk 500,000.00" (Bengali digits when lang === 'bn').
  function formatBDT(paisa, lang) {
    var neg = paisa < 0;
    var abs = Math.abs(Math.round(paisa));
    var taka = Math.floor(abs / 100);
    var p = abs % 100;
    var s = String(taka).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
            '.' + String(p).padStart(2, '0');
    if (lang === 'bn') s = toBnDigits(s);
    return (neg ? '-' : '') + TAKA + s;
  }

  // Validate calculator inputs. Returns { ok, errors } where errors is a map
  // field -> message (English message; UI localises via its own table).
  function validateInputs(inp) {
    var errors = {};
    var b = inp.basic;
    if (!isFiniteNumber(b)) errors.basic = 'Enter the last basic salary.';
    else if (b <= 0) errors.basic = 'Basic salary must be more than 0.';
    else if (b > LIMITS.basicMax) errors.basic = 'Basic salary is too large (max 10,000,000).';
    var y = inp.years;
    if (!isFiniteNumber(y) || Math.floor(y) !== y) errors.years = 'Years must be a whole number.';
    else if (y < LIMITS.yearsMin || y > LIMITS.yearsMax) errors.years = 'Years of service must be 0-60.';
    var m = inp.months;
    if (!isFiniteNumber(m) || Math.floor(m) !== m) errors.months = 'Months must be a whole number.';
    else if (m < LIMITS.monthsMin || m > LIMITS.monthsMax) errors.months = 'Extra months must be 0-11.';
    var mu = inp.multiplier;
    if (!isFiniteNumber(mu)) errors.multiplier = 'Enter the months-per-year multiplier.';
    else if (mu < LIMITS.multiplierMin || mu > LIMITS.multiplierMax) errors.multiplier = 'Multiplier must be 0.5-2.';
    var g = inp.incrementPct;
    if (g === undefined || g === null || g === '') g = 0;
    if (!isFiniteNumber(g)) errors.incrementPct = 'Increment must be a number.';
    else if (g < 0 || g > LIMITS.incrementPctMax) errors.incrementPct = 'Annual increment must be 0-20%.';
    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  // Core calculator. inp: { basic, years, months, multiplier, fractional, incrementPct }
  // Money inputs are in BDT (may be fractional taka); all outputs in paisa.
  function computeGratuity(inp) {
    var v = validateInputs(inp);
    if (!v.ok) return { ok: false, errors: v.errors };
    var basicPaisa = Math.round(inp.basic * 100);
    var multiplier = inp.multiplier;
    var years = inp.years;
    var months = inp.months;
    var fractional = !!inp.fractional;
    var incPct = inp.incrementPct || 0;

    var totalMonths = years * 12 + months;
    var eligible = totalMonths >= LIMITS.minServiceMonths;
    var effectiveYears = fractional ? totalMonths / 12 : years;
    var gratuityPaisa = Math.round(basicPaisa * multiplier * effectiveYears);
    var projectedAt5Paisa = eligible ? null :
      Math.round(basicPaisa * multiplier * 5);

    return {
      ok: true,
      gratuityPaisa: gratuityPaisa,
      basicPaisa: basicPaisa,
      multiplier: multiplier,
      completedYears: years,
      months: months,
      totalMonths: totalMonths,
      effectiveYears: effectiveYears,
      eligible: eligible,
      projectedAt5Paisa: projectedAt5Paisa,
      breakdown: yearlyBreakdown(inp),
      projection: projectFuture(inp)
    };
  }

  // Year-by-year accrual: one row per completed year, plus a pro-rata
  // partial-year row when fractional counting is on and months > 0.
  function yearlyBreakdown(inp) {
    var v = validateInputs(inp);
    if (!v.ok) return [];
    var basicPaisa = Math.round(inp.basic * 100);
    var multiplier = inp.multiplier;
    var rows = [];
    var cumulative = 0;
    for (var y = 1; y <= inp.years; y++) {
      var accrual = Math.round(basicPaisa * multiplier);
      cumulative += accrual;
      rows.push({
        year: y,
        partial: false,
        months: 0,
        basicPaisa: basicPaisa,
        accrualPaisa: accrual,
        cumulativePaisa: cumulative
      });
    }
    if (inp.fractional && inp.months > 0) {
      var partialAccrual = Math.round(basicPaisa * multiplier * inp.months / 12);
      cumulative += partialAccrual;
      rows.push({
        year: inp.years + 1,
        partial: true,
        months: inp.months,
        basicPaisa: basicPaisa,
        accrualPaisa: partialAccrual,
        cumulativePaisa: cumulative
      });
    }
    return rows;
  }

  // "Stay longer" projection: basic grows by incrementPct each year;
  // service years grow with it. Returns rows for +1, +3, +5 years.
  function projectFuture(inp) {
    var v = validateInputs(inp);
    if (!v.ok) return [];
    var basicPaisa = Math.round(inp.basic * 100);
    var multiplier = inp.multiplier;
    var incPct = inp.incrementPct || 0;
    var effectiveYears = inp.fractional ? (inp.years * 12 + inp.months) / 12 : inp.years;
    var extras = [1, 3, 5];
    var rows = [];
    for (var i = 0; i < extras.length; i++) {
      var extra = extras[i];
      var futureBasic = Math.round(basicPaisa * Math.pow(1 + incPct / 100, extra));
      var futureYears = effectiveYears + extra;
      rows.push({
        extraYears: extra,
        basicPaisa: futureBasic,
        serviceYears: futureYears,
        gratuityPaisa: Math.round(futureBasic * multiplier * futureYears)
      });
    }
    return rows;
  }

  // ---- history / export / import ----

  function exportPayload(history) {
    return JSON.stringify({
      app: APP,
      version: VERSION,
      exportedAt: new Date().toISOString().slice(0, 10),
      history: history || []
    }, null, 2);
  }

  function validHistoryEntry(e) {
    if (!e || typeof e !== 'object') return false;
    if (typeof e.name !== 'string' || e.name.trim().length === 0 || e.name.length > 80) return false;
    if (!e.inputs || typeof e.inputs !== 'object') return false;
    if (!validateInputs(e.inputs).ok) return false;
    if (!e.result || typeof e.result !== 'object') return false;
    if (!isFiniteNumber(e.result.gratuityPaisa) || e.result.gratuityPaisa < 0) return false;
    if (typeof e.savedAt !== 'string' || e.savedAt.length === 0) return false;
    return true;
  }

  // Strict import validation. Returns { ok, history } or { ok: false, error }.
  // Never mutates the caller's data; a failed import leaves existing data intact.
  function importPayload(text) {
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'Not valid JSON.' }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'Import must be a JSON object.' };
    }
    if (obj.app !== APP) return { ok: false, error: 'Not a gratuity-calculator-bd file.' };
    if (obj.version !== VERSION) return { ok: false, error: 'Unsupported file version.' };
    if (!Array.isArray(obj.history)) return { ok: false, error: 'History must be a list.' };
    if (obj.history.length > 200) return { ok: false, error: 'Too many saved scenarios (max 200).' };
    for (var i = 0; i < obj.history.length; i++) {
      if (!validHistoryEntry(obj.history[i])) {
        return { ok: false, error: 'Saved scenario #' + (i + 1) + ' is invalid.' };
      }
    }
    return { ok: true, history: obj.history };
  }

  var api = {
    APP: APP,
    VERSION: VERSION,
    LIMITS: LIMITS,
    TAKA: TAKA,
    toBnDigits: toBnDigits,
    formatBDT: formatBDT,
    validateInputs: validateInputs,
    computeGratuity: computeGratuity,
    yearlyBreakdown: yearlyBreakdown,
    projectFuture: projectFuture,
    exportPayload: exportPayload,
    importPayload: importPayload,
    validHistoryEntry: validHistoryEntry
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GratuityLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
