/* Control principal de la interfície. */

document.addEventListener("DOMContentLoaded", () => {
  const indicatorSelect = document.querySelector("#indicatorSelect");
  const startMonthSelect = document.querySelector("#startMonthSelect");
  const endMonthSelect = document.querySelector("#endMonthSelect");
  const reductionRange = document.querySelector("#reductionRange");
  const reductionLabel = document.querySelector("#reductionLabel");
  const calculateBtn = document.querySelector("#calculateBtn");
  const printBtn = document.querySelector("#printBtn");
  const refreshTableBtn = document.querySelector("#refreshTableBtn");
  const toggleChartBtn = document.querySelector("#toggleChartBtn");
  const toast = document.querySelector("#toast");

  const state = {
    chartMode: "bar",
    appliedReduction: 30,
    last: null
  };

  initRevealAnimations();
  renderIndicatorOptions();
  renderMonthOptions();
  renderIndicatorCards();
  renderActions();
  renderTimeline();
  renderMandatoryTable(30);
  updateDashboard({ silent: true });

  [indicatorSelect, startMonthSelect, endMonthSelect, reductionRange].forEach(control => {
    control.addEventListener("input", markDirty);
    control.addEventListener("change", markDirty);
  });

  calculateBtn.addEventListener("click", () => updateDashboard({ silent: false }));
  refreshTableBtn.addEventListener("click", () => {
    renderMandatoryTable(Number(reductionRange.value));
    showToast("Taula actualitzada amb l'escenari seleccionat.");
  });
  toggleChartBtn.addEventListener("click", () => {
    state.chartMode = state.chartMode === "bar" ? "line" : "bar";
    toggleChartBtn.textContent = state.chartMode === "bar" ? "Canviar gràfic" : "Veure barres";
    if (state.last) drawMainChart(state.last.key, state.last.annual.months, state.last.annual.values);
  });
  printBtn.addEventListener("click", () => window.print());
  window.addEventListener("resize", debounce(() => {
    if (!state.last) return;
    drawMainChart(state.last.key, state.last.annual.months, state.last.annual.values);
    drawCompareChart(state.last.key, state.last.annualSavings.base, state.last.annualSavings.improved);
  }, 180));

  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  function renderIndicatorOptions() {
    Object.entries(TA08_DATA.indicators).forEach(([key, indicator]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = indicator.label;
      indicatorSelect.appendChild(option);
    });
  }

  function renderMonthOptions() {
    const months = TA08Calc.buildMonthList("2024-01", "2026-12");
    [startMonthSelect, endMonthSelect].forEach(select => {
      select.innerHTML = months.map(month => `<option value="${month}">${TA08Calc.monthLabel(month)}</option>`).join("");
    });
    startMonthSelect.value = "2024-09";
    endMonthSelect.value = "2025-06";
  }

  function renderIndicatorCards() {
    const container = document.querySelector("#indicatorCards");
    container.innerHTML = "";
    Object.entries(TA08_DATA.indicators).forEach(([key, indicator]) => {
      const total = indicator.values.reduce((sum, value) => sum + value, 0);
      const card = document.createElement("article");
      card.className = "indicator-card";
      card.innerHTML = `
        <div class="indicator-icon">${indicator.icon}</div>
        <h3>${indicator.label}</h3>
        <p>${indicator.description}</p>
        <div class="metric-line">
          <span>Total base anual</span>
          <strong>${TA08Calc.formatAmount(key, total)}</strong>
        </div>
        <div class="source-line">Fiabilitat: <strong>${indicator.reliability}</strong><br>Font: ${indicator.source}</div>
      `;
      container.appendChild(card);
    });
  }

  function renderActions() {
    const container = document.querySelector("#actionsGrid");
    container.innerHTML = "";
    Object.entries(TA08_DATA.indicators).forEach(([, indicator], index) => {
      const details = document.createElement("details");
      details.className = "actions-card";
      if (index === 0) details.open = true;
      const actions = indicator.actions.map(action => `<li>${action}</li>`).join("");
      details.innerHTML = `
        <summary>${indicator.icon} ${indicator.label}</summary>
        <div class="accordion-body">
          <p><strong>Indicador de seguiment:</strong> ${indicator.kpi}</p>
          <p><strong>Economia circular:</strong> ${indicator.circularity}</p>
          <ul>${actions}</ul>
          <span class="indicator-pill">Reducció tècnica base: ${Math.round(indicator.reductionTarget * 100)}%</span>
        </div>
      `;
      container.appendChild(details);
    });
  }

  function renderTimeline() {
    const container = document.querySelector("#timeline");
    container.innerHTML = "";
    TA08_DATA.reductionPlan.forEach(item => {
      const card = document.createElement("article");
      card.className = "timeline-card";
      card.dataset.year = item.year;
      card.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <strong>Objectiu acumulat: ${item.target}%</strong>
        <p><small>KPI: ${item.kpis.join(" · ")}</small></p>
      `;
      container.appendChild(card);
    });
    document.querySelector("#technicalConclusion").textContent =
      "La combinació d'estalvi energètic, control d'aigua, reducció de consumibles i compra circular permet aproximar-se al 30% de reducció acumulada. La calculadora ho quantifica amb consum, cost i emissions equivalents, i serveix com a base per validar la realitat del centre en la Fase 4.";
  }

  function renderMandatoryTable(globalTarget) {
    const tbody = document.querySelector("#mandatoryTable");
    tbody.innerHTML = TA08Calc.mandatoryCalculations(globalTarget).map(row => `
      <tr>
        <td><strong>${row.indicator}</strong></td>
        <td>${row.type}</td>
        <td>${row.base}</td>
        <td>${row.improved}</td>
        <td>${row.saving}</td>
      </tr>
    `).join("");
    document.querySelector("#tableScenario").textContent = `Escenari actual: ${globalTarget}%`;
  }

  function updateDashboard({ silent = false } = {}) {
    const key = indicatorSelect.value || "electricitat";
    let start = startMonthSelect.value;
    let end = endMonthSelect.value;
    const globalTarget = Number(reductionRange.value);

    if (start > end) {
      [start, end] = [end, start];
      startMonthSelect.value = start;
      endMonthSelect.value = end;
    }

    const indicator = TA08Calc.getIndicator(key);
    const period = TA08Calc.calculatePeriod(key, start, end);
    const annual = TA08Calc.calculateAnnualForecast(key, 2025);
    const periodSavings = TA08Calc.calculateSavings(key, period.total, globalTarget);
    const annualSavings = TA08Calc.calculateSavings(key, annual.total, globalTarget);
    const periodEmissions = TA08Calc.calculateEmissions(key, period.total);
    const periodCost = TA08Calc.calculateCost(key, period.total);
    const annualCost = TA08Calc.calculateCost(key, annual.total);
    const improvedAnnualCost = TA08Calc.calculateCost(key, annualSavings.improved);
    const moneySaving = annualCost - improvedAnnualCost;

    state.appliedReduction = globalTarget;
    state.last = { key, period, annual, periodSavings, annualSavings };

    updateHeroTarget(globalTarget);
    updateStatus(false);

    setResult("#periodConsumption", period.total, value => TA08Calc.formatAmount(key, value));
    document.querySelector("#periodCost").textContent = `Cost aproximat: ${TA08Calc.formatCost(periodCost)}`;
    setResult("#annualForecast", annual.total, value => TA08Calc.formatAmount(key, value));
    document.querySelector("#annualCost").textContent = `Cost anual: ${TA08Calc.formatCost(annualCost)}`;
    setResult("#periodEmissions", periodEmissions, value => TA08Calc.formatEmissions(value));
    setResult("#improvedForecast", annualSavings.improved, value => TA08Calc.formatAmount(key, value));
    document.querySelector("#savingAmount").textContent = `Estalvi anual: ${TA08Calc.formatAmount(key, annualSavings.saving)} (${annualSavings.savingPercent}%)`;

    document.querySelector("#chartDescription").textContent =
      `${indicator.label}: previsió mensual amb tendència, variabilitat i calendari lectiu.`;
    document.querySelector("#monthsCount").textContent = `${period.months.length} mesos`;
    document.querySelector("#annualMoneySaving").textContent = TA08Calc.formatCost(moneySaving);
    document.querySelector("#activeScenario").textContent = `Escenari aplicat: ${globalTarget}% de reducció global acumulada.`;
    document.querySelector("#targetProgressText").textContent = `${globalTarget} / 30%`;
    document.querySelector("#targetProgress").style.width = `${Math.min(100, (globalTarget / 30) * 100)}%`;
    document.querySelector("#resultReading").textContent =
      `Per a ${indicator.label.toLowerCase()}, el consum anual previst és ${TA08Calc.formatAmount(key, annual.total)}. Amb l'escenari del ${globalTarget}%, el resultat millorat baixa a ${TA08Calc.formatAmount(key, annualSavings.improved)}, amb un estalvi estimat de ${TA08Calc.formatAmount(key, annualSavings.saving)} i ${TA08Calc.formatCost(moneySaving)} anuals.`;
    renderScenarioTags(indicator, annualSavings, globalTarget);

    drawMainChart(key, annual.months, annual.values);
    drawCompareChart(key, annualSavings.base, annualSavings.improved);

    if (!silent) showToast("Càlcul actualitzat correctament.");
  }

  function renderScenarioTags(indicator, savings, target) {
    const container = document.querySelector("#scenarioTags");
    container.innerHTML = `
      <span>Objectiu global: ${target}%</span>
      <span>Reducció aplicada: ${savings.savingPercent}%</span>
      <span>Fiabilitat: ${indicator.reliability}</span>
    `;
  }

  function setResult(selector, value, formatter) {
    const element = document.querySelector(selector);
    const previous = Number(element.dataset.raw || value);
    animateValue(element, previous, value, formatter);
    element.dataset.raw = value;
    element.closest(".result-card")?.classList.add("updated");
    window.setTimeout(() => element.closest(".result-card")?.classList.remove("updated"), 700);
  }

  function animateValue(element, from, to, formatter) {
    const duration = 600;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      element.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = formatter(to);
    }
    requestAnimationFrame(frame);
  }

  function markDirty() {
    reductionLabel.textContent = `${reductionRange.value}%`;
    updateHeroTarget(Number(reductionRange.value));
    updateStatus(true);
  }

  function updateStatus(isDirty) {
    const badge = document.querySelector("#dirtyBadge");
    badge.className = `status-badge ${isDirty ? "dirty" : "clean"}`;
    badge.textContent = isDirty ? "Canvis pendents: prem Calcular" : "Resultats actualitzats";
    calculateBtn.classList.toggle("dirty", isDirty);
  }

  function updateHeroTarget(target) {
    document.querySelector("#globalReductionHero").textContent = `${target}%`;
    document.querySelector("#heroMeterFill").style.width = `${Math.min(100, (target / 40) * 100)}%`;
    document.querySelector("#heroMeterText").textContent = target >= 30 ? "Escenari suficient per arribar a l'objectiu" : "Escenari per sota de l'objectiu del 30%";
  }

  function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabName));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${tabName}`));
    if (state.last) {
      window.setTimeout(() => {
        drawMainChart(state.last.key, state.last.annual.months, state.last.annual.values);
        drawCompareChart(state.last.key, state.last.annualSavings.base, state.last.annualSavings.improved);
      }, 50);
    }
  }

  function drawMainChart(indicatorKey, labels, values) {
    const canvas = document.querySelector("#mainChart");
    const ctx = prepareCanvas(canvas);
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const padding = { top: 34, right: 28, bottom: 72, left: 78 };
    clearCanvas(ctx, width, height);

    const maxValue = Math.max(...values) * 1.16;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    drawAxes(ctx, padding, width, height, maxValue);

    if (state.chartMode === "bar") {
      const barGap = Math.max(8, chartWidth / values.length * .16);
      const barWidth = chartWidth / values.length - barGap;
      values.forEach((value, index) => {
        const x = padding.left + index * (barWidth + barGap) + barGap / 2;
        const barHeight = (value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);
        gradient.addColorStop(0, "#177245");
        gradient.addColorStop(1, "#9ad9b4");
        ctx.fillStyle = gradient;
        roundRect(ctx, x, y, barWidth, barHeight, 8);
        ctx.fill();
        drawRotatedLabel(ctx, TA08Calc.shortMonthLabel(labels[index]), x + barWidth / 2, height - 38);
      });
    } else {
      ctx.strokeStyle = "#177245";
      ctx.lineWidth = 4;
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth / (values.length - 1)) * index;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth / (values.length - 1)) * index;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        ctx.fillStyle = "#177245";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        drawRotatedLabel(ctx, TA08Calc.shortMonthLabel(labels[index]), x, height - 38);
      });
    }

    const indicator = TA08Calc.getIndicator(indicatorKey);
    ctx.fillStyle = "#102033";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Previsió mensual · ${indicator.label}`, padding.left, 24);
  }

  function drawCompareChart(indicatorKey, baseValue, improvedValue) {
    const canvas = document.querySelector("#compareChart");
    const ctx = prepareCanvas(canvas);
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const padding = { top: 48, right: 34, bottom: 66, left: 76 };
    clearCanvas(ctx, width, height);

    const maxValue = Math.max(baseValue, improvedValue) * 1.2;
    const chartHeight = height - padding.top - padding.bottom;
    const baseline = padding.top + chartHeight;
    const bars = [
      { label: "Base", value: baseValue, color: "#235b89" },
      { label: "Millorat", value: improvedValue, color: "#177245" }
    ];
    drawAxes(ctx, padding, width, height, maxValue);

    const barWidth = Math.min(110, (width - padding.left - padding.right) / 4.3);
    bars.forEach((bar, index) => {
      const x = padding.left + (width - padding.left - padding.right) * (index === 0 ? .24 : .64) - barWidth / 2;
      const barHeight = (bar.value / maxValue) * chartHeight;
      const y = baseline - barHeight;
      ctx.fillStyle = bar.color;
      roundRect(ctx, x, y, barWidth, barHeight, 12);
      ctx.fill();
      ctx.fillStyle = "#102033";
      ctx.font = "700 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(bar.label, x + barWidth / 2, baseline + 30);
      ctx.fillStyle = "#5f7082";
      ctx.font = "12px system-ui";
      ctx.fillText(TA08Calc.formatAmount(indicatorKey, bar.value), x + barWidth / 2, y - 10);
    });

    ctx.fillStyle = "#102033";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Abans i després", padding.left, 28);
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(260, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  function drawAxes(ctx, padding, width, height, maxValue) {
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;
    const baseline = padding.top + chartHeight;
    ctx.strokeStyle = "#dce7ef";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      const labelValue = maxValue - (maxValue / 4) * i;
      ctx.fillStyle = "#5f7082";
      ctx.font = "12px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(labelValue).toLocaleString("ca-ES"), padding.left - 10, y + 4);
    }
    ctx.strokeStyle = "#9aa8b5";
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, baseline);
    ctx.lineTo(width - padding.right, baseline);
    ctx.stroke();
  }

  function drawRotatedLabel(ctx, text, x, y) {
    ctx.fillStyle = "#5f7082";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2100);
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    items.forEach(item => observer.observe(item));
  }

  function debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }
});
