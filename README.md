# Gratuity Calculator BD

A static, fully offline, bilingual (English / বাংলা) gratuity calculator
for employees in Bangladesh. Estimate what you are owed when you leave a
job after years of service, see the year-by-year accrual, project what
staying longer is worth, and keep named scenarios on the device.

## Problem

Gratuity is a lump sum many Bangladeshi employees only think about when
they resign — and the standard rule (one month's basic per completed
year, after 5 years of continuous service) is easy to mis-apply: extra
months get counted or ignored, the 5-year eligibility line is missed,
and the value of staying one more year is invisible. This app makes the
rule transparent — every input is editable, the accrual is shown year
by year, and nothing is sent anywhere.

## Features

1. **Gratuity estimate** — last drawn basic salary (BDT), years +
   extra months of service, months-per-year multiplier (default 1,
   adjustable 0.5–2), toggle for "count fractional year" (pro-rata
   months) vs "completed years only". Shows the gratuity amount,
   completed years, total service, and an eligibility badge (eligible
   at 5+ years of continuous service; under 5 years it shows "not yet
   eligible under the standard rule" plus the projected gratuity at the
   5-year mark).
2. **Year-by-year accrual breakdown** — per completed year: basic used,
   that year's accrual, cumulative total; a pro-rata partial-year row
   appears when fractional counting is on and extra months exist.
3. **"Stay longer" projection** — annual basic increment % input;
   projects gratuity at +1, +3, +5 years with the basic grown by the
   increment each year.
4. **Saved scenarios** — save current inputs with a name to
   localStorage, list, load, delete; JSON export/import with strict
   validation; typed-`DELETE` erase-all.
5. **EN/বাংলা toggle** — persisted in localStorage; Bengali digits
   (০–৯) in all amounts; responsive 390px mobile layout with no
   horizontal overflow. Inline validation errors for every input.

## Stack

- Pure static HTML + CSS + vanilla JavaScript. No framework, no build
  step, no network requests at runtime (verified: 0 non-`file://`
  resources in the smoke test).
- Money is integer paisa internally (1 taka = 100 paisa); gratuity is
  rounded to the nearest paisa.
- Bengali text is stored as `\uXXXX` escapes in `app.js`, so all app
  sources are pure ASCII (`grep -P '[^\x00-\x7F]'` returns zero
  matches on `index.html`, `styles.css`, `app.js`, `logic.js`).

## Prerequisites

- Any modern browser (open `index.html`, or serve the folder).
- Node.js 18+ only for running the tests.

## Install / run

```sh
# No install step. Open directly:
open index.html
# or serve locally:
python3 -m http.server 8000   # then http://localhost:8000
```

## Dev commands

```sh
node --test tests/logic.test.js   # node unit tests (math)
node tests/smoke.js               # headless-Chrome smoke test (CDP, no puppeteer)
```

## Testing

See [TEST_RESULTS.md](TEST_RESULTS.md). Summary: **11/11 node unit
tests + 60/60 headless-Chrome smoke checks**, all passing. Unit tests
verify the math against independently hand-computed values (basic
50,000 × 10y × 1 = 500,000; fractional 10y 6m = 525,000; under-5-years
eligibility and 5-year projection; 5% increment projections hand-checked
to the paisa; multiplier 1.5; validation rejects negatives/NaN/out-of-range;
export/import round-trip + strict rejection). The smoke test drives the
real app in headless Chrome and checks calculator numbers, fractional
toggle, eligibility badge, projections, validation, scenario
save/delete + reload persistence, EN/BN toggle + persistence,
export → wipe → import round-trip, malformed-import rejection,
typed-DELETE erase, 390px no-overflow, zero network requests, and
zero console/page errors.

## Deployment

Static site — copy the folder to any static host (GitHub Pages,
Netlify, or any web server). No server-side code, no environment
variables, no secrets.

## Limitations / honest disclaimers

- **Educational estimate only.** This is not an official government
  figure and does not fetch any official rate or rule. The rule used
  here — one month's basic per completed year of service, payable
  after 5 years of continuous service — is the commonly described
  standard rule; real entitlement depends on your employer's policy,
  appointment letter, and applicable law. Verify with your employer
  or HR before relying on any number here.
- The multiplier and increment are user-entered assumptions; different
  employers pay different gratuity terms (some pay more than one
  month's basic per year, some pay nothing at all).
- The "stay longer" projection assumes the basic grows at a fixed
  annual increment and service continues uninterrupted; real pay
  growth and breaks in service will change the result.
- Scenarios and language live in the browser's localStorage on one
  device only; there is no account or sync.
- Maximums: basic 10,000,000 BDT, years 0–60, extra months 0–11,
  multiplier 0.5–2, increment 0–20%, 200 saved scenarios.

## Status

Complete MVP. All tests passing (see TEST_RESULTS.md). No known bugs.
