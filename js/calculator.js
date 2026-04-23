/**
 * ITB Energy Savings Calculator – Calculator Module
 * Fase 3: 8 mandatory calculations + period picker + seasonal trends
 */

// ─── SEASONAL MODIFIERS ────────────────────────────────────────
// Applied on top of monthly baseline for future projection realism
const SEASONAL_LABELS = {
  elec:  'Alta hivern (calefacció) · Baixa estiu',
  aigua: 'Alta primavera/tardor (activitat) · Baixa estiu',
  cons:  'Alta mesos lectius · Baixa estiu',
  nete:  'Alta final curs (neteja profunda) · Baixa estiu',
};

// ─── CALCULATION ENGINE ─────────────────────────────────────────

/**
 * @typedef {Object} CalcResult
 * @property {string} id
 * @property {string} icon
 * @property {string} name
 * @property {string} periode    "anual" | "curs" | "custom"
 * @property {number} valor      main numeric result
 * @property {string} unitat
 * @property {number} cost       EUR cost
 * @property {number} co2        kg CO₂
 * @property {string} color
 * @property {string} colorBg
 * @property {number[]} monthly  month-by-month values (12 items for year, subset for period)
 */

const Calculator = {

  // ── 1. Consum elèctric del pròxim any ────────────────────────
  elecAny(reductionPct = 0) {
    const base = ITB.sumAnual(ITB.ELEC.mensual);
    const proj = ITB.projecta(ITB.ELEC.mensual, reductionPct, 1);
    const valor = ITB.sumAnual(proj);
    return {
      id: 'elec-any', icon: '⚡', name: 'Consum elèctric · Pròxim any',
      periode: 'anual', valor, unitat: 'kWh',
      cost: Math.round(valor * ITB.ELEC.preuUnit),
      co2:  Math.round(valor * ITB.ELEC.co2Unit),
      color: ITB.ELEC.color, colorBg: ITB.ELEC.colorBg,
      monthly: proj,
      baseValor: base,
      saving: base - valor,
    };
  },

  // ── 2. Consum elèctric del curs (set → jun) ──────────────────
  elecCurs(reductionPct = 0) {
    const proj = ITB.projecta(ITB.ELEC.mensual, reductionPct, 1);
    const monthly = [8,9,10,11,0,1,2,3,4,5].map(i => proj[i]); // Sep-Jun
    const valor = monthly.reduce((a,b)=>a+b,0);
    return {
      id: 'elec-curs', icon: '⚡', name: 'Consum elèctric · Curs lectiu (Set→Jun)',
      periode: 'curs', valor, unitat: 'kWh',
      cost: Math.round(valor * ITB.ELEC.preuUnit),
      co2:  Math.round(valor * ITB.ELEC.co2Unit),
      color: ITB.ELEC.color, colorBg: ITB.ELEC.colorBg,
      monthly,
      baseValor: ITB.sumCurs(ITB.ELEC.mensual),
      saving: ITB.sumCurs(ITB.ELEC.mensual) - valor,
    };
  },

  // ── 3. Consum d'aigua del pròxim any ─────────────────────────
  aiguaAny(reductionPct = 0) {
    const base = ITB.sumAnual(ITB.AIGUA.mensual);
    const proj = ITB.projecta(ITB.AIGUA.mensual, reductionPct, 1);
    const valor = ITB.sumAnual(proj);
    return {
      id: 'aigua-any', icon: '💧', name: 'Consum d\'aigua · Pròxim any',
      periode: 'anual', valor, unitat: 'm³',
      cost: Math.round(valor * ITB.AIGUA.preuUnit),
      co2:  Math.round(valor * ITB.AIGUA.co2Unit),
      color: ITB.AIGUA.color, colorBg: ITB.AIGUA.colorBg,
      monthly: proj,
      baseValor: base,
      saving: base - valor,
    };
  },

  // ── 4. Consum d'aigua del curs (set → jun) ───────────────────
  aiguaCurs(reductionPct = 0) {
    const proj = ITB.projecta(ITB.AIGUA.mensual, reductionPct, 1);
    const monthly = [8,9,10,11,0,1,2,3,4,5].map(i => proj[i]);
    const valor = monthly.reduce((a,b)=>a+b,0);
    return {
      id: 'aigua-curs', icon: '💧', name: 'Consum d\'aigua · Curs lectiu (Set→Jun)',
      periode: 'curs', valor, unitat: 'm³',
      cost: Math.round(valor * ITB.AIGUA.preuUnit),
      co2:  Math.round(valor * ITB.AIGUA.co2Unit),
      color: ITB.AIGUA.color, colorBg: ITB.AIGUA.colorBg,
      monthly,
      baseValor: ITB.sumCurs(ITB.AIGUA.mensual),
      saving: ITB.sumCurs(ITB.AIGUA.mensual) - valor,
    };
  },

  // ── 5. Consumibles oficina pròxim any ────────────────────────
  consAny(reductionPct = 0) {
    const base = ITB.sumAnual(ITB.CONS.mensual);
    const proj = ITB.projecta(ITB.CONS.mensual, reductionPct, 1);
    const valor = ITB.sumAnual(proj);
    return {
      id: 'cons-any', icon: '📄', name: 'Consumibles oficina · Pròxim any',
      periode: 'anual', valor, unitat: '€',
      cost: Math.round(valor),
      co2:  Math.round(valor * ITB.CONS.co2Unit),
      color: ITB.CONS.color, colorBg: ITB.CONS.colorBg,
      monthly: proj,
      baseValor: base,
      saving: base - valor,
    };
  },

  // ── 6. Consumibles oficina del curs (set → jun) ──────────────
  consCurs(reductionPct = 0) {
    const proj = ITB.projecta(ITB.CONS.mensual, reductionPct, 1);
    const monthly = [8,9,10,11,0,1,2,3,4,5].map(i => proj[i]);
    const valor = monthly.reduce((a,b)=>a+b,0);
    return {
      id: 'cons-curs', icon: '📄', name: 'Consumibles oficina · Curs lectiu (Set→Jun)',
      periode: 'curs', valor, unitat: '€',
      cost: Math.round(valor),
      co2:  Math.round(valor * ITB.CONS.co2Unit),
      color: ITB.CONS.color, colorBg: ITB.CONS.colorBg,
      monthly,
      baseValor: ITB.sumCurs(ITB.CONS.mensual),
      saving: ITB.sumCurs(ITB.CONS.mensual) - valor,
    };
  },

  // ── 7. Productes neteja pròxim any ───────────────────────────
  neteAny(reductionPct = 0) {
    const base = ITB.sumAnual(ITB.NETE.mensual);
    const proj = ITB.projecta(ITB.NETE.mensual, reductionPct, 1);
    const valor = ITB.sumAnual(proj);
    return {
      id: 'nete-any', icon: '🧹', name: 'Productes neteja · Pròxim any',
      periode: 'anual', valor, unitat: '€',
      cost: Math.round(valor),
      co2:  Math.round(valor * ITB.NETE.co2Unit),
      color: ITB.NETE.color, colorBg: ITB.NETE.colorBg,
      monthly: proj,
      baseValor: base,
      saving: base - valor,
    };
  },

  // ── 8. Productes neteja del curs (set → jun) ─────────────────
  neteCurs(reductionPct = 0) {
    const proj = ITB.projecta(ITB.NETE.mensual, reductionPct, 1);
    const monthly = [8,9,10,11,0,1,2,3,4,5].map(i => proj[i]);
    const valor = monthly.reduce((a,b)=>a+b,0);
    return {
      id: 'nete-curs', icon: '🧹', name: 'Productes neteja · Curs lectiu (Set→Jun)',
      periode: 'curs', valor, unitat: '€',
      cost: Math.round(valor),
      co2:  Math.round(valor * ITB.NETE.co2Unit),
      color: ITB.NETE.color, colorBg: ITB.NETE.colorBg,
      monthly,
      baseValor: ITB.sumCurs(ITB.NETE.mensual),
      saving: ITB.sumCurs(ITB.NETE.mensual) - valor,
    };
  },

  // ── CUSTOM PERIOD ─────────────────────────────────────────────
  custom(indicKey, mIni, mFi, reductionPct = 0) {
    const IND_MAP = { elec: ITB.ELEC, aigua: ITB.AIGUA, cons: ITB.CONS, nete: ITB.NETE };
    const IND = IND_MAP[indicKey];
    if (!IND) return null;

    const proj = ITB.projecta(IND.mensual, reductionPct, 1);
    const steps = ((mFi - mIni + 12) % 12) + 1;
    const monthly = [];
    let m = mIni;
    for (let i = 0; i < steps; i++) {
      monthly.push(proj[(m - 1 + 12) % 12]);
      m = (m % 12) + 1;
    }
    const valor = monthly.reduce((a, b) => a + b, 0);
    const periodeLabel = `${ITB.MESOS_LLARG[mIni-1]} → ${ITB.MESOS_LLARG[mFi-1]}`;
    const basePeriode = (() => {
      const bm = [];
      let bm2 = mIni;
      for (let i = 0; i < steps; i++) { bm.push(IND.mensual[(bm2-1+12)%12]); bm2=(bm2%12)+1; }
      return bm.reduce((a,b)=>a+b,0);
    })();

    return {
      id: `${indicKey}-custom`, icon: IND.icon || '📊',
      name: `${IND.label} · ${periodeLabel}`,
      periode: 'custom', valor, unitat: IND.unitat,
      cost: Math.round(valor * IND.preuUnit),
      co2:  Math.round(valor * IND.co2Unit),
      color: IND.color, colorBg: IND.colorBg,
      monthly,
      baseValor: basePeriode,
      saving: basePeriode - valor,
    };
  },

  // ── Get all 8 standard results ─────────────────────────────────
  getAll(reductionPct = 0) {
    return [
      this.elecAny(reductionPct),
      this.elecCurs(reductionPct),
      this.aiguaAny(reductionPct),
      this.aiguaCurs(reductionPct),
      this.consAny(reductionPct),
      this.consCurs(reductionPct),
      this.neteAny(reductionPct),
      this.neteCurs(reductionPct),
    ];
  },

  // ── Total CO2 for a set of results ────────────────────────────
  totalCo2(results) { return results.reduce((s, r) => s + r.co2, 0); },
  totalCost(results){ return results.reduce((s, r) => s + r.cost, 0); },
};