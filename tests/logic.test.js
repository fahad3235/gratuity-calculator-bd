// gratuity-calculator-bd -- node unit tests for logic.js.
// Run: node --test tests/logic.test.js
// All expected numbers below were computed INDEPENDENTLY of logic.js by
// hand / closed-form arithmetic:
//   * gratuity = basic x multiplier x service years (completed years, or
//     total months / 12 when fractional counting is on);
//   * projection: basic_n = basic x (1 + inc/100)^n, years_n = years + n;
//     e.g. 50000 x 1.05^3 = 57,881.25; x 13 years = 752,456.25;
//     50000 x 1.05^5 = 63,814.078125 -> 6,381,408 paisa; x 15 = 957,211.20.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const L = require('../logic.js');

const T = '\u09f3'; // taka sign

const base = { basic: 50000, years: 10, months: 0, multiplier: 1, fractional: false, incrementPct: 0 };

// Case A: 50000 x 10y x 1 = 500,000 exactly.
test('A: 50000 x 10y x 1 = 500,000', () => {
  const r = L.computeGratuity(base);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.gratuityPaisa, 50000000);
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.completedYears, 10);
  assert.strictEqual(r.totalMonths, 120);
  assert.strictEqual(r.effectiveYears, 10);
  assert.strictEqual(r.projectedAt5Paisa, null);
  assert.strictEqual(r.breakdown.length, 10);
  assert.strictEqual(r.breakdown[4].cumulativePaisa, 25000000); // year 5 = 250,000
  assert.strictEqual(r.breakdown[9].cumulativePaisa, 50000000); // year 10 = 500,000
  assert.strictEqual(r.breakdown[0].accrualPaisa, 5000000);     // 50,000 per year
});

// Case B: fractional year -- 10y 6m with pro-rata = 50000 x 10.5 = 525,000;
// completed-years-only = 500,000. Partial row adds 25,000.
test('B: fractional vs completed years, 10y 6m', () => {
  const frac = L.computeGratuity({ ...base, months: 6, fractional: true });
  assert.strictEqual(frac.ok, true);
  assert.strictEqual(frac.gratuityPaisa, 52500000);
  assert.strictEqual(frac.effectiveYears, 10.5);
  assert.strictEqual(frac.breakdown.length, 11);
  const last = frac.breakdown[10];
  assert.strictEqual(last.partial, true);
  assert.strictEqual(last.months, 6);
  assert.strictEqual(last.accrualPaisa, 2500000);
  assert.strictEqual(last.cumulativePaisa, 52500000);

  const comp = L.computeGratuity({ ...base, months: 6, fractional: false });
  assert.strictEqual(comp.gratuityPaisa, 50000000);
  assert.strictEqual(comp.effectiveYears, 10);
  assert.strictEqual(comp.breakdown.length, 10);
});

// Case C: under 5 years -- 40000 x 3y = 120,000 shown, not eligible,
// projected at 5 years = 40000 x 5 = 200,000.
test('C: under 5 years not eligible, projected at 5y', () => {
  const r = L.computeGratuity({ basic: 40000, years: 3, months: 0, multiplier: 1, fractional: false, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.gratuityPaisa, 12000000);
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.projectedAt5Paisa, 20000000);
  assert.strictEqual(r.breakdown.length, 3);
});

// Case D: eligibility boundary -- 4y 11m (59 months) not eligible; 5y eligible.
test('D: eligibility boundary at 60 months', () => {
  const under = L.computeGratuity({ basic: 50000, years: 4, months: 11, multiplier: 1, fractional: false, incrementPct: 0 });
  assert.strictEqual(under.eligible, false);
  assert.strictEqual(under.projectedAt5Paisa, 25000000);
  const at = L.computeGratuity({ basic: 50000, years: 5, months: 0, multiplier: 1, fractional: false, incrementPct: 0 });
  assert.strictEqual(at.eligible, true);
  assert.strictEqual(at.gratuityPaisa, 25000000);
  assert.strictEqual(at.projectedAt5Paisa, null);
});

// Case E: multiplier 1.5 -- 50000 x 10 x 1.5 = 750,000.
test('E: multiplier 1.5', () => {
  const r = L.computeGratuity({ ...base, multiplier: 1.5 });
  assert.strictEqual(r.gratuityPaisa, 75000000);
  assert.strictEqual(r.breakdown[0].accrualPaisa, 7500000);
  const half = L.computeGratuity({ ...base, multiplier: 0.5 });
  assert.strictEqual(half.gratuityPaisa, 25000000);
});

// Case F: "stay longer" projection, no increment -- +1/+3/+5 years.
test('F: projection with 0% increment', () => {
  const p = L.projectFuture(base);
  assert.strictEqual(p.length, 3);
  assert.deepStrictEqual(p.map((r) => r.extraYears), [1, 3, 5]);
  assert.strictEqual(p[0].gratuityPaisa, 55000000); // 50000 x 11
  assert.strictEqual(p[1].gratuityPaisa, 65000000); // 50000 x 13
  assert.strictEqual(p[2].gratuityPaisa, 75000000); // 50000 x 15
});

// Case G: projection with 5% annual increment, hand-checked.
// +1: basic 52,500 x 11y = 577,500. +3: basic 57,881.25 x 13y = 752,456.25.
// +5: basic 63,814.078125 -> 6,381,408 paisa x 15y = 957,211.20.
test('G: projection with 5% increment', () => {
  const p = L.projectFuture({ ...base, incrementPct: 5 });
  assert.strictEqual(p[0].basicPaisa, 5250000);
  assert.strictEqual(p[0].gratuityPaisa, 57750000);
  assert.strictEqual(p[1].basicPaisa, 5788125);
  assert.strictEqual(p[1].gratuityPaisa, 75245625);
  assert.strictEqual(p[2].basicPaisa, 6381408);
  assert.strictEqual(p[2].gratuityPaisa, 95721120);
});

// Case H: fractional projection keeps the half year -- 10y 6m, 5% inc, +1:
// basic 52,500 x 11.5y = 603,750.
test('H: fractional projection keeps half year', () => {
  const p = L.projectFuture({ ...base, months: 6, fractional: true, incrementPct: 5 });
  assert.strictEqual(p[0].serviceYears, 11.5);
  assert.strictEqual(p[0].gratuityPaisa, 60375000);
});

// Validation
test('validation rejects bad inputs', () => {
  const bad = (over) => L.validateInputs({ ...base, ...over });
  assert.strictEqual(bad({ basic: 0 }).ok, false);
  assert.strictEqual(bad({ basic: -5 }).ok, false);
  assert.strictEqual(bad({ basic: NaN }).ok, false);
  assert.strictEqual(bad({ basic: 10000001 }).ok, false);
  assert.strictEqual(bad({ years: -1 }).ok, false);
  assert.strictEqual(bad({ years: 61 }).ok, false);
  assert.strictEqual(bad({ years: 2.5 }).ok, false);
  assert.strictEqual(bad({ months: -1 }).ok, false);
  assert.strictEqual(bad({ months: 12 }).ok, false);
  assert.strictEqual(bad({ months: 1.5 }).ok, false);
  assert.strictEqual(bad({ multiplier: 0.4 }).ok, false);
  assert.strictEqual(bad({ multiplier: 2.1 }).ok, false);
  assert.strictEqual(bad({ multiplier: NaN }).ok, false);
  assert.strictEqual(bad({ incrementPct: 21 }).ok, false);
  assert.strictEqual(bad({ incrementPct: -1 }).ok, false);
  const good = L.validateInputs(base);
  assert.strictEqual(good.ok, true);
  assert.deepStrictEqual(good.errors, {});
  const r = L.computeGratuity({ ...base, basic: 0 });
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.basic);
  assert.deepStrictEqual(L.yearlyBreakdown({ ...base, basic: 0 }), []);
  assert.deepStrictEqual(L.projectFuture({ ...base, basic: 0 }), []);
});

// Formatting
test('formatBDT EN and BN digits', () => {
  assert.strictEqual(L.formatBDT(50000000, 'en'), T + '500,000.00');
  assert.strictEqual(L.formatBDT(0, 'en'), T + '0.00');
  assert.strictEqual(L.formatBDT(75245625, 'en'), T + '752,456.25');
  assert.strictEqual(L.formatBDT(50000000, 'bn'), T + '\u09eb\u09e6\u09e6,\u09e6\u09e6\u09e6.\u09e6\u09e6');
  assert.strictEqual(L.toBnDigits('2026'), '\u09e8\u09e6\u09e8\u09ec');
});

// Export / import
test('export/import round-trip and strict rejection', () => {
  const entry = {
    name: '10-year plan',
    inputs: base,
    result: { gratuityPaisa: 50000000 },
    savedAt: '2026-11-09'
  };
  const payload = L.exportPayload([entry]);
  const parsed = JSON.parse(payload);
  assert.strictEqual(parsed.app, 'gratuity-calculator-bd');
  assert.strictEqual(parsed.version, 1);
  const imp = L.importPayload(payload);
  assert.strictEqual(imp.ok, true);
  assert.strictEqual(imp.history.length, 1);
  assert.strictEqual(imp.history[0].name, '10-year plan');

  assert.strictEqual(L.importPayload('not json').ok, false);
  assert.strictEqual(L.importPayload('{"app":"other","version":1,"history":[]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"gratuity-calculator-bd","version":2,"history":[]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"gratuity-calculator-bd","version":1,"history":"x"}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"gratuity-calculator-bd","version":1,"history":[{"name":"","inputs":{},"result":{},"savedAt":"x"}]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"gratuity-calculator-bd","version":1,"history":[{"name":"x","inputs":{"basic":50000,"years":10,"months":0,"multiplier":3,"fractional":false,"incrementPct":0},"result":{"gratuityPaisa":1},"savedAt":"2026-11-09"}]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"gratuity-calculator-bd","version":1,"history":[]}').ok, true);
});
