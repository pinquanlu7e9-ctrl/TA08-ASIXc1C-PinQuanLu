/* Funcions de càlcul de la calculadora energètica. */

const TA08Calc = (() => {
  function toNumber(value) { return Number.parseFloat(value) || 0; }

  function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function parseMonth(monthId) {
    const [year, month] = monthId.split("-").map(Number);
    return { year, month };
  }

  function monthIndex(monthId) {
    const month = Number(monthId.split("-")[1]);
    return Number.isFinite(month) ? month - 1 : 0;
  }

  function monthDistance(baseMonth, targetMonth) {
    const base = parseMonth(baseMonth);
    const target = parseMonth(targetMonth);
    return (target.year - base.year) * 12 + (target.month - base.month);
  }

  function getIndicator(key) { return TA08_DATA.indicators[key]; }

  function monthLabel(monthId) {
    const [year, month] = monthId.split("-");
    return `${TA08_DATA.monthNames[month]} ${year}`;
  }

  function shortMonthLabel(monthId) {
    const [year, month] = monthId.split("-");
    return `${TA08_DATA.monthNames[month].slice(0, 3)} ${year.slice(2)}`;
  }

  function buildMonthList(startMonth, endMonth) {
    const start = parseMonth(startMonth);
    const end = parseMonth(endMonth);
    const list = [];
    let y = start.year;
    let m = start.month;
    while (y < end.year || (y === end.year && m <= end.month)) {
      list.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return list;
  }

  function deterministicVariation(indicatorKey, monthNumber, yearOffset = 0) {
    const seedMap = { electricitat: 1.3, aigua: 2.1, material_oficina: 2.9, productes_neteja: 3.7 };
    const seed = seedMap[indicatorKey] || 1;
    return 1 + Math.sin((monthNumber + yearOffset * 2.4) * seed) * 0.025;
  }

  function projectMonthValue(indicatorKey, targetMonthId) {
    const indicator = getIndicator(indicatorKey);
    const monthNumber = monthIndex(targetMonthId) + 1;
    const baseValue = indicator.values[monthNumber - 1];
    const baseMonth = `2024-${String(monthNumber).padStart(2, "0")}`;
    const years = Math.max(0, monthDistance(baseMonth, targetMonthId) / 12);
    const trendFactor = 1 + indicator.annualTrend * years;
    const variation = deterministicVariation(indicatorKey, monthNumber, years);
    return round(baseValue * trendFactor * variation, 2);
  }

  function calculatePeriod(indicatorKey, startMonth, endMonth) {
    const months = buildMonthList(startMonth, endMonth);
    const values = months.map(month => projectMonthValue(indicatorKey, month));
    const total = values.reduce((sum, value) => sum + value, 0);
    return { months, values, total: round(total, 2) };
  }

  function calculateAnnualForecast(indicatorKey, year = 2025) {
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    const values = months.map(month => projectMonthValue(indicatorKey, month));
    const total = values.reduce((sum, value) => sum + value, 0);
    return { months, values, total: round(total, 2) };
  }

  function effectiveReduction(indicatorKey, globalTarget = 30) {
    const indicator = getIndicator(indicatorKey);
    const scale = globalTarget / 30;
    return Math.min(0.45, indicator.reductionTarget * scale);
  }

  function calculateSavings(indicatorKey, amount, globalTarget = 30) {
    const reduction = effectiveReduction(indicatorKey, globalTarget);
    const improved = round(amount * (1 - reduction), 2);
    return {
      base: round(amount, 2),
      improved,
      saving: round(amount - improved, 2),
      savingPercent: round(reduction * 100, 1)
    };
  }

  function calculateCost(indicatorKey, amount) { return round(amount * getIndicator(indicatorKey).cost, 2); }
  function calculateEmissions(indicatorKey, amount) { return round(amount * getIndicator(indicatorKey).emissionFactor, 2); }

  function formatAmount(indicatorKey, amount) {
    const indicator = getIndicator(indicatorKey);
    const decimals = indicator.unit === "u." ? 1 : 0;
    return `${round(amount, decimals).toLocaleString("ca-ES")} ${indicator.unit}`;
  }

  function formatPlain(value, decimals = 0) { return round(value, decimals).toLocaleString("ca-ES"); }
  function formatCost(value) { return `${round(value, 2).toLocaleString("ca-ES")} €`; }
  function formatEmissions(value) { return `${round(value, 2).toLocaleString("ca-ES")} kg CO₂`; }

  function mandatoryCalculations(globalTarget = 30) {
    const rows = [];
    const periodStart = "2024-09";
    const periodEnd = "2025-06";
    Object.keys(TA08_DATA.indicators).forEach(key => {
      const indicator = getIndicator(key);
      const annual = calculateAnnualForecast(key, 2025);
      const annualSavings = calculateSavings(key, annual.total, globalTarget);
      rows.push({
        indicator: indicator.label,
        type: "Consum del pròxim any",
        base: formatAmount(key, annualSavings.base),
        improved: formatAmount(key, annualSavings.improved),
        saving: `${formatAmount(key, annualSavings.saving)} (${annualSavings.savingPercent}%)`
      });

      const period = calculatePeriod(key, periodStart, periodEnd);
      const periodSavings = calculateSavings(key, period.total, globalTarget);
      rows.push({
        indicator: indicator.label,
        type: "Consum del període setembre-juny",
        base: formatAmount(key, periodSavings.base),
        improved: formatAmount(key, periodSavings.improved),
        saving: `${formatAmount(key, periodSavings.saving)} (${periodSavings.savingPercent}%)`
      });
    });
    return rows;
  }

  return {
    round, getIndicator, monthLabel, shortMonthLabel, buildMonthList,
    calculatePeriod, calculateAnnualForecast, effectiveReduction, calculateCost,
    calculateEmissions, calculateSavings, formatAmount, formatPlain, formatCost,
    formatEmissions, mandatoryCalculations
  };
})();
