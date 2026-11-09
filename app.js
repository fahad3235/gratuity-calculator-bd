// gratuity-calculator-bd -- UI logic. Pure ASCII source; all Bengali strings
// live in I18N_BN below as \uXXXX escapes. No network requests; state in localStorage.
(function () {
  'use strict';

  var L = window.GratuityLogic;
  var LS_LANG = 'gcbd.lang';
  var LS_HIST = 'gcbd.history.v1';

  var I18N_EN = {
    title: 'Gratuity Calculator',
    subtitle: 'Gratuity estimate for employees in Bangladesh \u2014 fully offline',
    tabCalc: 'Calculator',
    tabScenarios: 'Saved scenarios',
    tabData: 'Data',
    langBtn: '\u09ac\u09be\u0982\u09b2\u09be',
    calcHeading: 'Gratuity estimate',
    lblBasic: 'Last drawn basic salary (BDT)',
    lblYears: 'Years of service',
    lblMonths: 'Extra months of service (0\u201311)',
    lblMultiplier: 'Months of basic per year of service (0.5\u20132)',
    multNote: 'Standard rule: 1 month\u2019s basic per completed year. Adjust only if your employer\u2019s rule differs.',
    lblIncrement: 'Annual basic increment (% \u2014 optional, for projections)',
    lblFractional: 'Count fractional year (pro-rata months)',
    calcBtn: 'Calculate',
    resGratuity: 'Gratuity amount',
    resCompleted: 'Completed years',
    resService: 'Total service',
    resProj5: 'Gratuity at 5 years',
    eligible: 'Eligible \u2014 5 years of service completed',
    notEligible: 'Not yet eligible \u2014 the standard rule needs 5 years of continuous service',
    breakdownHeading: 'Year-by-year accrual',
    colYear: 'Year',
    colBasic: 'Basic used',
    colAccrual: 'This year\u2019s accrual',
    colCumulative: 'Cumulative',
    projHeading: 'Stay longer \u2014 projection',
    colExtra: 'Stay longer',
    colFutureBasic: 'Future basic',
    colFutureYears: 'Total years',
    colFutureGratuity: 'Gratuity',
    saveLabelPh: 'Name, e.g. 10-year plan',
    saveBtn: 'Save scenario',
    savedMsg: 'Saved.',
    disclaimer: 'Educational estimate only \u2014 this is not an official government figure. The standard rule used here is one month\u2019s basic per completed year of service, payable after 5 years of continuous service. Check the real rules and rates with your employer or HR.',
    histHeading: 'Saved scenarios',
    histEmpty: 'No scenarios saved yet.',
    loadBtn: 'Load',
    delBtn: 'Delete',
    deletedMsg: 'Deleted.',
    dataHeading: 'Export / import / erase data',
    exportBtn: 'Download JSON',
    importBtn: 'Import',
    importPh: 'Paste JSON here\u2026',
    importOk: 'Import successful.',
    importFail: 'Import failed: ',
    eraseLabel: 'Type DELETE to erase everything',
    eraseBtn: 'Erase all data',
    erasedMsg: 'All data erased.',
    eraseWrong: 'Type DELETE exactly.',
    errBasic: 'Enter the last basic salary.',
    errBasicPos: 'Basic salary must be more than 0.',
    errBasicMax: 'Basic salary is too large (max 10,000,000).',
    errYears: 'Years of service must be 0\u201360.',
    errMonths: 'Extra months must be 0\u201311.',
    errMultiplier: 'Multiplier must be 0.5\u20132.',
    errIncrement: 'Annual increment must be 0\u201320%.',
    monthsLabel: 'months',
    yearsLabel: 'years',
    partialYear: 'partial year',
    extraYearsSuffix: ' more year'
  };

  var I18N_BN = {
  title: "\u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf \u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0",
  subtitle: "\u09ac\u09be\u0982\u09b2\u09be\u09a6\u09c7\u09b6\u09c7 \u099a\u09be\u0995\u09b0\u09bf\u099c\u09c0\u09ac\u09c0\u09a6\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf \u09b9\u09bf\u09b8\u09be\u09ac \u2014 \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u0985\u09ab\u09b2\u09be\u0987\u09a8",
  tabCalc: "\u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0",
  tabScenarios: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09bf\u09b8\u09be\u09ac",
  tabData: "\u09a4\u09a5\u09cd\u09af",
  langBtn: "English",
  calcHeading: "\u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf \u09b9\u09bf\u09b8\u09be\u09ac",
  lblBasic: "\u09b6\u09c7\u09b7 \u09ae\u09be\u09b8\u09c7\u09b0 \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8 (\u099f\u09be\u0995\u09be)",
  lblYears: "\u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09ae\u09c7\u09af\u09bc\u09be\u09a6 \u2014 \u09ac\u099b\u09b0",
  lblMonths: "\u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09ae\u09c7\u09af\u09bc\u09be\u09a6 \u2014 \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u09ae\u09be\u09b8 (\u09e6\u2013\u09e7\u09e7)",
  lblMultiplier: "\u09aa\u09cd\u09b0\u09a4\u09bf \u09ac\u099b\u09b0\u09c7 \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8\u09c7\u09b0 \u09ae\u09be\u09b8\u09c7\u09b0 \u0997\u09c1\u09a3\u0995 (\u09e6.\u09eb\u2013\u09e8)",
  multNote: "\u09aa\u09cd\u09b0\u09ae\u09bf\u09a4 \u09a8\u09bf\u09af\u09bc\u09ae: \u09aa\u09cd\u09b0\u09a4\u09bf \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u09ac\u099b\u09b0\u09c7 \u09e7 \u09ae\u09be\u09b8\u09c7\u09b0 \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8\u0964 \u0986\u09aa\u09a8\u09be\u09b0 \u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be\u09b0 \u09a8\u09bf\u09af\u09bc\u09ae \u09ad\u09bf\u09a8\u09cd\u09a8 \u09b9\u09b2\u09c7 \u09a4\u09ac\u09c7\u0987 \u09ac\u09a6\u09b2\u09be\u09a8\u0964",
  lblIncrement: "\u09ac\u09be\u09b0\u09cd\u09b7\u09bf\u0995 \u09ac\u09c7\u09a4\u09a8 \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf (% \u2014 \u0990\u099a\u09cd\u099b\u09bf\u0995, \u09aa\u09cd\u09b0\u0995\u09cd\u09b7\u09c7\u09aa\u09a3\u09c7\u09b0 \u099c\u09a8\u09cd\u09af)",
  lblFractional: "\u09ad\u0997\u09cd\u09a8\u09be\u0982\u09b6 \u09ac\u099b\u09b0 \u0997\u09c1\u09a8\u09c1\u09a8 (\u09ae\u09be\u09b8\u09b8\u09b9 \u09b9\u09bf\u09b8\u09be\u09ac)",
  calcBtn: "\u09b9\u09bf\u09b8\u09be\u09ac \u0995\u09b0\u09c1\u09a8",
  resGratuity: "\u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf\u09b0 \u09aa\u09b0\u09bf\u09ae\u09be\u09a3",
  resCompleted: "\u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u09ac\u099b\u09b0",
  resService: "\u09ae\u09cb\u099f \u099a\u09be\u0995\u09b0\u09bf\u0995\u09be\u09b2",
  resProj5: "\u09eb \u09ac\u099b\u09b0 \u09aa\u09c2\u09b0\u09cd\u09a3 \u09b9\u09b2\u09c7 \u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf",
  eligible: "\u09af\u09cb\u0997\u09cd\u09af \u2014 \u09eb \u09ac\u099b\u09b0 \u099a\u09be\u0995\u09b0\u09bf \u09aa\u09c2\u09b0\u09cd\u09a3 \u09b9\u09af\u09bc\u09c7\u099b\u09c7",
  notEligible: "\u098f\u0996\u09a8\u09cb \u09af\u09cb\u0997\u09cd\u09af \u09a8\u09af\u09bc \u2014 \u09aa\u09cd\u09b0\u09ae\u09bf\u09a4 \u09a8\u09bf\u09af\u09bc\u09ae\u09c7 \u09eb \u09ac\u099b\u09b0 \u098f\u0995\u099f\u09be\u09a8\u09be \u099a\u09be\u0995\u09b0\u09bf \u09b2\u09be\u0997\u09ac\u09c7",
  breakdownHeading: "\u09ac\u099b\u09b0\u09ad\u09bf\u09a4\u09cd\u09a4\u09bf\u0995 \u09b9\u09bf\u09b8\u09be\u09ac",
  colYear: "\u09ac\u099b\u09b0",
  colBasic: "\u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8",
  colAccrual: "\u0990 \u09ac\u099b\u09b0\u09c7\u09b0 \u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf",
  colCumulative: "\u09ae\u09cb\u099f \u099c\u09ae\u09be",
  projHeading: "\u0986\u09b0\u0993 \u09a5\u09be\u0995\u09b2\u09c7 \u0995\u09a4 \u09b9\u09ac\u09c7",
  colExtra: "\u0986\u09b0\u0993 \u09a5\u09be\u0995\u09b2\u09c7",
  colFutureBasic: "\u09ad\u09ac\u09bf\u09b7\u09cd\u09af\u09ce \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8",
  colFutureYears: "\u09ae\u09cb\u099f \u09ac\u099b\u09b0",
  colFutureGratuity: "\u0997\u09cd\u09b0\u09cd\u09af\u09be\u099a\u09c1\u0987\u099f\u09bf",
  saveLabelPh: "\u09a8\u09be\u09ae \u09b2\u09bf\u0996\u09c1\u09a8 (\u09af\u09c7\u09ae\u09a8: \u09e7\u09e6 \u09ac\u099b\u09b0\u09c7\u09b0 \u09b9\u09bf\u09b8\u09be\u09ac)",
  saveBtn: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09c1\u09a8",
  savedMsg: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  disclaimer: "\u09b6\u09bf\u0995\u09cd\u09b7\u09be\u09ae\u09c2\u09b2\u0995 \u0985\u09a8\u09c1\u09ae\u09be\u09a8 \u09ae\u09be\u09a4\u09cd\u09b0 \u2014 \u098f\u099f\u09bf \u0995\u09cb\u09a8\u09cb \u09b8\u09b0\u0995\u09be\u09b0\u09bf \u09a8\u09bf\u09af\u09bc\u09ae \u09a8\u09af\u09bc\u0964 \u098f\u0996\u09be\u09a8\u09c7 \u09ac\u09cd\u09af\u09ac\u09b9\u09c3\u09a4 \u09aa\u09cd\u09b0\u09ae\u09bf\u09a4 \u09a8\u09bf\u09af\u09bc\u09ae: \u09aa\u09cd\u09b0\u09a4\u09bf \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u09ac\u099b\u09b0\u09c7 \u09e7 \u09ae\u09be\u09b8\u09c7\u09b0 \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8, \u09eb \u09ac\u099b\u09b0 \u098f\u0995\u099f\u09be\u09a8\u09be \u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09aa\u09b0 \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u0964 \u0986\u09b8\u09b2 \u09a8\u09bf\u09af\u09bc\u09ae \u0993 \u09b9\u09be\u09b0 \u0986\u09aa\u09a8\u09be\u09b0 \u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be \u09ac\u09be \u098f\u0987\u099a\u0986\u09b0-\u098f\u09b0 \u0995\u09be\u099b\u09c7 \u09af\u09be\u099a\u09be\u0987 \u0995\u09b0\u09c1\u09a8\u0964",
  histHeading: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09bf\u09b8\u09be\u09ac",
  histEmpty: "\u098f\u0996\u09a8\u09cb \u0995\u09cb\u09a8\u09cb \u09b9\u09bf\u09b8\u09be\u09ac \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09a8\u09bf\u0964",
  loadBtn: "\u0996\u09c1\u09b2\u09c1\u09a8",
  delBtn: "\u09ae\u09c1\u099b\u09c1\u09a8",
  deletedMsg: "\u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  dataHeading: "\u09a4\u09a5\u09cd\u09af \u09b0\u09aa\u09cd\u09a4\u09be\u09a8\u09bf / \u0986\u09ae\u09a6\u09be\u09a8\u09bf / \u09ae\u09c1\u099b\u09c1\u09a8",
  exportBtn: "JSON \u09a1\u09be\u0989\u09a8\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8",
  importBtn: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u0995\u09b0\u09c1\u09a8",
  importPh: "\u098f\u0996\u09be\u09a8\u09c7 JSON \u09ac\u09b8\u09be\u09a8\u2026",
  importOk: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u09b8\u09ab\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  importFail: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u09ac\u09cd\u09af\u09b0\u09cd\u09a5: ",
  eraseLabel: "\u09b8\u09ac \u09ae\u09c1\u099b\u09a4\u09c7 DELETE \u09b2\u09bf\u0996\u09c1\u09a8",
  eraseBtn: "\u09b8\u09ac \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09c1\u09a8",
  erasedMsg: "\u09b8\u09ac \u09a4\u09a5\u09cd\u09af \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  eraseWrong: "DELETE \u09b8\u09a0\u09bf\u0995\u09ad\u09be\u09ac\u09c7 \u09b2\u09bf\u0996\u09c1\u09a8\u0964",
  errBasic: "\u09b6\u09c7\u09b7 \u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8 \u09a6\u09bf\u09a8\u0964",
  errBasicPos: "\u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8 \u09e6-\u098f\u09b0 \u09ac\u09c7\u09b6\u09bf \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errBasicMax: "\u09ae\u09c2\u09b2 \u09ac\u09c7\u09a4\u09a8 \u0985\u09a8\u09c7\u0995 \u09ac\u09c7\u09b6\u09bf (\u09b8\u09b0\u09cd\u09ac\u09cb\u099a\u09cd\u099a \u09e7\u09e6,\u09e6\u09e6\u09e6,\u09e6\u09e6\u09e6)\u0964",
  errYears: "\u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09ae\u09c7\u09af\u09bc\u09be\u09a6 \u09e6\u2013\u09ec\u09e6 \u09ac\u099b\u09b0 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errMonths: "\u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u09ae\u09be\u09b8 \u09e6\u2013\u09e7\u09e7 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errMultiplier: "\u0997\u09c1\u09a3\u0995 \u09e6.\u09eb\u2013\u09e8 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errIncrement: "\u09ac\u09be\u09b0\u09cd\u09b7\u09bf\u0995 \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u09e6\u2013\u09e8\u09e6% \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  monthsLabel: "\u09ae\u09be\u09b8",
  yearsLabel: "\u09ac\u099b\u09b0",
  partialYear: "\u0986\u0982\u09b6\u09bf\u0995 \u09ac\u099b\u09b0",
  extraYearsSuffix: " \u09ac\u099b\u09b0 \u0986\u09b0\u0993"
};

  var state = {
    lang: 'en',
    history: [],
    lastResult: null,
    lastInputs: null
  };

  function $(id) { return document.getElementById(id); }

  function t(key) {
    var dict = state.lang === 'bn' ? I18N_BN : I18N_EN;
    return dict[key] || I18N_EN[key] || key;
  }

  function fmt(paisa) { return L.formatBDT(paisa, state.lang); }

  function d(n) { return state.lang === 'bn' ? L.toBnDigits(String(n)) : String(n); }

  function loadState() {
    try {
      var lang = localStorage.getItem(LS_LANG);
      if (lang === 'bn' || lang === 'en') state.lang = lang;
    } catch (e) { /* storage unavailable: stay English */ }
    try {
      var raw = localStorage.getItem(LS_HIST);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state.history = parsed.filter(L.validHistoryEntry);
      }
    } catch (e) { state.history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(LS_HIST, JSON.stringify(state.history)); } catch (e) { /* ignore */ }
  }

  function saveLang() {
    try { localStorage.setItem(LS_LANG, state.lang); } catch (e) { /* ignore */ }
  }

  // ---- i18n application ----
  var TEXT_MAP = [
    ['title', 'title'], ['subtitle', 'subtitle'],
    ['tabbtn-calc', 'tabCalc'], ['tabbtn-scenarios', 'tabScenarios'],
    ['tabbtn-data', 'tabData'], ['langBtn', 'langBtn'],
    ['calcHeading', 'calcHeading'], ['lblBasic', 'lblBasic'],
    ['lblYears', 'lblYears'], ['lblMonths', 'lblMonths'],
    ['lblMultiplier', 'lblMultiplier'], ['multNote', 'multNote'],
    ['lblIncrement', 'lblIncrement'], ['lblFractional', 'lblFractional'],
    ['calcBtn', 'calcBtn'], ['resGratuityLabel', 'resGratuity'],
    ['resCompletedLabel', 'resCompleted'], ['resServiceLabel', 'resService'],
    ['resProj5Label', 'resProj5'],
    ['breakdownHeading', 'breakdownHeading'],
    ['colYear', 'colYear'], ['colBasic', 'colBasic'],
    ['colAccrual', 'colAccrual'], ['colCumulative', 'colCumulative'],
    ['projHeading', 'projHeading'], ['colExtra', 'colExtra'],
    ['colFutureBasic', 'colFutureBasic'], ['colFutureYears', 'colFutureYears'],
    ['colFutureGratuity', 'colFutureGratuity'],
    ['saveBtn', 'saveBtn'], ['savedMsg', 'savedMsg'],
    ['disclaimer', 'disclaimer'],
    ['histHeading', 'histHeading'], ['histEmpty', 'histEmpty'],
    ['deletedMsg', 'deletedMsg'], ['dataHeading', 'dataHeading'],
    ['exportBtn', 'exportBtn'], ['importBtn', 'importBtn'],
    ['importOk', 'importOk'], ['eraseLabel', 'eraseLabel'],
    ['eraseBtn', 'eraseBtn'], ['erasedMsg', 'erasedMsg'],
    ['eraseWrong', 'eraseWrong']
  ];

  function applyI18n() {
    document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
    TEXT_MAP.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.textContent = t(pair[1]);
    });
    var saveName = $('saveName');
    if (saveName) saveName.placeholder = t('saveLabelPh');
    var importText = $('importText');
    if (importText) importText.placeholder = t('importPh');
    document.title = t('title') + ' BD';
    renderHistory();
    if (state.lastResult) renderResults(state.lastResult);
  }

  // ---- tabs ----
  function showTab(name) {
    ['calc', 'scenarios', 'data'].forEach(function (n) {
      var panel = $('tab-' + n);
      var btn = $('tabbtn-' + n);
      if (panel) panel.hidden = (n !== name);
      if (btn) btn.classList.toggle('active', n === name);
    });
    if (name === 'scenarios') renderHistory();
  }

  // ---- calculator ----
  function readCalcInputs() {
    function num(id) {
      var v = $(id).value.trim();
      return v === '' ? NaN : Number(v);
    }
    return {
      basic: num('basicInput'),
      years: num('yearsInput'),
      months: num('monthsInput'),
      multiplier: num('multiplierInput'),
      fractional: $('fractionalInput').checked,
      incrementPct: ($('incInput').value.trim() === '' ? 0 : num('incInput'))
    };
  }

  function showFieldErrors(errors) {
    var map = {
      basic: 'err-basic', years: 'err-years', months: 'err-months',
      multiplier: 'err-multiplier', incrementPct: 'err-incrementPct'
    };
    var msgKey = {
      basic: 'errBasic', years: 'errYears', months: 'errMonths',
      multiplier: 'errMultiplier', incrementPct: 'errIncrement'
    };
    var any = false;
    Object.keys(map).forEach(function (field) {
      var el = $(map[field]);
      if (!el) return;
      if (errors[field]) {
        el.textContent = t(msgKey[field]);
        el.hidden = false;
        any = true;
      } else {
        el.hidden = true;
      }
    });
    return any;
  }

  function renderResults(res) {
    $('resGratuity').textContent = fmt(res.gratuityPaisa);
    var badge = $('eligBadge');
    badge.textContent = res.eligible ? t('eligible') : t('notEligible');
    badge.className = 'badge ' + (res.eligible ? 'eligible' : 'not-eligible');
    badge.hidden = false;
    $('resCompleted').textContent = d(res.completedYears);
    var service = d(res.completedYears) + ' ' + t('yearsLabel');
    if (res.months > 0) service += ' ' + d(res.months) + ' ' + t('monthsLabel');
    $('resService').textContent = service;
    var proj5 = $('proj5Stat');
    if (res.eligible) {
      proj5.hidden = true;
    } else {
      $('resProj5').textContent = fmt(res.projectedAt5Paisa);
      proj5.hidden = false;
    }
    var body = $('breakdownBody');
    body.innerHTML = '';
    res.breakdown.forEach(function (row) {
      var tr = document.createElement('tr');
      if (row.partial) tr.className = 'partial-row';
      var label = row.partial
        ? (state.lang === 'bn'
            ? d(row.year) + ' \u09a8\u09ae \u09ac\u099b\u09b0 (' + t('partialYear') + ', ' + d(row.months) + ' ' + t('monthsLabel') + ')'
            : 'Year ' + row.year + ' (' + t('partialYear') + ', ' + row.months + ' ' + t('monthsLabel') + ')')
        : d(row.year);
      [label, fmt(row.basicPaisa), fmt(row.accrualPaisa), fmt(row.cumulativePaisa)]
        .forEach(function (txt) {
          var td = document.createElement('td');
          td.textContent = txt;
          tr.appendChild(td);
        });
      body.appendChild(tr);
    });
    var pbody = $('projBody');
    pbody.innerHTML = '';
    res.projection.forEach(function (row) {
      var tr = document.createElement('tr');
      var extra = state.lang === 'bn'
        ? '+' + d(row.extraYears) + ' ' + t('yearsLabel')
        : '+' + row.extraYears + t('extraYearsSuffix');
      var yrs = row.serviceYears;
      var yrsTxt = (Math.floor(yrs) === yrs) ? d(yrs) : d(yrs.toFixed(1));
      [extra, fmt(row.basicPaisa), yrsTxt, fmt(row.gratuityPaisa)]
        .forEach(function (txt) {
          var td = document.createElement('td');
          td.textContent = txt;
          tr.appendChild(td);
        });
      pbody.appendChild(tr);
    });
    $('results').hidden = false;
  }

  function runCalc() {
    var inputs = readCalcInputs();
    var v = L.validateInputs(inputs);
    showFieldErrors(v.errors);
    if (!v.ok) {
      $('results').hidden = true;
      state.lastResult = null;
      return false;
    }
    var res = L.computeGratuity(inputs);
    state.lastInputs = inputs;
    state.lastResult = res;
    renderResults(res);
    $('savedMsg').hidden = true;
    return true;
  }

  // ---- history ----
  function renderHistory() {
    var list = $('histList');
    list.innerHTML = '';
    $('histEmpty').hidden = state.history.length !== 0;
    state.history.forEach(function (entry, idx) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.className = 'h-name';
      name.textContent = entry.name;
      var meta = document.createElement('span');
      meta.className = 'h-meta';
      var inp = entry.inputs;
      meta.textContent = entry.savedAt + ' \u00b7 ' + d(inp.basic) + ' \u00b7 ' +
        d(inp.years) + 'y ' + d(inp.months) + 'm \u00b7 x' + inp.multiplier;
      var amt = document.createElement('span');
      amt.className = 'h-amt';
      amt.textContent = fmt(entry.result.gratuityPaisa);
      var load = document.createElement('button');
      load.type = 'button';
      load.textContent = t('loadBtn');
      load.addEventListener('click', function () {
        var inp = entry.inputs;
        $('basicInput').value = inp.basic;
        $('yearsInput').value = inp.years;
        $('monthsInput').value = inp.months;
        $('multiplierInput').value = inp.multiplier;
        $('fractionalInput').checked = !!inp.fractional;
        $('incInput').value = inp.incrementPct || 0;
        showTab('calc');
        runCalc();
      });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = t('delBtn');
      del.addEventListener('click', function () {
        state.history.splice(idx, 1);
        saveHistory();
        renderHistory();
        $('deletedMsg').hidden = false;
      });
      li.appendChild(name);
      li.appendChild(meta);
      li.appendChild(amt);
      li.appendChild(load);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  function saveCurrent() {
    if (!state.lastResult || !state.lastInputs) return;
    var name = $('saveName').value.trim() || ('Plan ' + (state.history.length + 1));
    var entry = {
      name: name.slice(0, 80),
      inputs: state.lastInputs,
      result: { gratuityPaisa: state.lastResult.gratuityPaisa },
      savedAt: new Date().toISOString().slice(0, 10)
    };
    if (!L.validHistoryEntry(entry)) return;
    state.history.unshift(entry);
    saveHistory();
    $('saveName').value = '';
    $('savedMsg').hidden = false;
  }

  // ---- data ----
  function doExport() {
    var payload = L.exportPayload(state.history);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = $('exportLink');
    a.href = url;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function doImport() {
    var text = $('importText').value;
    var res = L.importPayload(text);
    $('importOk').hidden = true;
    $('importFail').hidden = true;
    if (!res.ok) {
      $('importFail').textContent = t('importFail') + res.error;
      $('importFail').hidden = false;
      return false;
    }
    state.history = res.history;
    saveHistory();
    renderHistory();
    $('importText').value = '';
    $('importOk').hidden = false;
    return true;
  }

  function doErase() {
    var v = $('eraseInput').value.trim();
    if (v !== 'DELETE') {
      $('eraseWrong').hidden = false;
      $('erasedMsg').hidden = true;
      return false;
    }
    state.history = [];
    state.lastResult = null;
    state.lastInputs = null;
    saveHistory();
    $('results').hidden = true;
    $('eraseInput').value = '';
    $('eraseWrong').hidden = true;
    $('erasedMsg').hidden = false;
    renderHistory();
    return true;
  }

  // ---- wire up ----
  function init() {
    loadState();
    applyI18n();
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () { showTab(btn.dataset.tab); });
    });
    $('langBtn').addEventListener('click', function () {
      state.lang = state.lang === 'bn' ? 'en' : 'bn';
      saveLang();
      applyI18n();
    });
    $('calcForm').addEventListener('submit', function (e) { e.preventDefault(); runCalc(); });
    $('saveBtn').addEventListener('click', saveCurrent);
    $('exportBtn').addEventListener('click', doExport);
    $('importBtn').addEventListener('click', doImport);
    $('eraseBtn').addEventListener('click', doErase);
    runCalc();
  }

  // Test hooks (used by tests/smoke.js; harmless in normal use).
  window.__gcbd = {
    state: state,
    computeGratuity: L.computeGratuity,
    yearlyBreakdown: L.yearlyBreakdown,
    projectFuture: L.projectFuture,
    exportPayload: function () { return L.exportPayload(state.history); },
    importPayload: function (text) {
      var r = L.importPayload(text);
      if (r.ok) { state.history = r.history; saveHistory(); renderHistory(); }
      return r;
    },
    eraseAll: function () {
      state.history = [];
      state.lastResult = null;
      state.lastInputs = null;
      saveHistory();
      $('results').hidden = true;
      renderHistory();
    },
    runCalc: runCalc
  };

  document.addEventListener('DOMContentLoaded', init);
})();
