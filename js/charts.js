/**
 * ITB Energy Savings Calculator – Charts Module
 * Uses Chart.js 4.x (loaded via CDN)
 */

/* ── Global Chart Defaults ──────────────────────────────────── */
function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color           = '#94a3b8';
  Chart.defaults.borderColor     = '#1e2d3d';
  Chart.defaults.font.family     = "'DM Sans', sans-serif";
  Chart.defaults.font.size       = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding       = 20;
  Chart.defaults.plugins.tooltip.backgroundColor     = '#111820';
  Chart.defaults.plugins.tooltip.borderColor         = '#1e2d3d';
  Chart.defaults.plugins.tooltip.borderWidth         = 1;
  Chart.defaults.plugins.tooltip.padding             = 12;
  Chart.defaults.plugins.tooltip.titleFont           = { family: "'JetBrains Mono', monospace", size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont            = { family: "'DM Sans', sans-serif", size: 12 };
  Chart.defaults.plugins.tooltip.titleColor          = '#f8fafc';
  Chart.defaults.plugins.tooltip.bodyColor           = '#94a3b8';
}

/* ── Gradient Helper ────────────────────────────────────────── */
function makeGradient(ctx, color, alpha1 = 0.35, alpha2 = 0.0) {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 300);
  gradient.addColorStop(0, color.replace(')', `, ${alpha1})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, color.replace(')', `, ${alpha2})`).replace('rgb', 'rgba'));
  return gradient;
}

/* ── Helper to parse hex → rgb string ─────────────────────── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r}, ${g}, ${b}`;
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW CHART (index.html) – All 4 indicators, 12 months
   ═══════════════════════════════════════════════════════════════ */
let chartOverview = null;
function renderChartOverview(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartOverview) chartOverview.destroy();

  // Normalize to percentages of monthly max for multi-axis display
  const LABELS = ITB.MESOS_CURT;

  chartOverview = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: LABELS,
      datasets: [
        {
          label: '⚡ Electricitat (kWh)',
          data: ITB.ELEC.mensual,
          backgroundColor: `rgba(245,158,11,0.75)`,
          borderColor: '#f59e0b',
          borderWidth: 0,
          borderRadius: 4,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: '☀️ Solar (kWh)',
          data: ITB.ELEC.solar,
          backgroundColor: `rgba(253,224,71,0.6)`,
          borderColor: '#fde047',
          borderWidth: 0,
          borderRadius: 4,
          yAxisID: 'y',
          order: 1,
        },
        {
          label: '💧 Aigua (m³×10)',
          data: ITB.AIGUA.mensual.map(v => v * 10),
          type: 'line',
          tension: 0.4,
          fill: false,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.2)',
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 2,
          yAxisID: 'y',
          order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.dataset.label.includes('Aigua')) {
                return `  💧 Aigua: ${(ctx.parsed.y / 10).toFixed(0)} m³`;
              }
              return `  ${ctx.dataset.label}: ${ITB.fmt(ctx.parsed.y)} ${ctx.dataset.label.includes('Electricitat') || ctx.dataset.label.includes('Solar') ? 'kWh' : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#94a3b8',
            callback: v => ITB.fmt(v)
          },
          title: { display: true, text: 'kWh / m³×10', color: '#4a6075', font: { size: 11 } },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   COST CHART (index.html) – Cost breakdown per month
   ═══════════════════════════════════════════════════════════════ */
let chartCost = null;
function renderChartCost(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartCost) chartCost.destroy();

  const elecCost = ITB.ELEC.mensual.map(v => Math.round(v * ITB.ELEC.preuUnit));
  const aiguaCost = ITB.AIGUA.mensual.map(v => Math.round(v * ITB.AIGUA.preuUnit));

  chartCost = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ITB.MESOS_CURT,
      datasets: [
        { label: '⚡ Electricitat', data: elecCost, backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 4, stack: 'cost' },
        { label: '💧 Aigua',        data: aiguaCost, backgroundColor: 'rgba(14,165,233,0.75)', borderRadius: 4, stack: 'cost' },
        { label: '📄 Consumibles',  data: ITB.CONS.mensual, backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4, stack: 'cost' },
        { label: '🧹 Neteja',       data: ITB.NETE.mensual, backgroundColor: 'rgba(168,85,247,0.75)', borderRadius: 4, stack: 'cost' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label(ctx) { return `  ${ctx.dataset.label}: ${ITB.fmtEur(ctx.parsed.y)}`; },
            footer(items) {
              const total = items.reduce((s, i) => s + i.parsed.y, 0);
              return `Total: ${ITB.fmtEur(total)}`;
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
        y: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', callback: v => `${ITB.fmt(v)} €` },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   CO2 DONUT CHART (index.html)
   ═══════════════════════════════════════════════════════════════ */
let chartCo2 = null;
function renderChartCo2(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartCo2) chartCo2.destroy();

  const co2Elec = Math.round(ITB.sumAnual(ITB.ELEC.mensual) * ITB.ELEC.co2Unit);
  const co2Aigua = Math.round(ITB.sumAnual(ITB.AIGUA.mensual) * ITB.AIGUA.co2Unit);
  const co2Cons  = Math.round(ITB.sumAnual(ITB.CONS.mensual)  * ITB.CONS.co2Unit);
  const co2Nete  = Math.round(ITB.sumAnual(ITB.NETE.mensual)  * ITB.NETE.co2Unit);

  chartCo2 = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['⚡ Electricitat', '💧 Aigua', '📄 Consumibles', '🧹 Neteja'],
      datasets: [{
        data: [co2Elec, co2Aigua, co2Cons, co2Nete],
        backgroundColor: ['rgba(245,158,11,0.85)','rgba(14,165,233,0.85)','rgba(16,185,129,0.85)','rgba(168,85,247,0.85)'],
        borderColor: ['#f59e0b','#0ea5e9','#10b981','#a855f7'],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: { duration: 900, animateRotate: true, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return `  ${ctx.label}: ${ITB.fmt(ctx.parsed)} kg CO₂ (${pct}%)`;
            }
          }
        }
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   PERIOD CHART (calculadora.html) – selected date range
   ═══════════════════════════════════════════════════════════════ */
let chartPeriode = null;
function renderChartPeriode(canvasId, mIni, mFi) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartPeriode) chartPeriode.destroy();

  // Build labels and data arrays for the period
  const labels = [];
  const dataElec = [], dataAigua = [], dataCons = [], dataNete = [];
  let m = mIni;
  const steps = ((mFi - mIni + 12) % 12) + 1;
  for (let i = 0; i < steps; i++) {
    const idx = (m - 1 + 12) % 12;
    labels.push(ITB.MESOS_LLARG[idx]);
    dataElec.push(ITB.ELEC.mensual[idx]);
    dataAigua.push(ITB.AIGUA.mensual[idx]);
    dataCons.push(ITB.CONS.mensual[idx]);
    dataNete.push(ITB.NETE.mensual[idx]);
    m = (m % 12) + 1;
  }

  chartPeriode = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '⚡ Electricitat (kWh)',
          data: dataElec,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '💧 Aigua (m³×40)',
          data: dataAigua.map(v => v * 40),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 2,
          yAxisID: 'y',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 600 },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.dataset.label.includes('Aigua')) {
                return `  💧 Aigua: ${(ctx.parsed.y/40).toFixed(0)} m³`;
              }
              return `  ${ctx.dataset.label.split('(')[0].trim()}: ${ITB.fmt(ctx.parsed.y)} kWh`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', callback: v => ITB.fmt(v) },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   DAILY DATA CHART – Electricitat diari Gener 2025
   ═══════════════════════════════════════════════════════════════ */
const DADES_DIARIES = [
  {d:'01/01',c:157.47,s:42.56},{d:'02/01',c:159.55,s:48.86},{d:'03/01',c:189.50,s:36.48},
  {d:'04/01',c:201.76,s:44.18},{d:'05/01',c:199.49,s:41.99},{d:'06/01',c:191.55,s:40.55},
  {d:'07/01',c:200.19,s:53.26},{d:'08/01',c:467.60,s:47.81},{d:'09/01',c:461.78,s:52.03},
  {d:'10/01',c:425.97,s:49.33},{d:'11/01',c:201.40,s:40.03},{d:'12/01',c:214.71,s:57.00},
  {d:'13/01',c:491.00,s:55.89},{d:'14/01',c:484.29,s:57.49},{d:'15/01',c:479.75,s:55.58},
  {d:'16/01',c:490.80,s:40.94},{d:'17/01',c:430.68,s:52.90},{d:'18/01',c:198.59,s:56.17},
  {d:'19/01',c:202.16,s:35.53},{d:'20/01',c:488.39,s:32.00},{d:'21/01',c:500.34,s:30.24},
  {d:'22/01',c:165.55,s:5.87},
];

let chartDiari = null;
function renderChartDiari(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartDiari) chartDiari.destroy();

  chartDiari = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DADES_DIARIES.map(d => d.d),
      datasets: [
        {
          label: '🔌 Importat de xarxa (kWh)',
          data: DADES_DIARIES.map(d => +(d.c - d.s).toFixed(2)),
          backgroundColor: 'rgba(245,158,11,0.6)',
          borderRadius: 3,
          stack: 'consum',
        },
        {
          label: '☀️ Autoconsum solar (kWh)',
          data: DADES_DIARIES.map(d => d.s),
          backgroundColor: 'rgba(253,224,71,0.75)',
          borderRadius: 3,
          stack: 'consum',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 700 },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
        y: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', callback: v => `${v} kWh` },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   REDUCTION PROJECTION CHART (millores.html)
   ═══════════════════════════════════════════════════════════════ */
let chartReduccio = null;
function renderChartReduccio(canvasId, pctAny) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartReduccio) chartReduccio.destroy();

  const anys = [2024, 2025, 2026, 2027];

  // Baseline totals
  const base = {
    elec:  ITB.sumAnual(ITB.ELEC.mensual),
    aigua: ITB.sumAnual(ITB.AIGUA.mensual) * ITB.AIGUA.preuUnit,
    cons:  ITB.sumAnual(ITB.CONS.mensual),
    nete:  ITB.sumAnual(ITB.NETE.mensual),
  };

  function project(base, pct, yr) { return Math.round(base * Math.pow(1 - pct/100, yr)); }

  const pct = pctAny || 10; // % reduction per year
  const elecProj  = anys.map((_, i) => i === 0 ? base.elec  : project(base.elec,  pct, i));
  const aiguaProj = anys.map((_, i) => i === 0 ? base.aigua : project(base.aigua, pct, i));
  const consProj  = anys.map((_, i) => i === 0 ? base.cons  : project(base.cons,  pct, i));
  const neteProj  = anys.map((_, i) => i === 0 ? base.nete  : project(base.nete,  pct, i));

  chartReduccio = new Chart(ctx, {
    type: 'line',
    data: {
      labels: anys,
      datasets: [
        {
          label: '⚡ Electricitat (kWh)',
          data: elecProj,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          fill: true, tension: 0.35, pointRadius: 6, borderWidth: 2,
        },
        {
          label: '💧 Cost Aigua (€)',
          data: aiguaProj,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.1)',
          fill: true, tension: 0.35, pointRadius: 6, borderWidth: 2,
        },
        {
          label: '📄 Consumibles (€)',
          data: consProj,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: true, tension: 0.35, pointRadius: 6, borderWidth: 2,
        },
        {
          label: '🧹 Neteja (€)',
          data: neteProj,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.1)',
          fill: true, tension: 0.35, pointRadius: 6, borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', callback: v => ITB.fmt(v) },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   WATER HOURLY CHART (index.html)
   ═══════════════════════════════════════════════════════════════ */
const DADES_HORARIES = [200,154,125,155,152,152,152,270,275,455,435,465,390,500,445,430,395,530,445,325,170,410,325,250];

let chartAiguaHorari = null;
function renderChartAiguaHorari(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (chartAiguaHorari) chartAiguaHorari.destroy();

  const labels = Array.from({length:24}, (_,i) => `${String(i).padStart(2,'0')}:00`);

  chartAiguaHorari = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '💧 Consum horari (litres) – 28/02/2024',
        data: DADES_HORARIES,
        backgroundColor: DADES_HORARIES.map(v =>
          v > 450 ? 'rgba(239,68,68,0.7)' :
          v > 350 ? 'rgba(245,158,11,0.7)' :
          'rgba(14,165,233,0.65)'
        ),
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      plugins: {
        legend: { display: true },
        tooltip: { callbacks: { label: ctx => `  ${ctx.parsed.y} L/h` } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', callback: v => `${v} L` },
        },
      },
    },
  });
}