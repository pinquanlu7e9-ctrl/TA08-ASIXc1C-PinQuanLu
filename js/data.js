/**
 * ITB Energy Savings Calculator – Shared Data Module
 * Data extracted from ITB Leaks documents (2024 reference year)
 * Institut Tecnològic de Barcelona
 */

const ITB = {
  // ─── LABELS ────────────────────────────────────────────────────
  MESOS_CURT: ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'],
  MESOS_LLARG: ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'],

  // ─── ELECTRICITAT ──────────────────────────────────────────────
  // Source: Plant Report Solar ITB 01-2025 + extrapolació anual
  ELEC: {
    label:    'Electricitat',
    icon:     '⚡',
    unitat:   'kWh',
    preuUnit: 0.182,      // €/kWh (tarifa 2024 Barcelona)
    co2Unit:  0.233,      // kg CO₂/kWh (factor emissió xarxa espanyola 2024)
    color:    '#f59e0b',
    colorBg:  'rgba(245,158,11,0.12)',
    // Monthly consumption (kWh) – index 0 = Gener
    mensual:  [7500, 7200, 6800, 6000, 5800, 5000, 1200, 800, 5500, 6200, 7800, 5200],
    // Solar generation (kWh) – 30.94 kWp instal·lació coberta
    solar:    [350,  380,  520,  680,  740,  790,  820,  750,  480,  420,  310,  280],
    // Seasonal factors for future projection (relative to baseline)
    seasonal: [1.15, 1.10, 1.04, 0.92, 0.89, 0.77, 0.18, 0.12, 0.84, 0.95, 1.20, 0.80],
  },

  // ─── AIGUA ─────────────────────────────────────────────────────
  // Source: Factures Aigues de Barcelona Feb 2024 (consum horari 25/28/29-02-2024)
  AIGUA: {
    label:    'Aigua',
    icon:     '💧',
    unitat:   'm³',
    preuUnit: 2.50,       // €/m³ (tarifa Barcelona 2024)
    co2Unit:  0.30,       // kg CO₂/m³ (cicle integral de l'aigua)
    color:    '#0ea5e9',
    colorBg:  'rgba(14,165,233,0.12)',
    mensual:  [140, 145, 155, 160, 175, 165, 50, 30, 185, 160, 150, 120],
    seasonal: [0.86, 0.89, 0.95, 0.98, 1.07, 1.01, 0.31, 0.18, 1.13, 0.98, 0.92, 0.74],
  },

  // ─── CONSUMIBLES OFICINA ───────────────────────────────────────
  // Source: Factures Lyreco F035/F036/F327/F328 (Abr–Nov 2024)
  CONS: {
    label:    'Consumibles Oficina',
    icon:     '📄',
    unitat:   '€',
    preuUnit: 1.0,
    co2Unit:  0.50,       // kg CO₂/€ (producció paper + transport)
    color:    '#10b981',
    colorBg:  'rgba(16,185,129,0.12)',
    mensual:  [320, 270, 300, 290, 310, 320, 80, 50, 350, 280, 260, 180],
    seasonal: [1.06, 0.90, 1.00, 0.96, 1.03, 1.06, 0.27, 0.17, 1.16, 0.93, 0.86, 0.60],
  },

  // ─── PRODUCTES NETEJA ──────────────────────────────────────────
  // Source: Factures Neteges F055/F056 (Mai–Jun 2024)
  NETE: {
    label:    'Productes Neteja',
    icon:     '🧹',
    unitat:   '€',
    preuUnit: 1.0,
    co2Unit:  0.80,       // kg CO₂/€ (productes químics + embalatge)
    color:    '#a855f7',
    colorBg:  'rgba(168,85,247,0.12)',
    mensual:  [480, 500, 530, 560, 575, 750, 200, 150, 600, 550, 520, 400],
    seasonal: [0.82, 0.86, 0.91, 0.96, 0.99, 1.29, 0.34, 0.26, 1.03, 0.95, 0.89, 0.69],
  },

  // ─── HELPERS ───────────────────────────────────────────────────

  /**
   * Sum an indicator's monthly data for a given month range.
   * @param {number[]} arr   - 12-element monthly array (index 0 = Gener)
   * @param {number}   mIni  - start month 1-12
   * @param {number}   mFi   - end month 1-12
   * @returns {number}
   */
  sumPeriode(arr, mIni, mFi) {
    let total = 0;
    let m = mIni;
    const steps = ((mFi - mIni + 12) % 12) + 1;
    for (let i = 0; i < steps; i++) {
      total += arr[(m - 1 + 12) % 12];
      m = (m % 12) + 1;
    }
    return total;
  },

  /** Full calendar year (Gen–Des) */
  sumAnual(arr) { return arr.reduce((a, b) => a + b, 0); },

  /** Academic year September→June (10 months) */
  sumCurs(arr) { return this.sumPeriode(arr, 9, 6); },

  /**
   * Project future consumption applying a linear reduction factor.
   * @param {number[]} arr     - baseline monthly array
   * @param {number}   pct     - reduction percentage per year (0–100)
   * @param {number}   anys    - number of years ahead
   * @returns {number[]}       - projected 12-element array
   */
  projecta(arr, pct, anys) {
    const factor = Math.pow(1 - pct / 100, anys);
    return arr.map(v => Math.round(v * factor * 10) / 10);
  },

  /** Format number with thousands separator */
  fmt(n, decimals = 0) {
    return Number(n).toLocaleString('ca-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /** Format currency */
  fmtEur(n) { return this.fmt(n, 2) + ' €'; },

  /** Array of all 4 indicators */
  get INDICADORS() {
    return [this.ELEC, this.AIGUA, this.CONS, this.NETE];
  },

  /** Annual CO2 total (kg) */
  co2Total() {
    return (
      this.sumAnual(this.ELEC.mensual)  * this.ELEC.co2Unit  +
      this.sumAnual(this.AIGUA.mensual) * this.AIGUA.co2Unit +
      this.sumAnual(this.CONS.mensual)  * this.CONS.co2Unit  +
      this.sumAnual(this.NETE.mensual)  * this.NETE.co2Unit
    );
  },
};