# TEST_RESULTS.md — gratuity-calculator-bd

Run date: 2026-11-09 (Asia/Dhaka). All results below are from real runs
on this machine, not invented.

## Node unit tests — 11/11 pass

Command: `node --test tests/logic.test.js` (Node v24.22.1)

| # | Test | Result |
|---|------|--------|
| 1 | A: 50000 x 10y x 1 = 500,000 | pass |
| 2 | B: fractional vs completed years, 10y 6m | pass |
| 3 | C: under 5 years not eligible, projected at 5y | pass |
| 4 | D: eligibility boundary at 60 months | pass |
| 5 | E: multiplier 1.5 | pass |
| 6 | F: projection with 0% increment | pass |
| 7 | G: projection with 5% increment | pass |
| 8 | H: fractional projection keeps half year | pass |
| 9 | validation rejects bad inputs | pass |
| 10 | formatBDT EN and BN digits | pass |
| 11 | export/import round-trip and strict rejection | pass |

## Hand-verified numbers (computed independently of `logic.js`)

Gratuity = basic × multiplier × service years (completed years, or
total months / 12 when fractional counting is on). Projection:
basic_n = basic × (1 + inc/100)^n, years_n = years + n.

- **Case A** — 50000 × 10y × 1: gratuity **৳500,000.00** exactly;
  year-5 cumulative **৳250,000.00**; year-10 cumulative **৳500,000.00**;
  ৳50,000.00 accrued per year.
- **Case B** — 50000, 10y 6m: completed-only **৳500,000.00**;
  fractional **৳525,000.00** (50000 × 10.5); partial-year row accrues
  **৳25,000.00** and the breakdown has 11 rows.
- **Case C** — 40000 × 3y: gratuity **৳120,000.00**, not eligible
  (36 < 60 months); projected at 5 years **৳200,000.00**.
- **Case D** — eligibility boundary: 4y 11m (59 months) not eligible,
  projected **৳250,000.00** at 5y; 5y 0m eligible, **৳250,000.00**.
- **Case E** — multiplier 1.5: 50000 × 10 × 1.5 = **৳750,000.00**;
  multiplier 0.5 → **৳250,000.00**.
- **Case F** — projection, 0% increment: +1y **৳550,000.00**;
  +3y **৳650,000.00**; +5y **৳750,000.00**.
- **Case G** — projection, 5% increment: +1y basic ৳52,500.00 × 11y =
  **৳577,500.00**; +3y basic ৳57,881.25 × 13y = **৳752,456.25**;
  +5y basic ৳63,814.08 (6,381,408 paisa) × 15y = **৳957,211.20**.
- **Case H** — fractional projection: 10y 6m, 5% inc, +1y:
  basic ৳52,500.00 × 11.5y = **৳603,750.00**.
- **Formatting** — ৳500,000.00 EN; ৳৫০০,০০০.০০ in Bengali digits.

## Headless-Chrome smoke test — 60/60 pass

Command: `node tests/smoke.js` (raw CDP against the Playwright
`chromium_headless_shell-1187` binary; `file://` + `?asof=2026-11-09`).

Covered, all passing:
- Page loads; 3 tabs; disclaimer renders and names the check-with-employer rule.
- Default calculator numbers match the unit tests exactly
  (gratuity ৳500,000.00; eligible badge; completed years 10;
  10-row breakdown; year-5 cumulative ৳250,000.00; projection
  +1y ৳550,000.00 / +5y ৳750,000.00).
- 5% increment projections in the live UI: +1y ৳577,500.00,
  +3y ৳752,456.25.
- Fractional toggle: 10y 6m completed-only ৳500,000.00 (10 rows);
  fractional ৳525,000.00 with an 11th partial row accruing ৳25,000.00.
- Multiplier 1.5 in the live UI: ৳750,000.00.
- Under 5 years in the live UI: 40000 × 3y → ৳120,000.00,
  "Not yet eligible" badge, 5-year projection stat ৳200,000.00.
- Inline validation: zero basic shows an error and hides results;
  a valid recalculation restores them.
- Scenarios: save → list → reload persistence → delete → empty state.
- Export → wipe → import round-trip; wrong-app and malformed-JSON
  imports rejected with existing data intact.
- Typed-DELETE erase: wrong word rejected (data kept), `DELETE` erases.
- EN/বাংলা toggle: Bengali title/tab labels, Bengali-digit totals
  (৳৫০০,০০০.০০), language persists across reload.
- 390px mobile: no horizontal overflow on calc, scenarios, and data tabs.
- Zero non-`file://` network requests; zero console/page errors.

## Repairs made

None. Both test suites passed on their first run (11/11 unit,
60/60 smoke). No app code was changed after the tests were written.

## Final state

- Node unit tests: **11/11 pass, 0 fail**
- Headless-Chrome smoke: **60/60 checks, 0 failed**
- App sources pure ASCII: verified by grep (0 matches)
- No secrets, no network requests, ships with empty history
