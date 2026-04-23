/**
 * ITB Energy Savings Calculator – Shared Script
 * Handles navigation active state, counter animations, and shared UI utilities
 */

// ── Mark active nav link ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Animate counters on page load
  animateCounters();

  // Lazy-init charts only on the page that has them
  if (typeof initChartDefaults === 'function') initChartDefaults();

  // Per-page init
  if (document.getElementById('chart-overview'))  initIndexPage();
  if (document.getElementById('calc-results'))    initCalculadoraPage();
  if (document.getElementById('timeline-wrap'))   initMilloresPage();
});

// ── Counter animation ───────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0');
    const suffix   = el.dataset.suffix || '';
    const duration = 1200;
    const start    = performance.now();

    requestAnimationFrame(function step(now) {
      const t   = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val  = target * ease;
      el.textContent = ITB.fmt(val, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    });
  });
}

// ── Scroll reveal ───────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

// ══════════════════════════════════════════════════════════════
// INDEX PAGE
// ══════════════════════════════════════════════════════════════
function initIndexPage() {
  renderChartOverview('chart-overview');
  renderChartCost('chart-cost');
  renderChartCo2('chart-co2');
  renderChartDiari('chart-diari');
  renderChartAiguaHorari('chart-aigua-horari');
}

// ══════════════════════════════════════════════════════════════
// CALCULADORA PAGE
// ══════════════════════════════════════════════════════════════
let currentResults = [];

function initCalculadoraPage() {
  // Populate month selects
  ['sel-mes-ini', 'sel-mes-fi'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    ITB.MESOS_LLARG.forEach((m, i) => {
      const opt = document.createElement('option');
      opt.value = i + 1;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  });
  const selIni = document.getElementById('sel-mes-ini');
  const selFi  = document.getElementById('sel-mes-fi');
  if (selIni) selIni.value = 9;  // default: Setembre
  if (selFi)  selFi.value  = 6;  // default: Juny

  // Render default
  calcular();

  // Wire up events
  document.getElementById('btn-calcular')?.addEventListener('click', calcular);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    document.getElementById('sel-indicador') && (document.getElementById('sel-indicador').value = 'tots');
    document.getElementById('input-reduccio') && (document.getElementById('input-reduccio').value = 0);
    if (selIni) selIni.value = 9;
    if (selFi)  selFi.value  = 6;
    updateSliderLabel(0);
    calcular();
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    Exportar.informeCalculadora(currentResults);
  });

  document.getElementById('btn-export-page')?.addEventListener('click', () => {
    Exportar.paginaActual('ITB-calculadora.pdf');
  });

  // Slider live feedback
  const slider = document.getElementById('input-reduccio');
  if (slider) {
    slider.addEventListener('input', () => updateSliderLabel(slider.value));
  }

  // Quick presets
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (p === 'any')  { if(selIni)selIni.value=1; if(selFi)selFi.value=12; }
      if (p === 'curs') { if(selIni)selIni.value=9; if(selFi)selFi.value=6;  }
      if (p === 'h1')   { if(selIni)selIni.value=12;if(selFi)selFi.value=2;  }
      if (p === 'h2')   { if(selIni)selIni.value=3; if(selFi)selFi.value=5;  }
      calcular();
    });
  });
}

function updateSliderLabel(val) {
  const lbl = document.getElementById('lbl-reduccio');
  if (lbl) lbl.textContent = `${val}%`;
}

function calcular() {
  const reduccio  = parseInt(document.getElementById('input-reduccio')?.value || 0);
  const mIni      = parseInt(document.getElementById('sel-mes-ini')?.value || 9);
  const mFi       = parseInt(document.getElementById('sel-mes-fi')?.value  || 6);
  const indicador = document.getElementById('sel-indicador')?.value || 'tots';

  updateSliderLabel(reduccio);

  // Build 8 standard results + 4 custom period results
  const std    = Calculator.getAll(reduccio);

  const customElec  = Calculator.custom('elec',  mIni, mFi, reduccio);
  const customAigua = Calculator.custom('aigua', mIni, mFi, reduccio);
  const customCons  = Calculator.custom('cons',  mIni, mFi, reduccio);
  const customNete  = Calculator.custom('nete',  mIni, mFi, reduccio);

  // Combine: 8 standard + 4 custom
  let all = [...std, customElec, customAigua, customCons, customNete];

  // Filter by indicator tab
  if (indicador !== 'tots') {
    all = all.filter(r => r.id.startsWith(indicador));
  }

  currentResults = all;
  renderCalcCards(all, reduccio);
  renderCalcSummary(all, reduccio);

  // Update period chart
  renderChartPeriode('chart-periode', mIni, mFi);
}

function renderCalcCards(results, reduccio) {
  const wrap = document.getElementById('calc-results');
  if (!wrap) return;
  wrap.innerHTML = '';

  results.forEach(r => {
    const savingPct = r.baseValor > 0 ? ((r.saving / r.baseValor) * 100).toFixed(1) : 0;
    const card = document.createElement('div');
    card.className = 'calc-card fade-up';
    card.style.setProperty('--c-color', r.color);

    card.innerHTML = `
      <div class="calc-card-head">
        <span class="calc-card-icon">${r.icon}</span>
        <span class="calc-card-type">${
          r.periode === 'anual' ? 'ANY COMPLET' :
          r.periode === 'curs'  ? 'CURS SET→JUN' : 'PERÍODE CUSTOM'
        }</span>
      </div>
      <div class="calc-card-main">
        ${ITB.fmt(r.valor, 0)} <small>${r.unitat}</small>
      </div>
      <div class="calc-card-name">${r.name}</div>
      <div class="calc-card-meta">
        <span>💰 Cost <span class="val">${ITB.fmtEur(r.cost)}</span></span>
        <span>🌿 CO₂ <span class="val">${ITB.fmt(r.co2)} kg</span></span>
      </div>
      ${reduccio > 0 ? `
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Estalvi vs línia base</span>
            <span style="color: var(--green-l); font-family: var(--font-data);">−${savingPct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" style="width:${Math.min(savingPct,100)}%; background:${r.color}"></div>
          </div>
        </div>
      ` : ''}
    `;

    wrap.appendChild(card);
  });

  // Re-observe for animation
  wrap.querySelectorAll('.fade-up').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .4s ease, transform .4s ease';
    observer.observe(el);
  });
}

function renderCalcSummary(results, reduccio) {
  const totalCost = results.reduce((s, r) => s + r.cost, 0);
  const totalCo2  = results.reduce((s, r) => s + r.co2, 0);
  const totalSave = results.filter(r => r.saving > 0).reduce((s, r) => s + r.saving * (
    r.id.startsWith('elec')  ? ITB.ELEC.preuUnit :
    r.id.startsWith('aigua') ? ITB.AIGUA.preuUnit : 1
  ), 0);

  const elTotal = document.getElementById('sum-cost');
  const elCo2   = document.getElementById('sum-co2');
  const elSave  = document.getElementById('sum-save');

  if (elTotal) elTotal.textContent = ITB.fmtEur(totalCost);
  if (elCo2)   elCo2.textContent   = `${ITB.fmt(totalCo2)} kg`;
  if (elSave && reduccio > 0) {
    elSave.textContent = `−${ITB.fmtEur(Math.round(totalSave))}`;
    elSave.style.color = 'var(--green-l)';
  } else if (elSave) {
    elSave.textContent = '—';
    elSave.style.color = 'var(--text-muted)';
  }
}

// ══════════════════════════════════════════════════════════════
// MILLORES PAGE
// ══════════════════════════════════════════════════════════════
function initMilloresPage() {
  // Build comparison table
  renderCompareTable();
  renderChartReduccio('chart-reduccio', 10);

  document.getElementById('btn-recalcular')?.addEventListener('click', () => {
    const pct = parseInt(document.getElementById('input-pct-any')?.value || 10);
    renderChartReduccio('chart-reduccio', pct);
    renderCompareTable(pct);
    renderProjectedKpis(pct);
  });

  document.getElementById('btn-export-millores')?.addEventListener('click', () => {
    Exportar.paginaActual('ITB-pla-millores.pdf');
  });

  // Initialize projected KPIs
  renderProjectedKpis(10);
}

function renderCompareTable(pct = 10) {
  const tbody = document.getElementById('compare-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const rows = [
    { ind: ITB.ELEC,  base: ITB.sumAnual(ITB.ELEC.mensual),  unitat: 'kWh', preu: ITB.ELEC.preuUnit,  co2: ITB.ELEC.co2Unit  },
    { ind: ITB.AIGUA, base: ITB.sumAnual(ITB.AIGUA.mensual), unitat: 'm³',  preu: ITB.AIGUA.preuUnit, co2: ITB.AIGUA.co2Unit },
    { ind: ITB.CONS,  base: ITB.sumAnual(ITB.CONS.mensual),  unitat: '€',   preu: 1,                  co2: ITB.CONS.co2Unit  },
    { ind: ITB.NETE,  base: ITB.sumAnual(ITB.NETE.mensual),  unitat: '€',   preu: 1,                  co2: ITB.NETE.co2Unit  },
  ];

  rows.forEach(row => {
    const any1  = Math.round(row.base * (1 - pct/100));
    const any2  = Math.round(row.base * Math.pow(1 - pct/100, 2));
    const any3  = Math.round(row.base * Math.pow(1 - pct/100, 3));
    const estalvi3 = row.base - any3;
    const pct3 = ((estalvi3 / row.base) * 100).toFixed(1);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${row.ind.icon || ''} ${row.ind.label}</strong></td>
      <td class="num">${ITB.fmt(row.base)} ${row.unitat}</td>
      <td class="num">${ITB.fmt(any1)} ${row.unitat}</td>
      <td class="num">${ITB.fmt(any2)} ${row.unitat}</td>
      <td class="num">${ITB.fmt(any3)} ${row.unitat}</td>
      <td class="red-val">−${pct3}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProjectedKpis(pct = 10) {
  const baseElec  = ITB.sumAnual(ITB.ELEC.mensual);
  const baseAigua = ITB.sumAnual(ITB.AIGUA.mensual);
  const baseCons  = ITB.sumAnual(ITB.CONS.mensual);
  const baseNete  = ITB.sumAnual(ITB.NETE.mensual);

  const factor3 = Math.pow(1 - pct / 100, 3);

  const estalviElec  = Math.round((baseElec - baseElec * factor3) * ITB.ELEC.preuUnit);
  const estalviAigua = Math.round((baseAigua - baseAigua * factor3) * ITB.AIGUA.preuUnit);
  const estalviCons  = Math.round(baseCons - baseCons * factor3);
  const estalviNete  = Math.round(baseNete - baseNete * factor3);
  const estalviTotal = estalviElec + estalviAigua + estalviCons + estalviNete;

  const baseCo2  = ITB.co2Total();
  const co2Saved = Math.round(baseCo2 * (1 - factor3));

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('kpi-estalvi-eur', ITB.fmtEur(estalviTotal));
  set('kpi-estalvi-co2', `${ITB.fmt(co2Saved)} kg`);
  set('kpi-elec-3y',  ITB.fmtEur(estalviElec));
  set('kpi-aigua-3y', ITB.fmtEur(estalviAigua));
  set('kpi-cons-3y',  ITB.fmtEur(estalviCons));
  set('kpi-nete-3y',  ITB.fmtEur(estalviNete));

  const pct3 = (1 - factor3) * 100;
  set('kpi-pct-total', `${pct3.toFixed(1)}%`);
}